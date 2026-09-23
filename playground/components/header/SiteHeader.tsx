import { InstallBadge } from "./InstallBadge";
import { NetworkBadge } from "./NetworkBadge";
import { ConnectWalletButton } from "./ConnectWalletButton";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--color-border-hairline)] bg-[var(--color-surface-void)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_8px_var(--color-accent-cyan)]" />
            <h1 className="font-mono text-lg font-semibold tracking-tight text-slate-100">
              SessionKit Playground
            </h1>
          </div>
          <InstallBadge />
        </div>
        <div className="flex items-center gap-3">
          <NetworkBadge />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
