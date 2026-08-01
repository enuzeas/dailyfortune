// node --experimental-strip-types check-ask.mjs — /api/ask 로직 점검 (네트워크 없이, 프롬프트 구성만)
import assert from "node:assert/strict";
import { validateQuestion, chatRequestBody, systemPrompt, MODEL, MAX_QUESTION_LEN } from "./app/lib/ask.ts";

assert.equal(validateQuestion(""), "질문을 입력해주세요.");
assert.equal(validateQuestion("   "), "질문을 입력해주세요.");
assert.ok(validateQuestion("a".repeat(MAX_QUESTION_LEN + 1))?.includes("이내"));
assert.equal(validateQuestion("정상적인 질문입니다"), null);

const body = chatRequestBody("시스템 프롬프트", "질문 내용");
assert.equal(body.model, MODEL);
// 실제로 겪은 버그: reasoning 을 안 끄면 이 모델이 사고 과정에 토큰을 다 써서 답이 잘린다.
assert.equal(body.reasoning.enabled, false, "reasoning 비활성화가 빠지면 답이 중간에 잘린다");
assert.ok(body.max_tokens >= 300, "max_tokens 가 너무 작으면 reasoning 모델이 답을 다 못 낸다");
assert.deepEqual(
  body.messages.map((m) => m.role),
  ["system", "user"],
);
assert.equal(body.messages[1].content, "질문 내용");

const sys = systemPrompt("[사실 텍스트]");
assert.ok(sys.includes("[사실 텍스트]"), "facts 가 프롬프트에 안 들어감");
assert.ok(sys.includes("지어내지"), "근거 없는 정보 금지 지침이 빠졌다");

console.log("✅ ask 로직 OK — validate/prompt/body 구성 정상");
