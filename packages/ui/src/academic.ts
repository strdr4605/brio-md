/**
 * Academic Hub Romanian UI Terminology Dictionary
 * Standardized according to GitHub Issue #140 specifications
 */
export const ACADEMIC_LABELS = {
  catalog: {
    title: "Gestiune Elevi",
    newStudent: "Înregistrează Elev Nou",
    searchPlaceholder: "Caută după nume, telefon sau contract...",
    emptyTitle: "Nu au fost găsiți elevi",
    emptyDescription: "Încercați să modificați termenii de căutare",
  },
  profile: {
    title: "Profil Student",
    subtitle: "Dosar cursant (30%) + activitate academică (70%)",
    breadcrumbRoot: "Toți elevii",
    parentSection: "Contacte Părinți",
    callAction: "Apelează",
    whatsAppAction: "WhatsApp",
    editDossier: "Editează Dosarul",
    balanceSection: "Balanță Financiară",
    zeroDebt: "0 MDL datorie",
    paidCurrentMonth: "Achitat pentru luna curentă",
    addGroup: "+ Înscrie în altă grupă",
  },
  tabs: {
    courses: "Cursuri & Grupe",
    attendance: "Prezență",
    billing: "Facturi & Plăți",
    notes: "Observații",
  },
  courses: {
    title: "Cursuri & Grupe",
    newCourse: "+ Adaugă Curs Nou",
    emptyTitle: "Nu există cursuri",
    emptyDescription: "Adăugați primul curs pentru această filială",
    capacityLabel: "locuri ocupate",
  },
  drawer: {
    close: "Închide",
    saveEnrollment: "Înscrie în Grupă",
    cancel: "Anulează",
  },
} as const;

export const STUDENT_PROFILE_TABS = ["courses", "attendance", "billing", "notes"] as const;
export type StudentProfileTab = (typeof STUDENT_PROFILE_TABS)[number];

export type StudentDossierSummary = {
  id: number;
  name: string;
  age?: number | null;
  contractNumber?: string | null;
  active: boolean;
  phone?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  debtAmount: number;
  debtFormatted: string;
};

export type AcademicGroupSummary = {
  id: number;
  courseId: number;
  courseName: string;
  groupName: string;
  priceMonthly?: number | null;
  scheduleFormatted: string;
  room?: string | null;
  teacherName?: string | null;
  attendancePercent?: number | null;
  attendanceRatio?: string | null;
  capacity?: {
    enrolled: number;
    max: number;
  } | null;
};
