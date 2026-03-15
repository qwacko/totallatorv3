import { initTelemetry } from '@totallator/telemetry';

await initTelemetry({
	defaultServiceName: 'totallator-worker',
	serviceNameEnvKey: 'OTEL_SERVICE_NAME_WORKER',
	registerImportHook: true,
	debugLabel: 'Worker'
});
