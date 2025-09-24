const form = document.querySelector('form');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const adminName = document.getElementById('admin-username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await axios.post('http://localhost:5000/login', {
      adminName: adminName,
      password: password
    });

    const token = response.data.token;

    localStorage.setItem('token', token);

    window.location.href = 'profile-page.html';

    alert('Login successful!');
    form.reset();
  } catch (error) {
    if (error.response) {
      message.textContent = error.response.data.error || 'Unknown error occurred';
      message.style.display = 'block';
    } else if (error.request) {
      message.textContent = 'Error with the request. Please try again.';
    } else {
      message.textContent = 'An unexpected error occurred.';
    }
  }
});
