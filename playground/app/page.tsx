import { PlaygroundProvider } from "@/lib/PlaygroundProvider";
import { SiteHeader } from "@/components/header/SiteHeader";
import { BattleArena } from "@/components/arena/BattleArena";
import { DevConsole } from "@/components/console/DevConsole";
import { IntegrationCta } from "@/components/cta/IntegrationCta";

export default function Home() {
  return (
    <PlaygroundProvider>
      <SiteHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <BattleArena />
        <DevConsole />
        <IntegrationCta />
      </main>
    </PlaygroundProvider>
  );
}
