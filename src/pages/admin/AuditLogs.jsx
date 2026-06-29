import { useCallback, useEffect, useState } from "react";
import { listLogs } from "../../services/auditLogService";

const PAGE_SIZE = 20;

const formatTS = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const severityColor = (action) => {
  if (!action) return "";
  const u = action.toUpperCase();
  if (u.includes("FAILED") || u.includes("REUSE") || u.includes("ERROR") || u.includes("REVOKED"))
    return "text-red-600";
  if (u.includes("SUCCESS") || u.includes("CREATED") || u.includes("VERIFIED"))
    return "text-green-600";
  return "text-gray-700";
};

const LogRow = ({ log }) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50 transition text-sm">
    <td className="py-2.5 px-3 whitespace-nowrap text-gray-600 font-mono text-xs">
      {formatTS(log.createdAt)}
    </td>
    <td className="py-2.5 px-3 whitespace-nowrap">
      <span className={`font-medium ${severityColor(log.action)}`}>
        {log.action}
      </span>
    </td>
    <td className="py-2.5 px-3 whitespace-nowrap text-gray-500 text-xs uppercase">
      {log.entityType || "—"}
    </td>
    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs text-gray-500">
      <span title={log.actorUserId || ""}>
        {log.actorUserId ? log.actorUserId.slice(0, 12) + "…" : "—"}
      </span>
    </td>
    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-xs text-gray-400">
      {log.ipAddress || "—"}
    </td>
  </tr>
);

const LogTable = ({ logs, sortDir, onSortToggle }) => (
  <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <th
            className="py-3 px-3 cursor-pointer select-none hover:text-gray-800"
            onClick={onSortToggle}
          >
            Timestamp {sortDir === "asc" ? "↑" : "↓"}
          </th>
          <th className="py-3 px-3">Action</th>
          <th className="py-3 px-3">Entity</th>
          <th className="py-3 px-3">Actor</th>
          <th className="py-3 px-3">IP</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <LogRow key={log.id} log={log} />
        ))}
      </tbody>
    </table>
  </div>
);

const INIT_FILTERS = {
  action: "",
  entityType: "",
  actorUserId: "",
  ipAddress: "",
  from: "",
  to: "",
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState({ ...INIT_FILTERS });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        limit: PAGE_SIZE,
        page,
      };
      if (sortDir === "asc") params.sortDir = "asc";
      if (filters.action.trim()) params.action = filters.action.trim();
      if (filters.entityType.trim()) params.entityType = filters.entityType.trim();
      if (filters.actorUserId.trim()) params.actorUserId = filters.actorUserId.trim();
      if (filters.ipAddress.trim()) params.ipAddress = filters.ipAddress.trim();
      if (filters.from) params.from = new Date(filters.from).toISOString();
      if (filters.to) params.to = new Date(filters.to + "T23:59:59.999").toISOString();

      const resp = await listLogs(params);
      setLogs(resp.data || []);
      setTotal(resp.total || 0);
      setTotalPages(resp.totalPages || 1);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, sortDir, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({ ...INIT_FILTERS });
    setPage(1);
    setSortDir("desc");
  };

  const handleSortToggle = () => {
    setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Audit Logs</h1>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <input
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              placeholder="e.g. AUTH_LOGIN"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
            <input
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
              placeholder="e.g. SESSION, USER"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Actor</label>
            <input
              value={filters.actorUserId}
              onChange={(e) => handleFilterChange("actorUserId", e.target.value)}
              placeholder="User ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">IP Address</label>
            <input
              value={filters.ipAddress}
              onChange={(e) => handleFilterChange("ipAddress", e.target.value)}
              placeholder="e.g. 192.168."
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="px-4 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={fetchLogs}
            className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">No audit logs found</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && logs.length > 0 && (
        <>
          <LogTable logs={logs} sortDir={sortDir} onSortToggle={handleSortToggle} />

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{" "}
              {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Prev
              </button>
              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogs;
