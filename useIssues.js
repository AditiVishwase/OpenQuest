import { useEffect, useState } from "react";
import { fetchIssues } from "../services/api";

export default function useIssues(query, page, reload = 0, filters = {}) {
  const {
    language = "",
    labels = "",
    repository = "",
    topic = "",
  } = filters;
  const [result, setResult] = useState({
    items: [],
    total_count: 0,
    has_more: false,
    source: "github",
    notice: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const nextResult = await fetchIssues(
          { q: query, page, language, labels, repository, topic },
          controller.signal,
        );
        setResult(nextResult);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message || "Issues could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 300 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, page, reload, language, labels, repository, topic]);

  return { ...result, loading, error };
}
