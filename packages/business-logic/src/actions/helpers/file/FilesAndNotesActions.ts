import type { CreateFileNoteRelationshipSchemaType } from '@totallator/shared';
import type { JournalViewReturnType } from '@totallator/database';
import type { PaginatedResults } from '../journal/PaginationType';

export type GroupingOptions =
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

export type GroupingIdOptions =
	| 'transactionId'
	| 'accountId'
	| 'billId'
	| 'budgetId'
	| 'categoryId'
	| 'tagId'
	| 'labelId'
	| 'autoImportId'
	| 'reportId'
	| 'reportElementId';

export type LinkedTextType = { description: string; title: string };

export type FilesAndNotesActions<
	TableType extends Record<string, any>,
	CreateSchema,
	UpdateSchema,
	FilterSchema,
	FilterSchemaWithoutPagination,
	GroupedType,
	AddedToItems extends Record<string, any>
> = {
	getById: (id: string) => Promise<TableType | undefined>;
	filterToText: (data: { filter: FilterSchema }) => Promise<string[]>;
	list: (data: {
		filter: FilterSchema;
	}) => Promise<PaginatedResults<TableType & FilesAndNotesAdditionalColumns>>;
	listWithoutPagination: (data: {
		filter: FilterSchema;
	}) => Promise<(TableType & FilesAndNotesAdditionalColumns)[]>;
	listGrouped: (data: {
		ids: string[];
		grouping: GroupingOptions;
	}) => Promise<Record<string, GroupedType>>;
	addToSingleItem: <T extends { id: string }>(data: {
		item: T;
		grouping: GroupingOptions;
	}) => Promise<T & AddedToItems>;
	addToItems: <T extends { id: string }>(data: {
		data: PaginatedResults<T>;
		grouping: GroupingOptions;
	}) => Promise<PaginatedResults<T & AddedToItems>>;
	create: (date: {
		data: CreateSchema & CreateFileNoteRelationshipSchemaType;
		creationUserId: string;
	}) => Promise<void>;
	addToInfo: (data: { data: CreateSchema; associatedId: string }) => Promise<void>;
	updateMany: (data: {
		filter: FilterSchemaWithoutPagination;
		update: UpdateSchema;
	}) => Promise<void>;
	deleteMany: (data: { filter: FilterSchemaWithoutPagination }) => Promise<void>;
	getLinkedText: (data: { items: CreateFileNoteRelationshipSchemaType }) => Promise<{
		data: {
			accountTitle: LinkedTextType | undefined;
			billTitle: LinkedTextType | undefined;
			budgetTitle: LinkedTextType | undefined;
			categoryTitle: LinkedTextType | undefined;
			tagTitle: LinkedTextType | undefined;
			labelTitle: LinkedTextType | undefined;
			autoImportTitle: LinkedTextType | undefined;
			reportTitle: LinkedTextType | undefined;
			reportElementTitle: LinkedTextType | undefined;
		};
		text: string;
	}>;
};
type FilesAndNotesAdditionalColumns = {
	transactionId: string | null;
	accountId: string | null;
	accountTitle: string | null;
	billId: string | null;
	billTitle: string | null;
	budgetId: string | null;
	budgetTitle: string | null;
	categoryId: string | null;
	categoryTitle: string | null;
	tagId: string | null;
	tagTitle: string | null;
	labelId: string | null;
	labelTitle: string | null;
	autoImportId: string | null;
	autoImportTitle: string | null;
	reportId: string | null;
	reportTitle: string | null;
	reportElementId: string | null;
	reportElementTitle: string | null;
	journals: JournalViewReturnType[];
	createdById: string | null;
	createdBy: string | null;
};
