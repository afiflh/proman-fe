import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Textarea, Dialog, DialogHeader, DialogBody, DialogFooter, Option, Select as MaterialSelect } from "@material-tailwind/react";
import NotificationDialog from "@/components/NotificationDialog";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { formatDate, capitalizeWords } from "@/utils/helper";
import Cookies from 'js-cookie';
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Select from 'react-select';
import { useDropzone } from 'react-dropzone';
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import Multiselect from "multiselect-react-dropdown";

const TABLE_HEAD = ["Actions", "PO Date", "PO Number", "PO Description", "Attachment", "Project Id", "Project Name", "Customer", "Project Type", "Duration", "Target Live", "Notification To", "Created By", "Created Time", "Updated By", "Updated Time"];

export function PurchaseOrder() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ po_number: "", project_name: "", customer_id: "", project_type: "", po_date: "", duration: "", live_date: "", po_description: "", attachment: "", notification_receivers: "" }); 
  const [param, setParameter] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [sortConfig, setSortConfig] = useState({key:'po_date', direction: 'descending'});
  const [filesEvent, setFilesEvent] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [user, setUser] = useState([]);
  const [userMap, setUserMap] = useState({});

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchPurchaseOrder();
    fetchParameterProjectType();
    fetchCustomers();
    fetchCustomers();
    fetchUsers();
  }, []);

  const customStyles = {
    multiselectContainer: { border: '1px solid rgba(30, 41, 59, 0.3)', borderRadius: '7px', padding: '2px', paddingLeft: '5px' },
    dropdownContainer: { border: '1px solid rgba(30, 41, 59, 0.3)', borderRadius: '7px' },
    searchBox: { border: 'none', borderRadius: '7px', padding: '5px' },
    optionContainer: { backgroundColor: '#fff', borderRadius: '7px' },
    option: { padding: '10px' },
    selectedOption: { backgroundColor: '#e0e0e0' },
  };  

  const arrayToString = (arr) => {
    let str = '';
    arr.forEach((item, index) => {
      str += item.id;
      if (index < arr.length - 1) {
        str += ',';
      }
    });
    console.log(`ARRAY TO STRINGG ${str}`)
    return str;
  };

  function parseUsernameString(usernameString) {
    if (!usernameString) return [];
    return usernameString.split(",").map(name => name.trim()).filter(Boolean);
  }
  
  const onSelectUsername = (selectedList, selectedItem) => {
    formData.notification_receivers = arrayToString(selectedList);
  };

  const onRemoveUsername = (selectedList, removedItem) => {
    formData.notification_receivers = arrayToString(selectedList);
  };

  const getSelectedUsername = (values) => {
    console.log(`values ${values}`)
    if (!values || !user.length) return;
    const stringValues = values.toString()
    const selectedUserId = stringValues.split(',');
    console.log(selectedUserId)
    console.log(user)
    const selectedUser = user.filter(user => selectedUserId.includes(user.id)).sort((a, b) => selectedUserId.indexOf(a.id) - selectedUserId.indexOf(b.name));
    setSelectedUsers(selectedUser);
  }

  const fetchUsers = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/users`);
      if (responseData && Array.isArray(responseData.data)) {
        const newUserMap = {};
        responseData.data.forEach(user => {
          newUserMap[user.id] = user.name;
        });
        setUserMap(newUserMap);
        setUser(responseData.data);
      } else {
        console.error("Received users data is not an array or missing 'data' property: ", responseData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };  

  const fetchPurchaseOrder = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-order`);
      console.log('PO DATA', responseData);
      processAndSetData(responseData, setTABLE_ROWS);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchParameterProjectType = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/parameters/project-type`);
      processAndSetData(responseData, setParameter);
    } catch (error) {
      console.error("Error fetching parameters:", error);
    }
  };  

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

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };  

  const uploadFilePurchaseOrder = async (filesEvent, formData, token, isEditing) => {
    const uploadFormData = new FormData();
  
    if (isEditing && formData.attachment) {
      uploadFormData.append('oldFile', formData.attachment);
    }
  
    const file = filesEvent[0];
    if (file) {
      uploadFormData.append('objectFiles', file);
    } else {
      throw new Error('No file selected for upload');
    }
  
    const url = isEditing
      ? `${import.meta.env.VITE_BASE_URL}/api/v1/update/file`
      : `${import.meta.env.VITE_BASE_URL}/api/v1/upload/file`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      method: "POST",
      body: uploadFormData,
    });
  
    if (!response.ok) throw new Error('File upload failed');
  
    const uploadData = await response.json();
    const decryptedUploadData = decryptPayload(uploadData.msg);
    const uploadObjectData = JSON.parse(decryptedUploadData);
  
    if (uploadObjectData.status !== 'success' || !uploadObjectData.data || !uploadObjectData.data.filename) {
      throw new Error('File upload failed: Missing filename in response');
    }
    setFilesEvent([]);
    return uploadObjectData.data.filename;
  };  
  
  const handleSubmit = async () => {
    try {
      const token = Cookies.get('TOKEN');
      const rawUserId = Cookies.get('USER_ID');
      const decryptedUserId = decryptPayload(rawUserId);
  
      let fileName = formData.attachment || "";
      const isFileChanged = filesEvent.length > 0 && (
        !formData.attachment ||
        !filesEvent.every(file => formData.attachment.includes(file.name))
      );

      if (isFileChanged) {
        fileName = await uploadFilePurchaseOrder(filesEvent, formData, token, isEditing);
      }

      const dataToSend = {
        ...formData,
        attachment: fileName,
        duration: parseInt(formData.duration, 10),
        project_type: String(formData.project_type),
        created_by: decryptedUserId,
        updated_by: isEditing ? decryptedUserId : undefined,
      };

      console.log('dataToSend:', dataToSend);
  
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing
        ? `/api/v1/purchase-order/${formData.po_number}/edit`
        : "/api/v1/purchase-order/store";

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: method,
        body: JSON.stringify({ msg: encryptPayload(JSON.stringify(dataToSend)) }),
      });
  
      const statusCode = response.status;
      const data = await response.json();
      const decryptedData = decryptPayload(data.msg);
      const objectData = JSON.parse(decryptedData);

      const message = capitalizeWords(objectData.message) || `Data ${isEditing ? 'updated' : 'added'} successfully!`;

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
        setFormData({ po_number: "", project_name: "", customer_id: "", project_type: "", po_date: "", duration: "", live_date: "", po_description: "", attachment: "" });
        await fetchPurchaseOrder();
      } else {
        setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
      }
    } catch (error) {
      console.error("Error saving data: ", error);
      setNotification({ open: true, message: 'An Unexpected Error Occurred. Please Try Again Later.', isError: true });
    }
  };
  
  const handleEdit = (po_number) => {
    const project = TABLE_ROWS.find((project) => project.po_number === po_number);
    console.log('project:', project);
    if (project) {
      getSelectedUsername(project.notification_receivers);
      setFormData({
        po_number: project.po_number,
        project_name: project.project_name,
        customer_id: project.customer_id,
        project_type: String(param.find(p => p.description=== project.project_type)?.data || ""), // convert to string
        po_date: formatDate(project.po_date),
        duration: project.duration,
        live_date: formatDate(project.live_date),
        po_description: project.po_description,
        attachment: project.attachment,
        notification_receivers: project.notification_receivers,
      });
      setFilesEvent(project.attachment ? project.attachment.split(',').map(name => ({ name })) : []);
      setIsEditing(true);
      setIsOpen(true);
    }
  };

  const handleDelete = (po_number) => {
    setDeleteId(po_number);
    setConfirmDelete(true);
  };

  const confirmDeletion = async () => {
    const token = Cookies.get('TOKEN');
  
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/purchase-order/${deleteId}/delete`, {
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
        await fetchPurchaseOrder();
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
    if (!searchQuery || typeof text !== 'string' && typeof text !== 'number') return text;
  
    const textString = text.toString();
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return textString.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };    

  const filterRows = (rows) => {
    if (!searchQuery) return rows;
  
    const query = searchQuery.toLowerCase();
    const fields = ['po_number', 'project_id', 'project_name', 'customer_name', 'project_type', 'po_date', 'duration', 'created_by_name', 'created_time', 'updated_by_name', 'updated_time'];
  
    return rows.filter(row =>
      fields.some(field => {
        const fieldValue = row[field] ? row[field].toString().toLowerCase() : '';
        return fieldValue.includes(query);
      })
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
      'CHANGE REQUEST': { backgroundColor: 'rgba(255, 255, 204, 0.3)', color: '#f4c542' }, // Light yellow for On Progress
      'MAINTANANCE': { backgroundColor: 'rgba(255, 204, 204, 0.3)', color: '#f17171' }, // Light red for Hold
      'NEW PROJECT': { backgroundColor: 'rgba(212, 237, 218, 0.3)', color: '#67b173' }, // Light green for Done
    };
  
    return {
      ...styles[status],
      borderRadius: '5px',
      padding: '4px 10px',
      display: 'inline-block',
      marginRight: '4px',
    };
  };  

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFilesEvent((prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

  const removeFile = (fileName) => {
    setFilesEvent((prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
  };

  const customerOptions = customer.map(customer => ({
    value: customer.id,
    label: `${customer.name} - ${customer.id}`,
  }));

  const tableRows = currentPageData.map((row, index) => {
    const usernames = parseUsernameString(row.notification_receivers);
    return (
      <tr key={row.po_number} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-2">
          <div className="flex items-center">
            <IconButton variant="text" color="blue" onClick={() => handleEdit(row.po_number)}>
              <PencilIcon className="h-5 w-5" />
            </IconButton>
            <IconButton variant="text" color="red" onClick={() => handleDelete(row.po_number)}>
              <TrashIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </td>
        <td className="border border-gray-300 p-2">{highlightText(formatDate(row.po_date))}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.po_number)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.po_description)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.attachment)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.project_id)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.project_name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.customer_name)}</td>
        <td className="border border-gray-300 p-2">
          <span style={getStatusBadgeStyle(row.project_type)}>
            {highlightText(row.project_type ? row.project_type: "Unknown")}
          </span>
        </td>
        <td className="border border-gray-300 p-2">{highlightText(`${row.duration} Days`)}</td>
        <td className="border border-gray-300 p-2">{highlightText(formatDate(row.live_date))}</td>
        <td className="border border-gray-300 p-2">
          {usernames.length > 0 ? (
            usernames.map((notification_receiver, idx) => (
              <span key={idx}>
                {highlightText(notification_receiver)}
                {idx < usernames.length - 1 && ', '}
              </span>
            ))
          ) : (
            <span>No Receivers</span>
          )}
        </td>
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
              Purchase Order Data
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <Button
              color="blue"
              className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  po_number: "",
                  project_name: "",
                  customer_id: "",
                  project_type: "",
                  po_date: "",
                  duration: "",
                  live_date: "",
                  po_description: "",
                  attachment: "",
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
        <DialogBody divider className="max-h-[400px] overflow-y-auto">
            <div className="space-y-6 font-poppins">
              <Input
                label="PO Number"
                name="po_number"
                value={formData.po_number}
                onChange={handleChange}
                disabled={isEditing}
              />
              <Input
                label="PO Date"
                name="po_date"
                type="date"
                value={formData.po_date}
                onChange={handleChange}
              />
              <Textarea
                label="PO Description"
                name="po_description"
                value={formData.po_description}
                onChange={handleChange}
              />
              <div className="w-full mx-auto">
                <label className="block text-xs font-normal mb-2">Attachment</label>
                <div
                  {...getRootProps({
                    className:
                      "dropzone border border-blue-gray-200 rounded-lg p-4 flex flex-col items-center cursor-pointer h-30",
                  })}
                >
                  <input {...getInputProps()} />
                  <div className="text-blue-gray-300 text-lg mb-2">
                    <ArrowUpTrayIcon className="h-6 w-6" />
                  </div>
                  <p className="text-blue-gray-300 text-xs font-normal font-poppins">
                    Drag & Drop or Click to Select Files
                  </p>
                </div>

                {filesEvent.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-col gap-2">
                      {filesEvent.map((file, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-gray-100 rounded-md p-3"
                        >
                          <span className="truncate text-gray-700 text-xs font-poppins">
                            {file.name}
                          </span>
                          <button
                            onClick={() => removeFile(file.name)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Input
                label="Project Name"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
              />
                <Select
                options={customerOptions}
                value={customerOptions.find(option => option.value === formData.customer_id) || null}
                isSearchable={true}
                onChange={(selectedOption) => {
                  if (selectedOption) {
                    setFormData({ ...formData, customer_id: selectedOption.value });
                  }
                }}
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
                  }),
                }}
              />
              <MaterialSelect
                label="Project Type"
                name="project_type"
                value={formData.project_type}
                onChange={(value) => setFormData({ ...formData, project_type: String(value) })} // convert to string
              >
                {param.map(parameter => (
                  <Option key={parameter.data} value={parameter.data} className="font-poppins">
                    {parameter.description}
                  </Option>
                ))}
              </MaterialSelect>
              <Input
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                icon={<span className="-ml-3 text-[12px]">Days</span>}
              />
              <Input
                label="Target Live"
                name="live_date"
                type="date"
                value={formData.live_date}
                onChange={handleChange}
              />
              <Multiselect
                options={user.map(e => e)}
                selectedValues={isEditing ? selectedUsers : null}
                onSelect={onSelectUsername}
                onRemove={onRemoveUsername}
                displayValue="name"
                placeholder="Username"
                style={customStyles}
                className="text-sm"
            />
            </div>
        </DialogBody>

        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => {{setIsOpen(false)} setFilesEvent([])}}
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
