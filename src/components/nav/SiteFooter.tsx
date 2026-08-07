import Link from "next/link";
import { LogoMark } from "./Logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Beliefs", href: "/beliefs" },
      { label: "Markets", href: "/markets" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Profile", href: "/profile" },
      { label: "Settings", href: "/settings" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border">
      <div className="container-content py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2.5 font-semibold">
              <LogoMark />
              <span>Belief Market</span>
            </div>
            <p className="mt-3 max-w-[220px] text-sm text-content-secondary">
              The Internet's Belief Network.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="section-label mb-3">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-content-secondary transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-content-secondary/60 sm:flex-row">
          <span>© {new Date().getFullYear()} Belief Market. Where conviction becomes markets.</span>
          <span>
            For research and entertainment. Play-money markets, not advice. Made by{" "}
            <a
              href="https://github.com/anishsarkars"
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-secondary transition-colors hover:text-primary"
            >
              @anishsarkars
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
