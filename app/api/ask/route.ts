import { createClient } from "@supabase/supabase-js";
import { factsForPrompt } from "@/app/lib/saju";
import { validateQuestion, systemPrompt, chatRequestBody } from "@/app/lib/ask";

// 세션 저장이 필요 없는 일회성 검증용 클라이언트 — 브라우저 client(app/lib/supabase.ts)와는 별도.
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/, "");
  if (!token) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  // getUser(token) 은 Auth 서버에 검증을 왕복시킨다 — 클라이언트가 보낸 걸 그냥 믿지 않는다.
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token);
  if (authError || !user) return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const birth = user.user_metadata?.birth;
  if (typeof birth !== "string" || !birth) {
    return Response.json({ error: "먼저 생년월일을 입력해주세요." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const invalid = validateQuestion(question);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const [y, m, d] = birth.split("-").map(Number);
  const facts = factsForPrompt({ year: y, month: m, day: d }, new Date());

  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chatRequestBody(systemPrompt(facts), question)),
  });

  if (!upstream.ok) {
    return Response.json({ error: `AI 응답 실패 (${upstream.status})` }, { status: 502 });
  }
  const data = await upstream.json();
  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) return Response.json({ error: "AI가 빈 응답을 보냈습니다." }, { status: 502 });

  return Response.json({ answer });
}
