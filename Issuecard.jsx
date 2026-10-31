import {
  ArrowUpRight,
  CalendarDays,
  Code2,
  ExternalLink,
  Sparkles,
  Star,
} from "lucide-react";
import BookmarkButton from "./BookmarkButton";

function formattedDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function IssueCard({
  issue,
  isSaved,
  onToggleSave,
  onViewDetails,
}) {
  const description = issue.description || "No issue description was provided.";
  const descriptionPreview = description.length > 420
    ? `${description.slice(0, 417).trimEnd()}…`
    : description;
  const topicTags = [...new Set([
    ...(issue.labels || []),
    ...(issue.topics || issue.skills || []),
  ])];

  return (
    <article className="issue-card">
      <div className="issue-card-top">
        <div className="badge-row">
          <span className={`difficulty-badge ${issue.difficulty?.toLowerCase() || "intermediate"}`}>
            <span className="status-dot" />
            {issue.difficulty || "Unrated"}
          </span>
          {issue.good_first_issue && <span className="issue-flag beginner-flag">Good first issue</span>}
          {issue.help_wanted && <span className="issue-flag help-flag">Help wanted</span>}
        </div>
        <BookmarkButton saved={isSaved} onClick={() => onToggleSave(issue)} label={false} />
      </div>

      <div className="repository-name">
        <Code2 size={14} />
        <span>{issue.owner || issue.repository?.split("/")[0]}/{issue.repository?.split("/").slice(1).join("/")}</span>
        {issue.source === "sample" && <span className="sample-pill">Sample</span>}
      </div>
      <h3>{issue.title}</h3>
      <p className="issue-description">{descriptionPreview}</p>

      <div className="issue-labels">
        {topicTags.slice(0, 4).map((label) => (
          <span className="issue-label" key={label}>{label}</span>
        ))}
      </div>

      <div className="issue-card-meta">
        <span><span className="language-dot" />{issue.language || "Language unknown"}</span>
        {issue.stars != null && <span><Star size={14} />{Number(issue.stars).toLocaleString()}</span>}
        <span><CalendarDays size={14} />{formattedDate(issue.created_at)}</span>
      </div>
      <div className="issue-card-actions">
        <button className="details-button" onClick={() => onViewDetails(issue)}>
          View details <ArrowUpRight size={15} />
        </button>
        <button className="ai-button" onClick={() => onViewDetails(issue, true)}>
          <Sparkles size={15} /> Explain
        </button>
        {issue.url && (
          <a className="external-link" href={issue.url} target="_blank" rel="noreferrer" aria-label="Open GitHub issue">
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </article>
  );
}
