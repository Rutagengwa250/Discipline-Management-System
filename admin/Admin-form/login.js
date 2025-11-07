document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const messageDiv = document.getElementById('message');
    
    // OTP Elements
    const otpModal = document.getElementById('otpModal');
    const otpForm = document.getElementById('otpForm');
    const otpInputs = document.querySelectorAll('.otp-input');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const otpBtnText = document.getElementById('otpBtnText');
    const otpLoadingSpinner = document.getElementById('otpLoadingSpinner');
    const otpMessage = document.getElementById('otpMessage');
    const resendOtpLink = document.getElementById('resendOtp');
    const countdownElement = document.getElementById('countdown');
    
    let tempToken = null;
    let countdownInterval = null;
    let countdownTime = 60;

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

    // Initialize OTP inputs
    function initOTPInputs() {
        otpInputs.forEach((input, index) => {
            // Handle input
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                // Only allow numbers
                if (!/^\d*$/.test(value)) {
                    input.value = value.replace(/\D/g, '');
                    return;
                }
                
                if (input.value.length === 1 && index < 5) {
                    otpInputs[index + 1].focus();
                }
                // Auto-submit when last digit is entered
                if (index === 5 && input.value.length === 1) {
                    setTimeout(() => otpForm.dispatchEvent(new Event('submit')), 100);
                }
            });
            
            // Handle backspace
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            // Handle paste
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text').trim();
                if (/^\d{6}$/.test(pasteData)) {
                    otpInputs.forEach((input, i) => {
                        input.value = pasteData[i] || '';
                    });
                    otpInputs[5].focus();
                }
            });
        });
    }

    // Start countdown timer (10 minutes)
    function startCountdown() {
        clearInterval(countdownInterval);
        countdownTime = 600; // 10 minutes in seconds
        updateCountdown();
        resendOtpLink.classList.add('disabled');
        resendOtpLink.style.pointerEvents = 'none';
        
        countdownInterval = setInterval(() => {
            countdownTime--;
            updateCountdown();
            
            if (countdownTime <= 0) {
                clearInterval(countdownInterval);
                resendOtpLink.classList.remove('disabled');
                resendOtpLink.style.pointerEvents = 'auto';
                countdownElement.textContent = '';
            }
        }, 1000);
    }

    // Update countdown display
    function updateCountdown() {
        const minutes = Math.floor(countdownTime / 60);
        const seconds = countdownTime % 60;
        countdownElement.textContent = `(${minutes}:${seconds < 10 ? '0' : ''}${seconds})`;
    }

    // Get full OTP code
    function getOTP() {
        return Array.from(otpInputs).map(input => input.value).join('');
    }

    // Reset OTP inputs
    function resetOTPInputs() {
        otpInputs.forEach(input => {
            input.value = '';
        });
        otpInputs[0].focus();
    }

    // Show OTP modal
    function showOTPModal() {
        resetOTPInputs();
        startCountdown();
        otpModal.style.display = 'flex';
        otpInputs[0].focus();
    }

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

    // Complete login process
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

    // OTP verification function
    async function verifyOTP(otp) {
        try {
            const data = await mobileFetch('/verify-otp', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ otp })
            });

            return data;
            
        } catch (error) {
            console.error('OTP Verification Error:', error);
            throw error;
        }
    }

    // ==================== EVENT LISTENERS ====================

    // Initialize OTP inputs
    initOTPInputs();

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
            
            if (data.tempToken) {
                // OTP required for admin/director
                tempToken = data.tempToken;
                showOTPModal();
                
                // Debug log - show OTP in console for testing
                if (data.debugOtp) {
                    console.log('🔐 DEBUG OTP (for testing):', data.debugOtp);
                    // Optional: Auto-fill for testing (remove in production)
                    // setTimeout(() => {
                    //     otpInputs.forEach((input, index) => {
                    //         input.value = data.debugOtp[index];
                    //     });
                    // }, 1000);
                }
                
                showMessage(messageDiv, 'OTP sent to your email. Please check your inbox.', 'success');
            } else {
                // Regular users get token directly
                completeLogin(data);
            }
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

    // OTP form submit handler
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const otp = getOTP();
        
        if (otp.length !== 6) {
            showMessage(otpMessage, 'Please enter a complete 6-digit code', 'error');
            return;
        }

        setLoading(verifyOtpBtn, otpBtnText, otpLoadingSpinner, true);
        
        try {
            console.log('📱 Verifying OTP...');
            const result = await verifyOTP(otp);
            console.log('✅ OTP verification successful');
            completeLogin(result);
        } catch (error) {
            console.error('❌ OTP verification failed:', error);
            showMessage(otpMessage, error.message, 'error');
            
            // Reset inputs only for certain errors
            if (error.message.includes('expired') || error.message.includes('Invalid')) {
                resetOTPInputs();
            }
        } finally {
            setLoading(verifyOtpBtn, otpBtnText, otpLoadingSpinner, false);
        }
    });

    // Resend OTP
    resendOtpLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (resendOtpLink.classList.contains('disabled')) return;
        
        setLoading(verifyOtpBtn, otpBtnText, otpLoadingSpinner, true);
        
        try {
            console.log('📱 Resending OTP...');
            await mobileFetch('/send-otp', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tempToken}`
                }
            });

            showMessage(otpMessage, 'New OTP sent successfully!', 'success');
            resetOTPInputs();
            startCountdown();
            
        } catch (error) {
            console.error('❌ Resend OTP failed:', error);
            let errorMsg = 'Failed to resend OTP. Please try again.';
            showMessage(otpMessage, errorMsg, 'error');
        } finally {
            setLoading(verifyOtpBtn, otpBtnText, otpLoadingSpinner, false);
        }
    });

    // Close modal when clicking outside
    otpModal.addEventListener('click', (e) => {
        if (e.target === otpModal) {
            otpModal.style.display = 'none';
        }
    });

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