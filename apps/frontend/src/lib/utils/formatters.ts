export function formatPrice(price: number): string {
    return price.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function formatDate(date: string | Date | number): string {
    // Database stores Unix timestamps (ms) which parse correctly as UTC
    return new Date(date).toLocaleDateString("es-PE", {
        timeZone: "America/Lima", // GMT-5
    });
}

export function formatDateTime(date: string | Date | number): string {
    // Database stores Unix timestamps (ms) which parse correctly as UTC
    return new Date(date).toLocaleString("es-PE", {
        timeZone: "America/Lima", // GMT-5
    });
}

export function formatTime(date: string | Date | number): string {
    // Database stores Unix timestamps (ms) which parse correctly as UTC
    return new Date(date).toLocaleTimeString("es-PE", {
        timeZone: "America/Lima", // GMT-5
    });
}

export function formatPhone(phone: string): string {
    return phone.startsWith("51") ? `+${phone}` : phone;
}

export function pluralize(
    count: number,
    singular: string,
    plural: string,
): string {
    return count === 1 ? singular : plural;
}
