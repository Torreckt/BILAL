// What a visitor can ask for, and how each kind of request moves through the dashboard. Safe for client components.

export const CONTACT_INTENTS = ["meeting", "quote", "inquiry", "partner"] as const;
export type ContactIntent = (typeof CONTACT_INTENTS)[number];
export const isContactIntent = (v: string): v is ContactIntent => (CONTACT_INTENTS as readonly string[]).includes(v);

// `label` is the tab the visitor presses; `noun` names the request in the dashboard, emails and WhatsApp.
export const contactIntents: { id: ContactIntent; label: string; noun: string; emoji: string }[] = [
  { id: "meeting", label: "اجتماع", noun: "طلب اجتماع", emoji: "📅" },
  { id: "quote", label: "عرض سعر", noun: "طلب عرض سعر", emoji: "🧾" },
  { id: "inquiry", label: "استفسار", noun: "استفسار", emoji: "💬" },
  { id: "partner", label: "تعاون", noun: "طلب تعاون وشراكة", emoji: "🤝" },
];
export const intentLabel = (t: ContactIntent) => contactIntents.find((c) => c.id === t)?.noun ?? t;

export const meetingTypes = ["اجتماع أونلاين", "مكالمة هاتفية"];
export const meetingTimes = ["الصباح", "الظهر", "العصر", "المساء"];

export const REQUEST_STATUSES = ["new", "in_progress", "meeting_confirmed", "quote_sent", "answered", "closed"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const isRequestStatus = (v: string): v is RequestStatus => (REQUEST_STATUSES as readonly string[]).includes(v);

export const statusLabels: Record<RequestStatus, string> = {
  new: "جديد",
  in_progress: "قيد المتابعة",
  meeting_confirmed: "تم تأكيد الاجتماع",
  quote_sent: "تم إرسال العرض",
  answered: "تم الرد",
  closed: "مغلق",
};
const extraStatus: Partial<Record<ContactIntent, RequestStatus>> = {
  meeting: "meeting_confirmed",
  quote: "quote_sent",
  inquiry: "answered",
};
/** Statuses that make sense for a request type, in workflow order. */
export const statusesFor = (type: ContactIntent): RequestStatus[] => {
  const extra = extraStatus[type];
  return ["new", "in_progress", ...(extra ? [extra] : []), "closed"];
};
