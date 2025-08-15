import { getBackupRestoreProgress } from '@totallator/business-logic';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const backupId = params.id;

  if (!backupId) {
    throw error(404, 'Backup ID not provided');
  }

  try {
    const progress = await getBackupRestoreProgress(backupId);

    if (!progress) {
      throw error(404, 'Backup restore progress not found');
    }

    return {
      progress,
      backupId
    };
  } catch (err) {
    console.error('Failed to load backup restore progress:', err);
    throw error(500, 'Failed to load backup restore progress');
  }
};