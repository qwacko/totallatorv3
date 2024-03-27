import type { AutoImportAkahuSchemaType } from '$lib/schema/autoImportSchema';
import { AkahuClient } from 'akahu';

export const getData_Akahu = async ({
	config
}: {
	config: AutoImportAkahuSchemaType;
}): Promise<Record<string, any>[]> => {
	const appToken = config.appAccessToken;
	const userToken = config.userAccessToken;

	const configStartDate = config.startDate ? new Date(config.startDate) : undefined;
	const offsetStartDate = new Date();
	const lookbackDays = config.lookbackDays || 30;
	offsetStartDate.setDate(offsetStartDate.getDate() - lookbackDays);

	const useStartDate = !configStartDate
		? offsetStartDate
		: configStartDate > offsetStartDate
			? configStartDate
			: offsetStartDate;

	const start = useStartDate.toISOString();

	console.log('start', start);

	const akahu = new AkahuClient({ appToken });
	const transactions = await akahu.transactions.list(userToken, {
		start
	});

	return transactions.items;
};
