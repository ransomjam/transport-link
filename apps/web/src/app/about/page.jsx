import CTASection from "../../components/CTASection";
import ImagePlaceholder from "../../components/ImagePlaceholder";
import PublicLayout from "../../components/PublicLayout";
import TimelinePreview from "../../components/TimelinePreview";
import { shippingSteps, teamMembers } from "../../lib/public-content";

const faqs = [
  {
    question: "What is transport-link Forwarding?",
    answer:
      "We are freight forwarding experts. We offer flexibility to ship goods above 70 lb. across various transportation modes including air, ocean, road, and rail. If you are unsure about the best mode for your next shipment, we can advise you based on your transit time requirements and budget."
  },
  {
    question: "Where do you ship freight to?",
    answer: "We support shipments across local and international routes, depending on the service selected and the destination requirements."
  },
  {
    question: "How much does it cost to ship freight?",
    answer: "Shipping cost depends on shipment type, weight, destination, urgency, and service option. Contact us for a quotation."
  },
  {
    question: "How do I get started shipping freight?",
    answer: "You can contact us with your shipment details, select a service, and receive guidance on the next steps."
  }
];

export default function AboutPage() {
  return (
    <PublicLayout>
      <main>
        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-[#049DBF]">About</p>
              <h1 className="text-4xl font-bold text-[#0F2742] md:text-5xl">About</h1>
            </div>
            <div className="grid gap-5 text-lg leading-8 text-slate-600">
              <p>
                Our purpose serves as the foundation and compass guiding our work towards a world where global trade distributes economic and social benefits, without negatively impacting individuals, communities, or the environment.
              </p>
              <p>
                This is why sustainability is integrated into our purpose. Real shared value can only be delivered through logistics solutions that are digitised, integrated, decarbonised, and democratised, so that global trade is inclusive and sustainable, and the benefits are felt by as many people as possible.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">We are shipping experts</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {teamMembers.map((member) => (
                <article key={member.name} className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
                  <ImagePlaceholder src={member.image} label={member.name} className="aspect-[4/3] rounded-none" tone="light" />
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-[#0F2742]">{member.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{member.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">How Shipping Service Works</h2>
            <div className="mt-8">
              <TimelinePreview steps={shippingSteps} />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <div>
              <h2 className="text-3xl font-bold text-[#0F2742] md:text-4xl">Learn more from our FAQ</h2>
              <p className="mt-4 leading-8 text-slate-600">
                Find answers to common questions about freight forwarding, shipment planning, and tracking.
              </p>
            </div>
            <div className="grid gap-4">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-md bg-[#F5F8FA] p-5 ring-1 ring-slate-200">
                  <summary className="cursor-pointer text-lg font-semibold text-[#0F2742]">{faq.question}</summary>
                  <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8">
            <article className="rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-bold text-[#0F2742]">We deliver exceptional results</h2>
              <p className="mt-4 leading-8 text-slate-600">
                Our biggest differentiator lies in our customer service. Our staff members are experienced and knowledgeable in freight and logistics. We work hard to understand every customer and provide reliable support from the first enquiry to final delivery.
              </p>
            </article>
            <article className="rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-bold text-[#0F2742]">transport-link digitalisation is transforming shipping</h2>
              <p className="mt-4 leading-8 text-slate-600">
                transport-link digitalisation is transforming shipping, making every step more efficient, secure, and sustainable. To give customers better control, we offer online tools that make it easier to manage and track shipments using a simple digital platform.
              </p>
            </article>
          </div>
        </section>

        <CTASection heading="Are you looking for professional shipping services?" buttonLabel="Contact Us" />
      </main>
    </PublicLayout>
  );
}
