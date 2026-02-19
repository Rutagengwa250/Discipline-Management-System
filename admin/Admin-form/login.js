document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const messageDiv = document.getElementById('message');

    // ==================== NETWORK UTILITY FUNCTIONS ====================

    // Get base URL for API calls (handles mobile network access)
    function getBaseURL() {
        // For mobile access, use the current hostname and port
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // If accessing from mobile on different network, use current location
        let baseURL = `${protocol}//${hostname}`;
        if (port && port !== '80' && port !== '443') {
            baseURL += `:${port}`;
        }
        
        console.log('📱 Using base URL:', baseURL);
        return baseURL;
    }

    // Enhanced fetch with better error handling for mobile
    async function mobileFetch(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${getBaseURL()}${url}`;
        
        console.log('📱 Mobile Fetch:', {
            url: fullUrl,
            method: options.method || 'GET',
            isMobile: /mobile|android|iphone|ipad/i.test(navigator.userAgent)
        });

        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                timeout: 30000 // 30 second timeout for mobile
            });

            console.log('📱 Mobile Response:', {
                status: response.status,
                statusText: response.statusText,
                url: fullUrl
            });

            if (!response.ok) {
                let errorMessage = `Network error: ${response.status} ${response.statusText}`;
                
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use status text
                }
                
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error('📱 Mobile Fetch Error:', error);
            
            // Enhanced mobile-friendly error messages
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Cannot connect to server. Please check:\n• Your internet connection\n• Server is running\n• Firewall settings');
            }
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Please check your connection and try again.');
            }
            
            throw error;
        }
    }

    // Test server connectivity with better mobile diagnostics
    async function testServerConnectivity() {
        try {
            console.log('🔍 Testing server connectivity...');
            console.log('📱 User Agent:', navigator.userAgent);
            console.log('📍 Current URL:', window.location.href);
            console.log('🌐 Base URL:', getBaseURL());

            const response = await fetch(`${getBaseURL()}/api/network-test`);
            const data = await response.json();
            
            console.log('✅ Server connectivity test:', data);
            return true;
        } catch (error) {
            console.error('❌ Server connectivity failed:', error);
            
            // Show mobile-friendly connection error
            showMessage(messageDiv, 
                'Cannot connect to server. Please ensure:\n• Server is running on port 5000\n• You are using the correct IP address\n• Both devices are on same network', 
                'error'
            );
            return false;
        }
    }

    // ==================== OTP UTILITY FUNCTIONS ====================
    // (OTP verification removed)

    // Set loading state
    function setLoading(element, textElement, spinner, isLoading) {
        if (isLoading) {
            textElement.textContent = 'Loading...';
            spinner.style.display = 'inline-block';
            element.disabled = true;
        } else {
            textElement.textContent = textElement === btnText ? 'Login' : 'Verify';
            spinner.style.display = 'none';
            element.disabled = false;
        }
    }

    // Show message with animation
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `${type} animated fadeIn`;
        element.style.display = 'block';
        
        // Handle multi-line messages for mobile
        element.style.whiteSpace = 'pre-line';
        
        // Add shake animation for errors
        if (type === 'error') {
            element.classList.add('shake');
            setTimeout(() => element.classList.remove('shake'), 500);
        }
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 8000); // Longer timeout for mobile users to read
    }

    // Complete login process - no OTP verification needed
    function completeLogin(data) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on role
        let redirectPath = '/dashboard.html';
        if (data.user.role === 'admin') {
            redirectPath = '/profile-page.html';
        } else if (data.user.role === 'teacher') {
            redirectPath = '/teacher-dashboard.html';
        } else if (data.user.role === 'director') {
            redirectPath = '/director-dashboard.html';
        }
            
        console.log('✅ Login successful, redirecting to:', redirectPath);
        
        // Use absolute URL for mobile redirect
        const fullRedirectUrl = `${getBaseURL()}${redirectPath}`;
        console.log('📱 Full redirect URL:', fullRedirectUrl);
        
        window.location.href = redirectPath; // Use relative path for same origin
    }

    // ==================== EVENT LISTENERS ====================

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showMessage(messageDiv, 'Please enter both username and password', 'error');
            return;
        }
        
        setLoading(loginBtn, btnText, loadingSpinner, true);
        
        try {
            console.log('📱 Attempting login for user:', username);
            
            const data = await mobileFetch('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            console.log('✅ Login response received:', data);
            
            // Direct login - no OTP required
            completeLogin(data);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            
            // Enhanced mobile-friendly error messages
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Cannot connect to server. Please check:\n• Server is running\n• Your network connection\n• You are using the correct IP address';
            }
            
            showMessage(messageDiv, errorMessage, 'error');
        } finally {
            setLoading(loginBtn, btnText, loadingSpinner, false);
        }
    });

    // Close modal when clicking outside (removed - no OTP modal)
    
    // ==================== INITIALIZATION ====================

    // Test connectivity on page load
    console.log('🚀 Login system initializing...');
    console.log('📱 Mobile detection:', /mobile|android|iphone|ipad/i.test(navigator.userAgent));
    console.log('📍 Current location:', window.location.href);
    
    // Run connectivity test
    setTimeout(() => {
        testServerConnectivity();
    }, 1000);

    // Add network status indicator
    function updateNetworkStatus() {
        const isOnline = navigator.onLine;
        console.log('🌐 Network status:', isOnline ? 'Online' : 'Offline');
        
        if (!isOnline) {
            showMessage(messageDiv, 'You are currently offline. Please check your internet connection.', 'error');
        }
    }

    // Listen for network status changes
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus();

    console.log('✅ Login system fully initialized');
});

// Add this CSS for better mobile display (add to your CSS file or style tag)
const mobileStyles = `
@media (max-width: 768px) {
    .message {
        font-size: 14px;
        line-height: 1.4;
        padding: 10px;
        margin: 10px 0;
    }
    
    #loginForm {
        padding: 20px;
    }
    
    .otp-input {
        width: 40px;
        height: 50px;
        font-size: 18px;
    }
}

.message {
    white-space: pre-line;
    word-wrap: break-word;
}
`;

// Inject mobile styles
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileStyles;
document.head.appendChild(styleSheet);