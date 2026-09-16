-- 1. Remove stray enrollments for seed students that were duplicated across historical runs
DELETE FROM "student_group_enrollments"
WHERE (student_id = 9 AND group_id NOT IN (1, 3))
   OR (student_id = 6 AND group_id NOT IN (1, 3))
   OR (student_id = 7 AND group_id NOT IN (1))
   OR (student_id = 8 AND group_id NOT IN (2))
   OR (student_id = 4 AND group_id NOT IN (1));
--> statement-breakpoint
-- 2. Re-point duplicate groups in student_group_enrollments to canonical groups (min id per course_id, name)
UPDATE "student_group_enrollments" sge
SET "group_id" = cg.canonical_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY course_id, name) AS canonical_id
  FROM "groups"
) cg
WHERE sge."group_id" = cg.id AND cg.id != cg.canonical_id;
--> statement-breakpoint
-- 3. Delete duplicate groups keeping only min id per course_id, name
DELETE FROM "groups"
WHERE id NOT IN (
  SELECT MIN(id) FROM "groups" GROUP BY course_id, name
);
--> statement-breakpoint
-- 4. Clean up duplicate course materials before re-pointing courses
DELETE FROM "course_materials"
WHERE id IN (
  WITH canonical_courses AS (
    SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
    FROM "courses"
  ),
  materials_ranked AS (
    SELECT 
      cm.id,
      ROW_NUMBER() OVER (
        PARTITION BY cc.canonical_id, cm.title 
        ORDER BY cm.id ASC
      ) as rn
    FROM "course_materials" cm
    JOIN canonical_courses cc ON cm.course_id = cc.id
  )
  SELECT id FROM materials_ranked WHERE rn > 1
);
--> statement-breakpoint
-- 5. Re-point course_materials to canonical course
UPDATE "course_materials" cm
SET "course_id" = cc.canonical_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
  FROM "courses"
) cc
WHERE cm."course_id" = cc.id AND cc.id != cc.canonical_id;
--> statement-breakpoint
-- 6. Clean up duplicate student course progress before re-pointing courses
DELETE FROM "student_course_progress"
WHERE id IN (
  WITH canonical_courses AS (
    SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
    FROM "courses"
  ),
  progress_ranked AS (
    SELECT 
      scp.id,
      ROW_NUMBER() OVER (
        PARTITION BY scp.student_id, cc.canonical_id 
        ORDER BY scp.completed_sessions DESC, scp.current_session DESC, scp.id DESC
      ) as rn
    FROM "student_course_progress" scp
    JOIN canonical_courses cc ON scp.course_id = cc.id
  )
  SELECT id FROM progress_ranked WHERE rn > 1
);
--> statement-breakpoint
-- 7. Re-point student_course_progress to canonical course
UPDATE "student_course_progress" scp
SET "course_id" = cc.canonical_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
  FROM "courses"
) cc
WHERE scp."course_id" = cc.id AND cc.id != cc.canonical_id;
--> statement-breakpoint
-- 8. Re-point groups.course_id to canonical course
UPDATE "groups" g
SET "course_id" = cc.canonical_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
  FROM "courses"
) cc
WHERE g."course_id" = cc.id AND cc.id != cc.canonical_id;
--> statement-breakpoint
-- 9. Re-point student_group_enrollments.course_id to canonical course
UPDATE "student_group_enrollments" sge
SET "course_id" = cc.canonical_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
  FROM "courses"
) cc
WHERE sge."course_id" = cc.id AND cc.id != cc.canonical_id;
--> statement-breakpoint
-- 10. Update users.course_ids array for teachers
UPDATE "users" u
SET "course_ids" = ARRAY(
  SELECT DISTINCT COALESCE(cc.canonical_id, elem)
  FROM unnest(u.course_ids) AS elem
  LEFT JOIN (
    SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
    FROM "courses"
  ) cc ON elem = cc.id
)
WHERE u.course_ids IS NOT NULL AND array_length(u.course_ids, 1) > 0;
--> statement-breakpoint
-- 11. Delete duplicate courses keeping only min id per school_id, name
DELETE FROM "courses"
WHERE id NOT IN (
  SELECT MIN(id) FROM "courses" GROUP BY school_id, name
);
--> statement-breakpoint
-- 12. Create unique indexes on courses and groups
CREATE UNIQUE INDEX "courses_school_name_idx" ON "courses" USING btree ("school_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_course_name_idx" ON "groups" USING btree ("course_id","name");