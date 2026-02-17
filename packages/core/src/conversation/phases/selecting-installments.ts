import type {
  ConversationMetadata,
  ConversationPhase,
  TransitionResult,
} from "../types.ts";
import type { InstallmentSchedule } from "@totem/types";

export function formatInstallmentOptions(
  installmentSchedule?: InstallmentSchedule,
): string {
  if (!installmentSchedule || Object.keys(installmentSchedule).length === 0) {
    return "No hay opciones de cuotas disponibles";
  }

  const scheduleEntries = Object.entries(installmentSchedule)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(
      ([keyA], [keyB]) =>
        parseInt(keyA.replace("m", "")) - parseInt(keyB.replace("m", "")),
    );

  return scheduleEntries
    .map(
      ([key, value]) =>
        `${key.replace("m", "")} cuota${key === "3m" || key === "1m" || key === "9m" || key === "18m" || key === "24m" || key === "36m" || key === "48m" || key === "60m" ? "s" : "s"}: S/ ${value.toFixed(2)} c/u`,
    )
    .join("\n");
}

type SelectingInstallmentsPhase = Extract<
  ConversationPhase,
  { phase: "selecting_installments" }
>;

export function transitionSelectingInstallments(
  phase: SelectingInstallmentsPhase,
  message: string,
  _metadata: ConversationMetadata,
): TransitionResult {
  const lower = message.toLowerCase();

  // Check if client is rejecting or changing their mind
  if (isRejection(lower) || isChangingProduct(lower)) {
    return {
      type: "update",
      nextPhase: {
        phase: "offering_products",
        segment: phase.segment,
        credit: phase.credit,
        name: phase.name,
        interestedProduct: {
          name: phase.selectedProduct.name,
          price: phase.selectedProduct.price,
          productId: phase.selectedProduct.productId,
          exploredCategoriesCount: 0,
        },
      },
      commands: [
        {
          type: "SEND_MESSAGE",
          text: "Sin problema. ¿Qué otra cosa te gustaría ver? 😊",
        },
      ],
    };
  }

  const monthsMatch = extractMonths(lower);

  if (monthsMatch) {
    const months = monthsMatch;
    const schedule = phase.selectedProduct.installmentSchedule;

    if (!schedule) {
      return {
        type: "update",
        nextPhase: phase,
        commands: [
          {
            type: "SEND_MESSAGE",
            text: "No hay información de cuotas disponible para este producto.",
          },
        ],
      };
    }

    // Find the schedule key (e.g., "3m", "6m", "12m")
    const scheduleKey = (`${months}m` as keyof typeof schedule) as string;
    const pricePerInstallment = schedule[scheduleKey as keyof typeof schedule];

    if (!pricePerInstallment) {
      return {
        type: "update",
        nextPhase: phase,
        commands: [
          {
            type: "SEND_MESSAGE",
            text: `No hay opción de ${months} cuota${months === 1 ? "" : "s"} disponible para este producto.\n\n${formatInstallmentOptions(schedule)}`,
          },
        ],
      };
    }

    return {
      type: "update",
      nextPhase: {
        phase: "confirming_selection",
        segment: phase.segment,
        credit: phase.credit,
        name: phase.name,
        selectedProduct: {
          ...phase.selectedProduct,
          installments: months,
          pricePerInstallment,
        },
      },
      commands: [
        {
          type: "SEND_MESSAGE",
          text: `Perfecto 😊 ${phase.selectedProduct.name}`,
        },
        {
          type: "SEND_MESSAGE",
          text: `📦 En ${months} cuota${months === 1 ? "" : "s"}: S/ ${pricePerInstallment.toFixed(2)} por cuota`,
        },
        {
          type: "SEND_MESSAGE",
          text: "¿Confirmas tu elección?",
        },
      ],
    };
  }

  // If user mentions they want to see payment options
  if (
    /(opciones|cuántas|cuantas|cuotas?)/.test(lower) &&
    /(puedo|puedes|tienes|cuantas?)/.test(lower)
  ) {
    return {
      type: "update",
      nextPhase: phase,
      commands: [
        {
          type: "SEND_MESSAGE",
          text: `Aquí tienes opciones:\n${formatInstallmentOptions(phase.selectedProduct.installmentSchedule)}\n\nO si lo prefieres, ¿en cuántas cuotas quieres pagarlo?`,
        },
      ],
    };
  }

  // Fallback: ask again for number
  return {
    type: "update",
    nextPhase: phase,
    commands: [
      {
        type: "SEND_MESSAGE",
        text: `¿En cuántas cuotas deseas pagar?\n\n${formatInstallmentOptions(phase.selectedProduct.installmentSchedule)}`,
      },
    ],
  };
}

function extractMonths(message: string): number | null {
  // Match patterns like "3", "3 cuotas", "en 3", "tres"
  const numberWords: Record<string, number> = {
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
    once: 11,
    doce: 12,
    trece: 13,
    catorce: 14,
    quince: 15,
    dieciséis: 16,
    dieciseis: 16,
    diecisiete: 17,
    dieciocho: 18,
    diecinueve: 19,
    veinte: 20,
    veintiuno: 21,
    veintidos: 22,
    veintidós: 22,
    veintitrés: 23,
    veintitres: 23,
    veinticuatro: 24,
    treinta: 30,
    treinta_y_seis: 36,
    "treinta y seis": 36,
    cuarenta: 40,
    cuarenta_y_ocho: 48,
    "cuarenta y ocho": 48,
    sesenta: 60,
  };

  // Try to match word (e.g., "tres cuotas")
  for (const [word, num] of Object.entries(numberWords)) {
    if (message.includes(word)) {
      return num;
    }
  }

  // Try to match digit (e.g., "3", "3 cuotas", "en 3")
  const digitMatch = message.match(/\b(\d{1,2})\b/);
  if (digitMatch && digitMatch[1]) {
    return parseInt(digitMatch[1], 10);
  }

  return null;
}

function isRejection(lower: string): boolean {
  return /(no\s+(quiero|deseo|me\s+interesa)|nada|paso|no\s+por\s+ahora|rechazo|no\s+gracias)/.test(
    lower,
  );
}

function isChangingProduct(lower: string): boolean {
  return /(otro|cambiar|diferente|distintos|diferentes|m[aá]s\s+(opciones?|productos?)|\bmuestrame|\bmuestra)/.test(
    lower,
  );
}
