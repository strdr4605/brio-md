"use client";

import { trpc } from "@/lib/trpc";

export function CourseList() {
  const { data: courses = [], isLoading } = trpc.course.list.useQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-neutral-600">Loading courses...</p>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-neutral-600">No courses assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
        >
          <h3 className="text-xl font-semibold mb-2">{course.name}</h3>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer">
            Open Course
          </button>
        </div>
      ))}
    </div>
  );
}
