window.onload = async function () {
    const token = localStorage.getItem('token');  // Retrieve the token from localStorage

    if (!token) {
        // If no token is found, redirect to login page
        window.location.href = 'login.html';  // Redirect to login page
        return;
    }

    try {
        // Send GET request to get the profile info with the token in the Authorization header
        const response = await axios.get('http://localhost:5000/profile', {
            headers: {
                'Authorization': `Bearer ${token}`  // Send the token in the Authorization header
            }
        });

        // Show user profile info on the profile page
        document.getElementById('profile-info').innerHTML = `Welcome, ${response.data.username}! <br> StudentID: ${response.data.studentId} <br> Class: ${response.data.className} `;
        console.log(response.data);
        

    } catch (error) {
        console.error('Error fetching profile:', error);
       // alert('Unable to fetch profile. Please log in again.');
         //Optionally, log the user out by removing the token and redirecting to login
       // localStorage.removeItem('token');
       // window.location.href = 'login.html';
    }
};