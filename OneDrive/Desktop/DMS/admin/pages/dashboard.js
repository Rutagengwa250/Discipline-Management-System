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

    // Fetch dashboard data
    fetchDashboardData();

    // Initialize search functionality
    initSearch();
});

async function fetchDashboardData() {
    try {
        const token = localStorage.getItem('token');
        // Use relative URL
        const response = await axios.get('/dashboard-data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = response.data || {};
        // Combine all students from topPerformers and atRiskStudents
        const students = []
            .concat(data.topPerformers || [])
            .concat(data.atRiskStudents || []);

        // Compute stats from students array
        const totalStudents = students.length;
        const avgScore = totalStudents > 0
            ? (students.reduce((sum, s) => sum + (s.conduct || s.student_conduct || 0), 0) / totalStudents)
            : 0;

        // Active cases: students with conduct < 20
        const activeCases = students.filter(s => (s.conduct || s.student_conduct || 0) < 20).length;
        // Resolved cases: students with conduct >= 20
        const resolvedCases = students.filter(s => (s.conduct || s.student_conduct || 0) >= 20).length;

        // Conduct distribution (prefer backend value)
        const conductDistribution = data.conductDistribution || {
            excellent: students.filter(s => (s.conduct || s.student_conduct || 0) >= 32).length,
            good: students.filter(s => (s.conduct || s.student_conduct || 0) >= 20 && (s.conduct || s.student_conduct || 0) < 32).length,
            poor: students.filter(s => (s.conduct || s.student_conduct || 0) < 20).length,
        };

        // Cases by month (if student.created_at exists)
        const casesByMonth = { months: [], counts: [] };
        const monthMap = {};
        students.forEach(s => {
            if (s.created_at) {
                const month = new Date(s.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
                monthMap[month] = (monthMap[month] || 0) + 1;
            }
        });
        casesByMonth.months = Object.keys(monthMap);
        casesByMonth.counts = Object.values(monthMap);

        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('activeCases').textContent = activeCases;
        document.getElementById('resolvedCases').textContent = resolvedCases;
        document.getElementById('avgScore').textContent = avgScore.toFixed(1);

        renderConductChart(conductDistribution);
        renderCasesChart(casesByMonth);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        document.getElementById('totalStudents').textContent = 0;
        document.getElementById('activeCases').textContent = 0;
        document.getElementById('resolvedCases').textContent = 0;
        document.getElementById('avgScore').textContent = '0.0';
        renderConductChart({ excellent: 0, good: 0, poor: 0 });
        renderCasesChart({ months: [], counts: [] });
        handleApiError(error);
    }
}

function renderConductChart(conductDistribution) {
    const ctx = document.getElementById('conductChart').getContext('2d');
    try {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Excellent (32+)', 'Good (20-31)', 'Poor (<20)'],
                datasets: [{
                    label: 'Number of Students',
                    data: [
                        conductDistribution.excellent || 0,
                        conductDistribution.good || 0,
                        conductDistribution.poor || 0,
                    ],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.2)',
                        'rgba(59, 130, 246, 0.2)',
                        'rgba(239, 68, 68, 0.2)'
                    ],
                    borderColor: [
                        'rgb(16, 185, 129)',
                        'rgb(59, 130, 246)',
                        'rgb(239, 68, 68)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Students'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Conduct Score Range'
                        }
                    }
                }
            }
        });
    } catch (chartError) {
        console.error('Error rendering conduct chart:', chartError);
    }
}

function renderCasesChart(casesByMonth) {
    const ctx = document.getElementById('casesChart').getContext('2d');
    try {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: casesByMonth.months || [],
                datasets: [{
                    label: 'Disciplinary Cases',
                    data: casesByMonth.counts || [],
                    fill: false,
                    backgroundColor: 'rgb(59, 130, 246)',
                    borderColor: 'rgb(37, 99, 235)',
                    tension: 0.1,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Cases'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });
    } catch (chartError) {
        console.error('Error rendering cases chart:', chartError);
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
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    } else {
        alert('An error occurred. Please try again.');
    }
}