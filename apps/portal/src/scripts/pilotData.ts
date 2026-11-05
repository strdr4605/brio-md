export const GOLDEN_COURSES = [
  {
    name: "General English A1-A2",
    description:
      "Foundational English course focusing on vocabulary, basic grammar, and conversational skills for beginners.",
    level: "beginner" as const,
    totalSessions: 24,
    sessionDurationMinutes: 60,
    scheduleDays: ["mon", "wed", "fri"],
    scheduleTime: "15:00 - 16:00",
    active: true,
  },
  {
    name: "Applied Mathematics & Logic",
    description:
      "Interactive mathematical problem solving, geometry intuition, and computational algorithmic puzzles.",
    level: "intermediate" as const,
    totalSessions: 20,
    sessionDurationMinutes: 90,
    scheduleDays: ["mon", "wed"],
    scheduleTime: "16:00 - 17:30",
    active: true,
  },
];

export const GOLDEN_STUDENTS = [
  { name: "Alex Popescu", phone: "+37369000001", age: 14, parentName: "Maria Popescu", parentPhone: "+37368000001" },
  { name: "Elena Ionescu", phone: "+37369000002", age: 12, parentName: "Ion Ionescu", parentPhone: "+37368000002" },
  { name: "Mihai Radu", phone: "+37369000003", age: 16, parentName: "Victor Radu", parentPhone: "+37368000003" },
  { name: "Sofia Ursu", phone: "+37369000004", age: 11, parentName: "Ana Ursu", parentPhone: "+37368000004" },
  { name: "Dumitru Moraru", phone: "+37369112233", age: 13, parentName: "Vasile Moraru", parentPhone: "+37368112233" },
  { name: "Anastasia Cebotari", phone: "+37369223344", age: 10, parentName: "Svetlana Cebotari", parentPhone: "+37368223344" },
  { name: "Maxim Lungu", phone: "+37369334455", age: 15, parentName: "Oleg Lungu", parentPhone: "+37368334455" },
  { name: "Valeria Rusu", phone: "+37369445566", age: 12, parentName: "Elena Rusu", parentPhone: "+37368445566" },
  { name: "Andrei Ceban", phone: "+37369556677", age: 14, parentName: "Igor Ceban", parentPhone: "+37368556677" },
  { name: "Daria Munteanu", phone: "+37369667788", age: 9, parentName: "Natalia Munteanu", parentPhone: "+37368667788" },
  { name: "Victor Sîrbu", phone: "+37369778899", age: 16, parentName: "Dumitru Sîrbu", parentPhone: "+37368778899" },
  { name: "Mihaela Plămădeală", phone: "+37369889900", age: 11, parentName: "Angela Plămădeală", parentPhone: "+37368889900" },
  { name: "Cristian Rotaru", phone: "+37369990011", age: 13, parentName: "Gheorghe Rotaru", parentPhone: "+37368990011" },
  { name: "Gabriela Cojocari", phone: "+37369123456", age: 8, parentName: "Rodica Cojocari", parentPhone: "+37368123456" },
  { name: "Bogdan Ciobanu", phone: "+37369234567", age: 15, parentName: "Sergiu Ciobanu", parentPhone: "+37368234567" },
];

export type PilotSchoolConfig = {
  id: number;
  name: string;
  slug: string;
  adminEmail: string;
  teacherEmail: string;
  password: string;
  city: string;
  type: "school" | "center" | "tutor";
};

export const PILOT_SCHOOLS: PilotSchoolConfig[] = [
  { id: 1, name: "Pilot Sandbox 01", slug: "pilot01", adminEmail: "pilot01@brio.md", teacherEmail: "prof-pilot01@brio.md", password: "dyiDdU@2fQ7j8^!Q", city: "Chișinău", type: "school" },
  { id: 2, name: "Pilot Sandbox 02", slug: "pilot02", adminEmail: "pilot02@brio.md", teacherEmail: "prof-pilot02@brio.md", password: "nPXonD5U43Nd#^s$", city: "Chișinău", type: "school" },
  { id: 3, name: "Pilot Sandbox 03", slug: "pilot03", adminEmail: "pilot03@brio.md", teacherEmail: "prof-pilot03@brio.md", password: "PAx$2WbfPYvEa*8#", city: "Chișinău", type: "school" },
  { id: 4, name: "Pilot Sandbox 04", slug: "pilot04", adminEmail: "pilot04@brio.md", teacherEmail: "prof-pilot04@brio.md", password: "#R7$$x5kU4%c8Fcy", city: "Chișinău", type: "school" },
  { id: 5, name: "Pilot Sandbox 05", slug: "pilot05", adminEmail: "pilot05@brio.md", teacherEmail: "prof-pilot05@brio.md", password: "3RnQrgDSLMb2$S!A", city: "Chișinău", type: "school" },
  { id: 6, name: "Pilot Sandbox 06", slug: "pilot06", adminEmail: "pilot06@brio.md", teacherEmail: "prof-pilot06@brio.md", password: "8yXyCv%@nr49f9*m", city: "Chișinău", type: "school" },
  { id: 7, name: "Pilot Sandbox 07", slug: "pilot07", adminEmail: "pilot07@brio.md", teacherEmail: "prof-pilot07@brio.md", password: "!tys6$EVih3&vQM9", city: "Chișinău", type: "school" },
  { id: 8, name: "Pilot Sandbox 08", slug: "pilot08", adminEmail: "pilot08@brio.md", teacherEmail: "prof-pilot08@brio.md", password: "2U3%q&Tz8ftBEt7m", city: "Chișinău", type: "school" },
  { id: 9, name: "Pilot Sandbox 09", slug: "pilot09", adminEmail: "pilot09@brio.md", teacherEmail: "prof-pilot09@brio.md", password: "su6yqgN#7cUg@E79", city: "Chișinău", type: "school" },
  { id: 10, name: "Pilot Sandbox 10", slug: "pilot10", adminEmail: "pilot10@brio.md", teacherEmail: "prof-pilot10@brio.md", password: "%7SLJ^mv3Jr2!eiT", city: "Chișinău", type: "school" },
  { id: 11, name: "Pilot Sandbox 11", slug: "pilot11", adminEmail: "pilot11@brio.md", teacherEmail: "prof-pilot11@brio.md", password: "!X@JQ8iJFf*&273f", city: "Chișinău", type: "school" },
  { id: 12, name: "Pilot Sandbox 12", slug: "pilot12", adminEmail: "pilot12@brio.md", teacherEmail: "prof-pilot12@brio.md", password: "cUmi6$Js9Z^GzY8B", city: "Chișinău", type: "school" },
  { id: 13, name: "Pilot Sandbox 13", slug: "pilot13", adminEmail: "pilot13@brio.md", teacherEmail: "prof-pilot13@brio.md", password: "mDKaXS#9yij9*jcm", city: "Chișinău", type: "school" },
  { id: 14, name: "Pilot Sandbox 14", slug: "pilot14", adminEmail: "pilot14@brio.md", teacherEmail: "prof-pilot14@brio.md", password: "MD8&*7NojghcS7A!", city: "Chișinău", type: "school" },
  { id: 15, name: "Pilot Sandbox 15", slug: "pilot15", adminEmail: "pilot15@brio.md", teacherEmail: "prof-pilot15@brio.md", password: "v%9e2^r@nAmfFy4Q", city: "Chișinău", type: "school" },
  { id: 16, name: "Pilot Sandbox 16", slug: "pilot16", adminEmail: "pilot16@brio.md", teacherEmail: "prof-pilot16@brio.md", password: "J2#NrNk$24YM^Cr!", city: "Chișinău", type: "school" },
  { id: 17, name: "Pilot Sandbox 17", slug: "pilot17", adminEmail: "pilot17@brio.md", teacherEmail: "prof-pilot17@brio.md", password: "6ES9%s38^2B52iP#", city: "Chișinău", type: "school" },
  { id: 18, name: "Pilot Sandbox 18", slug: "pilot18", adminEmail: "pilot18@brio.md", teacherEmail: "prof-pilot18@brio.md", password: "p6dgxU$$LmVLb@9n", city: "Chișinău", type: "school" },
  { id: 19, name: "Pilot Sandbox 19", slug: "pilot19", adminEmail: "pilot19@brio.md", teacherEmail: "prof-pilot19@brio.md", password: "Cm#Wu!xviNi47PK4", city: "Chișinău", type: "school" },
  { id: 20, name: "Pilot Sandbox 20", slug: "pilot20", adminEmail: "pilot20@brio.md", teacherEmail: "prof-pilot20@brio.md", password: "VwrW%5L6Ae**X4ab", city: "Chișinău", type: "school" },
  { id: 21, name: "Pilot Sandbox 21", slug: "pilot21", adminEmail: "pilot21@brio.md", teacherEmail: "prof-pilot21@brio.md", password: "!%NGPh#M!jg8G#9t", city: "Chișinău", type: "school" },
  { id: 22, name: "Pilot Sandbox 22", slug: "pilot22", adminEmail: "pilot22@brio.md", teacherEmail: "prof-pilot22@brio.md", password: "Fao&4^*sB^QNFR5d", city: "Chișinău", type: "school" },
  { id: 23, name: "Pilot Sandbox 23", slug: "pilot23", adminEmail: "pilot23@brio.md", teacherEmail: "prof-pilot23@brio.md", password: "v!GS&Vj3f^Lske3Z", city: "Chișinău", type: "school" },
  { id: 24, name: "Pilot Sandbox 24", slug: "pilot24", adminEmail: "pilot24@brio.md", teacherEmail: "prof-pilot24@brio.md", password: "oh6$&t^fAWHVCE4J", city: "Chișinău", type: "school" },
  { id: 25, name: "Pilot Sandbox 25", slug: "pilot25", adminEmail: "pilot25@brio.md", teacherEmail: "prof-pilot25@brio.md", password: "MU8sDk8m#qmR&XwC", city: "Chișinău", type: "school" },
  { id: 26, name: "Pilot Sandbox 26", slug: "pilot26", adminEmail: "pilot26@brio.md", teacherEmail: "prof-pilot26@brio.md", password: "6i94cj!jkA#RHCfJ", city: "Chișinău", type: "school" },
  { id: 27, name: "Pilot Sandbox 27", slug: "pilot27", adminEmail: "pilot27@brio.md", teacherEmail: "prof-pilot27@brio.md", password: "eg6M$#XKd^5Nd5vn", city: "Chișinău", type: "school" },
  { id: 28, name: "Pilot Sandbox 28", slug: "pilot28", adminEmail: "pilot28@brio.md", teacherEmail: "prof-pilot28@brio.md", password: "e!KMhpP4$L#gzG83", city: "Chișinău", type: "school" },
  { id: 29, name: "Pilot Sandbox 29", slug: "pilot29", adminEmail: "pilot29@brio.md", teacherEmail: "prof-pilot29@brio.md", password: "2TZ8x9N*5$*Thy&5", city: "Chișinău", type: "school" },
  { id: 30, name: "Pilot Sandbox 30", slug: "pilot30", adminEmail: "pilot30@brio.md", teacherEmail: "prof-pilot30@brio.md", password: "M2!Nt2wwX2tV5S$k", city: "Chișinău", type: "school" },
];
