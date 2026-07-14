import FortuneCard from "@/app/components/FortuneCard";

export default function Home() {
  return (
    <div className="rainbow-bg flex min-h-screen flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="rounded-pill border-2 border-ink-black bg-leaf-wash px-4 py-1.5 text-sm font-medium text-ink-black">
          🔮 매일 새로운 오늘의 운세
        </span>
        <h1 className="text-5xl font-extrabold tracking-tighter text-white sm:text-6xl">
          오늘의 운세
        </h1>
        <p className="text-base text-white/60">
          카드를 눌러 오늘의 운세와 행운의 아이템을 확인하세요
        </p>
      </div>
      <FortuneCard />
    </div>
  );
}
