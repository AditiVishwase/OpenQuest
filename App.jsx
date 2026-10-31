import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Code2,
  GitPullRequest,
  Heart,
  Search,
  Sparkles,
} from "lucide-react";
import Navbar from "./components/Navbar";
import IssueCard from "./components/Issuecard";
import FilterBar from "./components/FilterBar";
import IssueDetails from "./components/IssueDetails";
import LoadingSpinner from "./components/LoadingSpinner";
import EmptyState from "./components/EmptyState";
import RecommendationCard from "./components/RecommendationCard";
import useBookmarks from "./hooks/useBookmarks";
import useIssues from "./hooks/useIssues";
import { fetchIssue, fetchRecommendations } from "./services/api";
import ContributionGuide from "./pages/ContributionGuide";
import About from "./pages/About";
import sampleIssues from "./data/issues.json";
import "./App.css";

const EMPTY_FILTERS = {
  search: "",
  language: "All",
  difficulty: "All",
  topic: "All",
  repository: "All",
  goodFirst: false,
  helpWanted: false,
  sort: "recent",
};
const INITIAL_FILTERS = { ...EMPTY_FILTERS, goodFirst: true };

function readTheme() {
  try {
    return localStorage.getItem("openquest-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function asSampleIssue(issue) {
  const labels = issue.labels || [];
  return {
    ...issue,
    id: String(issue.id),
    topics: issue.topics || issue.skills || [],
    stars: null,
    url: issue.url === "https://github.com" ? "" : issue.url || "",
    repo_url: "",
    created_at: null,
    good_first_issue: labels.some((label) => label.toLowerCase().includes("good first issue")),
    help_wanted: labels.some((label) => label.toLowerCase().includes("help wanted")),
    source: "sample",
  };
}

function rankSampleRecommendations(preferences) {
  const languages = new Set(preferences.languages.map((value) => value.toLowerCase()));
  const topics = new Set(preferences.topics.map((value) => value.toLowerCase()));
  return sampleIssues
    .map(asSampleIssue)
    .map((issue) => {
      let score = languages.has(issue.language.toLowerCase()) ? 3 : 0;
      const tags = [...issue.labels, ...issue.topics].map((value) => value.toLowerCase());
      score += [...topics].filter((topic) => tags.some((tag) => tag.includes(topic))).length * 2;
      if (preferences.preferred_difficulty !== "All" &&
        issue.difficulty.toLowerCase() === preferences.preferred_difficulty.toLowerCase()) score += 3;
      const experienceDifficulty = {
        beginner: "beginner",
        intermediate: "intermediate",
        experienced: "advanced",
      }[preferences.experience];
      if (preferences.preferred_difficulty === "All" &&
        issue.difficulty.toLowerCase() === experienceDifficulty) score += 1;
      if (preferences.experience === "beginner" && issue.good_first_issue) score += 1;
      return { issue, score };
    })
    .sort((a, b) => b.score - a.score || a.issue.title.localeCompare(b.issue.title))
    .filter(({ score }) => score > 0)
    .slice(0, 3)
    .map(({ issue }) => issue);
}

function App() {
  const [activePage, setActivePage] = useState("home");
  const [returnPage, setReturnPage] = useState("explore");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [detailNotice, setDetailNotice] = useState("");
  const [autoExplain, setAutoExplain] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState({
    languages: [],
    topics: [],
    experience: "beginner",
    preferred_difficulty: "All",
  });
  const detailRequestId = useRef(0);
  const { bookmarks, toggleBookmark } = useBookmarks();
  const issueQueryFilters = useMemo(() => ({
    language: filters.language === "All" ? "" : filters.language,
    topic: filters.topic === "All" ? "" : filters.topic,
    repository: filters.repository === "All" ? "" : filters.repository,
    labels: [
      filters.goodFirst ? "good first issue" : "",
      filters.helpWanted ? "help wanted" : "",
    ].filter(Boolean).join(","),
  }), [
    filters.goodFirst,
    filters.helpWanted,
    filters.language,
    filters.repository,
    filters.topic,
  ]);
  const {
    items,
    total_count: totalCount,
    has_more: hasMore,
    source,
    notice,
    loading,
    error,
  } = useIssues(filters.search, page, reload, issueQueryFilters);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("openquest-theme", theme);
    } catch {
      // Theme still works for the current page if browser storage is disabled.
    }
  }, [theme]);

  const filterOptions = useMemo(() => {
    const allIssues = [
      ...items,
      ...bookmarks,
      ...(source === "sample" ? sampleIssues.map(asSampleIssue) : []),
    ];
    return {
      languages: [...new Set(allIssues.map((issue) => issue.language).filter((value) => value && value !== "Unknown"))].sort(),
      topics: [...new Set(allIssues.flatMap((issue) => [...(issue.labels || []), ...(issue.topics || issue.skills || [])]))].sort(),
      repositories: [...new Set(allIssues.map((issue) => issue.repository).filter(Boolean))].sort(),
    };
  }, [items, bookmarks, source]);

  const recommendationOptions = useMemo(() => {
    const allIssues = [...items, ...sampleIssues.map(asSampleIssue)];
    return {
      languages: [...new Set(allIssues.map((issue) => issue.language).filter((value) => value && value !== "Unknown"))].sort(),
      topics: [...new Set(allIssues.flatMap((issue) => [...(issue.labels || []), ...(issue.topics || issue.skills || [])]))].sort(),
    };
  }, [items]);

  const visibleIssues = useMemo(() => {
    const base = activePage === "bookmarks" ? bookmarks : items;
    const query = filters.search.trim().toLowerCase();
    const matches = base.filter((issue) => {
      const searchable = [
        issue.title,
        issue.repository,
        issue.description,
        issue.language,
        ...(issue.labels || []),
        ...(issue.topics || issue.skills || []),
      ].join(" ").toLowerCase();
      const labels = (issue.labels || []).map((label) => label.toLowerCase());
      const topics = (issue.topics || issue.skills || []).map((topic) => topic.toLowerCase());
      return (
        (!query || searchable.includes(query)) &&
        (filters.language === "All" || issue.language === filters.language) &&
        (filters.difficulty === "All" || issue.difficulty === filters.difficulty) &&
        (filters.topic === "All" || [...labels, ...topics].some((value) => value.includes(filters.topic.toLowerCase()))) &&
        (filters.repository === "All" || issue.repository === filters.repository) &&
        (!filters.goodFirst || issue.good_first_issue || labels.some((label) => label.includes("good first issue"))) &&
        (!filters.helpWanted || issue.help_wanted || labels.some((label) => label.includes("help wanted")))
      );
    });

    return matches.sort((a, b) => {
      if (filters.sort === "stars") return (b.stars || -1) - (a.stars || -1);
      if (filters.sort === "beginner") {
        const beginnerRank = (issue) => issue.good_first_issue ? 0 : issue.difficulty === "Beginner" ? 1 : 2;
        return beginnerRank(a) - beginnerRank(b);
      }
      return (Date.parse(b.created_at || "") || 0) - (Date.parse(a.created_at || "") || 0);
    });
  }, [activePage, bookmarks, filters, items]);

  const stats = useMemo(() => ({
    issueCount: totalCount,
    beginnerCount: items.filter((issue) => issue.good_first_issue).length,
    projectCount: new Set(items.map((issue) => issue.repository)).size,
    languageCount: new Set(items.map((issue) => issue.language).filter((language) => language && language !== "Unknown")).size,
  }), [items, totalCount]);

  useEffect(() => {
    let active = true;
    fetchRecommendations(preferences)
      .then((result) => {
        if (active) setRecommendations(result.items.map((issue) => ({ ...issue, id: String(issue.id) })));
      })
      .catch(() => {
        if (active) setRecommendations(rankSampleRecommendations(preferences));
      });
    return () => { active = false; };
  }, [preferences]);

  function navigate(nextPage) {
    detailRequestId.current += 1;
    setSelectedIssue(null);
    setActivePage(nextPage);
    if (nextPage === "bookmarks") setFilters(EMPTY_FILTERS);
    if (nextPage === "explore" || nextPage === "bookmarks") setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function viewIssue(issue, askAI = false) {
    detailRequestId.current += 1;
    const requestId = detailRequestId.current;
    setReturnPage(activePage === "details" ? "explore" : activePage);
    setSelectedIssue(issue);
    setDetailNotice("");
    setAutoExplain(askAI);
    setActivePage("details");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const details = await fetchIssue(issue.id);
      if (detailRequestId.current === requestId) {
        setSelectedIssue((current) => current ? { ...current, ...details } : details);
      }
    } catch (requestError) {
      if (detailRequestId.current === requestId) {
        setDetailNotice(`Showing available search-result details. ${requestError.message}`);
      }
    }
  }

  function updateFilters(nextFilters) {
    setFilters(nextFilters);
    if (nextFilters !== filters) setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function updatePreferenceList(key, value) {
    setPreferences((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  function renderDiscovery(title, subtitle, isHome = false) {
    const isBookmarks = activePage === "bookmarks";
    const issuesForCards = isHome ? visibleIssues.slice(0, 6) : visibleIssues;
    return (
      <section className={`explore-section page-container ${isHome ? "home-discovery" : ""}`} id="explore">
        <div className="section-heading explore-heading">
          <div>
            <span className="eyebrow">{isBookmarks ? "YOUR COLLECTION" : isHome ? "FIND YOUR NEXT STEP" : "OPEN ISSUES"}</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <div className="issue-count"><Search size={15} />{isBookmarks ? visibleIssues.length : `${visibleIssues.length} shown · ${totalCount} found`}</div>
        </div>
        <FilterBar filters={filters} onChange={updateFilters} options={filterOptions} onClear={clearFilters} />
        {notice && activePage !== "bookmarks" && <div className="data-notice" role="status">{notice}</div>}
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
        {loading && issuesForCards.length === 0 && activePage !== "bookmarks" ? (
          <LoadingSpinner label={filters.search ? "Searching GitHub issues…" : "Finding open-source issues…"} />
        ) : issuesForCards.length ? (
          <>
            <div className="issue-grid">
              {issuesForCards.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isSaved={bookmarks.some((saved) => saved.id === issue.id)}
                  onToggleSave={toggleBookmark}
                  onViewDetails={viewIssue}
                />
              ))}
            </div>
            {isHome && !isBookmarks && (
              <div className="view-all"><button className="secondary-button" onClick={() => navigate("explore")}>Explore all issues <ArrowRight size={16} /></button></div>
            )}
            {activePage === "explore" && (
              <div className="pagination">
                <button className="secondary-button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button>
                <span>Page {page}</span>
                <button className="secondary-button" disabled={!hasMore || loading} onClick={() => setPage((value) => value + 1)}>Next</button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title={isBookmarks ? "No saved issues yet" : "No issues match those filters"}
            message={isBookmarks ? "Bookmark an issue to keep it close. Your saved issues stay in this browser." : "Try another search or clear some filters to find more opportunities."}
            action={isBookmarks ? <button className="primary-button" onClick={() => navigate("explore")}>Explore issues <ArrowRight size={15} /></button> : <button className="primary-button" onClick={clearFilters}>Clear all filters</button>}
          />
        )}
      </section>
    );
  }

  return (
    <div className="app">
      <Navbar
        activePage={activePage}
        onNavigate={navigate}
        savedCount={bookmarks.length}
        theme={theme}
        onToggleTheme={() => setTheme((value) => value === "dark" ? "light" : "dark")}
      />

      {activePage === "details" && selectedIssue && (
        <>
          {detailNotice && <div className="data-notice page-container detail-notice" role="status">{detailNotice}</div>}
          <IssueDetails
            issue={selectedIssue}
            saved={bookmarks.some((saved) => saved.id === selectedIssue.id)}
            onToggleBookmark={() => toggleBookmark(selectedIssue)}
            onBack={() => navigate(returnPage)}
            onGuide={() => navigate("guide")}
            autoExplain={autoExplain}
          />
        </>
      )}

      {activePage === "guide" && <ContributionGuide />}
      {activePage === "about" && <About />}
      {activePage === "bookmarks" && renderDiscovery("Your bookmarked issues", "Your saved opportunities, ready when you are. Search and filter your collection.")}
      {activePage === "explore" && renderDiscovery("Explore open-source issues", "Search open GitHub issues and narrow the results down to a good next step.")}

      {activePage === "home" && (
        <>
          <main>
            <section className="hero">
              <div className="hero-glow" />
              <div className="hero-layout page-container">
                <div className="hero-content">
                  <div className="hero-badge"><Sparkles size={14} /> YOUR OPEN SOURCE JOURNEY STARTS HERE</div>
                  <h1>Find your first issue.<br /><span>Make your first impact.</span></h1>
                  <p>Discover beginner-friendly open-source issues and start contributing to projects that matter.</p>
                  <form className="hero-search" onSubmit={(event) => { event.preventDefault(); navigate("explore"); }}>
                    <Search size={18} />
                    <input
                      aria-label="Search open-source issues"
                      placeholder="Search issues, repositories, or skills..."
                      value={filters.search}
                      onChange={(event) => updateFilters({ ...filters, search: event.target.value })}
                    />
                    <button type="submit">Explore issues <ArrowRight size={16} /></button>
                  </form>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => navigate("explore")}>Explore issues <ArrowRight size={16} /></button>
                    <button className="secondary-button" onClick={() => navigate("guide")}><BookOpen size={16} /> View contribution guide</button>
                  </div>
                </div>
                <div className="hero-art" aria-label="Illustration of an open-source issue ready to explore">
                  <div className="orbit orbit-one" /><div className="orbit orbit-two" />
                  <div className="quest-window">
                    <div className="window-top"><span /><span /><span /><small>openquest / explore</small></div>
                    <div className="window-body">
                      <div className="window-label"><span className="green-dot" /> GOOD FIRST ISSUE <span>START HERE</span></div>
                      <h3>Make your first contribution</h3>
                      <p>One small fix can help a project grow.</p>
                      <div className="window-tags"><i>beginner</i><i>documentation</i></div>
                      <div className="window-footer"><span><Code2 size={13} /> Open source</span><span className="window-arrow"><ArrowUpRight size={16} /></span></div>
                    </div>
                  </div>
                  <div className="floating-spark"><Sparkles size={17} /></div>
                  <div className="floating-code"><Code2 size={18} /></div>
                </div>
              </div>
              <div className="hero-stats page-container">
                <div><strong>{stats.issueCount.toLocaleString()}</strong><span>Open issues found</span></div>
                <div><strong>{stats.beginnerCount}</strong><span>Beginner-friendly issues</span></div>
                <div><strong>{stats.projectCount}</strong><span>Open-source projects</span></div>
                <div><strong>{stats.languageCount}</strong><span>Languages represented</span></div>
              </div>
              {source === "sample" && <p className="stats-note">Counts reflect the included sample dataset while GitHub is unavailable.</p>}
            </section>

            <section className="features-section page-container">
              <div className="section-heading">
                <span className="eyebrow">MADE FOR YOUR FIRST CONTRIBUTION</span>
                <h2>Your open-source journey, simplified.</h2>
                <p>Find an issue, understand the work, and take your next step with confidence.</p>
              </div>
              <div className="features-grid">
                <article className="feature-card"><span className="feature-icon purple"><Search size={20} /></span><h3>Find a good fit</h3><p>Search real open issues and filter by language, difficulty, topic, or repository.</p></article>
                <article className="feature-card"><span className="feature-icon blue"><Sparkles size={20} /></span><h3>Learn with local AI</h3><p>Ask your Gemma model to unpack the issue in beginner-friendly language.</p></article>
                <article className="feature-card"><span className="feature-icon green"><GitPullRequest size={20} /></span><h3>Make your first PR</h3><p>Follow a practical checklist and keep your contribution progress saved.</p></article>
              </div>
            </section>

            <section className="recommendations-section page-container">
              <div className="section-heading">
                <span className="eyebrow">A PLACE TO START</span>
                <h2>Personalize your issue picks</h2>
                <p>Choose the skills and topics you care about. Suggestions are ranked from the included issue data.</p>
              </div>
              <div className="recommendation-layout">
                <div className="preference-panel">
                  <fieldset>
                    <legend>Languages you know</legend>
                    <div className="choice-list">
                      {recommendationOptions.languages.slice(0, 8).map((language) => (
                        <label className="choice-chip" key={language}>
                          <input type="checkbox" checked={preferences.languages.includes(language)} onChange={() => updatePreferenceList("languages", language)} />
                          {language}
                        </label>
                      ))}
                      {!recommendationOptions.languages.length && <span className="muted-copy">Languages appear as issues load.</span>}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend>Topics you like</legend>
                    <div className="choice-list">
                      {recommendationOptions.topics.slice(0, 10).map((topic) => (
                        <label className="choice-chip" key={topic}>
                          <input type="checkbox" checked={preferences.topics.includes(topic)} onChange={() => updatePreferenceList("topics", topic)} />
                          {topic}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="preference-select">Experience level
                    <select value={preferences.experience} onChange={(event) => setPreferences((current) => ({ ...current, experience: event.target.value }))}>
                      <option value="beginner">Just getting started</option>
                      <option value="intermediate">Some experience</option>
                      <option value="experienced">Experienced</option>
                    </select>
                  </label>
                  <label className="preference-select">Preferred difficulty
                    <select value={preferences.preferred_difficulty} onChange={(event) => setPreferences((current) => ({ ...current, preferred_difficulty: event.target.value }))}>
                      <option value="All">Any difficulty</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </label>
                </div>
                <div className="recommendation-results">
                  {recommendations.length ? recommendations.map((issue) => (
                    <RecommendationCard issue={issue} key={issue.id} onSelect={(selected) => viewIssue(selected)} />
                  )) : <EmptyState title="No close matches yet" message="Try selecting another language or topic to broaden your recommendations." />}
                </div>
              </div>
              <p className="recommendation-disclaimer">Recommendations are rule-based and use the local starter dataset; they are not AI-generated.</p>
            </section>
          </main>
          {renderDiscovery("Find an issue worth fixing", "Browse opportunities, compare requirements, and save the ones you want to explore.", true)}
          <section className="cta-section page-container">
            <span className="cta-icon"><Heart size={20} /></span>
            <h2>Ready to make your first contribution?</h2>
            <p>Take it one step at a time. Your first pull request starts with a good question.</p>
            <button className="primary-button" onClick={() => navigate("guide")}>Start with the guide <ArrowRight size={16} /></button>
          </section>
        </>
      )}

      <footer className="site-footer page-container">
        <button className="brand footer-brand" onClick={() => navigate("home")}><span className="brand-icon"><Code2 size={18} /></span>OpenQuest</button>
        <span>Built for your first open-source contribution.</span>
        <button className="footer-link" onClick={() => navigate("about")}>About the project <ArrowUpRight size={14} /></button>
      </footer>
    </div>
  );
}

export default App;
