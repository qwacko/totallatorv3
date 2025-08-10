import type { DBType } from '@totallator/database';

export const handleLinkedItem = async <T extends { id: string }>({
	id,
	title,
	clear,
	createOrGetItem,
	requireActive,
	db
}: {
	db: DBType;
	id?: string | null;
	title?: string | null;
	clear?: boolean | null;
	requireActive?: boolean;
	createOrGetItem: ({
		db,
		id,
		title,
		requireActive
	}: {
		db: DBType;
		id?: string | null;
		title?: string | null;
		requireActive?: boolean;
	}) => Promise<T | undefined | null>;
}) => {
	if (clear) {
		return null;
	}

	//Deal with ID being the text "undefined".
	const tidiedId = id ? (id === 'undefined' ? undefined : id) : undefined;

	const newItem = await createOrGetItem({ db, id: tidiedId, title, requireActive });

	if (newItem) {
		return newItem.id;
	}
	return undefined;
};
