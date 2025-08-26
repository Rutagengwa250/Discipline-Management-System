document.addEventListener('DOMContentLoaded', function() {
    // Authentication check
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'teacher') {
        window.location.href = '/login.html';
        return;
    }

    document.getElementById('usernameDisplay').textContent = user.username;

    // DOM Elements
    const newRequestBtn = document.getElementById('newRequestBtn');
    const requestModal = document.getElementById('requestModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');
    const removalRequestForm = document.getElementById('removalRequestForm');
    const studentSearch = document.getElementById('studentSearch');
    const studentSearchResults = document.getElementById('studentSearchResults');
    const selectedStudentId = document.getElementById('selectedStudentId');
    const studentInfoContainer = document.getElementById('studentInfoContainer');
    const requestStatusFilter = document.getElementById('requestStatusFilter');
    const requestsList = document.getElementById('requestsList');
    const logoutBtn = document.getElementById('logoutBtn');

    // Event Listeners
    newRequestBtn.addEventListener('click', openRequestModal);
    closeModalBtn.addEventListener('click', closeRequestModal);
    cancelRequestBtn.addEventListener('click', closeRequestModal);
    removalRequestForm.addEventListener('submit', submitRemovalRequest);
    studentSearch.addEventListener('input', searchStudents);
    requestStatusFilter.addEventListener('change', loadRequests);

    // Show custom points input only when "Other" is selected
    document.querySelectorAll('input[name="faultType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customPointsContainer = document.getElementById('customPointsContainer');
            if (this.value === 'other') {
                customPointsContainer.style.display = 'block';
                document.getElementById('customPoints').value = '';
                document.getElementById('customPoints').focus();
            } else {
                customPointsContainer.style.display = 'none';
            }
        });
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    });
    // Initial load
    loadRequests();

    // Functions
    function openRequestModal() {
        resetRequestForm();
        requestModal.style.display = 'block';
    }

    function closeRequestModal() {
        requestModal.style.display = 'none';
    }

    function resetRequestForm() {
        removalRequestForm.reset();
        selectedStudentId.value = '';
        studentInfoContainer.style.display = 'none';
        studentSearchResults.innerHTML = '';
        studentSearchResults.style.display = 'none';
    }

    async function searchStudents() {
        const query = studentSearch.value.trim();
        
        if (query.length < 2) {
            studentSearchResults.innerHTML = '';
            studentSearchResults.style.display = 'none';
            return;
        }

        try {
            const response = await axios.get(`/students/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.length > 0) {
                displaySearchResults(response.data);
                studentSearchResults.style.display = 'block';
            } else {
                studentSearchResults.innerHTML = '<div class="no-results">No students found</div>';
                studentSearchResults.style.display = 'block';
            }
        } catch (error) {
            console.error('Error searching students:', error);
            studentSearchResults.innerHTML = '<div class="search-error">Error loading students</div>';
            studentSearchResults.style.display = 'block';
        }
    }

    function displaySearchResults(students) {
        studentSearchResults.innerHTML = '';
        
        students.forEach(student => {
            const div = document.createElement('div');
            div.className = 'search-result';
            div.innerHTML = `
                ${student.student_firstName} ${student.student_lastName} 
                <span class="class-info">${student.student_class}</span>
                <span class="points-info">${student.student_conduct} pts</span>
            `;
            
            div.addEventListener('click', () => {
                selectStudent(student);
            });
            
            studentSearchResults.appendChild(div);
        });
    }

    function selectStudent(student) {
        selectedStudentId.value = student.id;
        studentSearch.value = `${student.student_firstName} ${student.student_lastName}`;
        studentSearchResults.innerHTML = '';
        studentSearchResults.style.display = 'none';
        
        document.getElementById('studentName').textContent = `${student.student_firstName} ${student.student_lastName}`;
        document.getElementById('studentClass').textContent = student.student_class;
        document.getElementById('studentPoints').textContent = student.student_conduct;
        studentInfoContainer.style.display = 'block';
    }

    async function submitRemovalRequest(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            const selectedFault = document.querySelector('input[name="faultType"]:checked');
            if (!selectedFault) {
                alert('Please select a fault type');
                return;
            }

            const formData = {
                studentId: selectedStudentId.value,
                faultType: selectedFault.value,
                faultDescription: document.getElementById('faultDescription').value.trim(),
                pointsToRemove: selectedFault.value === 'other' 
                    ? parseInt(document.getElementById('customPoints').value)
                    : parseInt(selectedFault.dataset.points),
                reason: document.getElementById('removalReason').value.trim()
            };

            // Validation
            const errors = [];
            if (!formData.studentId) errors.push('Please select a student');
            if (isNaN(formData.pointsToRemove)) errors.push('Invalid points value');
            if (formData.pointsToRemove <= 0) errors.push('Points must be positive');
            if (!formData.reason) errors.push('Reason is required');
            if (formData.reason.length < 5) errors.push('Reason too short (min 5 chars)');

            if (errors.length > 0) {
                alert(errors.join('\n'));
                return;
            }

            const response = await axios.post('/api/removal-requests', formData, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                alert('Request submitted successfully!');
                closeRequestModal();
                loadRequests();
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert(error.response?.data?.error || error.message || 'Submission failed');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    }

    async function loadRequests() {
        try {
            const status = document.getElementById('requestStatusFilter').value;
            const url = `/api/removal-requests${status === 'all' ? '' : `?status=${status}`}`;

            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            displayRequests(response.data);
        } catch (error) {
            console.error('Error loading requests:', error);
            document.getElementById('requestsList').innerHTML = 
                '<tr><td colspan="6" class="error">Failed to load requests</td></tr>';
        }
    }

function displayRequests(requests) {
    const tbody = document.getElementById('requestsList');
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No requests found</td></tr>';
        return;
    }

    requests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.student_name || 
                 `${request.student_firstName || ''} ${request.student_lastName || ''}`.trim() || 
                 'Unknown Student'}</td>
            <td>${request.fault_description || 'N/A'}</td>
            <td class="points">${request.points_deducted ? `-${request.points_deducted}` : '0'}</td>
            <td class="status status-${request.status}">${request.status}</td>
            <td>${new Date(request.created_at).toLocaleDateString()}</td>
            <td>
                ${request.status === 'pending' ? `
                <button class="btn-cancel" data-id="${request.id}">Cancel</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', cancelRequest);
    });
}

async function cancelRequest(e) {
    const requestId = e.target.getAttribute('data-id');
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    try {
        const response = await axios.delete(`/api/teacher/removal-requests/${requestId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data.success) {
            alert('Request canceled successfully');
            loadRequests();
        } else {
            alert(response.data.error || 'Failed to cancel request');
        }
    } catch (error) {
        console.error('Error canceling request:', {
            error: error.response?.data || error.message
        });
        alert(error.response?.data?.error || 
             error.response?.data?.message || 
             'Failed to cancel request');
    }
}

    window.addEventListener('click', (e) => {
        if (e.target === requestModal) {
            closeRequestModal();
        }
    });
});