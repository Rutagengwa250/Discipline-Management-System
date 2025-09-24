document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Decode token to get user info
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'teacher') {
        window.location.href = '/login.html';
        return;
    }

    document.getElementById('usernameDisplay').textContent = user.username;

    // Setup event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('viewStudentsBtn').addEventListener('click', showStudents);
    document.getElementById('viewRequestsBtn').addEventListener('click', showRequests);
    document.getElementById('cancelRequestBtn').addEventListener('click', closeModal);
    document.getElementById('removalRequestForm').addEventListener('submit', submitRemovalRequest);

    // Initialize search
    initSearch();

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    function showStudents() {
        document.getElementById('requestsContainer').style.display = 'none';
        document.getElementById('studentsContainer').style.display = 'block';
        loadStudents();
    }

    function showRequests() {
        document.getElementById('studentsContainer').style.display = 'none';
        document.getElementById('requestsContainer').style.display = 'block';
        loadRequests();
    }

    async function loadStudents() {
        try {
            const response = await axios.get('/api/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const studentsList = document.getElementById('studentsList');
            studentsList.innerHTML = '';
            
            response.data.forEach(student => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${student.student_firstName} ${student.student_lastName}</td>
                    <td>${student.student_class}</td>
                    <td>${student.student_conduct}</td>
                    <td>
                        <button class="btn-secondary view-faults" data-id="${student.id}">
                            View Faults
                        </button>
                    </td>
                `;
                studentsList.appendChild(row);
            });

            // Add event listeners to view faults buttons
            document.querySelectorAll('.view-faults').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const studentId = e.target.getAttribute('data-id');
                    await showStudentFaults(studentId);
                });
            });
        } catch (error) {
            console.error('Error loading students:', error);
            alert('Failed to load students');
        }
    }

    async function showStudentFaults(studentId) {
        try {
            const response = await axios.get(`/api/student-faults/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const faults = response.data;
            if (faults.length === 0) {
                alert('This student has no recorded faults');
                return;
            }

            let faultsHtml = '<h3>Student Faults</h3><ul>';
            faults.forEach(fault => {
                faultsHtml += `
                    <li>
                        <strong>${fault.fault_description}</strong> (${fault.points_deducted} points)
                        <button class="btn-primary request-removal" 
                                data-fault="${fault.id}" 
                                data-student="${studentId}">
                            Request Removal
                        </button>
                    </li>
                `;
            });
            faultsHtml += '</ul>';

            const container = document.getElementById('studentsContainer');
            const existingFaults = container.querySelector('.student-faults');
            if (existingFaults) {
                existingFaults.remove();
            }

            const faultsDiv = document.createElement('div');
            faultsDiv.className = 'student-faults';
            faultsDiv.innerHTML = faultsHtml;
            container.appendChild(faultsDiv);

            // Add event listeners to removal buttons
            document.querySelectorAll('.request-removal').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    openRemovalModal(
                        e.target.getAttribute('data-student'),
                        e.target.getAttribute('data-fault')
                    );
                });
            });
        } catch (error) {
            console.error('Error loading student faults:', error);
            alert('Failed to load student faults');
        }
    }

    function openRemovalModal(studentId, faultId) {
        document.getElementById('requestStudentId').value = studentId;
        document.getElementById('requestFaultId').value = faultId;
        document.getElementById('requestModal').style.display = 'block';
    }

    function closeModal() {
        document.getElementById('requestModal').style.display = 'none';
        document.getElementById('removalRequestForm').reset();
    }

    async function submitRemovalRequest(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('requestStudentId').value;
        const faultId = document.getElementById('requestFaultId').value;
        const reason = document.getElementById('removalReason').value;

        try {
            await axios.post('/api/fault-removal-requests', {
                faultId,
                studentId,
                reason
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('Request submitted successfully!');
            closeModal();
            loadRequests();
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request');
        }
    }

    async function loadRequests() {
        try {
            const response = await axios.get('/api/teacher/removal-requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const requestsList = document.getElementById('requestsList');
            requestsList.innerHTML = '';
            
            response.data.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.student_firstName} ${request.student_lastName}</td>
                    <td>${request.fault_description}</td>
                    <td>${request.points_deducted}</td>
                    <td>${request.reason}</td>
                    <td class="status-${request.status}">${request.status}</td>
                    <td>${new Date(request.created_at).toLocaleDateString()}</td>
                    <td>${request.admin_comment ? `<span class="admin-comment">${request.admin_comment}</span>` : ''}</td>
                `;
                requestsList.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading requests:', error);
            alert('Failed to load requests');
        }
    }

    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchStudentBtn');
        const suggestionsContainer = document.querySelector('.suggestions-container');
        
        searchInput.addEventListener('input', async function() {
            const query = this.value.trim();
            if (query.length < 2) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            try {
                const response = await axios.get(`/students/search?q=${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                displaySuggestions(response.data);
            } catch (error) {
                console.error('Error fetching search suggestions:', error);
                suggestionsContainer.style.display = 'none';
            }
        });
        
        searchBtn.addEventListener('click', async function() {
            const query = searchInput.value.trim();
            if (!query) {
                alert('Please enter a student name');
                return;
            }
            
            try {
                const response = await axios.get(`/student/${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                localStorage.setItem('searchResults', JSON.stringify(response.data));
                window.location.href = '/search-results.html';
            } catch (error) {
                console.error('Error searching for student:', error);
                if (error.response?.status === 404) {
                    alert('Student not found. Please check the name and try again.');
                } else {
                    handleApiError(error);
                }
            }
        });
        
        function displaySuggestions(suggestions) {
            suggestionsContainer.innerHTML = '';
            
            if (suggestions.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            suggestions.forEach(student => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = `${student.student_firstName} ${student.student_lastName}`;
                div.addEventListener('click', () => {
                    searchInput.value = `${student.student_firstName} ${student.student_lastName}`;
                    suggestionsContainer.style.display = 'none';
                });
                suggestionsContainer.appendChild(div);
            });
            
            suggestionsContainer.style.display = 'block';
        }
    }

    function handleApiError(error) {
        if (error.response?.status === 401) {
            logout();
        } else {
            alert('An error occurred. Please try again.');
        }
    }
});