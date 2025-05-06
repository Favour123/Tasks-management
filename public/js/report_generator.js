// Function to generate and store reports
async function generateReport(reportId, reportType, format) {
    try {
        // Get the report data
        const { data: report, error: reportError } = await supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .single();

        if (reportError) throw reportError;

        // Generate the report based on type
        let reportData;
        if (reportType.startsWith('task_')) {
            reportData = await generateTaskReport(reportType, report.start_date, report.end_date);
        } else if (reportType.startsWith('activity_')) {
            reportData = await generateActivityReport(reportType, report.start_date, report.end_date);
        }

        // Convert to the requested format
        let fileContent;
        let fileExtension;
        if (format === 'pdf') {
            fileContent = await generatePDF(reportData);
            fileExtension = 'pdf';
        } else if (format === 'csv') {
            fileContent = await generateCSV(reportData);
            fileExtension = 'csv';
        }

        // Generate a unique filename
        const timestamp = new Date().getTime();
        const filename = `${reportType}_${timestamp}.${fileExtension}`;

        // Upload the file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('reports')
            .upload(filename, fileContent, {
                contentType: format === 'pdf' ? 'application/pdf' : 'text/csv'
            });

        if (uploadError) throw uploadError;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('reports')
            .getPublicUrl(filename);

        // Update the report with the file path
        const { error: updateError } = await supabase
            .from('reports')
            .update({
                file_path: publicUrl,
                updated_at: new Date()
            })
            .eq('id', reportId);

        if (updateError) throw updateError;

        return publicUrl;
    } catch (error) {
        console.error('Error generating report:', error);
        throw error;
    }
}

// Helper function to generate task report data
async function generateTaskReport(reportType, startDate, endDate) {
    let query = supabase
        .from('tasks')
        .select(`
            *,
            categories (name),
            profiles:assigned_to (name)
        `);

    if (reportType === 'task_completed') {
        query = query.eq('status', 'completed');
    } else if (reportType === 'task_pending') {
        query = query.eq('status', 'pending');
    } else if (reportType === 'task_overdue') {
        query = query.eq('status', 'overdue');
    }

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// Helper function to generate activity report data
async function generateActivityReport(reportType, startDate, endDate) {
    let query = supabase
        .from('activity_logs')
        .select(`
            *,
            profiles:user_id (name),
            tasks (title)
        `);

    if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

// Helper function to generate PDF
async function generatePDF(data) {
    return new Promise((resolve, reject) => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('Task Management Report', 105, 20, { align: 'center' });
            
            // Add report details
            doc.setFontSize(12);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
            
            // Add table headers
            const headers = Object.keys(data[0] || {});
            const columnWidth = 180 / headers.length;
            let y = 40;
            
            // Draw table headers
            doc.setFont('helvetica', 'bold');
            headers.forEach((header, i) => {
                doc.text(header, 20 + (i * columnWidth), y);
            });
            
            // Draw table rows
            doc.setFont('helvetica', 'normal');
            data.forEach((row, rowIndex) => {
                y += 10;
                headers.forEach((header, i) => {
                    const value = row[header] || '';
                    doc.text(String(value), 20 + (i * columnWidth), y);
                });
                
                // Add new page if we're running out of space
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
            });
            
            // Convert to blob
            const pdfBlob = doc.output('blob');
            resolve(pdfBlob);
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to generate CSV
async function generateCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => 
                JSON.stringify(row[header])
            ).join(',')
        )
    ];
    
    return new Blob([csvRows.join('\n')], { type: 'text/csv' });
} 