"use client";

import { useQuery } from "@tanstack/react-query";
import type { OverviewResponse } from "@/lib/types/overview";

async function fetchOverview(): Promise<OverviewResponse> {
  const res = await fetch("/api/overview");
  if (!res.ok) throw new Error(`Overview request failed: ${res.status}`);
  return (await res.json()) as OverviewResponse;
}

export function useOverviewQuery() {
  return useQuery({
    queryKey: ["overview"],
    queryFn: fetchOverview,
    staleTime: 60_000,
  });
}
