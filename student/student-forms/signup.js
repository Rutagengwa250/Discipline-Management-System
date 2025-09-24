// const axios = require('axios');
const form = document.querySelector('form'); // Correct the selector to target the form
const errorMessage=document.getElementById('error');
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission

    // Get the values from the form inputs
    const student_firstName = document.getElementById('student-firstname').value;
    const student_lastname = document.getElementById('student_lastName').value;
    const className= document.getElementById('className').value;

    try {
        // Send POST request to register the user
        const response = await axios.post('http://localhost:5000/register', {
            student_firstName: student_firstName,
            student_lastName: student_lastname,
            className: className
        });

        // Log the response and show success message
        console.log(response.data);
        alert('Your registration was successful!');
        form.reset(); // Reset the form fields
        errorMessage.textContent = '';

    } catch (error) {
        errorMessage.textContent = error.response.data.message; 

    }

});
