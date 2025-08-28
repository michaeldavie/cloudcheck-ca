let cloudServices = [];
let currentView = 'summary'; // 'summary' or 'detail'
let selectedService = null;

async function loadProviderData() {
    try {
        const response = await fetch('./data/providers.json');
        const providerFiles = await response.json();
        
        const promises = providerFiles.map(async (file) => {
            const providerResponse = await fetch(`./data/${file}`);
            return await providerResponse.json();
        });
        
        cloudServices = await Promise.all(promises);
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

    cloudServices.forEach(service => {
        const serviceCount = Object.keys(service.servicesInScope).length;
        const hvaSevices = Object.values(service.servicesInScope).filter(levels => levels.includes('HVA')).length;
        
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card summary-card';
        serviceCard.onclick = () => showDetailView(service);
        
        const underlyingCSPHtml = service.underlyingCSP && service.underlyingCSP.length > 0 ? 
            `<div class="underlying-csp">Underlying CSP: ${service.underlyingCSP.join(', ')}</div>` : '';
        
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
        
        servicesList.appendChild(serviceCard);
    });
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
    
    const underlyingCSPHtml = service.underlyingCSP && service.underlyingCSP.length > 0 ? 
        `<div class="underlying-csp">Underlying CSP: ${service.underlyingCSP.join(', ')}</div>` : '';
    
    const tableRows = Object.entries(service.servicesInScope)
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
            links.push(`<a href="${service.references.providerReference}" target="_blank" rel="noopener">Provider Reference</a>`);
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
        ${referencesHtml}
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

    services.forEach(service => {
        const serviceCount = Object.keys(service.servicesInScope).length;
        const hvaSevices = Object.values(service.servicesInScope).filter(levels => levels.includes('HVA')).length;
        
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card summary-card';
        serviceCard.onclick = () => showDetailView(service);
        
        const underlyingCSPHtml = service.underlyingCSP && service.underlyingCSP.length > 0 ? 
            `<div class="underlying-csp">Underlying CSP: ${service.underlyingCSP.join(', ')}</div>` : '';
        
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
        
        servicesList.appendChild(serviceCard);
    });
}

function renderFilteredDetail(service, searchTerm) {
    const filtered = Object.entries(service.servicesInScope).filter(([serviceName]) =>
        serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const servicesList = document.getElementById('servicesList');
    const serviceCard = document.createElement('div');
    serviceCard.className = 'service-card detailed-card';
    
    const underlyingCSPHtml = service.underlyingCSP && service.underlyingCSP.length > 0 ? 
        `<div class="underlying-csp">Underlying CSP: ${service.underlyingCSP.join(', ')}</div>` : '';
    
    const tableRows = filtered
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
            links.push(`<a href="${service.references.providerReference}" target="_blank" rel="noopener">Provider Reference</a>`);
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
        ${referencesHtml}
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
