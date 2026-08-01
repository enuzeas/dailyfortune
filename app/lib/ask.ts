// 별칭(@/) import 가 없는 leaf 파일 — check-ask.mjs 가 Node 로 직접 불러와 검증한다.
export const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
export const MAX_QUESTION_LEN = 200;

export function validateQuestion(question: string): string | null {
  if (!question.trim()) return "질문을 입력해주세요.";
  if (question.length > MAX_QUESTION_LEN) return `질문은 ${MAX_QUESTION_LEN}자 이내로 적어주세요.`;
  return null;
}

export function systemPrompt(facts: string): string {
  return [
    "너는 한국 전통 사주 명리학에 기반해 오늘의 운세를 봐주는 챗봇이다.",
    "아래 [사주 정보]에 있는 사실만 근거로 삼고, 거기 없는 정보(건강 진단, 법률, 투자 확답 등)는 지어내지 마라.",
    "재미로 보는 운세라는 톤을 유지하고, 3~5문장의 자연스러운 한국어 존댓말로 답한다.",
    "",
    "[사주 정보]",
    facts,
  ].join("\n");
}

// reasoning:false 없이는 이 모델이 사고 과정에 토큰을 다 써서 max_tokens 안에서 답이 잘린다.
export function chatRequestBody(system: string, question: string) {
  return {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: question },
    ],
    max_tokens: 500,
    reasoning: { enabled: false },
  };
}
