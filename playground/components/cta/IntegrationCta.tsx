import { Panel } from "../ui/Panel";
import { CopyButton } from "../ui/CopyButton";
import { CodeBlock } from "./CodeBlock";
import { QuickLinks } from "./QuickLinks";

const SNIPPET = `const kit = new SessionKit({ apiKey, validatorAddress });
await kit.createSession({ durationInSeconds: 900, maxMoves: 10 });
await kit.execute({ action: "SLASH_BOSS" }, 1); // zero popups, gas sponsored`;

export function IntegrationCta() {
  return (
    <Panel className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-sm font-semibold text-slate-200">
          Integrate in 3 lines of code
        </h2>
        <CopyButton value={SNIPPET} label="Copy snippet" />
      </div>
      <CodeBlock code={SNIPPET} />
      <div className="mt-4">
        <QuickLinks />
      </div>
    </Panel>
  );
}
