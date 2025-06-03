import React, { useEffect, useState } from "react";
import { Typography, Card, CardBody, Dialog, DialogHeader, DialogBody, DialogFooter, Button, CardFooter } from '@material-tailwind/react';
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFButton } from "./FileButton";

export function TableMilestoneProject() {
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [modalProjects, setModalProjects] = useState([]);
    const [modalParam, setModalParam] = useState('');
    const [purchaseOrders, setPurchaseOrders] = useState([]);

    useEffect(() => {
        fetchMilestoneProjects();
        fetchPurchaseOrder();
    }, []);

    const fetchPurchaseOrder = async () => {
        try {
          const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-order`);
          setPurchaseOrders(responseData?.data || []);
        } catch (error) {
          console.error("Error fetching purchase order:", error);
        }
      };      

      const fetchMilestoneProjects = async () => {
        setIsLoading(true);
        const url = `${import.meta.env.VITE_BASE_URL}/api/v1/summary/milestone-projects`;
        const response = await apiRequest(url);
        const milestoneData = response?.data || [];
      
        // Sisipkan customer_name dari purchase order berdasarkan project_id
        const enrichedData = milestoneData.map(status => ({
          ...status,
          projects: status.projects.map(project => {
            const matchedPO = purchaseOrders.find(po => po.project_id === project.id);
            return {
              ...project,
              customer_name: matchedPO?.customer_name || '', // Tambahkan customer_name jika ada
            };
          })
        }));
      
        setIsLoading(false);
        setData(enrichedData);
      };      

    const getHeaderStyle = (paramDescription) => {
        const styles = {
            "NEW": { backgroundColor: 'rgba(211, 211, 211, 0.3)', color: '#A9A9A9' }, // Light Gray
            "KICK OFF": { backgroundColor: 'rgba(173, 216, 230, 0.3)', color: '#87CEFA' }, // Light Sky Blue
            "IMPLEMENTATION": { backgroundColor: 'rgba(144, 238, 144, 0.3)', color: '#98FB98' }, // Pale Green
            "BAST": { backgroundColor: 'rgba(255, 204, 153, 0.4)', color: '#FFA07A' }, // Soft Salmon
            "INVOICING": { backgroundColor: 'rgba(255, 255, 204, 0.6)', color: '#FFD700' }, // Softer Gold\
            "PAYMENT": { backgroundColor: 'rgba(255, 182, 193, 0.3)', color: '#FF6F61' }, // Pastel Red
            "COMPLETED": { backgroundColor: 'rgba(204, 153, 255, 0.3)', color: '#DA70D6' }, // Orchid
            "HOLD": { backgroundColor: 'rgba(192, 192, 192, 0.3)', color: '#1F1F1F' }, // Darker Gray
            "Default": { backgroundColor: 'rgba(192, 192, 192, 0.3)', color: '#4a4a4a' },
        };
    
        return styles[paramDescription] || styles["Default"];
    };      

    const handleOpenModal = (projects, paramDescription) => {
        setModalProjects(projects);
        setModalParam(paramDescription);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setModalProjects([]);
        setModalParam('');
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(12);
        doc.text(`Milestone Project: ${modalParam}`, 14, 15);
    
        const tableColumn = ["Project Name", "Milestone Start Date"];
        const tableRows = modalProjects.map(project => [
            project.name,
            project.startTime_Oncurrent_param || "-"
        ]);
    
        autoTable(doc, {
            startY: 20,
            head: [tableColumn],
            body: tableRows,
            styles: { fontSize: 10 }
        });
    
        doc.save(`${modalParam}_milestoneprojects.pdf`);
    };
    

    return (
        <Card className="shadow-lg rounded-lg border border-gray-200">
            <CardBody className="overflow-x-auto p-4">
                <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
                    <thead>
                        <tr>
                            {data.map((status) => (
                                <th 
                                    key={status.param_id} 
                                    style={getHeaderStyle(status.param_description)}
                                    className="border border-gray-300 p-4 text-center"
                                >
                                    <Typography className="font-semibold text-xs font-poppins text-blue-gray-900">
                                        {status.param_description}
                                    </Typography>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 && (
                            Array.from({ length: Math.max(...data.map(status => Math.min(status.projects.length, 4))) }).map((_, rowIndex) => (
                                <tr key={rowIndex}>
                                    {data.map((status, colIndex) => {
                                        const projects = status.projects;

                                        const isMoreAvailable = projects.length > 3;
                                        const visibleProjects = projects.slice(0, 3);

                                        return (
                                            <td key={colIndex} className="text-xs py-4 border px-4 text-center" style={{ color: '#212529' }}>
                                                {visibleProjects[rowIndex] ? (
                                                    <p className="text-xs" title={visibleProjects[rowIndex]?.customer_name}>
                                                        {visibleProjects[rowIndex].name}
                                                    </p>
                                                  
                                                ) : rowIndex === 3 && isMoreAvailable ? (
                                                    <p 
                                                        className="text-blue-500 cursor-pointer hover:underline font-semibold"
                                                        onClick={() => handleOpenModal(projects, status.param_description)}
                                                    >
                                                        More...
                                                    </p>
                                                ) : rowIndex < 4 && !isMoreAvailable ? (
                                                    <p style={{ color: '#212529' }}>-</p>
                                                ) : null}
                                            </td>
                                        );
                                    })} 
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </CardBody>

            <CardFooter className="flex items-center justify-center border-t border-gray-300 p-4"></CardFooter>

            <Dialog open={openModal} size="sm" handler={handleCloseModal}>
                <DialogHeader className="font-poppins text-xl">{modalParam} PROJECTS</DialogHeader>
                <DialogBody divider className="overflow-y-auto" style={{ maxHeight: '400px' }}>
                    <table className="min-w-full table-auto text-left font-poppins">
                        <thead>
                            <tr>
                                <th className="border px-4 py-2 text-xs font-semibold bg-[#F5F7F8]" style={{ color: '#646D71' }}>Project Name</th>
                                <th className="border px-4 py-2 text-xs font-semibold bg-[#F5F7F8]" style={{ color: '#646D71' }}>Milestone Start Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modalProjects.map((project, index) => (
                                <tr key={index}>
                                    <td
                                    className="border px-4 py-2 text-xs"
                                    style={{ color: '#212529' }}
                                    title={project.customer_name}
                                    >
                                        {project.name}
                                    </td>
                                    <td className="border px-4 py-2 text-xs" style={{ color: '#212529' }}>{project.startTime_Oncurrent_param}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </DialogBody>

                <DialogFooter>
                    <PDFButton onClick={generatePDF} />
                    <Button onClick={handleCloseModal} variant="text" color="red">
                        Close
                    </Button>
                </DialogFooter>
            </Dialog>
        </Card>
        
    );
}