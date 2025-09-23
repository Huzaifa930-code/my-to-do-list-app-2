// Two-Factor Authentication functionality
class TwoFactorAuth {
    constructor() {
        this.currentEmail = null;
        this.emailCode = null;
        this.authSecret = null;
        this.emailCodeTimer = null;
        this.initializeEvents();
    }

    initializeEvents() {
        // Tab switching
        const emailTab = document.getElementById('emailTab');
        const authTab = document.getElementById('authTab');

        if (emailTab) {
            emailTab.addEventListener('click', () => this.switchToEmailMethod());
        }

        if (authTab) {
            authTab.addEventListener('click', () => this.switchToAuthMethod());
        }

        // 2FA verification
        const verifyBtn = document.getElementById('verifyBtn');
        const backBtn = document.getElementById('backBtn');
        const resendEmailBtn = document.getElementById('resendEmailBtn');

        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => this.verify2FA());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.backToLogin());
        }

        if (resendEmailBtn) {
            resendEmailBtn.addEventListener('click', () => this.resendEmailCode());
        }

        // Auto-format input codes
        const emailCodeInput = document.getElementById('emailCodeInput');
        const authCodeInput = document.getElementById('authCodeInput');

        if (emailCodeInput) {
            emailCodeInput.addEventListener('input', (e) => this.formatCodeInput(e));
            emailCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.verify2FA();
            });
        }

        if (authCodeInput) {
            authCodeInput.addEventListener('input', (e) => this.formatCodeInput(e));
            authCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.verify2FA();
            });
        }
    }

    // Show 2FA step after successful email/password
    show2FAStep(email) {
        this.currentEmail = email;

        const step1Form = document.getElementById('step1Form');
        const step2Form = document.getElementById('step2Form');
        const userEmailSpan = document.getElementById('userEmail');

        if (step1Form) step1Form.style.display = 'none';
        if (step2Form) step2Form.style.display = 'block';
        if (userEmailSpan) userEmailSpan.textContent = email;

        // Generate and "send" email code
        this.generateEmailCode();

        // Setup Google Authenticator if first time
        this.setupGoogleAuth();

        // Focus on email code input
        setTimeout(() => {
            const emailCodeInput = document.getElementById('emailCodeInput');
            if (emailCodeInput) emailCodeInput.focus();
        }, 100);
    }

    // Switch between 2FA methods
    switchToEmailMethod() {
        this.setActiveTab('email');
        const emailMethod = document.getElementById('emailMethod');
        const authMethod = document.getElementById('authMethod');

        if (emailMethod) emailMethod.style.display = 'block';
        if (authMethod) authMethod.style.display = 'none';

        setTimeout(() => {
            const emailCodeInput = document.getElementById('emailCodeInput');
            if (emailCodeInput) emailCodeInput.focus();
        }, 100);
    }

    switchToAuthMethod() {
        this.setActiveTab('auth');
        const emailMethod = document.getElementById('emailMethod');
        const authMethod = document.getElementById('authMethod');

        if (emailMethod) emailMethod.style.display = 'none';
        if (authMethod) authMethod.style.display = 'block';

        setTimeout(() => {
            const authCodeInput = document.getElementById('authCodeInput');
            if (authCodeInput) authCodeInput.focus();
        }, 100);
    }

    setActiveTab(method) {
        const emailTab = document.getElementById('emailTab');
        const authTab = document.getElementById('authTab');

        if (emailTab && authTab) {
            emailTab.classList.toggle('active', method === 'email');
            authTab.classList.toggle('active', method === 'auth');
        }
    }

    // Generate email verification code
    generateEmailCode() {
        this.emailCode = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('📧 Email 2FA Code: ' + this.emailCode); // Demo - in real app, send via email

        // Show success message
        this.showEmailSentNotification();
    }

    showEmailSentNotification() {
        // Create notification for demo
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 15px 20px; border-radius: 10px; z-index: 10000; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); animation: slideIn 0.3s ease-out;';
        notification.innerHTML = '<strong>📧 Code Sent!</strong><br>Check console for demo code: <strong>' + this.emailCode + '</strong>';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Setup Google Authenticator
    setupGoogleAuth() {
        // Generate a secret for demo (in real app, this would be stored securely)
        if (!this.authSecret) {
            this.authSecret = this.generateSecret();
        }

        const setupKey = document.getElementById('setupKey');
        const qrSetup = document.getElementById('qrSetup');

        if (setupKey) {
            setupKey.textContent = this.authSecret;
        }

        // Show QR setup for first-time users
        const hasSetupAuth = localStorage.getItem('auth_setup_' + this.currentEmail);
        if (!hasSetupAuth && qrSetup) {
            qrSetup.style.display = 'block';
        }
    }

    generateSecret() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }

    // Resend email code
    resendEmailCode() {
        this.generateEmailCode();

        const resendBtn = document.getElementById('resendEmailBtn');
        if (resendBtn) {
            resendBtn.disabled = true;
            resendBtn.textContent = 'Code Sent!';

            setTimeout(() => {
                resendBtn.disabled = false;
                resendBtn.textContent = 'Resend Code';
            }, 30000); // 30 second cooldown
        }
    }

    // Format code input (digits only, max 6)
    formatCodeInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 6) value = value.slice(0, 6);
        e.target.value = value;
    }

    // Verify 2FA code
    verify2FA() {
        const emailMethod = document.getElementById('emailMethod');
        const authMethod = document.getElementById('authMethod');

        let code = '';
        let method = '';

        if (emailMethod && emailMethod.style.display !== 'none') {
            code = document.getElementById('emailCodeInput').value.trim();
            method = 'email';
        } else if (authMethod && authMethod.style.display !== 'none') {
            code = document.getElementById('authCodeInput').value.trim();
            method = 'auth';
        }

        if (!code || code.length !== 6) {
            this.show2FAError('Please enter a 6-digit verification code');
            return;
        }

        if (method === 'email') {
            this.verifyEmailCode(code);
        } else if (method === 'auth') {
            this.verifyAuthCode(code);
        }
    }

    verifyEmailCode(code) {
        if (code === this.emailCode) {
            this.complete2FA();
        } else {
            this.show2FAError('Invalid email verification code. Check your email or try again.');
        }
    }

    verifyAuthCode(code) {
        // Simple demo validation (in real app, use TOTP library)
        const currentTime = Math.floor(Date.now() / 1000 / 30); // 30-second window
        const validCodes = [
            this.generateTOTP(currentTime),
            this.generateTOTP(currentTime - 1), // Previous window
            this.generateTOTP(currentTime + 1)  // Next window
        ];

        if (validCodes.includes(code)) {
            localStorage.setItem('auth_setup_' + this.currentEmail, 'true');
            this.complete2FA();
        } else {
            this.show2FAError('Invalid authenticator code. Please try again.');
        }
    }

    // Simple TOTP generation for demo (use proper TOTP library in production)
    generateTOTP(timeWindow) {
        const hash = this.simpleHash(this.authSecret + timeWindow);
        return (hash % 1000000).toString().padStart(6, '0');
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    complete2FA() {
        // 2FA verification successful
        console.log('✅ 2FA verification successful');

        // Trigger the auth manager to complete login
        if (window.auth) {
            window.auth.complete2FALogin(this.currentEmail);
        }

        this.reset2FA();
    }

    show2FAError(message) {
        let errorDiv = document.getElementById('twofa-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'twofa-error';
            errorDiv.style.cssText = 'background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 12px 16px; border-radius: 8px; margin-top: 15px; font-size: 14px; text-align: center; animation: slideIn 0.3s ease-out;';
            const step2Form = document.getElementById('step2Form');
            if (step2Form) step2Form.appendChild(errorDiv);
        }

        errorDiv.textContent = message;

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    backToLogin() {
        const step1Form = document.getElementById('step1Form');
        const step2Form = document.getElementById('step2Form');

        if (step1Form) step1Form.style.display = 'block';
        if (step2Form) step2Form.style.display = 'none';

        this.reset2FA();

        // Focus on email input
        setTimeout(() => {
            const emailInput = document.getElementById('emailInput');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    reset2FA() {
        this.currentEmail = null;
        this.emailCode = null;

        // Clear inputs
        const emailCodeInput = document.getElementById('emailCodeInput');
        const authCodeInput = document.getElementById('authCodeInput');

        if (emailCodeInput) emailCodeInput.value = '';
        if (authCodeInput) authCodeInput.value = '';

        // Reset to email method
        this.switchToEmailMethod();

        // Clear any error messages
        const errorDiv = document.getElementById('twofa-error');
        if (errorDiv) errorDiv.remove();
    }

    // Get current demo authenticator code (for testing)
    getCurrentAuthCode() {
        if (!this.authSecret) return null;
        const currentTime = Math.floor(Date.now() / 1000 / 30);
        return this.generateTOTP(currentTime);
    }
}

// Initialize 2FA when DOM is loaded
let twoFA;
document.addEventListener('DOMContentLoaded', () => {
    twoFA = new TwoFactorAuth();

    // Expose for testing
    window.twoFA = twoFA;

    // Show current auth code in console for demo
    setInterval(() => {
        if (twoFA.authSecret) {
            console.log('🔐 Current Auth Code: ' + twoFA.getCurrentAuthCode());
        }
    }, 30000);
});