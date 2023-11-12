type InputObject = Record<string, string>;

export const processObject = <ConfigObject extends Record<string, string>>(
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

export function processConfigString(
	configString: string | undefined,
	inputObject: InputObject
): string | undefined {
	const pattern = /\{([^}]+)\}/g;
	if (!configString) return undefined;
	return configString.replace(pattern, (match, content) => {
		const [key, operation, ...params] = content.split(':');

		if (!Object.prototype.hasOwnProperty.call(inputObject, key)) {
			throw new Error(`Configuration error: Key '${key}' not found in input object.`);
		}

		const value = inputObject[key];

		try {
			switch (operation) {
				case 'substring':
					return handleSubstring(value, params);
				case 'regex':
					return handleRegex(value, params, content);
				case 'multiply':
					return handleMultiply(value, params);
				case 'direct':
					return value;
				// Add more cases for other operations
				default:
					throw new Error(`Unsupported operation '${operation}' in '${content}'.`);
			}
		} catch (error) {
			const processedError = error as { message: string };
			throw new Error(`Error processing '${content}': ${processedError.message}`);
		}
	});
}

function handleSubstring(value: string, params: string[]): string {
	if (params.length !== 2) {
		throw new Error(`'substring' operation requires exactly 2 parameters.`);
	}

	const start = parseInt(params[0], 10);
	const length = parseInt(params[1], 10);

	if (isNaN(start) || isNaN(length)) {
		throw new Error(`Invalid parameters for 'substring'. Parameters must be integers.`);
	}

	return value.substring(start, start + length);
}

function handleRegex(value: string, params: string[], content: string): string {
	if (params.length !== 2) {
		throw new Error(`'regex' operation requires exactly 2 parameters.`);
	}

	try {
		const [pattern, replacement] = params;
		return value.replace(new RegExp(pattern, 'g'), replacement);
	} catch (error) {
		throw new Error(`Invalid regex pattern or replacement in '${content}'.`);
	}
}

function handleMultiply(value: string, params: string[]): string {
	if (params.length !== 1) {
		throw new Error(`'multiply' operation requires exactly 1 parameter.`);
	}

	const factor = parseFloat(params[0]);
	if (isNaN(factor)) {
		throw new Error(`Invalid parameter for 'multiply'. Parameter must be a number.`);
	}

	return (parseFloat(value) * factor).toString();
}
