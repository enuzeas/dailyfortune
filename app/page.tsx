import FortuneCard from "@/app/components/FortuneCard";

export default function Home() {
  return (
    <div className="rainbow-bg flex min-h-screen flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-pill border-2 border-ink-black bg-leaf-wash px-4 py-1.5 text-sm font-medium text-ink-black">
          🔮 사주로 보는 오늘의 운세
        </span>
        <h1 className="text-5xl font-extrabold tracking-tighter text-white sm:text-6xl">
          오늘의 운세
        </h1>
        <p className="text-base text-white/60">
          생년월일의 일간(日干)과 오늘 일간의 십신(十神)으로 운세를 계산합니다
        </p>
      </div>
      <FortuneCard />

      {/* AGPL-3.0: 네트워크로 제공하는 이용자에게 소스를 제공해야 한다 */}
      <footer className="text-xs text-white/40">
        사주 계산{" "}
        <a href="https://github.com/rath/orrery" className="underline hover:text-white/70">
          @orrery/core
        </a>{" "}
        · AGPL-3.0 ·{" "}
        <a href="https://github.com/enuzeas/dailyfortune" className="underline hover:text-white/70">
          소스 코드
        </a>
      </footer>
    </div>
  );
}
