CREATE TABLE IF NOT EXISTS "key_value_table" (
	"key" text NOT NULL,
	"value" text NOT NULL,
	CONSTRAINT "key_value_table_key_unique" UNIQUE("key")
);
