import ImagePlaceholder from "../../components/ImagePlaceholder";
import PublicLayout from "../../components/PublicLayout";
import TrackingForm from "../../components/TrackingForm";

export default function TrackPage() {
  return (
    <PublicLayout>
      <main>
        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid min-h-[70vh] max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-[#049DBF]">Track & Trace</p>
              <h1 className="text-4xl font-bold text-[#0F2742] md:text-5xl">Track & Trace</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                For Ocean, Air, Less-than-Container Load (LCL), Parcel, or other shipment types, receive and enter your tracking number to view full tracking details.
              </p>
              <div className="mt-8 max-w-2xl">
                <TrackingForm horizontal />
              </div>
            </div>

            <ImagePlaceholder src="/images/air-freight.jpg" label="Shipment tracking preview" className="min-h-[360px]" tone="light">
              <div className="flex h-full items-end p-5">
                <div className="rounded-md bg-white/95 p-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-semibold text-[#0F2742]">Tracking includes current status, current location, delivery progress, and shipment timeline.</p>
                </div>
              </div>
            </ImagePlaceholder>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
