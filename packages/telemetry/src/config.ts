export interface TelemetryEnvConfig {
	enabled: boolean;
	serviceName: string;
	serviceVersion: string;
	otlpEndpoint: string;
	tracesEndpoint: string;
	metricsEndpoint: string;
	logsEndpoint: string;
}

const normalizeOtlpEndpoint = (endpoint: string) => endpoint.replace(/\/+$/, '');

export const getTelemetryConfig = (
	defaultServiceName: string,
	serviceNameEnvKey?: string
): TelemetryEnvConfig => {
	const otlpEndpoint = normalizeOtlpEndpoint(
		process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-lgtm:4318'
	);

	return {
		enabled: process.env.OTEL_ENABLE_TRACING === 'true',
		serviceName:
			(serviceNameEnvKey ? process.env[serviceNameEnvKey] : undefined) ||
			process.env.OTEL_SERVICE_NAME ||
			defaultServiceName,
		serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
		otlpEndpoint,
		tracesEndpoint: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || `${otlpEndpoint}/v1/traces`,
		metricsEndpoint:
			process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || `${otlpEndpoint}/v1/metrics`,
		logsEndpoint: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT || `${otlpEndpoint}/v1/logs`
	};
};
