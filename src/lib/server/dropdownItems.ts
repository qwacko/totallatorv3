import { tActions } from './db/actions/tActions';
import type { DBType } from './db/db';

export const dropdownItems = ({ db }: { db: DBType }) => {
	return {
		tag: tActions.tag.listForDropdown({ db }),
		category: tActions.category.listForDropdown({ db }),
		bill: tActions.bill.listForDropdown({ db }),
		budget: tActions.budget.listForDropdown({ db }),
		label: tActions.label.listForDropdown({ db }),
		account: tActions.account.listForDropdown({ db }),
		importMapping: tActions.importMapping.listForDropdown({ db })
	};
};

export type DropdownItems = ReturnType<typeof dropdownItems>;
