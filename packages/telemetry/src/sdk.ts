import { register } from 'node:module';

import { propagation } from '@opentelemetry/api';
import {
	CompositePropagator,
	W3CBaggagePropagator,
	W3CTraceContextPropagator
} from '@opentelemetry/core';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import dotenv from 'dotenv';
import { createAddHookMessageChannel } from 'import-in-the-middle';

import { getTelemetryConfig } from './config.js';

export interface InitTelemetryOptions {
	defaultServiceName: string;
	serviceNameEnvKey?: string;
	registerImportHook?: boolean;
	debugLabel?: string;
}

const globalTelemetryState = globalThis as typeof globalThis & {
	__totallatorTelemetrySdk?: NodeSDK | null;
	__totallatorTelemetryInitPromise?: Promise<NodeSDK | null> | null;
	__totallatorTelemetryHandlersRegistered?: boolean;
	__totallatorTelemetryImportHookRegistered?: boolean;
};

dotenv.config();

const ensureImportHookRegistered = () => {
	if (globalTelemetryState.__totallatorTelemetryImportHookRegistered) {
		return;
	}

	try {
		const { registerOptions } = createAddHookMessageChannel();
		register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);
		globalTelemetryState.__totallatorTelemetryImportHookRegistered = true;
	} catch (error) {
		console.warn('[Telemetry] Import hook registration failed', error);
	}
};

const registerShutdownHandlers = (label: string) => {
	if (globalTelemetryState.__totallatorTelemetryHandlersRegistered) {
		return;
	}

	globalTelemetryState.__totallatorTelemetryHandlersRegistered = true;

	const shutdown = async (signal: string) => {
		if (!globalTelemetryState.__totallatorTelemetrySdk) {
			return;
		}

		try {
			await globalTelemetryState.__totallatorTelemetrySdk.shutdown();
			console.log(`[${label}] Telemetry shutdown complete after ${signal}`);
		} catch (error) {
			console.error(`[${label}] Telemetry shutdown failed`, error);
		} finally {
			globalTelemetryState.__totallatorTelemetrySdk = null;
			globalTelemetryState.__totallatorTelemetryInitPromise = null;
		}
	};

	for (const signal of ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const) {
		process.once(signal, () => {
			void shutdown(signal);
		});
	}

	process.once('beforeExit', () => {
		void shutdown('beforeExit');
	});
};

export const initTelemetry = async ({
	defaultServiceName,
	serviceNameEnvKey,
	registerImportHook = true,
	debugLabel = 'Telemetry'
}: InitTelemetryOptions) => {
	if (globalTelemetryState.__totallatorTelemetryInitPromise) {
		return await globalTelemetryState.__totallatorTelemetryInitPromise;
	}

	globalTelemetryState.__totallatorTelemetryInitPromise = (async () => {
		const config = getTelemetryConfig(defaultServiceName, serviceNameEnvKey);

		if (!config.enabled) {
			console.log(`[${debugLabel}] OpenTelemetry tracing is disabled`);
			globalTelemetryState.__totallatorTelemetrySdk = null;
			return null;
		}

		if (registerImportHook) {
			ensureImportHookRegistered();
		}

		propagation.setGlobalPropagator(
			new CompositePropagator({
				propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()]
			})
		);

		const sdk = new NodeSDK({
			resource: defaultResource().merge(
				resourceFromAttributes({
					[ATTR_SERVICE_NAME]: config.serviceName,
					[ATTR_SERVICE_VERSION]: config.serviceVersion
				})
			),
			traceExporter: new OTLPTraceExporter({
				url: config.tracesEndpoint
			}),
			metricReader: new PeriodicExportingMetricReader({
				exporter: new OTLPMetricExporter({
					url: config.metricsEndpoint
				})
			}),
			logRecordProcessor: new BatchLogRecordProcessor(
				new OTLPLogExporter({
					url: config.logsEndpoint
				})
			),
			instrumentations: [
				new HttpInstrumentation(),
				new UndiciInstrumentation(),
				new IORedisInstrumentation(),
				new PinoInstrumentation()
			]
		});

		await sdk.start();
		globalTelemetryState.__totallatorTelemetrySdk = sdk;
		registerShutdownHandlers(debugLabel);
		console.log(`[${debugLabel}] OpenTelemetry initialized for ${config.serviceName}`);
		return sdk;
	})();

	return await globalTelemetryState.__totallatorTelemetryInitPromise;
};

export const shutdownTelemetry = async () => {
	if (!globalTelemetryState.__totallatorTelemetrySdk) {
		return;
	}

	await globalTelemetryState.__totallatorTelemetrySdk.shutdown();
	globalTelemetryState.__totallatorTelemetrySdk = null;
	globalTelemetryState.__totallatorTelemetryInitPromise = null;
};
