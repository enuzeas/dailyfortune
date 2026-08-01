"use client";

import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase";
import { dailyFortune, type Daily } from "@/app/lib/saju";

// 생년월일은 계정에 붙는다 — user_metadata 를 쓰면 테이블도 RLS 정책도 안 늘어난다.
function readBirth(session: Session | null): string {
  const v = session?.user.user_metadata?.birth;
  return typeof v === "string" ? v : "";
}

// ponytail: [날짜, 이름, 운세]만 저장. 행운 아이템까지 기록하려면 컬럼+필드 추가.
type Entry = { id: number; drawn_at: string; name: string; content: string };

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

async function loadHistory(): Promise<Entry[]> {
  return unwrap(
    await supabase.from("fortunes").select("*").order("drawn_at", { ascending: false }).limit(20),
  );
}

// head:true — 행은 안 받고 총계만.
// ponytail: 브라우저 로컬 자정 기준. 서버 고정 타임존이 필요하면 date_trunc 뷰로.
async function countToday(): Promise<number> {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from("fortunes")
    .select("id", { count: "exact", head: true })
    .gte("drawn_at", midnight.toISOString());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// 저장된 행을 그대로 돌려받아 화면에 붙인다 (재조회 왕복 1회 절약)
// user_id 는 DB에서 default auth.uid() 로 채워진다 — 클라이언트가 보내지 않는다.
async function saveFortune(name: string, content: string): Promise<Entry> {
  return unwrap(await supabase.from("fortunes").insert({ name, content }).select().single());
}

const TILE_STYLES = [
  { bg: "bg-lavender-mist", text: "text-ink-black" },
  { bg: "bg-mustard-pop", text: "text-ink-black" },
  { bg: "bg-forest-ink", text: "text-white" },
  { bg: "bg-lime-spark", text: "text-ink-black" },
];

export default function FortuneCard() {
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Daily | null>(null);
  const [history, setHistory] = useState<Entry[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [birthDraft, setBirthDraft] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const isBack = (rotation / 180) % 2 === 1;
  // 이름은 계정에서 온다 — 입력칸 없앰. 표시명이 따로 필요하면 user_metadata 로.
  const myName = session?.user.email?.split("@")[0] ?? "";
  const birth = readBirth(session);

  useEffect(() => {
    loadHistory().then(setHistory, (e) => setError(`기록 불러오기 실패: ${e.message}`));
    countToday().then(setTodayCount, () => {});
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const creds = { email: email.trim(), password };
    const { data, error } = signingUp
      ? await supabase.auth.signUp(creds)
      : await supabase.auth.signInWithPassword(creds);
    setBusy(false);
    if (error) return setError(error.message);
    // 이메일 확인이 켜져 있으면 가입해도 세션이 안 나온다
    if (!data.session) setNotice("확인 메일의 링크를 눌러 인증을 마쳐주세요.");
    else setPassword("");
  }

  // 생년월일은 계정에 한 번만 저장한다. 바꾸면 다음 뽑기부터 반영.
  async function handleBirthSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ data: { birth: birthDraft } });
    setBusy(false);
    if (error) return setError(`생년월일 저장 실패: ${error.message}`);
    setNotice("생년월일을 저장했어요. 이제 뽑아보세요.");
  }

  function handleClick() {
    if (!session) return setError("먼저 로그인해주세요.");
    if (!birth) return setError("먼저 생년월일을 입력해주세요.");

    const next = rotation + 180;
    setRotation(next);
    if ((next / 180) % 2 !== 1) return;

    // 랜덤이 아니다 — 내 일간과 오늘 일간의 십신으로 결정된다. 같은 날 다시 뽑아도 같은 결과.
    const [y, m, d] = birth.split("-").map(Number);
    let drawn: Daily;
    try {
      drawn = dailyFortune({ year: y, month: m, day: d }, new Date());
    } catch (err) {
      return setError(`운세 계산 실패: ${(err as Error).message}`);
    }
    setResult(drawn);
    setError("");
    // 뽑는 즉시 저장. 실패하면 조용히 넘기지 않고 화면에 알린다.
    saveFortune(myName, `[${drawn.sipsin}] ${drawn.fortune}`).then(
      (row) => {
        setHistory((prev) => [row, ...prev]);
        // 내가 넣은 1건이니 다시 세지 않고 더한다
        setTodayCount((c) => (c === null ? c : c + 1));
      },
      (e) => setError(`저장 실패: ${e.message}`),
    );
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--pointer-x", `${px.toFixed(1)}%`);
    el.style.setProperty("--pointer-y", `${py.toFixed(1)}%`);
    el.style.setProperty("--tilt-x", `${((50 - py) / 4).toFixed(2)}deg`);
    el.style.setProperty("--tilt-y", `${((px - 50) / 4).toFixed(2)}deg`);
    el.style.setProperty("--holo-opacity", "1");
  }

  function handlePointerLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--pointer-x", "50%");
    el.style.setProperty("--pointer-y", "50%");
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--holo-opacity", "0");
  }

  const tiles = result
    ? [
        { label: "행운 아이템", value: result.item },
        { label: "행운 색깔", value: result.color },
        { label: "행운 방향", value: result.direction },
        { label: "행운 숫자", value: String(result.number) },
      ]
    : [];

  return (
    <div className="flex flex-col items-center gap-8">
      {todayCount !== null && (
        <p className="rounded-pill border-2 border-ink-black bg-mustard-pop px-4 py-1.5 text-sm font-bold text-ink-black">
          오늘 운세를 뽑은 사람 {todayCount}명
        </p>
      )}

      <div className="[perspective:1200px]">
        <div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
          className="holo-card relative aspect-[0.718] w-72 cursor-pointer transition-transform duration-300 ease-out [transform-style:preserve-3d] hover:scale-105"
        >
          <div
            className="relative h-full w-full transition-transform duration-700 ease-out [transform-style:preserve-3d]"
            style={{ transform: `rotateY(${rotation}deg) scale(${isBack ? 1.5 : 1})` }}
          >
            {/* front */}
            <div
              className="rainbow-border tcg-radius absolute inset-0 overflow-hidden p-3 [backface-visibility:hidden]"
              style={{ transform: "rotateX(var(--tilt-x)) rotateY(var(--tilt-y))" }}
            >
              {/* hologram lives on this inner panel's own surface, not the outer frame */}
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20">
                <div className="holo-shine rounded-3xl" />
                <div className="holo-glare rounded-3xl" />

                <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <span className="text-5xl">🔮</span>
                  <p className="text-xl font-extrabold tracking-tight text-white">오늘의 운세</p>
                  <p className="text-sm text-white/70">버튼을 눌러 카드를 뒤집어보세요</p>
                </div>
              </div>
            </div>

            {/* back */}
            <div
              className="rainbow-border tcg-radius absolute inset-0 overflow-hidden p-3 [backface-visibility:hidden]"
              style={{ transform: "rotateY(180deg) rotateX(var(--tilt-x)) rotateY(var(--tilt-y))" }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20">
                <div className="holo-shine rounded-3xl" />
                <div className="holo-glare rounded-3xl" />

                <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
                  {result && (
                    <>
                      <span className="rounded-pill border-2 border-ink-black bg-mustard-pop px-3 py-1 text-sm font-extrabold text-ink-black">
                        {result.sipsin}
                      </span>
                      <p className="text-sm leading-relaxed font-medium text-white">
                        {result.fortune}
                      </p>
                      <p className="text-[11px] text-white/50">
                        내 일주 {result.myPillar} · 오늘 {result.todayPillar}
                      </p>
                      <div className="grid w-full grid-cols-2 gap-2">
                        {tiles.map((tile, i) => (
                          <div
                            key={tile.label}
                            className={`relative overflow-hidden rounded-small border-2 border-ink-black ${TILE_STYLES[i].bg}`}
                          >
                            <div className="holo-shine rounded-small" />
                            <div className="holo-glare rounded-small" />
                            <div className={`relative px-3 py-2 text-left ${TILE_STYLES[i].text}`}>
                              <p className="text-[11px] opacity-70">{tile.label}</p>
                              <p className="text-base font-bold">{tile.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {session ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-white/70">
            {myName} 님으로 로그인 —{" "}
            <button
              onClick={() => supabase.auth.signOut()}
              className="underline hover:text-white"
            >
              로그아웃
            </button>
          </p>

          {/* 네이티브 date 입력 — 달력 UI를 라이브러리로 만들 이유가 없다 */}
          <form onSubmit={handleBirthSave} className="flex items-center gap-2">
            <input
              type="date"
              required
              max={new Date().toISOString().slice(0, 10)}
              min="1900-01-01"
              value={birthDraft || birth}
              onChange={(e) => setBirthDraft(e.target.value)}
              aria-label="생년월일"
              className="rounded-pill border-2 border-ink-black bg-linen-canvas px-4 py-2 text-sm text-ink-black"
            />
            <button
              type="submit"
              disabled={busy || (birthDraft || birth) === birth}
              className="rounded-pill border-2 border-ink-black bg-leaf-wash px-4 py-2 text-sm font-bold text-ink-black disabled:opacity-40"
            >
              {birth ? "변경" : "저장"}
            </button>
          </form>

          <button
            onClick={handleClick}
            className="rainbow-button rounded-pill border-[3px] border-ink-black px-7 py-[18px] text-base font-bold text-ink-black transition hover:brightness-110 active:translate-y-[2px]"
          >
            {isBack ? "다시 뽑기" : "오늘의 운세 보기"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="flex w-full max-w-xs flex-col items-center gap-2">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            aria-label="이메일"
            className="w-full rounded-pill border-2 border-ink-black bg-linen-canvas px-5 py-2.5 text-center text-base text-ink-black placeholder:text-sage-mute"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={signingUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 (6자 이상)"
            aria-label="비밀번호"
            className="w-full rounded-pill border-2 border-ink-black bg-linen-canvas px-5 py-2.5 text-center text-base text-ink-black placeholder:text-sage-mute"
          />
          <button
            type="submit"
            disabled={busy}
            className="rainbow-button w-full rounded-pill border-[3px] border-ink-black px-7 py-[14px] text-base font-bold text-ink-black transition hover:brightness-110 active:translate-y-[2px] disabled:opacity-50"
          >
            {busy ? "처리 중…" : signingUp ? "가입하기" : "로그인"}
          </button>
          <button
            type="button"
            onClick={() => setSigningUp((v) => !v)}
            className="text-sm text-white/60 underline hover:text-white"
          >
            {signingUp ? "이미 계정이 있어요" : "계정 만들기"}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-small bg-ink-black/60 px-4 py-2 text-sm text-white">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="rounded-small bg-leaf-wash px-4 py-2 text-sm text-ink-black">
          {notice}
        </p>
      )}

      {history.length > 0 && (
        <section className="w-full max-w-2xl">
          <h2 className="mb-3 text-lg font-extrabold text-white">운세 기록</h2>
          <div className="overflow-x-auto rounded-small border-2 border-ink-black bg-linen-canvas">
            <table className="w-full text-left text-sm text-ink-black">
              <thead className="bg-leaf-wash">
                <tr>
                  <th className="whitespace-nowrap px-4 py-2 font-bold">날짜</th>
                  <th className="whitespace-nowrap px-4 py-2 font-bold">이름</th>
                  <th className="px-4 py-2 font-bold">운세</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-t border-ink-black/10">
                    <td className="whitespace-nowrap px-4 py-2 align-top text-sage-mute">
                      {new Date(entry.drawn_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 align-top font-medium">
                      {entry.name}
                    </td>
                    <td className="px-4 py-2">{entry.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
