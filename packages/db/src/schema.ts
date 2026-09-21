import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Schools table
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
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
  studentId: integer("student_id"),
  schoolId: integer("school_id").references(() => schools.id),
  phone: varchar("phone", { length: 50 }),
  info: text("info"),
  active: boolean("active").default(true),
  lastChangedAt: timestamp("last_changed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table (separate - may not have login yet)
export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    schoolId: integer("school_id").references(() => schools.id),
    parentName: varchar("parent_name", { length: 255 }),
    parentPhone: varchar("parent_phone", { length: 50 }),
    info: text("info"),
    classId: integer("class_id"),
    phone: text("phone"),
    age: integer("age"),
    active: boolean("active").default(true),
    lastChangedAt: timestamp("last_changed_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("students_school_name_phone_idx").on(table.schoolId, table.name, table.phone),
  ],
);

// Courses table
export const courses = pgTable(
  "courses",
  {
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
  },
  (table) => [uniqueIndex("courses_school_name_idx").on(table.schoolId, table.name)],
);

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

// Groups table
export const groups = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    schoolId: integer("school_id").references(() => schools.id),
    name: varchar("name", { length: 255 }).notNull(),
    scheduleDays: text("schedule_days").array().default([]),
    scheduleTime: varchar("schedule_time", { length: 100 }),
    room: varchar("room", { length: 255 }),
    teacherId: integer("teacher_id").references(() => users.id),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [uniqueIndex("groups_course_name_idx").on(table.courseId, table.name)],
);

// Student Group Enrollments table
export const studentGroupEnrollments = pgTable(
  "student_group_enrollments",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    courseId: integer("course_id").references(() => courses.id),
    status: varchar("status", {
      length: 50,
      enum: ["active", "inactive", "archived", "completed"],
    }).default("active"),
    billingType: varchar("billing_type", {
      length: 50,
      enum: ["subscription_monthly", "subscription_course", "per_lesson", "custom"],
    }).default("subscription_monthly"),
    customPrice: integer("custom_price"),
    discountPercent: integer("discount_percent").default(0),
    joinedAt: timestamp("joined_at").defaultNow(),
    leftAt: timestamp("left_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("student_group_enrollments_student_group_idx").on(table.studentId, table.groupId),
  ],
);

// Attendance Records table
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    courseId: integer("course_id").references(() => courses.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    status: varchar("status", {
      length: 20,
      enum: ["present", "absent", "late", "excused"],
    }).notNull(),
    comment: text("comment"),
    markedByUserId: integer("marked_by_user_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("attendance_records_group_student_date_idx").on(
      table.groupId,
      table.studentId,
      table.date,
    ),
  ],
);

// Invoices table
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    schoolId: integer("school_id").references(() => schools.id),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    enrollmentId: integer("enrollment_id").references(() => studentGroupEnrollments.id, {
      onDelete: "set null",
    }),
    groupId: integer("group_id").references(() => groups.id, { onDelete: "set null" }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    type: varchar("type", {
      length: 50,
      enum: ["subscription", "per_lesson", "situational"],
    }).notNull(),
    status: varchar("status", {
      length: 50,
      enum: ["draft", "issued", "partially_paid", "paid", "overdue", "cancelled"],
    })
      .notNull()
      .default("draft"),
    totalAmount: integer("total_amount").notNull(),
    paidAmount: integer("paid_amount").default(0),
    dueDate: varchar("due_date", { length: 10 }),
    periodStart: varchar("period_start", { length: 10 }),
    periodEnd: varchar("period_end", { length: 10 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [uniqueIndex("invoices_invoice_number_idx").on(table.invoiceNumber)],
);

// Invoice Items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  attendanceId: integer("attendance_id").references(() => attendanceRecords.id, {
    onDelete: "set null",
  }),
  description: varchar("description", { length: 255 }).notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: integer("unit_price").notNull(),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id),
  studentId: integer("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  schoolId: integer("school_id").references(() => schools.id),
  amount: integer("amount").notNull(),
  paymentDate: varchar("payment_date", { length: 10 }).notNull(),
  method: varchar("method", {
    length: 50,
    enum: ["cash", "bank_transfer", "card", "other"],
  }).notNull(),
  receiptNumber: varchar("receipt_number", { length: 100 }),
  notes: text("notes"),
  recordedByUserId: integer("recorded_by_user_id").references(() => users.id),
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
  groups: many(groups),
  enrollments: many(studentGroupEnrollments),
  attendanceRecords: many(attendanceRecords),
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

export const usersRelations = relations(users, ({ many, one }) => ({
  courses: many(courses),
  groups: many(groups),
  markedAttendances: many(attendanceRecords),
  recordedPayments: many(payments),
  student: one(students, {
    fields: [users.studentId],
    references: [students.id],
  }),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  courseProgress: many(studentCourseProgress),
  groupEnrollments: many(studentGroupEnrollments),
  attendanceRecords: many(attendanceRecords),
  invoices: many(invoices),
  payments: many(payments),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  course: one(courses, {
    fields: [groups.courseId],
    references: [courses.id],
  }),
  school: one(schools, {
    fields: [groups.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [groups.teacherId],
    references: [users.id],
  }),
  enrollments: many(studentGroupEnrollments),
  attendanceRecords: many(attendanceRecords),
  invoices: many(invoices),
}));

export const studentGroupEnrollmentsRelations = relations(
  studentGroupEnrollments,
  ({ one, many }) => ({
    student: one(students, {
      fields: [studentGroupEnrollments.studentId],
      references: [students.id],
    }),
    group: one(groups, {
      fields: [studentGroupEnrollments.groupId],
      references: [groups.id],
    }),
    course: one(courses, {
      fields: [studentGroupEnrollments.courseId],
      references: [courses.id],
    }),
    invoices: many(invoices),
  }),
);

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one, many }) => ({
  group: one(groups, {
    fields: [attendanceRecords.groupId],
    references: [groups.id],
  }),
  course: one(courses, {
    fields: [attendanceRecords.courseId],
    references: [courses.id],
  }),
  student: one(students, {
    fields: [attendanceRecords.studentId],
    references: [students.id],
  }),
  markedByUser: one(users, {
    fields: [attendanceRecords.markedByUserId],
    references: [users.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  courses: many(courses),
  groups: many(groups),
  invoices: many(invoices),
  payments: many(payments),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  school: one(schools, {
    fields: [invoices.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [invoices.studentId],
    references: [students.id],
  }),
  enrollment: one(studentGroupEnrollments, {
    fields: [invoices.enrollmentId],
    references: [studentGroupEnrollments.id],
  }),
  group: one(groups, {
    fields: [invoices.groupId],
    references: [groups.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  attendanceRecord: one(attendanceRecords, {
    fields: [invoiceItems.attendanceId],
    references: [attendanceRecords.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
  school: one(schools, {
    fields: [payments.schoolId],
    references: [schools.id],
  }),
  recordedByUser: one(users, {
    fields: [payments.recordedByUserId],
    references: [users.id],
  }),
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

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type StudentGroupEnrollment = typeof studentGroupEnrollments.$inferSelect;
export type NewStudentGroupEnrollment = typeof studentGroupEnrollments.$inferInsert;

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert;

export type PermissionDefinition = typeof permissionDefinitions.$inferSelect;
export type NewPermissionDefinition = typeof permissionDefinitions.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
