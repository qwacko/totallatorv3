import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

import { getLongProcessEventsChannel, getLongProcessSnapshot } from '$lib/server/longProcess/state';
import { createRedisSubscriber } from '$lib/server/redis/redisClient';

const encoder = new TextEncoder();

const formatSse = (eventName: string, payload: unknown) =>
	`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;

export const GET: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const subscriber = createRedisSubscriber();
	const channel = getLongProcessEventsChannel();

	await subscriber.subscribe(channel);

	let cleanup = () => {};

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			let closed = false;
			const onMessage = (_messageChannel: string, message: string) => {
				try {
					const parsed = JSON.parse(message);
					sendEvent(parsed.event || 'message', parsed.payload || parsed);
				} catch {
					sendEvent('message', { message });
				}
			};
			const close = () => {
				if (closed) {
					return;
				}

				closed = true;
				clearInterval(heartbeatInterval);
				request.signal.removeEventListener('abort', close);
				subscriber.off('message', onMessage);
				subscriber.unsubscribe(channel).catch(() => undefined);
				subscriber.quit().catch(() => undefined);
				try {
					controller.close();
				} catch {
					// Stream may already be closed by the runtime.
				}
			};
			const sendEvent = (eventName: string, payload: unknown) => {
				if (closed) {
					return;
				}

				controller.enqueue(encoder.encode(formatSse(eventName, payload)));
			};

			cleanup = close;
			subscriber.on('message', onMessage);

			getLongProcessSnapshot().then((snapshot) => {
				sendEvent('system.snapshot', snapshot);
			});

			const heartbeatInterval = setInterval(() => {
				if (!closed) {
					controller.enqueue(encoder.encode(': keepalive\n\n'));
					sendEvent('system.heartbeat', { timestamp: new Date().toISOString() });
				}
			}, 30000);

			request.signal.addEventListener('abort', close);
		},
		cancel() {
			cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
