import { mergeRouters } from "../trpc";
import { submissionRouter } from "./submission";
import { attendanceRouter } from "./attendance";

export const lessonRouter = mergeRouters(submissionRouter, attendanceRouter);
