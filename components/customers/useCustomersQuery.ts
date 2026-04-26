"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { Customer } from "@/lib/types/customer";

export type CustomersPage = {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

async function fetchCustomers(q: string): Promise<CustomersPage> {
  const params = new URLSearchParams({ pageSize: "200" });
  if (q) params.set("q", q);
  const res = await fetch(`/api/customers?${params.toString()}`);
  if (!res.ok) throw new Error(`Customers request failed: ${res.status}`);
  return (await res.json()) as CustomersPage;
}

export function useCustomersQuery(q: string) {
  return useQuery({
    queryKey: ["customers", { q }],
    queryFn: () => fetchCustomers(q),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
