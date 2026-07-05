import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Download,
  Plus,
  Eye,
  KeyRound,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Role = "Admin" | "Moderator" | "User";
type Status = "Active" | "Blocked" | "Inactive";
type OnlineStatus = "Online" | "Offline";

interface UserRow {
  id: string;
  displayName: string;
  username: string;
  email: string;
  role: Role;
  status: Status;
  onlineStatus: OnlineStatus;
  joinedDate: string;
  avatarColor: string;
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const USERS: UserRow[] = [
  {
    id: "1",
    displayName: "Viet Lam Quoc",
    username: "lqv2005",
    email: "vietlamquoc@gmail.com",
    role: "Admin",
    status: "Active",
    onlineStatus: "Online",
    joinedDate: "May 31, 2025",
    avatarColor: "bg-purple-200 text-purple-700",
  },
  {
    id: "2",
    displayName: "Nguyen Van A",
    username: "nguyenvana",
    email: "nguyenvana@gmail.com",
    role: "User",
    status: "Active",
    onlineStatus: "Offline",
    joinedDate: "May 30, 2025",
    avatarColor: "bg-blue-200 text-blue-700",
  },
  {
    id: "3",
    displayName: "Tran Thi B",
    username: "tranthib",
    email: "tranthib@gmail.com",
    role: "User",
    status: "Active",
    onlineStatus: "Online",
    joinedDate: "May 30, 2025",
    avatarColor: "bg-pink-200 text-pink-700",
  },
  {
    id: "4",
    displayName: "Le Van C",
    username: "levanc",
    email: "levanc@gmail.com",
    role: "Moderator",
    status: "Active",
    onlineStatus: "Offline",
    joinedDate: "May 29, 2025",
    avatarColor: "bg-amber-200 text-amber-700",
  },
  {
    id: "5",
    displayName: "Pham Duy D",
    username: "phamduyd",
    email: "phamduyd@gmail.com",
    role: "User",
    status: "Blocked",
    onlineStatus: "Offline",
    joinedDate: "May 29, 2025",
    avatarColor: "bg-emerald-200 text-emerald-700",
  },
  {
    id: "6",
    displayName: "Hoang Thi E",
    username: "hoangthie",
    email: "hoangthie@gmail.com",
    role: "User",
    status: "Active",
    onlineStatus: "Online",
    joinedDate: "May 28, 2025",
    avatarColor: "bg-indigo-200 text-indigo-700",
  },
  {
    id: "7",
    displayName: "Doan Van F",
    username: "doanvanf",
    email: "doanvanf@gmail.com",
    role: "User",
    status: "Inactive",
    onlineStatus: "Offline",
    joinedDate: "May 28, 2025",
    avatarColor: "bg-slate-200 text-slate-700",
  },
  {
    id: "8",
    displayName: "Bui Thi G",
    username: "buithig",
    email: "buithig@gmail.com",
    role: "User",
    status: "Active",
    onlineStatus: "Online",
    joinedDate: "May 27, 2025",
    avatarColor: "bg-rose-200 text-rose-700",
  },
  {
    id: "9",
    displayName: "Pham Van H",
    username: "phamvanh",
    email: "phamvanh@gmail.com",
    role: "Moderator",
    status: "Active",
    onlineStatus: "Online",
    joinedDate: "May 27, 2025",
    avatarColor: "bg-cyan-200 text-cyan-700",
  },
  {
    id: "10",
    displayName: "Nguyen Thi I",
    username: "nguyenthii",
    email: "nguyenthii@gmail.com",
    role: "User",
    status: "Blocked",
    onlineStatus: "Offline",
    joinedDate: "May 26, 2025",
    avatarColor: "bg-violet-200 text-violet-700",
  },
];

const TOTAL_USERS = 1245;
const TOTAL_PAGES = 125;

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const RoleBadge: React.FC<{ role: Role }> = ({ role }) => {
  const styles: Record<Role, string> = {
    Admin: "bg-purple-50 text-purple-600",
    Moderator: "bg-orange-50 text-orange-600",
    User: "bg-blue-50 text-blue-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${styles[role]}`}
    >
      {role}
    </span>
  );
};

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles: Record<Status, string> = {
    Active: "bg-emerald-50 text-emerald-600",
    Blocked: "bg-red-50 text-red-600",
    Inactive: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
};

const OnlineDot: React.FC<{ status: OnlineStatus }> = ({ status }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
    <span
      className={`w-2 h-2 rounded-full ${
        status === "Online" ? "bg-emerald-500" : "bg-slate-300"
      }`}
    />
    {status}
  </span>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const ROLE_OPTIONS = ["All Roles", "Admin", "Moderator", "User"];
const STATUS_OPTIONS = ["All Statuses", "Active", "Blocked", "Inactive"];
const ONLINE_OPTIONS = ["All", "Online", "Offline"];
const PAGE_SIZE_OPTIONS = ["10 per page", "25 per page", "50 per page"];

const UserManagement: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [onlineFilter, setOnlineFilter] = useState<string>("All");
  const [pageSize, setPageSize] = useState<string>("10 per page");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<keyof UserRow | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const hasActiveFilters =
    search !== "" ||
    roleFilter !== "All Roles" ||
    statusFilter !== "All Statuses" ||
    onlineFilter !== "All";

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("All Roles");
    setStatusFilter("All Statuses");
    setOnlineFilter("All");
  };

  const handleSort = (key: keyof UserRow) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filteredUsers = useMemo(() => {
    let rows = USERS.filter((u) => {
      const matchesSearch =
        search.trim() === "" ||
        u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "All Roles" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "All Statuses" || u.status === statusFilter;
      const matchesOnline =
        onlineFilter === "All" || u.onlineStatus === onlineFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesOnline;
    });

    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = String(a[sortKey]).toLowerCase();
        const bv = String(b[sortKey]).toLowerCase();
        if (av < bv) return sortAsc ? -1 : 1;
        if (av > bv) return sortAsc ? 1 : -1;
        return 0;
      });
    }

    return rows;
  }, [search, roleFilter, statusFilter, onlineFilter, sortKey, sortAsc]);

  const columns: { key: keyof UserRow; label: string }[] = [
    { key: "displayName", label: "User" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "onlineStatus", label: "Online Status" },
    { key: "joinedDate", label: "Joined Date" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              User Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage all users in the system. You can search, filter, and
              take actions on users.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500 tabular-nums">
              14:51:22
            </span>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by display name, username, or email..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:bg-white"
              />
            </div>

            <FilterSelect
              label="Role"
              value={roleFilter}
              options={ROLE_OPTIONS}
              onChange={(v) => {
                setRoleFilter(v);
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
              label="Online Status"
              value={onlineFilter}
              options={ONLINE_OPTIONS}
              onChange={(v) => {
                setOnlineFilter(v);
                setCurrentPage(1);
              }}
            />

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-purple-600 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Clear Filters
            </button>

            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <span className="text-sm text-slate-600">
              Total Users: <span className="font-semibold">{TOTAL_USERS.toLocaleString()}</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <FilterSelect
                label=""
                value={pageSize}
                options={PAGE_SIZE_OPTIONS}
                onChange={setPageSize}
                compact
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="text-left font-medium px-5 py-3 cursor-pointer select-none hover:text-slate-600 whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <ArrowUpDown className="w-3 h-3" />
                      </span>
                    </th>
                  ))}
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${u.avatarColor}`}
                        >
                          {initials(u.displayName)}
                        </div>
                        <span className="font-medium text-slate-700 whitespace-nowrap">
                          {u.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {u.username}
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {u.email}
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3">
                      <OnlineDot status={u.onlineStatus} />
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {u.joinedDate}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ActionButton
                          icon={<Eye className="w-3.5 h-3.5" />}
                          color="text-purple-500 bg-purple-50 hover:bg-purple-100"
                          label={`View ${u.displayName}`}
                        />
                        <ActionButton
                          icon={<KeyRound className="w-3.5 h-3.5" />}
                          color="text-amber-500 bg-amber-50 hover:bg-amber-100"
                          label={`Reset password for ${u.displayName}`}
                        />
                        <ActionButton
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          color="text-red-500 bg-red-50 hover:bg-red-100"
                          label={`Delete ${u.displayName}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      No users match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
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
                    currentPage === page
                      ? "bg-purple-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1 text-slate-400">…</span>
              <button
                onClick={() => setCurrentPage(TOTAL_PAGES)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === TOTAL_PAGES
                    ? "bg-purple-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {TOTAL_PAGES}
              </button>
              <PageArrow
                icon={<ChevronRight className="w-4 h-4" />}
                disabled={currentPage === TOTAL_PAGES}
                onClick={() =>
                  setCurrentPage((p) => Math.min(TOTAL_PAGES, p + 1))
                }
              />
            </div>
            <span className="text-sm text-slate-400">
              Showing 1 to {filteredUsers.length} of {TOTAL_USERS.toLocaleString()} users
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Reusable bits                                                       */
/* ------------------------------------------------------------------ */

const FilterSelect: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  compact?: boolean;
}> = ({ label, value, options, onChange, compact }) => (
  <div className={`relative ${compact ? "w-40" : "w-44"} shrink-0`}>
    {label && (
      <span className="absolute -top-2 left-2.5 bg-white px-1 text-[10px] text-slate-400">
        {label}
      </span>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm rounded-xl border border-slate-200 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  color: string;
  label: string;
}> = ({ icon, color, label }) => (
  <button
    type="button"
    aria-label={label}
    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${color}`}
  >
    {icon}
  </button>
);

const PageArrow: React.FC<{
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}> = ({ icon, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
  >
    {icon}
  </button>
);

export default UserManagement;