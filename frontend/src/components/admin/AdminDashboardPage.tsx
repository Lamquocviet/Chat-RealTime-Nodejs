import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  UserCheck,
  Ban,
  Wifi,
  UserPlus,
  Calendar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ClipboardList,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAdminStore } from "@/stores/useAdminStore";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down" | "live";
}

interface NewUsersPoint {
  day: string;
  users: number;
}

interface DistributionSlice {
  name: string;
  value: number;
  percent: string;
  color: string;
}

const distributionColors = ["#a855f7", "#ef4444", "#3b82f6", "#22c55e"];
 
/* ------------------------------------------------------------------ */
/*  Small presentational components                                    */
/* ------------------------------------------------------------------ */
 
const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  iconBg,
  label,
  value,
  trend,
  trendDirection,
}) => {
  const trendColor =
    trendDirection === "up"
      ? "text-emerald-500"
      : trendDirection === "down"
      ? "text-red-500"
      : "text-emerald-500";
 
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4 min-w-0">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm text-slate-400 truncate">{label}</span>
        <span className="text-2xl font-bold text-slate-800 tabular-nums">
          {value}
        </span>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          {trendDirection === "up" && <TrendingUp className="w-3.5 h-3.5" />}
          {trendDirection === "down" && <TrendingDown className="w-3.5 h-3.5" />}
          {trendDirection === "live" && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          )}
          <span className="truncate">{trend}</span>
        </div>
      </div>
    </div>
  );
};
 
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
        <div className="text-slate-300 mb-0.5">{label}</div>
        <div className="font-semibold">{payload[0].value} new users</div>
      </div>
    );
  }
  return null;
};
 
/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */
 
const Dashboard: React.FC = () => {
  const [now, setNow] = useState<Date>(new Date());
  const [range, setRange] = useState<string>("This Month");
  const { summary, distribution, newUsersChart, getUserStats, statsLoading } =
    useAdminStore();

  useEffect(() => {
    void getUserStats();
  }, [getUserStats]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeString = useMemo(
    () =>
      now.toLocaleTimeString("en-GB", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [now]
  );
 
  const chartData = useMemo<NewUsersPoint[]>(() => {
    return newUsersChart.map((item) => ({
      day: item.day.toString(),
      users: item.users,
    }));
  }, [newUsersChart]);

  const distributionData = useMemo<DistributionSlice[]>(() => {
    const total = distribution.reduce((sum, item) => sum + item.value, 0);

    return distribution.map((item, index) => ({
      name: item.name,
      value: item.value,
      percent: total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : "0%",
      color: distributionColors[index % distributionColors.length],
    }));
  }, [distribution]);

  const metrics: MetricCardProps[] = useMemo(() => {
    if (!summary) {
      return [
        {
          icon: <Users className="w-5 h-5 text-purple-500" />,
          iconBg: "bg-purple-50",
          label: "Total Users",
          value: statsLoading ? "..." : "0",
          trend: "Loading stats",
          trendDirection: "up",
        },
        {
          icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
          iconBg: "bg-emerald-50",
          label: "Active Users",
          value: statsLoading ? "..." : "0",
          trend: "Loading stats",
          trendDirection: "up",
        },
        {
          icon: <Ban className="w-5 h-5 text-red-500" />,
          iconBg: "bg-red-50",
          label: "Blocked Users",
          value: statsLoading ? "..." : "0",
          trend: "Loading stats",
          trendDirection: "down",
        },
        {
          icon: <Wifi className="w-5 h-5 text-blue-500" />,
          iconBg: "bg-blue-50",
          label: "Online Users",
          value: statsLoading ? "..." : "0",
          trend: "Loading stats",
          trendDirection: "live",
        },
        {
          icon: <UserPlus className="w-5 h-5 text-orange-500" />,
          iconBg: "bg-orange-50",
          label: "New Users Today",
          value: statsLoading ? "..." : "0",
          trend: "Loading stats",
          trendDirection: "up",
        },
        {
          icon: <Calendar className="w-5 h-5 text-violet-600" />,
          iconBg: "bg-violet-50",
          label: "New Users This Month",
          value: statsLoading ? "..." : "0",
          trend: "Loading stats",
          trendDirection: "up",
        },
      ];
    }

    return [
      {
        icon: <Users className="w-5 h-5 text-purple-500" />,
        iconBg: "bg-purple-50",
        label: "Total Users",
        value: summary.totalUsers.toLocaleString(),
        trend: `${summary.newUsersMonth.toLocaleString()} joined this month`,
        trendDirection: "up",
      },
      {
        icon: <UserCheck className="w-5 h-5 text-emerald-500" />,
        iconBg: "bg-emerald-50",
        label: "Active Users",
        value: summary.activeUsers.toLocaleString(),
        trend: `${summary.inactiveUsers.toLocaleString()} inactive`,
        trendDirection: "up",
      },
      {
        icon: <Ban className="w-5 h-5 text-red-500" />,
        iconBg: "bg-red-50",
        label: "Blocked Users",
        value: summary.blockedUsers.toLocaleString(),
        trend: `${summary.blockedUsers.toLocaleString()} currently blocked`,
        trendDirection: "down",
      },
      {
        icon: <Wifi className="w-5 h-5 text-blue-500" />,
        iconBg: "bg-blue-50",
        label: "Online Users",
        value: summary.onlineUsers.toLocaleString(),
        trend: "Live right now",
        trendDirection: "live",
      },
      {
        icon: <UserPlus className="w-5 h-5 text-orange-500" />,
        iconBg: "bg-orange-50",
        label: "New Users Today",
        value: summary.newUsersToday.toLocaleString(),
        trend: "Joined today",
        trendDirection: "up",
      },
      {
        icon: <Calendar className="w-5 h-5 text-violet-600" />,
        iconBg: "bg-violet-50",
        label: "New Users This Month",
        value: summary.newUsersMonth.toLocaleString(),
        trend: "Joined this month",
        trendDirection: "up",
      },
    ];
  }, [statsLoading, summary]);

  return (
    
      <div className="p-0">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage users, monitor system statistics and audit activities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500 tabular-nums">
              {timeString}
            </span>
            <button
              type="button"
              onClick={() => setNow(new Date())}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
 
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>
 
        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* New Users This Month */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <h2 className="text-sm font-semibold text-slate-700">
                  New Users This Month
                </h2>
              </div>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, "dataMax + 10"]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fill="url(#colorUsers)"
                    dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
 
          {/* Users Distribution */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <h2 className="text-sm font-semibold text-slate-700">
                Users Distribution
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-40 h-40 shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={72}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {distributionData.map((slice) => (
                        <Cell key={slice.name} fill={slice.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-sm font-bold text-slate-700">
                    {distributionData[0]?.percent ?? "0%"}
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full flex flex-col gap-3">
                {distributionData.map((slice) => (
                  <div
                    key={slice.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-slate-600 font-medium truncate">
                        {slice.name}
                      </span>
                    </div>
                    <span className="text-slate-400 shrink-0 ml-2 whitespace-nowrap">
                      {slice.value.toLocaleString()} ({slice.percent})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
 
        {/* Summary banner */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardList className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-0.5">
              Summary
            </h3>
            <p className="text-sm text-slate-500">
              You have{" "}
              <span className="font-bold text-blue-500">
                {summary?.onlineUsers?.toLocaleString() ?? 0}
              </span>{" "}
              users online right now.{" "}
              <span className="font-bold text-emerald-500">
                {summary?.newUsersToday?.toLocaleString() ?? 0}
              </span>{" "}
              new users joined today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
