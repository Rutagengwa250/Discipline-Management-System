const express = require('express');
const router = express.Router();
const { connection } = require('./Admin-form/database.js'); // Adjust the path as needed

// Generate Weekly Report
router.get('/weekly', async (req, res) => {
    try {
        const reportData = await generateWeeklyReport();
        const pdfDoc = generatePDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=weekly_report.pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (error) {
        console.error('Error generating weekly report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Function to generate weekly report data
async function generateWeeklyReport() {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of the week (Sunday)
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay())); // End of the week (Saturday)

    const [rows] = await connection.query(
        `SELECT * FROM faults WHERE created_at BETWEEN ? AND ?`,
        [startOfWeek, endOfWeek]
    );
    return rows;
}

// Function to generate PDF
function generatePDF(data) {
    const fonts = {
        Roboto: {
            normal: 'fonts/Roboto-Regular.ttf',
            bold: 'fonts/Roboto-Bold.ttf',
            italics: 'fonts/Roboto-Italic.ttf',
            bolditalics: 'fonts/Roboto-BoldItalic.ttf'
        }
    };

    const printer = new pdfmake(fonts);

    const docDefinition = {
        content: [
            { text: 'Discipline Management System Report', style: 'header' },
            { text: 'Fault Logs', style: 'subheader' },
            {
                table: {
                    headerRows: 1,
                    widths: ['*', '*', '*'],
                    body: [
                        ['Student ID', 'Fault Description', 'Date'],
                        ...data.map(row => [row.student_id, row.fault_description, row.created_at])
                    ]
                }
            }
        ],
        styles: {
            header: {
                fontSize: 18,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 5]
            }
        }
    };

    return printer.createPdfKitDocument(docDefinition);
}


module.exports = router;