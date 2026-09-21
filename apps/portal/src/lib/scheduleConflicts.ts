export type ConflictWarning = {
  type: "room" | "teacher" | "name" | "time";
  message: string;
};

export const DAY_LABELS: Record<string, string> = {
  mon: "Luni",
  tue: "Marți",
  wed: "Miercuri",
  thu: "Joi",
  fri: "Vineri",
  sat: "Sâmbătă",
  sun: "Duminică",
};

export function normalizeDay(day: string): string {
  const d = day.trim().toLowerCase();
  if (d.startsWith("lu") || d.startsWith("mon")) return "mon";
  if (d.startsWith("ma") || d.startsWith("tue")) return "tue";
  if (d.startsWith("mi") || d.startsWith("wed")) return "wed";
  if (d.startsWith("jo") || d.startsWith("thu")) return "thu";
  if (d.startsWith("vi") || d.startsWith("fri")) return "fri";
  if (d.startsWith("sâ") || d.startsWith("sa") || d.startsWith("sat")) return "sat";
  if (d.startsWith("du") || d.startsWith("sun")) return "sun";
  return d;
}

export function parseTimeRange(timeStr?: string | null): [number, number] | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const [_, h1, m1, h2, m2] = match;
  const hour1 = parseInt(h1, 10);
  const min1 = parseInt(m1, 10);
  const hour2 = parseInt(h2, 10);
  const min2 = parseInt(m2, 10);

  if (hour1 > 23 || min1 > 59 || hour2 > 23 || min2 > 59) return null;

  const startMinutes = hour1 * 60 + min1;
  const endMinutes = hour2 * 60 + min2;
  return [startMinutes, endMinutes];
}

export function areTimesOverlapping(t1: [number, number], t2: [number, number]): boolean {
  return Math.max(t1[0], t2[0]) < Math.min(t1[1], t2[1]);
}

export function getOverlappingDays(days1?: string[] | null, days2?: string[] | null): string[] {
  if (!days1?.length || !days2?.length) return [];
  const norm1 = new Set(days1.map(normalizeDay));
  return days2.map(normalizeDay).filter((d) => norm1.has(d));
}

export type DetectGroupConflictParams = {
  name: string;
  courseId: number;
  excludeGroupId?: number;
  room?: string | null;
  teacherId?: number | null;
  scheduleDays?: string[];
  scheduleTime?: string | null;
  existingGroups: Array<{
    id: number;
    name: string;
    courseId: number;
    courseName?: string | null;
    room?: string | null;
    teacherId?: number | null;
    scheduleDays?: string[] | null;
    scheduleTime?: string | null;
    active?: boolean | null;
  }>;
}

export function detectGroupConflicts(params: DetectGroupConflictParams): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const { name, excludeGroupId, room, teacherId, scheduleDays, scheduleTime, existingGroups } = params;

  const cleanName = name.trim().toLowerCase();
  const cleanRoom = room?.trim().toLowerCase();
  const parsedTime = parseTimeRange(scheduleTime);

  if (scheduleTime && scheduleTime.trim() !== "") {
    if (!parsedTime) {
      warnings.push({
        type: "time",
        message: "Format orar invalid. Folosiți formatul 'HH:MM - HH:MM' (ex: 17:30 - 18:30).",
      });
    } else if (parsedTime[0] >= parsedTime[1]) {
      warnings.push({
        type: "time",
        message: "Interval orar invalid: ora de sfârșit trebuie să fie după ora de început.",
      });
    }
  }

  for (const group of existingGroups) {
    if (excludeGroupId && group.id === excludeGroupId) continue;
    if (group.active === false) continue;

    // Check duplicate name within school
    if (cleanName !== "" && group.name.trim().toLowerCase() === cleanName) {
      warnings.push({
        type: "name",
        message: `Există deja o grupă cu denumirea "${group.name}" în această școală.`,
      });
    }

    // Check room and teacher overlaps if days and time exist
    if (parsedTime && parsedTime[0] < parsedTime[1] && scheduleDays && scheduleDays.length > 0) {
      const otherTime = parseTimeRange(group.scheduleTime);
      if (otherTime && areTimesOverlapping(parsedTime, otherTime)) {
        const commonDays = getOverlappingDays(scheduleDays, group.scheduleDays);
        if (commonDays.length > 0) {
          const daysStr = commonDays.map((d) => DAY_LABELS[d] || d).join(", ");

          // Room collision
          if (cleanRoom && group.room && group.room.trim().toLowerCase() === cleanRoom) {
            warnings.push({
              type: "room",
              message: `Conflict de sală: Sala "${group.room}" este deja ocupată de grupa "${group.name}" (${group.courseName || "Curs"}) ${daysStr} între ${group.scheduleTime}.`,
            });
          }

          // Teacher collision
          if (teacherId && group.teacherId && group.teacherId === teacherId) {
            warnings.push({
              type: "teacher",
              message: `Conflict de profesor: Profesorul este deja alocat la grupa "${group.name}" (${group.courseName || "Curs"}) ${daysStr} între ${group.scheduleTime}.`,
            });
          }
        }
      }
    }
  }

  return warnings;
}

export type CourseScheduleItem = {
  id: number;
  name: string;
  scheduleDays?: string[] | null;
  scheduleTime?: string | null;
};

export function detectCourseScheduleConflicts(courses: CourseScheduleItem[]): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  for (let i = 0; i < courses.length; i++) {
    const c1 = courses[i];
    const t1 = parseTimeRange(c1.scheduleTime);
    if (!t1 || !c1.scheduleDays?.length) continue;

    for (let j = i + 1; j < courses.length; j++) {
      const c2 = courses[j];
      const t2 = parseTimeRange(c2.scheduleTime);
      if (!t2 || !c2.scheduleDays?.length) continue;

      if (areTimesOverlapping(t1, t2)) {
        const commonDays = getOverlappingDays(c1.scheduleDays, c2.scheduleDays);
        if (commonDays.length > 0) {
          const daysStr = commonDays.map((d) => DAY_LABELS[d] || d).join(", ");
          warnings.push({
            type: "time",
            message: `Conflict de orar: Cursul "${c1.name}" (${c1.scheduleTime}) și cursul "${c2.name}" (${c2.scheduleTime}) au loc în același timp (${daysStr}).`,
          });
        }
      }
    }
  }
  return warnings;
}

export type GroupScheduleItem = {
  id: number;
  name: string;
  courseName?: string | null;
  scheduleDays?: string[] | null;
  scheduleTime?: string | null;
  active?: boolean | null;
};

export function detectStudentGroupScheduleConflicts(params: {
  targetGroups: GroupScheduleItem[];
  existingGroups?: GroupScheduleItem[];
}): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  const { targetGroups, existingGroups = [] } = params;

  // 1. Check conflicts among target groups themselves
  for (let i = 0; i < targetGroups.length; i++) {
    const g1 = targetGroups[i];
    const t1 = parseTimeRange(g1.scheduleTime);
    if (!t1 || !g1.scheduleDays?.length) continue;

    for (let j = i + 1; j < targetGroups.length; j++) {
      const g2 = targetGroups[j];
      const t2 = parseTimeRange(g2.scheduleTime);
      if (!t2 || !g2.scheduleDays?.length) continue;

      if (areTimesOverlapping(t1, t2)) {
        const commonDays = getOverlappingDays(g1.scheduleDays, g2.scheduleDays);
        if (commonDays.length > 0) {
          const daysStr = commonDays.map((d) => DAY_LABELS[d] || d).join(", ");
          warnings.push({
            type: "time",
            message: `Conflict de orar: Grupele selectate "${g1.name}" (${g1.courseName || "Curs"}) și "${g2.name}" (${g2.courseName || "Curs"}) se suprapun ${daysStr} (${g1.scheduleTime} vs ${g2.scheduleTime}).`,
          });
        }
      }
    }
  }

  // 2. Check conflicts between target groups and existing groups
  for (const tg of targetGroups) {
    const tTarget = parseTimeRange(tg.scheduleTime);
    if (!tTarget || !tg.scheduleDays?.length) continue;

    for (const eg of existingGroups) {
      if (eg.id === tg.id || eg.active === false) continue;
      const tExisting = parseTimeRange(eg.scheduleTime);
      if (!tExisting || !eg.scheduleDays?.length) continue;

      if (areTimesOverlapping(tTarget, tExisting)) {
        const commonDays = getOverlappingDays(tg.scheduleDays, eg.scheduleDays);
        if (commonDays.length > 0) {
          const daysStr = commonDays.map((d) => DAY_LABELS[d] || d).join(", ");
          warnings.push({
            type: "time",
            message: `Conflict de orar: Studentul este deja înscris la grupa "${eg.name}" (${eg.courseName || "Curs"}), care se suprapune cu "${tg.name}" ${daysStr} (${tg.scheduleTime} vs ${eg.scheduleTime}).`,
          });
        }
      }
    }
  }

  return warnings;
}

export type StudentScheduleItem = {
  courseId: number;
  courseName: string;
  groupId?: number | null;
  groupName?: string | null;
  scheduleDays?: string[] | null;
  scheduleTime?: string | null;
};

export function formatScheduleItemTitle(item: StudentScheduleItem, isFirst = true): string {
  if (item.groupName) {
    return `${isFirst ? "Grupa" : "grupa"} "${item.groupName}" (${item.courseName})`;
  }
  return `${isFirst ? "Cursul" : "cursul"} "${item.courseName}"`;
}

export function detectStudentScheduleConflicts(items: StudentScheduleItem[]): ConflictWarning[] {
  const warnings: ConflictWarning[] = [];
  for (let i = 0; i < items.length; i++) {
    const s1 = items[i];
    const t1 = parseTimeRange(s1.scheduleTime);
    if (!t1 || !s1.scheduleDays?.length) continue;

    for (let j = i + 1; j < items.length; j++) {
      const s2 = items[j];
      const t2 = parseTimeRange(s2.scheduleTime);
      if (!t2 || !s2.scheduleDays?.length) continue;

      if (areTimesOverlapping(t1, t2)) {
        const commonDays = getOverlappingDays(s1.scheduleDays, s2.scheduleDays);
        if (commonDays.length > 0) {
          const daysStr = commonDays.map((d) => DAY_LABELS[d] || d).join(", ");
          const title1 = formatScheduleItemTitle(s1, true);
          const title2 = formatScheduleItemTitle(s2, false);
          warnings.push({
            type: "time",
            message: `Conflict de orar: ${title1} (${s1.scheduleTime}) și ${title2} (${s2.scheduleTime}) au loc în același timp (${daysStr}).`,
          });
        }
      }
    }
  }
  return warnings;
}

export type GroupConflictResult = {
  hasConflict: boolean;
  conflictingGroup?: GroupScheduleItem;
  reason?: string;
};

/**
 * Checks if a candidate group has a schedule time conflict with any already selected group.
 * If candidateGroup is already part of selectedGroups, it does NOT conflict with itself.
 */
export function findGroupConflictWithSelected({
  candidateGroup,
  selectedGroups,
}: {
  candidateGroup: GroupScheduleItem;
  selectedGroups: GroupScheduleItem[];
}): GroupConflictResult {
  if (selectedGroups.some((g) => g.id === candidateGroup.id)) {
    return { hasConflict: false };
  }

  const candidateTime = parseTimeRange(candidateGroup.scheduleTime);
  if (!candidateTime || !candidateGroup.scheduleDays?.length) {
    return { hasConflict: false };
  }

  for (const selected of selectedGroups) {
    if (selected.id === candidateGroup.id || selected.active === false) continue;
    const selectedTime = parseTimeRange(selected.scheduleTime);
    if (!selectedTime || !selected.scheduleDays?.length) continue;

    if (areTimesOverlapping(candidateTime, selectedTime)) {
      const commonDays = getOverlappingDays(candidateGroup.scheduleDays, selected.scheduleDays);
      if (commonDays.length > 0) {
        const daysStr = commonDays.map((d) => DAY_LABELS[d] || d).join(", ");
        return {
          hasConflict: true,
          conflictingGroup: selected,
          reason: `Se suprapune cu "${selected.name}" (${selected.courseName || "Curs"}) ${daysStr} (${selected.scheduleTime})`,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Checks if a student (who has a list of active group enrollments) has a schedule conflict with a target group.
 */
export function findStudentConflictWithTargetGroup({
  targetGroup,
  studentActiveGroups,
}: {
  targetGroup: GroupScheduleItem;
  studentActiveGroups: GroupScheduleItem[];
}): GroupConflictResult {
  const targetTime = parseTimeRange(targetGroup.scheduleTime);
  if (!targetTime || !targetGroup.scheduleDays?.length) {
    return { hasConflict: false };
  }

  for (const enrolled of studentActiveGroups) {
    if (enrolled.id === targetGroup.id || enrolled.active === false) continue;
    const enrolledTime = parseTimeRange(enrolled.scheduleTime);
    if (!enrolledTime || !enrolled.scheduleDays?.length) continue;

    if (areTimesOverlapping(targetTime, enrolledTime)) {
      const commonDays = getOverlappingDays(targetGroup.scheduleDays, enrolled.scheduleDays);
      if (commonDays.length > 0) {
        const daysStr = commonDays.map((d) => DAY_LABELS[d] || d).join(", ");
        return {
          hasConflict: true,
          conflictingGroup: enrolled,
          reason: `Studentul este deja înscris la "${enrolled.name}" (${enrolled.courseName || "Curs"}) ${daysStr} (${enrolled.scheduleTime})`,
        };
      }
    }
  }

  return { hasConflict: false };
}

