-- 1. Re-point foreign keys referencing duplicate schools to the canonical school (min id per name)
UPDATE "users" u
SET "school_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY name) AS min_id
  FROM "schools"
) canonical
WHERE u."school_id" = canonical.id AND canonical.id != canonical.min_id;

UPDATE "courses" c
SET "school_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY name) AS min_id
  FROM "schools"
) canonical
WHERE c."school_id" = canonical.id AND canonical.id != canonical.min_id;

UPDATE "students" s
SET "school_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY name) AS min_id
  FROM "schools"
) canonical
WHERE s."school_id" = canonical.id AND canonical.id != canonical.min_id;

UPDATE "groups" g
SET "school_id" = canonical.min_id
FROM (
  SELECT id, MIN(id) OVER (PARTITION BY name) AS min_id
  FROM "schools"
) canonical
WHERE g."school_id" = canonical.id AND canonical.id != canonical.min_id;

-- 2. Delete duplicate schools keeping only the canonical school with min(id)
DELETE FROM "schools"
WHERE id NOT IN (
  SELECT MIN(id) FROM "schools" GROUP BY name
);

-- 3. Enforce unique constraint on school name
ALTER TABLE "schools" ADD CONSTRAINT "schools_name_unique" UNIQUE("name");