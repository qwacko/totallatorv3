# Cron Job Management System

This folder contains cron job definitions and supporting runtime documentation.

From outside this package, the public access points are:

```ts
import { tActions, tHelpers } from '@totallator/business-logic';

const jobs = tHelpers.cron.jobDefinitions;
const listed = await tActions.cronJob.getAllCronJobs();
```

## Architecture Overview

The cron system is built with the following components:

### 1. Database Schema

- **cronJob**: Stores cron job definitions and configuration
- **cronJobExecution**: Tracks individual execution history with detailed metrics
- **cronJobConfig**: Stores global configuration settings

### 2. Core Components

#### Cron Job Definitions

Contains all predefined cron jobs with their schedules and business logic.

**Current Jobs:**

- Database backups
- Journal cleanup and maintenance
- Automatic filter processing
- Session cleanup
- Import processing
- LLM journal processing
- File integrity checks

### 3. Business Logic Actions

Database operations for cron job management:

- `getAllCronJobs()` - Get all jobs with statistics
- `getCronJobById()` - Get specific job details
- `updateCronJobStatus()` - Enable/disable jobs
- `updateCronJobConfig()` - Update job configuration
- `getCronJobExecutions()` - Get execution history
- `cleanupOldExecutions()` - Remove old execution records

## Usage

### Basic Setup

```typescript
import { tActions, tHelpers } from '@totallator/business-logic';

const jobs = tHelpers.cron.jobDefinitions;
const listed = await tActions.cronJob.getAllCronJobs();
```

### Adding New Cron Jobs

1. **Define the Job** in `cronJobDefinitions.ts`:

```typescript
{
  id: 'my-new-job',
  name: 'My New Job',
  description: 'Description of what this job does',
  schedule: '0 * * * *', // Every hour
  isEnabled: true,
  timeoutMs: 120000, // 2 minutes
  maxRetries: 2,
  job: async (context) => {
    // Your job logic here
    try {
      // Perform the work
      return {
        success: true,
        message: 'Job completed successfully',
        metrics: {
          itemsProcessed: 100,
          executionTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  },
}
```

2. **Restart the worker runtime** to pick up new job definitions.

### Manual Job Triggering

```typescript
await tActions.cronExecution.getCronJobExecutions({
	cronJobId: jobId
});
```

### Environment Variable Support

Schedule expressions support environment variable substitution:

```typescript
schedule: '${BACKUP_SCHEDULE}', // Resolves to process.env.BACKUP_SCHEDULE
```

## Frontend Interface

### Admin Dashboard

Access the cron management interface at `/admin/cron` (admin users only).

**Features:**

- View all cron jobs with their status and statistics
- See recent execution history
- Enable/disable jobs
- Manually trigger job execution
- View detailed execution logs and performance metrics

### Job Details Page

Each job has a detailed view at `/admin/cron/{jobId}` showing:

- Complete execution history
- Performance statistics
- Configuration options
- Manual triggering controls

## Configuration

### Job Configuration

Each job can be configured with:

- **Schedule**: Cron expression (supports env var substitution)
- **Timeout**: Maximum execution time in milliseconds
- **Max Retries**: Number of retry attempts on failure
- **Enabled Status**: Whether the job should run automatically

### Global Settings

The system supports global configuration through the `cronJobConfig` table for settings that affect all jobs.

## Monitoring and Logging

### Execution Tracking

Every job execution is tracked with:

- Start and completion timestamps
- Duration and performance metrics
- Success/failure status
- Error messages and stack traces
- Retry count and trigger source

### Logging Integration

Jobs run within the application's logging context, providing:

- Request ID tracking
- Structured logging with job metadata
- Error reporting and debugging information

### Performance Metrics

The system tracks:

- Execution duration
- Memory usage (when available)
- Success/failure rates
- Retry patterns

## Error Handling and Reliability

### Timeout Protection

Jobs that exceed their timeout limit are automatically terminated and marked as timed out.

### Retry Logic

Failed jobs can be automatically retried with:

- Configurable retry counts per job
- Exponential backoff delays (1s, 2s, 4s, up to 30s max)
- Retry execution tracking

### Concurrent Execution Prevention

The system prevents multiple instances of the same job from running simultaneously.

### Graceful Shutdown

The service properly handles shutdown scenarios:

- Cancels all scheduled jobs
- Waits for running jobs to complete (with timeout)
- Cleans up resources

## Database Schema Details

### cronJob Table

```sql
CREATE TABLE cronJob (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule TEXT NOT NULL,
  isEnabled BOOLEAN NOT NULL DEFAULT true,
  timeoutMs INTEGER NOT NULL DEFAULT 120000,
  maxRetries INTEGER NOT NULL DEFAULT 0,
  createdAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  createdBy TEXT NOT NULL DEFAULT 'system',
  lastModifiedBy TEXT NOT NULL DEFAULT 'system'
);
```

### cronJobExecution Table

```sql
CREATE TABLE cronJobExecution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cronJobId UUID NOT NULL REFERENCES cronJob(id) ON DELETE CASCADE,
  startedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completedAt TIMESTAMPTZ,
  durationMs INTEGER,
  status TEXT NOT NULL DEFAULT 'running',
  exitCode INTEGER,
  output TEXT,
  errorMessage TEXT,
  stackTrace TEXT,
  triggeredBy TEXT NOT NULL DEFAULT 'scheduler',
  triggeredByUserId TEXT,
  retryCount INTEGER NOT NULL DEFAULT 0,
  memoryUsageMb INTEGER,
  cpuUsagePercent INTEGER
);
```

## Security Considerations

### Access Control

- Only admin users can access the cron management interface
- All cron operations require admin privileges
- Job execution context includes proper security isolation

### Input Validation

- All user inputs are validated using Zod schemas
- SQL injection protection through parameterized queries
- CSRF protection on all state-changing operations

## Migration from Legacy System

The new system is designed to replace the old cron implementation:

1. **Job Definitions**: All existing jobs have been migrated to the new format
2. **Initialization**: The new service is initialized in `hooks.server.ts`
3. **Environment Variables**: All existing environment variable references are preserved
4. **Backward Compatibility**: Existing job logic is unchanged

## Troubleshooting

### Common Issues

**Jobs Not Running**

- Check if the job is enabled in the database
- Verify the cron schedule expression is valid
- Check application logs for initialization errors

**Performance Issues**

- Monitor job execution times and timeout settings
- Check for resource contention with other jobs
- Review retry patterns for frequently failing jobs

**Database Issues**

- Ensure proper database connectivity
- Check for schema migration completion
- Verify table permissions for the application user

### Debugging

Enable detailed logging by checking job execution history in the admin interface or querying the `cronJobExecution` table directly.

## Future Enhancements

Planned improvements include:

- Real-time job status updates via WebSockets
- Job scheduling from the UI
- Advanced performance analytics
- Job dependency management
- Distributed execution support
