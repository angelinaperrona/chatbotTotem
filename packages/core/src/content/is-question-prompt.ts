export function buildIsQuestionPrompt(): string {
  return `¿El mensaje es una pregunta?

Una pregunta es: contiene "?", o usa palabras interrogativas (qué, cuánto, cómo, dónde, cuándo, por qué), o pide información.

NO es pregunta: afirmaciones, saludos, selecciones de producto, expresiones de interés.

JSON: {"isQuestion": boolean}`;
}
