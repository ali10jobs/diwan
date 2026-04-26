import type { Governorate } from "./transaction";

// Wire shape for `/api/overview`. KPI values are integer halalas where
// monetary, plain numbers/percentages otherwise — the client formats.

export type OverviewKpis = {
  /** Sum of `amountSar` across **succeeded** transactions in the window, in halalas. */
  revenueSar: number;
  /** Count of succeeded transactions in the window. */
  successfulCount: number;
  /** failed / total in [0, 1]. 0 when total is 0. */
  failureRate: number;
  /** Approximated ARPU = revenueSar / distinct active customers, in halalas. */
  arpuSar: number;
  /** Distinct customers with ≥1 transaction in the window. */
  activeCustomers: number;
};

export type OverviewTimePoint = {
  /** Bucket start, ISO date (YYYY-MM-DD). */
  date: string;
  revenueSar: number;
  successfulCount: number;
  failedCount: number;
};

export type OverviewGovernoratePoint = {
  governorate: Governorate;
  revenueSar: number;
  // Stacked-bar series — keep status breakdowns alongside the total
  // so the chart doesn't need a second request.
  succeededSar: number;
  failedSar: number;
  pendingSar: number;
  reversedSar: number;
};

export type OverviewResponse = {
  kpis: OverviewKpis;
  timeSeries: OverviewTimePoint[];
  governorateBreakdown: OverviewGovernoratePoint[];
  window: { from: string; to: string };
};
