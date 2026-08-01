"use client";

import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { MAX_QUESTION_LEN } from "@/app/lib/ask";

type Props = {
  session: Session;
  birth: string;
  /** 답변을 성공적으로 받으면 호출 — 저장은 부모(FortuneCard)가 기존 saveFortune 경로로 한다. */
  onAnswered: (question: string, answer: string) => void;
};

export default function AskChat({ session, birth, onAnswered }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAnswer(null);
    const asked = question.trim();
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ question: asked }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error ?? `요청 실패 (${res.status})`);
    setAnswer(data.answer);
    onAnswered(asked, data.answer);
  }

  return (
    <section className="flex w-full max-w-xl flex-col items-center gap-3">
      <h2 className="text-lg font-extrabold text-white">무엇이든 물어보세요</h2>

      {!birth ? (
        <p className="text-sm text-white/60">생년월일을 먼저 저장하면 물어볼 수 있어요.</p>
      ) : (
        <form onSubmit={handleAsk} className="flex w-full flex-col items-center gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={MAX_QUESTION_LEN}
            placeholder="예: 이번 소개팅 잘 될까요? 이직해도 괜찮을까요?"
            aria-label="질문"
            className="w-full rounded-pill border-2 border-ink-black bg-linen-canvas px-5 py-2.5 text-sm text-ink-black placeholder:text-sage-mute"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rainbow-button rounded-pill border-[3px] border-ink-black px-6 py-2 text-sm font-bold text-ink-black transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "물어보는 중…" : "물어보기"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-small bg-ink-black/60 px-4 py-2 text-sm text-white">
          {error}
        </p>
      )}

      {answer && (
        <p className="w-full rounded-small border-2 border-ink-black bg-linen-canvas px-4 py-3 text-sm leading-relaxed text-ink-black">
          {answer}
        </p>
      )}
    </section>
  );
}
