import { useState } from "react";
import {
  Bookmark,
  BookOpen,
  Code2,
  Compass,
  GitBranch,
  Home,
  Info,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";

const links = [
  { id: "home", label: "Home", icon: Home },
  { id: "explore", label: "Explore Issues", icon: Compass },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "guide", label: "Contribution Guide", icon: BookOpen },
  { id: "about", label: "About", icon: Info },
];

export default function Navbar({
  activePage,
  onNavigate,
  savedCount,
  theme,
  onToggleTheme,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const githubUrl = import.meta.env.VITE_GITHUB_REPO_URL || "https://github.com";

  function navigate(page) {
    onNavigate(page);
    setMobileOpen(false);
  }

  return (
    <header className="navbar">
      <button className="brand" onClick={() => navigate("home")} aria-label="OpenQuest home">
        <span className="brand-icon"><Code2 size={21} /></span>
        <span>OpenQuest</span>
      </button>

      <nav className={`nav-links ${mobileOpen ? "mobile-open" : ""}`} aria-label="Main navigation">
        {links.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav-link ${activePage === id || (activePage === "details" && id === "explore") ? "active" : ""}`}
            onClick={() => navigate(id)}
          >
            <Icon size={16} />
            {label}
            {id === "bookmarks" && savedCount > 0 && (
              <span className="nav-count">{savedCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="nav-actions">
        <button className="nav-icon-button" onClick={() => navigate("explore")} aria-label="Search issues">
          <Search size={18} />
        </button>
        <button className="nav-icon-button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <a className="github-button" href={githubUrl} target="_blank" rel="noreferrer" aria-label="Open GitHub">
          <GitBranch size={17} />
          <span>GitHub</span>
        </a>
      </div>

      <button
        className="mobile-menu-button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={21} /> : <Menu size={21} />}
      </button>
    </header>
  );
}
