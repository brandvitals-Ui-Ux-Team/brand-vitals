import { MapPin, Star, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../../../hq/src/lib/i18n";
import { avg } from "../lib/store";
import type { Talent } from "../lib/types";
import { Art, Avatar, CAT, KindTag, LevelBadge, VettedMark, useMoney } from "./ui";

export function TalentCard({ t, footer }: { t: Talent; footer?: ReactNode }) {
  const { L } = useI18n();
  const money = useMoney();
  return <div className="talent card">
    <div className="talent__art">{t.portfolio.slice(0, 2).map(p => <Art key={p} title={p} alt={p} />)}{t.portfolio.length === 0 && <div className="art" />}</div>
    <div className="talent__b">
      <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
        <Avatar name={t.name} />
        <div style={{ minWidth: 0, flex: 1 }}><b className="ellipsis" style={{ display: "block" }}>{t.name}</b><span className="small muted">{L(t.title, t.title_ar)}</span></div>
        <LevelBadge level={t.level} />
      </div>
      <div className="row" style={{ gap: 6 }}><VettedMark t={t} /><KindTag t={t} /><span className="tag">{L(...CAT[t.category])}</span></div>
      <div className="talent__stats small">
        <span title={L("Vetting score", "درجة الاعتماد")}><Star size={13} />{avg(t.scores).toFixed(1)}</span>
        <span>{t.jobs} {L("jobs", "شغلانة")}</span>
        <span><Timer size={13} />{t.on_time}% {L("on time", "في الميعاد")}</span>
        <span><MapPin size={13} />{L(t.city, t.city_ar)}</span>
      </div>
      <div className="row row--between"><span className="small faint">{L("Projects from", "المشاريع من")} <b className="muted">{money(t.rate, t.currency)}</b></span>{footer}</div>
    </div>
  </div>;
}
