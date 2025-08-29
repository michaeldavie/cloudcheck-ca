// src/App.jsx
import { useEffect, useState } from "react";
import SummaryView from "./components/SummaryView.jsx";
import DetailView from "./components/DetailView.jsx";
import SearchBar from "./components/SearchBar.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  const [providers, setProviders] = useState([]);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState("");
  const [omniboxOpen, setOmniboxOpen] = useState(false);

  // Load provider list and data files
  useEffect(() => {
    let alive = true;
    const BASE = import.meta.env.BASE_URL || "/";
    const url = (p) => `${BASE}data/${p}`;

    (async () => {
      try {
        const ids = await fetch(url("providers.json")).then((r) => r.json());
        const files = ids.map((id) => `${id}.json`);
        const loaded = await Promise.all(
          files.map((f) => fetch(url(f)).then((r) => r.json()))
        );
        if (alive) setProviders(loaded);
      } catch (e) {
        // optional: surface an error UI here
        console.error("Failed to load provider data", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* Full-bleed hero */}
      <header className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            <span className="brand-host">Cloud Check 🟥🍁🟥</span>
            <span className="brand-dot"></span>
            <span className="brand-tld"></span>
          </h1>
          <p className="hero-subtitle">
            Cloud Services Assessed by CCCS (Canadian Centre for Cyber Security)
          </p>

          <SearchBar
            providers={providers}
            query={query}
            setQuery={setQuery}
            onOpen={(p) => setActive(p)}
            onOpenChange={setOmniboxOpen}
          />
        </div>
      </header>

      <main className="container">
        {active ? (
          <DetailView
            provider={active}
            query={query}
            onBack={() => {
              setActive(null);
              setQuery("");
            }}
          />
        ) : (
          <SummaryView
            providers={providers}
            query={query}
            onOpen={setActive}
            setQuery={setQuery}
            omniboxOpen={omniboxOpen}
          />
        )}
      </main>

      <Footer />
    </>
  );
}