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

    if (!searchResults) {
        searchResultsContainer.innerHTML = '<p>No search results found. Please perform a search first.</p>';
        return;
    }

    // Display single student result
    if (!Array.isArray(searchResults)) {
        const studentCard = createStudentCard(searchResults);
        searchResultsContainer.appendChild(studentCard);
        
        // Add to select dropdown
        const option = document.createElement('option');
        option.value = searchResults.id;
        option.textContent = `${searchResults.student_firstName} ${searchResults.student_lastName}`;
        studentSelect.appendChild(option);
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
        });
    } else {
        searchResultsContainer.innerHTML = '<p>No students found matching your search.</p>';
    }
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