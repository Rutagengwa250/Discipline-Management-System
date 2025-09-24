// Set up event delegation once
document.body.addEventListener('click', function(e) {
    if (e.target.closest('#exportPdfBtn')) {
        downloadReport('pdf');
    }
    if (e.target.closest('#exportExcelBtn')) {
        downloadReport('excel');
    }
    if (e.target.closest('#refreshReportBtn')) {
        if (currentReportType) {
            generateReport(currentReportType);
        }
    }
});
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

    // Create loading spinner if it doesn't exist
    if (!document.getElementById('loading-spinner')) {
        document.body.insertAdjacentHTML('beforeend', 
            '<div id="loading-spinner" style="display: none;"></div>');
    }

    // Initialize report display
    const reportDisplay = document.getElementById('report-display');
    if (reportDisplay) {
        reportDisplay.innerHTML = `
            <div class="report-header">
                <!-- ... existing header HTML ... -->
            </div>
            <div class="report-summary"></div>
            <table id="report-table">
                <!-- ... existing table HTML ... -->
            </table>
        `;
    }

    // Initialize search functionality
    initSearch();

    // Initialize report buttons
    initReportButtons();
    
});


function initReportButtons() {
    const dailyBtn = document.getElementById('dailyReportBtn');
    const weeklyBtn = document.getElementById('weeklyReportBtn');
    const monthlyBtn = document.getElementById('monthlyReportBtn');
    const customBtn = document.getElementById('customReportBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const reportFilters = document.querySelector('.report-filters');
    
    // Set default dates
    const today = new Date();
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    
    // Format date as YYYY-MM-DD
    function formatDate(date) {
        const d = new Date(date);
        const month = '' + (d.getMonth() + 1);
        const day = '' + d.getDate();
        const year = d.getFullYear();
        
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    }
    
    startDate.value = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
    endDate.value = formatDate(today);
    
    // Button event handlers
    dailyBtn.addEventListener('click', () => generateReport('daily'));
    weeklyBtn.addEventListener('click', () => generateReport('weekly'));
    monthlyBtn.addEventListener('click', () => generateReport('monthly'));
    
    customBtn.addEventListener('click', function() {
        reportFilters.style.display = reportFilters.style.display === 'flex' ? 'none' : 'flex';
    });
    
    applyFiltersBtn.addEventListener('click', () => generateReport('custom'));
}

let currentReportType = null;
let currentReportParams = null;
let currentApiUrl = null;

async function generateReport(type) {
    // Safely get elements
    const spinner = document.getElementById('loading-spinner');
    const reportDisplay = document.getElementById('report-display');
    
    // Check if elements exist
    if (!spinner || !reportDisplay) {
        console.error('Required elements not found in DOM');
        return;
    }

    try {
        // Show loading state
        spinner.innerHTML = '<div class="spinner"></div><p>Generating report...</p>';
        spinner.style.display = 'flex';
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }
        
        currentApiUrl = `http://localhost:5000/reports/${type}`;
        currentReportParams = {};
        currentReportType = type;
        
        // For custom reports, use the filter values
        if (type === 'custom') {
            const startDate = document.getElementById('startDate')?.value;
            const endDate = document.getElementById('endDate')?.value;
            const classFilter = document.getElementById('classFilter')?.value;
            
            if (!startDate || !endDate) {
                throw new Error('Please select both start and end dates');
            }
            
            currentReportParams.startDate = startDate;
            currentReportParams.endDate = endDate;
            if (classFilter) currentReportParams.class = classFilter;
        } 
        // ... rest of your existing parameter handling ...
        
        // Fetch report data
        const response = await axios.get(currentApiUrl, {
            params: currentReportParams,
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.data) {
            throw new Error('No data received from server');
        }
        
        // Display the report data
        displayReportData(response.data);
        
    } catch (error) {
        console.error('Error generating report:', error);
        
        if (spinner) {
            spinner.innerHTML = `
                <div class="error-icon">⚠️</div>
                <p>${error.message || 'Failed to generate report'}</p>
            `;
        }
        
        if (error.response?.status === 401) {
            handleApiError(error);
        }
    } finally {
        // Hide spinner after a delay
        setTimeout(() => {
            if (spinner) {
                spinner.style.display = 'none';
            }
        }, 500);
    }
}

// Helper function to format dates as YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

function displayReportData(data) {
    const reportDisplay = document.getElementById('report-display');

    // Group cases by student
    const grouped = {};
    if (data.cases && data.cases.length > 0) {
        data.cases.forEach(caseItem => {
            const studentId = caseItem.student_id || 'N/A';
            if (!grouped[studentId]) {
                grouped[studentId] = {
                    student_id: studentId,
                    student_firstName: caseItem.student_firstName || '',
                    student_lastName: caseItem.student_lastName || '',
                    student_class: caseItem.student_class || 'N/A',
                    faults: [],
                    totalPoints: 0,
                    dates: []
                };
            }
            grouped[studentId].faults.push(caseItem.fault_description || 'N/A');
            grouped[studentId].totalPoints += caseItem.points_deducted || 0;
            if (caseItem.created_at) grouped[studentId].dates.push(new Date(caseItem.created_at).toLocaleDateString());
        });
    }

    // Create table rows (one per student)
    let tableRows = '';
    const groupedArr = Object.values(grouped);
    if (groupedArr.length > 0) {
        groupedArr.forEach(student => {
            tableRows += `
                <tr>
                    <td>${student.student_id}</td>
                    <td>${student.student_firstName} ${student.student_lastName}</td>
                    <td>${student.student_class}</td>
                    <td>${student.faults.join(', ')}</td>
                    <td>${student.totalPoints}</td>
                    <td>${student.dates.join(', ')}</td>
                </tr>
            `;
        });
    } else {
        tableRows = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                        <i class="fas fa-info-circle" style="font-size: 2rem; color: var(--gray);"></i>
                        <p>No cases found for the selected period</p>
                    </div>
                </td>
            </tr>
        `;
    }
    
    // Update only the changing parts
    const reportHeader = reportDisplay.querySelector('.report-header') || document.createElement('div');
    reportHeader.className = 'report-header';
    reportHeader.innerHTML = `
        <h2>Disciplinary Report</h2>
        <div class="report-actions">
            <button id="exportPdfBtn" class="btn-primary">
                <i class="fas fa-file-pdf"></i> Download PDF
            </button>
            <button id="exportExcelBtn" class="btn-secondary">
                <i class="fas fa-file-excel"></i> Export Excel
            </button>
            <button id="refreshReportBtn" class="btn-secondary">
                <i class="fas fa-sync-alt"></i> Refresh
            </button>
        </div>
    `;
    
    const reportTable = reportDisplay.querySelector('#report-table') || document.createElement('table');
    reportTable.id = 'report-table';
    reportTable.innerHTML = `
        <thead>
            <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Fault Description</th>
                <th>Points Deducted</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    `;
    
    // Only replace what's necessary
    if (!reportDisplay.querySelector('.report-header')) {
        reportDisplay.innerHTML = '';
        reportDisplay.appendChild(reportHeader);
        reportDisplay.insertAdjacentHTML('beforeend', summaryHtml);
        reportDisplay.appendChild(reportTable);
    } else {
        reportDisplay.querySelector('.report-summary').outerHTML = summaryHtml;
        reportDisplay.querySelector('#report-table').outerHTML = reportTable.outerHTML;
    }
    
    // Use event delegation for dynamic buttons
    document.body.addEventListener('click', function(e) {
        if (e.target.closest('#exportPdfBtn')) {
            downloadReport('pdf');
        }
        if (e.target.closest('#exportExcelBtn')) {
            downloadReport('excel');
        }
        if (e.target.closest('#refreshReportBtn')) {
            if (currentReportType) {
                generateReport(currentReportType);
            }
        }
    });
}

async function downloadReport(format) {
    if (!currentApiUrl || !currentReportType) {
        alert('Please generate a report first');
        return;
    }

    try {
        const spinner = document.createElement('div');
        spinner.className = 'download-spinner';
        spinner.innerHTML = `
            <div class="spinner"></div>
            <p>Generating ${format.toUpperCase()}...</p>
        `;
        document.body.appendChild(spinner);
        
        const token = localStorage.getItem('token');
        
        // Ensure we include all current parameters
        const downloadParams = { ...currentReportParams };
        
        const response = await axios.get(`${currentApiUrl}/${format}`, {
            params: downloadParams,
            responseType: 'blob',
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `${currentReportType}_report.${format}`);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(spinner);
        }, 100);
        
    } catch (error) {
        console.error(`Error generating ${format}:`, error);
        
        // More detailed error message
        let errorMessage = `Failed to generate ${format}.`;
        if (error.response) {
            if (error.response.status === 400) {
                errorMessage += " Invalid request parameters.";
            } else if (error.response.data?.error) {
                errorMessage += ` Server error: ${error.response.data.error}`;
            }
        }
        
        alert(errorMessage);
        document.querySelector('.download-spinner')?.remove();
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