import { useState } from "react";
import { RotateCcw } from "lucide-react";

const STORAGE_KEY = "openquest-contribution-checklist";
const steps = [
  ["readme", "Read the repository README", "Learn what the project does and how to set it up."],
  ["understand", "Understand the issue", "Restate the problem and expected outcome in your own words."],
  ["guidelines", "Check contribution guidelines", "Look for a CONTRIBUTING file, code style, and test instructions."],
  ["assigned", "Check whether the issue is assigned", "Ask maintainers before starting if assignment is required."],
  ["fork", "Fork the repository", "Create your own copy using GitHub's Fork button."],
  ["clone", "Clone your fork", "Download your fork and configure the original repository as upstream."],
  ["branch", "Create a new branch", "Use a short, descriptive branch name for the change."],
  ["change", "Make the changes", "Keep the patch focused and follow the project's conventions."],
  ["test", "Test your changes", "Run relevant checks and verify the behavior you changed."],
  ["commit", "Commit and push", "Write a clear commit message and push your branch to your fork."],
  ["pull-request", "Create a pull request", "Explain what changed, link the issue, and respond to review feedback."],
];

function readProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

export default function ContributionChecklist() {
  const [checked, setChecked] = useState(readProgress);
  const completed = steps.filter(([id]) => checked[id]).length;
  const percentage = Math.round((completed / steps.length) * 100);

  function toggle(id) {
    setChecked((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <section className="checklist-panel">
      <div className="checklist-heading">
        <div>
          <span className="eyebrow">YOUR CONTRIBUTION PATH</span>
          <h2>First pull request checklist</h2>
          <p>Take it one step at a time. Your progress is saved in this browser.</p>
        </div>
        <button className="text-button" onClick={reset} disabled={completed === 0}>
          <RotateCcw size={15} /> Reset
        </button>
      </div>
      <div className="progress-summary">
        <div className="progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
          <span style={{ width: `${percentage}%` }} />
        </div>
        <strong>{percentage}% complete</strong>
        <span>{completed} of {steps.length} steps</span>
      </div>
      <div className="checklist-steps">
        {steps.map(([id, title, description], index) => (
          <label className={`checklist-row ${checked[id] ? "complete" : ""}`} key={id}>
            <input type="checkbox" checked={Boolean(checked[id])} onChange={() => toggle(id)} />
            <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="checklist-copy"><strong>{title}</strong><small>{description}</small></span>
          </label>
        ))}
      </div>
    </section>
  );
}
