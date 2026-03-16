import { workerRegistry } from '@totallator/bullmq';
export const testJobProcessor = async (job, context) => {
    const timestamp = new Date().toISOString();
    context.logger('worker').info({
        title: 'BullMQ test job executed',
        code: 'BULLMQ_WORKER_0001',
        timestamp,
        jobId: job.id,
        jobData: job.data
    });
    return {
        success: true,
        data: { timestamp }
    };
};
workerRegistry.registerTyped('test-log-job', testJobProcessor, {
    defaultRepeat: '* * * * *',
    attempts: 3
});
