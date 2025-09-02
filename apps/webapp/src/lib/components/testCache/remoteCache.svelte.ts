// src/lib/remoteCache.svelte.ts
import type { RemoteQueryFunction } from '@sveltejs/kit';
import { untrack } from 'svelte';

const globalCache = new WeakMap<Function, Map<string, any>>();

const argToKey = (arg: any) => JSON.stringify(arg);

export function remoteCache<TArg, TReturn>(
	fn: RemoteQueryFunction<TArg, TReturn>,
	arg: () => TArg | undefined
) {
	const getValueFromCache = (): TReturn | undefined => {
		const valFromCache = globalCache.get(fn)?.get(argToKey(arg()));
		return valFromCache as TReturn | undefined;
	};

	let cachedValue = $state<TReturn | undefined>(getValueFromCache());
	let value = $state<TReturn | undefined>();
	let prevArgToKey = $state<string | undefined>();
	let updateTime = $state<Date>(new Date());

	const setValueInCache = (value: TReturn) => {
		cachedValue = value;
		if (!globalCache.has(fn)) {
			globalCache.set(fn, new Map());
		}
		globalCache.get(fn)?.set(argToKey(arg()), value);
	};

	let loadingInternal = $state(true);
	let refreshingInternal = $state(true);
	let error = $state<any>();

	const refresh = (callFunction: boolean = false) => {
		const latestArgs = arg();
		if (latestArgs === undefined) {
			value = undefined;
			cachedValue = undefined;
			return;
		}
		refreshingInternal = true;
		value = undefined;
		cachedValue = getValueFromCache();
		if (cachedValue === undefined) {
			loadingInternal = true;
		} else {
			loadingInternal = false;
		}
		if (callFunction) {
			fn(latestArgs).refresh();
		}
		fn(latestArgs)
			.then((result) => {
				value = result;
				error = undefined;
				setValueInCache(result);
			})
			.catch((err) => {
				error = err;
			})
			.finally(() => {
				updateTime = new Date();
				refreshingInternal = false;
				loadingInternal = false;
			});
	};

	$effect(() => {
		arg();
		untrack(() => {
			const currentArgKey = argToKey(arg());
			if (prevArgToKey !== currentArgKey) {
				prevArgToKey = currentArgKey;
				refresh();
			}
		});
	});

	const returnValue = $derived.by(() => {
		const allReturn = {
			updateTime: $state.snapshot(updateTime),
			refresh: () => refresh(true)
		};

		if (error) {
			return {
				error: $state.snapshot(error),
				loading: false,
				refreshing: false,
				value: undefined,
				source: 'Error',
				...allReturn
			};
		} else if (loadingInternal) {
			return {
				error: undefined,
				loading: true,
				refreshing: true,
				value: undefined,
				source: 'Loading',
				...allReturn
			};
		} else if (value !== undefined) {
			return {
				error: undefined,
				loading: false,
				refreshing: $state.snapshot(refreshingInternal),
				value: $state.snapshot(value),
				source: 'Value',
				...allReturn
			};
		} else if (cachedValue !== undefined) {
			return {
				error: undefined,
				loading: false,
				refreshing: $state.snapshot(refreshingInternal),
				value: $state.snapshot(cachedValue),
				source: 'Cache',
				...allReturn
			};
		} else {
			return {
				error: undefined,
				loading: false,
				refreshing: $state.snapshot(refreshingInternal),
				value: undefined,
				source: 'No Value',
				...allReturn
			};
		}
	});

	return {
		get value() {
			return returnValue;
		}
	};
}
