import type { Metadata } from "next";

export const metadata: Metadata = { title: "الصفحة غير موجودة", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="lost">
      <p className="ghost ghost--page" aria-hidden="true" dir="ltr">
        404
      </p>
      <h1 className="display display--md">ما لقينا الصفحة</h1>
      <p className="lede">يمكن الرابط قديم أو انكتب غلط.</p>
      <a className="ribbon-btn ribbon-btn--ink ribbon-btn--md" href="/">
        <span>ارجع للرئيسية</span>
      </a>
    </main>
  );
}
