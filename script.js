let cloudServices = [];
let currentView = 'summary'; // 'summary' or 'detail'
let selectedService = null;

// Provider data comes from contributed JSON files, so treat every value as untrusted text
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Only allow absolute https links; anything else (javascript:, data:, relative) is dropped
function safeUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
}

async function loadProviderData() {
    try {
        const cacheBuster = `?v=${Date.now()}`;
        const response = await fetch(`./data/providers.json${cacheBuster}`);
        const providerFiles = await response.json();

        const promises = providerFiles.map(async (file) => {
            const providerResponse = await fetch(`./data/${encodeURIComponent(file)}.json${cacheBuster}`);
            return await providerResponse.json();
        });

        cloudServices = await Promise.all(promises);
        console.log('Loaded cloud services:', cloudServices);
        renderSummaryView();
    } catch (error) {
        console.error('Error loading provider data:', error);
    }
}

function renderSummaryView() {
    currentView = 'summary';
    const backButton = document.getElementById('backButton');
    const searchInput = document.getElementById('searchInput');

    backButton.hidden = true;
    searchInput.placeholder = 'Search cloud providers...';

    renderFilteredSummary(cloudServices);
}

function createCategorySection(title, providers) {
    const section = document.createElement('div');
    section.className = 'provider-category';
    section.innerHTML = `<h2 class="category-title">${title}</h2>`;

    const grid = document.createElement('div');
    grid.className = 'services-grid';

    providers.forEach(service => {
        grid.appendChild(createServiceCard(service));
    });

    section.appendChild(grid);
    return section;
}

function underlyingCSPHtml(service) {
    const cspLabel = service.type === 'SaaS' ? 'CSP(s)' : 'Underlying CSP';
    return service.underlyingCSP && service.underlyingCSP.length > 0 ?
        `<div class="underlying-csp">${cspLabel}: ${service.underlyingCSP.map(escapeHtml).join(', ')}</div>` : '';
}

function createServiceCard(service) {
    const serviceCount = Object.keys(service.servicesInScope).length;
    const highServices = Object.values(service.servicesInScope).filter(levels => levels.includes('High')).length;
    const hvaSevices = Object.values(service.servicesInScope).filter(levels => levels.includes('HVA')).length;

    const serviceCard = document.createElement('div');
    serviceCard.className = 'service-card summary-card';
    serviceCard.onclick = () => showDetailView(service);

    const highStatHtml = highServices > 0 ? `
            <div class="stat">
                <span class="stat-number">${highServices}</span>
                <span class="stat-label">High Services</span>
            </div>` : '';

    const hvaStatHtml = hvaSevices > 0 ? `
            <div class="stat">
                <span class="stat-number">${hvaSevices}</span>
                <span class="stat-label">HVA Services</span>
            </div>` : '';

    const summaryStatsClass = highServices > 0 || hvaSevices > 0 ? 'summary-stats' : 'summary-stats centered';

    serviceCard.innerHTML = `
        <div class="service-name">${escapeHtml(service.name)}</div>
        ${underlyingCSPHtml(service)}
        <div class="${summaryStatsClass}">
            <div class="stat">
                <span class="stat-number">${serviceCount}</span>
                <span class="stat-label">Medium Services</span>
            </div>${highStatHtml}${hvaStatHtml}
        </div>
        <div class="view-details">Click to view details →</div>
    `;

    return serviceCard;
}

function showDetailView(service) {
    currentView = 'detail';
    selectedService = service;
    const backButton = document.getElementById('backButton');
    const searchInput = document.getElementById('searchInput');

    backButton.hidden = false;
    searchInput.placeholder = `Search ${service.name} services...`;

    renderFilteredDetail(service, '');
}

function referencesHtml(service) {
    if (!service.references) {
        return '';
    }

    const links = [];
    const addLink = (href, label) => {
        const url = safeUrl(href);
        if (url) {
            links.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`);
        }
    };

    if (service.references.assessmentReport) {
        addLink(service.references.assessmentReport, 'Assessment Report');
    }
    if (service.references.providerReference) {
        if (Array.isArray(service.references.providerReference)) {
            service.references.providerReference.forEach((link, index) => {
                addLink(link, `Provider Reference ${index + 1}`);
            });
        } else {
            addLink(service.references.providerReference, 'Provider Reference');
        }
    }

    return links.length > 0 ? `<div class="references">
                <strong>References:</strong> ${links.join(' | ')}
            </div>` : '';
}

function filterServices(searchTerm) {
    if (currentView === 'summary') {
        const filtered = cloudServices.filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.provider.toLowerCase().includes(searchTerm.toLowerCase())
        );
        renderFilteredSummary(filtered);
    } else {
        renderFilteredDetail(selectedService, searchTerm);
    }
}

function renderFilteredSummary(services) {
    const servicesList = document.getElementById('servicesList');
    servicesList.innerHTML = '';

    // Separate providers by type
    const cspProviders = services.filter(service => service.type === 'CSP');
    const saasProviders = services.filter(service => service.type === 'SaaS');

    if (cspProviders.length > 0) {
        servicesList.appendChild(createCategorySection('Cloud Service Providers (CSPs)', cspProviders));
    }

    if (saasProviders.length > 0) {
        servicesList.appendChild(createCategorySection('Software as a Service (SaaS) Providers', saasProviders));
    }
}

function renderFilteredDetail(service, searchTerm) {
    const filtered = Object.entries(service.servicesInScope).filter(([serviceName]) =>
        serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const servicesList = document.getElementById('servicesList');
    const serviceCard = document.createElement('div');
    serviceCard.className = 'service-card detailed-card';

    const tableRows = filtered
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([serviceName, levels]) => {
            const hasMedium = levels.includes('Medium') ? '✓' : '';
            const hasHigh = levels.includes('High') ? '✓' : '';
            const hasHVA = levels.includes('HVA') ? '✓' : '';
            return `<tr>
                <td>${escapeHtml(serviceName)}</td>
                <td>${hasMedium}</td>
                <td>${hasHigh}</td>
                <td>${hasHVA}</td>
            </tr>`;
        }).join('');

    serviceCard.innerHTML = `
        <div class="service-name">${escapeHtml(service.name)}</div>
        ${underlyingCSPHtml(service)}
        ${referencesHtml(service)}
        <div class="services-table-container">
            <table class="services-table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Medium</th>
                        <th>High</th>
                        <th>HVA</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    servicesList.innerHTML = '';
    servicesList.appendChild(serviceCard);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProviderData();

    const searchInput = document.getElementById('searchInput');
    const backButton = document.getElementById('backButton');

    searchInput.addEventListener('input', (e) => {
        filterServices(e.target.value);
    });

    backButton.addEventListener('click', () => {
        searchInput.value = '';
        renderSummaryView();
    });
});
