import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { hash } from 'bcryptjs';
import { schools, users, courses } from '@/db/schema';

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Create school
  const [school] = await db.insert(schools).values({
    name: 'Vibe Academy',
  }).returning();
  console.log('✅ Created school:', school.name);
  
  // Create course
  const [course] = await db.insert(courses).values({
    name: 'English',
    schoolId: school.id,
  }).returning();
  console.log('✅ Created course:', course.name);
  
  // Create SuperAdmin
  const superadminHash = await hash('admin123', 12);
  const [superadmin] = await db.insert(users).values({
    email: 'admin@brio.md',
    passwordHash: superadminHash,
    name: 'Super Admin',
    role: 'superadmin',
    permissions: ['super'],
    schoolId: null,
  }).returning();
  console.log('✅ Created SuperAdmin:', superadmin.email);
  
  // Create Admin
  const adminHash = await hash('admin123', 12);
  const [admin] = await db.insert(users).values({
    email: 'admin@vibe.md',
    passwordHash: adminHash,
    name: 'School Admin',
    role: 'admin',
    permissions: ['admin'],
    schoolId: school.id,
  }).returning();
  console.log('✅ Created Admin:', admin.email);
  
  // Create Teacher
  const teacherHash = await hash('teacher123', 12);
  const [teacher] = await db.insert(users).values({
    email: 'teacher@vibe.md',
    passwordHash: teacherHash,
    name: 'John Teacher',
    role: 'teacher',
    permissions: ['teach'],
    courseIds: [course.id],
    schoolId: school.id,
  }).returning();
  console.log('✅ Created Teacher:', teacher.email);
  
  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Login credentials:');
  console.log('  SuperAdmin: admin@brio.md / admin123');
  console.log('  Admin:      admin@vibe.md / admin123');
  console.log('  Teacher:    teacher@vibe.md / teacher123');
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});