import React, { useMemo, useState } from "react";
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ActionType =
  | "BLOCK_USER"
  | "DELETE_USER"
  | "LOGIN"
  | "CREATE_GROUP"
  | "DELETE_MESSAGE"
  | "PROMOTE_ADMIN"
  | "VIDEO_CALL_ENDED"
  | "VIDEO_CALL_STARTED";

type LogStatus = "Success" | "Failed";

type TargetType = "User" | "Group" | "Message" | "Video Call" | "System" | "";

interface AdminInfo {
  name: string;
  subtitle: string;
  avatarColor: string;
  isSystem?: boolean;
}

interface AuditLog {
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

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const ACTION_STYLES: Record<ActionType, string> = {
  BLOCK_USER: "bg-red-50 text-red-500",
  DELETE_USER: "bg-orange-50 text-orange-500",
  LOGIN: "bg-emerald-50 text-emerald-500",
  CREATE_GROUP: "bg-blue-50 text-blue-500",
  DELETE_MESSAGE: "bg-pink-50 text-pink-500",
  PROMOTE_ADMIN: "bg-amber-50 text-amber-500",
  VIDEO_CALL_ENDED: "bg-purple-50 text-purple-500",
  VIDEO_CALL_STARTED: "bg-indigo-50 text-indigo-500",
};

const LOGS: AuditLog[] = [
  {
    id: "1",
    time: "Jul 06, 2025 14:21:55",
    admin: { name: "Viet Lam Quoc", subtitle: "@vietlam", avatarColor: "bg-purple-200 text-purple-700" },
    action: "BLOCK_USER",
    target: "nguyenvana",
    targetType: "User",
    details: "Reason: Spam nhieu lan",
    ipAddress: "113.160.xxx.xxx",
    status: "Success",
  },
  {
    id: "2",
    time: "Jul 06, 2025 14:10:32",
    admin: { name: "Super Admin", subtitle: "@superadmin", avatarColor: "bg-indigo-200 text-indigo-700" },
    action: "DELETE_USER",
    target: "lequoc",
    targetType: "User",
    details: "Violated community policy",
    ipAddress: "103.77.xxx.xxx",
    status: "Success",
  },
  {
    id: "3",
    time: "Jul 06, 2025 13:54:21",
    admin: { name: "Admin Minh", subtitle: "@adminminh", avatarColor: "bg-slate-200 text-slate-700" },
    action: "LOGIN",
    target: "",
    targetType: "System",
    details: "Admin logged in",
    ipAddress: "113.162.xxx.xxx",
    status: "Success",
  },
  {
    id: "4",
    time: "Jul 06, 2025 13:42:18",
    admin: { name: "Admin Linh", subtitle: "@adminlinh", avatarColor: "bg-rose-200 text-rose-700" },
    action: "CREATE_GROUP",
    target: "CNTT K20",
    targetType: "Group",
    details: "Created new group",
    ipAddress: "113.161.xxx.xxx",
    status: "Success",
  },
  {
    id: "5",
    time: "Jul 06, 2025 13:20:45",
    admin: { name: "Viet Lam Quoc", subtitle: "@vietlam", avatarColor: "bg-purple-200 text-purple-700" },
    action: "DELETE_MESSAGE",
    target: "Message #2939",
    targetType: "Message",
    details: "Offensive content",
    ipAddress: "113.160.xxx.xxx",
    status: "Success",
  },
  {
    id: "6",
    time: "Jul 06, 2025 12:58:03",
    admin: { name: "Admin Huy", subtitle: "@adminhuy", avatarColor: "bg-cyan-200 text-cyan-700" },
    action: "PROMOTE_ADMIN",
    target: "phamanh",
    targetType: "User",
    details: "Promoted to Admin",
    ipAddress: "113.163.xxx.xxx",
    status: "Success",
  },
  {
    id: "7",
    time: "Jul 06, 2025 12:40:11",
    admin: { name: "System", subtitle: "@system", avatarColor: "bg-slate-200 text-slate-500", isSystem: true },
    action: "VIDEO_CALL_ENDED",
    target: "Room #5482",
    targetType: "Video Call",
    details: "Duration: 18m 24s",
    ipAddress: "-",
    status: "Success",
  },
  {
    id: "8",
    time: "Jul 06, 2025 12:25:37",
    admin: { name: "Admin Minh", subtitle: "@adminminh", avatarColor: "bg-slate-200 text-slate-700" },
    action: "VIDEO_CALL_STARTED",
    target: "Room #5482",
    targetType: "Video Call",
    details: "Call initiated",
    ipAddress: "113.162.xxx.xxx",
    status: "Success",
  },
];

const TOTAL_LOGS = 2354;
const TOTAL_PAGES = 118;

const ACTION_OPTIONS = ["All Actions", "BLOCK_USER", "DELETE_USER", "LOGIN", "CREATE_GROUP", "DELETE_MESSAGE", "PROMOTE_ADMIN"];
const ADMIN_OPTIONS = ["All Admins", "Viet Lam Quoc", "Super Admin", "Admin Minh", "Admin Linh", "Admin Huy"];
const STATUS_OPTIONS = ["All Status", "Success", "Failed"];
const DATE_OPTIONS = ["This Week", "Today", "This Month", "All Time"];

/* ------------------------------------------------------------------ */
/*  Presentational helpers                                             */
/* ------------------------------------------------------------------ */

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${ACTION_STYLES[action]}`}
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
  if (!target) return <span className="text-muted-foreground">—</span>;
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

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

const AuditLogs: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("All Actions");
  const [adminFilter, setAdminFilter] = useState<string>("All Admins");
  const [statusFilter, setStatusFilter] = useState<string>("All Status");
  const [dateFilter, setDateFilter] = useState<string>("This Week");
  const [pageSize, setPageSize] = useState<string>("10 per page");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const hasActiveFilters =
    search !== "" ||
    actionFilter !== "All Actions" ||
    adminFilter !== "All Admins" ||
    statusFilter !== "All Status";

  const handleClearFilters = () => {
    setSearch("");
    setActionFilter("All Actions");
    setAdminFilter("All Admins");
    setStatusFilter("All Status");
  };

  const filteredLogs = useMemo(() => {
    let rows = LOGS.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch =
        q === "" ||
        log.admin.name.toLowerCase().includes(q) ||
        log.admin.subtitle.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q);
      const matchesAction = actionFilter === "All Actions" || log.action === actionFilter;
      const matchesAdmin = adminFilter === "All Admins" || log.admin.name === adminFilter;
      const matchesStatus = statusFilter === "All Status" || log.status === statusFilter;
      return matchesSearch && matchesAction && matchesAdmin && matchesStatus;
    });

    rows = [...rows].sort((a, b) =>
      sortAsc ? a.time.localeCompare(b.time) : b.time.localeCompare(a.time)
    );

    return rows;
  }, [search, actionFilter, adminFilter, statusFilter, sortAsc]);

  const metrics: MetricCardProps[] = [
    {
      icon: <FileText className="w-5 h-5 text-purple-500" />,
      iconBg: "bg-purple-50",
      label: "Total Logs",
      value: "2,354",
      trend: "12.5% vs last month",
      trendDirection: "up",
    },
    {
      icon: <CalendarCheck className="w-5 h-5 text-emerald-500" />,
      iconBg: "bg-emerald-50",
      label: "Logs Today",
      value: "148",
      trend: "8.2% vs yesterday",
      trendDirection: "up",
    },
    {
      icon: <ShieldAlert className="w-5 h-5 text-red-500" />,
      iconBg: "bg-red-50",
      label: "Failed Actions",
      value: "6",
      trend: "14.3% vs yesterday",
      trendDirection: "down",
    },
    {
      icon: <User className="w-5 h-5 text-blue-500" />,
      iconBg: "bg-blue-50",
      label: "User Actions",
      value: "1,842",
      trend: "15.7% vs last month",
      trendDirection: "up",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-orange-500" />,
      iconBg: "bg-orange-50",
      label: "Message Actions",
      value: "362",
      trend: "6.1% vs last month",
      trendDirection: "up",
    },
    {
      icon: <Video className="w-5 h-5 text-violet-600" />,
      iconBg: "bg-violet-50",
      label: "Video Call Actions",
      value: "150",
      trend: "9.8% vs last month",
      trendDirection: "up",
    },
  ];

  return (
    <div className="min-h-screen p-0">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor administrator activities and important system events.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground tabular-nums">16:22:29</span>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

        {/* Filters bar */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-4">
  {/* Search */}
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

  {/* Filters */}
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
      label="Admin"
      value={adminFilter}
      options={ADMIN_OPTIONS}
      onChange={(v) => {
        setAdminFilter(v);
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
      onChange={setDateFilter}
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

        {/* Table card */}
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
                {filteredLogs.map((log) => (
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
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{log.details}</td>
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
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                      No logs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                onClick={() => setCurrentPage(TOTAL_PAGES)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === TOTAL_PAGES ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {TOTAL_PAGES}
              </button>
              <PageArrow
                icon={<ChevronRight className="w-4 h-4" />}
                disabled={currentPage === TOTAL_PAGES}
                onClick={() => setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))}
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Showing 1 to {filteredLogs.length} of {TOTAL_LOGS.toLocaleString()} logs
              </span>
              <FilterSelect
                label=""
                value={pageSize}
                options={["10 per page", "25 per page", "50 per page"]}
                onChange={setPageSize}
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