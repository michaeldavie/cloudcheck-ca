import { useEffect, useMemo } from "react";

export default function DetailView({ provider, query, onBack }) {
  const q = (query || "").trim().toLowerCase();

  const rows = useMemo(() => {
    const all = Object.entries(provider?.servicesInScope || {});
    all.sort(([a], [b]) => a.localeCompare(b));
    return q ? all.filter(([name]) => name.toLowerCase().includes(q)) : all;
  }, [provider, q]);

  useEffect(() => {
    if (!q) return;
    const tbody = document.querySelector(".detail-table tbody");
    if (!tbody) return;
    const first = tbody.querySelector("tr");
    if (!first) return;
    first.classList.add("row-highlight");
    first.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(() => first.classList.remove("row-highlight"), 1200);
    return () => clearTimeout(t);
  }, [q, provider]);

  const totalCount = Object.keys(provider?.servicesInScope || {}).length;
  const filteredCount = rows.length;

  return (
    <div className="detail-view">
      <div className="detail-header">
        <button id="backButton" onClick={onBack}>Back</button>
        <h2 style={{ margin: 0 }}>{provider?.name || "Provider"}</h2>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7385" }}>
          Showing {filteredCount} of {totalCount}
        </span>
      </div>

      <table className="detail-table" aria-label={`${provider?.name} services`}>
        <thead>
          <tr>
            <th style={{ width: "70%" }}>Service</th>
            <th style={{ width: "15%" }}>Medium</th>
            <th style={{ width: "15%" }}>HVA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([service, levels]) => {
            const hasMedium = Array.isArray(levels) && levels.includes("Medium");
            const hasHVA = Array.isArray(levels) && levels.includes("HVA");
            return (
              <tr key={service}>
                <td>{service}</td>
                <td>{hasMedium ? "✅" : ""}</td>
                <td>{hasHVA ? "✅" : ""}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} style={{ color: "#6b7385" }}>
                No services match “{query}”.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {(provider?.references?.assessmentReport || provider?.references?.providerReference) && (
        <div className="references">
          <h3>References</h3>
          <ul>
            {provider.references.assessmentReport && (
              <li>
                <a href={provider.references.assessmentReport} target="_blank" rel="noreferrer">
                  Assessment Report
                </a>
              </li>
            )}
            {provider.references.providerReference && (
              <li>
                <a href={provider.references.providerReference} target="_blank" rel="noreferrer">
                  Provider Reference
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}