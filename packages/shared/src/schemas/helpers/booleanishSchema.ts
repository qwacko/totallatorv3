import * as z from 'zod';

const trueValues = new Set(['true', '1', 'yes', 'y', 'on']);
const falseValues = new Set(['false', '0', 'no', 'n', 'off']);

const normalizeBooleanish = (value: unknown) => {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'number') {
		if (value === 1) return true;
		if (value === 0) return false;
		return value;
	}

	if (typeof value === 'string') {
		const normalized = value.trim().toLowerCase();

		if (normalized.length === 0) {
			return undefined;
		}

		if (trueValues.has(normalized)) {
			return true;
		}

		if (falseValues.has(normalized)) {
			return false;
		}
	}

	return value;
};

export const booleanishSchema = z.preprocess(normalizeBooleanish, z.boolean());
