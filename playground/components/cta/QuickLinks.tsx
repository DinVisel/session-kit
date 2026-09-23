import { BookOpen, ExternalLink, Package } from "lucide-react";

const REPO_URL = "https://github.com/DinVisel/session-kit";

const LINKS = [
  { href: REPO_URL, label: "GitHub", icon: ExternalLink },
  { href: `${REPO_URL}#readme`, label: "Docs", icon: BookOpen },
  { href: `${REPO_URL}/tree/master/sessionkit-sdk`, label: "npm (coming soon)", icon: Package },
];

export function QuickLinks() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-hairline)] px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-cyan)]"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </a>
      ))}
    </div>
  );
}
