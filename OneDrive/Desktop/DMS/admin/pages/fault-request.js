const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') {
    window.location.href = '/login.html'; // or login page
}
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const requestModal = document.getElementById('requestModal');
    const closeModalBtn = document.querySelector('.close-modal');
    let currentRequestId = null;

    // Load initial requests
    loadRequests();
    initSearch();
    // Event listeners
    document.getElementById('requestStatusFilter').addEventListener('change', loadRequests);
    closeModalBtn.addEventListener('click', closeModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('approveBtn').addEventListener('click', approveRequest);
    document.getElementById('rejectBtn').addEventListener('click', rejectRequest);

    async function loadRequests() {
        try {
            const status = document.getElementById('requestStatusFilter').value;
            const url = status === 'all' 
                ? '/api/removal-requests' 
                : `/api/removal-requests?status=${status}`;

            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            displayRequests(response.data);
        } catch (error) {
            console.error('Error loading requests:', error);
            document.getElementById('requestsList').innerHTML = 
                '<tr><td colspan="7" class="error">Failed to load requests</td></tr>';
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/students/search?q=${query}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/student/${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            localStorage.setItem('searchResults', JSON.stringify(response.data));
            window.location.href = 'search-results.html';
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
            
            // Create HTML structure with name and class
            div.innerHTML = `
                <div class="suggestion-name">${student.student_firstName} ${student.student_lastName}</div>
                <div class="suggestion-class">${student.student_class || 'No class assigned'}</div>
            `;
            
            div.addEventListener('click', () => {
                searchInput.value = `${student.student_firstName} ${student.student_lastName}`;
                suggestionsContainer.style.display = 'none';
                searchInput.focus();
            });
            suggestionsContainer.appendChild(div);
        });
        
        suggestionsContainer.style.display = 'block';
    }
}
function handleApiError(error) {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    } else {
        alert('An error occurred. Please try again.');
    }
}
    function displayRequests(requests) {
        const tbody = document.getElementById('requestsList');
        tbody.innerHTML = '';

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">No requests found</td></tr>';
            return;
        }

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.requester_name || 'N/A'}</td>
                <td>${request.student_name || 'N/A'}</td>
                <td>${request.fault_type || 'N/A'}</td>
                <td>-${request.points_deducted}</td>
                <td class="status-${request.status}">${request.status}</td>
                <td>${new Date(request.created_at).toLocaleDateString()}</td>
                <td><button class="view-btn" data-id="${request.id}">View</button></td>
            `;
            tbody.appendChild(row);
        });

        // Add click handlers to view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => showRequestDetails(btn.dataset.id));
        });
    }

async function showRequestDetails(requestId) {
    try {
        console.log(`Fetching details for request ${requestId}`); // Debug log
        
        const response = await axios.get(`/api/removal-requests/${requestId}`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response data:', response.data); // Debug log

        const request = response.data;
        
        // Populate modal - ensure all IDs match your HTML
        document.getElementById('detailTeacher').textContent = request.requester_name || 'N/A';
        document.getElementById('detailStudent').textContent = 
            `${request.student_firstName} ${request.student_lastName}` || 'N/A';
        document.getElementById('detailClass').textContent = request.student_class || 'N/A';
        document.getElementById('detailFaultType').textContent = request.fault_type || 'N/A';
        document.getElementById('detailDescription').textContent = request.fault_description || 'N/A';
        document.getElementById('detailPoints').textContent = `-${request.points_deducted}`;
        document.getElementById('detailReason').textContent = request.reason || 'No reason provided';
        document.getElementById('detailDate').textContent = 
            new Date(request.created_at).toLocaleString();

        // Toggle action buttons
        const actionDiv = document.getElementById('decisionSection');
        if (request.status === 'pending') {
            actionDiv.style.display = 'block';
        } else {
            actionDiv.style.display = 'none';
        }

        // Show modal
        document.getElementById('requestModal').style.display = 'block';
        currentRequestId = requestId;

    } catch (error) {
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            config: error.config,
            stack: error.stack
        });
        alert(`Error: ${error.response?.data?.error || 'Failed to load details'}`);
    }
}

async function approveRequest() {
    if (!currentRequestId) return;
    
    try {
        const approveBtn = document.getElementById('approveBtn');
        approveBtn.disabled = true;
        approveBtn.textContent = 'Approving...';

        const response = await axios.patch(
            `/api/removal-requests/${currentRequestId}/status`,
            {
                status: 'approved',
                adminComment: document.getElementById('adminComment').value
            },
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            alert('Request approved successfully!');
            closeModal();
            loadRequests();
        } else {
            throw new Error(response.data.error || 'Approval failed');
        }
    } catch (error) {
        console.error('Approval error:', {
            message: error.message,
            response: error.response?.data,
            stack: error.stack
        });
        alert(`Approval failed: ${error.response?.data?.error || error.message}`);
    } finally {
        const approveBtn = document.getElementById('approveBtn');
        if (approveBtn) {
            approveBtn.disabled = false;
            approveBtn.textContent = 'Approve Request';
        }
    }
}


async function rejectRequest() {
    if (!currentRequestId) return;
    
    try {
        const rejectBtn = document.getElementById('rejectBtn');
        rejectBtn.disabled = true;
        rejectBtn.textContent = 'Rejecting...';

        const response = await axios.patch(
            `/api/removal-requests/${currentRequestId}/status`,
            {
                status: 'rejected',
                adminComment: document.getElementById('adminComment').value
            },
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data.success) {
            alert('Request rejected successfully!');
            closeModal();
            loadRequests();
        }
    } catch (error) {
        console.error('Full rejection error:', {
            message: error.message,
            response: error.response?.data,
            config: error.config
        });
        alert(`Rejection failed: ${error.response?.data?.error || 'Server error'}`);
    } finally {
        const rejectBtn = document.getElementById('rejectBtn');
        if (rejectBtn) {
            rejectBtn.disabled = false;
            rejectBtn.textContent = 'Reject Request';
        }
    }
}

    function closeModal() {
        requestModal.style.display = 'none';
        currentRequestId = null;
    }
});