document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Safe element getter with error handling
    const getElement = (id) => {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`Element with ID '${id}' not found`);
        }
        return el;
    };

    // Initialize all elements
    const elements = {
        permissionModal: getElement('permissionModal'),
        viewPermissionModal: getElement('viewPermissionModal'),
        newPermissionBtn: getElement('newPermissionBtn'),
        cancelPermissionBtn: getElement('cancelPermissionBtn'),
        permissionForm: getElement('permissionForm'),
        permissionsList: getElement('permissionsList'),
        permissionSpinner: getElement('permission-spinner'),
        permissionFilter: getElement('permissionFilter'),
        studentSearch: getElement('studentSearch'),
        refreshPermissions: getElement('refreshPermissions'),
        startDate: getElement('startDate'),
        endDate: getElement('endDate'),
        modalStudentSearch: getElement('modalStudentSearch'),
        studentSearchResults: getElement('studentSearchResults'),
        studentInfoDisplay: getElement('studentInfoDisplay'),
        studentNameDisplay: getElement('studentNameDisplay'),
        studentClassDisplay: getElement('studentClassDisplay'),
        studentIdInput: getElement('studentId')
    };
    
    // Remove pagination elements from DOM if they exist
    const paginationContainer = document.querySelector('.pagination-controls');
    if (paginationContainer) {
        paginationContainer.style.display = 'none';
    }
    
    initSearch();
    
    // Check if required elements exist
    const requiredElements = ['permissionModal', 'viewPermissionModal', 'permissionsList', 'permissionForm'];
    const missingElements = requiredElements.filter(id => !elements[id]);
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }

    // REMOVED: let currentPage = 1;
    // REMOVED: const itemsPerPage = 10;

    // Initialize date pickers
    flatpickr("#departureDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
        defaultDate: new Date()
    });

    flatpickr("#returnDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
        defaultDate: new Date()
    });

    flatpickr("#departureTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        defaultDate: new Date()
    });

    flatpickr("#returnTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        defaultDate: new Date()
    });

    flatpickr("#editActualReturnTime", {
        enableTime: true,
        dateFormat: "Y-m-d H:i"
    });

    // Set default dates for filters
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    elements.startDate.valueAsDate = firstDayOfMonth;
    elements.endDate.valueAsDate = today;

    // Event listeners
    elements.newPermissionBtn.addEventListener('click', openPermissionModal);
    elements.cancelPermissionBtn.addEventListener('click', closePermissionModal);
    elements.permissionForm.addEventListener('submit', handlePermissionSubmit);
    elements.permissionFilter.addEventListener('change', loadPermissions);
    elements.studentSearch.addEventListener('input', debounce(loadPermissions, 300));
    elements.startDate.addEventListener('change', loadPermissions);
    elements.endDate.addEventListener('change', loadPermissions);
    elements.refreshPermissions.addEventListener('click', loadPermissions);

    // Close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
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
    
    // Student search functionality
    if (elements.modalStudentSearch) {
        elements.modalStudentSearch.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                elements.studentSearchResults.style.display = 'none';
                elements.studentInfoDisplay.style.display = 'none';
                elements.studentIdInput.value = '';
                return;
            }

            try {
                const response = await fetch(`/students/search?q=${encodeURIComponent(query)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) throw new Error('Search failed');
                
                const students = await response.json();
                displaySearchResults(students);
            } catch (error) {
                console.error('Search error:', error);
                elements.studentSearchResults.innerHTML = '<div class="search-error">Error searching students</div>';
                elements.studentSearchResults.style.display = 'block';
            }
        }, 300));

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!elements.modalStudentSearch.contains(e.target) && 
                !elements.studentSearchResults.contains(e.target)) {
                elements.studentSearchResults.style.display = 'none';
            }
        });
    }

    // Initialize
    loadPermissions();

    // Modal functions
    function openPermissionModal() {
        elements.permissionModal.style.display = 'block';
    }

    function closePermissionModal() {
        elements.permissionModal.style.display = 'none';
        elements.permissionForm.reset();
        elements.studentInfoDisplay.style.display = 'none';
        elements.studentSearchResults.style.display = 'none';
        elements.studentIdInput.value = '';
    }

    window.addEventListener('click', function(event) {
        if (event.target === elements.permissionModal) {
            closePermissionModal();
        }
        if (event.target === elements.viewPermissionModal) {
            elements.viewPermissionModal.style.display = 'none';
        }
    });

    // Display search results
    function displaySearchResults(students) {
        elements.studentSearchResults.innerHTML = '';
        
        if (!students || students.length === 0) {
            elements.studentSearchResults.innerHTML = '<div class="search-no-results">No matching students found</div>';
            elements.studentSearchResults.style.display = 'block';
            return;
        }

        students.forEach(student => {
            const fullName = `${student.student_firstName} ${student.student_lastName}`;
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.innerHTML = `
                <div class="student-name">${fullName}</div>
                <div class="student-class">${student.student_class || 'No class'}</div>
            `;
            resultItem.addEventListener('click', () => {
                selectStudent({
                    id: student.id,
                    name: fullName,
                    className: student.student_class || 'No class'
                });
            });
            elements.studentSearchResults.appendChild(resultItem);
        });

        elements.studentSearchResults.style.display = 'block';
    }

    // Handle student selection
    function selectStudent(student) {
        elements.studentNameDisplay.textContent = student.name;
        elements.studentClassDisplay.textContent = student.className;
        elements.studentInfoDisplay.style.display = 'block';
        elements.studentSearchResults.style.display = 'none';
        elements.studentIdInput.value = student.id;
        
        // Also update the readonly inputs
        getElement('studentName').value = student.name;
        getElement('studentClass').value = student.className;
    }

    // Handle permission form submission
    async function handlePermissionSubmit(e) {
        e.preventDefault();
        
        if (!elements.studentIdInput.value) {
            showAlert('Please select a student first', 'error');
            return;
        }

        const departureTime = `${getElement('departureDate').value} ${getElement('departureTime').value}`;
        const returnTime = `${getElement('returnDate').value} ${getElement('returnTime').value}`;

        const permissionData = {
            studentId: elements.studentIdInput.value,
            studentName: elements.studentNameDisplay.textContent,
            studentClass: elements.studentClassDisplay.textContent,
            permissionType: getElement('permissionType').value,
            status: getElement('permissionStatus').value,
            departureTime,
            returnTime,
            destination: getElement('destination').value,
            reason: getElement('permissionReason').value
        };

        if (!validatePermissionData(permissionData)) {
            return;
        }

        try {
            const response = await axios.post('/api/permissions', permissionData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data) {
                showAlert('Permission saved successfully!', 'success');
                closePermissionModal();
                loadPermissions();
            }
        } catch (error) {
            console.error('Error saving permission:', error.response || error);
            showAlert(`Failed to save permission: ${getErrorMessage(error)}`, 'error');
        }
    }

    // Validate permission data
    function validatePermissionData(data) {
        if (!data.studentId || !data.studentName || !data.studentClass) {
            showAlert('Please fill in all student information', 'error');
            return false;
        }

        if (!data.departureTime || !data.returnTime) {
            showAlert('Please provide both departure and return times', 'error');
            return false;
        }

        const departureDate = new Date(data.departureTime);
        const returnDate = new Date(data.returnTime);

        if (returnDate <= departureDate) {
            showAlert('Return time must be after departure time', 'error');
            return false;
        }

        if (!data.destination || !data.reason) {
            showAlert('Please provide destination and reason', 'error');
            return false;
        }

        return true;
    }
    
    // Load permissions with filtering (no pagination)
    async function loadPermissions() {
        elements.permissionSpinner.style.display = 'flex';
        elements.permissionsList.innerHTML = '';

        try {
            const filter = elements.permissionFilter.value;
            const studentQuery = elements.studentSearch.value;
            const start = elements.startDate.value;
            const end = elements.endDate.value;

            const response = await axios.get('/api/permissions', {
                params: { 
                    filter,
                    studentName: studentQuery,
                    startDate: start,
                    endDate: end,
                    limit: 20 // Limit to 20 permissions
                },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // Handle response data
            const permissions = response.data.data || [];

            if (permissions.length === 0) {
                elements.permissionsList.innerHTML = `
                    <tr>
                        <td colspan="7" class="no-permissions">
                            <i class="fas fa-info-circle"></i> No permissions found
                        </td>
                    </tr>
                `;
                return;
            }

            // Add new rows
            permissions.forEach(permission => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${permission.student_name}</td>
                    <td>${permission.student_class}</td>
                    <td>${formatPermissionType(permission.permission_type)}</td>
                    <td>${formatDateTime(permission.departure_time)}</td>
                    <td>${formatDateTime(permission.return_time)}</td>
                    <td><span class="permission-status status-${permission.status}">${permission.status}</span></td>
                    <td class="permission-actions">
                        <button class="btn-secondary view-permission" data-id="${permission.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${permission.status === 'approved' && !permission.actual_return_time ? 
                            `<button class="btn-primary record-return" data-id="${permission.id}">
                                <i class="fas fa-flag"></i>
                            </button>` : ''
                        }
                    </td>
                `;
                elements.permissionsList.appendChild(row);
            });

            // Add event listeners
            document.querySelectorAll('.view-permission').forEach(btn => {
                btn.addEventListener('click', viewPermissionDetails);
            });

            document.querySelectorAll('.record-return').forEach(btn => {
                btn.addEventListener('click', recordReturn);
            });

        } catch (error) {
            console.error('Error loading permissions:', error);
            elements.permissionsList.innerHTML = `
                <tr>
                    <td colspan="7" class="error">
                        <i class="fas fa-exclamation-triangle"></i> Failed to load permissions: ${getErrorMessage(error)}
                    </td>
                </tr>
            `;
        } finally {
            elements.permissionSpinner.style.display = 'none';
        }
    }

    // REMOVED: updatePaginationControls function entirely

    // View permission details
    async function viewPermissionDetails(e) {
        const permissionId = e.currentTarget.getAttribute('data-id');
        
        try {
            const response = await axios.get(`/api/permissions/${permissionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const permission = response.data;

            // Populate view modal
            getElement('viewStudentName').textContent = permission.student_name;
            getElement('viewStudentClass').textContent = permission.student_class;
            getElement('viewPermissionType').textContent = formatPermissionType(permission.permission_type);
            getElement('viewPermissionStatus').textContent = permission.status;
            getElement('viewDepartureTime').textContent = formatDateTime(permission.departure_time);
            getElement('viewReturnTime').textContent = formatDateTime(permission.return_time);
            getElement('editActualReturnTime').value = permission.actual_return_time ? 
                formatDateTime(permission.actual_return_time, 'Y-m-d H:i') : '';
            getElement('viewDestination').textContent = permission.destination;
            getElement('viewReason').textContent = permission.reason;
            getElement('viewGuardianInfo').textContent = permission.guardian_info;
            getElement('viewApprovedBy').textContent = permission.approved_by || 'N/A';
            getElement('viewHistory').textContent = permission.history || 'No history available';
            getElement('statusComment').value = '';

            // Update status class
            const statusElement = getElement('viewPermissionStatus');
            statusElement.className = 'detail-value';
            statusElement.classList.add(`status-${permission.status.toLowerCase()}`);

            // Set up action buttons
            getElement('saveReturnTimeBtn').onclick = () => saveReturnTime(permissionId);
            getElement('printPermissionBtn').onclick = () => printPermission(permissionId);
            getElement('approvePermissionBtn').onclick = () => updatePermissionStatus(permissionId, 'approved');
            getElement('denyPermissionBtn').onclick = () => updatePermissionStatus(permissionId, 'denied');

            // Show/hide action buttons based on current status
            const statusActions = document.querySelector('.status-actions');
            if (permission.status === 'pending') {
                statusActions.style.display = 'flex';
            } else {
                statusActions.style.display = 'none';
            }

            // Show modal
            elements.viewPermissionModal.style.display = 'block';

        } catch (error) {
            console.error('Error loading permission details:', error.response || error);
            showAlert('Failed to load permission details. Please try again.', 'error');
        }
    }

    // Save return time
    async function saveReturnTime(permissionId) {
        const actualReturnTime = getElement('editActualReturnTime').value;
        
        if (!actualReturnTime) {
            showAlert('Please enter a valid return time', 'error');
            return;
        }

        try {
            await axios.patch(`/api/permissions/${permissionId}/return`, 
                { actualReturnTime },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            showAlert('Return time updated successfully!', 'success');
            elements.viewPermissionModal.style.display = 'none';
            loadPermissions();
        } catch (error) {
            console.error('Error updating return time:', error.response || error);
            showAlert('Failed to update return time. Please try again.', 'error');
        }
    }

    // Update permission status
    async function updatePermissionStatus(permissionId, status) {
        const comment = getElement('statusComment').value;
        
        if (!comment && status === 'denied') {
            showAlert('Please provide a reason for denying the permission', 'error');
            return;
        }

        try {
            await axios.patch(`/api/permissions/${permissionId}/status`, 
                { status, comment },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            showAlert(`Permission ${status} successfully!`, 'success');
            elements.viewPermissionModal.style.display = 'none';
            loadPermissions();
        } catch (error) {
            console.error(`Error ${status} permission:`, error.response || error);
            showAlert(`Failed to ${status} permission. Please try again.`, 'error');
        }
    }

    // Print permission slip
    async function printPermission(permissionId) {
        try {
            window.open(`/api/permissions/${permissionId}/print`, '_blank');
        } catch (error) {
            console.error('Error printing permission:', error);
            showAlert('Failed to open print view. Please try again.', 'error');
        }
    }

    // Record return (quick action from table)
    async function recordReturn(e) {
        const permissionId = e.currentTarget.getAttribute('data-id');
        const actualReturnTime = prompt('Enter actual return date and time (YYYY-MM-DD HH:MM):');
        
        if (!actualReturnTime) return;

        try {
            await axios.patch(`/api/permissions/${permissionId}/return`, 
                { actualReturnTime },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            showAlert('Return time recorded successfully!', 'success');
            loadPermissions();
        } catch (error) {
            console.error('Error recording return time:', error.response || error);
            showAlert('Failed to record return time. Please try again.', 'error');
        }
    }

    // Helper functions
    function formatPermissionType(type) {
        const types = {
            'weekend': 'Weekend Leave',
            'medical': 'Medical',
            'personal': 'Personal',
            'other': 'Other'
        };
        return types[type] || type;
    }

    function formatDateTime(dateString, format = '') {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        
        if (format === 'Y-m-d H:i') {
            return date.toISOString().slice(0, 16).replace('T', ' ');
        }
        
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function showAlert(message, type = 'success') {
        const notification = document.getElementById('notification');
        const messageElement = notification.querySelector('.notification-message');
        const closeButton = notification.querySelector('.notification-close');
        
        // Set message and type
        messageElement.textContent = message;
        notification.className = `notification ${type}`;
        
        // Show notification
        notification.style.display = 'block';
        
        // Auto-hide after 5 seconds
        const autoHide = setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
        
        // Manual close button
        closeButton.onclick = () => {
            clearTimeout(autoHide);
            notification.style.display = 'none';
        };
        
        // Click anywhere to close
        notification.onclick = () => {
            clearTimeout(autoHide);
            notification.style.display = 'none';
        };
    }

    function getErrorMessage(error) {
        return error.response?.data?.error || error.response?.data?.message || error.message;
    }

    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
});