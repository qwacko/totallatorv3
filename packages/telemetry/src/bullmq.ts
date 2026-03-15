import { BullMQOtel } from 'bullmq-otel';

const globalTelemetryState = globalThis as typeof globalThis & {
	__totallatorBullMqTelemetry?: BullMQOtel;
};

export const getBullMQTelemetry = () => {
	if (process.env.OTEL_ENABLE_TRACING !== 'true') {
		return undefined;
	}

	if (!globalTelemetryState.__totallatorBullMqTelemetry) {
		globalTelemetryState.__totallatorBullMqTelemetry = new BullMQOtel({
			tracerName: '@totallator/bullmq',
			meterName: '@totallator/bullmq',
			version: process.env.OTEL_SERVICE_VERSION || '1.0.0',
			enableMetrics: true
		});
	}

	return globalTelemetryState.__totallatorBullMqTelemetry;
};
