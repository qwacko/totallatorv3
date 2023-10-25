import type { StatusEnumType } from '$lib/schema/statusSchema';

export const statusUpdate = <S extends StatusEnumType | undefined>(status: S) =>
	status
		? {
				status,
				active: status === 'active',
				disabled: status === 'disabled',
				allowUpdate: status === 'active' || status === 'disabled'
		  }
		: {};
