import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { getAuditLogs } from "../../services/adminService";

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  ip?: string;
  details?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const actionBadge = (action: string) => {
  const colorMap: Record<string, string> = {
    CREATE: "bg-green-100 text-green-700",
    UPDATE: "bg-blue-100 text-blue-700",
    DELETE: "bg-red-100 text-red-700",
    APPROVE: "bg-emerald-100 text-emerald-700",
    REJECT: "bg-orange-100 text-orange-700",
    LOGIN: "bg-purple-100 text-purple-700",
    LOGOUT: "bg-gray-100 text-gray-600",
  };
  for (const [key, cls] of Object.entries(colorMap)) {
    if (action.toUpperCase().includes(key)) return cls;
  }
  return "bg-gray-100 text-gray-700";
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });

  const fetchLogs = useCallback(
    async (page: number = pagination.page) => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string | number> = { page, limit: pagination.limit };
        if (search.trim()) params.search = search.trim();
        if (actionFilter) params.action = actionFilter;
        const resp = await getAuditLogs(params);
        setLogs(resp.data.logs ?? []);
        setPagination((prev) => ({
          ...prev,
          page: resp.data.page ?? page,
          total: resp.data.total ?? 0,
          pages: resp.data.pages ?? 1,
        }));
      } catch (err) {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : "Failed to load audit logs."),
        );
      } finally {
        setLoading(false);
      }
    },
    [search, actionFilter, pagination.limit],
  );

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleSearch = () => {
    fetchLogs(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const totalPages = pagination.pages;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Audit Logs</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by user email, action, or resource..."
          value={search}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[240px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <select
          value={actionFilter}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setActionFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REJECT">REJECT</option>
          <option value="LOGIN">LOGIN</option>
          <option value="LOGOUT">LOGOUT</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border border-gray-200 rounded-lg bg-white animate-pulse flex items-center px-4 gap-4">
              <div className="w-16 h-6 bg-gray-200 rounded" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => fetchLogs(1)}
            className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-lg font-medium">No audit logs found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Resource</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">IP</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${actionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-900">{log.resource}</span>
                      {log.resourceId && (
                        <span className="text-gray-400 text-xs ml-1">#{log.resourceId.slice(0, 8)}</span>
                      )}
                      {log.details && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]" title={log.details}>
                          {log.details}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">{log.userEmail || "\u2014"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {log.ip || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === totalPages)
                .map((p, idx, arr) => (
                  <span key={p} className="contents">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => fetchLogs(p)}
                      disabled={loading}
                      className={`px-3 py-1.5 text-sm rounded transition ${
                        p === pagination.page
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= totalPages || loading}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-3">
            Showing page {pagination.page} of {totalPages} ({pagination.total} total entries)
          </p>
        </>
      )}
    </div>
  );
};

export default AuditLogs;
