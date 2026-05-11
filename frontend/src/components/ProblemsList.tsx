import type { Problem } from "../lib/types";

type ProblemsListProps = {
  title: string;
  subtitle: string;
  problems: Problem[];
  emptyMessage: string;
  primaryActionLabel?: string;
  onPrimaryAction?: (problem: Problem) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (problem: Problem) => void;
};

export function ProblemsList({
  title,
  subtitle,
  problems,
  emptyMessage,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}: ProblemsListProps) {
  const items = Array.isArray(problems) ? problems : [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-[#edf3ec] text-[#448361]";
      case "medium":
        return "bg-[#fbf3db] text-[#cb912f]";
      case "hard":
        return "bg-[#fdebec] text-[#d44c47]";
      default:
        return "bg-[var(--surface-tint)] text-[var(--text-secondary)]";
    }
  };

  return (
    <div className="notion-card overflow-hidden">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-10">
          <p className="text-sm text-[var(--text-tertiary)]">☁ {emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {items.map((problem) => (
            <div
              key={`${problem.platform}-${problem.external_id}`}
              className="notion-block group flex items-start justify-between gap-4 rounded-none px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <h3 className="line-clamp-2 text-sm font-medium text-[var(--text-primary)]">
                  {problem.name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-tint)]">
                    {problem.platform}
                  </span>
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-tint)]">
                    {problem.topic}
                  </span>
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </div>
                <a
                  href={problem.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-[var(--text-tertiary)] underline-offset-2 hover:text-[var(--text-primary)] hover:underline"
                >
                  View problem →
                </a>
              </div>

              <div className="flex shrink-0 gap-1">
                {primaryActionLabel && onPrimaryAction && (
                  <button
                    onClick={() => onPrimaryAction(problem)}
                    className="notion-button px-2 py-1 text-xs"
                  >
                    {primaryActionLabel}
                  </button>
                )}
                {secondaryActionLabel && onSecondaryAction && (
                  <button
                    onClick={() => onSecondaryAction(problem)}
                    className="notion-button-primary px-2 py-1 text-xs"
                  >
                    {secondaryActionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
