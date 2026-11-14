// Fallback contact details; the live values are edited from the dashboard (settings → links).
export const defaultLinks = {
  whatsapp: "966594357444", // 0594357444 بالصيغة الدولية بدون +
  instagram: "sa.mainstream",
  tiktok: "sa.mainstream",
  email: "Info@imainstream.net",
};
export type Links = typeof defaultLinks;

export const whatsappLink = (number: string, message: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

export const DEFAULT_MESSAGE = "هلا ماين ستريم، أبغى أحجز اجتماع.";

export const roles = [
  "مدير حملات",
  "مصمم",
  "كاتب محتوى",
  "مصوّر",
  "مسؤول تدريب",
  "مدير سوشال",
  "مسؤول سلامة أغذية",
  "محلل أداء",
  "استراتيجي",
] as const;

export const reasons = [
  {
    title: "أرقام واضحة كل شهر",
    text: "تقرير أداء شهري: وش نشرنا، وش صرفنا، ووش صار بالأرقام.",
  },
  {
    title: "نتكلم لغة جمهورك",
    text: "محتوى سعودي بلهجة قريبة من الناس، مو ترجمة ولا كلام شركات.",
  },
  {
    title: "كل شي في مكان واحد",
    text: "من التصوير والمحتوى للإعلان والموقع، بدون ما تتنقل بين خمس جهات.",
  },
];

// TODO: أكّد القطاعات اللي تشتغلون معها فعلاً.
export const sectors = [
  "كوفيهات ومطاعم",
  "متاجر وبراندات",
  "عيادات ومراكز تجميل",
  "عقار ومقاولات",
  "صالونات وسبا",
  "شركات ناشئة",
  "تعليم وتدريب",
  "فعاليات ومعارض",
];

export type ContactIntent = "meeting" | "quote" | "inquiry" | "partner";

// `label` is the tab the visitor presses; `noun` names the request in the dashboard, emails and WhatsApp.
export const contactIntents: { id: ContactIntent; label: string; noun: string; emoji: string }[] = [
  { id: "meeting", label: "اجتماع", noun: "طلب اجتماع", emoji: "📅" },
  { id: "quote", label: "عرض سعر", noun: "طلب عرض سعر", emoji: "🧾" },
  { id: "inquiry", label: "استفسار", noun: "استفسار", emoji: "💬" },
  { id: "partner", label: "تعاون", noun: "طلب تعاون وشراكة", emoji: "🤝" },
];
export const intentLabel = (t: string) => contactIntents.find((c) => c.id === t)?.noun ?? t;

export const meetingTypes = ["اجتماع أونلاين", "مكالمة هاتفية"];
export const meetingTimes = ["الصباح", "الظهر", "العصر", "المساء"];

export const statusLabels: Record<string, string> = {
  new: "جديد",
  in_progress: "قيد المتابعة",
  meeting_confirmed: "تم تأكيد الاجتماع",
  quote_sent: "تم إرسال العرض",
  answered: "تم الرد",
  closed: "مغلق",
};
const extraStatus: Partial<Record<ContactIntent, string>> = {
  meeting: "meeting_confirmed",
  quote: "quote_sent",
  inquiry: "answered",
};
/** Statuses that make sense for a request type, in workflow order. */
export const statusesFor = (type: ContactIntent) => [
  "new",
  "in_progress",
  ...(extraStatus[type] ? [extraStatus[type]!] : []),
  "closed",
];

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
