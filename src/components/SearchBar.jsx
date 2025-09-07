// src/components/SearchBar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import WorkerURL from "../search.worker.js?worker";

const norm = (s = "") => s.toLowerCase().trim();
const MIN_CHARS = 2;

export default function SearchBar({ providers, query, setQuery, onOpen, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [backdropTop, setBackdropTop] = useState(0);
  const [providerResults, setProviderResults] = useState([]);
  const [serviceResults, setServiceResults] = useState([]);
  const wrapRef = useRef(null);
  const workerRef = useRef(null);
  const q = norm(query);
  const longEnough = q.length >= MIN_CHARS;

  // Start worker once
  useEffect(() => {
    const w = new WorkerURL();
    workerRef.current = w;

    w.onmessage = evt => {
      const { type } = evt.data || {};
      if (type === "ready") {
        // indexes built
      } else if (type === "results") {
        setProviderResults(evt.data.providerResults || []);
        setServiceResults(evt.data.serviceResults || []);
      }
    };

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // Build indexes in worker whenever providers change
  useEffect(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: "build", providers });
  }, [providers]);

  // Let parent know about dropdown visibility
  useEffect(() => { onOpenChange?.(open && longEnough); }, [open, longEnough, onOpenChange]);

  // Close if query becomes too short
  useEffect(() => { if (!longEnough) setOpen(false); }, [longEnough]);

  // Measure hero bottom so blur starts below it
  useEffect(() => {
    function measure() {
      const hero = document.querySelector(".hero");
      setBackdropTop(hero ? hero.getBoundingClientRect().bottom + window.scrollY : 0);
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, []);

  // Send searches to worker (debounced a bit)
  useEffect(() => {
    if (!workerRef.current) return;
    if (!longEnough) {
      setProviderResults([]);
      setServiceResults([]);
      return;
    }
    const id = setTimeout(() => {
      workerRef.current.postMessage({ type: "search", query });
    }, 80);
    return () => clearTimeout(id);
  }, [query, longEnough]);

  // Outside click closes
  useEffect(() => {
    function onDoc(e) {
      if (!wrapRef.current || wrapRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const anyResults = providerResults.length + serviceResults.length > 0;

  function onKeyDown(e) {
    const items = [...providerResults, ...serviceResults];
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(longEnough);
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min(a + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function choose(item) {
    if (item.kind === "provider") {
      onOpen(item.provider);
      setQuery("");
    } else {
      onOpen(item.provider);
      setQuery(item.title);
    }
    setOpen(false);
  }

  const providerCount = providers?.length || 0;

  return (
    <>
      {open && longEnough && (
        <div
          className="search-backdrop"
          style={{ top: `${backdropTop}px` }}
          onClick={() => setOpen(false)}
        />
      )}

      <div className="omnibox-wrap" ref={wrapRef}>
        <input
          id="searchInput"
          placeholder={`Search ${providerCount} providers and their services`}
          value={query}
          onChange={e => {
            const v = e.target.value;
            setQuery(v);
            setActive(0);
            setOpen(norm(v).length >= MIN_CHARS);
          }}
          onFocus={() => setOpen(longEnough)}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        {query && (
          <button
            className="clear-btn"
            aria-label="Clear search"
            onClick={() => { setQuery(""); setOpen(false); }}
            type="button"
          >
            ×
          </button>
        )}

        {open && longEnough && (
          <div className="omnibox-panel" role="listbox">
            {anyResults ? (
              <>
                {providerResults.length > 0 && <div className="omnibox-group">Providers</div>}
                {providerResults.map((r, i) => (
                  <div
                    key={`p-${r.title}`}
                    className={"omnibox-item " + (active === i ? "is-active" : "")}
                    onMouseDown={() => choose(r)}
                  >
                    <span className="item-title">{r.title}</span>
                    <span className="item-sub">
                      {r.subtitle}
                      {r.serviceCount ? <span className="count-badge">{r.serviceCount}</span> : null}
                    </span>
                  </div>
                ))}

                {serviceResults.length > 0 && <div className="omnibox-group">Services</div>}
                {serviceResults.map((r, i) => {
                  const idx = providerResults.length + i;
                  return (
                    <div
                      key={`s-${r.title}-${r.subtitle}`}
                      className={"omnibox-item " + (active === idx ? "is-active" : "")}
                      onMouseDown={() => choose(r)}
                    >
                      <span className="item-title">{r.title}</span>
                      <span className="item-sub">{r.subtitle}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="omnibox-empty">
                <div className="empty-title">No matches for “{query}”</div>
                <div className="empty-sub">Try another term or clear your search.</div>
                <button className="btn" onMouseDown={() => { setQuery(""); setOpen(false); }}>
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}