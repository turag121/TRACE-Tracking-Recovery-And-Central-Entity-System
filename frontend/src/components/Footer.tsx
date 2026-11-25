import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export default function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 bg-[#071b33] px-5 py-12 text-slate-300 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <BrandMark inverse />
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
            TRACE connects families, volunteers, and authorized case officers to support missing-person reporting and recovery.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Quick links</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link className="transition hover:text-teal-300" href="#about">About TRACE</Link></li>
            <li><Link className="transition hover:text-teal-300" href="#how-it-works">How it works</Link></li>
            <li><Link className="transition hover:text-teal-300" href="/mpr/register">Report a missing person</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Contact</h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            For account access or platform support, please contact your TRACE administrator.
          </p>
          <a className="mt-3 inline-block text-sm font-semibold text-teal-300 hover:text-teal-200" href="#login">
            Sign in to your account
          </a>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} TRACE. All rights reserved.</p>
        <p>Tracking · Recovery · Central Entity System</p>
      </div>
    </footer>
  );
}
