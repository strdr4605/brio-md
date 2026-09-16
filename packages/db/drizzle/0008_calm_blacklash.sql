-- 1. Enrich canonical records (min id per school_id, name) with non-null attributes (e.g. age) from duplicates
UPDATE "students" s
SET "age" = sub.age
FROM (
  SELECT school_id, name, MAX(age) AS age
  FROM "students"
  WHERE age IS NOT NULL
  GROUP BY school_id, name
) sub
WHERE s.school_id = sub.school_id
  AND s.name = sub.name
  AND s.age IS NULL;

-- 2. Resolve student_course_progress collisions by removing redundant 0-session progress rows
DELETE FROM "student_course_progress"
WHERE id IN (
  WITH canonical_students AS (
    SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS canonical_id
    FROM "students"
  ),
  progress_ranked AS (
    SELECT 
      scp.id,
      ROW_NUMBER() OVER (
        PARTITION BY cs.canonical_id, scp.course_id 
        ORDER BY scp.completed_sessions DESC, scp.current_session DESC, scp.id DESC
      ) as rn
    FROM "student_course_progress" scp
    JOIN canonical_students cs ON scp.student_id = cs.id
  )
  SELECT id FROM progress_ranked WHERE rn > 1
);

-- 3. Re-point foreign keys referencing duplicate students to the canonical student (min id per school_id, name)
UPDATE "student_course_progress" scp
SET "student_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS min_id
  FROM "students"
) canonical
WHERE scp."student_id" = canonical.id AND canonical.id != canonical.min_id;

UPDATE "student_group_enrollments" sge
SET "student_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS min_id
  FROM "students"
) canonical
WHERE sge."student_id" = canonical.id AND canonical.id != canonical.min_id;

UPDATE "attendance_records" ar
SET "student_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS min_id
  FROM "students"
) canonical
WHERE ar."student_id" = canonical.id AND canonical.id != canonical.min_id;

UPDATE "users" u
SET "student_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY school_id, name) AS min_id
  FROM "students"
) canonical
WHERE u."student_id" = canonical.id AND canonical.id != canonical.min_id;

-- 4. Delete duplicate students keeping only the canonical student with min(id)
DELETE FROM "students"
WHERE id NOT IN (
  SELECT MIN(id) FROM "students" GROUP BY school_id, name
);

-- 5. Create unique index on students (school_id, name, phone)
CREATE UNIQUE INDEX "students_school_name_phone_idx" ON "students" USING btree ("school_id","name","phone");