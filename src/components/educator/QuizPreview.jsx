const QuizPreview = ({ quiz, onClose }) => {
  if (!quiz) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <p className="text-gray-400 text-sm">No quiz data available.</p>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/30 backdrop-blur-sm z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Quiz Preview</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="mb-6 border-b pb-4">
          <h3 className="text-xl font-bold">{quiz.title}</h3>
          {quiz.description && (
            <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
          )}
          <div className="flex gap-4 mt-2 text-xs text-gray-400">
            <span>{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            <span>Passing: {quiz.passingScore || 70}%</span>
            {quiz.totalMarks != null && <span>Total: {quiz.totalMarks} pts</span>}
            {quiz.timeLimitMins && <span>Time: {quiz.timeLimitMins} min</span>}
            {quiz.maxAttempts && <span>Max attempts: {quiz.maxAttempts}</span>}
          </div>
        </div>

        {questions.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            No questions in this quiz yet.
          </p>
        ) : (
          <div className="space-y-4">
            {questions
              .slice()
              .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
              .map((q, i) => (
                <div key={q.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm">
                      {i + 1}. {q.questionText}
                    </p>
                    <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {q.points || 1} pt{q.points !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {q.type === "SHORT_ANSWER" ? (
                    <textarea
                      disabled
                      rows={2}
                      placeholder="Type your answer..."
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50 resize-none"
                    />
                  ) : (
                    <div className="space-y-1.5">
                      {(q.options || [])
                        .slice()
                        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                        .map((opt) => (
                          <label
                            key={opt.id}
                            className="flex items-center gap-2 p-2 rounded border border-gray-200 text-sm cursor-default"
                          >
                            <input
                              type={q.type === "MULTIPLE_CHOICE" ? "radio" : "radio"}
                              disabled
                              name={`preview-${q.id}`}
                              className="accent-blue-600"
                            />
                            {opt.optionText}
                          </label>
                        ))}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {q.type === "MULTIPLE_CHOICE"
                      ? "Multiple Choice"
                      : q.type === "TRUE_FALSE"
                        ? "True/False"
                        : "Short Answer"}
                  </p>
                </div>
              ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded text-sm hover:bg-black transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizPreview;
