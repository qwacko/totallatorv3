import { tActions } from "@totallator/business-logic";

import { authGuard } from "$lib/authGuard/authGuardConfig";
import { serverPageInfo } from "$lib/routes";

export const GET = async (data) => {
  authGuard(data);
  const {
    current: { params },
  } = serverPageInfo(data.route.id, data);

  if (!params || !params.filename) {
    throw new Error("No params");
  }

  const backupInfo = await tActions.backup.getBackupInfoByFilename({
    db: data.locals.db,
    filename: params.filename,
  });

  if (!backupInfo) {
    throw new Error("No backup info");
  }

  const fileData = (await tActions.backup.getBackupData({
    id: backupInfo.id,
    returnRaw: true,
    db: data.locals.db,
  })) as Buffer;

  return new Response(fileData, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename=${params.filename}`,
    },
  });
};
