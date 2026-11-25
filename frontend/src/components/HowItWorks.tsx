const steps = [
  {
    number: "01",
    title: "Report a missing person",
    description: "A family member creates an account and submits the information needed to begin a report.",
  },
  {
    number: "02",
    title: "Review and investigation",
    description: "An authorized Case Officer reviews the report and coordinates the next steps.",
  },
  {
    number: "03",
    title: "Community support and recovery",
    description: "Assigned volunteers can contribute relevant information while updates keep everyone aligned.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">How it works</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Connected action, one step at a time
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <span className="text-sm font-extrabold tracking-[0.15em] text-teal-700">{step.number}</span>
              <h3 className="mt-5 text-xl font-bold text-slate-950">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              {step.number !== "03" && (
                <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 rotate-45 border-r border-t border-slate-200 bg-white md:block" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
