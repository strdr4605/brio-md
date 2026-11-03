-- ============================================================================
-- Neon Serverless Postgres Audit Query
-- 30 Isolated Pilot Demo Accounts & Activity Tracker
-- ============================================================================
-- Purpose:
-- Tracks login activity and resource creation (students, courses)
-- across isolated pilot sandbox schools in Moldova.
--
-- Launch Date Filter:
-- Update '2026-11-01 00:00:00+00' to the actual pilot launch timestamp as needed.
-- ============================================================================

SELECT
  u.email AS tester_email,
  u.role AS user_role,
  s.name AS school_name,
  u.last_login_at AS last_activity,
  COUNT(DISTINCT st.id) FILTER (WHERE st.created_at > '2026-11-01 00:00:00+00') AS students_created_after_launch,
  COUNT(DISTINCT st.id) AS total_students,
  COUNT(DISTINCT c.id) FILTER (WHERE c.created_at > '2026-11-01 00:00:00+00') AS courses_added_after_launch,
  COUNT(DISTINCT c.id) AS total_courses
FROM users u
JOIN schools s ON u.school_id = s.id
LEFT JOIN students st ON st.school_id = s.id
LEFT JOIN courses c ON c.school_id = s.id
WHERE u.email LIKE 'demo%@brio.md'
   OR u.email LIKE 'teacher%@brio.md'
   OR s.name LIKE 'Demo School %'
GROUP BY
  u.id,
  u.email,
  u.role,
  s.name,
  u.last_login_at
ORDER BY
  u.last_login_at DESC NULLS LAST,
  u.email ASC;
