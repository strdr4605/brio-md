export type ParsedCandidate = {
  name: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  age: number | null;
  isValid: boolean;
  error?: string;
};

export function parseStudentCsv(text: string): {
  error?: string;
  candidates: ParsedCandidate[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { error: "Fișierul este gol.", candidates: [] };
  }

  // Detect delimiter: semicolon or comma
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const rows = lines.map((line) =>
    line.split(delimiter).map((col) => col.replace(/^["']|["']$/g, "").trim())
  );

  let headerOffset = 0;
  const headerRow = rows[0].map((h) => h.toLowerCase());

  let nameIdx = 0;
  let phoneIdx = 1;
  let parentNameIdx = 2;
  let parentPhoneIdx = 3;
  let ageIdx = 4;

  const hasHeader = headerRow.some(
    (h) =>
      h.includes("num") ||
      h.includes("elev") ||
      h.includes("student") ||
      h.includes("имя") ||
      h.includes("фио")
  );

  if (hasHeader) {
    headerOffset = 1;
    headerRow.forEach((col, idx) => {
      if (
        col.includes("parinte") ||
        col.includes("mama") ||
        col.includes("tata") ||
        col.includes("родител")
      ) {
        if (col.includes("tel") || col.includes("phone")) parentPhoneIdx = idx;
        else parentNameIdx = idx;
      } else if (
        col.includes("num") ||
        col.includes("elev") ||
        col.includes("student") ||
        col.includes("имя") ||
        col.includes("фио")
      ) {
        nameIdx = idx;
      } else if (col.includes("tel") || col.includes("phone") || col.includes("тел")) {
        phoneIdx = idx;
      } else if (
        col.includes("varst") ||
        col.includes("virst") ||
        col.includes("ani") ||
        col.includes("возраст")
      ) {
        ageIdx = idx;
      }
    });
  }

  const candidates: ParsedCandidate[] = [];

  for (let i = headerOffset; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIdx] || "";
    const phone = row[phoneIdx] || "";
    const parentName = row[parentNameIdx] || "";
    const parentPhone = row[parentPhoneIdx] || "";
    const rawAge = parseInt(row[ageIdx], 10);
    const age = !isNaN(rawAge) && rawAge > 0 && rawAge < 120 ? rawAge : null;

    const hasValidPhone = Boolean(phone.replace(/\D/g, "") || parentPhone.replace(/\D/g, ""));
    const isValid = Boolean(name.trim()) && hasValidPhone;

    candidates.push({
      name: name.trim(),
      phone: phone.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      age,
      isValid,
      error: !name.trim()
        ? "Nume lipsă"
        : !hasValidPhone
          ? "Lipsește nr. de telefon"
          : undefined,
    });
  }

  return { candidates };
}
