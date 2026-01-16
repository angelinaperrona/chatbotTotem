export function isAffirmative(message: string): boolean {
  const lower = message.toLowerCase().trim();

  // Tier 1: Exact common affirmations
  const exactPatterns =
    /^(sí|si|yes|sep|claro|ok|okey|vale|dale|va|bueno|afirmativo|correcto)$/i;
  if (exactPatterns.test(lower)) {
    return true;
  }

  // Tier 2: Elongated affirmations ("siiií", "suuuu", "claroooo")
  const elongatedPatterns =
    /^(s[íi]{2,}|s[iu]+|clar+o+|ok+e*y*|dal+e+|va+|buen+o+)$/i;
  if (elongatedPatterns.test(lower)) {
    return true;
  }

  // Tier 3: Typo tolerance for very short responses
  // Accept "su", "sui", "suii" as likely typos of "sí"
  if (lower.length <= 4 && /^s[iíu]+$/.test(lower)) {
    return true;
  }

  return false;
}

export function isNegative(message: string): boolean {
  const lower = message.toLowerCase().trim();
  return /^(no|nop|nope|nah|nel|negativo|paso)$/i.test(lower);
}

export function isSimpleAcknowledgment(message: string): boolean {
  const lower = message.toLowerCase().trim();
  return /^(ok|ya|ahi|ahí|listo|va|bien|dale|oki|okey)$/i.test(lower);
}
