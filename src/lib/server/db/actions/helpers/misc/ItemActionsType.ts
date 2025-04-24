import type { IdSchemaType } from '$lib/schema/idSchema';
import type { DBType } from '../../../db';
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
	latestUpdate: (data: { db: DBType }) => Promise<Date>;
	getById: (db: DBType, id: string) => Promise<TableType | undefined>;
	count: (db: DBType, filter?: FilterSchema) => Promise<number>;
	listWithTransactionCount: (db: DBType) => Promise<{ id: string; journalCount: number }[]>;
	list: (data: { db: DBType; filter: FilterSchema }) => Promise<PaginatedResults<ViewTableType>>;
	listForDropdown: (data: { db: DBType }) => Promise<DropdownType>;
	createOrGet: (data: {
		db: DBType;
		title?: string | null;
		id?: string | null;
		requireActive?: boolean;
		cachedData?: CreateOrGetType[];
	}) => Promise<CreateOrGetType | undefined | null>;
	create: (db: DBType, data: CreateSchema) => Promise<string>;
	createMany: (db: DBType, data: CreateSchema[]) => Promise<string[] | undefined>;
	update: (data: { db: DBType; data: UpdateSchema; id: string }) => Promise<string>;
	canDeleteMany: (db: DBType, ids: string[]) => Promise<boolean>;
	canDelete: (db: DBType, data: IdSchemaType) => Promise<boolean>;
	delete: (db: DBType, data: IdSchemaType) => Promise<string>;
	deleteMany: (db: DBType, data: IdSchemaType[]) => Promise<boolean | undefined>;
	seed: (db: DBType, count: SeedCountType) => Promise<void>;
};
