import { redirect } from 'next/navigation';
import { auth } from '@brio-md/auth';
import { signOut } from '@/lib/auth';
import Link from 'next/link';

export default async function CoursesPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/');
  }
  
  const user = session.user as any;
  const courseIds = user.courseIds || [];
  
  // Mock courses data - in production, this would come from the database
  const courses = [
    { id: 1, name: 'English', description: 'English language course' },
    { id: 2, name: 'Math', description: 'Mathematics course' },
    { id: 3, name: 'Science', description: 'Science course' },
  ];
  
  // Filter courses based on user's assigned courses
  const assignedCourses = courseIds.length > 0 
    ? courses.filter(c => courseIds.includes(c.id))
    : courses;
  
  async function handleSignOut() {
    'use server';
    await signOut({ redirectTo: '/' });
  }
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-green-600 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Learning Portal</h1>
          <div className="flex items-center gap-4">
            <span>{user.name}</span>
            <form action={handleSignOut}>
              <button type="submit" className="text-sm underline">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Courses</h2>
        
        {assignedCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-neutral-600">No courses assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assignedCourses.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2">{course.name}</h3>
                <p className="text-neutral-600 mb-4">{course.description}</p>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Open Course
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Quick link to Staff Portal */}
        <div className="mt-8 text-center">
          <Link href="https://in.brio.md" className="text-green-600 hover:underline">
            Go to Staff Portal →
          </Link>
        </div>
      </main>
    </div>
  );
}