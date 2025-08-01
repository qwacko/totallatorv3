import type { DownloadTypeEnumType } from '@totallator/shared';
import type { IdSchemaType } from '@totallator/shared';
import type { PaginatedResults } from '../journal/PaginationType';
import type { CreateOrGetType } from './createOrGetType';

export type ItemActionsType<
	TableType,
	ViewTableType extends Record<any, any>,
	FilterSchema,
	CreateSchema,
	UpdateSchema,
	DropdownType extends Record<string, any>[],
	SeedCountType
> = {
	latestUpdate: () => Promise<Date>;
	getById: ( id: string) => Promise<TableType | undefined>;
	count: ( filter?: FilterSchema) => Promise<number>;
	listWithTransactionCount: () => Promise<{ id: string; journalCount: number }[]>;
	list: (data: {  filter: FilterSchema }) => Promise<PaginatedResults<ViewTableType>>;
	generateCSVData: (data: {
		
		filter?: FilterSchema;
		returnType: DownloadTypeEnumType;
	}) => Promise<string>;
	listForDropdown: () => Promise<DropdownType>;
	createOrGet: (data: {
		title?: string | null;
		id?: string | null;
		requireActive?: boolean;
		cachedData?: CreateOrGetType[];
	}) => Promise<CreateOrGetType | undefined | null>;
	create: (data: CreateSchema) => Promise<string>;
	createMany: (data: CreateSchema[]) => Promise<string[] | undefined>;
	update: (data: { data: UpdateSchema; id: string }) => Promise<string>;
	canDeleteMany: (ids: string[]) => Promise<boolean>;
	canDelete: (data: IdSchemaType) => Promise<boolean>;
	delete: (data: IdSchemaType) => Promise<string>;
	deleteMany: (data: IdSchemaType[]) => Promise<boolean | undefined>;
	seed: (count: SeedCountType) => Promise<void>;
};
