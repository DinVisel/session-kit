import { CopyButton } from "../ui/CopyButton";

const INSTALL_COMMAND = "npm i @sessionkit/sdk";

export function InstallBadge() {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[var(--color-border-hairline)] bg-black/30 px-2.5 py-1 font-mono text-xs text-slate-400">
      <span>{INSTALL_COMMAND}</span>
      <CopyButton value={INSTALL_COMMAND} label="Copy install command" />
    </div>
  );
}
