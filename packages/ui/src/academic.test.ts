import { describe, it, expect } from "vitest";
import { ACADEMIC_LABELS, STUDENT_PROFILE_TABS, type StudentDossierSummary, type AcademicGroupSummary } from "./academic";

describe("Academic Hub Contracts & Terminology", () => {
  it("defines exact Romanian UI labels according to Issue #140 specifications", () => {
    expect(ACADEMIC_LABELS.catalog.title).toBe("Gestiune Elevi");
    expect(ACADEMIC_LABELS.catalog.newStudent).toBe("Înregistrează Elev Nou");
    expect(ACADEMIC_LABELS.catalog.searchPlaceholder).toBe("Caută după nume, telefon sau contract...");
    expect(ACADEMIC_LABELS.profile.title).toBe("Profil Student");
    expect(ACADEMIC_LABELS.profile.callAction).toBe("Apelează");
    expect(ACADEMIC_LABELS.profile.whatsAppAction).toBe("WhatsApp");
    expect(ACADEMIC_LABELS.profile.editDossier).toBe("Editează Dosarul");
    expect(ACADEMIC_LABELS.profile.zeroDebt).toBe("0 MDL datorie");
    expect(ACADEMIC_LABELS.profile.paidCurrentMonth).toBe("Achitat pentru luna curentă");
    expect(ACADEMIC_LABELS.tabs.courses).toBe("Cursuri & Grupe");
    expect(ACADEMIC_LABELS.tabs.attendance).toBe("Prezență");
    expect(ACADEMIC_LABELS.tabs.billing).toBe("Facturi & Plăți");
    expect(ACADEMIC_LABELS.tabs.notes).toBe("Observații");
    expect(ACADEMIC_LABELS.drawer.close).toBe("Închide");
    expect(ACADEMIC_LABELS.drawer.saveEnrollment).toBe("Înscrie în Grupă");
    expect(ACADEMIC_LABELS.drawer.cancel).toBe("Anulează");
  });

  it("exports correct student profile tabs sequence", () => {
    expect(STUDENT_PROFILE_TABS).toEqual(["courses", "attendance", "billing", "notes"]);
  });

  it("validates StudentDossierSummary structure with relation and multi-tenant schoolId", () => {
    const sampleDossier: StudentDossierSummary = {
      id: 1,
      name: "Tatiana Ceban",
      age: 11,
      contractNumber: "#2024-098",
      active: true,
      schoolId: 1,
      phone: "+373 69 123 456",
      parentName: "Tatiana Ceban",
      parentRelation: "mama",
      parentPhone: "+373 69 123 456",
      debtAmount: 0,
      debtFormatted: "0 MDL",
    };

    expect(sampleDossier.name).toBe("Tatiana Ceban");
    expect(sampleDossier.parentRelation).toBe("mama");
    expect(sampleDossier.schoolId).toBe(1);
    expect(sampleDossier.debtAmount).toBe(0);
  });

  it("validates AcademicGroupSummary structure with enrollment and status attributes", () => {
    const sampleGroup: AcademicGroupSummary = {
      id: 10,
      courseId: 2,
      courseName: "Robotics Junior A",
      groupName: "Grupa 1",
      enrollmentId: 101,
      status: "active",
      priceMonthly: 1200,
      scheduleFormatted: "Marți, Joi • 14:30 – 16:00 (Sala 102)",
      room: "Sala 102",
      teacherName: "Mihail Voloșin",
      attendancePercent: 91,
      attendanceRatio: "11 / 12",
      capacity: {
        enrolled: 8,
        max: 10,
      },
    };

    expect(sampleGroup.courseName).toBe("Robotics Junior A");
    expect(sampleGroup.enrollmentId).toBe(101);
    expect(sampleGroup.status).toBe("active");
    expect(sampleGroup.priceMonthly).toBe(1200);
    expect(sampleGroup.attendancePercent).toBe(91);
  });
});
