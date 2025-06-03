import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, CardBody, CardFooter, IconButton, Input } from "@material-tailwind/react";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import { handleTemplateDownload } from "@/utils/helper";
import { AiOutlineDownload } from "react-icons/ai";

const TABLE_HEAD = ["Description", "File"];

export function DocumentTemplate() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({key:'created_time', direction: 'descending'});
  const [isLoading, setIsLoading] = useState(true);

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/docs-standard`);
      processAndSetData(responseData, setTABLE_ROWS);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  const highlightText = (text) => {
    if (!searchQuery || typeof text !== 'string') return text;
  
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };

  const filterRows = (rows) => {
    if (!searchQuery) return rows;
  
    const queries = searchQuery.toLowerCase().split(' ').filter(Boolean);
    const fields = ['description', 'filename'];
  
    return rows.filter(row => {
      return queries.every(query => 
        fields.some(field => row[field] && row[field].toString().toLowerCase().includes(query))
      );
    });
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

  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);

  const tableRows = currentPageData.map((row, index) => {
    return (
      <tr key={row.id} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-4">{highlightText(row.description)}</td>
        <td className="border border-gray-300 p-4">
          <button
            onClick={() => handleTemplateDownload(row.filename)}
            className="flex items-center text-blue-600 hover:underline"
          >
            <AiOutlineDownload className="mr-2" />
            {highlightText(row.filename)}
          </button>
        </td>
      </tr>
    );
  });

  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);

  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Document Template Data
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <div className="w-72 font-poppins">
              <Input
                label="Search"
                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                value={searchQuery}
                onChange={handleSearch}
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
              ) : filteredRows.length > 0 ? tableRows : (
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