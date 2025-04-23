import type { DBType } from '../db';
import {
	fileTable,
	account,
	bill,
	budget,
	category,
	tag,
	label,
	autoImportTable,
	report,
	reportElement,
	user
} from '../postgres/schema';
import {
	and,
	count as drizzleCount,
	eq,
	desc,
	getTableColumns,
	isNull,
	or,
	isNotNull
} from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { fileFilterToQuery, fileFilterToText } from './helpers/file/fileFilterToQuery';
import { fileToOrderByToSQL } from './helpers/file/fileOrderByToSQL';
import {
	createFileSchema,
	type CreateFileSchemaType,
	type FileFilterSchemaType,
	type FileFilterSchemaWithoutPaginationType,
	type UpdateFileSchemaType
} from '$lib/schema/fileSchema';
import type { FileTypeType } from '$lib/schema/enum/fileTypeEnum';
import { fileFileHandler } from '$lib/server/files/fileHandler';
import sharp from 'sharp';
import {
	fileRelationshipKeys,
	type CreateFileNoteRelationshipSchemaType,
	type KeysOfCreateFileNoteRelationshipSchemaType
} from '$lib/schema/helpers/fileNoteRelationship';
import { tActions } from './tActions';
import { filterNullUndefinedAndDuplicates } from '$lib/helpers/filterNullUndefinedAndDuplicates';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { materializedViewActions } from './materializedViewActions';
import { UnableToCheckDirectoryExistence } from '@flystorage/file-storage';
import { logging } from '$lib/server/logging';
import { dbExecuteLogger } from '../dbLogger';

type GroupingOptions =
	| 'transaction'
	| 'account'
	| 'bill'
	| 'budget'
	| 'category'
	| 'tag'
	| 'label'
	| 'autoImport'
	| 'report'
	| 'reportElement';

export const fileActions = {
	getById: async (db: DBType, id: string) => {
		return dbExecuteLogger(
			db.query.fileTable.findFirst({ where: ({ id: fileId }, { eq }) => eq(fileId, id) }),
			'File - Get By ID'
		);
	},
	filterToText: async ({ db, filter }: { db: DBType; filter: FileFilterSchemaType }) => {
		return fileFilterToText({ db, filter });
	},
	list: async ({ db, filter }: { db: DBType; filter: FileFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = fileFilterToQuery(restFilter);
		const orderBySQL = fileToOrderByToSQL({ orderBy });

		const results = await dbExecuteLogger(
			db
				.select({
					...getTableColumns(fileTable),
					accountTitle: account.title,
					billTitle: bill.title,
					budgetTitle: budget.title,
					categoryTitle: category.title,
					tagTitle: tag.title,
					labelTitle: label.title,
					autoImportTitle: autoImportTable.title,
					reportTitle: report.title,
					reportElementTitle: reportElement.title,
					createdBy: user.username
				})
				.from(fileTable)
				.leftJoin(account, eq(account.id, fileTable.accountId))
				.leftJoin(bill, eq(bill.id, fileTable.billId))
				.leftJoin(budget, eq(budget.id, fileTable.budgetId))
				.leftJoin(category, eq(category.id, fileTable.categoryId))
				.leftJoin(tag, eq(tag.id, fileTable.tagId))
				.leftJoin(label, eq(label.id, fileTable.labelId))
				.leftJoin(autoImportTable, eq(autoImportTable.id, fileTable.autoImportId))
				.leftJoin(report, eq(report.id, fileTable.reportId))
				.leftJoin(reportElement, eq(reportElement.id, fileTable.reportElementId))
				.leftJoin(user, eq(user.id, fileTable.createdById))
				.where(and(...where))
				.limit(pageSize)
				.offset(page * pageSize)
				.orderBy(...orderBySQL),
			'File - List - Get Files'
		);

		const transactionIdArray = filterNullUndefinedAndDuplicates(
			results.map((a) => a.transactionId)
		);

		const journalInformation =
			transactionIdArray.length > 0
				? await tActions.journalView.list({
						db,
						filter: {
							transactionIdArray,
							pageSize: 100000,
							page: 0
						}
					})
				: undefined;

		const resultsWithJournals = results.map((result) => {
			const journals = journalInformation
				? journalInformation.data.filter((a) => a.transactionId === result.transactionId)
				: [];
			return {
				...result,
				journals
			};
		});

		const resultCount = await dbExecuteLogger(
			db
				.select({ count: drizzleCount(fileTable.id) })
				.from(fileTable)
				.where(and(...where)),
			'File - List - Get Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: resultsWithJournals, pageCount, page, pageSize };
	},
	listWithoutPagination: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: FileFilterSchemaWithoutPaginationType;
	}) => {
		return (
			await fileActions.list({
				db,
				filter: {
					...filter,
					page: 0,
					pageSize: 1000000,
					orderBy: [{ field: 'createdAt', direction: 'desc' }]
				}
			})
		).data;
	},
	listGrouped: async ({
		db,
		ids,
		grouping
	}: {
		db: DBType;
		ids: string[];
		grouping: GroupingOptions;
	}): Promise<Record<string, GroupedFilesType>> => {
		const items = await db
			.select({
				id: fileTable.id,
				title: fileTable.title,
				type: fileTable.type,
				filename: fileTable.filename,
				originalFilename: fileTable.originalFilename,
				thumbnailFilename: fileTable.thumbnailFilename,
				createdAt: fileTable.createdAt,
				updatedAt: fileTable.updatedAt,
				createdById: fileTable.createdById,
				createdBy: user.username,
				groupingId: fileTable[`${grouping}Id`]
			})
			.from(fileTable)
			.leftJoin(user, eq(user.id, fileTable.createdById))
			.where(inArrayWrapped(fileTable[`${grouping}Id`], ids))
			.orderBy(desc(fileTable.createdAt));

		const groupedItems = items.reduce(
			(acc, item) => {
				if (!item.groupingId) return acc;
				const groupingId = item.groupingId;
				if (!acc[groupingId]) {
					acc[groupingId] = [];
				}
				acc[groupingId].push(item);
				return acc;
			},
			{} as Record<string, typeof items>
		);

		return groupedItems;
	},
	addFilesToSingleItem: async <T extends { id: string }>({
		db,
		item,
		grouping
	}: {
		db: DBType;
		item: T;
		grouping: GroupingOptions;
	}) => {
		const ids = [item.id];
		const groupedFiles = await fileActions.listGrouped({
			db,
			ids,
			grouping
		});

		return {
			...item,
			files: groupedFiles[item.id] || []
		};
	},
	addFilesToItems: async <T extends { id: string }>({
		db,
		data,
		grouping
	}: {
		db: DBType;
		data: { count: number; data: T[]; page: number; pageSize: number; pageCount: number };
		grouping: GroupingOptions;
	}) => {
		const ids = data.data.map((a) => a.id);
		const groupedFiles = await fileActions.listGrouped({
			db,
			ids,
			grouping
		});

		return {
			...data,
			data: data.data.map((a) => {
				const files = groupedFiles[a.id] || [];
				return {
					...a,
					files
				};
			})
		};
	},
	create: async ({
		db,
		file,
		creationUserId
	}: {
		db: DBType;
		file: CreateFileSchemaType;
		creationUserId: string;
	}) => {
		const result = createFileSchema.safeParse(file);

		if (!result.success) {
			throw new Error('Invalid input');
		}

		const id = nanoid();
		const linked = Boolean(
			result.data.accountId ||
				result.data.billId ||
				result.data.budgetId ||
				result.data.categoryId ||
				result.data.tagId ||
				result.data.labelId ||
				result.data.autoImportId ||
				result.data.reportId ||
				result.data.reportElementId
		);

		const { file: fileData, ...restData } = result.data;

		const originalFilename = fileData.name;
		const filename = `${id}-${originalFilename}`;
		const thumbnailFilename = `${id}-thumbnail-${originalFilename}`;
		const size = fileData.size;

		const fileIsPDF = fileData.type === 'application/pdf';
		const fileIsJPG = fileData.type === 'image/jpeg';
		const fileIsPNG = fileData.type === 'image/png';
		const fileIsWEBP = fileData.type === 'image/webp';
		const fileIsGIF = fileData.type === 'image/gif';
		const fileIsTIFF = fileData.type === 'image/tiff';
		const fileIsAVIF = fileData.type === 'image/avif';
		const fileIsSVG = fileData.type === 'image/svg+xml';
		const fileIsImage =
			fileIsJPG || fileIsPNG || fileIsWEBP || fileIsGIF || fileIsTIFF || fileIsAVIF || fileIsSVG;
		const type: FileTypeType = fileIsPDF
			? 'pdf'
			: fileIsJPG
				? 'jpg'
				: fileIsPNG
					? 'png'
					: fileIsWEBP
						? 'webp'
						: fileIsGIF
							? 'gif'
							: fileIsTIFF
								? 'tiff'
								: fileIsAVIF
									? 'avif'
									: fileIsSVG
										? 'svg'
										: 'other';

		const fileContents = Buffer.from(await fileData.arrayBuffer());

		const thumbnail = fileIsImage ? await sharp(fileContents).resize(400).toBuffer() : undefined;

		await fileFileHandler.write(filename, fileContents);
		if (thumbnail) {
			await fileFileHandler.write(thumbnailFilename, thumbnail);
		}

		const title = restData.title || originalFilename;

		type InsertFile = typeof fileTable.$inferInsert;
		const createData: InsertFile = {
			...restData,
			id,
			createdById: creationUserId,
			originalFilename,
			filename,
			thumbnailFilename: fileIsImage ? thumbnailFilename : null,
			title,
			size,
			type,
			fileExists: true,
			linked,
			...updatedTime()
		};

		await dbExecuteLogger(db.insert(fileTable).values(createData), 'File - Create');
		await materializedViewActions.setRefreshRequired(db);
	},
	updateLinked: async ({ db }: { db: DBType }) => {
		await dbExecuteLogger(
			db
				.update(fileTable)
				.set({ linked: false })
				.where(
					and(
						eq(fileTable.linked, true),
						...fileRelationshipKeys.map((key) =>
							isNull(fileTable[key as unknown as KeysOfCreateFileNoteRelationshipSchemaType])
						)
					)
				),
			'File - Update Linked - False'
		);

		await dbExecuteLogger(
			db
				.update(fileTable)
				.set({ linked: true })
				.where(
					and(
						eq(fileTable.linked, false),
						or(
							...fileRelationshipKeys.map((key) =>
								isNotNull(fileTable[key as unknown as KeysOfCreateFileNoteRelationshipSchemaType])
							)
						)
					)
				),
			'File - Update Linked - True'
		);

		await materializedViewActions.setRefreshRequired(db);
	},
	updateMany: async ({
		db,
		filter,
		update
	}: {
		db: DBType;
		filter: FileFilterSchemaWithoutPaginationType;
		update: UpdateFileSchemaType;
	}) => {
		const { id, ...restUpdate } = update;
		const where = fileFilterToQuery(filter);

		await dbExecuteLogger(
			db
				.update(fileTable)
				.set({
					...restUpdate,
					...updatedTime()
				})
				.where(and(...where)),
			'File - Update Many'
		);

		await fileActions.updateLinked({ db });

		await materializedViewActions.setRefreshRequired(db);
	},
	deleteMany: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: FileFilterSchemaWithoutPaginationType;
	}) => {
		const files = await fileActions.listWithoutPagination({ db, filter });

		await Promise.all(
			files.map(async (currentFile) => {
				currentFile.filename && (await fileFileHandler.deleteFile(currentFile.filename));
				currentFile.thumbnailFilename &&
					(await fileFileHandler.deleteFile(currentFile.thumbnailFilename));

				await dbExecuteLogger(
					db.delete(fileTable).where(eq(fileTable.id, currentFile.id)),
					'File - Delete Many'
				);
			})
		);

		await materializedViewActions.setRefreshRequired(db);
	},
	getFile: async ({ db, id }: { db: DBType; id: string }) => {
		const file = await dbExecuteLogger(
			db.select().from(fileTable).where(eq(fileTable.id, id)),
			'File - Get File'
		);

		if (!file.length) {
			throw new Error('File not found');
		}

		const fileData = fileFileHandler.readToBuffer(file[0].filename);

		return {
			fileData,
			info: file[0]
		};
	},
	getThumbnail: async ({ db, id }: { db: DBType; id: string }) => {
		const file = await dbExecuteLogger(
			db.select().from(fileTable).where(eq(fileTable.id, id)),
			'File - Get Thumbnail'
		);

		if (!file.length) {
			throw new Error('File not found');
		}

		const targetFile = file[0];

		if (!targetFile.thumbnailFilename) {
			throw new Error('No thumbnail');
		}

		const fileData = fileFileHandler.readToBuffer(targetFile.thumbnailFilename);

		return {
			fileData,
			info: file[0]
		};
	},
	getLinkedText: async ({
		db,
		items
	}: {
		db: DBType;
		items: CreateFileNoteRelationshipSchemaType;
	}) => {
		const accountTitle = items.accountId
			? await tActions.account.getById(db, items.accountId)
			: undefined;
		const billTitle = items.billId ? await tActions.bill.getById(db, items.billId) : undefined;
		const budgetTitle = items.budgetId
			? await tActions.budget.getById(db, items.budgetId)
			: undefined;
		const categoryTitle = items.categoryId
			? await tActions.category.getById(db, items.categoryId)
			: undefined;
		const tagTitle = items.tagId ? await tActions.tag.getById(db, items.tagId) : undefined;
		const labelTitle = items.labelId ? await tActions.label.getById(db, items.labelId) : undefined;
		const autoImportTitle = items.autoImportId
			? await tActions.autoImport.getById({ db, id: items.autoImportId })
			: undefined;
		const reportTitle = items.reportId
			? await tActions.report.getSimpleReportConfig({ db, id: items.reportId })
			: undefined;
		const reportElementTitle = items.reportElementId
			? await tActions.report.reportElement.get({ db, id: items.reportElementId })
			: undefined;

		const data = {
			accountTitle: accountTitle
				? { description: 'Account', title: accountTitle.title }
				: undefined,
			billTitle: billTitle ? { description: 'Bill', title: billTitle.title } : undefined,
			budgetTitle: budgetTitle ? { description: 'Budget', title: budgetTitle.title } : undefined,
			categoryTitle: categoryTitle
				? { description: 'Category', title: categoryTitle.title }
				: undefined,
			tagTitle: tagTitle ? { description: 'Tag', title: tagTitle.title } : undefined,
			labelTitle: labelTitle ? { description: 'Label', title: labelTitle.title } : undefined,
			autoImportTitle: autoImportTitle
				? { description: 'Auto Import', title: autoImportTitle.title }
				: undefined,
			reportTitle: reportTitle ? { description: 'Report', title: reportTitle.title } : undefined,
			reportElementTitle: reportElementTitle
				? { description: 'Report Element', title: reportElementTitle.title }
				: undefined
		};

		return {
			data,
			text: filterNullUndefinedAndDuplicates(
				Object.keys(data).map((key) => {
					const item = data[key as keyof typeof data];
					if (!item) return undefined;
					return `${item.description} - ${item.title}`;
				})
			).join(', ')
		};
	},
	checkFilesExist: async ({ db }: { db: DBType }) => {
		const dbFiles = await dbExecuteLogger(
			db
				.select({
					id: fileTable.id,
					filename: fileTable.filename,
					thumbnailFilename: fileTable.thumbnailFilename,
					fileExists: fileTable.fileExists
				})
				.from(fileTable),
			'File - Check Files Exist'
		);

		let storedFiles: string[] = [];

		try {
			const listing = fileFileHandler.list('.', { deep: false });

			for await (const entry of listing) {
				if (entry.type === 'file' || entry.isFile) {
					storedFiles.push(entry.path);
				}
			}
		} catch (err) {
			if (err instanceof UnableToCheckDirectoryExistence) {
				logging.error('Unable to check directory existence');
			}
		}

		await Promise.all(
			dbFiles.map(async (dbFile) => {
				if (!storedFiles.includes(dbFile.filename)) {
					await dbExecuteLogger(
						db
							.update(fileTable)
							.set({ fileExists: false, ...updatedTime() })
							.where(eq(fileTable.id, dbFile.id)),
						'File - Check Files Exist - Update File Exists'
					);
				}
				if (dbFile.thumbnailFilename && !storedFiles.includes(dbFile.thumbnailFilename)) {
					await dbExecuteLogger(
						db
							.update(fileTable)
							.set({ thumbnailFilename: null, ...updatedTime() })
							.where(eq(fileTable.id, dbFile.id)),
						'File - Check Files Exist - Update Thumbnail'
					);
				}
			})
		);
	}
};

export type GroupedFilesType = {
	id: string;
	title: string | null;
	type: 'pdf' | 'jpg' | 'png' | 'webp' | 'gif' | 'avif' | 'tiff' | 'svg' | 'other';
	filename: string;
	originalFilename: string;
	thumbnailFilename: string | null;
	createdAt: Date;
	updatedAt: Date;
	createdById: string;
	createdBy: string | null;
	groupingId: string | null;
}[];
