// Contact details — replace the placeholders before going live.
export const WHATSAPP_NUMBER = "966500000000"; // TODO: رقم الواتساب الحقيقي بالصيغة الدولية بدون +
export const INSTAGRAM_HANDLE = "mainstream"; // TODO: اسم الحساب الحقيقي
export const TIKTOK_HANDLE = "mainstream"; // TODO: اسم حساب تيك توك الحقيقي

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_MESSAGE = "هلا ماين ستريم، أبغى أحجز اجتماع.";

export const roles = [
  "مدير حملات",
  "مصمم",
  "كاتب محتوى",
  "مصوّر",
  "مونتير",
  "مدير سوشال",
  "مسوّق مؤثرين",
  "محلل أداء",
  "استراتيجي",
] as const;

export type CaseFile = {
  id: string;
  code: string;
  title: string;
  line: string;
  items: string[];
};

export const caseFiles: CaseFile[] = [
  {
    id: "social",
    code: "SOCIAL",
    title: "السوشال ميديا والمحتوى",
    line: "حساباتك تشتغل كل يوم، وأنت مرتاح.",
    items: [
      "إدارة حسابات السوشال ميديا",
      "خطة محتوى شهرية وكتابة الكابشن",
      "تصوير منتجات وفيديوهات ريلز",
      "مونتاج بإيقاع المنصة",
    ],
  },
  {
    id: "ads",
    code: "ADS",
    title: "الحملات الإعلانية المدفوعة",
    line: "كل ريال إعلاني له هدف ورقم يُقاس.",
    items: [
      "إعلانات Instagram",
      "إعلانات TikTok",
      "إعلانات Snapchat",
      "استهداف وتحسين مستمر للميزانية",
    ],
  },
  {
    id: "influence",
    code: "HYPE",
    title: "المؤثرين والسمعة",
    line: "الناس تتكلم عنك، بالطريقة الصح.",
    items: [
      "تعاون مع المؤثرين",
      "إدارة تقييمات قوقل ماب",
      "عروض وفعاليات موسمية",
      "أفكار إبداعية تعزّز شهرتك",
    ],
  },
  {
    id: "identity",
    code: "BRAND",
    title: "الهوية والتجربة",
    line: "من المنيو إلى الكيس، كل شي يحكي قصتك.",
    items: [
      "هوية بصرية وتغليف",
      "تصميم وتطوير المنيو",
      "تجربة العميل داخل المحل",
      "تقرير أداء شهري",
    ],
  },
];

export const cafePackage = {
  price: "4,000",
  blocks: [
    {
      title: "التسويق والمحتوى",
      items: [
        "إدارة حسابات السوشال ميديا",
        "تصوير منتجات وفيديوهات ريلز",
        "حملات إعلانية مدفوعة",
        "تعاون مع المؤثرين",
        "إدارة تقييمات قوقل ماب",
      ],
    },
    {
      title: "تدريب الباريستا",
      note: "يومين تدريب كل شهر مع المدرب بلال",
      items: ["أنواع القهوة ومصادرها", "درجات الطحن", "نسب الاستخلاص (Ratio)", "مؤشرات الأداء KPIs"],
    },
    {
      title: "سلامة الغذاء",
      items: [
        "النظافة الشخصية وتداول الأغذية",
        "التخزين الصحيح ودرجات الحرارة",
        "منع التلوث الخلطي",
        "الجاهزية لزيارات البلدية",
      ],
    },
    {
      title: "الهوية والتجربة",
      items: [
        "تصميم وتطوير المنيو",
        "هوية بصرية وتغليف",
        "عروض وفعاليات موسمية",
        "أفكار إبداعية لتعزيز شهرة الكوفي",
        "تقرير أداء شهري",
      ],
    },
  ],
  ads: ["Instagram", "TikTok", "Snapchat"],
};
