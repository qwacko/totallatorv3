CREATE TABLE IF NOT EXISTS "query_log" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"title" text,
	"query" text NOT NULL,
	"time" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"params" text
);
