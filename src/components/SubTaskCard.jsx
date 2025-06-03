import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Typography, Button, Input, IconButton } from '@material-tailwind/react';
import { PlusIcon, PencilIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SubTaskCard = ({ subtasklist, handleOpenSub, handleEditSubTask, isLoading, pageCount, currentPage, handlePageClick}) => {
  const [searchQuerySub, setSearchQuerySub] = useState('');
  const [sortConfigSub, setSortConfigSub] = useState({ key: 'kode', direction: 'ascending' });

  const handleSearchSub = (e) => {
    setSearchQuerySub(e.target.value);
  };

  const handleSortSub = (key) => {
    let direction = 'ascending';
    if (sortConfigSub.key === key && sortConfigSub.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfigSub({ key, direction });
  };

  const sortedRows = useMemo(() => {
    let sortableItems = [...subtasklist]; // Ganti TABLE_ROWS dengan subtasklist
    if (sortConfigSub !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfigSub.key] < b[sortConfigSub.key]) {
          return sortConfigSub.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfigSub.key] > b[sortConfigSub.key]) {
          return sortConfigSub.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [subtasklist, sortConfigSub]); // Ganti TABLE_ROWS dengan subtasklist

  const filterRows = (rows) => {
    if (!searchQuerySub) return rows;

    const query = searchQuerySub.toLowerCase();

    return rows.filter(row => {
      return (
        (row.kode && row.kode.toString().toLowerCase().includes(query)) ||
        (row.title && row.title.toString().toLowerCase().includes(query)) ||
        (row.assignee && row.assignee.toLowerCase().includes(query))
      );
    });
  };

  const filteredRows = filterRows(sortedRows);

  return (
    <Card className="h-full w-full mt-4">
      <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
        <div className="mb-6 border-b border-gray-300 pb-3">
          <Typography className="font-poppins text-sm font-medium text-gray-600">
            Project Sub Task Data
          </Typography>
        </div>
        <div className="flex items-center justify-between">
          <Button
            color="blue"
            className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
            onClick={handleOpenSub}
          >
            <PlusIcon className="h-5 w-5" />
            Add
          </Button>
          <div className="w-72 font-poppins">
            <Input
              label="Search"
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              value={searchQuerySub}
              onChange={handleSearchSub}
            />
          </div>
        </div>
      </CardHeader>

      <CardBody className="overflow-scroll px-0">
      <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
        <thead className="bg-blue-gray-50/50">
          <tr>
            {['Kode', 'Title', 'Assignee', 'Action'].map((head, index) => (
              <th
                key={index}
                className="border border-gray-300 p-4 cursor-pointer relative"
                onClick={head.toLowerCase() === 'action' ? undefined : () => handleSortSub(head.toLowerCase())}
              >
                <div className="flex items-center">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-semibold leading-none opacity-70 font-poppins text-xs"
                  >
                    {head}
                  </Typography>
                  {head.toLowerCase() !== 'action' && (
                    <span
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${sortConfigSub.key === head.toLowerCase()
                        ? 'text-gray-500'
                        : 'text-gray-500'
                      }`}
                    >
                      <i className={`fa fa-sort-${sortConfigSub.direction === 'ascending' ? 'up' : 'down'}`}></i>
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
              <td colSpan={7} className="text-center py-10">
                <div className="flex items-center justify-center">
                  <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                </div>
              </td>
            </tr>
          ) : filteredRows.length > 0 ? (
            filteredRows.map((subtask) => (
              <tr key={subtask.kode} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
                <td className="border border-gray-300 p-2">{subtask.kode}</td>
                <td className="border border-gray-300 p-2">{subtask.title}</td>
                <td className="border border-gray-300 p-2">{subtask.assignee}</td>
                <td className="border border-gray-300 p-2">
                  <div className="flex items-center">
                    <IconButton variant="text" color="blue" onClick={() => handleEditSubTask(subtask)}>
                      <PencilIcon className="h-5 w-5" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-4">
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

      <CardFooter className="flex items-center justify-center border-t border-gray-300 p-4">
        <div className="flex items-center gap-2">
          {[...Array(pageCount)].map((_, i) => (
            <IconButton
              key={i}
              variant={i === currentPage ? "outlined" : "text"}
              size="sm"
              className={`rounded-lg border border-black text-[#212121]`}
              onClick={() => handlePageClick(i)}
              style={{
                backgroundColor: i === currentPage ? '#212121' : 'transparent',
                color: i === currentPage ? '#FFFFFF' : '#212121',
                fontSize: '12px',
                lineHeight: '12px'
              }}
            >
              {i + 1}
            </IconButton>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default SubTaskCard;
