// What a visitor can ask for, and how each kind of request moves through the dashboard. Safe for client components.

export type ContactIntent = "meeting" | "quote" | "inquiry" | "partner";

// `label` is the tab the visitor presses; `noun` names the request in the dashboard, emails and WhatsApp.
export const contactIntents: { id: ContactIntent; label: string; noun: string; emoji: string }[] = [
  { id: "meeting", label: "اجتماع", noun: "طلب اجتماع", emoji: "📅" },
  { id: "quote", label: "عرض سعر", noun: "طلب عرض سعر", emoji: "🧾" },
  { id: "inquiry", label: "استفسار", noun: "استفسار", emoji: "💬" },
  { id: "partner", label: "تعاون", noun: "طلب تعاون وشراكة", emoji: "🤝" },
];
export const intentLabel = (t: string) => contactIntents.find((c) => c.id === t)?.noun ?? t;

export const meetingTypes = ["اجتماع أونلاين", "اجتماع حضوري", "مكالمة هاتفية"];
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
