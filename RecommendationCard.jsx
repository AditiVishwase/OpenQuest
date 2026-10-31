import { ArrowUpRight, Code2, Sparkles } from "lucide-react";

export default function RecommendationCard({ issue, onSelect }) {
  return (
    <button className="recommendation-card" onClick={() => onSelect(issue)}>
      <span className="recommendation-icon"><Sparkles size={16} /></span>
      <span className="recommendation-copy">
        <small><Code2 size={12} /> {issue.repository} · {issue.language}</small>
        <strong>{issue.title}</strong>
        <span>{issue.description}</span>
      </span>
      <ArrowUpRight size={16} />
    </button>
  );
}
