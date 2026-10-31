import { Search, SlidersHorizontal, X } from "lucide-react";

export default function FilterBar({ filters, onChange, options, onClear }) {
  const active = Boolean(
    filters.search ||
    filters.language !== "All" ||
    filters.difficulty !== "All" ||
    filters.topic !== "All" ||
    filters.repository !== "All" ||
    filters.goodFirst ||
    filters.helpWanted,
  );
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="filter-panel">
      <label className="search-input-wrapper">
        <Search size={18} />
        <span className="sr-only">Search issues</span>
        <input
          placeholder="Search title, repository, description, language, or topic..."
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
        />
        {filters.search && (
          <button
            type="button"
            className="icon-button"
            aria-label="Clear search"
            onClick={() => update("search", "")}
          >
            <X size={16} />
          </button>
        )}
      </label>

      <div className="filter-controls">
        <span className="filter-label">
          <SlidersHorizontal size={15} /> Filters
        </span>
        <select
          aria-label="Filter by language"
          value={filters.language}
          onChange={(event) => update("language", event.target.value)}
        >
          <option value="All">All languages</option>
          {options.languages.map((language) => (
            <option key={language} value={language}>{language}</option>
          ))}
        </select>
        <select
          aria-label="Filter by difficulty"
          value={filters.difficulty}
          onChange={(event) => update("difficulty", event.target.value)}
        >
          <option value="All">All difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <select
          aria-label="Filter by topic"
          value={filters.topic}
          onChange={(event) => update("topic", event.target.value)}
        >
          <option value="All">All topics</option>
          {options.topics.map((topic) => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
        <select
          aria-label="Filter by repository"
          value={filters.repository}
          onChange={(event) => update("repository", event.target.value)}
        >
          <option value="All">All repositories</option>
          {options.repositories.map((repository) => (
            <option key={repository} value={repository}>{repository}</option>
          ))}
        </select>
        <select
          aria-label="Sort issues"
          value={filters.sort}
          onChange={(event) => update("sort", event.target.value)}
        >
          <option value="recent">Most recent</option>
          <option value="stars">Most stars</option>
          <option value="beginner">Beginner-friendly first</option>
        </select>
        <label className="check-filter">
          <input
            type="checkbox"
            checked={filters.goodFirst}
            onChange={(event) => update("goodFirst", event.target.checked)}
          />
          Good first issue
        </label>
        <label className="check-filter">
          <input
            type="checkbox"
            checked={filters.helpWanted}
            onChange={(event) => update("helpWanted", event.target.checked)}
          />
          Help wanted
        </label>
        {active && (
          <button className="clear-filters" type="button" onClick={onClear}>
            <X size={14} /> Clear all
          </button>
        )}
      </div>
    </div>
  );
}
