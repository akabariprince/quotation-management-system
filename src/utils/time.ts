const IST_TIME_ZONE = "Asia/Kolkata";

export const formatISTDateTime = (
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(new Date(value));

export const formatISTDateTimeWithLabel = (
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
) => `${formatISTDateTime(value, options)} IST`;
