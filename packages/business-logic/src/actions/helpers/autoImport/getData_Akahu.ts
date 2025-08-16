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
		getLogger('auto-import').error(e, 'Error fetching accounts');
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
		getLogger('auto-import').error(e, 'Error fetching transactions');
	}

	if (counter >= 20) {
		getLogger('auto-import').error(
			{ transactionCount: transactions.length, callCount: counter },
			'Too many transactions to fetch'
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
