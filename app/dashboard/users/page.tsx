import prisma from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users - Dashboard",
};

import { StatsGrid } from "@/components/stats-grid";
import DataTables from "./data-table";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(prevWeekStart.getDate() - 14);

  const [
    totalUsers,
    prevTotalUsers,
    newThisWeek,
    prevNewThisWeek,
    withAvatar,
    prevWithAvatar,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { lt: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: prevWeekStart, lt: weekStart } } }),
    prisma.user.count({ where: { image: { not: null } } }),
    prisma.user.count({ where: { image: { not: null }, createdAt: { gte: prevWeekStart, lt: weekStart } } }),
  ]);

  const formatNumber = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
  const formatPercent = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const diff = ((curr - prev) / prev) * 100;
    const sign = diff >= 0 ? "+" : "-";
    return `${sign}${Math.abs(diff).toFixed(0)}%`;
  };
  const trend = (curr: number, prev: number): "up" | "down" =>
    curr - prev >= 0 ? "up" : "down";

  return (
    <div>
      <div className="flex flex-1 flex-col gap-4 lg:gap-6 py-4 lg:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Utilisateurs</h1>
          </div>
        </div>
        <StatsGrid
          stats={[
            {
              title: "Utilisateurs",
              value: formatNumber(totalUsers),
              change: {
                value: formatPercent(totalUsers - prevTotalUsers, prevTotalUsers),
                trend: trend(totalUsers, prevTotalUsers),
              },
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} fill="currentColor">
                  <path d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10 4.477 0 10 0Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />
                </svg>
              ),
            },
            {
              title: "Nouveaux (7j)",
              value: formatNumber(newThisWeek),
              change: {
                value: formatPercent(newThisWeek, prevNewThisWeek),
                trend: trend(newThisWeek, prevNewThisWeek),
              },
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={19} fill="currentColor">
                  <path d="M2 9.5c0 .313.461.858 1.53 1.393C4.914 11.585 6.877 12 9 12c2.123 0 4.086-.415 5.47-1.107C15.538 10.358 16 9.813 16 9.5V7.329C14.35 8.349 11.827 9 9 9s-5.35-.652-7-1.671V9.5Zm14 2.829C14.35 13.349 11.827 14 9 14s-5.35-.652-7-1.671V14.5c0 .313.461.858 1.53 1.393C4.914 16.585 6.877 17 9 17c2.123 0 4.086-.415 5.47-1.107 1.069-.535 1.53-1.08 1.53-1.393v-2.171ZM0 14.5v-10C0 2.015 4.03 0 9 0s9 2.015 9 4.5v10c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5ZM9 7c2.123 0 4.086-.415 5.47-1.107C15.538 5.358 16 4.813 16 4.5c0-.313-.461-.858-1.53-1.393C13.085 2.415 11.123 2 9 2c-2.123 0-4.086.415-5.47 1.107C2.461 3.642 2 4.187 2 4.5c0 .313.461.858 1.53 1.393C4.914 6.585 6.877 7 9 7Z" />
                </svg>
              ),
            },
            {
              title: "Avec avatar",
              value: formatNumber(withAvatar),
              change: {
                value: formatPercent(withAvatar, prevWithAvatar),
                trend: trend(withAvatar, prevWithAvatar),
              },
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width={21} height={21} fill="currentColor">
                  <path d="m14.142.147 6.347 6.346a.5.5 0 0 1-.277.848l-1.474.23-5.656-5.657.212-1.485a.5.5 0 0 1 .848-.282ZM2.141 19.257c3.722-3.33 7.995-4.327 12.643-5.52l.446-4.017-4.297-4.298-4.018.447c-1.192 4.648-2.189 8.92-5.52 12.643L0 17.117c2.828-3.3 3.89-6.953 5.303-13.081l6.364-.708 5.657 5.657-.707 6.364c-6.128 1.415-9.782 2.475-13.081 5.304L2.14 19.258Zm5.284-6.029a2 2 0 1 1 2.828-2.828 2 2 0 0 1-2.828 2.828Z" />
                </svg>
              ),
            },
          ]}
        />
        <DataTables Element={data} />
      </div>
    </div>
  );
}


