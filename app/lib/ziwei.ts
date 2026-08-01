import { createChart } from "@orrery/core";
import { PALACE_KO, PALACE_QUESTION, PALACE_MEANING, MAIN_STAR_KO, starLabel } from "@/app/data/ziwei";

export type PalaceCard = {
  key: string;
  label: string;
  question: string;
  meaning: string;
  isMingGong: boolean;
  isShenGong: boolean;
  stars: { label: string; brightness: string; isMain: boolean }[];
};

/**
 * 12궁 명반. createChart 가 채워주는 순서(命身財事業전통 나열)를 그대로 카드 순서로 쓴다.
 * ponytail: 시각은 자시(子時) 경계를 넘나들 수 있어 정오 고정이 안 통한다 — 실제 태어난 시각이 필요.
 */
export function ziweiDeck(
  birth: { year: number; month: number; day: number },
  time: { hour: number; minute: number },
  isMale: boolean,
): PalaceCard[] {
  const chart = createChart(birth.year, birth.month, birth.day, time.hour, time.minute, isMale);
  return Object.values(chart.palaces).map((p) => ({
    key: p.name,
    label: PALACE_KO[p.name] ?? p.name,
    question: PALACE_QUESTION[p.name] ?? "",
    meaning: PALACE_MEANING[p.name] ?? "",
    isMingGong: p.name === "命宮",
    isShenGong: p.isShenGong,
    stars: p.stars.map((s) => ({
      label: starLabel(s.name),
      brightness: s.brightness,
      isMain: s.name in MAIN_STAR_KO,
    })),
  }));
}
