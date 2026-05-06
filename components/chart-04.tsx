"use client";

import { useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Rectangle,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/chart";
import { CustomTooltipContent } from "@/components/charts-extra";
import { Badge } from "@/components/badge";
type SupplyChartPoint = {
  month: string;
  actual: number;
  projected: number;
};

const fallbackData: SupplyChartPoint[] = [
  { month: "Jan 2025", actual: 1000, projected: 500 },
  { month: "Feb 2025", actual: 3500, projected: 2000 },
  { month: "Mar 2025", actual: 10000, projected: 3500 },
  { month: "Apr 2025", actual: 9000, projected: 5000 },
  { month: "May 2025", actual: 15000, projected: 7000 },
  { month: "Jun 2025", actual: 17000, projected: 8000 },
  { month: "Jul 2025", actual: 16000, projected: 10000 },
  { month: "Aug 2025", actual: 18000, projected: 11000 },
  { month: "Sep 2025", actual: 9000, projected: 12500 },
  { month: "Oct 2025", actual: 16000, projected: 8000 },
  { month: "Nov 2025", actual: 22000, projected: 9000 },
  { month: "Dec 2025", actual: 15000, projected: 14000 },
];

const chartConfig = {
  actual: {
    label: "Commande",
    color: "var(--chart-4)",
  },
  projected: {
    label: "Reception",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface CustomCursorProps {
  fill?: string;
  pointerEvents?: string;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  className?: string;
}

function CustomCursor(props: CustomCursorProps) {
  const { fill, pointerEvents, height, points, className } = props;

  if (!points || points.length === 0) {
    return null;
  }

  const { x, y } = points[0]!;
  return (
    <>
      <Rectangle
        x={x - 12}
        y={y}
        fill={fill}
        pointerEvents={pointerEvents}
        width={24}
        height={height}
        className={className}
        type="linear"
      />
      <Rectangle
        x={x - 1}
        y={y}
        fill={fill}
        pointerEvents={pointerEvents}
        width={1}
        height={height}
        className="recharts-tooltip-inner-cursor"
        type="linear"
      />
    </>
  );
}

type Chart04Props = {
  data?: SupplyChartPoint[];
};

export function Chart04({ data }: Chart04Props) {
  const id = useId();
  const chartData = data && data.length > 0 ? data : fallbackData;
  const orderedQty = chartData.reduce((sum, item) => sum + Number(item.actual || 0), 0);
  const receivedQty = chartData.reduce((sum, item) => sum + Number(item.projected || 0), 0);
  const coveragePct = orderedQty > 0 ? (receivedQty / orderedQty) * 100 : 0;

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Approvisionnement (Toutes depots)</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">{Math.round(receivedQty).toLocaleString("fr-FR")} L</div>
              <Badge className="mt-1.5 bg-rose-500/24 text-rose-500 border-none">
                {coveragePct.toFixed(1)}% recoit
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-4"
              ></div>
              <div className="text-[13px]/3 text-muted-foreground/50">
                Quantite commandee
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-3"
              ></div>
              <div className="text-[13px]/3 text-muted-foreground/50">
                Quantite recue
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-60 w-full [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-(--chart-4)/10 [&_.recharts-rectangle.recharts-tooltip-inner-cursor]:fill-white/20"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: -12, right: 12, top: 12 }}
          >
            <defs>
              <linearGradient id={`${id}-gradient`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--chart-5)" />
                <stop offset="100%" stopColor="var(--chart-4)" />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="2 2"
              stroke="var(--border)"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={12}
              tickFormatter={(value) => value.slice(0, 3)}
              stroke="var(--border)"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => {
                if (value === 0) return "0";
                return `${(value / 1000).toFixed(0)}k`;
              }}
              interval="preserveStartEnd"
            />
            <Line
              type="linear"
              dataKey="projected"
              stroke="var(--color-projected)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
            <ChartTooltip
              content={
                <CustomTooltipContent
                  colorMap={{
                    actual: "var(--chart-4)",
                    projected: "var(--chart-3)",
                  }}
                  labelMap={{
                    actual: "Quantite commandee",
                    projected: "Quantite recue",
                  }}
                  dataKeys={["actual", "projected"]}
                  valueFormatter={(value) => `${value.toLocaleString("fr-FR")} L`}
                />
              }
              cursor={<CustomCursor fill="var(--chart-4)" />}
            />
            <Line
              type="linear"
              dataKey="actual"
              stroke={`url(#${id}-gradient)`}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: "var(--chart-4)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
