const DEFAULT_LOCALE = "tr-TR";

export function useLocalizedFormatting() {
  const locale = DEFAULT_LOCALE;

  return {
    locale,
    formatDate: (date: Date | string | null, options?: Intl.DateTimeFormatOptions) => {
      if (!date) return "";
      const parsedDate = typeof date === "string" ? new Date(date) : date;
      const formatter = new Intl.DateTimeFormat(locale, options ?? {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return formatter.format(parsedDate);
    },
    formatPrice: (value: number, currency = "TRY") => {
      const formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return formatter.format(value);
    },
    formatGuests: (count: number) => {
      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      return `${formatter.format(count)} misafir`;
    },
    formatDistance: (meters: number) => {
      return meters < 1000
        ? `${Math.round(meters)} m`
        : `${(meters / 1000).toFixed(1)} km`;
    },
  };
}
