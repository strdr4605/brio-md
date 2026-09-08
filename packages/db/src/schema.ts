import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  schoolId: integer("school_id").references(() => schools.id),
  active: boolean("active").notNull().default(true),
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
  active: boolean("active").default(true),
  lastChangedAt: timestamp("last_changed_at").defaultNow(),
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

// CRM enums
export const enrollmentTypeEnum = pgEnum("enrollment_type", ["course", "camp"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "paused",
  "cancelled",
  "completed",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent"]);

// Groups (time slot for a course)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  name: varchar("name", { length: 255 }).notNull(),
  teacherId: integer("teacher_id")
    .notNull()
    .references(() => users.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enrollments (student in a group)
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id),
  schoolId: integer("school_id")
    .notNull()
    .references(() => schools.id),
  type: enrollmentTypeEnum("type").notNull(),
  price: integer("price").notNull(),
  status: enrollmentStatusEnum("status").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group sessions (one class meeting)
export const groupSessions = pgTable(
  "group_sessions",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
    schoolId: integer("school_id")
      .notNull()
      .references(() => schools.id),
    date: date("date").notNull(),
    teacherId: integer("teacher_id").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqGroupDate: uniqueIndex("group_sessions_group_date_uniq").on(t.groupId, t.date),
  }),
);

// Attendances
export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    groupSessionId: integer("group_session_id")
      .notNull()
      .references(() => groupSessions.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    status: attendanceStatusEnum("status").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqSessionStudent: uniqueIndex("attendances_session_student_uniq").on(
      t.groupSessionId,
      t.studentId,
    ),
  }),
);

// Types
export type School = typeof schools.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type PermissionDefinition = typeof permissionDefinitions.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type GroupSession = typeof groupSessions.$inferSelect;
export type NewGroupSession = typeof groupSessions.$inferInsert;
export type Attendance = typeof attendances.$inferSelect;
export type NewAttendance = typeof attendances.$inferInsert;
