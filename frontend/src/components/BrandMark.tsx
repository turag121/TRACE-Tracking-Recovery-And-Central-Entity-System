import Link from "next/link";

export default function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 ${inverse ? "text-white" : "text-slate-950"}`}
      aria-label="TRACE home"
    >
      <span className="grid size-10 place-items-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-950/15">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-6"
        >
          <path
            d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3.5 20.5h17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-[0.16em]">TRACE</span>
        <span className={`block text-[9px] font-semibold tracking-[0.12em] ${inverse ? "text-slate-300" : "text-slate-500"}`}>
          TRACKING · RECOVERY · COMMUNITY
        </span>
      </span>
    </Link>
  );
}
