import type { AutoImportAkahuSchemaType } from '$lib/schema/autoImportSchema';
import { logging } from '$lib/server/logging';
import { AkahuClient, type Account, type Transaction } from 'akahu';

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

	let cursor: undefined | null | string = undefined;
	let counter = 0;

	const transactions: Transaction[] = [];
	let account: Account | undefined = undefined;
	try {
		const accounts = await akahu.accounts.list(userToken);
		account = accounts.find((item) => item.name === config.accountId);
	} catch (e) {
		logging.error('Error fetching accounts', e);
	}

	try {
		while (cursor !== null && counter < 20) {
			const currentTransactions = await akahu.transactions.list(userToken, {
				start,
				cursor
			});

			transactions.push(...currentTransactions.items);
			cursor = currentTransactions.cursor.next;
			counter++;
		}
	} catch (e) {
		logging.error('Error fetching transactions', e);
	}

	if (counter >= 20) {
		logging.error(
			`Too many transactions to fetch ${transactions.length} transactions retrieved over ${counter} calls`
		);
	}

	const modifiedTransactions = transactions.filter((item) =>
		account ? item._account === account._id : item._account === config.accountId
	);

	return modifiedTransactions;
};
