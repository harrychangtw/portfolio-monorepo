"use client";

import { useEffect } from "react";
import { remember } from "@/app/actions";

/** Adds this ledger to the home page's list once the page has opened. */
export function Remember({ token }: { token: string }) {
  useEffect(() => {
    remember(token).catch(() => {});
  }, [token]);
  return null;
}
