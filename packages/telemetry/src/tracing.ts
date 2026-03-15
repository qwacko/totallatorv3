import {
	type Attributes,
	type Context,
	ROOT_CONTEXT,
	type Span,
	SpanStatusCode,
	trace,
	context as traceContext
} from '@opentelemetry/api';

const DEFAULT_TRACER_NAME = '@totallator/telemetry';

export const getTracer = (name = DEFAULT_TRACER_NAME) => trace.getTracer(name);

export const withSpan = async <T>(
	name: string,
	fn: (span: Span) => Promise<T>,
	options?: { tracerName?: string; attributes?: Attributes; parent?: Span | Context }
) => {
	const tracer = getTracer(options?.tracerName);
	const parentContext = options?.parent
		? 'spanContext' in options.parent
			? trace.setSpan(traceContext.active(), options.parent as Span)
			: (options.parent as Context)
		: traceContext.active();

	return await tracer.startActiveSpan(
		name,
		{ attributes: options?.attributes },
		parentContext,
		async (span) => {
			try {
				const result = await fn(span);
				span.setStatus({ code: SpanStatusCode.OK });
				return result;
			} catch (error) {
				span.recordException(error as Error);
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error instanceof Error ? error.message : 'Unknown error'
				});
				throw error;
			} finally {
				span.end();
			}
		}
	);
};

export const getActiveSpan = () => trace.getSpan(traceContext.active());

export const injectTraceContext = (attributes: Record<string, unknown> = {}) => {
	const span = getActiveSpan();
	if (!span) {
		return attributes;
	}

	const spanContext = span.spanContext();

	return {
		...attributes,
		traceId: spanContext.traceId,
		spanId: spanContext.spanId
	};
};

export const withRootContext = <T>(fn: () => T) => traceContext.with(ROOT_CONTEXT, fn);
