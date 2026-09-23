"use client";

import { useCallback, useRef, useState } from "react";
import { BOSS_MAX_HP, DAMAGE_MAX, DAMAGE_MIN } from "./constants";
import type { BossPhase } from "./types";

// Small deterministic PRNG so a raid's damage sequence is reproducible from its seed.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function useGameState() {
  const [hp, setHp] = useState(BOSS_MAX_HP);
  const [phase, setPhase] = useState<BossPhase>("idle");
  const [lastDamage, setLastDamage] = useState<number | null>(null);
  // React bails out of a re-render when a primitive state value is set to the
  // same value again, so two hits that happen to roll identical damage would
  // otherwise silently skip the float-up animation. A monotonic sequence
  // number is the trigger; lastDamage is only the value to display.
  const [hitSeq, setHitSeq] = useState(0);
  const rngRef = useRef(mulberry32(1));

  const applyHit = useCallback((): number => {
    const roll = rngRef.current();
    const damage = Math.round(DAMAGE_MIN + roll * (DAMAGE_MAX - DAMAGE_MIN));
    setLastDamage(damage);
    setHitSeq((seq) => seq + 1);
    setHp((prev) => {
      const next = Math.max(0, prev - damage);
      setPhase(next === 0 ? "defeated" : "fighting");
      return next;
    });
    return damage;
  }, []);

  const reset = useCallback((seed: number = Date.now()) => {
    rngRef.current = mulberry32(seed);
    setHp(BOSS_MAX_HP);
    setPhase("idle");
    setLastDamage(null);
  }, []);

  return {
    hp,
    hpPct: (hp / BOSS_MAX_HP) * 100,
    phase,
    lastDamage,
    hitSeq,
    applyHit,
    reset,
  };
}
