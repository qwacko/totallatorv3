import { workerRegistry } from '@totallator/bullmq';
import { executeCronJobById, setCronJobEnabled, syncCronDefinitionsAndSchedules } from '../../cron/bullmqCronRuntime';
export const cronControlProcessor = async (job, context) => {
    const payload = job.data.data;
    if (payload.action === 'trigger') {
        const result = await executeCronJobById({
            cronJobId: payload.jobId,
            triggeredBy: 'manual',
            triggeredByUserId: payload.userId
        });
        context.logger('worker').info({
            title: 'Triggered cron job from BullMQ control message',
            code: 'BULLMQ_WORKER_0002',
            jobId: payload.jobId,
            result
        });
        return { success: result.success, data: result };
    }
    if (payload.action === 'toggle') {
        await setCronJobEnabled(payload.jobId, payload.isEnabled, payload.modifiedBy);
        context.logger('worker').info({
            title: 'Updated cron job status from BullMQ control message',
            code: 'BULLMQ_WORKER_0003',
            jobId: payload.jobId,
            isEnabled: payload.isEnabled
        });
        return {
            success: true,
            data: { jobId: payload.jobId, isEnabled: payload.isEnabled }
        };
    }
    await syncCronDefinitionsAndSchedules();
    return {
        success: true,
        data: { action: 'resync' }
    };
};
workerRegistry.registerTyped('cron-control', cronControlProcessor, {
    attempts: 1
});
