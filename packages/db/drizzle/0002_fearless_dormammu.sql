CREATE TABLE "course_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"order_index" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_course_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"current_session" integer DEFAULT 1,
	"completed_sessions" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'not_started',
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "level" varchar(50);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "total_sessions" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "session_duration_minutes" integer DEFAULT 60;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "schedule_days" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "schedule_time" varchar(100);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "teacher_id" integer;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "active" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_progress" ADD CONSTRAINT "student_course_progress_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_progress" ADD CONSTRAINT "student_course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;