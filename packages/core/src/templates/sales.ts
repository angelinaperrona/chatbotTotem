export const FNB_APPROVED = (
  name: string,
  credit: number,
  groups: string[],
) => {
  const groupList =
    groups.length > 0 ? groups.join(", ") : "productos disponibles";

  return [
    [
      `¡Excelente noticia, ${name}! 🎉 Tienes una línea de crédito aprobada de S/ ${credit.toFixed(2)}.`,
      `¿Qué estás buscando? Tengo productos de ${groupList}.`,
    ],
    [
      `${name}, ¡buenas noticias! 😊 Tu crédito aprobado es de S/ ${credit.toFixed(2)}.`,
      `Tengo productos de ${groupList}. ¿Alguno te interesa? 🤔`,
    ],
    [
      `Perfecto ${name} 🎉 Calificas con S/ ${credit.toFixed(2)} de línea.`,
      `Tengo ${groupList}. ¿Qué te gustaría ver?`,
    ],
  ];
};

export const GASO_OFFER_KITCHEN_BUNDLE = (productList: string) => [
  [
    `¡Excelente noticia, calificas para nuestro programa! 🎉 Tenemos ${productList}.`,
    `¿Quieres ver las opciones?`,
  ],
  [
    `Perfecto, estás aprobado 😊 Tenemos ${productList} disponibles.`,
    `¿Te muestro qué hay?`,
  ],
  [
    `Genial, calificas para el programa 🙌. Hay ${productList} que puedes elegir.`,
    `¿Quieres conocerlos?`,
  ],
];

export const KITCHEN_OBJECTION_RESPONSE = [
  [
    "Entiendo totalmente. El tema es que sin la cocina no se aprueba el financiamiento, pero hay opciones variadas y las cuotas son cómodas (hasta 18 meses). ¿Las vemos? 😊",
  ],
  [
    "Te entiendo. Lamentablemente es requisito incluir la cocina para que te den el crédito, pero con cuotas flexibles hasta 18 meses. ¿Te gustaría ver qué modelos hay?",
  ],
  [
    "Claro, sé que quizás no la necesites. Pero se requiere la cocina para aprobar el financiamiento con buenas tasas. Hay varios modelos. ¿Los revisamos?",
  ],
];

export const THERMA_ALTERNATIVE = [
  [
    "Como alternativa, también tenemos combos con termas. ¿Te interesaría explorar esa opción? 😊",
  ],
  [
    "Si prefieres, también hay combos con terma en lugar de cocina. ¿Quieres verlos?",
  ],
  ["Otra opción: combos con terma. ¿Te llama más la atención?"],
];

export const ASK_PRODUCT_INTEREST = (productList: string) => [
  [`¿Qué producto te gustaría conocer? 😊 Tenemos ${productList}.`],
  [`¿Qué te llama la atención? ${productList}.`],
  [`¿En qué estás pensando? Tenemos ${productList}.`],
];

export const CONFIRM_PURCHASE = (name: string) => [
  [
    `¡Excelente, ${name}! 🎉`,
    `En unos minutos mi compañero te llamará a este número para poder realizar el contrato.`,
    `Recuerda tener a la mano tu DNI. ¡Gracias por confiar en nosotros!`,
  ],
  [
    `Perfecto ${name} 😊`,
    `Te llamaremos en breve a este número para finalizar los detalles del contrato.`,
  ],
  [
    `¡Genial, ${name}! 🎉 Te contactaremos pronto para coordinar el contrato por teléfono.`,
  ],
];

export const PRICE_CONCERN = {
  standard: [
    [
      "Te entiendo 😊 Por eso está el financiamiento en cuotas que salen en tu recibo de Cálidda para hacerlo más cómodo.",
      "¿Qué productos te interesan?",
    ],
    [
      "Claro, por eso las cuotas mensuales ayudan. Se cobran directo en tu recibo de Cálidda.",
      "¿Te interesa algún producto en particular? 🤔",
    ],
    [
      "Entiendo. Lo bueno es que puedes pagarlo en cuotas por tu recibo de Cálidda. 🫂",
      "¿Hay algo que te llame la atención?",
    ],
  ],
  empathetic: [
    [
      "Totalmente entendible 😊 Por eso ofrecemos el financiamiento en cuotas que se suman a tu recibo de Cálidda para que sea más accesible.",
      "¿Te interesa ver algún producto?",
    ],
    [
      "Te entiendo perfectamente. Las cuotas mensuales hacen que sea más manejable, y salen directo en tu recibo. ¿Cuál te gustaría conocer?",
    ],
    [
      "Entiendo totalmente tu preocupación. El financiamiento ayuda a distribuir el pago en cuotas bajas.",
      "¿Qué estás buscando?",
    ],
  ],
};

// Helper: safe list formatting
function formatList(list: string[]): string {
  if (!list || list.length === 0) return "nuestros productos";
  if (list.length === 1) return list[0] ?? "";
  const last = list.pop();
  return `${list.join(", ")} y ${last}`;
}

export const CREDIT_LIMIT_EXPLANATION = (
  requestedCategory: string,
  availableCategories: string[],
  credit: number,
) => {
  const options = formatList([...availableCategories]); // Copy to avoid mutation
  return [
    [
      `Los productos de **${requestedCategory}** suelen pedir una línea de crédito un poco más alta (tú tienes S/ ${credit.toFixed(2)}).`,
      `Pero con tu línea aprobada te puedes llevar **${options}** sin inicial. ¿Te muestro alguno de esos? 😊`,
    ],
    [
      `Para **${requestedCategory}** a veces piden más crédito o una inicial.`,
      `Con tu línea de S/ ${credit.toFixed(2)} tengo disponibles: **${options}**. ¿Les damos una mirada?`,
    ],
  ];
};

export const UNAVAILABLE_PRODUCT = (
  requestedCategory: string,
  availableCategories: string[],
) => {
  const options = formatList([...availableCategories]);
  return [
    [
      `Uy, **${requestedCategory}** no nos han llegado por ahora 😕.`,
      `Pero si buscas algo nuevo, tengo **${options}**. ¿Te animas a ver alguno?`,
    ],
    [
      `Por el momento no tenemos **${requestedCategory}** en stock.`,
      `Lo que sí tengo listo para entrega son: **${options}**. ¿Cuál te llama la atención?`,
    ],
    [
      `Mmm, **${requestedCategory}** se nos agotaron temporalmente.`,
      `¿Te gustaría ver **${options}**?`,
    ],
  ];
};

export const SPECIFIC_PRODUCT_ALTERNATIVE = (
  requestedProduct: string,
  category: string,
) => [
  [
    `Ese modelo exacto (${requestedProduct}) no lo tengo ahorita en stock.`,
    `Pero en **${category}** tengo modelos muy buenos. ¿Quieres ver sus fotos?`,
  ],
  [
    `El ${requestedProduct} voló, ya no me queda.`,
    `Pero tengo otros **${category}** con características parecidas. ¿Te las paso?`,
  ],
];

export const NON_FNB_TRANSFER = [
  [
    "Perfecto, voy a conectarte con mi compañero para que realice tu evaluación y te muestre las opciones disponibles. Se comunicará contigo en unos momentos 😊",
  ],
  [
    "Entendido, déjame transferirte con mi compañero especialista que te evaluará y presentará las mejores opciones para ti. Gracias por tu paciencia 🙌",
  ],
  [
    "Excelente, te pasaré con mi compañero para que haga tu evaluación. Una vez confirmados tus datos, te mostrará todas las opciones que tienes. ¡Gracias! 😊",
  ],
];
