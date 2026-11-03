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
  { id: 1, name: "Liceul Orizont Chișinău", slug: "orizont", adminEmail: "orizont@brio.md", teacherEmail: "prof-orizont@brio.md", password: "Orizont#72Brio!", city: "Chișinău", type: "school" },
  { id: 2, name: "Academia Da Vinci", slug: "davinci", adminEmail: "davinci@brio.md", teacherEmail: "prof-davinci@brio.md", password: "DaVinci*91Vibe!", city: "Chișinău", type: "center" },
  { id: 3, name: "Centrul Edu Prometeu", slug: "prometeu", adminEmail: "prometeu@brio.md", teacherEmail: "prof-prometeu@brio.md", password: "Prometeu^34Edu!", city: "Chișinău", type: "center" },
  { id: 4, name: "Quantum STEM Hub", slug: "quantum", adminEmail: "quantum@brio.md", teacherEmail: "prof-quantum@brio.md", password: "Quantum!88Stem#", city: "Chișinău", type: "center" },
  { id: 5, name: "Centrul Lingvistic Eureka", slug: "eureka", adminEmail: "eureka@brio.md", teacherEmail: "prof-eureka@brio.md", password: "Eureka#45Lang!", city: "Bălți", type: "center" },
  { id: 6, name: "Lumina Math & Logic", slug: "lumina", adminEmail: "lumina@brio.md", teacherEmail: "prof-lumina@brio.md", password: "Lumina*63Logic!", city: "Chișinău", type: "center" },
  { id: 7, name: "Vector IT & Robotics", slug: "vector", adminEmail: "vector@brio.md", teacherEmail: "prof-vector@brio.md", password: "Vector!29Code#", city: "Chișinău", type: "center" },
  { id: 8, name: "Atlas Learning Studio", slug: "atlas", adminEmail: "atlas@brio.md", teacherEmail: "prof-atlas@brio.md", password: "Atlas#81Learn!", city: "Orhei", type: "center" },
  { id: 9, name: "Nexus Educational Hub", slug: "nexus", adminEmail: "nexus@brio.md", teacherEmail: "prof-nexus@brio.md", password: "Nexus*17Hub!", city: "Chișinău", type: "center" },
  { id: 10, name: "Aurora Foreign Languages", slug: "aurora", adminEmail: "aurora@brio.md", teacherEmail: "prof-aurora@brio.md", password: "Aurora^52Poly!", city: "Cahul", type: "center" },
  { id: 11, name: "Zenith Tutoring Center", slug: "zenith", adminEmail: "zenith@brio.md", teacherEmail: "prof-zenith@brio.md", password: "Zenith!94Tutor#", city: "Chișinău", type: "tutor" },
  { id: 12, name: "Intellect Study Club", slug: "intellect", adminEmail: "intellect@brio.md", teacherEmail: "prof-intellect@brio.md", password: "Intellect#36Study!", city: "Ungheni", type: "center" },
  { id: 13, name: "Solaris Science Lab", slug: "solaris", adminEmail: "solaris@brio.md", teacherEmail: "prof-solaris@brio.md", password: "Solaris*48Lab!", city: "Chișinău", type: "center" },
  { id: 14, name: "Apex Academic Center", slug: "apex", adminEmail: "apex@brio.md", teacherEmail: "prof-apex@brio.md", password: "Apex!73Acad#", city: "Chișinău", type: "school" },
  { id: 15, name: "Nova English Academy", slug: "nova", adminEmail: "nova@brio.md", teacherEmail: "prof-nova@brio.md", password: "Nova#65Speak!", city: "Bălți", type: "center" },
  { id: 16, name: "Olympus Math & Physics", slug: "olympus", adminEmail: "olympus@brio.md", teacherEmail: "prof-olympus@brio.md", password: "Olympus*82Math!", city: "Chișinău", type: "center" },
  { id: 17, name: "Sigma Coding School", slug: "sigma", adminEmail: "sigma@brio.md", teacherEmail: "prof-sigma@brio.md", password: "Sigma!19Dev#", city: "Chișinău", type: "center" },
  { id: 18, name: "Academos Tutors Group", slug: "academos", adminEmail: "academos@brio.md", teacherEmail: "prof-academos@brio.md", password: "Academos#47Group!", city: "Strășeni", type: "tutor" },
  { id: 19, name: "Pulsar Kids Academy", slug: "pulsar", adminEmail: "pulsar@brio.md", teacherEmail: "prof-pulsar@brio.md", password: "Pulsar*58Kids!", city: "Chișinău", type: "center" },
  { id: 20, name: "Cosmos Robotics Space", slug: "cosmos", adminEmail: "cosmos@brio.md", teacherEmail: "prof-cosmos@brio.md", password: "Cosmos!93Bot#", city: "Chișinău", type: "center" },
  { id: 21, name: "Sparta Chess & Logic", slug: "sparta", adminEmail: "sparta@brio.md", teacherEmail: "prof-sparta@brio.md", password: "Sparta#26Chess!", city: "Chișinău", type: "center" },
  { id: 22, name: "Horizon Polyglot Studio", slug: "horizon", adminEmail: "horizon@brio.md", teacherEmail: "prof-horizon@brio.md", password: "Horizon*61Voice!", city: "Hîncești", type: "center" },
  { id: 23, name: "Athena Humanities Club", slug: "athena", adminEmail: "athena@brio.md", teacherEmail: "prof-athena@brio.md", password: "Athena!85Arts#", city: "Chișinău", type: "center" },
  { id: 24, name: "Prestige Baccalaureate", slug: "prestige", adminEmail: "prestige@brio.md", teacherEmail: "prof-prestige@brio.md", password: "Prestige#39Bac!", city: "Chișinău", type: "school" },
  { id: 25, name: "SmartHub Education", slug: "smarthub", adminEmail: "smarthub@brio.md", teacherEmail: "prof-smarthub@brio.md", password: "SmartHub*74Smart!", city: "Ialoveni", type: "center" },
  { id: 26, name: "Matrix Tech Academy", slug: "matrix", adminEmail: "matrix@brio.md", teacherEmail: "prof-matrix@brio.md", password: "Matrix!51Tech#", city: "Chișinău", type: "center" },
  { id: 27, name: "Vanguard Art & Design", slug: "vanguard", adminEmail: "vanguard@brio.md", teacherEmail: "prof-vanguard@brio.md", password: "Vanguard#68Art!", city: "Chișinău", type: "center" },
  { id: 28, name: "Alfa Tutors Collective", slug: "alfa", adminEmail: "alfa@brio.md", teacherEmail: "prof-alfa@brio.md", password: "Alfa*95Prep!", city: "Comrat", type: "tutor" },
  { id: 29, name: "Omega Olympiad Studio", slug: "omega", adminEmail: "omega@brio.md", teacherEmail: "prof-omega@brio.md", password: "Omega!43Win#", city: "Chișinău", type: "center" },
  { id: 30, name: "Meridian Future School", slug: "meridian", adminEmail: "meridian@brio.md", teacherEmail: "prof-meridian@brio.md", password: "Meridian#87Next!", city: "Chișinău", type: "school" },
];
