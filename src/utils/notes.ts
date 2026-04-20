type RawNoteInput = string[] | string | null | undefined;

const titleCaseIfUppercase = (value: string) => {
  if (!value || value !== value.toUpperCase()) {
    return value;
  }

  return value
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const cleanNoteToken = (value: string) =>
  titleCaseIfUppercase(
    value
      .replace(/\\+"/g, '"')
      .replace(/^["'\[\](){}]+/, "")
      .replace(/["'\[\](){}]+$/, "")
      .replace(/\s+/g, " ")
      .trim(),
  );

const expandNoteToken = (value: string) =>
  cleanNoteToken(value)
    .split(/\s+(?:and|&)\s+/i)
    .map((token) => cleanNoteToken(token))
    .filter(Boolean);

const normalizeLooseListConjunction = (value: string) => {
  if (!/[|,]/.test(value)) {
    return value;
  }

  // Convert the final list-style "and" into a separator so
  // "Rose, Ylang Ylang and Jasmine" becomes three note items.
  return value.replace(/\s+(?:and|&)\s+(?=[^,|]+$)/i, ", ");
};

const splitLooseNoteString = (value: string) =>
  normalizeLooseListConjunction(value)
    .replace(/^\s*\[/, "")
    .replace(/\]\s*$/, "")
    .split(/\s*[|,]\s*/)
    .flatMap(expandNoteToken)
    .filter(Boolean);

const parseStringifiedNotes = (value: string): string[] => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(trimmedValue) as unknown;
    return normalizeProductNotesValue(parsedValue as RawNoteInput);
  } catch {
    return splitLooseNoteString(trimmedValue);
  }
};

export const normalizeProductNotesValue = (rawNotes: RawNoteInput): string[] => {
  if (Array.isArray(rawNotes)) {
    return rawNotes
      .flatMap((note) =>
        typeof note === "string" ? parseStringifiedNotes(note) : [],
      )
      .filter(Boolean);
  }

  if (typeof rawNotes === "string") {
    return parseStringifiedNotes(rawNotes);
  }

  return [];
};

export const normalizeProductNotes = (rawNotes: RawNoteInput) => {
  const normalizedNotes = normalizeProductNotesValue(rawNotes);
  return normalizedNotes.length > 0 ? normalizedNotes : ["Velune Blend"];
};

export const formatNotesList = (notes: string[]) => {
  const normalizedNotes = notes.filter(Boolean);

  if (normalizedNotes.length === 0) {
    return "";
  }

  return normalizedNotes.join(", ");
};
