const features = [
  {
    title: "Missing person reporting",
    description: "Share essential details through a clear, guided report that reaches the right people.",
    icon: "report",
  },
  {
    title: "Case management",
    description: "Authorized case officers can review reports and coordinate investigation activity.",
    icon: "case",
  },
  {
    title: "Volunteer participation",
    description: "Bring trusted community volunteers together around verified, active investigations.",
    icon: "people",
  },
  {
    title: "Investigation updates",
    description: "Keep case progress organized with a shared history of meaningful updates.",
    icon: "updates",
  },
  {
    title: "Public tips and information",
    description: "Collect useful sightings and evidence in a structured, reviewable format.",
    icon: "tip",
  },
  {
    title: "Notifications and communication",
    description: "Help families, officers, and volunteers stay informed as cases progress.",
    icon: "message",
  },
];

const iconPaths: Record<string, string> = {
  report: "M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Zm0-10.5A1.5 1.5 0 1 0 12 7.5a1.5 1.5 0 0 0 0 3Z",
  case: "M4 7.5h16v12H4v-12Zm4 0V5h8v2.5M4 12h16m-10 0v2h4v-2",
  people: "M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm6-6.5a3 3 0 0 1 0 5.8m2 3.2a3.5 3.5 0 0 1 2 3.2V20",
  updates: "M4 5h16v14H4V5Zm3 4h10M7 12h7m-7 3h10",
  tip: "M12 3a7 7 0 0 0-4 12.7V19h8v-3.3A7 7 0 0 0 12 3Zm-3 19h6m-5-7h4",
  message: "M4 5h16v12H9l-5 4V5Zm4 4h8m-8 4h5",
};

function FeatureIcon({ name }: { name: string }) {
  return (
    <span className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-600 group-hover:text-white">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-6">
        <path
          d={iconPaths[name]}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function FeatureSection() {
  return (
    <section id="about" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">One coordinated platform</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            A clearer path from report to recovery
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-600">
            TRACE helps bring together the people and information needed to support missing-person cases with care and coordination.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="card group rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5"
            >
              <div className="card-body p-6">
                <FeatureIcon name={feature.icon} />
                <h3 className="mt-4 text-lg font-bold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
