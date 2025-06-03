import React, { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, CardBody, CardFooter, IconButton, Input } from "@material-tailwind/react";
import { CalendarDaysIcon, DocumentChartBarIcon } from "@heroicons/react/24/solid";
import { apiRequest, processAndSetData, processAndSetDataKPI } from "@/utils/api-helper";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from 'react-select';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { AiFillFileExcel } from 'react-icons/ai';
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import { PDFButton } from "@/components/FileButton";

export function UserTask() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'task_id', direction: 'ascending' });
  const [projectAssignment, setProjectAssignment] = useState([]);
  const [projectSelected, setProjectSelected] = useState(false);
  const [groupSelected, setGroupSelected] = useState(false);
  const [formData, setFormData] = useState({ project_id: "", status_id: "", group_id: "" });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [status, setStatus] = useState([]);
  const [group, setGroup] = useState([]);
  const [filteredStatusOptions, setFilteredStatusOptions] = useState([]);
  const [kpiData, setKPIData] = useState({ flattenedData: [], uniqueAssignees: [] });
  const { flattenedData = [], uniqueAssignees = [] } = kpiData;

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchProjectAssignment();
    fetchStatus();
    fetchGroups();
  }, []);

  useEffect(() => {
    if (startDate && endDate && formData.project_id && formData.group_id &&  formData.status_id) {
      fetchUserTask(startDate, endDate, formData.project_id, formData.group_id, formData.status_id);
    }
  }, [startDate, endDate, formData.project_id, formData.group_id, formData.status_id]);

  useEffect(() => {
    if (startDate && endDate) {
      fetchUserTask(startDate, endDate);
    }
  }, [startDate, endDate]);

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

  const fetchUserTask = async (startDate, endDate, projectId = '', groupId = '', statusMode = '') => {
    setIsLoading(true);
    try {
        const startDateValue = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
        const endDateValue = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;

        let url = `${import.meta.env.VITE_BASE_URL}/api/v1/user-task?start_date=${startDateValue}&end_date=${endDateValue}`;
        if (projectId) url += `&project_id=${projectId}`;
        if (statusMode) url += `&mode=${statusMode}`;
        if (groupId) url += `&group_id=${groupId}`;
        
        const reportData = await apiRequest(url, "GET");
        processAndSetDataKPI(reportData, setKPIData); 
    } catch (error) {
        console.error("Error fetching KPI data: ", error);
        setKPIData([]);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const statusData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/status`, "GET");
      processAndSetData(statusData, setStatus);
  
      const kpiStatuses = statusData.data.filter(item => item.mode === "1");
      const filteredOptions = kpiStatuses.map(status => ({
        value: status.mode,
        label: status.name,
      }));
      setFilteredStatusOptions(filteredOptions);
    } catch (error) {
      console.error("Error fetching status: ", error);
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
        const value = row[key] ? row[key].toString().toLowerCase() : '';
        return value.includes(query);
      });
    });
  };  

  const sortedRows = useMemo(() => {
    if (!sortConfig) return [...TABLE_ROWS];
  
    const { key, direction } = sortConfig;
  
    return [...TABLE_ROWS].sort((a, b) => {
      let valueA = a[key];
      let valueB = b[key];
  
      // Default string comparison for other fields
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
  
      // Null checks for sorting: Nulls will always be considered smaller or larger based on direction
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

  const tableHeaders = [
      'Assignee',
      ...flattenedData.map(row => row.date)
  ];

  const tableRows = uniqueAssignees.map((assignee) => {
      return (
          <tr key={assignee} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
              <td className="border border-gray-300 p-4">{highlightText(assignee || 'N/A')}</td>
              {flattenedData.map((dateData) => {
                  const entry = dateData.assignees.find(a => a.assignee_name === assignee);
                  return (
                      <td key={dateData.date} className="border border-gray-300 p-4">
                          {highlightText(entry ? entry.task_title : 'N/A')}
                      </td>
                  );
              })}
          </tr>
      );
  });

  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);

  const handleProjectChange = (value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      project_id: value,
    }));
    setProjectSelected(true);
  };
  
  const handleStatusChange = (selectedOption) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      status_id: selectedOption.value,
    }));
  };

  const handleGroupChange = (value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      group_id: value,
    }));
    setGroupSelected(true);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date && endDate) {
      const diffDays = (endDate - date) / (1000 * 60 * 60 * 24);
      if (diffDays < -30) {
        setEndDate(new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000));
      } else if (diffDays > -7) {
        setEndDate(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000));
      }
    }
  };
  
  const handleEndDateChange = (date) => {
    if (date && startDate) {
      const diffDays = (startDate - date) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        alert("The end date must be at least 7 days before the start date.");
        return;
      } else if (diffDays > 30) {
        alert("The end date must not exceed 30 days before the start date.");
        return;
      }
    }
    setEndDate(date);
  };

  const projectOptions = projectAssignment.map((project) => ({
    value: project.project_id,
    label: project.project_name,
  }));

  const groupsOptions = group.map((group) => ({
    value: group.id,
    label: group.description,
  }));

  const LoadingOption = () => (
    <div className="flex items-center justify-center">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
    </div>
  );  

  const exportExcelUserTask = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("User Task Data");

    worksheet.columns = [
      { header: "Assignee", key: "assignee", width: 20 },
      ...flattenedData.map(row => ({ header: row.date, key: row.date, width: 30 }))
    ];
  
    worksheet.getRow(1).eachCell(cell => {
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

    uniqueAssignees.forEach(assignee => {
      const row = { assignee };
      flattenedData.forEach(dateData => {
        const entry = dateData.assignees.find(a => a.assignee_name === assignee);
        row[dateData.date] = entry ? entry.task_title : "N/A";
      });
      worksheet.addRow(row);
    });
  
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `[${formData.project_id}] User Task.xlsx`);
  };  

  const generatePDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(12);

    // Validasi yang lebih baik untuk objek Date
    const isValidDate = (date) => date instanceof Date && !isNaN(date);

    const start = startDate;
    const end = endDate;

    // --- Perubahan Kunci di sini ---
    // Gunakan metode getFullYear(), getMonth(), getDate() untuk format lokal
    const formatLocal = (date) => {
        if (!isValidDate(date)) return "Invalid Date";
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    // --- Akhir Perubahan Kunci ---

    let fileName = "User Task.pdf"; // Default filename
    let titleText = "User Task Report";

    if (formData.project_id) {
        const selectedProject = projectAssignment.find(
            (project) => project.project_id === formData.project_id
        );
        if (selectedProject) {
            const projectName = selectedProject.project_name;
            fileName = `${formData.project_id}_User Task.pdf`;
            titleText += ` - Project: ${projectName}`;
        } else {
            fileName = `User Task [Invalid Project ID].pdf`;
            titleText += ` - Invalid Project`;
        }
    } else if (isValidDate(start) && isValidDate(end)) {
        // Gunakan formatLocal() di sini
        fileName = `User Task (${formatLocal(start)} s.d. ${formatLocal(end)}).pdf`;
        titleText += ` - ${formatLocal(start)} s.d. ${formatLocal(end)}`;
    } else {
        fileName = `User Task [Filter Not Applied].pdf`;
        titleText += ` - No Filter Applied`;
    }

    doc.text(titleText, 14, 15);

    const head = [['Assignee', ...flattenedData.map(d => d.date)]];
    const body = uniqueAssignees.map(assignee => {
        const row = [assignee];
        flattenedData.forEach(dateData => {
            const entry = dateData.assignees.find(a => a.assignee_name === assignee);
            row.push(entry ? entry.task_title : "N/A");
        });
        return row;
    });

    autoTable(doc, {
        startY: 20,
        head: head,
        body: body,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 129, 189] },
    });

    doc.save(fileName);
};

  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              User Task
            </Typography>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w- relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5 z-10" />
                <DatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  maxDate={new Date()}
                  placeholderText="Start Date"
                  className={`w-full pl-10 py-2.5 border border-blue-gray-200 rounded-md text-sm font-poppins ${startDate ? 'text-black' : 'text-gray-600'} placeholder-gray-600`}
                  showYearDropdown
                  scrollableYearDropdown
                />
              </div>
              <div className="w- relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 h-5 w-5 z-10" />
                <DatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate ? new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000) : null}
                  maxDate={startDate ? new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000) : null}
                  placeholderText="End Date"
                  className={`w-full pl-10 py-2.5 border border-blue-gray-200 rounded-md text-sm font-poppins ${endDate ? 'text-black' : 'text-gray-600'} placeholder-gray-600`}
                  showYearDropdown
                  scrollableYearDropdown
                />
              </div>
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
              <Select
                options={filteredStatusOptions}
                onChange={handleStatusChange}
                placeholder="Status"
                className="w-48 font-poppins"
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
                  }),
                }}
              />
            </div>
            {startDate && endDate && (
            <div className="flex items-center">
              <div className="w-72 font-poppins mr-4">
                <Input
                  label="Search"
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              <button
                onClick={exportExcelUserTask}
                className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
              >
                <AiFillFileExcel className="w-5 h-5" aria-hidden="true" />
              </button>
              <PDFButton onClick={generatePDF} />
            </div>
          )}
          </div>
        </CardHeader>

        <CardBody className="overflow-scroll px-0">
          {startDate && endDate ? (
              <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
                  <thead className="bg-blue-gray-50/50">
                      <tr>
                          {tableHeaders.map((head, index) => (
                              <th key={index} className="border border-gray-300 p-4 cursor-pointer relative">
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
                              <td colSpan={tableHeaders.length} className="text-center py-10">
                                  <div className="flex items-center justify-center">
                                      <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                                  </div>
                              </td>
                          </tr>
                      ) : tableRows.length > 0 ? (
                          tableRows
                      ) : (
                          <tr>
                              <td colSpan={tableHeaders.length} className="text-center py-4">
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
                      Select a project to view the user task
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