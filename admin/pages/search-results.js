document.addEventListener('DOMContentLoaded', function() {
    // Initialize hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.links');
    
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize search functionality
    initSearch();

    // Display search results
    displaySearchResults();

    // Initialize form submission
    initDeductMarksForm();
});

function displaySearchResults() {
    const searchResultsContainer = document.getElementById('search-results-container');
    const searchResults = JSON.parse(localStorage.getItem('searchResults'));
    const studentSelect = document.getElementById('studentSelect');

    // Check if required elements exist
    if (!searchResultsContainer) {
        console.error('Search results container not found');
        return;
    }
    
    if (!studentSelect) {
        console.error('Student select dropdown not found');
        return;
    }

    if (!searchResults) {
        searchResultsContainer.innerHTML = '<p>No search results found. Please perform a search first.</p>';
        return;
    }

    // Clear previous results
    searchResultsContainer.innerHTML = '';
    studentSelect.innerHTML = '<option value="">Select a student</option>';

    // Display single student result
    if (!Array.isArray(searchResults)) {
        const studentCard = createStudentCard(searchResults);
        searchResultsContainer.appendChild(studentCard);
        
        // Add to select dropdown
        const option = document.createElement('option');
        option.value = searchResults.id;
        option.textContent = `${searchResults.student_firstName} ${searchResults.student_lastName}`;
        studentSelect.appendChild(option);
        
        // Load previous records for this student
        loadStudentRecords(searchResults.id, studentCard);
    } 
    // Display multiple student results
    else if (searchResults.length > 0) {
        searchResults.forEach(student => {
            const studentCard = createStudentCard(student);
            searchResultsContainer.appendChild(studentCard);
            
            // Add to select dropdown
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.student_firstName} ${student.student_lastName}`;
            studentSelect.appendChild(option);
            
            // Load previous records for this student
            loadStudentRecords(student.id, studentCard);
        });
    } else {
        searchResultsContainer.innerHTML = '<p>No students found matching your search.</p>';
    }
}

// Update the loadStudentRecords function
async function loadStudentRecords(studentId, studentCard) {
    // Make sure studentCard exists
    if (!studentCard) {
        console.error('Student card element not found');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/student/${studentId}/records`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        displayStudentRecords(response.data, studentCard);
    } catch (error) {
        console.error('Error fetching student records:', error);
        
        // Check if it's a 404 error (endpoint not implemented yet)
        if (error.response && error.response.status === 404) {
            // Create a placeholder records section
            const recordsSection = document.createElement('div');
            recordsSection.className = 'student-records';
            recordsSection.innerHTML = `
                <h3><i class="fas fa-history"></i> Previous Records</h3>
                <div class="no-records">
                    <i class="fas fa-tools"></i>
                    <p>Records feature is coming soon. Check back later!</p>
                </div>
            `;
            studentCard.appendChild(recordsSection);
        } else {
            // Create a records section for other errors
            const recordsSection = document.createElement('div');
            recordsSection.className = 'student-records';
            recordsSection.innerHTML = `
                <h3><i class="fas fa-history"></i> Previous Records</h3>
                <div class="no-records">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load records at this time.</p>
                </div>
            `;
            studentCard.appendChild(recordsSection);
        }
    }
}

function displayStudentRecords(records, studentCard) {
    const recordsSection = document.createElement('div');
    recordsSection.className = 'student-records';
    
    recordsSection.innerHTML = `
        <h3>
            <i class="fas fa-history"></i> 
            Previous Records 
            <span class="records-count">(${records.length})</span>
        </h3>
    `;

    if (records.length === 0) {
        recordsSection.innerHTML += `
            <div class="no-records">
                <i class="fas fa-check-circle"></i>
                <p>No previous records found for this student.</p>
            </div>
        `;
    } else {
        const recordsList = document.createElement('div');
        recordsList.className = 'records-list';
        
        // Show only the 5 most recent records initially
        const recentRecords = records.slice(0, 3);
        
        recentRecords.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            
            // Format date
            const recordDate = new Date(record.date || record.created_at).toLocaleDateString();
            
            // Determine status class based on record type or status
            let statusClass = 'status-neutral';
            if (record.status === 'approved' || record.type === 'positive') {
                statusClass = 'status-positive';
            } else if (record.status === 'rejected' || record.type === 'negative') {
                statusClass = 'status-negative';
            }
            
            recordItem.innerHTML = `
                <div class="record-header">
                    <span class="record-date">${recordDate}</span>
                    <span class="record-status ${statusClass}">
                        ${record.status || record.type || 'record'}
                    </span>
                </div>
                <div class="record-details">
                    <p class="record-description">${record.description || record.fault_description || 'No description available'}</p>
                    <div class="record-points">
                        ${record.points ? (record.points > 0 ? `-${record.points}` : record.points) : '0'} points
                    </div>
                </div>
                ${record.teacher ? `<div class="record-teacher">By: ${record.teacher}</div>` : ''}
            `;
            
            recordsList.appendChild(recordItem);
        });
        
        recordsSection.appendChild(recordsList);
        
        // Add "View All" button if there are more records
        if (records.length > 3) {
            const viewAllBtn = document.createElement('button');
            viewAllBtn.className = 'view-all-btn';
            viewAllBtn.innerHTML = `<i class="fas fa-eye"></i> View All ${records.length} Records`;
            viewAllBtn.onclick = function() {
                // Expand to show all records
                recordsList.innerHTML = '';
                records.forEach(record => {
                    const recordItem = document.createElement('div');
                    recordItem.className = 'record-item';
                    
                    const recordDate = new Date(record.date || record.created_at).toLocaleDateString();
                    
                    let statusClass = 'status-neutral';
                    if (record.status === 'approved' || record.type === 'positive') {
                        statusClass = 'status-positive';
                    } else if (record.status === 'rejected' || record.type === 'negative') {
                        statusClass = 'status-negative';
                    }
                    
                    recordItem.innerHTML = `
                        <div class="record-header">
                            <span class="record-date">${recordDate}</span>
                            <span class="record-status ${statusClass}">
                                ${record.status || record.type || 'record'}
                            </span>
                        </div>
                        <div class="record-details">
                            <p class="record-description">${record.description || record.fault_description || 'No description available'}</p>
                            <div class="record-points">
                                ${record.points ? (record.points > 0 ? `-${record.points}` : record.points) : '0'} points
                            </div>
                        </div>
                        ${record.teacher ? `<div class="record-teacher">By: ${record.teacher}</div>` : ''}
                    `;
                    
                    recordsList.appendChild(recordItem);
                });
                
                viewAllBtn.style.display = 'none';
            };
            
            recordsSection.appendChild(viewAllBtn);
        }
    }
    
    studentCard.appendChild(recordsSection);
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    
    // Determine status and color
    let status, statusColor;
    if (student.student_conduct >= 32) {
        status = 'Excellent';
        statusColor = 'var(--success)';
    } else if (student.student_conduct >= 20) {
        status = 'Good';
        statusColor = 'var(--warning)';
    } else {
        status = 'Needs Improvement';
        statusColor = 'var(--danger)';
    }

    card.innerHTML = `
        <div class="student-info">
            <div>
                <strong>Student ID:</strong>
                <p>${student.id || 'N/A'}</p>
            </div>
            <div>
                <strong>Name:</strong>
                <p>${student.student_firstName} ${student.student_lastName}</p>
            </div>
            <div>
                <strong>Class:</strong>
                <p>${student.student_class}</p>
            </div>
            <div>
                <strong>Conduct Score:</strong>
                <p>${student.student_conduct}</p>
            </div>
            <div>
                <strong>Status:</strong>
                <p style="color: ${statusColor}">${status}</p>
            </div>
        </div>
    `;
    
    return card;
}

// Add these CSS styles to your existing CSS
const additionalStyles = `
.student-records {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
}

.student-records h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;
    color: var(--dark);
    font-size: 18px;
}

.records-count {
    font-size: 14px;
    color: var(--gray);
    font-weight: normal;
}

.records-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.record-item {
    background: var(--light);
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid var(--primary);
}

.record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.record-date {
    font-size: 14px;
    color: var(--gray);
}

.record-status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-positive {
    background-color: #d4edda;
    color: #155724;
}

.status-negative {
    background-color: #f8d7da;
    color: #721c24;
}

.status-neutral {
    background-color: #e2e3e5;
    color: #383d41;
}

.record-details {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 15px;
}

.record-description {
    margin: 0;
    flex: 1;
    color: var(--dark);
}

.record-points {
    font-weight: 600;
    color: var(--primary);
    white-space: nowrap;
}

.record-teacher {
    margin-top: 8px;
    font-size: 14px;
    color: var(--gray);
    font-style: italic;
}

.no-records {
    text-align: center;
    padding: 20px;
    color: var(--gray);
}

.no-records i {
    font-size: 24px;
    margin-bottom: 10px;
    display: block;
}

.view-all-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 6px;
    margin-top: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}

.view-all-btn:hover {
    background: var(--secondary);
}

.loading-records {
    text-align: center;
    padding: 20px;
    color: var(--gray);
}

.loading-records i {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Add the styles to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// The rest of your existing functions (initSearch, initDeductMarksForm, handleApiError) remain the same
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

function initDeductMarksForm() {
    const form = document.getElementById('deduct-marks-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const studentId = document.getElementById('studentSelect').value;
        const description = document.getElementById('faultDescription').value;
        const marks = document.getElementById('marksToDeduct').value;
        
        if (!studentId || !description || !marks) {
            alert('Please fill all fields');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/add-fault', {
                studentId,
                faultDescription: description,
                marksToDeduct: marks
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            alert('Marks deducted successfully!');
            form.reset();
            
            // Refresh the student data
            const searchResults = JSON.parse(localStorage.getItem('searchResults'));
            if (Array.isArray(searchResults)) {
                const updatedStudent = searchResults.find(s => s.id === studentId);
                if (updatedStudent) {
                    updatedStudent.student_conduct -= parseInt(marks, 10);
                    localStorage.setItem('searchResults', JSON.stringify(searchResults));
                    
                    // Update the displayed card
                    const cards = document.querySelectorAll('.student-card');
                    cards.forEach(card => {
                        const idText = card.querySelector('p').textContent;
                        if (idText === studentId) {
                            const conductElement = card.querySelectorAll('p')[3];
                            conductElement.textContent = updatedStudent.student_conduct;
                            
                            // Update status
                            let status, statusColor;
                            if (updatedStudent.student_conduct >= 32) {
                                status = 'Excellent';
                                statusColor = 'var(--success)';
                            } else if (updatedStudent.student_conduct >= 20) {
                                status = 'Good';
                                statusColor = 'var(--warning)';
                            } else {
                                status = 'Needs Improvement';
                                statusColor = 'var(--danger)';
                            }
                            
                            const statusElement = card.querySelectorAll('p')[4];
                            statusElement.textContent = status;
                            statusElement.style.color = statusColor;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error deducting marks:', error);
            handleApiError(error);
        }
    });
}

function handleApiError(error) {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    } else {
        alert('An error occurred. Please try again.');
    }
}