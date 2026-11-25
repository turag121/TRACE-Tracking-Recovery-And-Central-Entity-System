import Link from "next/link";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import LoginForm from "@/components/LoginForm";
import Navbar from "@/components/Navbar";

function ResponseMap() {
  return (
    <div className="relative mt-11 hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:block">
      <div className="absolute -right-8 -top-14 size-40 rounded-full border border-teal-300/10" />
      <svg viewBox="0 0 560 150" fill="none" className="h-32 w-full" aria-label="Illustration of a connected community response network" role="img">
        <path d="M25 112 116 81l77 20 94-55 80 38 81-39 88 34M50 30l80 42 57-55 85 61 55-32 75 54 62-55" stroke="white" strokeOpacity=".15" strokeWidth="2" />
        <path d="m116 81 77 20 94-55 80 38 81-39" stroke="#55ddd0" strokeOpacity=".85" strokeWidth="2.5" strokeDasharray="5 6" />
        <circle cx="116" cy="81" r="13" fill="#0f766e" fillOpacity=".3" stroke="#6ee7d8" />
        <circle cx="116" cy="81" r="4" fill="#99f6e4" />
        <circle cx="287" cy="46" r="14" fill="#0f766e" fillOpacity=".3" stroke="#6ee7d8" />
        <circle cx="287" cy="46" r="4" fill="#99f6e4" />
        <circle cx="448" cy="45" r="13" fill="#0f766e" fillOpacity=".3" stroke="#6ee7d8" />
        <circle cx="448" cy="45" r="4" fill="#99f6e4" />
        <circle cx="367" cy="84" r="5" fill="#e2e8f0" fillOpacity=".8" />
        <circle cx="193" cy="101" r="5" fill="#e2e8f0" fillOpacity=".8" />
        <circle cx="81" cy="51" r="4" fill="#e2e8f0" fillOpacity=".65" />
        <circle cx="500" cy="87" r="4" fill="#e2e8f0" fillOpacity=".65" />
      </svg>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">A connected response</p>
          <p className="mt-1 text-xs text-slate-400">Families · Case Officers · Volunteers</p>
        </div>
        <span className="badge border-teal-300/20 bg-teal-300/10 px-3 py-3 text-teal-200">One shared mission</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section id="home" className="relative scroll-mt-20 overflow-hidden bg-[#071b33] px-5 py-14 text-white sm:px-8 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute -right-40 -top-48 size-[34rem] rounded-full border border-white/[0.04]" />
          <div className="pointer-events-none absolute -right-20 -top-28 size-[25rem] rounded-full border border-teal-200/[0.06]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.78fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-200">
                <span className="size-2 rounded-full bg-teal-300" />
                Together, every step matters
              </p>
              <h1 className="mt-7 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                Every Missing Person{" "}
                <span className="text-teal-300">Deserves to Be Found.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                TRACE connects families, volunteers, and authorized case officers through a centralized platform to report missing persons, share information, and support recovery efforts.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/mpr/register" className="btn btn-primary min-h-13 rounded-xl border-0 bg-teal-500 px-6 text-base font-bold text-slate-950 shadow-lg shadow-teal-950/25 hover:bg-teal-400">
                  Report a Missing Person
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
                    <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <a href="#how-it-works" className="btn btn-outline min-h-13 rounded-xl border-white/25 px-6 text-base text-white hover:border-white hover:bg-white/10 hover:text-white">
                  Learn How It Works
                </a>
              </div>
              <ResponseMap />
            </div>
            <div className="mx-auto w-full max-w-md">
              <LoginForm />
            </div>
          </div>
        </section>

        <FeatureSection />
        <HowItWorks />

        <section className="bg-white px-5 py-16 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-teal-50 p-7 sm:p-10 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">Begin with the right information</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                Need to report someone missing?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Create a Missing Person Reporter account to submit a report through TRACE.
              </p>
            </div>
            <Link href="/mpr/register" className="btn btn-primary shrink-0 rounded-xl border-0 bg-teal-700 px-6 text-white hover:bg-teal-800">
              Create a reporter account
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
