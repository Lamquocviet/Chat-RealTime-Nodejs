import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  CalendarCheck,
  ShieldAlert,
  User,
  MessageSquare,
  Video,
  Search,
  ChevronDown,
  Calendar,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  XCircle,
  Bot,
} from "lucide-react";
import { useAdminStore } from "@/stores/useAdminStore";
import type { AuditLogFilters, AuditLogItem } from "@/types/admin";

type ActionType = string;
type LogStatus = "Success" | "Failed" | string;
type TargetType = string;

interface AdminInfo {
  name: string;
  subtitle: string;
  avatarColor: string;
  isSystem?: boolean;
}

interface AuditLogViewModel {
  id: string;
  time: string;
  admin: AdminInfo;
  action: ActionType;
  target: string;
  targetType: TargetType;
  details: string;
  ipAddress: string;
  status: LogStatus;
}

interface MetricCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down";
}

const ACTION_STYLES: Record<string, string> = {
  BLOCK_USER: "bg-red-50 text-red-500",
  DELETE_USER: "bg-orange-50 text-orange-500",
  LOGIN: "bg-emerald-50 text-emerald-500",
  CHANGE_ROLE: "bg-amber-50 text-amber-500",
  UNBLOCK_USER: "bg-sky-50 text-sky-500",
  CREATE_USER: "bg-blue-50 text-blue-500",
  UPDATE_PROFILE: "bg-indigo-50 text-indigo-500",
  DEFAULT: "bg-slate-50 text-slate-500",
};

const ACTION_OPTIONS = ["All Actions", "BLOCK_USER", "DELETE_USER", "LOGIN", "CHANGE_ROLE", "UNBLOCK_USER"];
const ADMIN_OPTIONS = ["All Admins", "Admin", "User", "System"];
const STATUS_OPTIONS = ["All Status", "Success", "Failed"];
const DATE_OPTIONS = ["All Time", "Today", "This Week", "This Month"];

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeStatus(status?: string): LogStatus {
  if (status === "FAILED") return "Failed";
  if (status === "SUCCESS") return "Success";
  return status ?? "Success";
}

function buildDetails(details?: AuditLogItem["details"], description?: string): string {
  if (description) return description;
  if (typeof details === "string") return details;
  if (details && typeof details === "object") {
    return Object.entries(details)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" • ");
  }
  return "No additional details";
}

function mapLogToViewModel(log: AuditLogItem): AuditLogViewModel {
  const actorName = log.actor?.displayName || log.actorName || "System";
  const actorSubtitle = log.actor?.username ? `@${log.actor.username}` : log.actorRole === "admin" ? "@admin" : "@user";
  const targetName = log.targetName || "—";
  const targetType = log.targetType ? log.targetType.charAt(0).toUpperCase() + log.targetType.slice(1) : "System";

  return {
    id: log._id || log.id || `${log.createdAt || Date.now()}`,
    time: formatDateTime(log.createdAt),
    admin: {
      name: actorName,
      subtitle: actorSubtitle,
      avatarColor: log.actorRole === "admin" ? "bg-purple-200 text-purple-700" : "bg-slate-200 text-slate-700",
      isSystem: actorName === "System",
    },
    action: log.action || "UNKNOWN",
    target: targetName,
    targetType,
    details: buildDetails(log.details, log.description),
    ipAddress: log.ipAddress || "—",
    status: normalizeStatus(log.status),
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, iconBg, label, value, trend, trendDirection }) => (
  <div className="bg-card rounded-2xl shadow-sm border border-border p-5 flex flex-col gap-4 min-w-0">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
    <div className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground truncate">{label}</span>
      <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
      <div
        className={`flex items-center gap-1 text-xs font-medium ${
          trendDirection === "up" ? "text-emerald-500" : "text-red-500"
        }`}
      >
        <span>{trendDirection === "up" ? "↗" : "↘"}</span>
        <span className="truncate">{trend}</span>
      </div>
    </div>
  </div>
);

const ActionBadge: React.FC<{ action: ActionType }> = ({ action }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${ACTION_STYLES[action] ?? ACTION_STYLES.DEFAULT}`}
  >
    {action}
  </span>
);

const StatusPill: React.FC<{ status: LogStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
      status === "Success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
    }`}
  >
    {status === "Success" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {status}
  </span>
);

const AdminCell: React.FC<{ admin: AdminInfo }> = ({ admin }) => (
  <div className="flex items-center gap-3">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${admin.avatarColor}`}
    >
      {admin.isSystem ? <Bot className="w-4 h-4" /> : initials(admin.name)}
    </div>
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-foreground whitespace-nowrap">{admin.name}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{admin.subtitle}</span>
    </div>
  </div>
);

const TargetCell: React.FC<{ target: string; targetType: TargetType }> = ({ target, targetType }) => {
  if (!target || target === "—") return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1.5">
      <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <div className="flex flex-col leading-tight">
        <span className="text-foreground/80 whitespace-nowrap">{target}</span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{targetType}</span>
      </div>
    </div>
  );
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  compact?: boolean;
}> = ({ label, value, options, onChange, icon, compact }) => (
  <div className={`relative ${compact ? "w-40" : "w-40"} shrink-0`}>
    {label && (
      <span className="absolute -top-2 left-2.5 bg-background px-1 text-[10px] text-muted-foreground">{label}</span>
    )}
    {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full appearance-none ${
        icon ? "pl-8" : "pl-3"
      } pr-8 py-2.5 text-sm rounded-xl border border-border text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer`}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

const PageArrow: React.FC<{ icon: React.ReactNode; disabled: boolean; onClick: () => void }> = ({
  icon,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  >
    {icon}
  </button>
);

const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("All Actions");
  const [adminFilter, setAdminFilter] = useState<string>("All Admins");
  const [statusFilter, setStatusFilter] = useState<string>("All Status");
  const [dateFilter, setDateFilter] = useState<string>("All Time");
  const [pageSize, setPageSize] = useState<string>("10 per page");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const {
    auditLogs,
    auditLogsLoading,
    auditLogStats,
    auditLogStatsLoading,
    auditLogsTotal,
    auditLogsTotalPages,
    auditLogError,
    getAuditLogs,
    getAuditLogStats,
  } = useAdminStore();

  const pageSizeNumber = Number(pageSize.split(" ")[0]) || 10;

  const hasActiveFilters =
    search !== "" ||
    actionFilter !== "All Actions" ||
    adminFilter !== "All Admins" ||
    statusFilter !== "All Status" ||
    dateFilter !== "All Time";

  const handleClearFilters = () => {
    setSearch("");
    setActionFilter("All Actions");
    setAdminFilter("All Admins");
    setStatusFilter("All Status");
    setDateFilter("All Time");
  };

  const buildFilters = (): AuditLogFilters => {
    const filters: AuditLogFilters = {};

    if (search.trim()) {
      filters.search = search.trim();
    }

    if (actionFilter !== "All Actions") {
      filters.action = actionFilter;
    }

    if (statusFilter !== "All Status") {
      filters.status = statusFilter === "Failed" ? "FAILED" : "SUCCESS";
    }

    if (dateFilter === "Today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filters.startDate = today.toISOString();
      filters.endDate = new Date().toISOString();
    } else if (dateFilter === "This Week") {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      filters.startDate = date.toISOString();
      filters.endDate = new Date().toISOString();
    } else if (dateFilter === "This Month") {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      filters.startDate = date.toISOString();
      filters.endDate = new Date().toISOString();
    }

    return filters;
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void getAuditLogs(currentPage, pageSizeNumber, buildFilters());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [actionFilter, adminFilter, currentPage, dateFilter, getAuditLogs, pageSizeNumber, search, statusFilter]);

  useEffect(() => {
    void getAuditLogStats();
  }, [getAuditLogStats]);

  useEffect(() => {
    if (auditLogsTotalPages > 0 && currentPage > auditLogsTotalPages) {
      setCurrentPage(auditLogsTotalPages);
    }
  }, [auditLogsTotalPages, currentPage]);

  const filteredLogs = useMemo(() => {
    let rows = auditLogs.map(mapLogToViewModel);

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((log) => {
        return (
          log.admin.name.toLowerCase().includes(q) ||
          log.admin.subtitle.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.target.toLowerCase().includes(q)
        );
      });
    }

    if (adminFilter !== "All Admins") {
      rows = rows.filter((log) => {
        const normalizedAdmin = log.admin.name.toLowerCase();
        return normalizedAdmin.includes(adminFilter.toLowerCase());
      });
    }

    rows = [...rows].sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return sortAsc ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
    });

    return rows;
  }, [actionFilter, adminFilter, auditLogs, search, sortAsc]);

  const metrics = useMemo(() => {
    const stats = auditLogStats;
    return [
      {
        icon: <FileText className="w-5 h-5 text-purple-500" />,
        iconBg: "bg-purple-50",
        label: "Total Logs",
        value: stats ? stats.totalLogs.toLocaleString() : auditLogStatsLoading ? "…" : "0",
        trend: "Live from backend",
        trendDirection: "up" as const,
      },
      {
        icon: <CalendarCheck className="w-5 h-5 text-emerald-500" />,
        iconBg: "bg-emerald-50",
        label: "Logs Today",
        value: stats ? stats.logsToday.toLocaleString() : auditLogStatsLoading ? "…" : "0",
        trend: "Updated in real time",
        trendDirection: "up" as const,
      },
      {
        icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
        iconBg: "bg-red-50",
        label: "Failed Actions",
        value: stats ? stats.failedActions.toLocaleString() : auditLogStatsLoading ? "…" : "0",
        trend: "Failed operations",
        trendDirection: "down" as const,
      },
      {
        icon: <User className="w-5 h-5 text-blue-500" />,
        iconBg: "bg-blue-50",
        label: "User Actions",
        value: stats ? stats.userActions.toLocaleString() : auditLogStatsLoading ? "…" : "0",
        trend: "User module logs",
        trendDirection: "up" as const,
      },
      {
        icon: <MessageSquare className="w-5 h-5 text-orange-500" />,
        iconBg: "bg-orange-50",
        label: "Admin Actions",
        value: stats ? stats.adminActions.toLocaleString() : auditLogStatsLoading ? "…" : "0",
        trend: "Admin module logs",
        trendDirection: "up" as const,
      },
      {
        icon: <Video className="w-5 h-5 text-violet-600" />,
        iconBg: "bg-violet-50",
        label: "Authentication Actions",
        value: stats ? stats.authenticationActions.toLocaleString() : auditLogStatsLoading ? "…" : "0",
        trend: "Auth activity",
        trendDirection: "up" as const,
      },
    ];
  }, [auditLogStats, auditLogStatsLoading]);

  return (
    <div className="min-h-screen p-0">
      <div className="max-w-350 mx-auto flex flex-col gap-6">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor administrator activities and important system events.
            </p>
          </div>
       
        </div>

        {auditLogError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {auditLogError}
          </div>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by admin, username, action..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-card"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Action"
              value={actionFilter}
              options={ACTION_OPTIONS}
              onChange={(v) => {
                setActionFilter(v);
                setCurrentPage(1);
              }}
            />

          

            <FilterSelect
              label="Status"
              value={statusFilter}
              options={STATUS_OPTIONS}
              onChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            />

            <FilterSelect
              label="Date"
              value={dateFilter}
              options={DATE_OPTIONS}
              onChange={(v) => {
                setDateFilter(v);
                setCurrentPage(1);
              }}
              icon={<Calendar className="w-3.5 h-3.5 text-muted-foreground" />}
            />

            <div className="ml-auto flex gap-3">
              <button
                type="button"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters}
                className="px-4 py-2.5 text-sm font-medium rounded-xl border border-border text-primary hover:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Clear Filters
              </button>

              <button
                type="button"
                className="px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                  <th
                    onClick={() => setSortAsc((v) => !v)}
                    className="text-left font-medium px-5 py-3 cursor-pointer select-none hover:text-foreground whitespace-nowrap"
                  >
                    <span className="inline-flex items-center gap-1">
                      Time
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">Admin</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">Action</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">Target</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">Details</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">IP Address</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">Status</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">View</th>
                </tr>
              </thead>
              <tbody>
                {auditLogsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-t border-border hover:bg-muted/60 transition-colors">
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{log.time}</td>
                      <td className="px-5 py-3">
                        <AdminCell admin={log.admin} />
                      </td>
                      <td className="px-5 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-5 py-3">
                        <TargetCell target={log.target} targetType={log.targetType} />
                      </td>
                      <td className="px-5 py-3 text-muted-foreground max-w-55 truncate">{log.details}</td>
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{log.ipAddress}</td>
                      <td className="px-5 py-3">
                        <StatusPill status={log.status} />
                      </td>
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          aria-label={`View log ${log.id}`}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-500 bg-purple-50 hover:bg-purple-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                      No logs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <div className="flex items-center gap-1.5">
              <PageArrow
                icon={<ChevronLeft className="w-4 h-4" />}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              />
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-muted-foreground">…</span>
              <button
                onClick={() => setCurrentPage(auditLogsTotalPages || 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === (auditLogsTotalPages || 1) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {auditLogsTotalPages || 1}
              </button>
              <PageArrow
                icon={<ChevronRight className="w-4 h-4" />}
                disabled={currentPage === (auditLogsTotalPages || 1)}
                onClick={() => setCurrentPage((p) => Math.min(auditLogsTotalPages || 1, p + 1))}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Showing {auditLogs.length > 0 ? 1 : 0} to {auditLogs.length} of {auditLogsTotal.toLocaleString()} logs
              </span>
              <FilterSelect
                label=""
                value={pageSize}
                options={["10 per page", "25 per page", "50 per page"]}
                onChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;