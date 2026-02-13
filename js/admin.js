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

const achModal = document.getElementById('achievementModal');
let achievements = [];
let currentChatbotContext = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    populateDateDropdowns();

    // Default tab
    switchTab('projects');

    // Character counter for description
    const projectDesc = document.getElementById('projectDesc');
    const descCount = document.getElementById('descCount');
    if (projectDesc && descCount) {
        projectDesc.addEventListener('input', () => {
            descCount.textContent = projectDesc.value.length;
        });
    }
});

// Tab Switching
function switchTab(tabName) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Content
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    // Load data if needed
    if (tabName === 'projects') renderProjects();
    if (tabName === 'achievements') loadAchievements();
    if (tabName === 'chatbot') loadChatbotSettings();
    // Settings tab doesn't need data loading
}

// Auth Functions
async function checkSession() {
    // Verify authentication by making a test API call
    try {
        const resp = await fetch((window.API_BASE) + '/api/auth/me', {
            credentials: 'include'
        });

        // If we get a 401 or 403, redirect to login
        if (resp.status === 401 || resp.status === 403) {
            alert('Please log in to access the admin panel');
            window.location.href = 'index.html';
            return;
        }

        const data = await resp.json();
        if (!data.success) {
            throw new Error('Auth failed');
        }

        // If successful, render projects
        renderProjects();
    } catch (err) {
        console.error('Session check failed:', err);
        alert('Session check failed or expired');
        window.location.href = 'index.html';
    }
}

function showDashboard() {
    renderProjects();
}

async function logout() {
    try {
        await fetch((window.API_BASE) + '/api/auth/logout', { credentials: 'include' });
    } catch (e) {
        console.error('Logout failed', e);
    }
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
    // Remove "isWorkingOn" if not in new backend spec, or keep if backend allows extra fields. 
    // Spec says: startDate.month, startDate.year etc. we should structure them if backend expects nested or flattened.
    // Spec: "startDate.month, startDate.year, etc." implying flattened keys "startDate.month" likely.
    // If backend uses bodyParser with extend:true or similar to parse dot notation, we send "startDate.month".
    // Or if it expects "startDate": JSON.stringify({...}).
    // Based on "startDate.month" in prompt, I'll assume keys like "startDate.month" or just sending separate fields if backend constructs it.
    // Let's assume the backend handles these fields or we send them as is.
    formData.append('startDate.month', document.getElementById('startMonth').value || '');
    formData.append('startDate.year', document.getElementById('startYear').value || '');
    formData.append('endDate.month', document.getElementById('endMonth').value || '');
    formData.append('endDate.year', document.getElementById('endYear').value || '');
    formData.append('isWorkingOn', document.getElementById('workingOn').checked ? 'true' : 'false');

    // Skills as comma-separated string
    formData.append('skills', currentSkills.join(','));

    // Image handling
    const fileInput = document.getElementById('mediaFile');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        formData.append('image', fileInput.files[0]);
    }

    let url = '/api/projects';
    let method = 'POST';

    if (editIndex >= 0 && projects[editIndex]) {
        const id = projects[editIndex]._id || projects[editIndex].id || projects[editIndex].slug; // New backend might use _id
        if (id) {
            url = `/api/projects/${id}`;
            method = 'PUT';
        }
    }

    fetch((window.API_BASE) + url, { method: method, body: formData, credentials: 'include' })
        .then(async r => {
            const res = await r.json();

            // Check if unauthorized
            if (r.status === 401 || r.status === 403) {
                alert('Unauthorized: Your session may have expired. Please log in again.');
                window.location.href = 'index.html';
                return;
            }

            if (res.success || r.ok) { // Check for success flag or HTTP 200
                closeModal();
                renderProjects();
                const action = method === 'POST' ? 'created' : 'updated';
                alert(`Project ${action} successfully`);
            } else {
                alert('Failed to save project: ' + (res.message || 'Server error'));
            }
        }).catch(err => {
            console.error(err);
            alert('Failed to save project: Network error');
        });
}

function deleteProject(index) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const p = projects[index];
    const id = p._id || p.id || p.slug; // Prefer ID for new backend

    if (!id) {
        alert('Invalid project');
        return;
    }

    fetch((window.API_BASE) + `/api/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    })
        .then(async r => {
            const res = await r.json();

            // Check if unauthorized
            if (r.status === 401 || r.status === 403) {
                alert('Unauthorized: Your session may have expired. Please log in again.');
                // Redirect to index page to re-authenticate
                window.location.href = 'index.html';
                return;
            }

            // Check for success
            if (r.ok || res.success) {
                renderProjects();
                alert('Project deleted successfully');
            } else {
                alert('Failed to delete project: ' + (res.message || 'Server error'));
            }
        }).catch(err => {
            console.error(err);
            alert('Failed to delete project: Network error');
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
        const resp = await fetch((window.API_BASE) + '/api/projects', { credentials: 'include' });
        if (!resp.ok) throw new Error('Failed');
        const data = await resp.json();
        projects = data.data || data || []; // Handle potential { success: true, data: [] } structure or direct array

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

// Achievements CRUD
async function loadAchievements() {
    const list = document.getElementById('achievementsList');
    list.innerHTML = '<p>Loading...</p>';
    try {
        const resp = await fetch((window.API_BASE) + '/api/achievements', { credentials: 'include' });
        const data = await resp.json();
        achievements = data.data || data || [];

        list.innerHTML = '';
        if (achievements.length === 0) {
            list.innerHTML = '<p>No achievements yet.</p>';
            return;
        }

        achievements.forEach((ach, index) => {
            const card = document.createElement('div');
            card.className = 'project-card-admin';
            let img = ach.image || ach.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image';
            if (img.startsWith('/') && window.API_BASE) img = window.API_BASE + img;

            card.innerHTML = `
                <img src="${img}" class="project-thumb">
                <div class="project-actions">
                     <button onclick="editAchievement(${index})" style="background:none; border:none; cursor:pointer; color:#3b82f6; margin:0 5px;" title="Edit"><i class="fas fa-edit"></i></button>
                     <button onclick="deleteAchievement('${ach._id || ach.id}')" style="background:none; border:none; cursor:pointer; color:#ef4444; margin:0 5px;" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
                <h3>${ach.title}</h3>
                <p>${ach.description || ''}</p>
             `;
            list.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        list.innerHTML = '<p>Failed to load achievements.</p>';
    }
}

function openAddAchievementModal() {
    document.getElementById('achEditId').value = '';
    document.getElementById('achievementForm').reset();
    document.getElementById('achievementModal').style.display = 'flex';
}

function closeAchievementModal() {
    document.getElementById('achievementModal').style.display = 'none';
}

function editAchievement(index) {
    const ach = achievements[index];
    document.getElementById('achEditId').value = ach._id || ach.id;
    document.getElementById('achTitle').value = ach.title;
    document.getElementById('achDesc').value = ach.description || '';
    if (ach.eventDate) document.getElementById('achDate').value = new Date(ach.eventDate).toISOString().split('T')[0];
    document.getElementById('achievementModal').style.display = 'flex';
}

async function saveAchievement() {
    const id = document.getElementById('achEditId').value;
    const title = document.getElementById('achTitle').value;
    const desc = document.getElementById('achDesc').value;
    const date = document.getElementById('achDate').value;
    const file = document.getElementById('achImage').files[0];

    if (!title) return alert('Title is required');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', desc);
    if (date) formData.append('eventDate', date);
    if (file) formData.append('image', file);

    const url = id ? `/api/achievements/${id}` : '/api/achievements';
    const method = id ? 'PUT' : 'POST';

    try {
        const resp = await fetch((window.API_BASE) + url, {
            method, body: formData, credentials: 'include'
        });
        if (resp.ok) {
            closeAchievementModal();
            loadAchievements();
            alert('Achievement saved!');
        } else {
            const data = await resp.json();
            alert('Failed: ' + (data.message || 'Error'));
        }
    } catch (e) { console.error(e); alert('Error saving achievement'); }
}

async function deleteAchievement(id) {
    if (!confirm('Delete this achievement?')) return;
    try {
        const resp = await fetch((window.API_BASE) + `/api/achievements/${id}`, {
            method: 'DELETE', credentials: 'include'
        });
        if (resp.ok) {
            loadAchievements();
        } else {
            alert('Failed to delete');
        }
    } catch (e) { console.error(e); }
}

// Chatbot Settings
async function loadChatbotSettings() {
    try {
        const resp = await fetch((window.API_BASE) + '/api/chatbot/context', { credentials: 'include' });
        const data = await resp.json();
        currentChatbotContext = data.context || data || {};

        document.getElementById('botAboutMe').value = currentChatbotContext.aboutMe || '';
        renderFaqs(currentChatbotContext.faqs || []);
    } catch (e) {
        console.error(e);
    }
}

function renderFaqs(faqs) {
    const container = document.getElementById('botFaqs');
    container.innerHTML = '';
    faqs.forEach((faq, index) => {
        const div = document.createElement('div');
        div.className = 'faq-item';
        div.style.marginBottom = '10px';
        div.style.padding = '10px';
        div.style.background = 'var(--bg-primary)';
        div.style.border = '1px solid var(--border-color)';
        div.innerHTML = `
            <input type="text" placeholder="Question" class="faq-q" value="${faq.q}" style="width:100%; margin-bottom:5px; padding:5px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
            <textarea placeholder="Answer" class="faq-a" rows="2" style="width:100%; padding:5px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">${faq.a}</textarea>
            <button onclick="this.parentElement.remove()" style="color:red; margin-top:5px; background:none; border:none; cursor:pointer;">Remove</button>
        `;
        container.appendChild(div);
    });
}

function addFaqItem() {
    const container = document.getElementById('botFaqs');
    const div = document.createElement('div');
    div.className = 'faq-item';
    div.style.marginBottom = '10px';
    div.style.padding = '10px';
    div.style.background = 'var(--bg-primary)';
    div.style.border = '1px solid var(--border-color)';
    div.innerHTML = `
            <input type="text" placeholder="Question" class="faq-q" style="width:100%; margin-bottom:5px; padding:5px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);">
            <textarea placeholder="Answer" class="faq-a" rows="2" style="width:100%; padding:5px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary);"></textarea>
            <button onclick="this.parentElement.remove()" style="color:red; margin-top:5px; background:none; border:none; cursor:pointer;">Remove</button>
        `;
    container.appendChild(div);
}

async function saveChatbotSettings() {
    const aboutMe = document.getElementById('botAboutMe').value;
    const faqItems = document.querySelectorAll('.faq-item');
    const faqs = [];
    faqItems.forEach(item => {
        const q = item.querySelector('.faq-q').value;
        const a = item.querySelector('.faq-a').value;
        if (q && a) faqs.push({ q, a });
    });

    try {
        const resp = await fetch((window.API_BASE) + '/api/chatbot/context', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aboutMe, faqs }),
            credentials: 'include'
        });
        if (resp.ok) {
            alert('Settings saved');
        } else {
            alert('Failed to save settings');
        }
    } catch (e) { console.error(e); alert('Error saving settings'); }
}


async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill in all fields");
        return;
    }

    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
    }

    try {
        const resp = await fetch(window.API_BASE + '/api/auth/reset-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: currentPassword, newPassword: newPassword }),
            credentials: 'include'
        });

        const data = await resp.json();

        if (resp.ok && data.success) {
            alert(data.message || 'Password updated successfully');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            alert(data.message || 'Failed to update password');
        }
    } catch (e) {
        console.error(e);
        alert('Error updating password: ' + e.message);
    }
}

// Resume Handler
async function handleResumeUpload() {
    const fileInput = document.getElementById('resumeInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    if (file.type !== 'application/pdf') {
        alert("Only PDF files are allowed.");
        fileInput.value = '';
        return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
        const response = await fetch(`${window.API_BASE}/api/resume`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const data = await response.json();

        if (response.ok || data.ok) {
            alert(data.message || 'Resume uploaded successfully!');
            fileInput.value = ''; // Clear input
        } else {
            alert(data.message || 'Failed to upload resume');
        }
    } catch (error) {
        console.error('Error uploading resume:', error);
        alert('Error uploading resume: ' + error.message);
    }
}

// Global Exports
window.switchTab = switchTab;
window.openAddAchievementModal = openAddAchievementModal;
window.closeAchievementModal = closeAchievementModal;
window.editAchievement = editAchievement;
window.saveAchievement = saveAchievement;
window.deleteAchievement = deleteAchievement;
window.saveChatbotSettings = saveChatbotSettings;
window.addFaqItem = addFaqItem;
window.changePassword = changePassword;
window.handleResumeUpload = handleResumeUpload;
