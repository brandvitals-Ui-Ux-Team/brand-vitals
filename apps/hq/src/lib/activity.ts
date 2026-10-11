// Activity summaries are stored in English; this renders them in Arabic too.
import type { Lang } from "./types";

const AR: [RegExp, string][] = [
  [/^approved change order/, "وافق على أمر التغيير"],
  [/^declined change order/, "رفض أمر التغيير"],
  [/^drafted change order/, "أنشأ أمر تغيير"],
  [/^sent change order/, "أرسل أمر التغيير"],
  [/^requested changes on/, "طلب تعديلات على"],
  [/^approved/, "وافق على"],
  [/^recorded (.+?)'s approval of/, "سجّل موافقة $1 على"],
  [/^sent (.+) for review$/, "أرسل $1 للمراجعة"],
  [/^uploaded (v\d+) of/, "رفع النسخة $1 من"],
  [/^created deliverable/, "أنشأ التسليمة"],
  [/^created project/, "أنشأ المشروع"],
  [/^created task/, "أنشأ المهمة"],
  [/^added client/, "أضاف العميل"],
  [/^completed/, "أنجز"],
  [/^invited/, "دعا"]
];
export function summary(text: string, lang: Lang) {
  if (lang !== "ar") return text;
  for (const [re, rep] of AR) if (re.test(text)) return text.replace(re, rep);
  return text;
}
