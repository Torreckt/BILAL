// Dates in the site's business timezone (Riyadh).

/** Today's date in Riyadh as YYYY-MM-DD (the site's business timezone). */
export const riyadhToday = (offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(Date.now() + offsetDays * 864e5);

export const formatDay = (ymd: string) =>
  new Date(`${ymd}T12:00:00+03:00`).toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Riyadh",
  });
