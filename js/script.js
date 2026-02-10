// Performance optimized variables
let isInitialized = false;
let scrollTimeout = null;
let audioContext = null;

// Initialize Audio Context for click sounds
// Initialize Audio Context for click sounds
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }
    // Resume context if suspended (common in modern browsers)
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

// Global listener to unlock AudioContext on first interaction
['click', 'touchstart', 'keydown'].forEach(event => {
    window.addEventListener(event, () => {
        if (!audioContext) initAudioContext();
        if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    }, { once: true });
});

// Optimized Click Sound Effect
function playClickSound() {
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Immediate frequency set
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

        // Immediate gain set
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
        // console.warn('Sound playback failed:', error);
    }
}

// Theme Toggle Function
function toggleTheme() {
    playClickSound();

    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);

    // Save theme preference
    try {
        localStorage.setItem('theme', newTheme);
    } catch (error) {
        console.warn('Could not save theme preference:', error);
    }

    // Update particles for theme
    updateParticlesForTheme();

    showNotification(`Switched to ${newTheme} theme!`);
}

// Load saved theme on page load
function loadSavedTheme() {
    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    } catch (error) {
        console.warn('Could not load saved theme:', error);
    }
}

// Update particles based on theme
function updateParticlesForTheme() {
    const particles = document.querySelectorAll('.particle');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    particles.forEach((particle, index) => {
        if (index % 3 === 0) {
            particle.style.background = isDark ? '#7dd3d8' : 'var(--accent-teal)';
        } else if (index % 2 === 0) {
            particle.style.background = isDark ? '#fb7185' : 'var(--accent-orange)';
        } else {
            particle.style.background = isDark ? '#4a8b87' : 'var(--primary-color)';
        }
    });
}

// Enhanced Loading Screen with proper cleanup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    createParticles();
    // Assuming initHorizontalScroll and startAnimations are defined elsewhere or will be added
    // initHorizontalScroll(); // Removed
    loadProjects(); // NEW: Load dynamic projects

    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => {
            loader.remove(); // Remove from DOM to free memory
            if (!isInitialized) {
                // startAnimations(); // Assuming startAnimations is defined elsewhere or will be added
                isInitialized = true;
            }
        }, 500);
    }, 1500);
});

// Optimized Particle Background with object pooling
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = window.innerWidth > 768 ? 30 : 15; // Reduce on mobile

    // Create particles with staggered animation delays
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = (Math.random() * 25) + 's';
        particle.style.animationDuration = (Math.random() * 15 + 15) + 's';
        particlesContainer.appendChild(particle);
    }

    // Update particles for current theme
    updateParticlesForTheme();
}

// Debounced resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Recreate particles on significant resize
        const particles = document.getElementById('particles');
        if (particles) {
            particles.innerHTML = '';
            createParticles();
        }
    }, 250);
});

createParticles();

// Optimized Floating Action Button
const fabMain = document.getElementById('fabMain');
const fabOptions = document.getElementById('fabOptions');
let fabOpen = false;

fabMain.addEventListener('click', (e) => {
    e.preventDefault();
    playClickSound();
    fabOpen = !fabOpen;
    fabOptions.classList.toggle('active', fabOpen);
    fabMain.classList.toggle('active', fabOpen);
});

// Close FAB when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.fab-container') && fabOpen) {
        fabOpen = false;
        fabOptions.classList.remove('active');
        fabMain.classList.remove('active');
    }
});

// FAB Functions with error handling
function downloadCV() {
    playClickSound();
    try {
        showNotification('CV download started!');
        // Simulate CV download
        const link = document.createElement('a');
        link.href = 'public/Document/Resume.pdf';
        link.download = 'Anish_Resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('CV download failed:', error);
        showNotification('Download failed. Please try again.');
    }
}

function shareProfile() {
    playClickSound();
    try {
        if (navigator.share) {
            navigator.share({
                title: 'Anish - UI/UX Designer',
                text: 'Check out this amazing portfolio!',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showNotification('Profile link copied to clipboard!');
            }).catch(() => {
                showNotification('Share failed. Please copy the URL manually.');
            });
        }
    } catch (error) {
        console.error('Share failed:', error);
        showNotification('Share failed. Please try again.');
    }
}

// Optimized Notification System with queue
let notificationQueue = [];
let isShowingNotification = false;

function showNotification(message) {
    notificationQueue.push(message);
    if (!isShowingNotification) {
        processNotificationQueue();
    }
}

function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    isShowingNotification = true;
    const message = notificationQueue.shift();

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: var(--bg-primary);
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: var(--shadow-lg);
      `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            processNotificationQueue();
        }, 300);
    }, 3000);
}

// Optimized Scroll to Top Button
const scrollToTop = document.getElementById('scrollToTop');
let isScrollToTopVisible = false;

function handleScroll() {
    const shouldShow = window.scrollY > 300;

    if (shouldShow !== isScrollToTopVisible) {
        isScrollToTopVisible = shouldShow;
        scrollToTop.classList.toggle('visible', shouldShow);
    }
}

// Throttled scroll handler
window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
            handleScroll();
            handleScrollAnimations();
            updateActiveNavLink();
            scrollTimeout = null;
        }, 16); // ~60fps
    }
}, { passive: true });

scrollToTop.addEventListener('click', (e) => {
    e.preventDefault();
    playClickSound();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Enhanced Navigation with proper event delegation
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navLinkItems = document.querySelectorAll('.nav-link');

// Navbar scroll effect
function updateNavbar() {
    navbar.classList.toggle('nav-scrolled', window.scrollY > 100);
}

// Mobile menu toggle with animation
navToggle.addEventListener('click', (e) => {
    e.preventDefault();
    playClickSound();
    const isActive = navLinks.classList.contains('active');
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');

    // Prevent body scroll when menu is open
    document.body.style.overflow = isActive ? '' : 'hidden';
});

// Close mobile menu when clicking on a link or outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('nav') && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Optimized Active navigation link
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos <= bottom) {
            navLinkItems.forEach(link => {
                const isActive = link.getAttribute('href') === `#${id}`;
                link.classList.toggle('active', isActive);
            });
        }
    });
}

// Enhanced smooth scrolling with proper cleanup
navLinkItems.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        playClickSound();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            // Close mobile menu
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
            document.body.style.overflow = '';

            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Optimized Skill bars animation with Intersection Observer
function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                const width = entry.target.getAttribute('data-width');
                setTimeout(() => {
                    entry.target.style.width = width + '%';
                    entry.target.dataset.animated = 'true';
                }, 500);
            }
        });
    }, { threshold: 0.5 });

    skillBars.forEach(bar => observer.observe(bar));
}

// Testimonials slider logic removed as section was replaced

// Contact form handled in email.js
// Logic moved there to avoid conflicts and enable real EmailJS sending


// Enhanced scroll animations with Intersection Observer
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll:not(.animated)');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => observer.observe(element));
}

// Portfolio horizontal scroll logic removed (replaced by grid)

// Add click sound to all interactive elements
function addClickSounds() {
    const clickableElements = document.querySelectorAll('button, .service-card, .portfolio-card, .timeline-content, .skill-item, .social-link, .contact-method');

    clickableElements.forEach(element => {
        element.addEventListener('click', playClickSound, { passive: true });
    });
}

// Initialize animations when page loads
function startAnimations() {
    try {
        setTimeout(() => {
            animateSkillBars();
            handleScrollAnimations();
            updateNavbar();
            addClickSounds();
            loadSavedTheme();
            initAudioContext();
        }, 500);
    } catch (error) {
        console.error('Animation initialization failed:', error);
    }
}

// Initialize audio context on first user interaction
document.addEventListener('click', () => {
    initAudioContext();
}, { once: true });

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    if (audioContext) {
        audioContext.close();
    }
});

// Error handling for uncaught errors
window.addEventListener('error', (e) => {
    console.error('Uncaught error:', e.error);
});

// Initialize everything when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!isInitialized) {
            startAnimations();
            isInitialized = true;
        }
    });
} else {
    if (!isInitialized) {
        startAnimations();
        isInitialized = true;
    }
}

// Load Projects from localStorage (original static behavior)
async function loadProjects() {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;

    grid.innerHTML = '<p class="loading-text" style="color: var(--text-secondary);">Loading amazing projects...</p>';

    let projects = [];

    // 1. Try fetching from API
    try {
        const resp = await fetch((window.API_BASE) + '/api/projects/manifest.json');
        if (resp.ok) {
            projects = await resp.json();
            console.log('Loaded projects from API', projects);
        }
    } catch (e) {
        console.warn('API load failed, falling back to storage', e);
    }

    // 2. Fallback removed to prevent default/cached projects from showing up
    if (!projects || projects.length === 0) {
        console.warn('No projects found from API.');
    }

    const visibleProjects = (projects || []).filter(p => p.featured);
    grid.innerHTML = '';

    if (visibleProjects.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:var(--text-secondary); grid-column:1/-1;">No featured projects to display yet.</p>';
        return;
    }

    renderProjectCards(visibleProjects, grid);
}

// Helper to render project cards into the grid
function renderProjectCards(projects, grid) {
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'portfolio-card-dynamic animate-on-scroll';
        card.style.animationDelay = `${index * 0.1}s`;

        const tagsHtml = (project.tags || []).slice(0, 3).map(skill =>
            `<span class="project-tag">${skill}</span>`
        ).join('');

        let imgSrc = project.image || project.images?.[0]?.url || 'https://via.placeholder.com/400x250?text=Project';
        if (imgSrc.startsWith('/') && window.API_BASE) {
            imgSrc = window.API_BASE + imgSrc;
        }

        card.innerHTML = `
            <div class="project-image-container">
                ${project.featured ? '<div style="position:absolute; top:10px; right:10px; background:#f59e0b; color:white; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:bold; z-index:2; box-shadow:0 2px 4px rgba(0,0,0,0.2);">Featured</div>' : ''}
                <img src="${imgSrc}" alt="${project.title}" onerror="this.src='https://via.placeholder.com/400x250?text=Project'">
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.title}</h3>
                <div class="project-desc">
                    ${(typeof marked !== 'undefined') ? marked.parse(project.description) : project.description || ''}
                </div>
                <div class="project-tags">
                    ${tagsHtml}
                </div>
                <div class="project-links">
                     <button onclick="openProjectDetails('${project.slug}')" class="project-link-btn" style="background:none; border:none; padding:0; cursor:pointer; font-family:inherit;">
                        View Details <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Re-trigger animation observer for new elements
    if (typeof handleScrollAnimations === 'function') {
        setTimeout(handleScrollAnimations, 100);
    }
}


// Real-time updates via Socket.IO
try {
    if (typeof io !== 'undefined') {
        const socket = io(window.API_BASE);
        socket.on('projects:created', () => loadProjects());
        socket.on('projects:updated', () => loadProjects());
        socket.on('projects:deleted', () => loadProjects());
    }
} catch (e) { }
// Admin Login Logic for Index Page
const indexLoginOverlay = document.getElementById('indexLoginOverlay');

function openIndexLogin() {
    if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        window.location.href = 'admin.html';
    } else {
        if (indexLoginOverlay) {
            indexLoginOverlay.style.display = 'flex';
            playClickSound();
        }
    }
}

function closeIndexLogin() {
    if (indexLoginOverlay) indexLoginOverlay.style.display = 'none';
}

function checkIndexPassword() {
    const password = document.getElementById('indexAdminPassword').value;
    const errorMsg = document.getElementById('indexLoginError');

    fetch((window.API_BASE) + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
    }).then(async (r) => {
        if (r.ok) {
            window.location.href = 'admin.html';
        } else {
            const data = await r.json().catch(() => ({}));
            errorMsg.textContent = data.message || 'Incorrect password';
            playClickSound();
            const box = indexLoginOverlay.querySelector('.login-box');
            if (box) {
                box.style.animation = 'shake 0.5s';
                setTimeout(() => box.style.animation = '', 500);
            }
        }
    }).catch(err => {
        console.error(err);
        errorMsg.textContent = 'Login failed';
    });
}

const pwdInput = document.getElementById('indexAdminPassword');
if (pwdInput) {
    pwdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkIndexPassword();
    });
}

if (indexLoginOverlay) {
    indexLoginOverlay.addEventListener('click', (e) => {
        if (e.target === indexLoginOverlay) closeIndexLogin();
    });
}

// Expose to global
window.openIndexLogin = openIndexLogin;
window.closeIndexLogin = closeIndexLogin;
window.checkIndexPassword = checkIndexPassword;

// Project Details Modal Logic
(function () {
    const modal = document.getElementById('projectDetailsModal');
    const img = document.getElementById('modalProjectImage');
    const title = document.getElementById('modalProjectTitle');
    const date = document.getElementById('modalProjectDate');
    const tags = document.getElementById('modalProjectTags');
    const desc = document.getElementById('modalProjectDesc');
    const link = document.getElementById('modalProjectLink');

    window.openProjectDetails = async function (slug) {
        try {
            const resp = await fetch((window.API_BASE || '') + '/api/projects/manifest.json');
            if (!resp.ok) return;
            const manifest = await resp.json();
            const p = (manifest || []).find(item => item.slug === slug);
            if (!p) return;

            if (img) img.src = p.image || (p.images && p.images[0] && p.images[0].url) || '';
            if (title) title.innerText = p.title;

            // Date
            let dateText = "Date not specified";
            if (p.startDate && p.endDate) {
                dateText = `${p.startDate.month} ${p.startDate.year} - ${p.endDate.month} ${p.endDate.year} `;
            }
            if (p.isWorkingOn) {
                dateText = "Currently Working on this";
            }
            if (date) date.innerHTML = dateText;

            // Tags
            if (tags) {
                tags.innerHTML = (p.tags || p.skills || []).map(s =>
                    `<span class="project-modal-tag" style="background:rgba(44,95,93,0.1); color:var(--primary-color); padding:5px 12px; border-radius:20px; font-size:0.85rem; font-weight:600;"> ${s}</span> `
                ).join('');
            }

            // Description
            // Use marked to parse markdown if available, otherwise just text
            if (desc) {
                if (typeof marked !== 'undefined') {
                    desc.innerHTML = marked.parse(p.description || "No description available.");
                } else {
                    desc.innerText = p.description || "No description available.";
                }
            }

            // Link handling
            if (link) {
                let href = p.link || '#';
                if (href !== '#' && !href.match(/^https?:\/\//i)) {
                    href = 'https://' + href;
                }
                link.href = href;
                if (href !== '#') {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
            }

            // Show
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('active'), 10);
            }
            document.body.style.overflow = 'hidden';
        } catch (e) {
            console.error(e);
        }
    };

    window.closeProjectDetails = function () {
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    };

    if (modal) {
        modal.onclick = function (e) {
            if (e.target === modal) window.closeProjectDetails();
        }
    }
})();
