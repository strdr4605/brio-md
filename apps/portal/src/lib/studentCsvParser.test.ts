import { describe, it, expect } from "vitest";
import { parseStudentCsv } from "./studentCsvParser";

describe("parseStudentCsv", () => {
  it("returns error on empty string", () => {
    const res = parseStudentCsv("");
    expect(res.error).toBe("Fișierul este gol.");
    expect(res.candidates).toEqual([]);
  });

  it("parses comma-separated values with headers", () => {
    const csv = `Nume,Telefon,Parinte,Tel Parinte,Varsta\nIon Creanga,069123456,Parinte Ion,079123456,12`;
    const res = parseStudentCsv(csv);
    expect(res.candidates).toHaveLength(1);
    expect(res.candidates[0].name).toBe("Ion Creanga");
    expect(res.candidates[0].phone).toBe("069123456");
    expect(res.candidates[0].parentName).toBe("Parinte Ion");
    expect(res.candidates[0].parentPhone).toBe("079123456");
    expect(res.candidates[0].age).toBe(12);
    expect(res.candidates[0].isValid).toBe(true);
  });

  it("parses semicolon-separated values exported from Excel", () => {
    const csv = `Nume;Telefon;Parinte;Tel Parinte\nAna Blandiana;068111222;Mama Ana;068333444`;
    const res = parseStudentCsv(csv);
    expect(res.candidates).toHaveLength(1);
    expect(res.candidates[0].name).toBe("Ana Blandiana");
    expect(res.candidates[0].phone).toBe("068111222");
    expect(res.candidates[0].isValid).toBe(true);
  });

  it("flags rows with missing phone numbers", () => {
    const csv = `Nume,Telefon,Parinte,Tel Parinte\nFara Telefon,,,`;
    const res = parseStudentCsv(csv);
    expect(res.candidates).toHaveLength(1);
    expect(res.candidates[0].isValid).toBe(false);
    expect(res.candidates[0].error).toBe("Lipsește nr. de telefon");
  });
});
