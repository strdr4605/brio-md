import { z } from "zod";
import { router, teacherProcedure } from "../trpc";
import {
  getLessonAttendanceService,
  markLessonAttendanceService,
  submitWorksheetService,
  finalizeLessonAttendanceService,
} from "../attendanceService";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formatul datei trebuie să fie YYYY-MM-DD")
  .refine((d) => !isNaN(Date.parse(d)), "Dată calendaristică invalidă");

const commentSchema = z
  .string()
  .trim()
  .max(500, "Comentariul nu poate depăși 500 de caractere")
  .nullable()
  .optional();

export const getLessonAttendanceSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive().optional(),
  date: dateSchema.optional(),
});

export const markLessonAttendanceSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive().optional(),
  studentId: z.number().int().positive(),
  date: dateSchema,
  status: z.enum(["present", "late", "absent", "excused"]).nullable(),
  comment: commentSchema,
});

export const submitWorksheetSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive().optional(),
  studentId: z.number().int().positive(),
  date: dateSchema.optional(),
});

export const finalizeLessonAttendanceSchema = z.object({
  courseId: z.number().int().positive(),
  groupId: z.number().int().positive().optional(),
  date: dateSchema,
  records: z.array(
    z.object({
      studentId: z.number().int().positive(),
      status: z.enum(["present", "late", "absent", "excused"]),
      comment: commentSchema,
    }),
  ).max(200, "Numărul maxim de înregistrări este 200"),
});

export const attendanceRouter = router({
  getLessonAttendance: teacherProcedure
    .input(getLessonAttendanceSchema)
    .query(async ({ ctx, input }) => {
      return getLessonAttendanceService({
        courseId: input.courseId,
        groupId: input.groupId,
        date: input.date,
        user: ctx.user,
      });
    }),

  markLessonAttendance: teacherProcedure
    .input(markLessonAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      return markLessonAttendanceService({
        courseId: input.courseId,
        groupId: input.groupId,
        studentId: input.studentId,
        date: input.date,
        status: input.status,
        comment: input.comment,
        user: ctx.user,
      });
    }),

  quickMark: teacherProcedure
    .input(markLessonAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      return markLessonAttendanceService({
        courseId: input.courseId,
        groupId: input.groupId,
        studentId: input.studentId,
        date: input.date,
        status: input.status,
        comment: input.comment,
        user: ctx.user,
      });
    }),

  submitWorksheet: teacherProcedure
    .input(submitWorksheetSchema)
    .mutation(async ({ ctx, input }) => {
      return submitWorksheetService({
        courseId: input.courseId,
        groupId: input.groupId,
        studentId: input.studentId,
        date: input.date,
        user: ctx.user,
      });
    }),

  finalizeLessonAttendance: teacherProcedure
    .input(finalizeLessonAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      return finalizeLessonAttendanceService({
        courseId: input.courseId,
        groupId: input.groupId,
        date: input.date,
        records: input.records,
        user: ctx.user,
      });
    }),
});
