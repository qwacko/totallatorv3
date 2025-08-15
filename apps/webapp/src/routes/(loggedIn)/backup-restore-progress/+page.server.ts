import { getBackupRestoreProgress } from '@totallator/business-logic';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    const progress = await getBackupRestoreProgress();

    if (!progress) {
      throw error(404, 'No backup restore in progress');
    }

    return {
      progress
    };
  } catch (err) {
    console.error('Failed to load backup restore progress:', err);
    throw error(500, 'Failed to load backup restore progress');
  }
};