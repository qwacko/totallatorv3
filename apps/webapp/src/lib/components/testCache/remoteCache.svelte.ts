// src/lib/remoteCache.svelte.ts
import type { RemoteQueryFunction } from '@sveltejs/kit';
import * as devalue from 'devalue';
import { untrack } from 'svelte';

import { CustomPersistedState } from './CustomPersistedState.svelte';

const globalCache = new WeakMap<Function, Map<string, any>>();

const argToKey = (arg: any) => JSON.stringify(arg);

export function remoteCachePersisted<TArg, TReturn>(
	fn: RemoteQueryFunction<TArg, TReturn>,
	arg: () => TArg | undefined,
	{
		initialValue,
		key,
		storage = 'indexeddb',
		syncTabs = true,
		timeoutMinutes // Default to 60 minutes
	}: {
		initialValue?: TReturn | undefined;
		key?: string;
		storage?: 'local' | 'session' | 'indexeddb';
		syncTabs?: boolean;
		timeoutMinutes?: number | null;
	} = {}
) {
	const functionKey = key || fn.name || 'anonymous';

	// Force localStorage when syncTabs is enabled and storage is sessionStorage (since sessionStorage doesn't support cross-tab sync)
	const effectiveStorage = syncTabs && storage === 'session' ? 'local' : storage;

	let state = new CustomPersistedState<TReturn | undefined>(
		`${functionKey}-${argToKey(arg())}`,
		initialValue,
		{
			deserialize: (val) => devalue.parse(val) as TReturn,
			serialize: (val) => devalue.stringify(val),
			storage: effectiveStorage,
			syncTabs,
			timeoutMinutes
		}
	);

	$inspect('Current State', state);

	let loadingInternal = $state(true);
	let refreshingInternal = $state(true);
	let error = $state<any>();
	let updateTime = $state<Date>(new Date());
	let prevArgToKey = $state<string | undefined>();

	const refresh = (callFunction: boolean = false) => {
		const latestArgs = arg();
		if (latestArgs === undefined) {
			state.current = undefined;
			return;
		}
		const callFunctionFunc = () => {
			fn(latestArgs)
				.then((result) => {
					state.current = result;
					error = undefined;
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

		refreshingInternal = true;
		if (state.current === undefined) {
			loadingInternal = true;
		} else {
			loadingInternal = false;
		}
		if (callFunction) {
			fn(latestArgs)
				.refresh()
				.then(() => {
					callFunctionFunc();
				});
		} else {
			callFunctionFunc();
		}
	};

	//Handle Args Being Updated
	$effect(() => {
		arg();
		untrack(() => {
			if (prevArgToKey !== argToKey(arg())) {
				prevArgToKey = argToKey(arg());
				state.newKey(`${functionKey}-${argToKey(arg())}`, initialValue);
				refresh();
			}
		});
	});

	return {
		get loading() {
			return loadingInternal;
		},
		get refreshing() {
			return refreshingInternal;
		},
		get error() {
			return error;
		},
		get value() {
			return state;
		},
		get updateTime() {
			return updateTime;
		},
		refresh: () => refresh(true),
		setValue: (val: TReturn) => {
			state.current = val;
		}
	};
}

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
