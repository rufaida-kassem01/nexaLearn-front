const DragHandle = ({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }) => {
  return (
    <div className="flex gap-1 items-center">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!canMoveUp}
        className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed p-1 rounded hover:bg-gray-100 disabled:hover:bg-transparent transition"
        title="Move up"
        aria-label="Move up"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!canMoveDown}
        className="text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed p-1 rounded hover:bg-gray-100 disabled:hover:bg-transparent transition"
        title="Move down"
        aria-label="Move down"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};

export default DragHandle;
