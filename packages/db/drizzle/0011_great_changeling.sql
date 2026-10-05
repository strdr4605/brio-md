CREATE TABLE "course_learning_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"session_number" integer,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_resource_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"resource_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"group_id" integer,
	"teacher_id" integer,
	"status" varchar(50) DEFAULT 'assigned' NOT NULL,
	"score" integer,
	"max_score" integer,
	"teacher_feedback" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "course_learning_resources" ADD CONSTRAINT "course_learning_resources_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_learning_resources" ADD CONSTRAINT "course_learning_resources_resource_id_learning_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."learning_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_resources" ADD CONSTRAINT "learning_resources_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_resource_submissions" ADD CONSTRAINT "student_resource_submissions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_resource_submissions" ADD CONSTRAINT "student_resource_submissions_resource_id_learning_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."learning_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_resource_submissions" ADD CONSTRAINT "student_resource_submissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_resource_submissions" ADD CONSTRAINT "student_resource_submissions_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_resource_submissions" ADD CONSTRAINT "student_resource_submissions_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_learning_resources_course_resource_session_idx" ON "course_learning_resources" USING btree ("course_id","resource_id","session_number");