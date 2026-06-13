import { useCallback, useState } from "react";
import type { ResolutionMode } from "../types/map";

const REQUEST_COUNTER_KEY = "map-background-exporter.google-static-request-count";

export function getRequestCostByResolutionMode(mode: ResolutionMode): number {
  if (mode === "high") {
    return 4;
  }

  if (mode === "ultra") {
    return 9;
  }

  return 1;
}

function readCounter(): number {
  try {
    const raw = sessionStorage.getItem(REQUEST_COUNTER_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeCounter(value: number): void {
  try {
    sessionStorage.setItem(REQUEST_COUNTER_KEY, String(value));
  } catch {
    // Session storage can be unavailable in private or restricted contexts.
  }
}

export function useGoogleRequestCounter() {
  const [requestCount, setRequestCount] = useState(() => readCounter());

  const addRequests = useCallback((amount: number) => {
    setRequestCount((current) => {
      const next = current + amount;
      writeCounter(next);
      return next;
    });
  }, []);

  const resetRequests = useCallback(() => {
    writeCounter(0);
    setRequestCount(0);
  }, []);

  return { requestCount, addRequests, resetRequests };
}
