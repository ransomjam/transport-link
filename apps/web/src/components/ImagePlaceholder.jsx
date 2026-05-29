export default function ImagePlaceholder({ src, label, className = "", children, tone = "blue", position = "center" }) {
  const overlay =
    tone === "light"
      ? "linear-gradient(135deg, rgba(245, 248, 250, 0.9), rgba(4, 157, 191, 0.18))"
      : "linear-gradient(135deg, rgba(15, 39, 66, 0.82), rgba(3, 166, 166, 0.42))";

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative overflow-hidden rounded-md bg-slate-200 ${className}`}
      style={{
        backgroundImage: `${overlay}, url(${src})`,
        backgroundPosition: position,
        backgroundSize: "cover"
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,transparent_45%,rgba(255,255,255,0.18)_45%,rgba(255,255,255,0.18)_46%,transparent_46%,transparent_100%)]" />
      <div className="absolute bottom-4 left-4 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold text-[#0F2742] shadow-sm ring-1 ring-white/70">
        {label}
      </div>
      {children ? <div className="relative z-10 h-full">{children}</div> : null}
    </div>
  );
}
