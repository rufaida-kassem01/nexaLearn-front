import { useState } from "react";

const REFUND_REASONS: string[] = [
  "Accidental purchase",
  "Course content not as expected",
  "Technical issues",
  "Found a better course",
  "Other",
];

interface RefundModalProps {
  courseTitle: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RefundModal = ({ courseTitle, onConfirm, onCancel, isLoading }: RefundModalProps) => {
  const [reason, setReason] = useState<string>("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4 w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Refund</h3>

        <p className="text-sm text-gray-600 mb-4">
          You are requesting a refund for <strong>{courseTitle}</strong>.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-blue-700">
            Refunds are available within 7 days of enrollment if you have completed
            fewer than 1 lesson. Your access will be revoked after the refund is processed.
          </p>
        </div>

        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Reason (optional)
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 mb-4"
        >
          <option value="">Select a reason\u2026</option>
          {REFUND_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing\u2026" : "Request Refund"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundModal;
