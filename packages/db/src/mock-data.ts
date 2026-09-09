import type { NewCourse, NewCourseMaterial, NewStudentCourseProgress } from "./schema";

export const mockCourses: (NewCourse & { id?: number })[] = [
  {
    id: 1,
    name: "General English A1-A2",
    description:
      "Foundational English course focusing on vocabulary, basic grammar, and conversational skills for beginners.",
    level: "beginner",
    totalSessions: 24,
    sessionDurationMinutes: 60,
    scheduleDays: ["mon", "wed", "fri"],
    scheduleTime: "15:00 - 16:00",
    active: true,
  },
  {
    id: 2,
    name: "Intermediate Robotics & STEM",
    description:
      "Hands-on robotics course covering sensor integration, motor controls, and algorithmic problem solving.",
    level: "intermediate",
    totalSessions: 16,
    sessionDurationMinutes: 90,
    scheduleDays: ["tue", "thu"],
    scheduleTime: "16:30 - 18:00",
    active: true,
  },
  {
    id: 3,
    name: "Advanced Web Engineering",
    description:
      "Deep dive into full-stack development with modern TypeScript, databases, and distributed architectures.",
    level: "advanced",
    totalSessions: 30,
    sessionDurationMinutes: 120,
    scheduleDays: ["sat"],
    scheduleTime: "10:00 - 12:00",
    active: true,
  },
];

export const mockCourseMaterials: (NewCourseMaterial & { id?: number })[] = [
  {
    id: 1,
    courseId: 1,
    title: "English Grammar in Use (5th Edition)",
    type: "textbook",
    url: "https://example.com/materials/english-grammar-in-use.pdf",
    orderIndex: 1,
  },
  {
    id: 2,
    courseId: 1,
    title: "Beginner Audio Listening Exercises",
    type: "link",
    url: "https://example.com/audio/a1-listening",
    orderIndex: 2,
  },
  {
    id: 3,
    courseId: 2,
    title: "LEGO SPIKE Prime Teacher Guide & Lab Manual",
    type: "manual",
    url: "https://example.com/manuals/spike-prime-lab-guide.pdf",
    orderIndex: 1,
  },
  {
    id: 4,
    courseId: 3,
    title: "Fullstack TypeScript System Architecture Docs",
    type: "file",
    url: "https://example.com/docs/fullstack-architecture.pdf",
    orderIndex: 1,
  },
];

export const mockStudentCourseProgress: (NewStudentCourseProgress & { id?: number })[] = [
  {
    id: 1,
    studentId: 1,
    courseId: 1,
    currentSession: 8,
    completedSessions: 7,
    status: "in_progress",
    notes: "Alex is showing good grasp of regular verbs. Needs extra practice with past simple.",
  },
  {
    id: 2,
    studentId: 2,
    courseId: 1,
    currentSession: 24,
    completedSessions: 24,
    status: "completed",
    notes: "Successfully passed the final spoken exam with an A grade.",
  },
  {
    id: 3,
    studentId: 3,
    courseId: 2,
    currentSession: 1,
    completedSessions: 0,
    status: "not_started",
    notes: "Enrolled for upcoming fall semester.",
  },
  {
    id: 4,
    studentId: 4,
    courseId: 2,
    currentSession: 5,
    completedSessions: 4,
    status: "on_pause",
    notes: "Paused due to medical leave; will resume next month.",
  },
];
