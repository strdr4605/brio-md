ALTER TABLE "schools" ADD COLUMN "schema_name" varchar(100);--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_schema_name_unique" UNIQUE("schema_name");