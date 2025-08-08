import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes.server";

export const GET = async (data) => {
  authGuard(data);
  const {
    current: { params },
  } = serverPageInfo(data.route.id, data);

  if (!params || !params.filename || !params.id) {
    throw new Error("No params");
  }

  const fileData = await tActions.file.getFile({
    id: params.id,
  });

  if (!fileData || !fileData.fileData) {
    throw new Error("No file info");
  }

  const fileContent = await fileData.fileData;

  const uint8Data = new Uint8Array(fileContent);

  return new Response(uint8Data, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename=${params.filename}`,
    },
  });
};
