import { Bookmark } from "lucide-react";

export default function BookmarkButton({ saved, onClick, label = true }) {
  return (
    <button
      type="button"
      className={`bookmark-button ${saved ? "saved" : ""}`}
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark issue"}
    >
      <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
      {label && <span>{saved ? "Bookmarked" : "Bookmark"}</span>}
    </button>
  );
}
