import React, { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, CardBody, CardFooter, IconButton, Input } from "@material-tailwind/react";
import { DocumentChartBarIcon } from "@heroicons/react/24/solid";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import { ExcelExportButton } from "@/components/ExportExcelButton";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { PDFButton } from "@/components/FileButton";
import Select from 'react-select';

const TABLE_HEAD = ["Task List Project Id", "Tasklist Code", "Tasklist Title", "Tasklist Due Date", "Tasklist Assignee", "Tasklist Rewrite Count"];

export function RewriteTask() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'task_id', direction: 'ascending' });
  const [projectAssignment, setProjectAssignment] = useState([]);
  const [projectSelected, setProjectSelected] = useState(false);
  const [projectKey, setProjectKey] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({ project_name: "", project_id: "", task_id: "", status_id: "", start_time: "", end_time: "", duration: "", followed_up_by: "" });

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchProjectAssignment();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchRewriteTask();
    }
  }, [formData.project_id]);

  const fetchProjectAssignment = async () => {
    setIsLoading(true);
    try {
      const projectStatusData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/project-status`, "GET");
      processAndSetData(projectStatusData, setProjectAssignment);
    } catch (error) {
      console.error("Error fetching project assignment: ", error);
    }
    setIsLoading(false);
  };
  
  const fetchRewriteTask = async () => {
    setIsLoading(true);
    try {
      const reportData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/rewrite-task/${formData.project_id}`, "GET");
      processAndSetData(reportData, setTABLE_ROWS);
    } catch (error) {
      console.error("Error fetching report data: ", error);
      setTABLE_ROWS([]);
    } finally {
      setIsLoading(false);
    }
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
      return Object.keys(row).some(key => {
        if (key === 'duration') {
          const durationString = `${row.duration.days}d ${row.duration.hours}h ${row.duration.minutes}m ${row.duration.seconds}s`;
          return durationString.toLowerCase().includes(query);
        }
        if (key === 'start_time' || key === 'end_time') {
          const dateValue = row[key] ? new Date(row[key]).toISOString() : '';
          return dateValue.toLowerCase().includes(query);
        }
        const value = row[key] ? row[key].toString().toLowerCase() : '';
        return value.includes(query);
      });
    });
  };  

  const sortedRows = useMemo(() => {
    if (!sortConfig) return [...TABLE_ROWS];
  
    const { key, direction } = sortConfig;
    return [...TABLE_ROWS].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [TABLE_ROWS, sortConfig]);  

  const requestSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  const getStatusBadgeStyle = (statusName) => {
    const baseStyle = {
      borderRadius: '5px',
      padding: '4px 10px',
      display: 'inline-block',
      marginRight: '4px',
    };
  
    const styles = {
      'DONE': ['rgba(212, 237, 218, 0.3)', '#67b173'],
      'UAT': ['rgba(204, 230, 255, 0.3)', '#004085'],
      'COMPLETE': ['rgba(255, 239, 179, 0.3)', '#856404'],
      'ON_PROGRESS': ['rgba(255, 255, 204, 0.3)', '#f4c542'],
      'REOPEN': ['rgba(248, 215, 218, 0.3)', '#f17171'],
      'No Previous Status': ['rgba(255, 228, 196, 0.3)', '#d2691e'],
    };
  
    const [backgroundColor, color] = styles[statusName] || ['rgba(226, 227, 229, 0.3)', '#383d41'];
  
    return { ...baseStyle, backgroundColor, color };
  };  
  
  const idCount = {};
  const tableRows = currentPageData.map((row, index) => {
    const uniqueKey = idCount[row.task_id] ? `${row.task_id}-${idCount[row.task_id]}` : row.task_id;
    idCount[row.task_id] = (idCount[row.task_id] || 0) + 1;
  
    return (
      <tr key={uniqueKey} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-4">{highlightText(row.tasklist_project_id)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.tasklist_code)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.tasklist_title)}</td>
        <td className="border border-gray-300 p-4">
          {highlightText(row.tasklist_due_date ? (row.tasklist_due_date).toLocaleString() : 'N/A')}
        </td>
        <td className="border border-gray-300 p-4">{highlightText(row.tasklist_assignee)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.tasklist_rewrite_count.toString())}</td>
      </tr>
    );
  });  
  
  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);

  const handleProjectChange = (value) => {
    setSelectedReport(null);
    setFormData(prevFormData => ({
      ...prevFormData,
      project_id: value,
    }));
    setProjectKey(prevKey => prevKey + 1);
  };
  
  const headers = [
    { label: 'tasklist_project_id', key: 'tasklist_project_id', width: 20 },
    { label: 'tasklist_code', key: 'tasklist_code', width: 12 },
    { label: 'tasklist_title', key: 'tasklist_title', width: 25 },
    { label: 'tasklist_due_date', key: 'tasklist_due_date', width: 17 },
    { label: 'tasklist_assignee', key: 'tasklist_assignee', width: 17 },
    { label: 'tasklist_rewrite_count', key: 'tasklist_rewrite_count', width: 20 },
  ];

  const projectOptions = projectAssignment.map((project) => ({
    value: project.project_id,
    label: project.project_name,
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
    const projectName = projectOptions.find(option => option.value === formData.project_id)?.label || 'Semua Proyek';
    doc.text(`Proyek: ${projectName}`, 10, 10);
    doc.setFontSize(12);
    doc.text(`Halaman: ${currentPage + 1}`, 10, 16); // Tambahkan informasi halaman
  
    const headers = TABLE_HEAD;
    const data = currentPageData.map(row => [
      row.tasklist_project_id,
      row.tasklist_code,
      row.tasklist_title,
      row.tasklist_due_date ? new Date(row.tasklist_due_date).toLocaleString() : 'N/A',
      row.tasklist_assignee,
      row.tasklist_rewrite_count,
    ]);
  
    // Atur lebar kolom (sesuaikan dengan jumlah kolom dan preferensi Anda)
    const columnWidths = [40, 40, 60, 40, 50, 30];
    const startX = 7;
    let startY = 22;
    const rowHeight = 7;
    const padding = 4;
  
    // Header Tabel
    doc.setFont('times new roman', 'bold');
    let currentX = startX;
    headers.forEach((header, i) => {
      doc.text(header, currentX + padding, startY + padding);
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
  
    const formattedProjectName = projectName.replace(/\s+/g, '_');
    doc.save(`Rewrite_Task_Report_${formattedProjectName}_${currentPage + 1}.pdf`);
  };

  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Rewrite Task
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <div className={`font-poppins w-72 py-2`}>
              <Select
                options={isLoading ? [{ value: '', label: <LoadingOption /> }] : projectOptions}
                value={projectOptions.find(option => option.value === formData.project_id) || null}
                onChange={(selectedOption) => {
                  handleProjectChange(selectedOption.value);
                  setProjectSelected(selectedOption !== null);
                }}
                isSearchable={true}
                placeholder="Project Name"
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
                      backgroundColor: 'transparent', // No background for loading state
                      cursor: 'default', // No hover effect
                      ':hover': {
                        backgroundColor: 'transparent', // No hover effect
                      },
                    }),
                  }),
                }}
              />
            </div>
            {projectSelected && (
              <div className="flex items-center ml-4">
                <div className="w-72 font-poppins mr-4">
                  <Input
                    label="Search"
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <ExcelExportButton
                  projectId={formData.project_id || 'default-project-id'}
                  tableRows={TABLE_ROWS}
                  headers={headers}
                  isRewriteTask={true}
                />
                <PDFButton onClick={generatePdf} />
              </div>
            )}
          </div>
        </CardHeader>

        <CardBody className="overflow-scroll px-0">
          {formData.project_id ? (
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
                        <span
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${sortConfig.key === head.toLowerCase().replace(' ', '_')
                              ? 'text-gray-500'
                              : 'text-gray-500'
                            }`}
                        >
                          <i className={`fa fa-sort-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
                        </span>
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
                Select a project to view the rewrite task report
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