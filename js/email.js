// Initialize EmailJS
(function () {
    emailjs.init("kLWJbqh653bYHrjBl");
})();

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");

    // Configuration
    const EMAILJS_SERVICE_ID = "service_kqv54w5";
    const EMAILJS_TEMPLATE_ID = "template_ycvandu";

    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Play sound if available
        if (typeof playClickSound === 'function') playClickSound();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        // Get values
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();

        // Validation
        if (!name || !email || !subject || !message) {
            if (typeof showNotification === 'function') {
                showNotification("Please fill in all fields!");
            }
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (typeof showNotification === 'function') {
                showNotification('Please enter a valid email address.');
            }
            return;
        }

        // Set loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'not-allowed';

        const templateParams = {
            name: name,
            email: email,
            title: subject,
            message: message,
        };

        emailjs
            .send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            )
            .then(
                () => {
                    if (typeof showNotification === 'function') {
                        showNotification("Message sent successfully");
                    }
                    form.reset();
                },
                (error) => {
                    console.error("EmailJS Error:", error);
                    if (typeof showNotification === 'function') {
                        showNotification("Failed to send message. Please check console.");
                    }
                }
            )
            .finally(() => {
                // Reset button state
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                submitBtn.style.cursor = 'pointer';
            });
    });
});
