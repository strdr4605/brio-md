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
