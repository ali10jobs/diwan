"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OverviewGovernoratePoint } from "@/lib/types/overview";
import { RtlChart, useRtlChart } from "@/components/charts/RtlChart";

export function GovernorateBreakdown({ data }: { data: OverviewGovernoratePoint[] }) {
  const t = useTranslations("overview.charts");
  const tGov = useTranslations("transactions.governorate");
  const tStatus = useTranslations("transactions.status");
  const fmt = useFormatter();
  const { xAxisProps } = useRtlChart();

  // Top 8 governorates by revenue keep the bar chart legible at every viewport.
  const top = data.slice(0, 8).map((p) => ({
    governorate: tGov(p.governorate),
    succeeded: p.succeededSar / 100,
    failed: p.failedSar / 100,
    pending: p.pendingSar / 100,
    reversed: p.reversedSar / 100,
  }));

  return (
    <RtlChart ariaLabel={t("governorateBreakdown")} height={320}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="governorate"
            stroke="var(--color-fg-muted)"
            fontSize={11}
            interval={0}
            angle={-30}
            dy={12}
            textAnchor="end"
            {...xAxisProps}
          />
          <YAxis
            stroke="var(--color-fg-muted)"
            fontSize={11}
            tickFormatter={(v: number) => fmt.number(v, { notation: "compact" })}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v) =>
              fmt.number(typeof v === "number" ? v : Number(v ?? 0), {
                style: "currency",
                currency: "SAR",
              })
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="succeeded"
            stackId="rev"
            name={tStatus("succeeded")}
            fill="var(--color-success)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="pending"
            stackId="rev"
            name={tStatus("pending")}
            fill="var(--color-warning)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="failed"
            stackId="rev"
            name={tStatus("failed")}
            fill="var(--color-danger)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="reversed"
            stackId="rev"
            name={tStatus("reversed")}
            fill="var(--color-fg-muted)"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </RtlChart>
  );
}
