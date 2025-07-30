import { tActions } from "@totallator/business-logic";

export const load = async ({ locals }) => {
  const importMappingDropdown = await tActions.importMapping.listForDropdown({
    db: locals.db,
  });
  return {
    importMappingDropdown,
  };
};
