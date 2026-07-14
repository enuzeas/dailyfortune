"use client";

import { useRef, useState } from "react";
import { FORTUNES, LUCKY_ITEMS, LUCKY_COLORS, LUCKY_DIRECTIONS } from "@/app/data/fortune";

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

type Result = {
  fortune: string;
  item: string;
  color: string;
  direction: string;
  number: number;
};

function drawResult(): Result {
  return {
    fortune: pick(FORTUNES),
    item: pick(LUCKY_ITEMS),
    color: pick(LUCKY_COLORS),
    direction: pick(LUCKY_DIRECTIONS),
    number: Math.floor(Math.random() * 99) + 1,
  };
}

const TILE_STYLES = [
  { bg: "bg-lavender-mist", text: "text-ink-black" },
  { bg: "bg-mustard-pop", text: "text-ink-black" },
  { bg: "bg-forest-ink", text: "text-white" },
  { bg: "bg-lime-spark", text: "text-ink-black" },
];

export default function FortuneCard() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isBack = (rotation / 180) % 2 === 1;

  function handleClick() {
    const next = rotation + 180;
    setRotation(next);
    if ((next / 180) % 2 === 1) {
      setResult(drawResult());
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--pointer-x", `${px.toFixed(1)}%`);
    el.style.setProperty("--pointer-y", `${py.toFixed(1)}%`);
    el.style.setProperty("--tilt-x", `${((50 - py) / 4).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((px - 50) / 4).toFixed(2)}deg`);
    el.style.setProperty("--holo-opacity", "1");
  }

  function handlePointerLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--pointer-x", "50%");
    el.style.setProperty("--pointer-y", "50%");
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--holo-opacity", "0");
  }

  const tiles = result
    ? [
        { label: "행운 아이템", value: result.item },
        { label: "행운 색깔", value: result.color },
        { label: "행운 방향", value: result.direction },
        { label: "행운 숫자", value: String(result.number) },
      ]
    : [];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="[perspective:1200px]">
        <div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
          className="holo-card relative aspect-[0.718] w-72 cursor-pointer transition-transform duration-300 ease-out [transform-style:preserve-3d] hover:scale-105"
        >
          <div
            className="relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d]"
            style={{ transform: `rotateY(${rotation}deg) scale(${isBack ? 1.5 : 1})` }}
          >
            {/* front */}
            <div
              className="rainbow-border tcg-radius absolute inset-0 overflow-hidden p-3 [backface-visibility:hidden]"
              style={{ transform: "rotateX(var(--tilt-x)) rotateY(var(--tilt-y))" }}
            >
              {/* hologram lives on this inner panel's own surface, not the outer frame */}
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20">
                <div className="holo-shine rounded-3xl" />
                <div className="holo-glare rounded-3xl" />

                <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="text-5xl">🔮</span>
                  <p className="text-xl font-extrabold tracking-tight text-white">오늘의 운세</p>
                  <p className="text-sm text-white/70">버튼을 눌러 카드를 뒤집어보세요</p>
                </div>
              </div>
            </div>

            {/* back */}
            <div
              className="rainbow-border tcg-radius absolute inset-0 overflow-hidden p-3 [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))" }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20">
                <div className="holo-shine rounded-3xl" />
                <div className="holo-glare rounded-3xl" />

                <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
                  {result && (
                    <>
                      <span className="text-4xl">✨</span>
                      <p className="text-sm leading-relaxed font-medium text-white">
                        {result.fortune}
                      </p>
                      <div className="grid w-full grid-cols-2 gap-2">
                        {tiles.map((tile, i) => (
                          <div
                            key={tile.label}
                            className={`relative overflow-hidden rounded-small border-2 border-ink-black ${TILE_STYLES[i].bg}`}
                          >
                            <div className="holo-shine rounded-small" />
                            <div className="holo-glare rounded-small" />
                            <div className={`relative px-3 py-2 text-left ${TILE_STYLES[i].text}`}>
                              <p className="text-[11px] opacity-70">{tile.label}</p>
                              <p className="text-base font-bold">{tile.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleClick}
        className="rainbow-button rounded-pill border-[3px] border-ink-black px-7 py-[18px] text-base font-bold text-ink-black transition hover:brightness-110 active:translate-y-[2px]"
      >
        {isBack ? "다시 뽑기" : "오늘의 운세 보기"}
      </button>
    </div>
  );
}
