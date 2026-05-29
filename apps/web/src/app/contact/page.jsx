import ContactForm from "../../components/ContactForm";
import ImagePlaceholder from "../../components/ImagePlaceholder";
import PublicLayout from "../../components/PublicLayout";
import { brand } from "../../lib/public-content";

export default function ContactPage() {
  return (
    <PublicLayout>
      <main>
        <section className="bg-[#F5F8FA]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-[#049DBF]">Contact</p>
              <h1 className="text-4xl font-bold text-[#0F2742] md:text-5xl">Contact us today</h1>
              <div className="mt-6 grid gap-3 text-base text-slate-700">
                <a className="font-semibold text-[#0F2742] hover:text-[#049DBF]" href={`tel:${brand.phone}`}>
                  Phone: {brand.displayPhone}
                </a>
                <a className="font-semibold text-[#0F2742] hover:text-[#049DBF]" href={`mailto:${brand.email}`}>
                  Email: {brand.email}
                </a>
                <p className="font-semibold text-[#0F2742]">Location: USA</p>
              </div>
            </div>
            <ImagePlaceholder src="/images/home-delivery.jpg" label="Contact logistics experts" className="min-h-[320px]" />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <h2 className="text-3xl font-bold text-[#0F2742]">Send us a message</h2>
              <p className="mt-4 leading-8 text-slate-600">
                Our dedicated team of logistics experts is here for you. Whether you have enquiries about cargo status or want to know more about our solutions, please do not hesitate to contact us. We will be delighted to assist you.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        <section className="bg-[#F5F8FA]">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <h2 className="text-3xl font-bold text-[#0F2742]">More useful information</h2>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <article className="rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-xl font-semibold text-[#0F2742]">Sign up to the newsletter</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Receive our insights directly in your mailbox by signing up through this form and enter a world of integrated logistics. Get inspired by articles that help you navigate supply chains, understand industry trends, and shape your logistics strategy. You can unsubscribe anytime.
                </p>
                <form className="mt-5 grid gap-3">
                  <input
                    className="min-h-12 rounded-md border border-slate-300 px-3 text-base outline-none focus:border-[#049DBF]"
                    placeholder="Email Address"
                    type="email"
                  />
                  <button className="rounded-md bg-[#0F2742] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#049DBF]">
                    Subscribe
                  </button>
                </form>
              </article>

              <InfoBlock
                title="Everything you need to know"
                body="The world is a big place. To tap into global trade, you need local insights at your fingertips. We provide simplified logistics information, service routes, and delivery support to help you add value to every link of your supply chain."
              />
              <InfoBlock
                title="High Quality Shipping Services"
                body="Smarter shipping, simplified logistics. Plan smarter, respond faster, and deliver with confidence through a single online platform."
              />
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}

function InfoBlock({ title, body }) {
  return (
    <article className="rounded-md bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-xl font-semibold text-[#0F2742]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
    </article>
  );
}
