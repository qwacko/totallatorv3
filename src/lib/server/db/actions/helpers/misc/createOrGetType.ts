import type { StatusEnumType } from '$lib/schema/statusSchema';

export type CreateOrGetType = { id: string; title: string; status: StatusEnumType };
