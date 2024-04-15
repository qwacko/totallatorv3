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
import { and, count as drizzleCount, eq, inArray, desc, getTableColumns } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { updatedTime } from './helpers/misc/updatedTime';
import { fileFilterToQuery } from './helpers/file/fileFilterToQuery';
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
		return db.query.fileTable
			.findFirst({ where: ({ id: fileId }, { eq }) => eq(fileId, id) })
			.execute();
	},
	list: async ({ db, filter }: { db: DBType; filter: FileFilterSchemaType }) => {
		const { page = 0, pageSize = 10, orderBy, ...restFilter } = filter;

		const where = fileFilterToQuery(restFilter);
		const orderBySQL = fileToOrderByToSQL({ orderBy });

		const results = await db
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
			.orderBy(...orderBySQL)
			.execute();

		const resultCount = await db
			.select({ count: drizzleCount(fileTable.id) })
			.from(fileTable)
			.where(and(...where))
			.execute();

		const count = resultCount[0].count;
		const pageCount = Math.max(1, Math.ceil(count / pageSize));

		return { count, data: results, pageCount, page, pageSize };
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
	}) => {
		const items = await db
			.select({
				id: fileTable.id,
				title: fileTable.title,
				type: fileTable.type,
				filename: fileTable.filename,
				originalFilename: fileTable.originalFilename,
				createdAt: fileTable.createdAt,
				updatedAt: fileTable.updatedAt,
				createdById: fileTable.createdById,
				createdBy: user.username,
				groupingId: fileTable[`${grouping}Id`]
			})
			.from(fileTable)
			.leftJoin(user, eq(user.id, fileTable.createdById))
			.where(inArray(fileTable[`${grouping}Id`], ids))
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
		const size = fileData.size;

		const fileIsPDF = fileData.type === 'application/pdf';
		const fileIsJPG = fileData.type === 'image/jpeg';
		const fileIsPNG = fileData.type === 'image/png';
		const type: FileTypeType = fileIsPDF ? 'pdf' : fileIsJPG ? 'jpg' : fileIsPNG ? 'png' : 'other';

		await fileFileHandler.write(filename, await fileData.text());

		type InsertFile = typeof fileTable.$inferInsert;
		const createData: InsertFile = {
			id,
			createdById: creationUserId,
			originalFilename,
			filename,
			title: originalFilename,
			size,
			type,
			fileExists: true,
			linked,
			...restData,
			...updatedTime()
		};

		await db.insert(fileTable).values(createData).execute();
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
		const where = fileFilterToQuery(filter);

		await db
			.update(fileTable)
			.set({
				...update,
				...updatedTime()
			})
			.where(and(...where))
			.execute();

		const updatedFiles = await fileActions.listWithoutPagination({ db, filter });

		await Promise.all(
			updatedFiles.map(async (currentFile) => {
				const linked = Boolean(
					currentFile.accountId ||
						currentFile.billId ||
						currentFile.budgetId ||
						currentFile.categoryId ||
						currentFile.tagId ||
						currentFile.labelId ||
						currentFile.autoImportId ||
						currentFile.reportId ||
						currentFile.reportElementId
				);

				if (currentFile.linked === linked) return;

				await db
					.update(fileTable)
					.set({ linked })
					.where(eq(fileTable.id, currentFile.id))
					.execute();
			})
		);
	},
	deleteMany: async ({
		db,
		filter
	}: {
		db: DBType;
		filter: FileFilterSchemaWithoutPaginationType;
	}) => {
		console.log('deleteMany Files', filter);

		const where = fileFilterToQuery(filter);

		const files = await fileActions.listWithoutPagination({ db, filter });

		console.log('NUmber To Delete', files.length);

		const deleted = await db
			.delete(fileTable)
			.where(and(...where))
			.execute();

		console.log('Deleted', deleted);

		await Promise.all(
			files.map(async (currentFile) => {
				await fileFileHandler.deleteFile(currentFile.filename);
			})
		);
	}
};

export type GroupedFilesType = Awaited<ReturnType<typeof fileActions.listGrouped>>[string];
