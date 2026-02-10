// DOM Elements
const adminDashboard = document.getElementById('adminDashboard');
const projectModal = document.getElementById('projectModal'); // The generic modal container
const projectForm = document.getElementById('projectForm');
const projectsList = document.getElementById('projectsList');
const skillInput = document.getElementById('skillInput');
const skillsTags = document.getElementById('skillsTags');

// State
let projects = [];
let currentSkills = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    populateDateDropdowns();
});

// Auth Functions
// Auth Functions
function checkSession() {
    // For simplicity allow admin page to load; actual protection happens server-side when making requests.
    renderProjects();
}

function showDashboard() {
    renderProjects();
}

function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html'; // Redirect to main page
}

// Modal Functions
function openAddModal() {
    document.getElementById('editIndex').value = '-1';
    projectForm.reset();
    document.getElementById('featuredProject').checked = false; // Reset explicitly
    currentSkills = [];
    renderSkills();
    document.getElementById('projectModal').style.display = 'flex'; // Use flex for centering

    // Reset file input and preview
    document.getElementById('mediaBase64').value = '';
    document.getElementById('mediaFile').value = '';
    document.getElementById('previewImg').src = '';
    document.getElementById('mediaPreview').style.display = 'none';
}

function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
}

// Close on outside click
window.onclick = function (event) {
    if (event.target == projectModal) {
        closeModal();
    }
}

// Skills Logic
function addSkill() {
    const val = skillInput.value.trim();
    if (val && !currentSkills.includes(val)) {
        currentSkills.push(val);
        renderSkills();
        skillInput.value = '';
    }
}

skillInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
    }
});

function removeSkill(skill) {
    currentSkills = currentSkills.filter(s => s !== skill);
    renderSkills();
}

function renderSkills() {
    skillsTags.innerHTML = currentSkills.map(skill => `
        <span class="skill-tag">
            ${skill} <i class="fas fa-times remove-skill" onclick="removeSkill('${skill}')"></i>
        </span>
    `).join('');
}

// Convert image to Base64 and Resize
function handleImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];

        // Size validation (max 4MB before compression)
        if (file.size > 4 * 1024 * 1024) {
            alert("File is too large. Please select an image under 4MB.");
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.src = e.target.result;

            img.onload = function () {
                // Resize logic
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Max dimensions
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

                // Update hidden input and preview
                document.getElementById('mediaBase64').value = dataUrl;
                document.getElementById('previewImg').src = dataUrl;
                document.getElementById('mediaPreview').style.display = 'flex';
            };
        };
        reader.readAsDataURL(file);
    }
}

// Date Dropdowns
function populateDateDropdowns() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 2000; i--) years.push(i);

    const dropdowns = ['startMonth', 'endMonth'];
    dropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        months.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            select.appendChild(opt);
        });
    });

    const yearDropdowns = ['startYear', 'endYear'];
    yearDropdowns.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            select.appendChild(opt);
        });
    });
}

// CRUD Operations
function saveProject() {
    const editIndex = parseInt(document.getElementById('editIndex').value);

    // Validation
    const title = document.getElementById('projectName').value;
    if (!title) {
        alert('Project Name is required');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', document.getElementById('projectDesc').value || '');
    formData.append('featured', document.getElementById('featuredProject').checked ? 'true' : 'false');
    formData.append('link', document.getElementById('projectLink').value || '');
    formData.append('isWorkingOn', document.getElementById('workingOn').checked ? 'true' : 'false');
    formData.append('startMonth', document.getElementById('startMonth').value || '');
    formData.append('startYear', document.getElementById('startYear').value || '');
    formData.append('endMonth', document.getElementById('endMonth').value || '');
    formData.append('endYear', document.getElementById('endYear').value || '');
    if (currentSkills.length) formData.append('skills', JSON.stringify(currentSkills));

    const fileInput = document.getElementById('mediaFile');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('image', fileInput.files[0], fileInput.files[0].name);
    } else {
        // If only base64 preview exists, send as imageBase64
        const mediaBase64 = document.getElementById('mediaBase64').value;
        if (mediaBase64) formData.append('imageBase64', mediaBase64);
    }

    let url = '/api/projects';
    let method = 'POST';

    if (editIndex >= 0 && projects[editIndex]) {
        const slug = projects[editIndex].slug;
        if (slug) {
            url = `/api/projects/${slug}`;
            method = 'PUT';
        }
    }

    fetch((window.API_BASE) + url, { method: method, body: formData, credentials: 'include' })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                closeModal();
                renderProjects();
                const action = method === 'POST' ? 'created' : 'updated';
                alert(`Project ${action} successfully`);
            } else {
                alert('Failed to save project: ' + (res.message || 'Server error'));
            }
        }).catch(err => {
            console.error(err);
            alert('Failed to save project');
        });
}

function deleteProject(index) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const p = projects[index];
    if (!p || !p.slug) {
        alert('Invalid project');
        return;
    }

    fetch((window.API_BASE) + `/api/projects/${p.slug}`, { method: 'DELETE', credentials: 'include' })
        .then(r => r.json())
        .then(res => {
            if (res.ok) {
                renderProjects();
            } else {
                alert('Failed to delete project: ' + (res.message || 'Server error'));
            }
        }).catch(err => {
            console.error(err);
            alert('Failed to delete project');
        });
}

function editProject(index) {
    const p = projects[index];
    document.getElementById('editIndex').value = index;

    document.getElementById('projectName').value = p.title;
    document.getElementById('projectDesc').value = p.description;

    // Media preview
    const projectImage = p.image || (p.images && p.images[0] && p.images[0].url) || '';
    document.getElementById('mediaBase64').value = projectImage;
    const previewImg = document.getElementById('previewImg');
    const mediaPreview = document.getElementById('mediaPreview');
    if (projectImage) {
        if (projectImage.startsWith('/') && window.API_BASE) {
            previewImg.src = window.API_BASE + projectImage;
        } else {
            previewImg.src = projectImage;
        }
        mediaPreview.style.display = 'flex';
    } else {
        previewImg.src = '';
        mediaPreview.style.display = 'none';
    }
    document.getElementById('projectLink').value = p.link || '';
    document.getElementById('workingOn').checked = p.isWorkingOn;
    document.getElementById('featuredProject').checked = p.featured;

    // Dates
    document.getElementById('startMonth').value = p.startDate?.month || 'Jan';
    document.getElementById('startYear').value = p.startDate?.year || new Date().getFullYear();
    document.getElementById('endMonth').value = p.endDate?.month || 'Jan';
    document.getElementById('endYear').value = p.endDate?.year || new Date().getFullYear();

    currentSkills = [...p.skills];
    renderSkills();

    document.getElementById('projectModal').style.display = 'flex';
}
async function renderProjects() {
    projectsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Loading...</p>';
    try {
        const resp = await fetch((window.API_BASE) + '/api/projects/manifest.json');
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();
        projects = data || [];

        projectsList.innerHTML = '';
        if (projects.length === 0) {
            projectsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">No projects yet. Click "Add project" to start.</p>';
            return;
        }

        projects.forEach((p, index) => {
            const card = document.createElement('div');
            card.className = 'project-card-admin';
            let thumb = p.image || (p.images && p.images[0] && p.images[0].url) || 'https://via.placeholder.com/300x200?text=No+Image';
            if (thumb.startsWith('/') && window.API_BASE) {
                thumb = window.API_BASE + thumb;
            }
            card.innerHTML = `
                <img src="${thumb}" alt="${p.title}" class="project-thumb" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="project-actions">
                    ${p.featured ? '<span style="background:#10b981; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-right:5px;">Visible</span>' : '<span style="background:#6b7280; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-right:5px;">Hidden</span>'}
                    <button onclick="editProject(${index})" style="background:none; border:none; cursor:pointer; color:#3b82f6; margin:0 5px;" title="Edit"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteProject(${index})" style="background:none; border:none; cursor:pointer; color:#ef4444; margin:0 5px;" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
                <h3>${p.title}</h3>
                <p>${(p.description || '').substring(0, 60)}...</p>
            `;
            projectsList.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        projectsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888;">Failed to load projects.</p>';
    }
}
