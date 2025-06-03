import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Dialog, DialogHeader, DialogBody, DialogFooter, Select, Option } from "@material-tailwind/react";
import NotificationDialog from "@/components/NotificationDialog";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import Cookies from 'js-cookie';
import { apiRequest, processAndSetData } from "@/utils/api-helper";

const TABLE_HEAD = ["Actions", "Id", "Name", "Description", "Single Process", "Single Assigner", "Mode", "Created By", "Created Time"];

export function Status() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", description: "", single_process: "", single_assigner: "", mode: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [sortConfig, setSortConfig] = useState({key:'created_time', direction: 'descending'});
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/status`);
      processAndSetData(responseData, setTABLE_ROWS);
    } catch (error) {
      console.error("Error fetching status:", error);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSingleProcessChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      single_process: value === "true",
    }));
  };
  
  const handleSingleAssignerChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      single_assigner: value === "true",
    }));
  };

  const handleModeChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      mode: value,
    }));
  };  

  const handleSubmit = async () => {
    const token = Cookies.get('TOKEN');
    const decryptedUserId = decryptPayload(Cookies.get('USER_ID'));

    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `/api/v1/status/${formData.id}/edit` : "/api/v1/status/store";
  
    const dataToSend = {
      ...formData,
      created_by: decryptedUserId,
      updated_by: isEditing ? decryptedUserId : undefined,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        method,
        body: JSON.stringify({ msg: encryptPayload(JSON.stringify(dataToSend)) }),
      });
  
      const statusCode = response.status;
      const data = await response.json();
      const decryptedData = decryptPayload(data.msg);
      const objectData = JSON.parse(decryptedData);
  
      const message = capitalizeWords(objectData.message) || `Data ${isEditing ? 'Updated' : 'Added'} Successfully!`;

      if (statusCode == 500) {
        // Jika status code 500 (Error server)
        setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
      } else if (statusCode >= 400 && statusCode < 500) {
        // Jika status code selain 500, misalnya 400 (Warning)
        setNotification({ open: true, message: message || 'A Warning Occurred.', isError: false, isWarning: true });
      } else if (statusCode === 200) {
        // Untuk status sukses
        setNotification({ open: true, message, isError: false });
        setIsOpen(false);
        setIsEditing(false);
        setFormData({ id: "", name: "", description: "", single_process: "", single_assigner: "", mode: ""  });
        fetchStatus();
      } else {
        setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
      }
    } catch (error) {
      console.error("Error saving data: ", error);
      setNotification({ open: true, message: 'An Unexpected Error Occurred. Please Try Again Later.', isError: true });
    }
  };  

  const handleEdit = (id) => {
    const status = TABLE_ROWS.find((status) => status.id === id);
    if (status) {
      setFormData({
        id: status.id,
        name: status.name,
        description: status.description,
        single_process: status.single_process,
        single_assigner: status.single_assigner,
        mode: status.mode,
      });
      setIsEditing(true);
      setIsOpen(true);
    }
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const confirmDeletion = async () => {
    const token = Cookies.get('TOKEN');
  
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/status/${deleteId}/delete`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        method: "DELETE",
      });
  
      const data = await response.json();
      const decryptedData = decryptPayload(data.msg);
      const objectData = JSON.parse(decryptedData);
  
      const message = capitalizeWords(objectData.message) || 'Data deleted successfully!';
      if (objectData.status === "success") {
        setNotification({ open: true, message, isError: false });
        await fetchStatus();
      } else {
        setNotification({ open: true, message: message || 'An error occurred while deleting the data.', isError: true });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ open: true, message: 'An unexpected error occurred. Please try again later.', isError: true });
    } finally {
      setDeleteId(null);
      setConfirmDelete(false);
    }
  };  

  const highlightText = (text) => {
    if (!searchQuery) return text;
  
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };  

  const filterRows = (rows) => {
    if (!searchQuery) return rows;
  
    const query = searchQuery.toLowerCase();
    const fields = ['id', 'name', 'description', 'single_process', 'single_assigner', 'mode', 'created_by_name', 'created_time'];
    
    return rows.filter(row => {
      return fields.some(field => {
        let value = row[field];
        if (field === 'single_process' || field === 'single_assigner' || field === 'mode') {
          value = row[field] ? "yes" : "no";
        }
        return value && value.toString().toLowerCase().includes(query);
      });
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
    const isLast = index === currentPageData.length - 1;
    const classes = isLast ? "p-4" : "p-4 border-b border-blue-gray-50";

    return (
      <tr key={row.id} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-2">
          <div className="flex items-center">
            <IconButton variant="text" color="blue" onClick={() => handleEdit(row.id)}>
              <PencilIcon className="h-5 w-5" />
            </IconButton>
            <IconButton variant="text" color="red" onClick={() => handleDelete(row.id)}>
              <TrashIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </td>
        <td className="border border-gray-300 p-2">{highlightText(row.id)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.description)}</td>
        <td className="border border-gray-300 p-2">
          {highlightText(row.single_process ? "Yes" : "No")}
        </td>
        <td className="border border-gray-300 p-2">
          {highlightText(row.single_assigner ? "Yes" : "No")}
        </td>
        <td className="border border-gray-300 p-2">
          {highlightText(row.mode === "0" ? "Todo" : row.mode === "1" ? "Progress" : row.mode === "2" ? "Done" : row.mode === "3" ? "Hold" : "Null")}
        </td>
        <td className="border border-gray-300 p-2">{highlightText(row.created_by_name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.created_time)}</td>       
      </tr>
    );
  });

  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);
  
  const capitalizeWords = (text) => 
  typeof text === 'string'
    ? text.split(' ')
    .map(word => `${word[0]?.toUpperCase() ?? ''}${word.slice(1).toLowerCase()}`).join(' ')
    : text;

  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Status Data
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <Button
              color="blue"
              className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  id: "",
                  name: "",
                  description: "",
                  single_process: "",
                  single_assigner: "",
                  mode: "",
                });
                setIsOpen(true);
              }}
            >
              <PlusIcon className="h-5 w-5" />
              Add
            </Button>
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

      <Dialog 
        open={isOpen} 
        handler={() => {}}
        dismiss={{
        outsidePointerDown: false,
        escapeKeyDown: false,
        }} 
        size="sm"
      >
        <DialogHeader className="font-poppins text-xl font-semibold">{isEditing ? "Edit Data" : "Add Data"}</DialogHeader>
        <DialogBody divider>
          <div className="space-y-6 font-poppins">
            <Input
              label="ID"
              name="id"
              value={formData.id}
              onChange={handleChange}
              disabled={isEditing}
            />
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <Input
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
            <Select
              label="Single Process"
              name="single_process" 
              value={String(formData.single_process)}
              onChange={handleSingleProcessChange}>
              <Option value="true">Yes</Option>
              <Option value="false">No</Option>
            </Select>
            <Select
              label="Single Assigner"
              name="single_assigner" 
              value={String(formData.single_assigner)}
              onChange={handleSingleAssignerChange}>
              <Option value="true">Yes</Option>
              <Option value="false">No</Option>
            </Select>
            <Select
              label="Mode"
              value={formData.mode}
              onChange={(value) => handleModeChange(value)}
            >
              <Option value="0">Todo</Option>
              <Option value="1">Progress</Option>
              <Option value="2">Done</Option>
              <Option value="3">Hold</Option>
            </Select>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setIsOpen(false)}
            className="mr-2"
          >
            <span className="font-poppins font-semibold">Cancel</span>
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={handleSubmit}
          >
            <span className="font-poppins font-semibold">{isEditing ? "Save" : "Add"}</span>
          </Button>
        </DialogFooter>
      </Dialog>

      <NotificationDialog
        open={confirmDelete}
        setOpen={(isOpen) => setConfirmDelete(isOpen)}
        message="Are you sure you want to delete this data?"
        isConfirmation={true}
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmDelete(false)}
      />

      <NotificationDialog
        open={notification.open}
        setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
        message={notification.message}
        isError={notification.isError}
        isWarning={notification.isWarning}
      />
    </>
  );
}