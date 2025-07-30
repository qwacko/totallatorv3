import type { AutoImportAkahuSchemaType } from '@totallator/shared';
import { getLogger } from '@/logger';
import { AkahuClient, type Account, type Transaction } from 'akahu';
import { getStartDateToUse } from './getStartDateToUse';

export const getData_Akahu = async ({
	config
}: {
	config: AutoImportAkahuSchemaType;
}): Promise<Record<string, any>[]> => {
	const appToken = config.appAccessToken;
	const userToken = config.userAccessToken;

	const useStartDate = getStartDateToUse({
		startDate: config.startDate,
		lookbackDays: config.lookbackDays
	});

	const start = useStartDate.toISOString();

	const akahu = new AkahuClient({ appToken });

	let cursor: undefined | null | string = undefined;
	let counter = 0;

	const transactions: Transaction[] = [];
	let account: Account | undefined = undefined;
	try {
		const accounts = await akahu.accounts.list(userToken);
		account = accounts.find((item) => item.name === config.accountId);
	} catch (e) {
		getLogger().error('Error fetching accounts', e);
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
		getLogger().error('Error fetching transactions', e);
	}

	if (counter >= 20) {
		getLogger().error(
			`Too many transactions to fetch ${transactions.length} transactions retrieved over ${counter} calls`
		);
	}

	const modifiedTransactions = transactions
		.filter((item) =>
			account ? item._account === account._id : item._account === config.accountId
		)
		.map((item) => ({
			...item,
			localDate: new Date(new Date(item.date).getTime() - new Date().getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 10)
		}));

	return modifiedTransactions;
};
