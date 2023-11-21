import { createSimpleTransactionSchema } from '$lib/schema/journalSchema';
import Handlebars from 'handlebars';

// Substring Helper
Handlebars.registerHelper('substring', function (value, start, length) {
	return value.substring(start, start + length);
});

// Regex Replacement Helper
Handlebars.registerHelper('regexReplace', function (value, pattern, replacement) {
	return value.replace(new RegExp(pattern, 'g'), replacement);
});

// Multiplication Helper
Handlebars.registerHelper('multiply', function (value, factor) {
	return Number(value) * factor;
});

// Equal Helper
Handlebars.registerHelper('eq', function (arg1, arg2) {
	return arg1 === arg2;
});

type InputObject = Record<string, string>;

export const processObject = <
	Keys extends string,
	ConfigObject extends Record<Keys, string | undefined>
>(
	input: Record<string, unknown>,
	config: ConfigObject
) => {
	return Object.keys(config).reduce(
		(acc, val) => {
			const key = val as keyof ConfigObject;

			if (config[key] === undefined) return acc;

			try {
				acc[key] = { text: processConfigString(config[key], input as InputObject) };
				return acc;
			} catch (error) {
				const errorMessage = error as { message: string };
				console.error(error);
				acc[key] = { error: errorMessage.message };
				return acc;
			}
		},
		{} as Record<keyof ConfigObject, { text?: string; error?: string }>
	);
};

export const processObjectReturnTransaction = <
	Keys extends string,
	ConfigObject extends Record<Keys, string | undefined>
>(
	input: Record<string, unknown>,
	config: ConfigObject
) => {
	const processedObject = processObject(input, config);

	const objectKeys = Object.keys(processedObject) as Keys[];

	const hasErrors = objectKeys.reduce(
		(prev, value) => (processedObject[value].error !== undefined ? true : prev),
		false
	);

	const errorList = objectKeys.reduce(
		(prev, value) => {
			if (processedObject[value]?.error !== undefined) {
				const errorMessage = processedObject[value].error || '';
				return [...prev, { key: value, error: errorMessage }];
			}
			return prev;
		},
		[] as { key: Keys; error: string }[]
	);

	if (hasErrors) {
		return { errors: errorList };
	}

	const returnObject = objectKeys.reduce(
		(prev, value) => {
			return { ...prev, [value]: processedObject[value].text };
		},
		{} as Record<Keys, string>
	);

	const processed = createSimpleTransactionSchema.safeParse(returnObject);

	if (!processed.success) {
		return { errors: [{ key: 'transaction', error: processed.error.message }] };
	}
	return {
		transaction: processed.data
	};
};

export function processConfigString(
	configString: string | undefined,
	inputObject: InputObject
): string | undefined {
	if (!configString) return undefined;
	const template = Handlebars.compile(configString);

	const processedString = template(inputObject);

	return processedString;
}
