import React, { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, CardBody, CardFooter, IconButton, Input } from "@material-tailwind/react";
import { DocumentChartBarIcon } from "@heroicons/react/24/solid";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Select from 'react-select';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AiFillFileExcel } from "react-icons/ai";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { PDFButton } from "@/components/FileButton";

export function TodayActivity() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [TABLE_HEAD, setTABLE_HEAD] = useState(["Name", "Today Activity"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'task_id', direction: 'ascending' });
  const [group, setGroup] = useState([]);
  const [groupSelected, setGroupSelected] = useState(false);
  const [formData, setFormData] = useState({ project_name: "", project_id: "", task_id: "", status_id: "", start_time: "", end_time: "", duration: "", followed_up_by: "", group_id: "" });

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (formData.group_id) {
      fetchTodayActivity(formData.group_id);
    }
  }, [formData.group_id]);

  const fetchTodayActivity = async (groupId) => {
    setIsLoading(true);
    try {
      const reportData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/today-activity?group_id=${groupId}`, "GET");
      processAndSetData(reportData, setTABLE_ROWS);

      const allDates = reportData.data.flatMap(row => row.last_week_activities.map(activity => activity.date));
      const uniqueDates = Array.from(new Set(allDates));
      setTABLE_HEAD(prevHead => [...prevHead, ...uniqueDates]);
    } catch (error) {
      console.error("Error fetching report data: ", error);
      setTABLE_ROWS([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const groupsData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/groupsName`, "GET");
      processAndSetData(groupsData, setGroup);
    } catch (error) {
      console.error("Error fetching groups: ", error);
    }
    setIsLoading(false);
  }; 

  const exportExcelTodayActivity = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Today Activity");

    const headerRow = worksheet.addRow(TABLE_HEAD);
  
    headerRow.eachCell((cell) => {
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

    TABLE_ROWS.forEach(row => {
      const rowData = [
        row.assignee_name,
        row.today_activities,
        ...TABLE_HEAD.slice(2).map(date => {
          const activity = row.last_week_activities.find(activity => activity.date === date);
          return activity ? activity.worked_projects || '-' : '-';
        })
      ];
      const addedRow = worksheet.addRow(rowData);

      addedRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Today Activity.xlsx");
  };

  const highlightText = (text) => {
    if (typeof text !== 'string' || !searchQuery) return text;
  
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };  
  
  const filterRows = (rows) => {
    if (!searchQuery) return rows;

    const query = searchQuery.toLowerCase();

    return rows.filter(row => {
      // Cek di assignee_name dan today_activities
      const inAssigneeOrToday = Object.keys(row).some(key => {
        const value = row[key] ? row[key].toString().toLowerCase() : '';
        return value.includes(query);
      });

      // Cek di worked_projects last_week_activities
      const inWorkedProjects = row.last_week_activities.some(activity => {
        const workedProjects = activity.worked_projects ? activity.worked_projects.toLowerCase() : '';
        return workedProjects.includes(query);
      });

      return inAssigneeOrToday || inWorkedProjects;
    });
  };  

  const sortedRows = useMemo(() => {
    if (!sortConfig) return [...TABLE_ROWS];
  
    const { key, direction } = sortConfig;
  
    return [...TABLE_ROWS].sort((a, b) => {
      let valueA = a[key];
      let valueB = b[key];

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
  
      if (valueA === null) return direction === 'ascending' ? -1 : 1;
      if (valueB === null) return direction === 'ascending' ? 1 : -1;
  
      if (valueA < valueB) return direction === 'ascending' ? -1 : 1;
      if (valueA > valueB) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [TABLE_ROWS, sortConfig]);  

  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }
  
  const tableRows = TABLE_ROWS.map((row, index) => {
    const uniqueKey = `${row.assignee_id}-${index}`;
  
    const dateColumns = TABLE_HEAD.slice(2).reduce((acc, date) => {
      const activity = row.last_week_activities.find(activity => activity.date === date);
      const isOffDay = activity ? activity.is_offday : false;
      acc[date] = activity
        ? (activity.worked_projects ? activity.worked_projects : '-') 
        : '-';
      acc[`${date}_is_offday`] = isOffDay;
      return acc;
    }, {});
  
    return (
      <tr key={uniqueKey} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-4">{highlightText(row.assignee_name)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.today_activities)}</td>
        {TABLE_HEAD.slice(2).map((date) => {
          const isOffDay = dateColumns[`${date}_is_offday`];
          return (
            <td
              key={date}
              className={`border border-gray-300 p-4 ${isOffDay ? 'bg-[rgba(255,228,225,0.9)]' : ''}`}
            >
              {highlightText(dateColumns[date])}
            </td>
          );
        })}
      </tr>
    );
  });
  
  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);

  const handleGroupChange = (value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      group_id: value,
    }));
    setGroupSelected(true);
  };
  
  const groupsOptions = group.map((group) => ({
    value: group.id,
    label: group.description,
  }));

  const LoadingOption = () => (
    <div className="flex items-center justify-center">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
    </div>
  );

  const generatePdf = () => {
    if (currentPageData.length === 0) {
      alert("Tidak ada data di halaman ini untuk diunduh.");
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Judul Laporan
    doc.setFontSize(16);
    const groupName = groupsOptions.find(option => option.value === formData.group_id)?.label || 'Semua Group';
    doc.text(`Group: ${groupName} (7 Hari Terakhir)`, 10, 10);
    doc.setFontSize(12);
    doc.text(`Halaman: ${currentPage + 1}`, 10, 16);

    // Filter TABLE_HEAD untuk 7 hari terakhir
    const last7DaysHeaders = TABLE_HEAD.slice(0, 2); // Ambil "Name" dan "Today Activity"
    const dateHeaders = TABLE_HEAD.slice(2);
    const recent7Days = dateHeaders.slice(-7); // Ambil 7 elemen terakhir (hari terakhir)
    const filteredHeaders = [...last7DaysHeaders, ...recent7Days];

    // Filter data untuk hanya menyertakan 7 hari terakhir
    const filteredData = currentPageData.map(row => {
      const rowData = [row.assignee_name, row.today_activities];
      const recentActivities = row.last_week_activities.slice(-7);
      recent7Days.forEach(dateHeader => {
        const activity = recentActivities.find(act => act.date === dateHeader);
        rowData.push(activity ? activity.worked_projects || '-' : '-');
      });
      return rowData;
    });

    const headers = filteredHeaders;
    const data = filteredData;

    // Atur lebar kolom secara manual
    const columnWidths = [
      30, // Lebar untuk kolom "Name" (dibuat lebih lebar)
      50, // Lebar untuk kolom "Today Activity" (dibuat lebih lebar)
      ...Array(recent7Days.length).fill((pageWidth - 30 - 50 - 14) / recent7Days.length), // Lebar sisa untuk kolom tanggal
    ];

    const startX = 7;
    let startY = 22;
    const rowHeight = 7;
    const padding = 4;

    // Header Tabel
    doc.setFont('times new roman', 'bold');
    let currentX = startX;
    headers.forEach((header, i) => {
      doc.text(header, currentX + padding, startY + padding, { maxWidth: columnWidths[i] - 2 * padding });
      currentX += columnWidths[i];
    });
    doc.line(startX, startY + rowHeight, pageWidth - startX, startY + rowHeight);
    startY += rowHeight + padding;
    doc.setFont('times new roman', 'normal');

    // Data Tabel
    data.forEach(row => {
      let maxTextHeight = rowHeight - 2 * padding;
      let textDetails = [];
      let currentY = startY;
      currentX = startX;

      row.forEach((cell, i) => {
        const textLines = doc.splitTextToSize(String(cell), columnWidths[i] - 2 * padding);
        textDetails.push({ lines: textLines, x: currentX + padding, y: currentY + padding });
        maxTextHeight = Math.max(maxTextHeight, textLines.length * 5);
        currentX += columnWidths[i];
      });

      textDetails.forEach(detail => {
        detail.lines.forEach((line, index) => {
          doc.text(line, detail.x, detail.y + index * 5);
        });
      });

      startY += maxTextHeight + padding;
      doc.line(startX, startY, pageWidth - startX, startY);
    });

    const formattedGroupName = groupName.replace(/\s+/g, '_');
    doc.save(`Today_Activity_Report_Last_7_Days_${formattedGroupName}_${currentPage + 1}.pdf`);
  };

  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Today Activity
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <div className={`font-poppins w-72 py-2`}>
              <Select
                options={isLoading ? [{ value: '', label: <LoadingOption /> }] : groupsOptions}
                value={groupsOptions.find(option => option.value === formData.group_id) || null}
                onChange={(selectedOption) => {
                  handleGroupChange(selectedOption.value);
                  setGroupSelected(selectedOption !== null);
                }}
                isSearchable={true}
                placeholder="Group"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    width: '100%',
                    borderRadius: '7px',
                    padding: '2px',
                    fontSize: '14px',
                    borderColor: state.isFocused ? 'black' : '#B0BEC5',
                    boxShadow: state.isFocused ? '0 0 0 1px black' : base.boxShadow,
                    '&:hover': {
                      borderColor: state.isFocused ? 'black' : '#B0BEC5',
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: '7px',
                    padding: '12px 12px',
                  }),
                  option: (base, state) => ({
                    ...base,
                    borderRadius: '7px',
                    fontSize: '14px',
                    padding: '8px 12px',
                    backgroundColor: state.isSelected
                      ? '#2196F3'
                      : state.isFocused
                      ? '#E9F5FE'
                      : base.backgroundColor,
                    color: state.isSelected ? '#fff' : base.color,
                    ':active': {
                      ...base[':active'],
                      backgroundColor: state.isSelected ? '#2196F3' : '#E9F5FE',
                    },
                    ...(state.data.value === '' && {
                      backgroundColor: 'transparent', 
                      cursor: 'default',
                      ':hover': {
                        backgroundColor: 'transparent',
                      },
                    }),
                  }),
                }}
              />
            </div>
            {groupSelected && (
              <div className="flex items-center ml-4">
                <div className="w-72 font-poppins mr-4">
                  <Input
                    label="Search"
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <button
                  onClick={exportExcelTodayActivity}
                  className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
                >
                  <AiFillFileExcel className="w-5 h-5" aria-hidden="true" />
                </button>
                <PDFButton onClick={generatePdf} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="overflow-scroll px-0">
          {formData.group_id ? (
            <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
              <thead className="bg-blue-gray-50/50">
                <tr>
                  {TABLE_HEAD.map((head) => (
                    <th
                      key={head}
                      className="border border-gray-300 p-4 cursor-pointer relative"
                      onClick={() => requestSort(head.toLowerCase().replace(/\s/g, '_'))}
                    >
                      <div className="flex items-center">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold leading-none opacity-70 font-poppins text-left text-xs"
                        >
                          {head}
                        </Typography>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
                  tableRows
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="text-center py-4">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <MagnifyingGlassIcon className="h-16 w-16 mb-4 animate-bounce mt-4" />
                        <Typography className="font-poppins text-xl font-medium">
                          Data Not Found!
                        </Typography>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '45px' }}>
              <DocumentChartBarIcon className="h-16 w-16 mb-4 animate-bounce" />
              <Typography className="text-center font-poppins text-lg font-medium text-gray-500">
                Select a group to view the today activity
              </Typography>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex items-center justify-center border-t border-blue-gray-50 p-4">
          <div className="flex items-center gap-2">
            {[...Array(pageCount)].map((_, i) => (
              <IconButton
                key={i}
                variant={i === currentPage ? "outlined" : "text"}
                size="sm"
                onClick={() => handlePageClick(i)}
              >
                {i + 1}
              </IconButton>
            ))}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
