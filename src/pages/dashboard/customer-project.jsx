import React, { useEffect, useState } from "react";
import { Card, CardHeader, Typography, CardBody } from "@material-tailwind/react";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Select from 'react-select';
import { DocumentChartBarIcon } from "@heroicons/react/24/solid";
import * as ExcelJS from 'exceljs';
import { AiFillFileExcel } from 'react-icons/ai';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFButton } from "@/components/FileButton";

export function CustomerProject() {
  const [customer, setCustomer] = useState([]);
  const [formData, setFormData] = useState({ customer_id: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [projectData, setProjectData] = useState([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  
  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerProject();
      const selectedCustomer = customer.find(c => c.id === formData.customer_id);
      if (selectedCustomer) {
        setSelectedCustomerName(selectedCustomer.name);
      }
    }
  }, [formData.customer_id, customer]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/customer`);
      processAndSetData(responseData, setCustomer);
    } catch (error) {
      console.error("Error fetching customers: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerProject = async () => {
    setIsLoading(true);
    try {
      const reportData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/customer-project/${formData.customer_id}`, "GET");
      processAndSetData(reportData, setProjectData);
    } catch (error) {
      console.error("Error fetching report data: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectChange = (selectedOption) => {
    if (selectedOption) {
      setFormData(prevFormData => ({
        ...prevFormData,
        customer_id: selectedOption.value,
      }));
    }
  };

  const exportToExcel = (project) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Project Report');
  
    worksheet.columns = [
      { header: 'Project Name', key: 'project_name', width: 30 },
      { header: 'Start Date', key: 'project_start_date', width: 15 },
      { header: 'End Date', key: 'project_end_date', width: 15 },
      ...project.project_status_assignment.map(status => ({
        header: status.status_name,
        key: status.status_name,
        width: 15,
      })),
    ];
  
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
  
    const rowData = {
      project_name: project.project_name,
      project_start_date: project.project_start_date,
      project_end_date: project.project_end_date,
      ...project.project_status_assignment.reduce((acc, status) => {
        acc[status.status_name] = status.count;
        return acc;
      }, {}),
    };
  
    worksheet.addRow(rowData);

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }
    });
    
    const filename = `${selectedCustomerName} - ${project.project_name}.xlsx`;
  
    workbook.xlsx.writeBuffer().then((data) => {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }; 

  const customerOptions = customer.map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));
  const LoadingOption = () => (
    <div className="flex items-center justify-center">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
    </div>
  );

  const exportAllToPdf = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const margin = 10;
    const customerTitle = `Daftar Proyek: ${selectedCustomerName}`;
  
    pdf.setFontSize(16);
    pdf.text(customerTitle, margin, 15);
  
    projectData.forEach((project, index) => {
      const tableHeaders = [
        "Project Name",
        "Start Date",
        "End Date",
        ...project.project_status_assignment.map(s => s.status_name)
      ];
  
      const tableBody = [[
        project.project_name,
        project.project_start_date,
        project.project_end_date,
        ...project.project_status_assignment.map(s => s.count)
      ]];
  
      autoTable(pdf, {
        startY: index === 0 ? 25 : pdf.lastAutoTable.finalY + 10,
        head: [tableHeaders],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [244, 244, 244],
          textColor: 33,
          fontSize: 10,
          halign: 'center',
        },
        bodyStyles: {
          fontSize: 10,
          textColor: 50,
          halign: 'center',
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 3,
        },
      });
    });
  
    pdf.save(`${selectedCustomerName} - All Projects.pdf`);
  };

  return (
    <Card className="h-full w-full mt-4">
      <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
        <div className="mb-6 border-b border-gray-300 pb-3">
          <Typography className="font-poppins text-sm font-medium text-gray-600">Customer Project</Typography>
        </div>
        <div className="font-poppins py-2 flex items-center space-x-4"> {/* Gunakan flex dan space-x-4 */}
          <div className="w-72"> {/* Batasi lebar Select */}
            <Select
              options={isLoading ? [{ value: '', label: <LoadingOption /> }] : customerOptions}
              value={customerOptions.find(option => option.value === formData.customer_id) || null}
              onChange={handleProjectChange}
              isSearchable={true}
              placeholder="Customer"
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
          {projectData.length > 0 && (
            <PDFButton
              onClick={exportAllToPdf}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded font-poppins text-xs"
            />
          )}
        </div>
      </CardHeader>

      <CardBody>
        {formData.customer_id === "" ? (
          <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '45px' }}>
            <DocumentChartBarIcon className="h-16 w-16 mb-4 animate-bounce" />
            <Typography className="text-center font-poppins text-lg font-medium text-gray-500 mb-12">
              Select a project to view the customer project report
            </Typography>
          </div>
        ) : isLoading ? (
          <LoadingOption />
        ) : (
          projectData.length > 0 ? (
            projectData.map((project) => (
              <div key={project.project_id} className="mb-10" style={{ color: '#212529' }}>
                <table className="min-w-full table-auto border-collapse border border-gray-300 text-center" style={{ color: '#212529' }} id={`project-table-${project.project_id}`}>
                  <thead style={{ backgroundColor: '#F5F7F8', color: '#646D71' }}>
                    <tr>
                      <th className="border border-gray-300 p-2 font-poppins text-xs font-semibold">Project Name</th>
                      <th className="border border-gray-300 p-2 font-poppins text-xs font-semibold">Start Date</th>
                      <th className="border border-gray-300 p-2 font-poppins text-xs font-semibold">End Date</th>
                      {project.project_status_assignment.map(status => (
                        <th key={status.status_id} className="border border-gray-300 p-2 font-poppins text-xs font-semibold">{status.status_name}</th>
                      ))}
                      <th className="border border-gray-300 p-2 font-poppins text-xs font-semibold">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-2 font-poppins text-xs" style={{ color: '#212529' }}>{project.project_name}</td>
                      <td className="border border-gray-300 p-2 font-poppins text-xs" style={{ color: '#212529' }}>{project.project_start_date}</td>
                      <td className="border border-gray-300 p-2 font-poppins text-xs" style={{ color: '#212529' }}>{project.project_end_date}</td>
                      {project.project_status_assignment.map(status => (
                        <td key={status.status_id} className="border border-gray-300 p-2 font-poppins text-xs text-gray-600" style={{ color: '#212529' }}>{status.count}</td>
                      ))}
                    <td className="border border-gray-300 p-2 font-poppins text-xs">
                      <button
                        onClick={() => exportToExcel(project)}
                      >
                        <AiFillFileExcel className="w-5 h-5 text-blue-500" aria-hidden="true" />
                    </button>
                    </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '69px' }}>
              <DocumentChartBarIcon className="h-16 w-16 mb-4 animate-bounce" />
              <Typography className="text-center font-poppins text-lg font-medium text-gray-500">
                No projects available for the selected customer
              </Typography>
            </div>
          )
        )}
      </CardBody>
    </Card>
  );
}