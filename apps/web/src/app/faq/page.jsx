import PublicLayout from "../../components/PublicLayout";

const faqs = [
  [
    "How are shipment updates calculated?",
    "The platform shows estimated route progress and admin-entered shipment updates based on the shipment record."
  ],
  ["What do I need to track a shipment?", "Use the tracking number provided by the transport-link team."],
  ["Why does my shipment say delayed?", "A delayed status is set when the shipment needs attention or the estimate changes."],
  ["Can customers see internal notes?", "No. Customers only see public shipment notes and public timeline entries."],
  ["How do I get shipping support?", "Contact transport-link with your shipment details, preferred service, destination, and timeline."]
];

export default function FAQPage() {
  return (
    <PublicLayout>
      <main className="bg-[#F5F8FA]">
        <section className="mx-auto max-w-4xl px-5 py-14">
          <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-[#049DBF]">FAQ</p>
          <h1 className="text-4xl font-bold text-[#0F2742]">Shipment and logistics questions</h1>
          <div className="mt-8 grid gap-4">
            {faqs.map(([question, answer]) => (
              <div key={question} className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-lg font-semibold text-[#0F2742]">{question}</h2>
                <p className="mt-2 leading-7 text-slate-600">{answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
