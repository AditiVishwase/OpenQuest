import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Brain,
  Check,
  Copy,
  RotateCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { explainIssue } from "../services/api";

function inlineMarkdown(text) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function MarkdownContent({ content }) {
  return (
    <div className="markdown-content">
      {content.split(/\r?\n/).map((line, index) => {
        const heading = line.match(/^#{1,3}\s+(.+)/);
        const listItem = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
        if (heading) return <h4 key={index}>{inlineMarkdown(heading[1])}</h4>;
        if (listItem) return <p className="markdown-list-item" key={index}>• {inlineMarkdown(listItem[1])}</p>;
        if (!line.trim()) return <div className="markdown-gap" key={index} />;
        return <p key={index}>{inlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

export default function AIExplainer({ issue, autoStart = false }) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const requestId = useRef(0);
  const autoStarted = useRef(false);

  const generateExplanation = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const result = await explainIssue(issue);
      if (requestId.current === currentRequest) setExplanation(result.explanation);
    } catch (requestError) {
      if (requestId.current === currentRequest) {
        setError(requestError.message || "Gemma could not explain this issue.");
      }
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [issue]);

  useEffect(() => {
    if (!autoStart || autoStarted.current) return undefined;
    const timer = window.setTimeout(() => {
      autoStarted.current = true;
      void generateExplanation();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autoStart, issue.id, generateExplanation]);

  async function copyExplanation() {
    try {
      await navigator.clipboard.writeText(explanation);
      setCopied(true);
    } catch {
      setError("Clipboard access was blocked. Select and copy the explanation instead.");
    }
  }

  function clearExplanation() {
    requestId.current += 1;
    setExplanation("");
    setError("");
    setLoading(false);
  }

  return (
    <section className="ai-explainer">
      <div className="ai-header">
        <div className="ai-icon"><Brain size={20} /></div>
        <div>
          <h3>Understand it with Gemma</h3>
          <p>Private, local AI through your Ollama backend</p>
        </div>
        <span className="local-badge">LOCAL MODEL</span>
      </div>
      {!explanation && (
        <div className="ai-intro">
          <Sparkles size={16} />
          <p>Get a beginner-friendly breakdown grounded in this issue's title, description, labels, and language.</p>
        </div>
      )}
      <button className="ai-explain-button" onClick={generateExplanation} disabled={loading}>
        {loading ? <><span className="spinner-dot" /> Gemma is thinking…</> : <><Sparkles size={16} /> {error ? "Retry with Gemma" : "Explain with Gemma"}</>}
      </button>
      {loading && <p className="ai-loading-copy" role="status">Generating an explanation with your local model. This may take a little while.</p>}
      {error && (
        <div className="ai-error" role="alert">
          <AlertCircle size={17} />
          <span>{error}</span>
          <button onClick={generateExplanation} disabled={loading} aria-label="Retry explanation"><RotateCw size={15} /></button>
        </div>
      )}
      {explanation && (
        <div className="ai-result">
          <div className="ai-result-heading">
            <span><Sparkles size={16} /> Gemma's explanation</span>
            <div className="ai-result-actions">
              <button onClick={copyExplanation} title="Copy explanation" aria-label="Copy explanation">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
              <button onClick={clearExplanation} title="Clear explanation" aria-label="Clear explanation"><Trash2 size={15} /></button>
            </div>
          </div>
          <MarkdownContent content={explanation} />
        </div>
      )}
    </section>
  );
}
