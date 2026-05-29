import Link from "next/link";
import CTASection from "../components/CTASection";
import ImagePlaceholder from "../components/ImagePlaceholder";
import LogisticsIcon from "../components/LogisticsIcon";
import PublicLayout from "../components/PublicLayout";
import ServiceCard from "../components/ServiceCard";
import TimelinePreview from "../components/TimelinePreview";
import TrackingForm from "../components/TrackingForm";
import { brand, reviews, serviceCards, shippingSteps, whyFeatures } from "../lib/public-content";

const homepageImages = {
  introBg: {
    src: "/images/customer-service-group.jpeg",
  },
  hero: {
    src: "/images/customer-support-desk.jpeg",
    label: "Shipment intake support",
    position: "center 24%"
  },
  registration: {
    src: "/images/front-desk-support.jpeg",
    label: "Front desk support",
    position: "center 20%"
  },
  support: {
    src: "/images/hero-shipping.jpg",
    label: "Trusted customer support",
    position: "center 32%"
  }
};

export default function HomePage() {
  return (
    <PublicLayout>
      <main>
        <section className="relative overflow-hidden bg-[#0F2742]">
          {/* Fix the background image to properly cover the area and blend with the dark color */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
            style={{ backgroundImage: `url(${homepageImages.introBg.src})` }}
          />
          {/* Smooth gradient to maintain readability while showing the image */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F2742] via-[#0F2742]/90 to-[#0F2742]/10"></div>

          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#049DBF]">
                {brand.shortName} logistics network
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
                Fast Delivery And<br className="hidden sm:block" /> Secure Packages
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                A single platform to book, track, and manage your global shipments with end-to-end visibility.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link className="inline-flex rounded-lg bg-[#049DBF] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#037A94]" href="/track">
                  Track Shipment
                </Link>
                <Link className="inline-flex rounded-lg border border-slate-600 bg-transparent px-8 py-3.5 text-sm font-semibold text-white transition hover:border-slate-300 hover:bg-white/5" href="/contact">
                  Contact Us
                </Link>
              </div>

              <div className="mt-12 rounded-xl bg-white/5 p-3 shadow-2xl backdrop-blur-md ring-1 ring-white/10">
                <TrackingForm horizontal />
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <ImagePlaceholder
                src={homepageImages.hero.src}
                label={homepageImages.hero.label}
                className="min-h-[360px] lg:min-h-[560px] rounded-2xl shadow-2xl ring-1 ring-white/10"
                tone="light"
                position={homepageImages.hero.position}
              >
                <div className="flex h-full items-end p-5 lg:p-8">
                  <div className="max-w-sm rounded-xl bg-white/95 p-6 shadow-xl backdrop-blur-sm ring-1 ring-white/70 sm:-ml-6 sm:translate-y-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#049DBF]">Always within reach</p>
                    <p className="mt-2 text-2xl font-bold text-[#0F2742]">24/7 customer support</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      Booking, intake, and shipment updates handled by a real support team from start to finish.
                    </p>
                  </div>
                </div>
              </ImagePlaceholder>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <ImagePlaceholder
              src={homepageImages.registration.src}
              label={homepageImages.registration.label}
              className="min-h-[340px]"
              tone="light"
              position={homepageImages.registration.position}
            />
            <details className="group border-b border-slate-200 pb-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer group block">
                <div className="flex items-center justify-between gap-1.5 text-2xl font-bold text-[#0F2742] md:text-3xl hover:text-[#049DBF] transition">
                  <span className="pr-4">Build a supply chain that matches the pace of your business</span>
                  <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                <p className="mt-3 text-base leading-relaxed text-slate-500 line-clamp-1 group-open:hidden">
                  Ever-changing customer needs require businesses to be resilient. Having access to strategically located warehouses...
                </p>
              </summary>
              <div className="mt-5 grid gap-4 leading-8 text-slate-600">
                <p>
                  Ever-changing customer needs require businesses to be resilient. Having access to strategically located warehouses goes a long way in establishing a strong global and regional presence. With facilities that receive, store, process and dispatch cargo quickly, you can build flexibility and resilience throughout your supply chain.
                </p>
                <p>
                  transport-link warehousing and distribution services provide lean, fast and efficient methods for the consolidation, deconsolidation and fulfilment of your goods. With specialised solutions like bonded storage facilities, omni-channel fulfilment centres and regional hubs, we have the capabilities to meet the needs of your supply chain.
                </p>
              </div>
            </details>
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <details className="group max-w-7xl border-b border-slate-200 pb-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer group block">
                <div className="flex items-center justify-between gap-1.5 text-2xl font-bold text-[#0F2742] md:text-3xl hover:text-[#049DBF] transition">
                  Why transport-link?
                  <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                <p className="mt-3 text-base leading-relaxed text-slate-500 line-clamp-1 group-open:hidden">
                  With transport-link, you can enhance the efficiency of your supply chain and get your products to market faster...
                </p>
              </summary>
              <div className="mt-5">
                <div className="max-w-3xl">
                  <p className="leading-8 text-slate-600">
                    With transport-link, you can enhance the efficiency of your supply chain and get your products to market faster. Our scalable warehousing and distribution services can help you transport, fulfil, manage and power your logistics from end to end, making your products easily accessible to your customers.
                  </p>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {whyFeatures.map((feature) => (
                    <article key={feature} className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
                      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[#E8F7FA] text-[#049DBF]">
                        <LogisticsIcon name="support" />
                      </span>
                      <h3 className="text-lg font-semibold text-[#0F2742]">{feature}</h3>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-[#049DBF]">We provide the best services</p>
                <h2 className="mt-2 text-3xl font-bold text-[#0F2742] md:text-4xl">Featured Services</h2>
              </div>
              <Link className="w-fit rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#0F2742] transition hover:border-[#049DBF] hover:text-[#049DBF]" href="/services">
                View all services
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {serviceCards.map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">Connected and Committed</h2>
              <p className="mt-5 leading-8 text-slate-600">
                At transport-link Group, we are an international team of logistics and supply chain specialists, business professionals, HR professionals, and IT experts working across different countries and territories. We are connected and committed to sustainable business, strong partnerships, and reliable logistics support.
              </p>
              <Link className="mt-6 inline-flex rounded-md bg-[#0F2742] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#049DBF]" href="/contact">
                Get Started
              </Link>
            </div>
            <ImagePlaceholder
              src={homepageImages.support.src}
              label={homepageImages.support.label}
              className="min-h-[340px]"
              tone="light"
              position={homepageImages.support.position}
            />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">
                  Logistics services that create value at each stage of your supply chain
                </h2>
              </div>
              <p className="leading-8 text-slate-600">
                Logistics play an essential role in your business. They are a strategic priority and a major way of enhancing performance. transport-link offers logistics services that address supply chain concerns across transport, warehousing, and delivery visibility.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">How Transporting Service Works</h2>
            <div className="mt-8">
              <TimelinePreview steps={shippingSteps} />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">What our customers are saying</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {reviews.map((review) => (
                <blockquote key={review.name} className="rounded-md bg-[#F5F8FA] p-6 ring-1 ring-slate-200">
                  <p className="leading-7 text-slate-700">"{review.quote}"</p>
                  <footer className="mt-5">
                    <div className="font-semibold text-[#0F2742]">{review.name}</div>
                    <div className="text-sm text-slate-500">{review.role}</div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
    </PublicLayout>
  );
}
