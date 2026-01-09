import { PersonasService } from "../../domains/personas/index.ts";
import { getOne } from "../../db/query.ts";

type ConversationRow = {
  is_simulation: number;
  persona_id: string | null;
};

export async function getSimulationPersona(phoneNumber: string) {
  const conv = getOne<ConversationRow>(
    "SELECT is_simulation, persona_id FROM conversations WHERE phone_number = ?",
    [phoneNumber],
  );

  if (conv?.is_simulation === 1 && conv.persona_id) {
    return PersonasService.getById(conv.persona_id);
  }
  return null;
}
