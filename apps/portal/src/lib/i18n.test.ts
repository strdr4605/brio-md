import { describe, it, expect } from "vitest";
import { DICTIONARY } from "./i18nDict";
import { translate } from "./i18n";

describe("i18n core dictionaries & translator", () => {
  it("provides complete dictionaries with identical key structures for RO and RU", () => {
    const roSections = Object.keys(DICTIONARY.ro).sort();
    const ruSections = Object.keys(DICTIONARY.ru).sort();

    expect(roSections).toEqual(ruSections);

    for (const section of roSections as (keyof typeof DICTIONARY.ro)[]) {
      const roKeys = Object.keys(DICTIONARY.ro[section]).sort();
      const ruKeys = Object.keys(DICTIONARY.ru[section]).sort();
      expect(roKeys).toEqual(ruKeys);

      // Verify each key has non-empty string value
      for (const k of roKeys) {
        const roVal = (DICTIONARY.ro[section] as any)[k];
        const ruVal = (DICTIONARY.ru[section] as any)[k];
        expect(typeof roVal).toBe("string");
        expect(roVal.trim().length).toBeGreaterThan(0);
        expect(typeof ruVal).toBe("string");
        expect(ruVal.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("translate() resolves nested keys for RO and RU", () => {
    // Auth
    expect(translate(DICTIONARY.ro, "auth.portalTitle")).toBe("Portal Personal");
    expect(translate(DICTIONARY.ru, "auth.portalTitle")).toBe("Личный кабинет");
    expect(translate(DICTIONARY.ro, "auth.loginButton")).toBe("Autentificare");
    expect(translate(DICTIONARY.ru, "auth.loginButton")).toBe("Войти");

    // Nav
    expect(translate(DICTIONARY.ro, "nav.students")).toBe("Studenți");
    expect(translate(DICTIONARY.ru, "nav.students")).toBe("Ученики");
    expect(translate(DICTIONARY.ro, "nav.dashboard")).toBe("Panou Principal");
    expect(translate(DICTIONARY.ru, "nav.dashboard")).toBe("Главная панель");

    // Common actions
    expect(translate(DICTIONARY.ro, "common.save")).toBe("Salvează");
    expect(translate(DICTIONARY.ru, "common.save")).toBe("Сохранить");
    expect(translate(DICTIONARY.ro, "common.cancel")).toBe("Anulează");
    expect(translate(DICTIONARY.ru, "common.cancel")).toBe("Отмена");

    // Badges
    expect(translate(DICTIONARY.ro, "badge.paid")).toBe("Achitat");
    expect(translate(DICTIONARY.ru, "badge.paid")).toBe("Оплачен");
    expect(translate(DICTIONARY.ro, "badge.overdue")).toBe("Restant");
    expect(translate(DICTIONARY.ru, "badge.overdue")).toBe("Просрочен");

    // Students catalog
    expect(translate(DICTIONARY.ro, "students.registryTitle")).toBe("Registru Elevi");
    expect(translate(DICTIONARY.ru, "students.registryTitle")).toBe("Реестр учеников");
  });

  it("translate() returns fallback or key when path is invalid", () => {
    expect(translate(DICTIONARY.ro, "nonexistent.key", "Custom Fallback")).toBe("Custom Fallback");
    expect(translate(DICTIONARY.ro, "nonexistent.key")).toBe("nonexistent.key");
    expect(translate(DICTIONARY.ro, "")).toBe("");
    expect(translate(null, "some.key", "Safe")).toBe("Safe");
  });
});
