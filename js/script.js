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
    loadAchievements(); // NEW: Load achievements
    trackView(); // NEW: Track page view

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

// FAB Logic removed (replaced by UI Dock)
// Old FAB event listeners were here.


// FAB Functions with error handling
function downloadCV() {
    playClickSound();
    try {
        showNotification('CV download started!');
        // Simulate CV download
        const link = document.createElement('a');
        link.href = 'assets/Document/Resume.pdf';
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

// Load Projects from API


// Projects Logic
async function loadProjects() {
    const grid = document.getElementById('portfolioGrid');
    const seeAllContainer = document.getElementById('seeAllProjectsContainer');

    if (!grid) return;

    // Show loading state
    grid.innerHTML = '<p class="loading-text" style="color: var(--text-secondary);">Loading amazing projects...</p>';

    let projects = [];
    try {
        const resp = await fetch((window.API_BASE) + '/api/projects');
        const data = await resp.json();
        // Handle different response structures
        projects = data.data || data || [];

        // Store globally
        // Debug

        // Handle "See All" link visibility logic
        if (seeAllContainer) {
            const featuredCount = (projects || []).filter(p => p.featured).length;
            const totalCount = (projects || []).length;
            if (totalCount > featuredCount) {
                seeAllContainer.style.display = 'block';
            } else {
                seeAllContainer.style.display = 'none';
            }
        }
    } catch (e) {
        console.warn('API load failed', e);
        grid.innerHTML = '<p style="text-align:center; color:var(--text-secondary); grid-column:1/-1;">Failed to load projects. Please refresh the page.</p>';
        return;
    }

    // Filter for featured projects
    const visibleProjects = (projects || []).filter(p => p.featured);
    // console.log('Featured projects count:', visibleProjects.length);
    grid.innerHTML = '';

    if (visibleProjects.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:var(--text-secondary); grid-column:1/-1;">No featured projects to display yet.</p>';
        return;
    }

    renderProjectCards(visibleProjects, grid);
}



// Helper to render project cards into the grid
function renderProjectCards(projects, grid) {
    console.log('Rendering', projects.length, 'project cards');

    // Sort projects: Order (ascending) -> Date (descending)
    projects.sort((a, b) => {
        // Handle explicit order first - ensuring numbers
        const orderA = a.order ? parseInt(a.order) : 9999;
        const orderB = b.order ? parseInt(b.order) : 9999;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // Secondary sort by date (newest first)
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
    });

    projects.forEach((project, index) => {
        // Debug log for order
        console.log(`Project: ${project.title}, Order: ${project.order}`);

        const card = document.createElement('div');
        card.className = 'portfolio-card animate-on-scroll';
        card.style.animationDelay = `${index * 0.1}s`;

        // Medal styling is now handled by CSS :nth-child selectors in portfolio.css
        // This ensures the first 3 cards always get the Gold/Silver/Bronze styles
        // regardless of re-renders or JS timing.

        const tagsHtml = (project.tags || []).slice(0, 1).map(skill =>
            `<span class="project-tag">${skill}</span>`
        ).join('');

        let imgSrc = project.image || project.images?.[0]?.url || 'https://via.placeholder.com/400x250?text=Project';
        if (imgSrc.startsWith('/') && window.API_BASE) {
            imgSrc = window.API_BASE + imgSrc;
        }

        const viewCount = project.views || Math.floor(Math.random() * 500) + 50;

        card.innerHTML = `
            <div class="portfolio-image">
                ${project.featured ? '<div class="featured-badge">Featured</div>' : ''}
                <div class="view-count-badge"><i class="fas fa-eye"></i> ${viewCount}</div>
                <img src="${imgSrc}" alt="${project.title}" onerror="this.src='https://via.placeholder.com/400x250?text=Project'">
            </div>
            <div class="portfolio-content">
                <h3 class="portfolio-title">${project.title}</h3>
                <div class="portfolio-description">
                    ${project.description || ''}
                </div>
                <div class="portfolio-tags">
                    ${tagsHtml}
                </div>
                <span class="portfolio-view-link">
                    View Details <i class="fas fa-arrow-right"></i>
                </span>
            </div>
        `;

        // Simple, direct click handler - no dataset, just use closure
        card.onclick = function () {
            if (typeof window.openProjectDetails === 'function') {
                window.openProjectDetails(project);
            } else {
                console.error('openProjectDetails function not found!');
            }
        };

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
        // Achievements events
        socket.on('achievements:created', () => loadAchievements());
        socket.on('achievements:updated', () => loadAchievements());
        socket.on('achievements:deleted', () => loadAchievements());
    }
} catch (e) { }

// Achievements Logic
// Achievements Logic (Marquee Style)
async function loadAchievements() {
    const track = document.getElementById('achievementsTrack');
    if (!track) return;

    try {
        const resp = await fetch((window.API_BASE) + '/api/achievements');
        if (!resp.ok) throw new Error('Failed to load achievements');
        const data = await resp.json();
        const achievements = data.data || data || [];

        track.innerHTML = '';
        if (achievements.length === 0) {
            track.innerHTML = '<p class="loading-text" style="color: var(--text-secondary);">No achievements yet.</p>';
            return;
        }

        const createCard = (ach) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            let img = ach.image || ach.imageUrl || '';
            if (img && img.startsWith('/') && window.API_BASE) img = window.API_BASE + img;

            // Minimalist Card: Image + Caption Overlay
            item.innerHTML = `
                <img src="${img || 'assets/placeholder.jpg'}" alt="${ach.title}" loading="lazy">
                <div class="gallery-caption">${ach.title}</div>
            `;
            return item;
        };

        // Create "Base Set" that is large enough to cover standard screen width
        // If we have few items, repeat them to form a substantial base
        let baseList = [...achievements];
        while (baseList.length < 10) { // Ensure at least 10 items in the base set
            baseList = [...baseList, ...achievements];
        }

        // 1. Append Base Set
        baseList.forEach(ach => {
            track.appendChild(createCard(ach));
        });

        // 2. Append Clones of the Base Set (for seamless loop)
        baseList.forEach(ach => {
            const clone = createCard(ach);
            clone.setAttribute('aria-hidden', 'true');
            track.appendChild(clone);
        });

    } catch (e) {
        console.error(e);
        track.innerHTML = '<p class="loading-text" style="color: #ef4444;">Failed to load achievements.</p>';
    }
}

// Chatbot Logic
// Chatbot Logic
function toggleChatbot() {
    const container = document.getElementById('chatbotContainer');
    if (!container) return;

    container.classList.toggle('active');

    if (container.classList.contains('active')) {
        playClickSound();
        const input = document.getElementById('chatInput');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

// Make Chatbot Draggable
function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById("chatbotHeader");

    if (header) {
        header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";

        // Reset bottom/right to auto so top/left takes precedence
        element.style.bottom = "auto";
        element.style.right = "auto";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Initialize Draggable
document.addEventListener('DOMContentLoaded', () => {
    const chatbotContainer = document.getElementById("chatbotContainer");
    if (chatbotContainer) {
        makeDraggable(chatbotContainer);
    }
});

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatbotMessages');
    const question = input.value.trim();
    if (!question) return;

    // Add User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.style.cssText = 'align-self: flex-end; background: var(--primary-color); color: var(--bg-primary); padding: 10px; border-radius: 10px 10px 0 10px; max-width: 80%;';
    userMsg.textContent = question;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Add Loading
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-message bot loading';
    loadingMsg.style.cssText = 'align-self: flex-start; background: var(--bg-primary); padding: 10px; border-radius: 0 10px 10px 10px; border: 1px solid var(--border-color); max-width: 80%; font-style: italic; color: var(--text-secondary);';
    loadingMsg.textContent = 'Typing...';
    messages.appendChild(loadingMsg);
    messages.scrollTop = messages.scrollHeight;

    try {
        const resp = await fetch((window.API_BASE) + '/api/chatbot/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });
        const data = await resp.json();

        loadingMsg.remove();

        const botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        botMsg.style.cssText = 'align-self: flex-start; background: var(--bg-primary); padding: 10px; border-radius: 0 10px 10px 10px; border: 1px solid var(--border-color); max-width: 80%;';
        botMsg.textContent = data.answer || "I'm not sure how to answer that.";
        messages.appendChild(botMsg);
        playClickSound(); // Interaction feedback
    } catch (e) {
        loadingMsg.remove();
        console.error(e);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'chat-message bot error';
        errorMsg.style.cssText = 'align-self: flex-start; background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 0 10px 10px 10px; max-width: 80%;';
        errorMsg.textContent = "Sorry, I can't connect right now.";
        messages.appendChild(errorMsg);
    }
    messages.scrollTop = messages.scrollHeight;
}

// Analytics Logic
async function trackView() {
    try {
        await fetch((window.API_BASE) + '/api/analytics/view', { method: 'POST' });
        loadViewCount();
    } catch (e) { console.error('Analytics failed', e); }
}

async function loadViewCount() {
    const display = document.getElementById('viewCountDisplay');
    const container = document.getElementById('viewCounter');
    if (!display) return;
    try {
        const resp = await fetch((window.API_BASE) + '/api/analytics/views');
        const data = await resp.json();
        if (data.count !== undefined) {
            display.innerText = data.count + ' Views';
            if (container) container.style.opacity = '1';
        }
    } catch (e) { console.error('Load views failed', e); }
}

const chatInput = document.getElementById('chatInput');
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}
window.toggleChatbot = toggleChatbot;
window.sendMessage = sendMessage;
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

    console.log('Attempting login to:', window.API_BASE + '/api/auth/login');

    fetch((window.API_BASE) + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password })
    }).then(async (r) => {
        const data = await r.json().catch(() => ({}));
        console.log('Login response:', r.status, data);

        if (r.ok) {
            // Save token if available (fallback for cross-site cookie issues)
            if (data.token) {
                localStorage.setItem('admin_token', data.token);
            }
            window.location.href = 'admin.html';
        } else {
            console.warn('Login failed against:', window.API_BASE);
            const serverName = window.API_BASE.includes('localhost') ? 'Local Server' : 'Production Server';
            errorMsg.innerHTML = `${data.message || 'Incorrect password'}<br><small style="opacity:0.7">(${serverName})</small>`;
            playClickSound();
            const box = indexLoginOverlay.querySelector('.login-box');
            if (box) {
                box.style.animation = 'shake 0.5s';
                setTimeout(() => box.style.animation = '', 500);
            }
        }
    }).catch(err => {
        console.error('Login error:', err);
        const serverName = window.API_BASE.includes('localhost') ? 'Local Server' : 'Production Server';
        errorMsg.innerHTML = `Login failed. Check server connection.<br><small style="opacity:0.7">(${serverName})</small>`;
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


// Load Featured Projects
async function loadFeaturedProjects() {
    const portfolioGrid = document.getElementById('portfolioGrid');
    if (!portfolioGrid) return;

    try {
        const response = await fetch((window.API_BASE) + '/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');

        const data = await response.json();
        const projects = data.data || data || [];

        // Filter only featured projects
        const featuredProjects = projects.filter(p => p.featured === true);

        portfolioGrid.innerHTML = '';

        if (featuredProjects.length === 0) {
            portfolioGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No featured projects yet.</p>';
            return;
        }

        featuredProjects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'portfolio-card';

            // Minimalist Content
            // Handle array of images or single image property
            let imageUrl = project.image;
            if (!imageUrl && project.images && project.images.length > 0) {
                imageUrl = project.images[0].url;
            }
            if (!imageUrl) {
                imageUrl = 'https://placehold.co/600x400?text=No+Image';
            }

            // Tech Stack (Handle tags or skills)
            const techItems = (project.tags || project.skills || []);
            const techStackHTML = techItems.slice(0, 3).map(tag =>
                `<span class="tech-tag">${tag}</span>`
            ).join('');

            card.innerHTML = `
                <div class="portfolio-image">
                    <img src="${imageUrl}" alt="${project.title}" onerror="this.src='https://placehold.co/600x400?text=Error'">
                </div>
                <div class="portfolio-content">
                    <h3 class="portfolio-title">${project.title}</h3>
                    <p class="portfolio-description">${project.description || 'No description available.'}</p>
                    <div class="portfolio-tech">
                        ${techStackHTML}
                    </div>
                    <button class="btn-card">View Details <i class="fas fa-arrow-right"></i></button>
                </div>
            `;

            // Add click event to open new modal with FULL project data
            card.onclick = () => openProjectModal(project);

            portfolioGrid.appendChild(card);
        });

        // Initialize Carousel functionality
        const prevBtn = document.getElementById('prevProjectBtn');
        const nextBtn = document.getElementById('nextProjectBtn');

        if (prevBtn && nextBtn && portfolioGrid) {
            prevBtn.onclick = () => {
                portfolioGrid.scrollBy({ left: -320, behavior: 'smooth' });
            };
            nextBtn.onclick = () => {
                portfolioGrid.scrollBy({ left: 320, behavior: 'smooth' });
            };
        } else {
            console.error('Carousel elements not found:', { prevBtn, nextBtn, portfolioGrid });
        }

        // Force Loader Hide (Robust Fix)
        const loader = document.getElementById('loader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
                loader.style.pointerEvents = 'none'; // Force fallback
            }, 1000); // 1s delay max
        }

    } catch (error) {
        console.error('Failed to load projects:', error);
        portfolioGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">Failed to load projects.</p>';
    }
}

// Minimalist Project Modal Logic
function openProjectModal(project) {
    const modal = document.getElementById('projectModal');
    if (!modal) return;

    // Ensure modal is direct child of body for z-index
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    // Populate Data
    // Robust image check
    let imageUrl = project.image;
    if (!imageUrl && project.images && project.images.length > 0) {
        imageUrl = project.images[0].url;
    }
    if (!imageUrl) {
        imageUrl = 'https://placehold.co/800x400?text=No+Image';
    }

    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalImage').onerror = function () { this.src = 'https://placehold.co/800x400?text=Error'; };

    document.getElementById('modalTitle').textContent = project.title;
    document.getElementById('modalDescription').innerText = project.description || 'No description provided.';
    const liveLinkBtn = document.getElementById('modalLiveLink');
    if (project.link) {
        let linkUrl = project.link;
        if (!linkUrl.startsWith('http')) {
            linkUrl = 'https://' + linkUrl;
        }
        liveLinkBtn.href = linkUrl;
        liveLinkBtn.style.display = 'inline-flex';
    } else {
        liveLinkBtn.style.display = 'none';
    }

    // Tech Stack in Modal (Handle tags or skills)
    const techItems = (project.tags || project.skills || []);
    const techContainer = document.getElementById('modalTechStack');
    techContainer.innerHTML = techItems.map(tag =>
        `<span class="modal-tech-tag">${tag}</span>`
    ).join('');

    // Show Modal with forced styles
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('projectModal');
    if (event.target === modal) {
        closeProjectModal();
    }
};

// Expose globally
window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;



// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadFeaturedProjects();
});

// Scroll Animation Logic
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // observer.unobserve(entry.target); // Optional: Stop observing once visible
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// Global exposure
window.handleScrollAnimations = handleScrollAnimations;

// Initial call
document.addEventListener('DOMContentLoaded', () => {
    handleScrollAnimations();
    // Re-check after a short delay to account for dynamic content
    setTimeout(handleScrollAnimations, 500);
});

// Resume Download
async function downloadCV() {
    const btn = document.querySelector('button[onclick="downloadCV()"]');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        const url = (window.API_BASE || '') + '/api/resume';
        const response = await fetch(url);

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            // Check data.url or data.data.url based on screenshot structure
            const resumeUrl = data.url || (data.data && data.data.url);

            if (resumeUrl) {
                window.open(resumeUrl, '_blank');
            } else {
                console.warn("No URL in JSON response, opening endpoint directly");
                window.open(url, '_blank');
            }
        } else {
            // It's likely a file stream (PDF), open it directly
            window.open(url, '_blank');
        }
    } catch (e) {
        console.error("Resume download failed, trying direct link", e);
        window.open((window.API_BASE || '') + '/api/resume', '_blank');
    } finally {
        if (btn) btn.innerHTML = originalText;
    }
}
window.downloadCV = downloadCV;

// Aggressive Loader Removal
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader && !loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
        loader.style.pointerEvents = 'none';

        // Remove from flow after transition
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// Try hiding immediately on DOM ready (for fast interactivity)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideLoader);
} else {
    hideLoader();
}

// Ensure hidden on full load (fallback)
window.addEventListener('load', hideLoader);

// Ensure modal is hidden on load
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }

    // Scroll-aware Dock Visibility
    let lastScrollTop = 0;
    const dockContainer = document.querySelector('.ui-dock-container');

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down & past top
            dockContainer?.classList.add('dock-hidden');
        } else {
            // Scrolling up
            dockContainer?.classList.remove('dock-hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, { passive: true });
});
