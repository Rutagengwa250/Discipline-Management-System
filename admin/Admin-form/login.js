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

    // ==================== UTILITY FUNCTIONS ====================

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
        
        // Add shake animation for errors
        if (type === 'error') {
            element.classList.add('shake');
            setTimeout(() => element.classList.remove('shake'), 500);
        }
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
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
            
        console.log('Login successful, redirecting to:', redirectPath);
        window.location.href = redirectPath;
    }

    // OTP verification function
    async function verifyOTP(otp) {
        try {
            const response = await fetch('/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ otp })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'OTP verification failed');
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('OTP Verification Error:', error);
            throw error;
        }
    }

    // ==================== EVENT LISTENERS ====================

    // Initialize OTP inputs
    initOTPInputs();

    // Login form submission - USING FETCH INSTEAD OF AXIOS
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
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Login response:', data);
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.tempToken) {
                // OTP required for admin/director
                tempToken = data.tempToken;
                showOTPModal();
                
                // Debug log
                if (data.debugOtp) {
                    console.log('DEBUG OTP:', data.debugOtp);
                    // You can auto-fill for testing
                    // otpInputs[0].value = data.debugOtp[0];
                    // otpInputs[1].value = data.debugOtp[1];
                    // otpInputs[2].value = data.debugOtp[2];
                    // otpInputs[3].value = data.debugOtp[3];
                    // otpInputs[4].value = data.debugOtp[4];
                    // otpInputs[5].value = data.debugOtp[5];
                }
            } else {
                // Regular users get token directly
                completeLogin(data);
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage(messageDiv, error.message, 'error');
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
            const result = await verifyOTP(otp);
            completeLogin(result);
        } catch (error) {
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
            const response = await fetch('/send-otp', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tempToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to resend OTP');
            }

            const data = await response.json();
            showMessage(otpMessage, 'New OTP sent successfully!', 'success');
            resetOTPInputs();
            startCountdown();
            
        } catch (error) {
            let errorMsg = 'Failed to resend OTP';
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

    // Debugging
    console.log('Login system initialized');
    console.log('Current client time:', new Date());
    console.log('Available endpoints: /login, /verify-otp, /send-otp');
});
// Test server connectivity
async function testServer() {
    try {
        const response = await fetch('/login', { method: 'GET' });
        console.log('Server status:', response.status);
        console.log('Server headers:', response.headers);
    } catch (error) {
        console.error('Server connection failed:', error);
    }
}
testServer();