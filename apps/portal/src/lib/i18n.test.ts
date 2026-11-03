import { describe, it, expect } from "vitest";
import { DICTIONARY } from "./i18nDict";
import { translate } from "./i18n";
import { translateRoText, recoverRoText } from "./autoTranslate";

describe("i18n core dictionaries & translator", () => {
  it("provides complete dictionaries with identical key structures for RO, RU, and EN", () => {
    const roSections = Object.keys(DICTIONARY.ro).sort();
    const ruSections = Object.keys(DICTIONARY.ru).sort();
    const enSections = Object.keys(DICTIONARY.en).sort();

    expect(roSections).toEqual(ruSections);
    expect(roSections).toEqual(enSections);

    for (const section of roSections as (keyof typeof DICTIONARY.ro)[]) {
      const roKeys = Object.keys(DICTIONARY.ro[section]).sort();
      const ruKeys = Object.keys(DICTIONARY.ru[section]).sort();
      const enKeys = Object.keys(DICTIONARY.en[section]).sort();
      expect(roKeys).toEqual(ruKeys);
      expect(roKeys).toEqual(enKeys);

      // Verify each key has non-empty string value
      for (const k of roKeys) {
        const roVal = (DICTIONARY.ro[section] as any)[k];
        const ruVal = (DICTIONARY.ru[section] as any)[k];
        const enVal = (DICTIONARY.en[section] as any)[k];
        expect(typeof roVal).toBe("string");
        expect(roVal.trim().length).toBeGreaterThan(0);
        expect(typeof ruVal).toBe("string");
        expect(ruVal.trim().length).toBeGreaterThan(0);
        expect(typeof enVal).toBe("string");
        expect(enVal.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("translate() resolves nested keys for RO, RU, and EN", () => {
    // Auth
    expect(translate(DICTIONARY.ro, "auth.portalTitle")).toBe("Portal Personal");
    expect(translate(DICTIONARY.ru, "auth.portalTitle")).toBe("Личный кабинет");
    expect(translate(DICTIONARY.en, "auth.portalTitle")).toBe("Staff Portal");

    // Nav
    expect(translate(DICTIONARY.ro, "nav.students")).toBe("Studenți");
    expect(translate(DICTIONARY.ru, "nav.students")).toBe("Ученики");
    expect(translate(DICTIONARY.en, "nav.students")).toBe("Students");

    // Student phone disambiguation
    expect(translate(DICTIONARY.ro, "students.orStudentPhone")).toBe("(sau telefon student)*");
    expect(translate(DICTIONARY.ru, "students.orStudentPhone")).toBe("(или телефон ученика)*");
    expect(translate(DICTIONARY.en, "students.orStudentPhone")).toBe("(or student phone)*");
  });

  it("translateRoText() normalizes cedillas and translates modals, drawers, and student profile strings", () => {
    // Cedilla normalization (Ş/ş/Ţ/ţ -> Ș/ș/Ț/ț)
    expect(translateRoText("Şcoală", "ru")).toBe("Школа");
    expect(translateRoText("Şcoală", "en")).toBe("School");
    expect(translateRoText("Actualizează datele contului şi permisiunile", "ru")).toBe(
      "Обновление данных аккаунта и прав доступа",
    );
    expect(translateRoText("Actualizează datele contului şi permisiunile", "en")).toBe(
      "Update account details and permissions",
    );

    // Student profile dossier & cards
    expect(translateRoText("Acces LMS", "ru")).toBe("Доступ LMS");
    expect(translateRoText("Acces LMS", "en")).toBe("LMS Access");
    expect(translateRoText("Editează Dosarul", "ru")).toBe("Редактировать досье");
    expect(translateRoText("Editează Dosarul", "en")).toBe("Edit Dossier");
    expect(translateRoText("Contacte Părinți", "ru")).toBe("Контакты родителей");
    expect(translateRoText("Contacte Părinți", "en")).toBe("Parent Contacts");
    expect(translateRoText("Balanță Financiară", "ru")).toBe("Финансовый баланс");
    expect(translateRoText("Balanță Financiară", "en")).toBe("Financial Balance");
    expect(translateRoText("24 septembrie 2026", "ru")).toBe("24 сентября 2026");
    expect(translateRoText("24 septembrie 2026", "en")).toBe("September 24, 2026");
    expect(translateRoText("16 sept. 2026", "ru")).toBe("16 сент. 2026");
    expect(translateRoText("16 sept. 2026", "en")).toBe("Sep 16, 2026");
    expect(translateRoText("Modul 2 din 4", "ru")).toBe("Модуль 2 из 4");
    expect(translateRoText("Modul 2 din 4", "en")).toBe("Module 2 of 4");

    // Attendance popover
    expect(translateRoText("Motivat", "ru")).toBe("Уваж.");
    expect(translateRoText("Motivat", "en")).toBe("Excused");
    expect(translateRoText("Stare prezență", "ru")).toBe("Статус посещаемости");
    expect(translateRoText("Stare prezență", "en")).toBe("Attendance status");
  });

  it("recoverRoText() recovers canonical Romanian source from RU and EN for live multi-hop switching", () => {
    expect(recoverRoText("Назад в каталог учеников")).toBe("Înapoi la Catalog Studenți");
    expect(recoverRoText("Back to Students Catalog")).toBe("Înapoi la Catalog Studenți");
    expect(recoverRoText("24 сентября 2026")).toBe("24 septembrie 2026");
    expect(recoverRoText("September 24, 2026")).toBe("24 septembrie 2026");
    expect(recoverRoText("16 сент. 2026")).toBe("16 sept. 2026");
    expect(recoverRoText("Sep 16, 2026")).toBe("16 sept. 2026");
  });

  it("translate() returns fallback or key when path is invalid", () => {
    expect(translate(DICTIONARY.ro, "nonexistent.key", "Custom Fallback")).toBe("Custom Fallback");
    expect(translate(DICTIONARY.ro, "nonexistent.key")).toBe("nonexistent.key");
    expect(translate(DICTIONARY.ro, "")).toBe("");
    expect(translate(null, "some.key", "Safe")).toBe("Safe");
  });
});
