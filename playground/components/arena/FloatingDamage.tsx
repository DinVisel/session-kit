"use client";

import { useEffect, useState } from "react";

interface FloatItem {
  id: number;
  value: number;
}

export function FloatingDamage({ damage, hitSeq }: { damage: number | null; hitSeq: number }) {
  const [items, setItems] = useState<FloatItem[]>([]);

  useEffect(() => {
    if (hitSeq === 0 || damage === null) return;
    const id = hitSeq;
    setItems((prev) => [...prev, { id, value: damage }]);
    const timeout = setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 900);
    return () => clearTimeout(timeout);
  }, [hitSeq, damage]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
      {items.map((item) => (
        <span
          key={item.id}
          className="animate-damage-float absolute font-mono text-lg font-bold text-[var(--color-accent-danger)]"
        >
          -{item.value}
        </span>
      ))}
    </div>
  );
}
