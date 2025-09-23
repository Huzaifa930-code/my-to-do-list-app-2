// Authentication functionality for TodoApp
class AuthManager {
    constructor(app) {
        this.app = app;
        this.currentUser = null;
        this.isLoggedIn = false;
        this.initializeAuth();
    }

    initializeAuth() {
        // Check for existing session
        const savedUser = localStorage.getItem('todoapp_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isLoggedIn = true;
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }

        this.bindAuthEvents();
    }

    bindAuthEvents() {
        console.log('🔗 Binding auth events...');
        const loginBtn = document.getElementById('loginBtn');
        const guestBtn = document.getElementById('guestBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');

        console.log('Found elements:', { loginBtn, guestBtn, logoutBtn, emailInput, passwordInput });

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                console.log('🚀 Login button clicked');
                this.handleLogin();
            });
        }

        if (guestBtn) {
            guestBtn.addEventListener('click', () => {
                console.log('👤 Guest button clicked');
                this.handleGuestLogin();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        }
    }

handleLogin() {
        console.log('🚀 Login attempt started');
        const email = document.getElementById("emailInput").value.trim();
        const password = document.getElementById("passwordInput").value;

        console.log('📝 Input values:', {
            email: `"${email}"`,
            password: `"${password}"`,
            emailLength: email.length,
            passwordLength: password.length
        });

        if (!email) {
            console.log('❌ No email provided');
            this.showAuthError("Please enter an email address");
            return;
        }

        if (!password) {
            console.log('❌ No password provided');
            this.showAuthError("Please enter a password");
            return;
        }

        console.log('🔍 Checking credentials...');
        console.log('Expected email: "admin@todo.com"');
        console.log('Expected password: "password"');
        console.log('Email match:', email === "admin@todo.com");
        console.log('Password match:', password === "password");

        // Simple demo authentication
        if (email === "admin@todo.com" && password === "password") {
            console.log('✅ Credentials valid, proceeding to 2FA');
            // First step passed, now show 2FA
            if (window.twoFA) {
                window.twoFA.show2FAStep(email);
            } else {
                console.log('❌ 2FA not available');
            }
        } else {
            console.log('❌ Invalid credentials');
            this.showAuthError("Invalid credentials. Try admin@todo.com/password");
        }
    }

    // Called by 2FA system after successful verification
    complete2FALogin(email) {
        this.currentUser = {
            email: email,
            username: email.split("@")[0],
            displayName: "Administrator",
            loginTime: new Date().toISOString()
        };
        this.isLoggedIn = true;
        localStorage.setItem("todoapp_user", JSON.stringify(this.currentUser));
        this.showMainApp();
    }

    handleGuestLogin() {
        console.log('👤 Handling guest login...');
        this.currentUser = {
            username: 'guest',
            displayName: 'Guest User',
            loginTime: new Date().toISOString()
        };
        this.isLoggedIn = true;
        console.log('👤 Guest user set:', this.currentUser);
        // Don't save guest session to localStorage
        this.showMainApp();
    }

    handleLogout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('todoapp_user');
        
        // Clear form
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        this.showLoginScreen();
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        
        // Focus username input
        setTimeout(() => {
            const emailInput = document.getElementById('emailInput');
            if (emailInput) emailInput.focus();
        }, 100);
    }

    showMainApp() {
        console.log('🏠 Showing main app...');
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');

        console.log('Found elements:', { loginScreen, mainApp });

        if (loginScreen) {
            loginScreen.style.display = 'none';
            console.log('✅ Login screen hidden');
        }
        if (mainApp) {
            mainApp.style.display = 'block';
            console.log('✅ Main app shown');
        }

        // Update welcome message
        const userWelcome = document.getElementById('userWelcome');
        if (userWelcome && this.currentUser) {
            userWelcome.textContent = `Welcome, ${this.currentUser.displayName}!`;
            console.log('✅ Welcome message updated');
        }

        // Initialize the main app if not already done
        if (this.app && typeof this.app.initializeApp === 'function') {
            console.log('🚀 Initializing main app...');
            this.app.initializeApp();
        }
    }

    showAuthError(message) {
        // Create or update error message
        let errorDiv = document.getElementById('auth-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'auth-error';
            errorDiv.style.cssText = `
                background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
                color: white;
                padding: 10px 15px;
                border-radius: 6px;
                margin-top: 15px;
                font-size: 14px;
                text-align: center;
                animation: slideIn 0.3s ease-out;
            `;
            const loginForm = document.querySelector('.login-form');
            if (loginForm) loginForm.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 4000);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}
