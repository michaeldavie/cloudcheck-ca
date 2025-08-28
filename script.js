let cloudServices = [];
let currentView = 'summary'; // 'summary' or 'detail'
let selectedService = null;

async function loadProviderData() {
    try {
        const cacheBuster = `?v=${Date.now()}`;
        const response = await fetch(`./data/providers.json${cacheBuster}`);
        const providerFiles = await response.json();

        const promises = providerFiles.map(async (file) => {
            const providerResponse = await fetch(`./data/${file}.json${cacheBuster}`);
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
    const servicesList = document.getElementById('servicesList');
    const backButton = document.getElementById('backButton');
    const searchInput = document.getElementById('searchInput');

    backButton.style.display = 'none';
    searchInput.placeholder = 'Search cloud providers...';
    servicesList.innerHTML = '';

    // Separate providers by type
    const cspProviders = cloudServices.filter(service => service.type === 'CSP');
    const saasProviders = cloudServices.filter(service => service.type === 'SaaS');

    // Create CSP section
    if (cspProviders.length > 0) {
        const cspSection = document.createElement('div');
        cspSection.className = 'provider-category';
        cspSection.innerHTML = '<h2 class="category-title">Cloud Service Providers (CSPs)</h2>';

        const cspGrid = document.createElement('div');
        cspGrid.className = 'services-grid';

        cspProviders.forEach(service => {
            const serviceCard = createServiceCard(service);
            cspGrid.appendChild(serviceCard);
        });

        cspSection.appendChild(cspGrid);
        servicesList.appendChild(cspSection);
    }

    // Create SaaS section
    if (saasProviders.length > 0) {
        const saasSection = document.createElement('div');
        saasSection.className = 'provider-category';
        saasSection.innerHTML = '<h2 class="category-title">Software as a Service (SaaS) Providers</h2>';

        const saasGrid = document.createElement('div');
        saasGrid.className = 'services-grid';

        saasProviders.forEach(service => {
            const serviceCard = createServiceCard(service);
            saasGrid.appendChild(serviceCard);
        });

        saasSection.appendChild(saasGrid);
        servicesList.appendChild(saasSection);
    }
}

function createServiceCard(service) {
    const serviceCount = Object.keys(service.servicesInScope).length;
    const hvaSevices = Object.values(service.servicesInScope).filter(levels => levels.includes('HVA')).length;

    const serviceCard = document.createElement('div');
    serviceCard.className = 'service-card summary-card';
    serviceCard.onclick = () => showDetailView(service);

    const cspLabel = service.type === 'SaaS' ? 'CSP(s)' : 'Underlying CSP';
    const underlyingCSPHtml = service.underlyingCSP && service.underlyingCSP.length > 0 ?
        `<div class="underlying-csp">${cspLabel}: ${service.underlyingCSP.join(', ')}</div>` : '';

    serviceCard.innerHTML = `
        <div class="service-name">${service.name}</div>
        ${underlyingCSPHtml}
        <div class="summary-stats">
            <div class="stat">
                <span class="stat-number">${serviceCount}</span>
                <span class="stat-label">Services Assessed</span>
            </div>
            <div class="stat">
                <span class="stat-number">${hvaSevices}</span>
                <span class="stat-label">HVA Services</span>
            </div>
        </div>
        <div class="view-details">Click to view details →</div>
    `;

    return serviceCard;
}

function showDetailView(service) {
    currentView = 'detail';
    selectedService = service;
    const servicesList = document.getElementById('servicesList');
    const backButton = document.getElementById('backButton');
    const searchInput = document.getElementById('searchInput');

    backButton.style.display = 'inline-block';
    searchInput.placeholder = `Search ${service.name} services...`;
    servicesList.innerHTML = '';

    renderDetailedService(service);
}

function renderDetailedService(service) {
    const servicesList = document.getElementById('servicesList');
    const serviceCard = document.createElement('div');
    serviceCard.className = 'service-card detailed-card';

    const cspLabel = service.type === 'SaaS' ? 'CSP(s)' : 'Underlying CSP';
    const underlyingCSPHtml = service.underlyingCSP && service.underlyingCSP.length > 0 ?
        `<div class="underlying-csp">${cspLabel}: ${service.underlyingCSP.join(', ')}</div>` : '';

    const tableRows = Object.entries(service.servicesInScope)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([serviceName, levels]) => {
            const hasMedium = levels.includes('Medium') ? '✓' : '';
            const hasHVA = levels.includes('HVA') ? '✓' : '';
            return `<tr>
                <td>${serviceName}</td>
                <td>${hasMedium}</td>
                <td>${hasHVA}</td>
            </tr>`;
        }).join('');

    let referencesHtml = '';
    if (service.references) {
        const links = [];
        if (service.references.assessmentReport) {
            links.push(`<a href="${service.references.assessmentReport}" target="_blank" rel="noopener">Assessment Report</a>`);
        }
        if (service.references.providerReference) {
            if (Array.isArray(service.references.providerReference)) {
                service.references.providerReference.forEach((link, index) => {
                    links.push(`<a href="${link}" target="_blank" rel="noopener">Provider Reference ${index + 1}</a>`);
                });
            } else {
                links.push(`<a href="${service.references.providerReference}" target="_blank" rel="noopener">Provider Reference</a>`);
            }
        }
        if (links.length > 0) {
            referencesHtml = `<div class="references">
                <strong>References:</strong> ${links.join(' | ')}
            </div>`;
        }
    }

    serviceCard.innerHTML = `
        <div class="service-name">${service.name}</div>
        ${underlyingCSPHtml}
        ${referencesHtml}
        <div class="services-table-container">
            <table class="services-table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Medium</th>
                        <th>HVA</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    servicesList.appendChild(serviceCard);
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

    // Separate filtered providers by type
    const cspProviders = services.filter(service => service.type === 'CSP');
    const saasProviders = services.filter(service => service.type === 'SaaS');

    // Create CSP section if there are filtered CSP providers
    if (cspProviders.length > 0) {
        const cspSection = document.createElement('div');
        cspSection.className = 'provider-category';
        cspSection.innerHTML = '<h2 class="category-title">Cloud Service Providers (CSPs)</h2>';

        const cspGrid = document.createElement('div');
        cspGrid.className = 'services-grid';

        cspProviders.forEach(service => {
            const serviceCard = createServiceCard(service);
            cspGrid.appendChild(serviceCard);
        });

        cspSection.appendChild(cspGrid);
        servicesList.appendChild(cspSection);
    }

    // Create SaaS section if there are filtered SaaS providers
    if (saasProviders.length > 0) {
        const saasSection = document.createElement('div');
        saasSection.className = 'provider-category';
        saasSection.innerHTML = '<h2 class="category-title">Software as a Service (SaaS) Providers</h2>';

        const saasGrid = document.createElement('div');
        saasGrid.className = 'services-grid';

        saasProviders.forEach(service => {
            const serviceCard = createServiceCard(service);
            saasGrid.appendChild(serviceCard);
        });

        saasSection.appendChild(saasGrid);
        servicesList.appendChild(saasSection);
    }
}

function renderFilteredDetail(service, searchTerm) {
    const filtered = Object.entries(service.servicesInScope).filter(([serviceName]) =>
        serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const servicesList = document.getElementById('servicesList');
    const serviceCard = document.createElement('div');
    serviceCard.className = 'service-card detailed-card';

    const cspLabel = service.type === 'SaaS' ? 'CSP(s)' : 'Underlying CSP';
    const underlyingCSPHtml = service.underlyingCSP && service.underlyingCSP.length > 0 ?
        `<div class="underlying-csp">${cspLabel}: ${service.underlyingCSP.join(', ')}</div>` : '';

    const tableRows = filtered
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([serviceName, levels]) => {
            const hasMedium = levels.includes('Medium') ? '✓' : '';
            const hasHVA = levels.includes('HVA') ? '✓' : '';
            return `<tr>
                <td>${serviceName}</td>
                <td>${hasMedium}</td>
                <td>${hasHVA}</td>
            </tr>`;
        }).join('');

    let referencesHtml = '';
    if (service.references) {
        const links = [];
        if (service.references.assessmentReport) {
            links.push(`<a href="${service.references.assessmentReport}" target="_blank" rel="noopener">Assessment Report</a>`);
        }
        if (service.references.providerReference) {
            if (Array.isArray(service.references.providerReference)) {
                service.references.providerReference.forEach((link, index) => {
                    links.push(`<a href="${link}" target="_blank" rel="noopener">Provider Reference ${index + 1}</a>`);
                });
            } else {
                links.push(`<a href="${service.references.providerReference}" target="_blank" rel="noopener">Provider Reference</a>`);
            }
        }
        if (links.length > 0) {
            referencesHtml = `<div class="references">
                <strong>References:</strong> ${links.join(' | ')}
            </div>`;
        }
    }

    serviceCard.innerHTML = `
        <div class="service-name">${service.name}</div>
        ${underlyingCSPHtml}
        ${referencesHtml}
        <div class="services-table-container">
            <table class="services-table">
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Medium</th>
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
