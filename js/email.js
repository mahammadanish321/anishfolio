document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (typeof playClickSound === 'function') playClickSound();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;

        // Get values
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();

        // Validation
        if (!name || !email || !subject || !message) {
            if (typeof showNotification === 'function') showNotification("Please fill in all fields!");
            return;
        }
        // ── Email Validation ─────────────────────────────────────────
        const DISPOSABLE_DOMAINS = new Set([
            'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
            'tempmail.com', 'temp-mail.org', 'throwam.com', 'throwam.net', '10minutemail.com',
            '10minutemail.net', 'yopmail.com', 'yopmail.net', 'sharklasers.com', 'guerrillamailblock.com',
            'grr.la', 'guerrillamail.info', 'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net',
            'trashmail.at', 'trashmail.io', 'trashmail.org', 'dispostable.com', 'mailnull.com',
            'spamgourmet.com', 'spamgourmet.net', 'maildrop.cc', 'mailnesia.com', 'getairmail.com',
            'fakeinbox.com', 'spamhereplease.com', 'discard.email', 'spambog.com', 'spamfree24.org',
            'spamgob.com', 'spamthisplease.com', 'mailnew.com', 'mailscrap.com', 'mailsiphon.com',
        ]);

        function validateEmail(email) {
            // 1. Strict format check
            const strictRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
            if (!strictRegex.test(email)) return "Please enter a valid email address.";

            const [local, domain] = email.toLowerCase().split('@');
            const tld = domain.split('.').pop();

            // 2. TLD must be at least 2 chars and not all same letters
            if (tld.length < 2 || /^(.)\1+$/.test(tld)) return "Please enter a real email address.";

            // 3. Block disposable domains
            if (DISPOSABLE_DOMAINS.has(domain)) return "Disposable/temporary emails are not allowed.";

            // 4. Block obviously fake patterns (e.g. aaa@bbb.com, test@test.com, abc@abc.com)
            const localCore = local.replace(/[^a-z]/g, '');
            const domainCore = domain.split('.')[0];
            if (localCore === domainCore) return "Please use a real email address.";
            if (/^(.)\1{2,}$/.test(localCore)) return "Please enter a valid email address.";
            if (['test', 'fake', 'asdf', 'qwerty', 'example', 'noreply', 'no-reply', 'temp', 'trash', 'spam', 'dummy'].includes(localCore)) {
                return "Please use your real email address.";
            }

            return null; // valid
        }
        // ─────────────────────────────────────────────────────────────

        const emailError = validateEmail(email);
        if (emailError) {
            if (typeof showNotification === 'function') showNotification(emailError);
            return;
        }

        // Set loading state
        submitBtn.innerHTML = '<i class="ph ph-circle-notch"></i> Sending...';
        submitBtn.disabled = true;
        submitBtn.style.cursor = 'not-allowed';

        try {
            const res = await fetch(`${window.API_BASE}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message }),
            });

            const result = await res.json();

            if (result.success) {
                if (typeof showNotification === 'function') showNotification("✅ Message sent! I'll get back to you soon.");
                form.reset();
            } else {
                if (typeof showNotification === 'function') showNotification("❌ " + (result.error || "Failed to send. Please try again."));
            }
        } catch (err) {
            console.error("Contact form error:", err);
            if (typeof showNotification === 'function') showNotification("❌ Something went wrong. Please try again.");
        } finally {
            submitBtn.innerHTML = originalBtnHTML;
            submitBtn.disabled = false;
            submitBtn.style.cursor = 'pointer';
        }
    });
});
