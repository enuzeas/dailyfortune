// node check-saju.mjs — 사주 운세 로직 자체 점검 (DB/네트워크 불필요)
import assert from "node:assert/strict";
import { getFourPillars, getRelation, toHangul, STEM_INFO } from "@orrery/core";

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

const myGanzi = dayGanzi(...birth);
console.log(
  `✅ 사주 로직 OK — 1990-05-15 생(일주 ${[...myGanzi].map(toHangul).join("")}) / 2026-08-01 → ${a}, 08-06 → ${b}`,
);
