import { browser } from '$app/environment';

type Resolvable<T> = T | (() => T);
type MessageCallback = (event: MessageEvent<string>) => void;
type ErrorCallback = (event: Event) => void;
type StatusCallback = (status: SSEConnectionStatus) => void;

const DEFAULT_EVENT_NAME = 'message';

export type SSEConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

function normalize<T>(value: Resolvable<T> | undefined | null): T | undefined {
	if (value == null) {
		return undefined;
	}

	if (typeof value === 'function') {
		return (value as () => T)();
	}

	return value;
}

class SharedSseConnection {
	private source: EventSource | null = null;
	private subscriptions = new Map<string, Set<MessageCallback>>();
	private errorSubscriptions = new Set<ErrorCallback>();
	private statusSubscriptions = new Set<StatusCallback>();
	private eventHandlers = new Map<string, MessageCallback>();
	private status: SSEConnectionStatus = 'idle';
	private hasConnected = false;

	constructor(private readonly url: string) {}

	subscribe(eventName: string, callback: MessageCallback): () => void {
		const key = eventName || DEFAULT_EVENT_NAME;
		const callbacks = this.subscriptions.get(key) ?? new Set<MessageCallback>();
		const hadEventCallbacks = callbacks.size > 0;
		callbacks.add(callback);
		this.subscriptions.set(key, callbacks);

		this.connect();
		if (!hadEventCallbacks) {
			this.attachEventHandler(key);
		}

		return () => {
			const existing = this.subscriptions.get(key);
			if (!existing) {
				return;
			}

			existing.delete(callback);
			if (existing.size === 0) {
				this.detachEventHandler(key);
				this.subscriptions.delete(key);
			}

			if (
				this.subscriptions.size === 0 &&
				this.errorSubscriptions.size === 0 &&
				this.statusSubscriptions.size === 0
			) {
				this.disconnect();
			}
		};
	}

	subscribeError(callback: ErrorCallback): () => void {
		this.errorSubscriptions.add(callback);
		this.connect();

		return () => {
			this.errorSubscriptions.delete(callback);
			if (
				this.subscriptions.size === 0 &&
				this.errorSubscriptions.size === 0 &&
				this.statusSubscriptions.size === 0
			) {
				this.disconnect();
			}
		};
	}

	subscribeStatus(callback: StatusCallback): () => void {
		this.statusSubscriptions.add(callback);
		callback(this.status);
		this.connect();

		return () => {
			this.statusSubscriptions.delete(callback);
			if (
				this.subscriptions.size === 0 &&
				this.errorSubscriptions.size === 0 &&
				this.statusSubscriptions.size === 0
			) {
				this.disconnect();
			}
		};
	}

	private connect(): void {
		if (!browser || this.source) {
			return;
		}

		this.setStatus(this.hasConnected ? 'reconnecting' : 'connecting');
		this.source = new EventSource(this.url);
		this.source.onopen = () => {
			this.hasConnected = true;
			this.setStatus('connected');
		};
		this.source.onerror = (event) => {
			this.setStatus(this.source?.readyState === EventSource.CONNECTING ? 'reconnecting' : 'error');
			for (const callback of this.errorSubscriptions) {
				callback(event);
			}
		};

		for (const eventName of this.subscriptions.keys()) {
			this.attachEventHandler(eventName);
		}
	}

	private disconnect(): void {
		if (!this.source) {
			return;
		}

		for (const eventName of this.eventHandlers.keys()) {
			this.detachEventHandler(eventName);
		}

		this.source.close();
		this.source = null;
		this.setStatus('idle');
	}

	private setStatus(status: SSEConnectionStatus): void {
		if (this.status === status) {
			return;
		}

		this.status = status;
		for (const callback of this.statusSubscriptions) {
			callback(status);
		}
	}

	private attachEventHandler(eventName: string): void {
		if (!this.source || this.eventHandlers.has(eventName)) {
			return;
		}

		const handler: MessageCallback = (event) => {
			const callbacks = this.subscriptions.get(eventName);
			if (!callbacks) {
				return;
			}

			for (const callback of callbacks) {
				callback(event);
			}
		};

		this.eventHandlers.set(eventName, handler);

		if (eventName === DEFAULT_EVENT_NAME) {
			this.source.onmessage = handler;
			return;
		}

		this.source.addEventListener(eventName, handler as EventListener);
	}

	private detachEventHandler(eventName: string): void {
		const handler = this.eventHandlers.get(eventName);
		if (!handler) {
			return;
		}

		if (this.source) {
			if (eventName === DEFAULT_EVENT_NAME) {
				this.source.onmessage = null;
			} else {
				this.source.removeEventListener(eventName, handler as EventListener);
			}
		}

		this.eventHandlers.delete(eventName);
	}
}

const connectionsByUrl = new Map<string, SharedSseConnection>();

function getSharedConnection(url: string): SharedSseConnection {
	const existing = connectionsByUrl.get(url);
	if (existing) {
		return existing;
	}

	const created = new SharedSseConnection(url);
	connectionsByUrl.set(url, created);
	return created;
}

export interface SSEOptions<
	TEventMap extends Record<string, unknown>,
	TEvent extends keyof TEventMap
> {
	url: Resolvable<string | undefined | null>;
	event?: Resolvable<TEvent | undefined | null>;
	callback: (data: TEventMap[TEvent]) => void;
	onError?: (event: Event) => void;
	onStatusChange?: (status: SSEConnectionStatus) => void;
}

export function useSSE<
	TEventMap extends Record<string, unknown>,
	TEvent extends keyof TEventMap = keyof TEventMap
>(options: SSEOptions<TEventMap, TEvent>): void {
	const url = $derived(normalize(options.url));
	const eventName = $derived((normalize(options.event) ?? DEFAULT_EVENT_NAME) as string);

	$effect(() => {
		if (!browser || !url) {
			return;
		}

		const connection = getSharedConnection(url);
		const unsubscribe = connection.subscribe(eventName, (event) => {
			try {
				options.callback(JSON.parse(event.data) as TEventMap[TEvent]);
			} catch {
				options.callback(event.data as TEventMap[TEvent]);
			}
		});
		const unsubscribeError = options.onError
			? connection.subscribeError(options.onError)
			: () => {};
		const unsubscribeStatus = options.onStatusChange
			? connection.subscribeStatus(options.onStatusChange)
			: () => {};

		return () => {
			unsubscribe();
			unsubscribeError();
			unsubscribeStatus();
		};
	});
}
