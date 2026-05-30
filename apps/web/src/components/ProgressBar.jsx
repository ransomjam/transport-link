export default function ProgressBar({ value }) {
  const progress = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[#0F2742]">Delivery Progress</span>
        <span className="text-sm font-semibold text-[#0AA66D]">{progress}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-[#0AA66D] transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
