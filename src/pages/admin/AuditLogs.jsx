import { useCallback, useEffect, useRef, useState } from "react";
import { listAuditLogs } from "../../services/adminService";

const INIT_FILTERS = {
  action: "",
  entityType: "",
  actorUserId: "",
  ipAddress: "",
  from: "",
  to: "",
  sortDir: "desc",
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState(INIT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const buildParams = useCallback(() => {
    const { action, entityType, actorUserId, ipAddress, from, to, sortDir } =
      filtersRef.current;
    const params = { page, limit, sortDir };
    if (action.trim()) params.action = action.trim();
    if (entityType.trim()) params.entityType = entityType.trim();
    if (actorUserId.trim()) params.actorUserId = actorUserId.trim();
    if (ipAddress.trim()) params.ipAddress = ipAddress.trim();
    if (from) params.from = new Date(from + "T00:00:00.000Z").toISOString();
    if (to) params.to = new Date(to + "T23:59:59.999Z").toISOString();
    return params;
  }, [page, limit]);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await listAuditLogs(buildParams());
      setLogs(resp.data ?? []);
      setTotal(resp.total ?? 0);
      setPage(resp.page ?? 1);
      setTotalPages(resp.totalPages ?? 1);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to load audit logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleApply = (e) => {
    e.preventDefault();
    fetch();
  };

  const handleClear = () => {
    setFilters(INIT_FILTERS);
    setPage(1);
  };

  const handleSortToggle = () => {
    setFilters((prev) => ({
      ...prev,
      sortDir: prev.sortDir === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  };

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Prev
        </button>
        {start > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              1
            </button>
            {start > 2 && (
              <span className="px-1 text-gray-400 text-sm">…</span>
            )}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`px-3 py-1.5 text-sm rounded border transition ${
              p === page
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="px-1 text-gray-400 text-sm">…</span>
            )}
            <button
              onClick={() => goToPage(totalPages)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Audit Logs
      </h1>

      <form
        onSubmit={handleApply}
        className="border border-gray-200 rounded-xl p-4 bg-white mb-6 space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <input
              type="text"
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              placeholder="e.g. auth.login.success"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Entity Type
            </label>
            <input
              type="text"
              value={filters.entityType}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
              placeholder="e.g. user, session"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Actor User ID
            </label>
            <input
              type="text"
              value={filters.actorUserId}
              onChange={(e) =>
                handleFilterChange("actorUserId", e.target.value)
              }
              placeholder="User ID"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              IP Address
            </label>
            <input
              type="text"
              value={filters.ipAddress}
              onChange={(e) => handleFilterChange("ipAddress", e.target.value)}
              placeholder="e.g. 192.168.1.1"
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange("from", e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange("to", e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="text-sm px-4 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm px-4 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSortToggle}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition ml-auto"
            title={
              filters.sortDir === "desc"
                ? "Sorted newest first — click for oldest first"
                : "Sorted oldest first — click for newest first"
            }
          >
            {filters.sortDir === "desc" ? "↓ Newest" : "↑ Oldest"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={fetch}
            className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">No audit logs found.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-3">
            Showing {logs.length} of {total} results
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Timestamp</th>
                  <th className="pb-3 pr-4 font-medium">Actor</th>
                  <th className="pb-3 pr-4 font-medium">Action</th>
                  <th className="pb-3 pr-4 font-medium">Entity Type</th>
                  <th className="pb-3 pr-4 font-medium">Entity ID</th>
                  <th className="pb-3 font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-gray-800 font-mono text-xs">
                      {log.actorUserId || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {log.entityType}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 font-mono text-xs">
                      {log.entityId || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 text-gray-500 font-mono text-xs">
                      {log.ipAddress || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default AuditLogs;
