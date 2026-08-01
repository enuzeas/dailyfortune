"use client";

import { useMemo, useState } from "react";
import { ziweiDeck, type PalaceCard } from "@/app/lib/ziwei";

type Props = { birth: string; birthTime: string; gender: string };

export default function ZiweiDeck({ birth, birthTime, gender }: Props) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set());

  const deck = useMemo(() => {
    if (!birth || !birthTime || !gender) return null;
    const [y, m, d] = birth.split("-").map(Number);
    const [hour, minute] = birthTime.split(":").map(Number);
    try {
      return ziweiDeck({ year: y, month: m, day: d }, { hour, minute }, gender === "M");
    } catch {
      return null;
    }
  }, [birth, birthTime, gender]);

  if (!birth || !birthTime || !gender) {
    return (
      <section className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-lg font-extrabold text-white">자미두수 명반</h2>
        <p className="text-sm text-white/60">위에서 태어난 시각과 성별을 저장하면 12궁 카드가 열려요.</p>
      </section>
    );
  }

  if (!deck) {
    return (
      <p role="alert" className="rounded-small bg-ink-black/60 px-4 py-2 text-sm text-white">
        명반 계산에 실패했습니다. 생년월일/시각을 확인해주세요.
      </p>
    );
  }

  function toggle(key: string) {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="flex w-full max-w-2xl flex-col items-center gap-4">
      <h2 className="text-lg font-extrabold text-white">자미두수 명반 — 카드를 눌러 궁을 열어보세요</h2>
      <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-4">
        {deck.map((card) => (
          <PalaceCardView
            key={card.key}
            card={card}
            isFlipped={flipped.has(card.key)}
            onFlip={() => toggle(card.key)}
          />
        ))}
      </div>
    </section>
  );
}

function PalaceCardView({
  card,
  isFlipped,
  onFlip,
}: {
  card: PalaceCard;
  isFlipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div className="[perspective:1000px]">
      <div
        onClick={onFlip}
        className="relative aspect-[0.718] w-full cursor-pointer transition-transform duration-500 ease-out [transform-style:preserve-3d]"
        style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        {/* front (face-down) */}
        <div className="rainbow-border tcg-radius absolute inset-0 overflow-hidden p-1 [backface-visibility:hidden]">
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-white/20">
            <span className="text-xl">🔮</span>
            {card.isMingGong && <span className="text-[9px] text-mustard-pop">★ 명궁</span>}
          </div>
        </div>

        {/* back (revealed) */}
        <div
          className="rainbow-border tcg-radius absolute inset-0 overflow-hidden p-1 [backface-visibility:hidden]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="flex h-full w-full flex-col items-center justify-start gap-1 overflow-hidden rounded-2xl border border-white/20 bg-linen-canvas p-2 text-center text-ink-black">
            <p className="text-[11px] leading-tight font-extrabold">
              {card.isMingGong && "★ "}
              {card.label}
              {card.isShenGong && <span className="text-sage-mute"> (신궁)</span>}
            </p>
            <div className="flex flex-wrap justify-center gap-1">
              {card.stars.map((s) => (
                <span
                  key={s.label}
                  className={`rounded-small px-1 text-[9px] ${
                    s.isMain ? "bg-mustard-pop font-bold text-ink-black" : "bg-sage-mute/25 text-ink-black"
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
            <p className="text-[9px] leading-tight text-sage-mute">{card.meaning}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
