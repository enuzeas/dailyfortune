// node --experimental-strip-types check-saju.mjs — 사주 운세 로직 자체 점검 (DB/네트워크 불필요)
import assert from "node:assert/strict";
import { getFourPillars, getRelation, toHangul, STEM_INFO } from "@orrery/core";
// app/data/fortune.ts 는 별칭 import 가 없는 leaf 파일이라 실제 데이터를 그대로 불러와 검증한다.
import { SIPSIN_GROUP, GROUP_CYCLE, TOPICS, RELATION_READING } from "./app/data/fortune.ts";

// app/lib/saju.ts 와 같은 계산. TS 를 그대로 못 불러오므로 여기서 재현한다.
const STEMS = "甲乙丙丁戊己庚辛壬癸".split("");
const dayGanzi = (y, m, d) => getFourPillars(y, m, d, 12, 0)[2];

// 1) 인덱스 순서가 [년, 월, 일, 시] 임을 고정한다. 라이브러리가 바뀌면 여기서 터진다.
assert.equal(getFourPillars(2026, 8, 1, 12, 0)[0], "丙午", "idx0 은 년주(2026=병오년)");
assert.equal(dayGanzi(2026, 8, 1), "丁未", "idx2 는 일주");
// 일주는 하루에 정확히 한 갑자씩 넘어간다 (월주처럼 절기에서만 바뀌면 안 됨)
assert.equal(dayGanzi(2026, 8, 2), "戊申");
assert.equal(dayGanzi(2026, 8, 3), "己酉");
// 시주만 시각에 반응하고 일주는 정오 기준 그대로여야 한다
assert.equal(getFourPillars(2026, 8, 1, 2, 0)[2], "丁未", "시각이 달라도 일주는 같아야");
assert.notEqual(
  getFourPillars(2026, 8, 1, 2, 0)[3],
  getFourPillars(2026, 8, 1, 22, 0)[3],
  "idx3 은 시주라 시각에 따라 달라야",
);

// 2) 십신 10종이 전부 나오고, 각각 운세 문구가 있어야 한다
const SIPSIN = new Set();
for (const mine of STEMS) for (const other of STEMS) SIPSIN.add(getRelation(mine, other).hangul);
assert.equal(SIPSIN.size, 10, `십신이 10종이 아님: ${[...SIPSIN]}`);

const FORTUNE_KEYS = [
  "비견", "겁재", "식신", "상관", "편재",
  "정재", "편관", "정관", "편인", "정인",
];
for (const s of SIPSIN) assert.ok(FORTUNE_KEYS.includes(s), `운세 문구 없는 십신: ${s}`);

// 3) 결정론: 같은 생일 + 같은 날 → 같은 십신
const pick = (birth, on) => getRelation(dayGanzi(...birth)[0], dayGanzi(...on)[0]).hangul;
const birth = [1990, 5, 15];
assert.equal(pick(birth, [2026, 8, 1]), pick(birth, [2026, 8, 1]), "같은 입력인데 결과가 다르다");

// 4) 날이 바뀌면 60갑자가 돌아 십신도 바뀌어야 한다 (10일이면 반드시 다름)
const a = pick(birth, [2026, 8, 1]);
const b = pick(birth, [2026, 8, 6]);
assert.notEqual(a, b, "닷새 지났는데 십신이 그대로다");

// 5) 오행/음양이 다 채워져 있어야 행운 요소를 뽑을 수 있다
for (const s of STEMS) {
  const info = STEM_INFO[s];
  assert.ok(info, `STEM_INFO 없음: ${s}`);
  assert.ok(["tree", "fire", "earth", "metal", "water"].includes(info.element), `오행 이상: ${s}`);
  assert.ok(["+", "-"].includes(info.yinyang), `음양 이상: ${s}`);
}

// 6) 한글 변환은 글자 단위
assert.equal([..."乙未"].map(toHangul).join(""), "을미");

// 7) 십신 10종이 전부 SIPSIN_GROUP 5개 그룹 중 하나에 속해야 한다 (분야 매칭의 전제)
for (const s of SIPSIN) assert.ok(GROUP_CYCLE.includes(SIPSIN_GROUP[s]), `그룹 없는 십신: ${s}`);

// 8) app/lib/saju.ts 의 topicReading 과 같은 공식. diff 5종 전부 문구가 있어야 한다.
const relationDiff = (todayGroup, topicGroup) => {
  const t = GROUP_CYCLE.indexOf(todayGroup);
  const p = GROUP_CYCLE.indexOf(topicGroup);
  return (((p - t) % 5) + 5) % 5;
};
for (let d = 0; d < 5; d++) assert.ok(RELATION_READING[d], `관계 문구 없음: diff=${d}`);

// 9) 관계 공식이 사주 이론과 맞는지 두 지점으로 확인.
//    비겁(0)은 재성(2)을 극한다 → 오늘이 비겁이고 분야가 재성이면 diff=2("오늘이 분야를 누른다")
assert.equal(relationDiff("비겁", "재성"), 2);
//    재성(2)은 비겁(0)에게 극을 당한다(반대 방향) → 오늘이 재성, 분야가 비겁이면 diff=3("분야가 오늘을 누른다")
assert.equal(relationDiff("재성", "비겁"), 3);
// 같은 그룹이면 diff=0 (정면으로 들어온다)
assert.equal(relationDiff("재성", "재성"), 0);

// 10) 질문 키워드가 의도한 분야로 매칭되는지 (연애/재물이 둘 다 '재성'이라 라벨로만 구분됨)
const matchTopic = (q) => TOPICS.find((t) => t.keywords.some((k) => q.includes(k))) ?? null;
assert.equal(matchTopic("이직할까 고민이에요")?.label, "일·직장");
assert.equal(matchTopic("소개팅 잘 될까요")?.label, "연애");
assert.equal(matchTopic("이번 시험 어떨까요")?.label, "공부·시험");
assert.equal(matchTopic("그냥 오늘 하루 어때요")?.label, undefined, "매칭 안 되면 null(일반 운세)이어야");

const myGanzi = dayGanzi(...birth);
console.log(
  `✅ 사주 로직 OK — 1990-05-15 생(일주 ${[...myGanzi].map(toHangul).join("")}) / 2026-08-01 → ${a}, 08-06 → ${b}`,
);
