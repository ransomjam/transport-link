export default function TimelinePreview({ steps }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <article key={step.title} className="rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#0F2742] text-sm font-bold text-white">
            {index + 1}
          </div>
          <h3 className="text-xl font-semibold text-[#0F2742]">{step.title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
        </article>
      ))}
    </div>
  );
}
