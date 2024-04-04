---
title: 'Environment Variables'
outline: 'deep'
---

# Environment Variables

There are a number of environment variables that can be used to configure the way that totallator works.

## Configuration

### `ALLOW_SIGNUP`

- Type: `boolean`
- Default: `false`

Can be used to disable (when `false`) the ability to signup from the login page after the first user is created. Users can be created from internal pages.

### `POSTGRES_URL`

- Type: `string`

Set the postgres database access string.

### `RETENTION_MONTHS`

- Type: `number`
- Default: `1`

Sets the number of months to retain automatically created backups for after creation.

### `IMPORT_TIMEOUT_MIN`

- Type: `number`
- Default: `30`

Set maximum timeout that imports can take before a timeout error is generated.

## Monitoring

### `LOGGING`

- Type: `boolean`
- Default: `true`

Purpose : Enable / Disable logging. Should normally be turned on.

### `DEBUG_CLASSES`

- Type: `string` Comma separated list of logging classes to enable.
- Options: `ERROR`, `WARN`, `INFO`, `DEBUG`, `TRACE`
- Default: `ERROR,WARN,INFO`

This turns on different logging classes. Note that at this time there is minimal logging through the app.

### `PAGE_TIMEOUT_MS`

- Type: `number`
- Default: `1000`

Number of milliseconds for a page to take to fulfill a request before generating a `ERROR` message. Can be useful for finding issues.

## Storage

### `BACKUP_DIR`

- Type: `string`
- Default: `./backup`

Directory to store backups. Note that this same environemnt variable can refer to an `s3://...` address to backup to a S3 (or compatible) bucket further details available [here](/advanced/backup)

### `IMPORT_DIR`

- Type: `string`
- Default: `./import`

Directory to store imports. Note that this same environemnt variable can refer to an `s3://...` address to store imports in a S3 (or compatible) bucket further details available [here](/advanced/import)

## Scheduled Tasks

### `AUTOMATIC_FILTER_SCHEDULE`

- Type: `string` (Cron expression)
- Default: `0 * * * *` (Every Hour)

Timing of running automatic filters. Cron Expressions described [here](https://en.wikipedia.org/wiki/Cron).

### `BACKUP_SCHEDULE`

- Type: `string` (Cron expression)
- Default: `0 0 * * *` (Every Day)

Timing of performing automatic backups. Cron Expressions described [here](https://en.wikipedia.org/wiki/Cron).

## Other

### `DISABLE_BUFFERING`

- Type: `boolean`
- Default: `true`

Sets the header value `X-Accel-Buffering` to `no` when true. This is set to assist with streaming data (this makes it so data can be sent before streamed data is complete).

## S3 Settings

Note _all_ these settings must be set in order for S3 to work. The same settings are used across all S3 connections. No descriptions given for individual settings, as these are readily available from S3 compatible providers.

### `S3_ACCESS_KEY`

- Type: `string`

### `S3_SECRET_ACCESS_KEY`

- Type: `string`

### `S3_ACCESS_URL`

- Type: `string`

### `S3_REGION`

- Type: `string`

## Development

Various environment settings that can be used during development (some may also be used in production).

### `DEV_OVERRIDE`

- Type: `boolean`
- Default: `false`

Allows insecure cookies to be used for auth. May be required if service is to be accessed through http rather than https.

### `TESTING_DELAY`

- Type: `number`
- Default `0`

Allows the addition of a delay in some responses to allow for longer delays to be simulated and make sure loading spinners etc... work correctly.

### `TEST_ENV`

- Type: `boolean`
- Default: `false`

Prevents database migrations, and disables some logging. This is used as part of the testing to avoid unnecessary modifications to the database.

### `POSTGRES_TEST_URL`

- Type: `string`

Sets the postgres database to use for testing. If this remains blank, then the production database is used `POSTGRES_URL`

### `DB_QUERY_LOG`

- Type: `boolean`
- Default: `false`

Enables (when in development environment or `DEV_OVERRIDE` is set) logging of all `update` database calls.
