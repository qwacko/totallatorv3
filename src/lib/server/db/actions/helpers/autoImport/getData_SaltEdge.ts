import type { AutoImportSaltEdgeSchemaType } from '$lib/schema/autoImportSchema';
import { z } from 'zod';

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

type SaltEdgeTransaction = z.infer<typeof transactionSchema>['data'][number];

export const getData_SaltEdge = async ({
	config
}: {
	config: AutoImportSaltEdgeSchemaType;
}): Promise<Record<string, any>[]> => {
	const appId = config.appId;
	const secret = config.secret;
	const connectionId = config.connectionId;
	const accountId = config.accountId;

	const data = await fetch(
		`https://www.saltedge.com/api/v5/transactions?connection_id=${connectionId}&account_id=${accountId}`,
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

	console.log('Meta:', result.data.meta);

	console.log('Number Transactions: ', result.data.data.length);
	console.log(
		'First Transaction:',
		result.data.data.map((item) => item.made_on).sort((a, b) => a.getTime() - b.getTime())[0]
	);
	console.log(
		'Last Transaction:',
		result.data.data.map((item) => item.made_on).sort((a, b) => b.getTime() - a.getTime())[0]
	);

	return [];
};
