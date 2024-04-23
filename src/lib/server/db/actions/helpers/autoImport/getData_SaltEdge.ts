import type { AutoImportSaltEdgeSchemaType } from '$lib/schema/autoImportSchema';
import { z } from 'zod';
import { getStartDateToUse } from './getStartDateToUse';

const transactionSchema = z.object({
	data: z.array(
		z.object({
			id: z.string(),
			duplicated: z.boolean(),
			mode: z.enum(['normal', 'fee', 'transfer']),
			status: z.enum(['pending', 'posted']),
			amount: z.number(),
			description: z.string(),
			currency_code: z.string(),
			made_on: z.string().transform((v) => new Date(v)),
			category: z.string(),
			account_id: z.string(),
			created_at: z.string().transform((v) => new Date(v)),
			updated_at: z.string().transform((v) => new Date(v)),
			extra: z.record(z.any())
		})
	),
	meta: z.object({
		next_id: z.string().optional().nullable(),
		next_page: z.string().optional().nullable()
	})
});
const accountSchema = z.object({
	data: z.array(
		z.object({
			id: z.string(),
			name: z.string()
		})
	),
	meta: z.object({
		next_id: z.string().optional().nullable(),
		next_page: z.string().optional().nullable()
	})
});

type SaltEdgeTransaction = z.infer<typeof transactionSchema>['data'][number];

export const getData_SaltEdge = async ({
	config
}: {
	config: AutoImportSaltEdgeSchemaType;
}): Promise<Record<string, any>[]> => {
	const appId = config.appId;
	const secret = config.secret;
	const connectionId = config.connectionId;
	const accountIdOrName = config.accountId;

	//First we will get the accounts list for the connection so we can use the account name rather than id
	const accounts = await fetch(
		`https://www.saltedge.com/api/v5/accounts?per_page=1000&connection_id=${connectionId}`,
		{
			headers: {
				'App-id': appId,
				Secret: secret,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			}
		}
	);

	const accountData = await accounts.json();

	const accountResult = accountSchema.safeParse(accountData);

	if (!accountResult.success) {
		console.error('Error parsing SaltEdge response', accountResult.error);
		return [];
	}

	const accountId =
		accountResult.data.data.find((item) => item.name === accountIdOrName)?.id || accountIdOrName;

	const transactions: SaltEdgeTransaction[] = [];

	//Now we will get the transactions for the account
	let next_id: string | null | undefined = undefined;
	let counter = 0;

	while (next_id !== null && counter < 20) {
		const nextIdString = next_id ? `&from_id=${next_id}` : '';

		const data = await fetch(
			`https://www.saltedge.com/api/v5/transactions?per_page=1000&connection_id=${connectionId}&account_id=${accountId}${nextIdString}`,
			{
				headers: {
					'App-id': appId,
					Secret: secret,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				}
			}
		);

		const jsonData = await data.json();

		const result = transactionSchema.safeParse(jsonData);

		if (!result.success) {
			console.error('Error parsing SaltEdge response', result.error);
			return [];
		}

		transactions.push(...result.data.data);
		counter++;
		next_id = result.data.meta.next_id;
	}

	if (counter >= 20) {
		console.error(
			`Too many transactions to fetch ${transactions.length} transactions retrieved over ${counter} calls`
		);
	}

	//Filter out transactions that don't meet the date requirements
	const useStartDate = getStartDateToUse({
		startDate: config.startDate,
		lookbackDays: config.lookbackDays
	});

	const filteredTransactions = transactions
		.filter((item) => item.made_on >= useStartDate)
		.map((item) => ({
			...item,
			localDate: new Date(new Date(item.made_on).getTime() - new Date().getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 10)
		}));

	return filteredTransactions;
};
