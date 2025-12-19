export const FNB_APPROVED = (name: string, credit: number) =>
    `¡Excelente noticia, ${name}! Tienes una línea de crédito aprobada de S/ ${credit.toFixed(2)}. Tenemos celulares, laptops, televisores, electrodomésticos y más. ¿Qué tipo de producto te interesa?`;

export const GASO_OFFER_KITCHEN_BUNDLE = `¡Calificas para nuestro programa! Tenemos combos especiales que incluyen cocina + electrodomésticos con cuotas desde S/ 80 mensuales. ¿Te gustaría conocer las opciones?`;

export const KITCHEN_OBJECTION_RESPONSE = `Entiendo tu preferencia. Te comento que el combo con cocina es un requisito financiero de Cálidda para acceder a las mejores tasas. Las cuotas son accesibles y puedes financiar hasta 18 meses. ¿Quieres que te muestre las opciones disponibles?`;

export const THERMA_ALTERNATIVE = `Como alternativa, también tenemos combos con termas. ¿Te interesaría explorar esa opción?`;

export const OFFER_PRODUCTS = (category: string) =>
    `Perfecto, aquí están nuestras mejores opciones en ${category}:`;

export const ASK_PRODUCT_INTEREST = `¿Qué producto te gustaría conocer? Tenemos celulares, cocinas, laptops, refrigeradoras, televisores y más.`;

export const CONFIRM_SELECTION = `¡Excelente elección! Un asesor se comunicará contigo para coordinar la entrega y firma. ¿Hay algo más en lo que pueda ayudarte?`;

export const ASK_FOR_SPECS = `Si necesitas más detalles técnicos de algún producto, solo pregúntame. ¿Cuál te interesa más?`;

export const INSTALLMENTS_INFO = (
    installments: number,
    monthlyPayment: number,
) =>
    `Este producto se puede pagar en ${installments} cuotas mensuales de aproximadamente S/ ${monthlyPayment.toFixed(2)} cada una.`;

export const OUT_OF_CATALOG_REQUEST = `Ese producto específico no está en mi catálogo actual, pero un asesor puede ayudarte con opciones personalizadas. Te contactaremos pronto.`;

export const CREDIT_EXCEEDED = `El monto de ese producto excede tu línea disponible, pero un asesor puede revisar opciones especiales para ti. Te contactaremos pronto.`;

export const MULTIPLE_PRODUCTS_REQUEST = `¡Me encanta tu entusiasmo! Para combinar varios productos, un asesor te ayudará a armar el mejor paquete. Te contactaremos en breve.`;
