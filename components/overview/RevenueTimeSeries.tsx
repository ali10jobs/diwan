"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OverviewTimePoint } from "@/lib/types/overview";
import { RtlChart, useRtlChart } from "@/components/charts/RtlChart";

export function RevenueTimeSeries({ data }: { data: OverviewTimePoint[] }) {
  const t = useTranslations("overview.charts");
  const fmt = useFormatter();
  const { xAxisProps } = useRtlChart();

  const chartData = data.map((p) => ({
    ...p,
    revenueSar: p.revenueSar / 100,
  }));

  return (
    <RtlChart ariaLabel={t("revenueTimeSeries")}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.32} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="var(--color-fg-muted)"
            fontSize={11}
            tickFormatter={(v: string) =>
              fmt.dateTime(new Date(v), { month: "short", day: "numeric" })
            }
            minTickGap={24}
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
            labelFormatter={(v) => fmt.dateTime(new Date(v as string), { dateStyle: "medium" })}
            formatter={(v) =>
              fmt.number(typeof v === "number" ? v : Number(v ?? 0), {
                style: "currency",
                currency: "SAR",
              })
            }
          />
          <Area
            type="monotone"
            dataKey="revenueSar"
            stroke="var(--color-primary)"
            fill="url(#revenueFill)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </RtlChart>
  );
}
