import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Star,
} from "lucide-react";
import AIExplainer from "./AIExplainer";
import BookmarkButton from "./BookmarkButton";

export default function IssueDetails({
  issue,
  onBack,
  onGuide,
  saved,
  onToggleBookmark,
  autoExplain = false,
}) {
  if (!issue) return null;

  const labels = issue.labels || [];
  const date = issue.created_at
    ? new Date(issue.created_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Not provided by sample data";

  return (
    <main className="details-page page-container">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to issues</button>
      <div className="details-layout">
        <article className="details-main">
          <div className="details-repository"><GitBranch size={16} />{issue.repository}</div>
          <h1>{issue.title}</h1>
          <div className="details-badges">
            <span className={`difficulty-badge ${issue.difficulty?.toLowerCase() || "intermediate"}`}>{issue.difficulty || "Unrated"}</span>
            {issue.good_first_issue && <span className="issue-flag beginner-flag">Good first issue</span>}
            {issue.help_wanted && <span className="issue-flag help-flag">Help wanted</span>}
            {issue.source === "sample" && <span className="sample-pill">Sample data</span>}
          </div>

          <section className="details-section">
            <h2>Issue description</h2>
            <p className="issue-full-description">{issue.description || "No description was provided."}</p>
          </section>

          <section className="details-section">
            <h2>Repository and labels</h2>
            <div className="detail-facts">
              <span><strong>Owner</strong>{issue.owner || issue.repository?.split("/")[0] || "Unknown"}</span>
              <span><strong>Language</strong>{issue.language || "Unknown"}</span>
              <span><strong>Created</strong><span><CalendarDays size={14} /> {date}</span></span>
              {issue.stars != null && <span><strong>Repository stars</strong><span><Star size={14} /> {Number(issue.stars).toLocaleString()}</span></span>}
            </div>
            <div className="issue-labels detail-labels">
              {labels.length ? labels.map((label) => <span className="issue-label" key={label}>{label}</span>) : <span className="muted-copy">No labels provided.</span>}
            </div>
          </section>

          <section className="details-section">
            <h2>Before you start</h2>
            <ul className="requirements-list">
              <li><CheckCircle2 size={16} /> Read the issue and repository contribution guidelines before coding.</li>
              <li><CheckCircle2 size={16} /> Confirm the issue is still open and ask whether it needs to be assigned.</li>
              <li><CheckCircle2 size={16} /> Check the project’s tests and run the relevant checks before opening a PR.</li>
            </ul>
          </section>
          <AIExplainer issue={issue} autoStart={autoExplain} />
        </article>

        <aside className="details-sidebar">
          <div className="sidebar-card">
            <h3>Take the next step</h3>
            <p>Save this opportunity or open the original issue to read maintainer updates.</p>
            <BookmarkButton saved={saved} onClick={onToggleBookmark} />
            {issue.url ? (
              <a className="github-issue-button" href={issue.url} target="_blank" rel="noreferrer">
                View issue on GitHub <ExternalLink size={15} />
              </a>
            ) : (
              <p className="link-unavailable">This sample issue does not have a real GitHub issue link.</p>
            )}
            {issue.repo_url && (
              <a className="repo-link" href={issue.repo_url} target="_blank" rel="noreferrer">
                View repository <ArrowUpRight size={14} />
              </a>
            )}
          </div>
          <div className="sidebar-card guide-callout">
            <span className="feature-icon purple"><CheckCircle2 size={20} /></span>
            <h3>New to contributing?</h3>
            <p>Follow the step-by-step guide from forking through your first pull request.</p>
            <button className="text-button" onClick={onGuide}>Open contribution guide <ArrowUpRight size={14} /></button>
          </div>
        </aside>
      </div>
    </main>
  );
}
