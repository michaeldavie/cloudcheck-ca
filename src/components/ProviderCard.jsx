export default function ProviderCard({ provider, onOpen, matchCount = 0 }) {
  const total = Object.keys(provider.servicesInScope || {}).length;
  const hva = Object.values(provider.servicesInScope || {}).filter(
    lvls => Array.isArray(lvls) && lvls.includes("HVA")
  ).length;

  return (
    <article
      className="summary-card"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(provider)}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onOpen(provider)}
    >
      <h3 className="card-title">{provider.name}</h3>

      {provider.underlyingCSP?.length > 0 && (
        <p className="under-csp">
          Underlying CSP: {provider.underlyingCSP.join(", ")}
        </p>
      )}

      {/* If the search term matched services, show a small note */}
      {matchCount > 0 && (
        <p className="match-note">
          {matchCount} matching {matchCount === 1 ? "service" : "services"}
        </p>
      )}

      <div className="stats-row">
        <div className="stat">
          <div className="stat-number">{total}</div>
          <div className="stat-label">Services<br />Assessed</div>
        </div>
        <div className="stat">
          <div className="stat-number">{hva}</div>
          <div className="stat-label">HVA<br />Services</div>
        </div>
      </div>

      <div className="card-divider" />
      <div className="card-link">Click to view details →</div>
    </article>
  );
}