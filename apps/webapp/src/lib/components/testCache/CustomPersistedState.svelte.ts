// Global registry to track instances by key
const instanceRegistry = new Map<string, Set<CustomPersistedState<any>>>();

export class CustomPersistedState<DataType extends any> {
	current = $state<DataType>();
	private isUpdating = false;
	private storageEventHandler?: (e: StorageEvent) => void;

	constructor(
		private key: string,
		private initialValue: DataType,
		private options: {
			storage: 'local' | 'session';
			syncTabs: boolean;
			serialize?: (value: DataType) => string;
			deserialize?: (value: string) => DataType;
			uniquekey?: string;
		} = {
			storage: 'local',
			syncTabs: false,
			uniquekey: 'CPS-'
		}
	) {
		this.current = this.loadFromStorage();
		this.registerInstance();
		this.setupStorageSync();
	}

	private get storage(): Storage | null {
		if (typeof window === 'undefined') return null;
		return this.options.storage === 'local' ? window.localStorage : window.sessionStorage;
	}

	private getCompositeKey(): string {
		return this.options.uniquekey ? `${this.key}:${this.options.uniquekey}` : this.key;
	}

	private registerInstance(): void {
		if (!instanceRegistry.has(this.key)) {
			instanceRegistry.set(this.key, new Set());
		}
		instanceRegistry.get(this.key)!.add(this);
	}

	private unregisterInstance(): void {
		const instances = instanceRegistry.get(this.key);
		if (instances) {
			instances.delete(this);
			if (instances.size === 0) {
				instanceRegistry.delete(this.key);
			}
		}
	}

	private syncOtherInstances(value: DataType): void {
		const instances = instanceRegistry.get(this.key);
		if (instances) {
			instances.forEach((instance) => {
				if (instance !== this && !instance.isUpdating) {
					instance.isUpdating = true;
					instance.current = value;
					instance.isUpdating = false;
				}
			});
		}
	}

	private loadFromStorage(): DataType {
		try {
			const compositeKey = this.getCompositeKey();
			const stored = this.storage?.getItem(compositeKey);
			if (stored) {
				const deserialize = this.options.deserialize ?? JSON.parse;
				return deserialize(stored);
			}
		} catch (error) {
			console.warn(`Failed to load persisted state for key "${this.getCompositeKey()}":`, error);
		}
		return this.initialValue;
	}

	private saveToStorage(value: DataType): void {
		try {
			const serialize = this.options.serialize ?? JSON.stringify;
			const compositeKey = this.getCompositeKey();
			this.storage?.setItem(compositeKey, serialize(value));
		} catch (error) {
			console.warn(`Failed to save persisted state for key "${this.getCompositeKey()}":`, error);
		}
	}

	private setupStorageSync(): void {
		if (typeof window === 'undefined') return;

		// Watch for changes to current and persist them
		$effect(() => {
			if (this.current !== undefined && !this.isUpdating) {
				this.saveToStorage(this.current);
				this.syncOtherInstances(this.current);
			}
		});

		// Set up cross-tab synchronization if enabled
		if (this.options.syncTabs && this.options.storage === 'local') {
			this.storageEventHandler = (e: StorageEvent) => {
				const compositeKey = this.getCompositeKey();
				if (e.key === compositeKey && e.newValue && !this.isUpdating) {
					try {
						const deserialize = this.options.deserialize ?? JSON.parse;
						const newValue = deserialize(e.newValue);
						this.isUpdating = true;
						this.current = newValue;
						this.isUpdating = false;
						this.syncOtherInstances(newValue);
					} catch (error) {
						console.warn(`Failed to sync state from storage for key "${compositeKey}":`, error);
					}
				}
			};
			window.addEventListener('storage', this.storageEventHandler);
		}
	}

	newKey(key: string, newInitialValue?: DataType): void {
		// Unregister from current key
		this.unregisterInstance();

		// Update key and initial value
		this.key = key;
		if (newInitialValue !== undefined) {
			this.initialValue = newInitialValue;
		}

		// Load value from new key or use initial value
		this.current = this.loadFromStorage();

		// Register with new key
		this.registerInstance();

		// Sync other instances with the same new key
		this.syncOtherInstances(this.current);
	}

	reset(): void {
		this.current = this.initialValue;
		const compositeKey = this.getCompositeKey();
		this.storage?.removeItem(compositeKey);
		this.syncOtherInstances(this.initialValue);
	}

	destroy(): void {
		this.unregisterInstance();
		// Clean up storage event listener
		if (this.storageEventHandler) {
			window.removeEventListener('storage', this.storageEventHandler);
			this.storageEventHandler = undefined;
		}
	}
}
