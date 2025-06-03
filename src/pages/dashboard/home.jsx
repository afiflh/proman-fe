import React, { useEffect, useState } from "react";
import ApexCharts from "react-apexcharts";
import { apiRequest } from "@/utils/api-helper";
import { green600, orange600, rose600, blue600, slate600, purple600 } from "@/utils/chart-colors";
import { TableHighPriorityProject } from "@/components/TableHighPriorityProject";
import { TableMilestoneProject } from "@/components/TableMilestoneProject";
import { ExclamationCircleIcon, ArrowTrendingUpIcon, CheckCircleIcon, RocketLaunchIcon, AcademicCapIcon } from "@heroicons/react/24/solid";
import { TableImplementationDashboard } from "@/components/TableImplementationMilestone";

export function Home() {
  const [assignmentProgressData, setAssignmentProgressData] = useState([]);
  const [projectProgressData, setProjectProgressData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAssignmentProgress();
    fetchProjectProgress();
  }, []);

  const fetchAssignmentProgress = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/summary/assignment-progress`;
    const data = await apiRequest(url);
    setAssignmentProgressData(data?.data || []);
    console.log("data", data);
    setIsLoading(false);
  };

  const fetchProjectProgress = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/summary/project-progress`;
    const data = await apiRequest(url);
    setProjectProgressData(data?.data || []);
    setIsLoading(false);
  };

  const generatePieData = (statuses, isAssignment = false) => {
    const labels = statuses.map(status => status.status_name);
    const data = statuses.map(status => parseFloat(status.percentage.replace('%', '')));
  
    const colors = isAssignment 
      ? [rose600, blue600, green600, orange600, slate600, purple600]
      : [purple600, slate600, orange600, green600, blue600, rose600];
  
    return {
      series: data,
      options: {
        chart: {
          type: 'pie',
          height: 300,
        },
        labels: labels,
        colors: colors,
        legend: {
          position: 'bottom',
          fontSize: '11px',
          fontFamily: 'Poppins, sans-serif',
          labels: {
            colors: '#212529',
          },
          markers: {
            shape: 'square',
            size: 6,
            offsetX: -4,
          },
          itemMargin: {
            horizontal: 5,
            vertical: 5,
          },
        },
        tooltip: {
          y: {
            formatter: (value, { seriesIndex }) => `${statuses[seriesIndex].percentage}`,
          },
          style: {
            fontFamily: 'Poppins, sans-serif',
          },
        },
        dataLabels: {
          enabled: true,
          dropShadow: {
            enabled: false,
          },
          formatter: (value, { seriesIndex }) => `${statuses[seriesIndex].percentage}`,
          style: {
            fontFamily: 'Poppins, sans-serif',
            fontSize: '10px',
          },
          textAnchor: 'middle',
          offset: -10,
        },
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -10,
              minAngleToShowLabel: 10,
            },
          },
        },
      }
    };
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '198px' }}>
        <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full" role="status">
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Section 3: High Priority */}
      <div className="mb-6">
        <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <ExclamationCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-lg font-semibold font-poppins">High Priority Project</h1>
        </div>
        <TableHighPriorityProject />
      </div>
      

      {/* Section 4: Milestone Project List */}
      <div className="mb-6">
        <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <RocketLaunchIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-lg font-semibold font-poppins">Milestone Project</h1>
        </div>
        <TableMilestoneProject />
      </div>

      <div className="mb-6">
        <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-lg font-semibold font-poppins">Implementation Project</h1>
        </div>
        <TableImplementationDashboard />
      </div>
    </div>
  );
}

export default Home;