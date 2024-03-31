import type { AutoImportCombinedSchemaType } from '$lib/schema/autoImportSchema';
import { getData_Akahu } from './getData_Akahu';
import { getData_SaltEdge } from './getData_SaltEdge';

export const getData_Common = async ({
	config
}: {
	config: AutoImportCombinedSchemaType;
}): Promise<Record<string, any>[]> => {
	if (config.type === 'akahu') {
		return getData_Akahu({ config });
	} else if (config.type === 'saltedge') {
		return getData_SaltEdge({ config });
	}

	throw new Error('Unsupported auto import type');
};
