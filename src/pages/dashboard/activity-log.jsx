import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, CardBody, CardFooter, IconButton, Input } from "@material-tailwind/react";
import { apiRequest } from "@/utils/api-helper";
import { ExcelExportButton } from "@/components/ExportExcelButton";

const TABLE_HEAD = ["Date Time", "Activity", "User Id"];

export function ActivityLog() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'date_time', direction: 'descending' });
  const [isLoading, setIsLoading] = useState(true);
  const [totalPage, setTotalPage] = useState(0);

  const PER_PAGE = 10;

  useEffect(() => {
    fetchActivityLogs();
  }, [currentPage, searchQuery]);

  const fetchActivityLogs = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(
        `${import.meta.env.VITE_BASE_URL}/api/v1/activity-logs?page=${currentPage + 1}&limit=${PER_PAGE}&search=${searchQuery}`
      );
      if (responseData.status === "success") {
        setTABLE_ROWS(responseData.data.data_logs);
        setTotalPage(responseData.data.total_page);
      }
    } catch (error) {
      console.error("Error fetching activity logs: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value.trim());
    setCurrentPage(0);
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const highlightText = (text) => {
    if (!searchQuery || typeof text !== 'string') return text;

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };

  const sortedRows = React.useMemo(() => {
    if (!sortConfig) return [...TABLE_ROWS];

    const { key, direction } = sortConfig;
    const sorted = [...TABLE_ROWS].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (direction === 'ascending' ? 1 : -1);
    });

    return sorted;
  }, [TABLE_ROWS, sortConfig]);

  const requestSort = (key) => {
    if (key === 'actions') return;

    setSortConfig(prev => {
      const direction = (prev && prev.key === key && prev.direction === 'ascending') ? 'descending' : 'ascending';
      return { key, direction };
    });
  };

  const headers = [
    { label: 'Date Time', key: 'date_time', width: 20 },
    { label: 'Activity', key: 'activity', width: 100 },
    { label: 'User Id', key: 'user_id', width: 15 },
  ];

  const tableRows = sortedRows.map((row) => {
    return (
      <tr key={row.id} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-4">{highlightText(row.date_time)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.activity)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.user_id)}</td>
      </tr>
    );
  });

  return (
    <Card className="h-full w-full mt-4">
      <CardHeader floated={false} shadow={false} className="rounded-none">
        <div className="mb-6 border-b border-gray-300 pb-3">
          <Typography className="font-poppins text-sm font-medium text-gray-600">
            Activity Log
          </Typography>
        </div>
        <div className="flex items-center justify-between p-2">
          <div className="flex-grow" />
          <div className="flex items-center space-x-4">
            <div className="w-72 font-poppins">
              <Input
                label="Search"
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <ExcelExportButton
              projectId="activity_log"
              tableRows={TABLE_ROWS}
              headers={headers}
            />
          </div>
        </div>
      </CardHeader>

      <CardBody className="overflow-scroll px-0">
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
                    {head.toLowerCase() !== 'actions' && (
                      <span
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                          sortConfig.key === head.toLowerCase().replace(' ', '_')
                            ? 'text-gray-500'
                            : 'text-gray-500'
                        }`}
                      >
                        <i className={`fa fa-sort-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
                      </span>
                    )}
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
            ) : sortedRows.length > 0 ? tableRows : (
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
      </CardBody>

      <CardFooter className="flex items-center justify-center border-t border-blue-gray-50 p-4">
        <div className="flex items-center gap-2">
          <IconButton
            variant="text"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => handlePageClick(currentPage - 1)}
          >
            &lt;
          </IconButton>

          {[...Array(totalPage)].map((_, i) => {
            if (i === 0 || i === totalPage - 1 || Math.abs(i - currentPage) <= 2) {
              return (
                <IconButton
                  key={i}
                  variant={i === currentPage ? "outlined" : "text"}
                  size="sm"
                  onClick={() => handlePageClick(i)}
                >
                  {i + 1}
                </IconButton>
              );
            }
            if (i === 1 || i === totalPage - 2 || Math.abs(i - currentPage) === 3) {
              return <span key={i}>...</span>;
            }
            return null;
          })}

          <IconButton
            variant="text"
            size="sm"
            disabled={currentPage === totalPage - 1}
            onClick={() => handlePageClick(currentPage + 1)}
          >
            &gt;
          </IconButton>
        </div>
      </CardFooter>
    </Card>
  );
}