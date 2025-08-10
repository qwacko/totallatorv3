import type { StatusEnumType } from '@totallator/shared';

export const statusUpdate = <S extends StatusEnumType | undefined>(status: S) => {
	if (status) {
		if (['active', 'disabled'].includes(status)) {
			return {
				status,
				active: status === 'active',
				disabled: status === 'disabled',
				allowUpdate: status === 'active' || status === 'disabled'
			};
		} else {
			throw new Error('Invalid status provided.');
		}
	}
	return {} as {
		status: S;
		active: boolean;
		disabled: boolean;
		allowUpdate: boolean;
	};
};
