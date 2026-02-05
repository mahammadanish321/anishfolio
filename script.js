// Performance optimized variables
let isInitialized = false;
let scrollTimeout = null;
let audioContext = null;

// Initialize Audio Context for click sounds
function initAudioContext() {
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }
}

// Optimized Click Sound Effect
function playClickSound() {
    if (!audioContext) return;

    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.warn('Sound playback failed:', error);
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
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => {
            loader.remove(); // Remove from DOM to free memory
            if (!isInitialized) {
                startAnimations();
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

// Portfolio horizontal scroll functionality with touch support
const portfolioScroll = document.querySelector('.portfolio-scroll');
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

if (portfolioScroll && scrollLeftBtn && scrollRightBtn) {
    const cardWidth = 380; // Card width + gap

    scrollLeftBtn.addEventListener('click', (e) => {
        e.preventDefault();
        playClickSound();
        portfolioScroll.scrollBy({
            left: -cardWidth,
            behavior: 'smooth'
        });
    });

    scrollRightBtn.addEventListener('click', (e) => {
        e.preventDefault();
        playClickSound();
        portfolioScroll.scrollBy({
            left: cardWidth,
            behavior: 'smooth'
        });
    });

    // Update scroll buttons based on scroll position
    function updateScrollButtons() {
        const scrollLeft = portfolioScroll.scrollLeft;
        const maxScroll = portfolioScroll.scrollWidth - portfolioScroll.clientWidth;

        scrollLeftBtn.style.opacity = scrollLeft > 0 ? '1' : '0.5';
        scrollRightBtn.style.opacity = scrollLeft < maxScroll ? '1' : '0.5';
        scrollLeftBtn.disabled = scrollLeft <= 0;
        scrollRightBtn.disabled = scrollLeft >= maxScroll;
    }

    portfolioScroll.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();

    // Touch/swipe support
    let isDown = false;
    let startX;
    let scrollLeftStart;

    portfolioScroll.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - portfolioScroll.offsetLeft;
        scrollLeftStart = portfolioScroll.scrollLeft;
        portfolioScroll.style.cursor = 'grabbing';
    });

    portfolioScroll.addEventListener('mouseleave', () => {
        isDown = false;
        portfolioScroll.style.cursor = 'grab';
    });

    portfolioScroll.addEventListener('mouseup', () => {
        isDown = false;
        portfolioScroll.style.cursor = 'grab';
    });

    portfolioScroll.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - portfolioScroll.offsetLeft;
        const walk = (x - startX) * 2;
        portfolioScroll.scrollLeft = scrollLeftStart - walk;
    });
}

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