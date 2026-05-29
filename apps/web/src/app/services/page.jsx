import Link from "next/link";
import CTASection from "../../components/CTASection";
import ImagePlaceholder from "../../components/ImagePlaceholder";
import LogisticsIcon from "../../components/LogisticsIcon";
import PublicLayout from "../../components/PublicLayout";
import ServiceCard from "../../components/ServiceCard";
import { benefits, brand, galleryImages, serviceCards } from "../../lib/public-content";

export default function ServicesPage() {
  return (
    <PublicLayout>
      <main>
        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:px-8">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-[#049DBF]">Services</p>
              <h1 className="text-4xl font-bold text-[#0F2742] md:text-5xl">Services</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
                Featured services built to support your local and global logistics needs.
              </p>
            </div>
            <ImagePlaceholder src="/images/ground-freight.jpg" label="Freight service network" className="min-h-[300px]" />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-normal text-[#049DBF]">We provide the best services</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F2742] md:text-4xl">We provide the best services</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {serviceCards.map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">Why choose us?</h2>
              <p className="mt-4 leading-8 text-slate-600">
                Businesses and individuals choose a shipping company for benefits like competitive pricing, reliable and timely deliveries, tracking and visibility, broad coverage, flexible solutions, secure cargo handling, experienced professionals, and responsive customer support.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <article key={benefit} className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#E8F7FA] text-[#049DBF]">
                    <LogisticsIcon name="support" />
                  </span>
                  <h3 className="font-semibold text-[#0F2742]">{benefit}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-normal text-[#049DBF]">Our projects</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F2742] md:text-4xl">Photo gallery</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryImages.map((image, index) => (
                <ImagePlaceholder key={image} src={image} label={`Logistics project ${index + 1}`} className="min-h-[240px]" tone="light" />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">We Provide Trusted Services For You</h2>
              <p className="mt-4 leading-8 text-slate-600">
                Optimise, protect, and simplify your supply chain with our end-to-end logistics services, a growing suite of digital solutions, and a reliable delivery network.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["25 years of shipping experience", "Over 800 locations nationwide", "Advanced monitoring system"].map((stat) => (
                  <div key={stat} className="rounded-md bg-white p-4 text-sm font-semibold text-[#0F2742] shadow-sm ring-1 ring-slate-200">
                    {stat}
                  </div>
                ))}
              </div>
              <Link className="mt-6 inline-flex rounded-md bg-[#0F2742] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#049DBF]" href="/contact">
                Get Started
              </Link>
            </div>
            <ImagePlaceholder src="/images/home-delivery.jpg" label="Trusted logistics services" className="min-h-[320px]" />
          </div>
        </section>

        <CTASection
          heading="Are you looking for professional shipping services?"
          text={`Call us now: ${brand.phone}`}
          buttonLabel="Contact Us"
        />
      </main>
    </PublicLayout>
  );
}
