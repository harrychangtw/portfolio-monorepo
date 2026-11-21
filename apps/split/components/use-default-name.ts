"use client";

import { useEffect, useState } from "react";
import { defaultName } from "@/lib/default-name";

/** The fallback name in the visitor's local time, set after mount to avoid a hydration mismatch. */
export function useDefaultName() {
  const [name, setName] = useState("");
  useEffect(() => {
    const tick = () => setName(defaultName());
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);
  return name;
}
