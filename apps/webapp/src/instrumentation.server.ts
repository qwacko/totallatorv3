import { register } from 'node:module';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { createAddHookMessageChannel } from 'import-in-the-middle';

// Check if tracing is enabled
const tracingEnabled = process.env.OTEL_ENABLE_TRACING === 'true';

if (tracingEnabled) {
	console.log('🔍 Initializing OpenTelemetry tracing...');

	// Setup import-in-the-middle for proper instrumentation
	const { registerOptions } = createAddHookMessageChannel();
	register('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);

	// Configure OpenTelemetry SDK
	const sdk = new NodeSDK({
		serviceName: process.env.OTEL_SERVICE_NAME || 'totallator',
		traceExporter: new OTLPTraceExporter({
			url: (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-lgtm:4318') + '/v1/traces',
			headers: {
				'Content-Type': 'application/json'
			}
		}),
		instrumentations: [getNodeAutoInstrumentations()]
	});

	// Start SDK
	sdk.start();

	console.log('✅ OpenTelemetry tracing initialized');

	// Graceful shutdown
	process.on('SIGTERM', () => {
		console.log('🛑 Shutting down OpenTelemetry...');
		sdk
			.shutdown()
			.then(() => console.log('✅ OpenTelemetry shutdown complete'))
			.catch((err) => console.error('❌ Error shutting down OpenTelemetry', err));
	});
} else {
	console.log('ℹ️ OpenTelemetry tracing is disabled');
}
