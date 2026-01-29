import z from 'zod';

import { getContext } from '@totallator/context';
import { logConfigFilterValidation, logFilterValidation, logLevelEnum } from '@totallator/shared';

import { form, query } from '$app/server';

export const getLogs = query(
	z.object({
		...logFilterValidation.shape,
		limit: z.number().min(0).optional().default(100),
		offset: z.number().min(0).optional().default(0)
	}),
	async (filter) => {
		const globalContext = getContext();
		const logs = await globalContext.global.logging.queryLoggedItems(filter);
		const logCount = await globalContext.global.logging.getLoggedItemsCount(filter);
		return {
			logs,
			logCount
		};
	}
);

export const getLogConfigurations = query(async () => {
	const globalContext = getContext();
	const configurations = await globalContext.global.logging.getAllLogConfigurations();

	// Get Loki status from environment variables
	const lokiStatus = {
		enabled: process.env.LOKI_ENABLE === 'true',
		endpoint: process.env.LOKI_ENDPOINT || 'http://loki:3100/loki/api/v1/push'
	};

	// Group configurations by destination for better UI organization
	const groupedConfigs = configurations.reduce(
		(acc, config) => {
			if (!acc[config.destination]) {
				acc[config.destination] = [];
			}
			acc[config.destination].push(config);
			return acc;
		},
		{} as Record<string, typeof configurations>
	);

	return {
		configurations,
		groupedConfigs,
		lokiStatus,
		destinations: ['console', 'database', 'loki'] // Available destinations
	};
});

export const setLogConfiguration = form(async () => {
	const globalContext = getContext();
	const logLevelIn = '';
	const domain = '';
	const action = '';
	const destination = '';

	// Validate destination
	const validDestinations = ['console', 'database', 'loki'];
	if (destination && !validDestinations.includes(destination as string)) {
		throw new Error(
			`Invalid destination: ${destination}. Must be one of: ${validDestinations.join(', ')}`
		);
	}

	const adjustedForm = {
		logLevel: logLevelIn,
		domain: domain !== null ? [domain] : undefined,
		action: action !== null ? [action] : undefined,
		destination: destination !== null ? [destination] : undefined
	};
	const validatedData = z
		.object({
			...logConfigFilterValidation.shape,
			logLevel: z.enum(logLevelEnum)
		})
		.safeParse(adjustedForm);
	if (validatedData.error) {
		console.error('Failed to set log configuration:', validatedData.error);
		throw new Error(`Invalid log configuration: ${JSON.stringify(validatedData.error)}`);
	}

	const { logLevel, ...filter } = validatedData.data;

	try {
		await globalContext.global.logging.setLogLevel({ logLevel, filter });

		// Log the configuration change for audit purposes
		const logger = globalContext.global.logger('settings', 'Update');
		logger.info({
			code: 'LOG_CONFIG_001',
			title: `Updated log configuration for ${filter.destination?.[0] || 'all destinations'}`,
			destination: filter.destination?.[0],
			domain: filter.domain?.[0],
			action: filter.action?.[0],
			newLevel: logLevel
		});
	} catch (error) {
		console.error('Failed to set log configuration:', error);
		throw new Error(`Failed to set log configuration: ${error}`);
	}

	return {};
});
