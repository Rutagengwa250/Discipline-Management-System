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

    // Fetch and display sorted students
    fetchAndDisplaySortedStudents();
});

async function fetchAndDisplaySortedStudents() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/students', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const students = response.data;
        const sortedStudents = sortStudentsByClassAndConduct(students);
        displaySortedStudents(sortedStudents);

    } catch (error) {
        console.error('Error fetching students:', error);
        handleApiError(error);
        
        const classLists = document.getElementById('class-lists');
        classLists.innerHTML = '<p class="error">Failed to load student data. Please try again later.</p>';
    }
}

function sortStudentsByClassAndConduct(students) {
    const studentsByClass = {};

    students.forEach(student => {
        if (!studentsByClass[student.student_class]) {
            studentsByClass[student.student_class] = [];
        }
        studentsByClass[student.student_class].push(student);
    });

    // Sort students within each class by conduct (highest to lowest)
    for (const className in studentsByClass) {
        studentsByClass[className].sort((a, b) => b.student_conduct - a.student_conduct);
    }

    return studentsByClass;
}

function displaySortedStudents(sortedStudents) {
    const classListsContainer = document.getElementById('class-lists');
    classListsContainer.innerHTML = '';

    // Get class names and sort them in ascending order
    const sortedClassNames = Object.keys(sortedStudents).sort((a, b) => {
        // Convert to numbers for proper numeric sorting if possible
        const numA = parseInt(a);
        const numB = parseInt(b);
        
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        
        // Fallback to string comparison if not numbers
        return a.localeCompare(b);
    });

    for (const className of sortedClassNames) {
        const classList = document.createElement('div');
        classList.className = 'class-list';

        // Add class heading
        const classHeading = document.createElement('h3');
        classHeading.textContent = `Class: ${className}`;
        classList.appendChild(classHeading);

        // Add labels row
        const labelsRow = document.createElement('div');
        labelsRow.className = 'student-labels';
        labelsRow.innerHTML = `
            <p>Name</p>
            <p>Class</p>
            <p>Conduct</p>
            <p>Status</p>
        `;
        classList.appendChild(labelsRow);

        // Add top 5 students for the class (not 10 as before)
        const topStudents = sortedStudents[className].slice(0, 5);
        topStudents.forEach(student => {
            const valuesRow = document.createElement('div');
            valuesRow.className = 'student-values';
            
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

            valuesRow.innerHTML = `
                <p data-label="Name">${student.student_firstName} ${student.student_lastName}</p>
                <p data-label="Class">${student.student_class}</p>
                <p data-label="Conduct">${student.student_conduct}</p>
                <p data-label="Status" style="color: ${statusColor}">${status}</p>
            `;
            
            classList.appendChild(valuesRow);
        });

        classListsContainer.appendChild(classList);
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