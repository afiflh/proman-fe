import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Textarea, Dialog, DialogHeader, DialogBody, DialogFooter, Option, Select as MaterialSelect } from "@material-tailwind/react";
import NotificationDialog from "@/components/NotificationDialog";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { formatDate, capitalizeWords } from "@/utils/helper";
import Cookies from 'js-cookie';
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Select from 'react-select';

const TABLE_HEAD = ["Actions", "Id", "Name", "Description", "Start Date", "End Date", "Milestone", "Status", "Status Info", "Created By", "Created Time", "Updated By", "Updated Time"];

export function Projects() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", description: "", start_date: "", end_date: "", status: "", duration: 0, status_info: "", substatus: "" });
  const [param, setParameter] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [sortConfig, setSortConfig] = useState({key:'created_time', direction: 'descending'});
  const [projectData, setProjectData] = useState([]);
  const [childOptions, setChildOptions] = useState([]);
  const [selectedSubstatus, setSelectedSubstatus] = useState("");
  const [projectKey, setProjectKey] = useState(0);

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchProjects();
    fetchParameterProjectType();
    // fetchAllPurchaseOrder();
    fetchPendingPurchaseOrder();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/projects`);
      processAndSetData(responseData, setTABLE_ROWS);
      console.log("Projects fetched successfully:", responseData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPurchaseOrder = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-order/getProjectIdName`);
      processAndSetData(responseData, setProjectData);
    } catch (error) {
      console.error("Error fetching parameters:", error);
    }
  }; 

  const fetchPendingPurchaseOrder = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-order/pendingProject`);
      processAndSetData(responseData, setProjectData);
    } catch (error) {
      console.error("Error fetching parameters:", error);
    }
  };  

  const fetchParameterProjectType = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/parameters/project-status`);
      processAndSetData(responseData, setParameter);
    } catch (error) {
      console.error("Error fetching parameters:", error);
    }
  };  

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  const handleChange = (e, name) => {
    let value;
  
    if (e.target) { // If an event object is passed
      ({ name, value } = e.target);
    } else { // If a value is passed directly
      value = e;
    }
  
    // Check for status change
    if (name === "status") {
      const selectedStatus = param.find(p => p.data === value);
  
      // If the selected status has child options, set them
      if (selectedStatus) {
        setChildOptions(selectedStatus.child || []);
        setSelectedSubstatus(""); // Reset substatus when the parent status changes
        setFormData(prevFormData => ({
          ...prevFormData,
          status: value,
          substatus: "" // Reset substatus in formData too
        }));
      } else {
        setChildOptions([]); // Clear child options if no children exist
        setSelectedSubstatus(""); // Also reset substatus
        setFormData(prevFormData => ({
          ...prevFormData,
          status: value,
          substatus: "" // Reset substatus in formData too
        }));
      }
  
      // Increment projectKey state
      setProjectKey(prevKey => prevKey + 1);
    } else if (name === "substatus") {
      // Check for substatus change
      setSelectedSubstatus(value);
      setFormData(prevFormData => ({
        ...prevFormData,
        substatus: value,
      }));
  
      // Increment projectKey state
      setProjectKey(prevKey => prevKey + 1);
    } else if (name === "start_date" && formData.duration) {
      const startDate = new Date(value);
      const duration = formData.duration;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + duration);
  
      setFormData(prevFormData => ({
        ...prevFormData,
        [name]: value,
        end_date: endDate.toISOString().split('T')[0],
      }));
    } else {
      setFormData(prevFormData => ({
        ...prevFormData,
        [name]: value,
      }));
    }
  };

  const handleProjectIdChange = (selectedOption) => {
    // Get the selected project's ID
    const selectedProjectId = selectedOption ? selectedOption.value : null;
  
    // Find the selected project based on its ID
    const selectedProject = projectData.find(project => project.id === selectedProjectId);
  
    // Update the formData with the selected project's details
    setFormData({
      ...formData,
      id: selectedProjectId,
      name: selectedProject ? selectedProject.name : "",
      duration: selectedProject ? selectedProject.duration : 0,
      start_date: "",  // Reset start date to allow for fresh input
      end_date: "",    // Reset end date accordingly
    });
  };

  const handleSubmit = async () => {
    const token = Cookies.get('TOKEN');
    const decryptedUserId = decryptPayload(Cookies.get('USER_ID'));
    const statusAsString = String(formData.status);
  
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `/api/v1/projects/${formData.id}/edit` : "/api/v1/projects/store";
  
    const { duration, ...dataToSend } = {
      ...formData,
      created_by: isEditing ? decryptedUserId : decryptedUserId,
      updated_by: isEditing ? decryptedUserId : undefined,
      status: statusAsString,
      substatus: selectedSubstatus,
    };    
  
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        method: method,
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
        setFormData({ id: "", name: "", description: "", start_date: "", end_date: "", status: "", substatus: "", status_info: "" });
        await fetchProjects();
        await fetchPendingPurchaseOrder();
      } else {
        setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
      }
    } catch (error) {
      console.error("Error saving data: ", error);
      setNotification({ open: true, message: 'An Unexpected Error Occurred. Please Try Again Later.', isError: true });
    }
  };
  
  const handleAdd = () => {
    setIsEditing(false);
    fetchPendingPurchaseOrder();
    setFormData({
      id: "",
      name: "",
      description: "",
      start_date: "",
      end_date: "",
      status: "",
      substatus: "",
      status_info: "",
    });
    setIsOpen(true);
  };

  const handleEdit = async (id) => {
    await fetchAllPurchaseOrder();

    const project = TABLE_ROWS.find((project) => project.id === id);
  
    if (project) {
      const projectDropdown = projectData.find((proj) => proj.id === id);
      const selectedStatus = param.find(p => p.description === project.status);
      const selectedSubstatus = selectedStatus ? selectedStatus.child.find(c => c.description === project.substatus) : null;

      setFormData({
        id: project.id,
        name: project.name,
        description: project.description,
        start_date: formatDate(project.start_date),
        end_date: formatDate(project.end_date),
        status: String(selectedStatus?.data || ""),
        substatus: String(selectedSubstatus?.data || ""),
        duration: projectDropdown ? projectDropdown.duration : 0,
        status_info: project.status_info,
      });
  
      if (selectedStatus && selectedStatus.child) {
        setChildOptions(selectedStatus.child);
        setSelectedSubstatus(project.substatus || "");
      } else {
        setChildOptions([]);
        setSelectedSubstatus("");
      }
  
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
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/projects/${deleteId}/delete`, {
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
        await fetchProjects();
        await fetchPendingPurchaseOrder();
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
    if (typeof text !== 'string' || !searchQuery) return text;
  
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };  

  const filterRows = (rows) => {
    if (!searchQuery) return rows;
  
    const query = searchQuery.toLowerCase();
    const fields = ['id', 'name', 'description', 'start_date', 'end_date', 'status', 'substatus', 'status_info', 'created_by_name', 'created_time', 'updated_by_name', 'updated_time'];
  
    return rows.filter(row =>
      fields.some(field =>
        row[field] && row[field].toString().toLowerCase().includes(query)
      )
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

  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);

  const getStatusBadgeStyle = (status) => {
    const styles = {
      NEW: { backgroundColor: 'rgba(255, 228, 225, 0.3)', color: '#ff6347' }, // Light coral for New
      'KICK OFF': { backgroundColor: 'rgba(255, 239, 213, 0.3)', color: '#ffb347' }, // Peach for Kickoff
      IMPLEMENTATION: { backgroundColor: 'rgba(245, 222, 179, 0.3)', color: '#c19a6b' }, // Darker tan for Implementation
      BAST: { backgroundColor: 'rgba(255, 218, 185, 0.3)', color: '#f08080' }, // Light pink for BAST
      INVOICING: { backgroundColor: 'rgba(230, 230, 250, 0.3)', color: '#9370db' }, // Soft lavender for Invoicing
      PAYMENT: { backgroundColor: 'rgba(240, 230, 140, 0.3)', color: '#b8860b' }, // Khaki for Payment
      COMPLETED: { backgroundColor: 'rgba(204, 230, 255, 0.3)', color: '#004085' }, // Light blue for Completed
      HOLD: { backgroundColor: 'rgba(255, 204, 204, 0.3)', color: '#f17171' }, // Light red for Hold
    };
  
    return {
      ...styles[status],
      borderRadius: '5px',
      padding: '4px 10px',
      display: 'inline-block',
      marginRight: '4px',
    };
  };  

  const getSubStatusBadgeStyle = (status) => {
    const styles = {
      SIT: { backgroundColor: 'rgba(255, 179, 179, 0.3)', color: '#e45a5a' }, // Slightly darker red for SIT
      FSD: { backgroundColor: 'rgba(255, 223, 186, 0.3)', color: '#cc7a00' }, // Slightly darker peach for FSD
      DEVELOP: { backgroundColor: 'rgba(255, 245, 157, 0.3)', color: '#c5a600' }, // Darker pale yellow for Develop
      UAT: { backgroundColor: 'rgba(255, 198, 202, 0.3)', color: '#c13c3c' }, // Darker pink for UAT
      DEPLOY: { backgroundColor: 'rgba(201, 201, 255, 0.3)', color: '#524ba5' }, // Darker lavender blue for Deploy
      "No Status": { backgroundColor: 'rgba(192, 192, 192, 0.3)', color: '#4a4a4a' }, // Light gray background with dark gray text
      "No Status Info": { backgroundColor: 'rgba(192, 192, 192, 0.3)', color: '#4a4a4a' }, // Light gray background with dark gray text
    };

    return {
      ...(styles[status] || styles["No Status"]),
      borderRadius: '5px',
      padding: '4px 10px',
      display: 'inline-block',
      marginRight: '4px',
    };
  };  

  const projectOptions = projectData.map(project => ({
    value: project.id,
    label: `${project.name} - ${project.id}`,
  }));

  const tableRows = currentPageData.map((row, index) => {
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
        <td className="border border-gray-300 p-2">{highlightText(formatDate(row.start_date))}</td>
        <td className="border border-gray-300 p-2">{highlightText(formatDate(row.end_date))}</td>
        <td className="border border-gray-300 p-2">
          <span style={getStatusBadgeStyle(row.status)}>
            {highlightText(row.status ? row.status : "Unknown")}
          </span>
        </td>
        <td className="border border-gray-300 p-2">
          <span style={getSubStatusBadgeStyle(row.substatus)}>
            {highlightText(row.substatus ? row.substatus : "No Status")}
          </span>
        </td>
        <td className="border border-gray-300 p-2">{highlightText(row.status_info)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.created_by_name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.created_time)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.updated_by_name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.updated_time)}</td>
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
              Project List Data
            </Typography>
          </div>
          <div className="flex items-center justify-between">
          <Button
            color="blue"
            className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
            onClick={handleAdd}
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
        <DialogBody divider className="max-h-[400px] overflow-y-scroll">
          <div className="space-y-6 font-poppins">
              <Select
                options={projectOptions}
                value={projectOptions.find(option => option.value === formData.id) || null}
                isSearchable={true}
                onChange={handleProjectIdChange}
                isDisabled={isEditing}
                placeholder="Select Project"
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
              {formData.id && (
                <div className="flex flex-col">
                  <label htmlFor="name" className="block text-xs font-normal mb-2 -mt-2">Project Name</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled
                  />
                </div>
              )}
              {formData.id && (
                <div className="flex flex-col">
                  <label htmlFor="name" className="block text-xs font-normal mb-2 -mt-2">Duration</label>
                  <Input
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    disabled
                    icon={<span className="-ml-3 text-[12px]">Days</span>}
                  />
                </div>
              )}
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              <Input
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
              />
              <Input
                label="End Date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
              />
              <MaterialSelect
                label="Status"
                name="status"
                value={formData.status}
                onChange={(value) => handleChange(value, 'status')}
              >
                {param.map(parameter => (
                  <Option key={parameter.data} value={parameter.data} className="font-poppins">
                    {parameter.description}
                  </Option>
                ))}
              </MaterialSelect>
              {childOptions.length > 0 && (
                <div className="mt-2">
                  <MaterialSelect
                    label="Substatus"
                    name="substatus"
                    value={formData.substatus}
                    onChange={(value) => handleChange(value, 'substatus')}
                  >
                    {childOptions.map((child) => (
                      <Option key={child.data} value={child.data}>
                        {child.description}
                      </Option>
                    ))}
                  </MaterialSelect>
                </div>
              )}
              <Input
                label="Status Info"
                name="status_info"
                value={formData.status_info}
                onChange={handleChange}
              />
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
