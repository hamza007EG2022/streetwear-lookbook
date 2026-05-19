export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
      <div className="text-center animate-pulse">
        <div className="text-2xl font-black tracking-[0.15em] uppercase text-black/20 mb-3">
          TRIO
        </div>
        <div className="w-6 h-6 border-2 border-black/10 border-t-black/40 rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );
}
