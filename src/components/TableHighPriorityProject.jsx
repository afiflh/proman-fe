import React, { useEffect, useState } from "react";
import { Typography, Card, CardBody, CardFooter, IconButton } from '@material-tailwind/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; 
import { formatDate } from "@/utils/helper";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFButton } from "./FileButton";

export function TableHighPriorityProject() {
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchHighPriorityProjects();
    fetchPurchaseOrder();
  }, []);

  const fetchHighPriorityProjects = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/summary/high-priority-projects`;
    const response = await apiRequest(url);
    console.log("High Priority Projects:", response?.data);
    processAndSetData(response?.data, setData);
    setIsLoading(false);
  };

  const fetchPurchaseOrder = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-order`);
      console.log('PO DATA', responseData);
      setPurchaseOrders(responseData?.data || []);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
    }
  };

  // Gabungkan customer_name dari PO ke proyek
  useEffect(() => {
    if (data.length > 0 && purchaseOrders.length > 0) {
      const merged = data.map((project) => {
        const po = purchaseOrders.find(po => po.project_id === project.id);
        return {
          ...project,
          customer_name: po?.customer_name || 'Unknown',
        };
      });
      setData(merged);
    }
  }, [purchaseOrders]);

  const TABLE_HEAD = ['ID', 'Project Name', 'Start Date', 'End Date', 'Assignee Team'];

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const filteredRows = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const generatePDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(12);
  
    doc.text("High Priority Project Report", 14, 15);
  
    const head = [['ID', 'Project Name', 'Start Date', 'End Date', 'Assignee Team']];
    const body = filteredRows.map(row => [
      row.id,
      row.project_name,
      formatDate(row.start_date),
      formatDate(row.end_date),
      row.assignee_team.replace(/,/g, ', ')
    ]);
  
    autoTable(doc, {
      startY: 20,
      head: head,
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 129, 189] },
    });
  
    doc.save("High_Priority_Projects.pdf");
  };

  return (
    <Card className="shadow-lg rounded-lg border border-gray-200">
      <CardBody className="overflow-x-auto p-4">
        <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
          <thead className="bg-blue-gray-50/50">
            <tr>
              {TABLE_HEAD.map((head) => (
                <th
                  key={head}
                  className="border border-gray-300 p-4 cursor-pointer relative"
                  onClick={head.toLowerCase() === 'actions' ? undefined : () => requestSort(head.toLowerCase().replace(' ', '_'))}
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
              filteredRows.map((row, index) => (
                <tr key={index}>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>{row.id}</td>
                  <td
                    className="text-xs py-4 border px-4 relative"
                    style={{ color: '#212529' }}
                    title={row.customer_name}
                  >
                    {row.project_name}
                  </td>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>{formatDate(row.start_date)}</td>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>{formatDate(row.end_date)}</td>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>
                    {row.assignee_team.replace(/,/g, ', ')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <MagnifyingGlassIcon className="h-16 w-16 mb-4 animate-bounce mt-4" />
                    <Typography className="font-poppins text-xl font-medium">Data Not Found!</Typography>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="mt-2 flex justify-start">
          <PDFButton onClick={generatePDF} />
        </div>
      </CardBody>

      <CardFooter className="flex items-center justify-center border-t border-gray-300 p-4">
        <div className="flex items-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <IconButton
              key={i}
              variant="outlined"
              size="sm"
              className={`rounded-lg ${i === currentPage - 1 ? 'border-black text-black' : 'border-none text-black'}`}
              onClick={() => handlePageChange(i + 1)}
              style={{
                borderColor: i === currentPage - 1 ? '#212121' : 'transparent',
                backgroundColor: 'transparent',
                color: i === currentPage - 1 ? '#212121' : '#212121',
                fontSize: '12px',
                lineHeight: '12px',
              }}
            >
              {i + 1}
            </IconButton>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}