import { relations } from "drizzle-orm";
import { pgTable, serial, varchar, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Permission definitions table
export const permissionDefinitions = pgTable("permission_definitions", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table (Auth.js compatible + PBAC)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("teacher"), // superadmin, admin, teacher
  permissions: text("permissions").array().default([]), // ['super'], ['admin'], ['view'], etc.
  courseIds: integer("course_ids").array().default([]), // Courses this teacher can teach
  schoolId: integer("school_id").references(() => schools.id),
  phone: varchar("phone", { length: 50 }),
  info: text("info"),
  active: boolean("active").default(true),
  lastChangedAt: timestamp("last_changed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table (separate - may not have login yet)
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  schoolId: integer("school_id").references(() => schools.id),
  parentName: varchar("parent_name", { length: 255 }),
  parentPhone: varchar("parent_phone", { length: 50 }),
  info: text("info"),
  classId: integer("class_id"),
  phone: text("phone"),
  active: boolean("active").default(true),
  lastChangedAt: timestamp("last_changed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  level: varchar("level", { length: 50, enum: ["beginner", "intermediate", "advanced"] }),
  totalSessions: integer("total_sessions").notNull().default(1),
  sessionDurationMinutes: integer("session_duration_minutes").default(60),
  scheduleDays: text("schedule_days").array().default([]),
  scheduleTime: varchar("schedule_time", { length: 100 }),
  teacherId: integer("teacher_id").references(() => users.id),
  schoolId: integer("school_id").references(() => schools.id),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Course Materials table
export const courseMaterials = pgTable("course_materials", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  type: varchar("type", { length: 50, enum: ["manual", "textbook", "link", "file"] }).notNull(),
  url: text("url").notNull(),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Course Progress table
export const studentCourseProgress = pgTable("student_course_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  currentSession: integer("current_session").default(1),
  completedSessions: integer("completed_sessions").default(0),
  status: varchar("status", {
    length: 50,
    enum: ["not_started", "in_progress", "completed", "on_pause"],
  }).default("not_started"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Auth.js adapter tables
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).unique().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull(),
});

// Relations
export const coursesRelations = relations(courses, ({ one, many }) => ({
  school: one(schools, {
    fields: [courses.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [courses.teacherId],
    references: [users.id],
  }),
  materials: many(courseMaterials),
  progress: many(studentCourseProgress),
}));

export const courseMaterialsRelations = relations(courseMaterials, ({ one }) => ({
  course: one(courses, {
    fields: [courseMaterials.courseId],
    references: [courses.id],
  }),
}));

export const studentCourseProgressRelations = relations(studentCourseProgress, ({ one }) => ({
  student: one(students, {
    fields: [studentCourseProgress.studentId],
    references: [students.id],
  }),
  course: one(courses, {
    fields: [studentCourseProgress.courseId],
    references: [courses.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  courses: many(courses),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  courseProgress: many(studentCourseProgress),
}));

// Types
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type CourseMaterial = typeof courseMaterials.$inferSelect;
export type NewCourseMaterial = typeof courseMaterials.$inferInsert;

export type StudentCourseProgress = typeof studentCourseProgress.$inferSelect;
export type NewStudentCourseProgress = typeof studentCourseProgress.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type PermissionDefinition = typeof permissionDefinitions.$inferSelect;
export type NewPermissionDefinition = typeof permissionDefinitions.$inferInsert;
