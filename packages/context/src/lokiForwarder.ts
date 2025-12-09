interface LokiLogEntry {
	timestamp: number;
	level: string;
	domain: string;
	action?: string;
	code: string;
	title: string;
	message?: string;
	userId?: string;
	requestId?: string;
	routeId?: string;
	traceId?: string;
	spanId?: string;
	[key: string]: any;
}

interface LokiStream {
	stream: Record<string, string>;
	values: [number, string][];
}

interface LokiPushRequest {
	streams: LokiStream[];
}

class LokiForwarder {
	private endpoint: string;
	private buffer: LokiLogEntry[] = [];
	private batchSize: number;
	private flushInterval: number;
	private flushTimer?: NodeJS.Timeout;
	private isEnabled: boolean;

	constructor(options: {
		endpoint: string;
		batchSize?: number;
		flushInterval?: number;
		enabled?: boolean;
	}) {
		this.endpoint = options.endpoint;
		this.batchSize = options.batchSize || 100;
		this.flushInterval = options.flushInterval || 5000;
		this.isEnabled = options.enabled ?? true;

		if (this.isEnabled) {
			this.startFlushTimer();
		}
	}

	private startFlushTimer(): void {
		this.flushTimer = setInterval(() => {
			this.flush();
		}, this.flushInterval);
	}

	addLog(entry: LokiLogEntry): void {
		if (!this.isEnabled) return;

		this.buffer.push(entry);

		if (this.buffer.length >= this.batchSize) {
			this.flush();
		}
	}

	async flush(): Promise<void> {
		if (this.buffer.length === 0) return;

		const logsToSend = [...this.buffer];
		this.buffer = [];

		try {
			await this.sendToLoki(logsToSend);
		} catch (error) {
			console.error('❌ Failed to send logs to Loki:', error);
			// Re-add failed logs to buffer for retry
			this.buffer.unshift(...logsToSend);
		}
	}

	private async sendToLoki(logs: LokiLogEntry[]): Promise<void> {
		if (logs.length === 0) return;

		// Group logs by stream labels
		const streams = new Map<string, LokiLogEntry[]>();

		for (const log of logs) {
			const streamKey = this.getStreamKey(log);
			if (!streams.has(streamKey)) {
				streams.set(streamKey, []);
			}
			streams.get(streamKey)!.push(log);
		}

		// Convert to Loki format
		const lokiStreams: LokiStream[] = [];

		for (const [streamKey, streamLogs] of streams.entries()) {
			const labels = this.parseStreamKey(streamKey);

			const values: [number, string][] = streamLogs.map((log) => [
				log.timestamp,
				JSON.stringify({
					level: log.level,
					domain: log.domain,
					action: log.action,
					code: log.code,
					title: log.title,
					message: log.message,
					userId: log.userId,
					requestId: log.requestId,
					routeId: log.routeId,
					traceId: log.traceId,
					spanId: log.spanId,
					...Object.fromEntries(
						Object.entries(log).filter(
							([key]) =>
								![
									'timestamp',
									'level',
									'domain',
									'action',
									'code',
									'title',
									'message',
									'userId',
									'requestId',
									'routeId',
									'traceId',
									'spanId'
								].includes(key)
						)
					)
				})
			]);

			lokiStreams.push({
				stream: labels,
				values
			});
		}

		const payload: LokiPushRequest = { streams: lokiStreams };

		const response = await fetch(this.endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			throw new Error(`Loki push failed: ${response.status} ${response.statusText}`);
		}
	}

	private getStreamKey(log: LokiLogEntry): string {
		const parts = [
			`service=${log.domain}`,
			log.level,
			log.action && `action=${log.action}`,
			log.userId && `user=${log.userId}`,
			log.traceId && `trace=${log.traceId}`
		].filter(Boolean);

		return parts.join(',');
	}

	private parseStreamKey(streamKey: string): Record<string, string> {
		const labels: Record<string, string> = {};

		for (const part of streamKey.split(',')) {
			const [key, value] = part.split('=');
			if (key && value) {
				labels[key] = value;
			}
		}

		return labels;
	}

	updateConfig(options: {
		endpoint?: string;
		batchSize?: number;
		flushInterval?: number;
		enabled?: boolean;
	}): void {
		if (options.endpoint !== undefined) {
			this.endpoint = options.endpoint;
		}
		if (options.batchSize !== undefined) {
			this.batchSize = options.batchSize;
		}
		if (options.flushInterval !== undefined) {
			this.flushInterval = options.flushInterval;
			if (this.flushTimer) {
				clearInterval(this.flushTimer);
				this.startFlushTimer();
			}
		}
		if (options.enabled !== undefined) {
			this.isEnabled = options.enabled;
			if (this.isEnabled && !this.flushTimer) {
				this.startFlushTimer();
			} else if (!this.isEnabled && this.flushTimer) {
				clearInterval(this.flushTimer);
				this.flushTimer = undefined;
			}
		}
	}

	async shutdown(): Promise<void> {
		if (this.flushTimer) {
			clearInterval(this.flushTimer);
			this.flushTimer = undefined;
		}

		// Flush remaining logs
		await this.flush();
	}

	getStatus(): {
		enabled: boolean;
		bufferSize: number;
		endpoint: string;
	} {
		return {
			enabled: this.isEnabled,
			bufferSize: this.buffer.length,
			endpoint: this.endpoint
		};
	}
}

export { LokiForwarder, type LokiLogEntry };
