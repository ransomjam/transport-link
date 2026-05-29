import ImagePlaceholder from "./ImagePlaceholder";
import LogisticsIcon from "./LogisticsIcon";

export default function ServiceCard({ service }) {
  return (
    <article className="group overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg">
      <ImagePlaceholder src={service.image} label={service.title} className="aspect-[4/3] rounded-none" />
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#E8F7FA] text-[#049DBF]">
            <LogisticsIcon name={service.icon} />
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#0AA66D]">{service.tag}</span>
        </div>
        <h3 className="text-xl font-semibold text-[#0F2742]">{service.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
      </div>
    </article>
  );
}
