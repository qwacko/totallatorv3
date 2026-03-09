import type { RequestHandler } from '@sveltejs/kit';

import { getLongProcessEventsChannel, getWriteLock } from '$lib/server/longProcess/state';
import { createRedisSubscriber } from '$lib/server/redis/redisClient';

export const GET: RequestHandler = async () => {
	const encoder = new TextEncoder();
	const subscriber = createRedisSubscriber();
	const channel = getLongProcessEventsChannel();

	await subscriber.subscribe(channel);

	let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			const sendEvent = (event: string, payload: unknown) => {
				controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
			};

			subscriber.on('message', (_messageChannel, message) => {
				try {
					const parsed = JSON.parse(message);
					sendEvent(parsed.event || 'message', parsed.payload || parsed);
				} catch {
					sendEvent('message', { message });
				}
			});

			getWriteLock().then((lock) => {
				sendEvent('snapshot', { lock });
			});

			heartbeatInterval = setInterval(() => {
				sendEvent('heartbeat', { timestamp: new Date().toISOString() });
			}, 30000);
		},
		cancel() {
			if (heartbeatInterval) {
				clearInterval(heartbeatInterval);
			}
			subscriber.unsubscribe(channel).catch(() => undefined);
			subscriber.quit().catch(() => undefined);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive'
		}
	});
};
