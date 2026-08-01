import { getFourPillars, getRelation, toHangul, STEM_INFO } from "@orrery/core";
import { SIPSIN_FORTUNE, ELEMENT_LUCK } from "@/app/data/fortune";

// getFourPillars 는 [년, 월, 일, 시] 순서로 60갑자를 돌려준다. 우리는 일주만 쓴다.
// 주의: types.d.ts 의 SajuResult.pillars 주석은 (시,일,월,년)이라 순서가 반대다.
// check-saju.mjs 가 이 인덱스를 검증한다 — 라이브러리 올릴 때 같이 돌려볼 것.
const DAY = 2;

// ponytail: 생년월일만 받고 시각은 정오로 고정. 일주는 자시(23~01시) 경계에서만
// 바뀌므로 정오는 안전하다. 시주까지 볼 거면 hour/minute 를 입력받아 넘겨야 한다.
const NOON = 12;

export type Daily = {
  sipsin: string;
  fortune: string;
  myPillar: string;
  todayPillar: string;
  item: string;
  color: string;
  direction: string;
  number: number;
};

function dayStem(y: number, m: number, d: number): { ganzi: string; stem: string } {
  const ganzi = getFourPillars(y, m, d, NOON, 0)[DAY];
  return { ganzi, stem: ganzi[0] };
}

const hangul = (ganzi: string) => [...ganzi].map(toHangul).join("");

/** 생년월일 + 기준일 → 그 날의 운세. 같은 입력이면 항상 같은 결과. */
export function dailyFortune(birth: { year: number; month: number; day: number }, on: Date): Daily {
  const mine = dayStem(birth.year, birth.month, birth.day);
  const today = dayStem(on.getFullYear(), on.getMonth() + 1, on.getDate());

  const relation = getRelation(mine.stem, today.stem);
  if (!relation) throw new Error(`십신을 못 구했다: ${mine.stem} / ${today.stem}`);

  const fortune = SIPSIN_FORTUNE[relation.hangul];
  if (!fortune) throw new Error(`운세 문구가 없는 십신: ${relation.hangul}`);

  // 행운 요소는 오늘 일간의 오행에서. 음양으로 두 수리 중 하나를 고른다.
  const info = STEM_INFO[today.stem];
  const luck = ELEMENT_LUCK[info.element];

  return {
    sipsin: relation.hangul,
    fortune,
    myPillar: hangul(mine.ganzi),
    todayPillar: hangul(today.ganzi),
    item: luck.item,
    color: luck.color,
    direction: luck.direction,
    number: luck.numbers[info.yinyang === "+" ? 0 : 1],
  };
}
