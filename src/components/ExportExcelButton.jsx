import React from 'react';
import { AiFillFileExcel } from 'react-icons/ai';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { apiRequest } from "@/utils/api-helper";

export function ExcelExportButton({ projectId, tableRows, headers, isAssignment, isRewriteTask }) {
    const fetchAllActivityLogs = async () => {
        try {
            const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/activity-logs/download-all`);
            if (responseData && Array.isArray(responseData.data)) {
                return responseData.data;
            } else {
                console.warn("Unexpected response format: ", responseData);
                return [];
            }
        } catch (error) {
            console.error("Error fetching activity logs: ", error);
            return [];
        }
    };
    
    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Report');
        worksheet.columns = headers.map((header) => ({
            header: header.label,
            key: header.key,
            width: header.width || 10,
        }));
        worksheet.getRow(1).eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4F81BD' },
            };
            cell.font = {
                bold: true,
                color: { argb: 'FFFFFFFF' },
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
        if (projectId === 'activity_log') {
            const allLogs = await fetchAllActivityLogs();
    
            if (Array.isArray(allLogs)) {
                allLogs.forEach(log => {
                    worksheet.addRow({
                        date_time: log.date_time,
                        activity: log.activity,
                        user_id: log.user_id,
                    });
                });
            } else {
                console.warn("allLogs is not an array or is empty.");
            }
        } else {
            tableRows.forEach((row) => worksheet.addRow(row));
        }

        const filename = (projectId === 'activity_log')
            ? 'Activity Log.xlsx'
            : isRewriteTask
                ? `[${projectId}] Rewrite Task.xlsx`
                : isAssignment
                    ? `[${projectId}] Assignment Time Frame.xlsx`
                    : `[${projectId}] Project Time Frame.xlsx`;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, filename);
    };    
    return (
        <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
        >
            <AiFillFileExcel className="w-5 h-5" aria-hidden="true" />
        </button>
    );
}