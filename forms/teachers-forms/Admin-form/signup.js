// const axios = require('axios');
const form = document.querySelector('form'); // Correct the selector to target the form
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission

    // Get the values from the form inputs
    const adminName = document.getElementById('admin-username').value;
    const password = document.getElementById('password').value;

    try {
        // Send POST request to register the user
        const response = await axios.post('http://localhost:5000/register', {
            adminName: adminName,
            password: password
        });

        // Log the response and show success message
        console.log(response.data);
        alert('Registration successful!');
        form.reset(); // Reset the form fields
         window.location.href = 'login.html'
    } catch (error) {
        // display error message 
        if (error.response) {
            message.textContent = error.response.data.message;
        } else if (error.request) {
            message.textContent = 'Error with the request. Please try again.';
        } else {
            message.textContent = 'Error occurred. Please try again.';
        }
        
    }
});
