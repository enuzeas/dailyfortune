// node --experimental-strip-types check-ziwei.mjs — 자미두수 12궁 덱 점검 (DB/네트워크 불필요)
import assert from "node:assert/strict";
import { createChart } from "@orrery/core";
import { PALACE_KO, PALACE_QUESTION, PALACE_MEANING, MAIN_STAR_KO, MINOR_STAR_KO, starLabel } from "./app/data/ziwei.ts";

// app/lib/ziwei.ts 와 같은 계산. 별칭(@/) import 때문에 여기서 재현한다.
function ziweiDeck(birth, time, isMale) {
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

const PALACE_KEYS = [
  "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄",
  "遷移", "交友", "官祿", "田宅", "福德", "父母",
];

// 1) 12궁 전부 한글 라벨/질문/해석이 있어야 한다 (질문 = 카드 앞면, 해석 = 뒤집었을 때 답)
for (const k of PALACE_KEYS) {
  assert.ok(PALACE_KO[k], `PALACE_KO 누락: ${k}`);
  assert.ok(PALACE_QUESTION[k], `PALACE_QUESTION 누락: ${k}`);
  assert.ok(PALACE_MEANING[k], `PALACE_MEANING 누락: ${k}`);
}
// 질문은 서로 달라야 한다 — 같은 문구가 두 궁에 붙으면 카드 앞면만 보고는 구분이 안 된다
assert.equal(new Set(Object.values(PALACE_QUESTION)).size, PALACE_KEYS.length, "중복된 질문이 있다");

// 2) 14주성 전부 이름+특징이 있어야 한다 (README 가 내세우는 핵심 기능)
const MAIN_STARS = [
  "紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府",
  "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍",
];
assert.equal(Object.keys(MAIN_STAR_KO).length, 14, "14주성 개수가 안 맞음");
assert.equal(Object.keys(MINOR_STAR_KO).length, 14, "보조성(6길+6살+2) 개수가 안 맞음");
for (const s of MAIN_STARS) {
  assert.ok(MAIN_STAR_KO[s]?.name, `MAIN_STAR_KO 누락: ${s}`);
  assert.ok(MAIN_STAR_KO[s]?.trait, `특징 문구 누락: ${s}`);
}

// 3) starLabel 은 모르는 별도 원문 그대로 돌려줘 화면이 깨지지 않아야 한다
assert.equal(starLabel("紫微"), "자미");
assert.equal(starLabel("???"), "???", "미등록 별은 원문 그대로 폴백해야 한다");

// 4) 실제 명반 계산 — 12궁이 다 나오고, 명궁 정확히 하나, 라벨 누락 없어야 한다
const deck = ziweiDeck({ year: 1990, month: 5, day: 15 }, { hour: 14, minute: 30 }, true);
assert.equal(deck.length, 12, "궁이 12개가 아님");
assert.equal(deck.filter((c) => c.isMingGong).length, 1, "명궁이 정확히 하나여야 한다");
assert.equal(deck.filter((c) => c.isShenGong).length, 1, "신궁이 정확히 하나여야 한다(12궁 중 하나와 겹침)");
for (const c of deck) {
  assert.ok(c.label, `라벨 없는 궁: ${c.key}`);
  assert.ok(c.question, `질문 없는 궁: ${c.key}`);
  assert.ok(c.meaning, `해석 없는 궁: ${c.key}`);
  assert.ok(c.stars.length > 0, `별이 하나도 없는 궁: ${c.key}`);
}

// 5) 결정론 — 같은 생년월일시+성별이면 항상 같은 명반
const again = ziweiDeck({ year: 1990, month: 5, day: 15 }, { hour: 14, minute: 30 }, true);
assert.deepEqual(deck.map((c) => c.key), again.map((c) => c.key), "같은 입력인데 궁 순서가 다르다");

// 6) 성별이 다르면 대한 방향이 갈려 명반 자체가 달라질 수 있다 — 최소한 에러 없이 계산은 돼야 한다
const female = ziweiDeck({ year: 1990, month: 5, day: 15 }, { hour: 14, minute: 30 }, false);
assert.equal(female.length, 12);

console.log(
  `✅ 자미두수 로직 OK — 1990-05-15 14:30 남 → 명궁 ${deck.find((c) => c.isMingGong).stars.map((s) => s.label).join("+")}, 신궁=${deck.find((c) => c.isShenGong).label}`,
);
