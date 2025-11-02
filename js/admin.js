// API Base URL is now imported from config.js
// const API_URL is available globally

// Current filter
let currentFilter = 'all';

// Helper function to get auth headers with JWT token
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Helper function to get just authorization header (for FormData)
function getAuthHeadersForFormData() {
    const token = localStorage.getItem('authToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

// Check if user is authenticated
async function checkAuth() {
    try {
        console.log('Checking authentication...');
        const response = await fetch(`${API_URL}/auth/status`, {
            method: 'GET',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        console.log('Auth response status:', response.status);
        const data = await response.json();
        console.log('Auth data:', data);
        
        if (!data.authenticated) {
            console.log('Not authenticated, redirecting to login...');
            // Redirect to login
            window.location.href = '/login.html';
            return;
        }
        
        console.log('Authenticated as:', data.email);
        
        // Show user email
        const emailElement = document.getElementById('userEmail');
        if (emailElement) {
            emailElement.textContent = `📧 ${data.email}`;
        }
        
        // Load projects after authentication confirmed
        loadAllProjects();
        setupFormHandlers();
        setupFilterTabs();
        setupImagePreview();
    } catch (error) {
        console.error('Auth check error:', error);
        alert('Authentication check failed. Please try refreshing the page.');
    }
}

// Logout function
async function logout() {
    try {
        // Clear JWT token from localStorage
        localStorage.removeItem('authToken');
        console.log('Token removed from localStorage');

        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders()
        });

        // Redirect to login regardless of response
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if error
        window.location.href = '/login.html';
    }
}

// Load projects on page load (moved inside checkAuth)
// document.addEventListener('DOMContentLoaded', function() {
//     loadAllProjects();
//     setupFormHandlers();
//     setupFilterTabs();
//     setupImagePreview();
// });

// Setup form handlers
function setupFormHandlers() {
    const projectForm = document.getElementById('projectForm');
    const editProjectForm = document.getElementById('editProjectForm');
    
    projectForm.addEventListener('submit', handleProjectSubmit);
    editProjectForm.addEventListener('submit', handleProjectUpdate);
}

// Handle project submission
async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeadersForFormData(),
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Project added successfully!', 'success');
            e.target.reset();
            document.getElementById('imagePreview').innerHTML = '';
            loadAllProjects();
        } else {
            showNotification('Error adding project: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding project. Please try again.', 'error');
    }
}

// Handle project update
async function handleProjectUpdate(e) {
    e.preventDefault();
    
    const projectId = document.getElementById('edit_project_id').value;
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: getAuthHeadersForFormData(),
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Project updated successfully!', 'success');
            closeEditModal();
            loadAllProjects();
        } else {
            showNotification('Error updating project: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error updating project. Please try again.', 'error');
    }
}

// Load all projects
async function loadAllProjects() {
    const container = document.getElementById('projectsList');
    
    try {
        const url = currentFilter === 'all' 
            ? `${API_URL}/projects`
            : `${API_URL}/projects/technology/${currentFilter}`;
            
        const response = await fetch(url);
        const projects = await response.json();
        
        if (projects.length === 0) {
            container.innerHTML = '<div class="loading">No projects found.</div>';
            return;
        }
        
        container.innerHTML = projects.map(project => createProjectItem(project)).join('');
        
        // Add event listeners
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const projectId = this.dataset.projectId;
                openEditModal(projectId);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const projectId = this.dataset.projectId;
                deleteProject(projectId);
            });
        });
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = '<div class="loading">Error loading projects.</div>';
    }
}

// Create project item HTML
function createProjectItem(project) {
    const primaryImage = project.images && project.images.find(img => img.is_primary) || project.images[0];
    const imageHTML = primaryImage 
        ? `<img src="${BASE_URL}${primaryImage.image_path}" alt="${project.title}" class="project-thumbnail">`
        : `<div class="project-thumbnail-placeholder">${getTechIcon(project.technology)}</div>`;
    
    const createdDate = new Date(project.created_at).toLocaleDateString();
    
    return `
        <div class="project-item">
            ${imageHTML}
            <div class="project-details">
                <h3>${project.title}</h3>
                <span class="project-tech-badge">${project.technology.toUpperCase()}</span>
                <p>${truncateText(project.description, 200)}</p>
                <div class="project-meta">
                    <p>📅 Created: ${createdDate}</p>
                    <p>🖼️ Images: ${project.images ? project.images.length : 0}</p>
                </div>
            </div>
            <div class="project-actions">
                <button class="btn-edit" data-project-id="${project.id}">Edit</button>
                <button class="btn-delete" data-project-id="${project.id}">Delete</button>
            </div>
        </div>
    `;
}

// Open edit modal
async function openEditModal(projectId) {
    const modal = document.getElementById('editModal');
    
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`);
        const project = await response.json();
        
        // Fill form
        document.getElementById('edit_project_id').value = project.id;
        document.getElementById('edit_title').value = project.title;
        document.getElementById('edit_technology').value = project.technology;
        document.getElementById('edit_description').value = project.description;
        document.getElementById('edit_features').value = project.features || '';
        document.getElementById('edit_video_link').value = project.video_link || '';
        document.getElementById('edit_github_link').value = project.github_link || '';
        document.getElementById('edit_playstore_link').value = project.playstore_link || '';
        document.getElementById('edit_appstore_link').value = project.appstore_link || '';
        
        // Display current images
        const currentImagesDiv = document.getElementById('currentImages');
        if (project.images && project.images.length > 0) {
            currentImagesDiv.innerHTML = project.images.map(img => `
                <div class="current-image-item">
                    <img src="${BASE_URL}${img.image_path}" alt="Project image">
                    <button type="button" class="delete-image-btn" data-image-id="${img.id}" onclick="deleteImage(${img.id})">×</button>
                </div>
            `).join('');
        } else {
            currentImagesDiv.innerHTML = '<p>No images</p>';
        }
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('Error loading project details.', 'error');
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Delete project
async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/projects/${projectId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Project deleted successfully!', 'success');
            loadAllProjects();
        } else {
            showNotification('Error deleting project: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error deleting project. Please try again.', 'error');
    }
}

// Delete image
async function deleteImage(imageId) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/images/${imageId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: getAuthHeaders()
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Image deleted successfully!', 'success');
            // Reload the edit modal
            const projectId = document.getElementById('edit_project_id').value;
            openEditModal(projectId);
        } else {
            showNotification('Error deleting image: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error deleting image. Please try again.', 'error');
    }
}

// Setup filter tabs
function setupFilterTabs() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set current filter
            currentFilter = this.dataset.tech;
            
            // Load filtered projects
            loadAllProjects();
        });
    });
}

// Setup image preview
function setupImagePreview() {
    const imageInput = document.getElementById('images');
    const previewDiv = document.getElementById('imagePreview');
    
    imageInput.addEventListener('change', function() {
        previewDiv.innerHTML = '';
        
        if (this.files) {
            Array.from(this.files).forEach((file, index) => {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-preview" onclick="removePreviewImage(${index})">×</button>
                    `;
                    previewDiv.appendChild(previewItem);
                };
                
                reader.readAsDataURL(file);
            });
        }
    });
}

// Remove preview image
function removePreviewImage(index) {
    const imageInput = document.getElementById('images');
    const dt = new DataTransfer();
    const files = Array.from(imageInput.files);
    
    files.splice(index, 1);
    
    files.forEach(file => dt.items.add(file));
    imageInput.files = dt.files;
    
    // Trigger change event to update preview
    imageInput.dispatchEvent(new Event('change'));
}

// Reset form
function resetForm() {
    document.getElementById('projectForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Setup modal close
document.querySelector('#editModal .close').onclick = closeEditModal;

window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    if (event.target == editModal) {
        closeEditModal();
    }
};

// Helper functions
function getTechIcon(technology) {
    const icons = {
        'react-native': '⚛️',
        'flutter': '<img src="https://cdn.simpleicons.org/flutter/02569B" alt="Flutter" style="width: 1em; height: 1em; vertical-align: middle;" />',
        'java': '☕',
        'kotlin': '🚀'
    };
    return icons[technology] || '📱';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}
