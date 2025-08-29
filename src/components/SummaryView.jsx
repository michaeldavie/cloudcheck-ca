import ProviderCard from "./ProviderCard.jsx";

export default function SummaryView({ providers, onOpen, query, setQuery, omniboxOpen }) {
  const q = (query || "").trim().toLowerCase();

  // Compute per-provider match info: name match or any service name match
  const enriched = (providers || []).map(p => {
    const nameMatch =
      q &&
      ((p.name || "").toLowerCase().includes(q) ||
        (p.provider || "").toLowerCase().includes(q));

    let serviceMatchCount = 0;
    if (q && p.servicesInScope) {
      for (const svc of Object.keys(p.servicesInScope)) {
        if (svc.toLowerCase().includes(q)) serviceMatchCount++;
      }
    }
    const hasAnyMatch = q ? nameMatch || serviceMatchCount > 0 : true;
    return { p, nameMatch, serviceMatchCount, hasAnyMatch };
  });

  // Filter providers that have any match when there is a query
  const filtered = q ? enriched.filter(x => x.hasAnyMatch).map(x => x) : enriched;

  const csp = filtered.filter(x => x.p.type === "CSP");
  const saas = filtered.filter(x => x.p.type === "SaaS");

  // Only show the global empty state when dropdown is closed
  if (q && csp.length === 0 && saas.length === 0 && !omniboxOpen) {
    return (
      <div className="empty-state">
        <div className="empty-title">No results for “{query}”</div>
        <div className="empty-sub">
          Try a broader term or check spelling. You can also browse all providers.
        </div>
        <div className="empty-actions">
          <button className="btn" onClick={() => setQuery?.("")}>Clear search</button>
        </div>
      </div>
    );
  }

  return (
    <div id="servicesList">
      {/* CSPs */}
      <section className="provider-category">
        <h2>Cloud Service Providers (CSPs)</h2>
        <div className="section-rule" />
        {csp.length ? (
          <div className="services-grid">
            {csp.map(({ p, serviceMatchCount }) => (
              <ProviderCard
                key={p.name}
                provider={p}
                onOpen={onOpen}
                matchCount={q ? serviceMatchCount : 0}
              />
            ))}
          </div>
        ) : (
          !omniboxOpen && <div className="empty-section">{q ? "No CSPs match your search." : "No CSPs available."}</div>
        )}
      </section>

      {/* SaaS */}
      <section className="provider-category">
        <h2>Software as a Service (SaaS) Providers</h2>
        <div className="section-rule" />
        {saas.length ? (
          <div className="services-grid">
            {saas.map(({ p, serviceMatchCount }) => (
              <ProviderCard
                key={p.name}
                provider={p}
                onOpen={onOpen}
                matchCount={q ? serviceMatchCount : 0}
              />
            ))}
          </div>
        ) : (
          !omniboxOpen && <div className="empty-section">{q ? "No SaaS providers match your search." : "No SaaS providers available."}</div>
        )}
      </section>
    </div>
  );
}