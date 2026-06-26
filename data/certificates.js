// Fetch the JSON file path
fetch('certificates.json')
  .then(response => response.json())
  .then(certificates => {
    const container = document.getElementById('certificates-container');
    
    // Loop through each certificate and generate HTML
    certificates.forEach(cert => {
      const certElement = document.createElement('div');
      certElement.classList.add('certificate-card');
      
      certElement.innerHTML = `
        <h3>${cert.title}</h3>
        <p><strong>Issued by:</strong> ${cert.issuer}</p>
        <p><strong>Date:</strong> ${cert.date}</p>
        <a href="${cert.url}" target="_blank" rel="noopener noreferrer">View Verification</a>
      `;
      
      // Add the new card to your portfolio container
      container.appendChild(certElement);
    });
  })
  .catch(error => console.error('Error loading automated certificates:', error));
