import {
	type Counter,
	type Histogram,
	type Meter,
	metrics,
	type UpDownCounter
} from '@opentelemetry/api';

export class Metrics {
	private meter: Meter;
	private counters = new Map<string, Counter>();
	private histograms = new Map<string, Histogram>();
	private upDownCounters = new Map<string, UpDownCounter>();

	constructor(serviceName: string, serviceVersion: string) {
		this.meter = metrics.getMeter(serviceName, serviceVersion);
	}

	createCounter(name: string, options?: { description?: string; unit?: string }): Counter {
		if (!this.counters.has(name)) {
			this.counters.set(name, this.meter.createCounter(name, options));
		}

		return this.counters.get(name)!;
	}

	createHistogram(
		name: string,
		options?: { description?: string; unit?: string; boundaries?: number[] }
	): Histogram {
		if (!this.histograms.has(name)) {
			this.histograms.set(name, this.meter.createHistogram(name, options));
		}

		return this.histograms.get(name)!;
	}

	createUpDownCounter(
		name: string,
		options?: { description?: string; unit?: string }
	): UpDownCounter {
		if (!this.upDownCounters.has(name)) {
			this.upDownCounters.set(name, this.meter.createUpDownCounter(name, options));
		}

		return this.upDownCounters.get(name)!;
	}
}

let metricsInstance: Metrics | null = null;

export const initMetrics = (serviceName: string, serviceVersion = '1.0.0') => {
	if (!metricsInstance) {
		metricsInstance = new Metrics(serviceName, serviceVersion);
	}

	return metricsInstance;
};

export const getMetrics = () => {
	if (!metricsInstance) {
		throw new Error('Metrics not initialized');
	}

	return metricsInstance;
};
