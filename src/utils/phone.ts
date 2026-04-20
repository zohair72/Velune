const NON_DIGIT_PATTERN = /\D+/g;
const PAKISTAN_MOBILE_PATTERN = /^923\d{9}$/;

const stripToDigits = (value: string) => value.replace(NON_DIGIT_PATTERN, "");

export const normalizePakistanPhoneNumber = (value: string): string | null => {
  const digitsOnly = stripToDigits(value);

  if (!digitsOnly) {
    return null;
  }

  const withoutInternationalPrefix = digitsOnly.startsWith("00")
    ? digitsOnly.slice(2)
    : digitsOnly;

  if (PAKISTAN_MOBILE_PATTERN.test(withoutInternationalPrefix)) {
    return withoutInternationalPrefix;
  }

  if (/^03\d{9}$/.test(withoutInternationalPrefix)) {
    return `92${withoutInternationalPrefix.slice(1)}`;
  }

  if (/^3\d{9}$/.test(withoutInternationalPrefix)) {
    return `92${withoutInternationalPrefix}`;
  }

  return null;
};

export const isValidPakistanPhoneNumber = (value: string) =>
  normalizePakistanPhoneNumber(value) !== null;

export const pakistanPhoneValidationMessage =
  "Enter a valid Pakistan mobile number, like 03001234567 or 923001234567.";
