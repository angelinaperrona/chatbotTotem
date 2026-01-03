const EMOJI_REGEX =
  /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const MAX_INPUT_LENGTH = 500;

export function sanitizeInput(input: string): string {
  let cleaned = input
    .replace(EMOJI_REGEX, "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > MAX_INPUT_LENGTH) {
    cleaned = cleaned.substring(0, MAX_INPUT_LENGTH);
  }

  return cleaned;
}

export function removeNonNumeric(input: string): string {
  return input.replace(/\D/g, "");
}
