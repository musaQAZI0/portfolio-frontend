// API Base URL is now imported from config.js
// const API_URL is available globally

// Load projects on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProjects('react-native', 'reactNativeProjects');
    loadProjects('flutter', 'flutterProjects');
    loadProjects('java', 'nativeProjects');
    
    // Setup native tabs
    setupNativeTabs();
    
    // Setup modal
    setupModal();
    
    // Sticky nav
    setupStickyNav();
});

// Load projects by technology
async function loadProjects(technology, containerId) {
    const container = document.getElementById(containerId);
    
    try {
        const response = await fetch(`${API_URL}/projects/technology/${technology}`);
        const projects = await response.json();
        
        if (projects.length === 0) {
            container.innerHTML = '<div class="loading">No projects yet. Check back soon!</div>';
            return;
        }
        
        container.innerHTML = projects.map(project => createProjectCard(project)).join('');
        
        // Add click event to open modal
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', function() {
                const projectId = this.dataset.projectId;
                openProjectModal(projectId);
            });
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = '<div class="loading">Error loading projects. Please try again later.</div>';
    }
}

// Create project card HTML
function createProjectCard(project) {
    const primaryImage = project.images && project.images.find(img => img.is_primary) || project.images[0];
    const imageHTML = primaryImage 
        ? `<img src="${BASE_URL}${primaryImage.image_path}" alt="${project.title}" class="project-image">`
        : `<div class="project-image-placeholder">${getTechIcon(project.technology)}</div>`;
    
    const features = project.features ? project.features.split('\n').slice(0, 3) : [];
    const tags = [project.technology.toUpperCase()];
    
    return `
        <div class="project-card" data-project-id="${project.id}">
            <div class="project-image-container">
                ${imageHTML}
            </div>
            <div class="project-content">
                <h3>${project.title}</h3>
                <p class="project-description">${truncateText(project.description, 150)}</p>
                ${features.length > 0 ? `
                    <ul class="project-features-list" style="list-style: none; padding: 0; margin: 15px 0;">
                        ${features.map(f => `<li style="padding: 5px 0; color: #666;">• ${f}</li>`).join('')}
                    </ul>
                ` : ''}
                <div class="project-tags">
                    ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

// Open project modal with details
async function openProjectModal(projectId) {
    const modal = document.getElementById('projectModal');
    const modalBody = document.getElementById('modalBody');
    
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`);
        const project = await response.json();
        
        // Images gallery
        const imagesHTML = project.images && project.images.length > 0 
            ? `<div class="modal-images">
                ${project.images.map(img => `<img src="${BASE_URL}${img.image_path}" alt="${project.title}">`).join('')}
               </div>`
            : '';
        
        // Video
        const videoHTML = project.video_link 
            ? `<div class="modal-video">
                <h3>Demo Video</h3>
                <iframe src="${getEmbedUrl(project.video_link)}" frameborder="0" allowfullscreen></iframe>
               </div>`
            : '';
        
        // Features
        const features = project.features ? project.features.split('\n').filter(f => f.trim()) : [];
        const featuresHTML = features.length > 0
            ? `<div class="modal-features">
                <h3>Key Features</h3>
                <ul>
                    ${features.map(f => `<li>${f}</li>`).join('')}
                </ul>
               </div>`
            : '';
        
        // Links
        const links = [];
        if (project.github_link) links.push(`<a href="${project.github_link}" target="_blank">GitHub</a>`);
        if (project.playstore_link) links.push(`<a href="${project.playstore_link}" target="_blank">Play Store</a>`);
        if (project.appstore_link) links.push(`<a href="${project.appstore_link}" target="_blank">App Store</a>`);
        
        const linksHTML = links.length > 0
            ? `<div class="modal-links">
                <h3>Project Links</h3>
                ${links.join('')}
               </div>`
            : '';
        
        modalBody.innerHTML = `
            <h2>${project.title}</h2>
            <p style="color: #666; margin: 10px 0 20px;"><strong>Technology:</strong> ${project.technology.toUpperCase()}</p>
            <p style="line-height: 1.8; margin-bottom: 20px;">${project.description}</p>
            ${imagesHTML}
            ${featuresHTML}
            ${videoHTML}
            ${linksHTML}
        `;
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading project details:', error);
        modalBody.innerHTML = '<p>Error loading project details.</p>';
        modal.style.display = 'block';
    }
}

// Setup modal close functionality
function setupModal() {
    const modal = document.getElementById('projectModal');
    const closeBtn = modal.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

// Setup native tabs (Java/Kotlin)
function setupNativeTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Load projects for selected technology
            const technology = this.dataset.tech;
            loadProjects(technology, 'nativeProjects');
        });
    });
}

// Setup sticky navigation
function setupStickyNav() {
    const nav = document.getElementById('mainNav');
    const navOffset = nav.offsetTop;
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > navOffset) {
            nav.classList.add('sticky');
        } else {
            nav.classList.remove('sticky');
        }
    });
    
    // Smooth scroll for navigation links
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - nav.offsetHeight;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Helper functions
function getTechIcon(technology) {
    const icons = {
        'react-native': '⚛️',
        'flutter': '🎯',
        'java': '☕',
        'kotlin': '🚀'
    };
    return icons[technology] || '📱';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function getEmbedUrl(url) {
    // Convert YouTube URL to embed URL
    if (url.includes('youtube.com/watch')) {
        const videoId = url.split('v=')[1].split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert YouTube short URL to embed URL
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URL to embed URL
    if (url.includes('vimeo.com/')) {
        const videoId = url.split('vimeo.com/')[1].split('?')[0];
        return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
}
