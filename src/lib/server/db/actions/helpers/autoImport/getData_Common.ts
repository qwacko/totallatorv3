import type { AutoImportCombinedSchemaType } from '$lib/schema/autoImportSchema';
import { getData_Akahu } from './getData_Akahu';

export const getData_Common = async ({
	config
}: {
	config: AutoImportCombinedSchemaType;
}): Promise<Record<string, any>[]> => {
	if (config.type === 'akahu') {
		return getData_Akahu({ config });
	}

	throw new Error('Unsupported auto import type');
};
