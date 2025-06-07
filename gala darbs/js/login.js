
import { UserDB } from '../db/database.js';


if (UserDB.isLoggedIn()) {
    window.location.href = 'dashboard.html';
}


const showError = (message) => {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
};


const showSuccess = (message) => {
    const successElement = document.getElementById('loginSuccess');
    successElement.textContent = message;
    successElement.style.display = 'block';
};


const hideMessages = () => {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginSuccess').style.display = 'none';
};


const handleLogin = (e) => {
    e.preventDefault();
    hideMessages();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    
    const user = {
        id: '1',
        email: email,
        fullName: email.split('@')[0], 
        role: 'user'
    };
    
    
    UserDB.setCurrentUser(user);
    UserDB.setLoginStatus(true);
    
    showSuccess('Login successful! Redirecting...');
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1000);
};

// Handle social login
const handleSocialLogin = (provider) => {
    // In a real app, this would handle OAuth authentication
    console.log(`Logging in with ${provider}...`);
    showError('Social login not implemented in this demo');
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Social login buttons
    document.getElementById('googleLogin').addEventListener('click', () => handleSocialLogin('Google'));
    document.getElementById('facebookLogin').addEventListener('click', () => handleSocialLogin('Facebook'));
    
    // Clear messages when form fields change
    const formInputs = document.querySelectorAll('#loginForm input');
    formInputs.forEach(input => {
        input.addEventListener('input', hideMessages);
    });
}); 