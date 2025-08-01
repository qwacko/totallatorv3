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
	user,
	type FileTableType,
	associatedInfoTable
} from '@totallator/database';
import { and, count as drizzleCount, eq, desc, getTableColumns } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { fileFilterToQuery, fileFilterToText } from './helpers/file/fileFilterToQuery';
import { fileToOrderByToSQL } from './helpers/file/fileOrderByToSQL';
import {
	createFileSchema,
	type CreateFileSchemaCoreType,
	type FileFilterSchemaType,
	type FileFilterSchemaWithoutPaginationType,
	type UpdateFileSchemaType
} from '@totallator/shared';
import type { FileTypeType } from '@totallator/shared';
import { fileFileHandler } from '../server/files/fileHandler';
import sharp from 'sharp';
import { filterNullUndefinedAndDuplicates } from '../helpers/filterNullUndefinedAndDuplicates';
import { inArrayWrapped } from './helpers/misc/inArrayWrapped';
import { materializedViewActions } from './materializedViewActions';
import { UnableToCheckDirectoryExistence } from '@flystorage/file-storage';
import { getLogger } from '@/logger';
import { dbExecuteLogger } from '@/server/db/dbLogger';
import type { FilesAndNotesActions } from './helpers/file/FilesAndNotesActions';
import { associatedInfoActions } from './associatedInfoActions';
import { journalMaterializedViewActions } from './journalMaterializedViewActions';
import { accountActions } from './accountActions';
import { billActions } from './billActions';
import { budgetActions } from './budgetActions';
import { categoryActions } from './categoryActions';
import { tagActions } from './tagActions';
import { labelActions } from './labelActions';
import { autoImportActions } from './autoImportActions';
import { reportActions } from './reportActions';
import { getContextDB } from '@totallator/context';

type FilesActionsType = FilesAndNotesActions<
	FileTableType,
	CreateFileSchemaCoreType,
	UpdateFileSchemaType,
	FileFilterSchemaType,
	FileFilterSchemaWithoutPaginationType,
	GroupedFilesType,
	{
		files: GroupedFilesType;
	}
>;

type GetFileFunction = (data: {
	id: string;
}) => Promise<{ info: FileTableType; fileData: Promise<Buffer<ArrayBufferLike>> }>;

type CheckFilesExistFunction = () => Promise<void>;
type UpdateLinkedFunction = () => Promise<void>;

export const fileActions: FilesActionsType & {
	getFile: GetFileFunction;
	getThumbnail: GetFileFunction;
	checkFilesExist: CheckFilesExistFunction;
	updateLinked: UpdateLinkedFunction;
} = {
	getById: async (id) => {
		const db = getContextDB();
		return dbExecuteLogger(
			db.query.fileTable.findFirst({ where: ({ id: fileId }, { eq }) => eq(fileId, id) }),
			'File - Get By ID'
		);
	},
	filterToText: async ({ filter }) => {
		const db = getContextDB();
		return fileFilterToText({ db, filter });
	},
	list: async ({ filter }) => {
		const db = getContextDB();
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = fileFilterToQuery(restFilter);
		const orderBySQL = fileToOrderByToSQL({ orderBy });

		//Get the table columns but exclude the duplicated ones.
		const { id, createdAt, updatedAt, ...associatedTableColumns } =
			getTableColumns(associatedInfoTable);

		const results = await dbExecuteLogger(
			db
				.select({
					...getTableColumns(fileTable),
					...associatedTableColumns,
					associatedInfoCreatedAt: associatedInfoTable.createdAt,
					associatedInfoUpdatedAt: associatedInfoTable.updatedAt,
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
				.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, fileTable.associatedInfoId))
				.leftJoin(account, eq(account.id, associatedInfoTable.accountId))
				.leftJoin(bill, eq(bill.id, associatedInfoTable.billId))
				.leftJoin(budget, eq(budget.id, associatedInfoTable.budgetId))
				.leftJoin(category, eq(category.id, associatedInfoTable.categoryId))
				.leftJoin(tag, eq(tag.id, associatedInfoTable.tagId))
				.leftJoin(label, eq(label.id, associatedInfoTable.labelId))
				.leftJoin(autoImportTable, eq(autoImportTable.id, associatedInfoTable.autoImportId))
				.leftJoin(report, eq(report.id, associatedInfoTable.reportId))
				.leftJoin(reportElement, eq(reportElement.id, associatedInfoTable.reportElementId))
				.leftJoin(user, eq(user.id, associatedInfoTable.createdById))
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
				? await journalMaterializedViewActions.list({
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
				.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, fileTable.associatedInfoId))
				.where(and(...where)),
			'File - List - Get Count'
		);

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: resultsWithJournals, pageCount, page, pageSize };
	},
	listWithoutPagination: async ({ filter }) => {
		return (
			await fileActions.list({
				filter: {
					...filter,
					page: 0,
					pageSize: 1000000,
					orderBy: [{ field: 'createdAt', direction: 'desc' }]
				}
			})
		).data;
	},
	listGrouped: async ({ ids, grouping }) => {
		const db = getContextDB();
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
				createdById: associatedInfoTable.createdById,
				createdBy: user.username,
				groupingId: associatedInfoTable[`${grouping}Id`]
			})
			.from(fileTable)
			.leftJoin(associatedInfoTable, eq(associatedInfoTable.id, fileTable.associatedInfoId))
			.leftJoin(user, eq(user.id, associatedInfoTable.createdById))
			.where(inArrayWrapped(associatedInfoTable[`${grouping}Id`], ids))
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
	addToSingleItem: async ({ item, grouping }) => {
		const ids = [item.id];
		const groupedFiles = await fileActions.listGrouped({
			ids,
			grouping
		});

		return {
			...item,
			files: groupedFiles[item.id] || []
		};
	},
	addToItems: async ({ data, grouping }) => {
		const ids = data.data.map((a) => a.id);
		const groupedFiles = await fileActions.listGrouped({
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
	addToInfo: async ({ data, associatedId }) => {
		const db = getContextDB();
		const fileId = nanoid();

		const { file: fileData, reason, title, ...restData } = data;

		const originalFilename = fileData.name;
		const filename = `${fileId}-${originalFilename}`;
		const thumbnailFilename = `${fileId}-thumbnail-${originalFilename}`;
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

		const titleUse = title || originalFilename;

		type InsertFile = typeof fileTable.$inferInsert;
		const createData: InsertFile = {
			...restData,
			id: fileId,
			associatedInfoId: associatedId,
			originalFilename,
			filename,
			thumbnailFilename: fileIsImage ? thumbnailFilename : null,
			title: titleUse,
			size,
			type,
			fileExists: true,
			reason,
			...updatedTime()
		};

		await dbExecuteLogger(db.insert(fileTable).values(createData), 'File - Create');
	},
	create: async ({ data, creationUserId }) => {
		const result = createFileSchema.safeParse(data);

		if (!result.success) {
			throw new Error('Invalid input');
		}

		const { file, title, reason, ...links } = data;

		await associatedInfoActions.create({
			item: {
				...links,
				files: [{ file, title, reason }]
			},
			userId: creationUserId
		});

		// const fileId = nanoid();
		// const associatedId = nanoid();
		// const linked = Boolean(
		// 	result.data.accountId ||
		// 		result.data.billId ||
		// 		result.data.budgetId ||
		// 		result.data.categoryId ||
		// 		result.data.tagId ||
		// 		result.data.labelId ||
		// 		result.data.autoImportId ||
		// 		result.data.reportId ||
		// 		result.data.reportElementId
		// );

		// const { file: fileData, reason, title, ...restData } = result.data;

		// const originalFilename = fileData.name;
		// const filename = `${fileId}-${originalFilename}`;
		// const thumbnailFilename = `${fileId}-thumbnail-${originalFilename}`;
		// const size = fileData.size;

		// const fileIsPDF = fileData.type === 'application/pdf';
		// const fileIsJPG = fileData.type === 'image/jpeg';
		// const fileIsPNG = fileData.type === 'image/png';
		// const fileIsWEBP = fileData.type === 'image/webp';
		// const fileIsGIF = fileData.type === 'image/gif';
		// const fileIsTIFF = fileData.type === 'image/tiff';
		// const fileIsAVIF = fileData.type === 'image/avif';
		// const fileIsSVG = fileData.type === 'image/svg+xml';
		// const fileIsImage =
		// 	fileIsJPG || fileIsPNG || fileIsWEBP || fileIsGIF || fileIsTIFF || fileIsAVIF || fileIsSVG;
		// const type: FileTypeType = fileIsPDF
		// 	? 'pdf'
		// 	: fileIsJPG
		// 		? 'jpg'
		// 		: fileIsPNG
		// 			? 'png'
		// 			: fileIsWEBP
		// 				? 'webp'
		// 				: fileIsGIF
		// 					? 'gif'
		// 					: fileIsTIFF
		// 						? 'tiff'
		// 						: fileIsAVIF
		// 							? 'avif'
		// 							: fileIsSVG
		// 								? 'svg'
		// 								: 'other';

		// const fileContents = Buffer.from(await fileData.arrayBuffer());

		// const thumbnail = fileIsImage ? await sharp(fileContents).resize(400).toBuffer() : undefined;

		// await fileFileHandler.write(filename, fileContents);
		// if (thumbnail) {
		// 	await fileFileHandler.write(thumbnailFilename, thumbnail);
		// }

		// const titleUse = title || originalFilename;

		// type InsertFile = typeof fileTable.$inferInsert;
		// const createData: InsertFile = {
		// 	...restData,
		// 	id: fileId,
		// 	associatedInfoId: associatedId,
		// 	originalFilename,
		// 	filename,
		// 	thumbnailFilename: fileIsImage ? thumbnailFilename : null,
		// 	title: titleUse,
		// 	size,
		// 	type,
		// 	fileExists: true,
		// 	reason,
		// 	...updatedTime()
		// };

		// type InsertAssociatedInfo = typeof associatedInfoTable.$inferInsert;
		// const associatedInfoData: InsertAssociatedInfo = {
		// 	id: associatedId,
		// 	createdById: creationUserId,
		// 	...updatedTime(),
		// 	...restData,
		// 	linked,
		// 	title: titleUse
		// };

		// //Insert the file and associated info in a transaction to ensure atomicity
		// await db.transaction(async (tx) => {
		// 	await dbExecuteLogger(
		// 		tx.insert(associatedInfoTable).values(associatedInfoData),
		// 		'File - Create Associated Info'
		// 	);
		// 	await dbExecuteLogger(tx.insert(fileTable).values(createData), 'File - Create');
		// });
		await materializedViewActions.setRefreshRequired();
	},
	updateLinked: async () => {
		await associatedInfoActions.updateLinked();
	},
	updateMany: async ({ filter, update }) => {
		const db = getContextDB();
		const { id, title, reason, ...restUpdate } = update;

		const targetItems = await fileActions.listWithoutPagination({
			filter
		});

		if (targetItems.length === 0) {
			return;
		}

		const targetFileIds = targetItems.map((a) => a.id);
		const targetAssociatedIds = targetItems.map((a) => a.associatedInfoId);

		await db.transaction(async (tx) => {
			await dbExecuteLogger(
				tx
					.update(fileTable)
					.set({
						...restUpdate,
						...updatedTime()
					})
					.where(inArrayWrapped(fileTable.id, targetFileIds)),
				'File - Update Many - File'
			);

			await dbExecuteLogger(
				tx
					.update(associatedInfoTable)
					.set({
						...restUpdate,
						...updatedTime()
					})
					.where(inArrayWrapped(associatedInfoTable.id, targetAssociatedIds)),
				'File - Update Many - Associated Info'
			);
		});

		await fileActions.updateLinked();

		await materializedViewActions.setRefreshRequired();
	},
	deleteMany: async ({ filter }) => {
		const db = getContextDB();
		const files = await fileActions.listWithoutPagination({ filter });

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

		await associatedInfoActions.removeUnnecessary();
		await materializedViewActions.setRefreshRequired();
	},
	getFile: async ({ id }) => {
		const db = getContextDB();
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
	getThumbnail: async ({ id }) => {
		const db = getContextDB();
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
	getLinkedText: async ({ items }) => {
		const db = getContextDB();
		const accountTitle = items.accountId
			? await accountActions.getById(items.accountId)
			: undefined;
		const billTitle = items.billId ? await billActions.getById(items.billId) : undefined;
		const budgetTitle = items.budgetId ? await budgetActions.getById(items.budgetId) : undefined;
		const categoryTitle = items.categoryId
			? await categoryActions.getById(items.categoryId)
			: undefined;
		const tagTitle = items.tagId ? await tagActions.getById(items.tagId) : undefined;
		const labelTitle = items.labelId ? await labelActions.getById(items.labelId) : undefined;
		const autoImportTitle = items.autoImportId
			? await autoImportActions.getById({ db, id: items.autoImportId })
			: undefined;
		const reportTitle = items.reportId
			? await reportActions.getSimpleReportConfig({ db, id: items.reportId })
			: undefined;
		const reportElementTitle = items.reportElementId
			? await reportActions.reportElement.get({ db, id: items.reportElementId })
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
				? {
						description: 'Report Element',
						title: reportElementTitle.title || 'Untitled Report Element'
					}
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
	checkFilesExist: async () => {
		const db = getContextDB();
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
				getLogger().error('Unable to check directory existence');
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
	type: FileTypeType;
	filename: string;
	originalFilename: string;
	thumbnailFilename: string | null;
	createdAt: Date;
	updatedAt: Date;
	createdById: string | null;
	createdBy: string | null;
	groupingId: string | null;
}[];
