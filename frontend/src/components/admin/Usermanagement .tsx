import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ChevronDown,
  Download,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ShieldCheck,
  ShieldOff,
  UserX,
  UserCheck,
} from "lucide-react";
import { useAdminStore } from "@/stores/useAdminStore";
import type { User } from "@/types/user";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
  avatarUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers for API data                                              */
/* ------------------------------------------------------------------ */

const normalizeRole = (role?: string): Role => {
  if (role === "admin") return "Admin";
  if (role === "moderator") return "Moderator";
  return "User";
};

const normalizeStatus = (status?: string): Status => {
  if (status === "blocked") return "Blocked";
  if (status === "inactive") return "Inactive";
  return "Active";
};

const normalizeOnlineStatus = (isOnline?: boolean): OnlineStatus =>
  isOnline ? "Online" : "Offline";

const mapUserToRow = (user: User): UserRow => ({
  id: user._id,
  avatarUrl: user.avatarUrl || "",
  displayName: user.displayName || user.username,
  username: user.username,
  email: user.email,
  role: normalizeRole(user.role),
  status: normalizeStatus(user.status),
  onlineStatus: normalizeOnlineStatus(user.isOnline),
  joinedDate: user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A",
  avatarColor: "bg-purple-200 text-purple-700",
});

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
  const {
    users,
    total,
    totalPages,
    loading,
    error,
    getAllUser,
    deleteUser,
    promoteUser,
    demoteUser,
    blockUser,
    activeUser,
  } = useAdminStore();
  const [search, setSearch] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");
  const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
  const [onlineFilter, setOnlineFilter] = useState<string>("All");
  const [pageSize, setPageSize] = useState<string>("10 per page");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortKey, setSortKey] = useState<keyof UserRow | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const pageSizeNumber = Number(pageSize.split(" ")[0]) || 10;

  console.log("User: ", users);
  useEffect(() => {
    void getAllUser(currentPage, pageSizeNumber);
  }, [currentPage, pageSizeNumber, getAllUser]);

  const mappedUsers = useMemo(() => users.map(mapUserToRow), [users]);

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

  const handleRefresh = () => {
    void getAllUser(currentPage, pageSizeNumber);
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
    let rows = mappedUsers.filter((u) => {
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
  }, [
    mappedUsers,
    search,
    roleFilter,
    statusFilter,
    onlineFilter,
    sortKey,
    sortAsc,
  ]);

  const columns: { key: keyof UserRow; label: string }[] = [
    { key: "displayName", label: "User" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "onlineStatus", label: "Online Status" },
    { key: "joinedDate", label: "Joined Date" },
  ];

  const totalUsers = total > 0 ? total : mappedUsers.length;
  const pageCount =
    totalPages > 0
      ? totalPages
      : Math.max(1, Math.ceil(totalUsers / pageSizeNumber));
  const pageButtons = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => index + 1,
  );

  const handleExportExcel = () => {
    console.log("Export clicked");
    const data = filteredUsers.map((user, index) => ({
      "No.": index + 1,
      "Display Name": user.displayName,
      Username: user.username,
      Email: user.email,
      Role: user.role,
      Status: user.status,
      "Online Status": user.onlineStatus,
      "Joined Date": user.joinedDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `users-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const handleDelete = async (userId: string) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this user?")
    )
      return;

    await deleteUser(userId);
  };

  const handlePromote = async (userId: string) => {
    if (!window.confirm("Promote this user to Admin?")) return;

    await promoteUser(userId);
  };

  const handleDemote = async (userId: string) => {
    if (!window.confirm("Remove admin privileges?")) return;

    await demoteUser(userId);
  };

  const handleBlock = async (userId: string) => {
    if (!window.confirm("Block this account?")) return;

    await blockUser(userId);
  };

  const handleActivate = async (userId: string) => {
    if (!window.confirm("Activate this account?")) return;

    await activeUser(userId);
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              User Management
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage all users in the system. You can search, filter, and take
              actions on users.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500 tabular-nums">
              14:51:22
            </span>
            <button
              type="button"
              onClick={handleRefresh}
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

            {/* <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button> */}
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <span className="text-sm text-slate-600">
              Total Users:{" "}
              <span className="font-semibold">
                {totalUsers.toLocaleString()}
              </span>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                type="button"
                className="px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointert p"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <FilterSelect
                label=""
                value={pageSize}
                options={PAGE_SIZE_OPTIONS}
                onChange={(value) => {
                  setPageSize(value);
                  setCurrentPage(1);
                }}
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
                {loading && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      Loading users...
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center shrink-0">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-slate-700">
                                {initials(u.displayName)}
                              </span>
                            )}
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
                          {/* Manage */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="
          flex items-center gap-2
          h-9 px-3
          rounded-xl
          border
          border-slate-200
          bg-white
          hover:bg-slate-50
          transition-all
          "
                              >
                                <span className="text-sm font-medium">
                                  Manage
                                </span>

                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-64 rounded-xl p-2"
                            >
                              <DropdownMenuLabel className="text-slate-500">
                                User Actions
                              </DropdownMenuLabel>

                              <DropdownMenuSeparator />

                              {/* Role */}

                              {u.role === "User" ? (
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer"
                                  onClick={() => handlePromote(u.id)}
                                >
                                  <ShieldCheck className="w-4 h-4 mr-3 text-violet-600" />
                                  <div>
                                    <p className="font-medium">
                                      Promote to Admin
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      Give administrator permissions
                                    </p>
                                  </div>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer"
                                  onClick={() => handleDemote(u.id)}
                                >
                                  <ShieldOff className="w-4 h-4 mr-3 text-orange-500" />
                                  <div>
                                    <p className="font-medium">
                                      Demote to User
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      Remove administrator role
                                    </p>
                                  </div>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              {/* Block */}

                              {u.status === "Active" ? (
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer"
                                  onClick={() => handleBlock(u.id)}
                                >
                                  <UserX className="w-4 h-4 mr-3 text-amber-500" />
                                  <div>
                                    <p className="font-medium">Block User</p>
                                    <p className="text-xs text-slate-400">
                                      Prevent user from logging in
                                    </p>
                                  </div>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="rounded-lg cursor-pointer"
                                  onClick={() => handleActivate(u.id)}
                                >
                                  <UserCheck className="w-4 h-4 mr-3 text-emerald-600" />
                                  <div>
                                    <p className="font-medium">Activate User</p>
                                    <p className="text-xs text-slate-400">
                                      Restore account access
                                    </p>
                                  </div>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className="rounded-lg cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(u.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-3" />

                                <div>
                                  <p className="font-medium">Delete User</p>

                                  <p className="text-xs text-red-400">
                                    Permanently remove account
                                  </p>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={columns.length + 1}
                      className="px-5 py-10 text-center text-slate-400"
                    >
                      {error ? error : "No users match your filters."}
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
              {pageButtons.map((page) => (
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
              {pageCount > 5 && <span className="px-1 text-slate-400">…</span>}
              {pageCount > 5 && (
                <button
                  onClick={() => setCurrentPage(pageCount)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageCount
                      ? "bg-purple-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {pageCount}
                </button>
              )}
              <PageArrow
                icon={<ChevronRight className="w-4 h-4" />}
                disabled={currentPage === pageCount}
                onClick={() =>
                  setCurrentPage((p) => Math.min(pageCount, p + 1))
                }
              />
            </div>
            <span className="text-sm text-slate-400">
              Showing 1 to {filteredUsers.length} of{" "}
              {totalUsers.toLocaleString()} users
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
