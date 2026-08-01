// node --env-file=.env.local check-supabase.mjs
// 저장까지 확인하려면: TEST_EMAIL=... TEST_PASSWORD=... node --env-file=.env.local check-supabase.mjs
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// FortuneCard 의 countToday 와 같은 식
async function countToday() {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const { count, error } = await sb
    .from("fortunes")
    .select("id", { count: "exact", head: true })
    .gte("drawn_at", midnight.toISOString());
  assert.ok(!error, `count 실패: ${error?.message}`);
  return count ?? 0;
}

// 읽기는 로그아웃 상태에서도 공개
const { error: readErr } = await sb.from("fortunes").select("*").limit(1);
assert.ok(!readErr, `select 실패: ${readErr?.message}`);
const before = await countToday();
assert.ok(Number.isInteger(before), `count 파싱 실패: ${before}`);
console.log(`✅ 읽기/카운트 OK (오늘 ${before}건)`);

// 로그아웃 상태에서는 저장이 막혀야 한다 (RLS 확인)
const { error: anonErr } = await sb.from("fortunes").insert({ name: "침입자", content: "x" });
assert.ok(anonErr, "로그아웃 상태인데 저장이 됐다 — insert 정책이 열려 있다");
console.log(`✅ 비로그인 저장 차단됨 (${anonErr.message})`);

if (!process.env.TEST_EMAIL) {
  console.log("ℹ️  저장 경로는 TEST_EMAIL/TEST_PASSWORD 주면 확인함");
  process.exit(0);
}

const { data: auth, error: authErr } = await sb.auth.signInWithPassword({
  email: process.env.TEST_EMAIL,
  password: process.env.TEST_PASSWORD,
});
assert.ok(!authErr, `로그인 실패: ${authErr?.message}`);
const myName = auth.user.email.split("@")[0];

const content = `점검용 운세 ${process.pid}`;
const { data: row, error: insErr } = await sb
  .from("fortunes")
  .insert({ name: myName, content })
  .select()
  .single();
assert.ok(!insErr, `insert 실패: ${insErr?.message}`);
assert.equal(row.content, content);
assert.equal(row.name, myName);
assert.ok(row.drawn_at, "drawn_at 기본값이 안 들어갔다");
assert.ok(row.user_id, "user_id 가 auth.uid() 로 안 채워졌다");
assert.equal(row.user_id, auth.user.id, "user_id 가 로그인한 사용자와 다르다");

assert.equal(await countToday(), before + 1, "오늘 개수가 1 늘지 않았다");

// ponytail: 정리는 안 한다. anon delete 정책을 열어주는 값이 이 한 줄보다 크다.
console.log(`✅ 로그인 저장 OK (오늘 ${before}→${before + 1}건). 점검 행 id=${row.id}`);
