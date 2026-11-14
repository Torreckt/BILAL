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

// Team specialties shown in the hero and the team section (not dashboard permission roles; see lib/auth.ts).
export const teamRoles = [
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

// TODO: راجع النقاط قبل النشر.
export const reasons = [
  {
    title: "فريق كامل، مو شخص واحد",
    text: "تسعة متخصصين يشتغلون على نشاطك، كل واحد في شغلته، بدل ما يكون كل الحمل على شخص واحد.",
  },
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
