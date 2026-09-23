"use client";

import { useEffect, useState } from "react";
import { usePlayground } from "@/lib/PlaygroundProvider";
import { Panel } from "../ui/Panel";
import { HealthBar } from "./HealthBar";
import { BossSprite } from "./BossSprite";
import { TreasureChest } from "./TreasureChest";
import { FloatingDamage } from "./FloatingDamage";

export function BossCard() {
  const { game } = usePlayground();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (game.hitSeq === 0) return;
    setShake(true);
    const timeout = setTimeout(() => setShake(false), 320);
    return () => clearTimeout(timeout);
  }, [game.hitSeq]);

  const chestState = game.phase === "defeated" ? "opening" : "closed";

  return (
    <Panel className="relative flex flex-col items-center gap-4 overflow-hidden p-6">
      <FloatingDamage damage={game.lastDamage} hitSeq={game.hitSeq} />
      <div className="flex items-center gap-6">
        <BossSprite phase={game.phase} shake={shake} />
        <TreasureChest state={chestState} />
      </div>
      <div className="w-full max-w-sm">
        <HealthBar hp={game.hp} />
      </div>
    </Panel>
  );
}
