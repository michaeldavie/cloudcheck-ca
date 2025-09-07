// src/search.worker.js
import Fuse from "fuse.js";

let fuseP = null;
let fuseS = null;

function buildIndexes(providers) {
  // Build provider and service lists that Fuse will index
  const providerList = [];
  const serviceList = [];

  for (const p of providers || []) {
    if (!p || !p.name) continue;

    providerList.push({
      name: p.name,
      type: p.type || "",
      underlyingCSP: (p.underlyingCSP || []).join(", "),
      _ref: p, // keep original object to send back
    });

    const sis = p.servicesInScope || {};
    for (const title of Object.keys(sis)) {
      serviceList.push({
        title,
        providerName: p.name,
        providerType: p.type || "",
        _providerRef: p,
      });
    }
  }

  fuseP = new Fuse(providerList, {
    includeScore: true,
    threshold: 0.15,
    ignoreLocation: true,
    keys: [
      { name: "name", weight: 0.9 },
      { name: "type", weight: 0.2 },
      { name: "underlyingCSP", weight: 0.2 },
    ],
  });

  fuseS = new Fuse(serviceList, {
    includeScore: true,
    threshold: 0.15,
    ignoreLocation: true,
    keys: [
      { name: "title", weight: 0.9 },
      { name: "providerName", weight: 0.3 },
    ],
  });
}

function search(query) {
  if (!fuseP || !fuseS || !query) {
    return { providerResults: [], serviceResults: [] };
  }

  const pHits = fuseP.search(query).slice(0, 8);
  const sHits = fuseS.search(query).slice(0, 24);

  // Count matching services per provider
  const countByProv = new Map();
  for (const { item } of sHits) {
    const k = item.providerName;
    countByProv.set(k, (countByProv.get(k) || 0) + 1);
  }

  // Direct provider matches
  const direct = new Map(
    pHits.map(({ item, score }) => [
      item.name,
      { item, score, reason: "name", count: countByProv.get(item.name) || 0 },
    ])
  );

  // Promote providers with matching services even if name did not match
  const promoted = [];
  for (const [provName, c] of countByProv.entries()) {
    if (!direct.has(provName)) {
      const item = fuseP._docs.find(d => d.name === provName);
      if (item) promoted.push({ item, score: 0.6, reason: "services", count: c });
    }
  }

  const providerResults = [
    ...Array.from(direct.values()).map(x => ({
      kind: "provider",
      title: x.item.name,
      provider: x.item._ref,
      score: x.score,
      reason: x.reason,
      serviceCount: x.count || 0,
      subtitle:
        x.reason === "name"
          ? "Provider"
          : `Provider • ${x.count} matching ${x.count === 1 ? "service" : "services"}`,
    })),
    ...promoted.map(x => ({
      kind: "provider",
      title: x.item.name,
      provider: x.item._ref,
      score: x.score,
      reason: "services",
      serviceCount: x.count,
      subtitle: `Provider • ${x.count} matching ${x.count === 1 ? "service" : "services"}`,
    })),
  ]
    .sort((a, b) => a.score - b.score || b.serviceCount - a.serviceCount || a.title.localeCompare(b.title))
    .slice(0, 8);

  const serviceResults = sHits
    .map(({ item, score }) => ({
      kind: "service",
      title: item.title,
      subtitle: item.providerName,
      provider: item._providerRef,
      score,
    }))
    .sort((a, b) => a.score - b.score || a.title.localeCompare(b.title))
    .slice(0, 16);

  return { providerResults, serviceResults };
}

self.onmessage = e => {
  const { type } = e.data || {};
  if (type === "build") {
    buildIndexes(e.data.providers || []);
    self.postMessage({ type: "ready" });
    return;
  }
  if (type === "search") {
    const q = (e.data.query || "").trim();
    const results = q ? search(q) : { providerResults: [], serviceResults: [] };
    self.postMessage({ type: "results", ...results, q });
  }
};