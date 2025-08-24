CREATE TABLE "cronJob" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"schedule" text NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"timeoutMs" integer DEFAULT 120000 NOT NULL,
	"maxRetries" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdBy" text DEFAULT 'system' NOT NULL,
	"lastModifiedBy" text DEFAULT 'system' NOT NULL,
	CONSTRAINT "cronJob_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "cronJobConfig" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cronJobConfig_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "cronJobExecution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cronJobId" uuid NOT NULL,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone,
	"durationMs" integer,
	"status" text DEFAULT 'running' NOT NULL,
	"exitCode" integer,
	"output" text,
	"errorMessage" text,
	"stackTrace" text,
	"triggeredBy" text DEFAULT 'scheduler' NOT NULL,
	"triggeredByUserId" text,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"memoryUsageMb" integer,
	"cpuUsagePercent" integer
);
--> statement-breakpoint
ALTER TABLE "cronJobExecution" ADD CONSTRAINT "cronJobExecution_cronJobId_cronJob_id_fk" FOREIGN KEY ("cronJobId") REFERENCES "public"."cronJob"("id") ON DELETE cascade ON UPDATE no action;