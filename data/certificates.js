let certificatesData = [];

// 1. Add a timestamp query parameter to bypass browser caching on file changes
fetch('certificates.json?v=' + new Date().getTime())
  .then(response => {
    if (!response.ok) throw new Error('Failed to load database.');
    return response.json();
  })
  .then(data => {
    // AUTOMATION FIX: Sort records so the newest added ID/Year always appears first
    certificatesData = data.sort((a, b) => b.id - a.id); 
    
    renderCertificatesGrid(certificatesData);
  })
  .catch(error => console.error('Automation Fetch Error:', error));

// 2. Render cards into the main page grid 
function renderCertificatesGrid(certificates) {
    const grid = document.getElementById('certificates-grid');
    grid.innerHTML = ''; 
    
    certificates.forEach(cert => {
        const card = document.createElement('div');
        card.classList.add('mini-card');
        card.innerHTML = `
            <img src="${cert.imageUrl || 'assets/default-cert.png'}" alt="${cert.title}">
            <h3>${cert.title}</h3>
            <p>${cert.provider}</p>
            <button onclick="openCertificateModal(${cert.id})">View Details</button>
        `;
        grid.appendChild(card);
    });
}

// 3. Inject data safely into the preview pane layout
function openCertificateModal(id) {
    const cert = certificatesData.find(item => item.id === id);
    if (!cert) return;

    // Core mappings
    document.getElementById('modal-img').src = cert.imageUrl || 'assets/default-cert.png';
    document.getElementById('modal-title').innerText = cert.title || 'Untitled Certificate';
    document.getElementById('modal-provider').innerText = cert.provider || 'Unknown Provider';
    document.getElementById('modal-date').innerText = cert.issueDate || cert.year || '—';
    document.getElementById('modal-id').innerText = cert.credentialId || '—';
    
    // AUTOMATION FIX: Fallback placeholders for structural fields left empty by automation
    document.getElementById('modal-level').innerText = cert.level || '—';
    document.getElementById('modal-duration').innerText = cert.duration || '—';
    document.getElementById('modal-type').innerText = cert.type || '—';
    document.getElementById('modal-mode').innerText = cert.mode || '—';
    
    document.getElementById('modal-skills').innerText = cert.skills || 'Not specified';
    document.getElementById('modal-desc').innerText = cert.description || 'No description available.';

    // Array tagging validation loop
    const tagsBox = document.getElementById('modal-tags');
    if (cert.tags && Array.isArray(cert.tags) && cert.tags.length > 0) {
        tagsBox.innerHTML = cert.tags.map(t => `<span class="tag">${t}</span>`).join('');
    } else if (cert.category) {
        // Fallback to category string if the automation pipeline forgot the tags array
        tagsBox.innerHTML = `<span class="tag">${cert.category}</span>`;
    } else {
        tagsBox.innerHTML = '';
    }

    // Dynamic Verification Badge check matching your UI image snippet color coding
    const statusBox = document.getElementById('modal-status');
    if (cert.verified === true || cert.verified === "true") {
        statusBox.innerText = 'Verified';
        statusBox.className = 'status-badge verified';
    } else {
        statusBox.innerText = 'Unverified';
        statusBox.className = 'status-badge unverified';
    }

    // Interactive element asset paths
    document.getElementById('btn-view').href = cert.imageUrl || '#';
    
    const downloadBtn = document.getElementById('btn-download');
    downloadBtn.href = cert.imageUrl || '#';
    // Dynamically names the file download to match the certificate name
    downloadBtn.setAttribute('download', `${cert.title.replace(/\s+/g, '_')}_Certificate`);

    document.getElementById('btn-verify').href = cert.verificationUrl || '#';

    // Toggle Modal View state visible
    document.getElementById('cert-modal').classList.add('show-modal');
}

// 4. Structural Panel Interface Window Event Handlers
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('cert-modal').classList.remove('remove-modal'); // Resetting UI layer classes cleanly
    document.getElementById('cert-modal').classList.remove('show-modal');
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('cert-modal');
    if (e.target === modal) {
        modal.classList.remove('show-modal');
    }
});
