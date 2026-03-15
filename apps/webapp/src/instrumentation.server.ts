import { initTelemetry } from '@totallator/telemetry';

await initTelemetry({
	defaultServiceName: 'totallator-webapp',
	serviceNameEnvKey: 'OTEL_SERVICE_NAME_WEBAPP',
	registerImportHook: true,
	debugLabel: 'Webapp'
});
