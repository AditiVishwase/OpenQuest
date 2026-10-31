import { useEffect, useState } from "react";

const STORAGE_KEY = "openquest-bookmarks";

function readBookmarks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export default function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(readBookmarks);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  function toggleBookmark(issue) {
    setBookmarks((current) =>
      current.some((item) => item.id === issue.id)
        ? current.filter((item) => item.id !== issue.id)
        : [issue, ...current],
    );
  }

  return { bookmarks, toggleBookmark };
}
