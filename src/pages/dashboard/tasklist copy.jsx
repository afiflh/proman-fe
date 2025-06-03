import React, { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Dialog, DialogHeader, DialogBody, DialogFooter, Select as MaterialSelect, Option } from "@material-tailwind/react";
import { ArrowPathRoundedSquareIcon, ArrowUpTrayIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import TaskDetailCard from "@/components/TaskDetailCard";
import SubTaskCard from "../../components/SubTaskCard";
import NotificationDialog from "@/components/NotificationDialog";
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useDropzone } from 'react-dropzone';
import { formatDate,capitalizeWords } from "@/utils/helper";
import Cookies from 'js-cookie';
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Select from 'react-select';

const TABLE_HEAD = ["Actions", "Detail", "Kode", "Title", "Due Date", "Project Manager", "Business Analyst", "Assignee", "Created By", "Updated By"];

export function TaskList() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [sortConfig, setSortConfig] = useState({ key: 'kode', direction: 'ascending' });
  const [projectAssignment, setProjectAssignment] = useState([]);
  const [projectSelected, setProjectSelected] = useState(false);
  const [projectKey, setProjectKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [subtasklist, setSubtasklist] = useState([]);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [isOpenSub, setIsOpenSub] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({ kode: "", title: "", description: "", attachment: "", duedate: "", project_id: "", assignee: "", business_analyst: "", project_manager: "" });
  const [formDataSub, setFormDataSub] = useState({ kode: "", tasklist_id: "", title: "", description: "", attachment: "", assignee: "" });
  const [filesEvent, setFilesEvent] = useState([]);

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;
  const rawUserId = Cookies.get('USER_ID');
  const decryptedUserId = decryptPayload(rawUserId);

  useEffect(() => {
    fetchProjectAssignment();
    fetchInitial()
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchProjectToTask();
    }
  }, [formData.project_id]);

  const fetchProjectAssignment = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/project-status`);
      console.log('PROJECT ASSIGNMENT DATA', responseData);
      
      processAndSetData(responseData, setProjectAssignment);
    } catch (error) {
      console.error("Error fetching project assignment:", error);
    }
    setIsLoading(false);
  };
  
  const fetchInitial = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ user_id: decryptedUserId });
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/task-list?${query.toString()}`);
      
      if (responseData && Array.isArray(responseData.data)) {
        setTABLE_ROWS(responseData.data.length === 0 ? [] : responseData.data);
      } else {
        console.error("Received data is not an array or missing 'data' property: ", responseData);
        setTABLE_ROWS([]);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setTABLE_ROWS([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchProjectToTask = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/task-list/${formData.project_id}`);
      console.log('PROJECT TO TASK DATA', responseData);
      
      if (responseData && Array.isArray(responseData.data)) {
        setTABLE_ROWS(responseData.data.length === 0 ? [] : responseData.data);
      } else {
        console.error("Received data is not an array or missing 'data' property: ", responseData);
        setTABLE_ROWS([]);
      }
    } catch (error) {
      console.error("Error fetching project to task data:", error);
      setTABLE_ROWS([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchSubtasklist = async (kode) => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/substasklist/${kode}/get`);
      
      if (responseData && Array.isArray(responseData.data)) {
        setSubtasklist(responseData.data.length === 0 ? [] : responseData.data);
      } else {
        console.error("Received data is not an array or missing 'data' property: ", responseData);
        setSubtasklist([]);
      }
    } catch (error) {
      console.error("Error fetching subtask list data:", error);
      setSubtasklist([]);
    } finally {
      setIsLoading(false);
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
  
    return rows.filter(row => {
      const formattedDueDate = row.duedate ? formatDate(row.duedate).toLowerCase() : '';
      return ['kode', 'title', 'description', 'duedate', 'assignee', 'created_by'].some(key =>
        row[key] && row[key].toString().toLowerCase().includes(query) ||
        (key === 'duedate' && formattedDueDate.includes(query))
      );
    });
  };  

  const sortedRows = useMemo(() => {
    if (!sortConfig) return [...TABLE_ROWS];
  
    const { key, direction } = sortConfig;
    return [...TABLE_ROWS].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [TABLE_ROWS, sortConfig]);  

  const requestSort = (key) => {
    if (key === 'actions') return;
  
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };  

  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeSub = (e) => {
    setFormDataSub({
      ...formDataSub,
      [e.target.name]: e.target.value,
    });
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

  const handleFileChange = (event) => {
    const receivedFiles = Array.from(event.target.files);
    setFilesEvent((prevFiles) => {
      const updatedFiles = [...prevFiles, ...receivedFiles];
      setFormData((prevFormData) => ({
        ...prevFormData,
        objectFiles: updatedFiles,
      }));
      return updatedFiles;
    });
  };

  const handleFileChangeSub = (event) => {
    const receivedFiles = Array.from(event.target.files);
    setFilesEvent((prevFiles) => {
      const updatedFiles = [...prevFiles, ...receivedFiles];
      setFormDataSub((prevFormData) => ({
        ...prevFormData,
        objectFiles: updatedFiles,
      }));
      return updatedFiles;
    });
  };

  const handleDetailClick = (task) => {
    setSelectedTask(task);
    setShowDetail(true);
    fetchSubtasklist(task.kode);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  const uploadFile = async (formData, token, isEditing) => {
    const isMultipleFiles = filesEvent.length > 1;
    const uploadFormData = new FormData();
  
    if (isEditing) {
      if (formData.attachment) {
        uploadFormData.append('oldFile', formData.attachment);
      } else {
        uploadFormData.append('oldFile', "");
      }
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    } else {
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    }
  
    const url = isEditing
      ? `${import.meta.env.VITE_BASE_URL}/api/v1/update/file`
      : (isMultipleFiles
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/upload-multiple/file`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/upload/file`);
  
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
  
    const fileNames = Array.isArray(uploadObjectData.data.filename)
      ? uploadObjectData.data.filename.join(',')
      : uploadObjectData.data.filename;
  
    setFilesEvent([]);
    return fileNames;
  };  
  
  const sendFormData = async (formData, fileNames, decryptedUserId, isEditing, token) => {
    const formDataToSend = {
      ...formData,
      attachment: fileNames,
      created_by: decryptedUserId,
      updated_by: isEditing ? decryptedUserId : undefined,
    };
  
    console.log("Form Data to Send:", formDataToSend);
  
    const encryptedDataToSend = encryptPayload(JSON.stringify(formDataToSend));
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing
      ? `/api/v1/task-list/${formData.kode}/edit`
      : "/api/v1/task-list/store";
  
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: method,
      body: JSON.stringify({ msg: encryptedDataToSend }),
    });
  
    const data = await response.json();
    const decryptedData = decryptPayload(data.msg);
    return JSON.parse(decryptedData);
  };
  
  const handleSubmit = async () => {
    try {
      const token = Cookies.get('TOKEN');
      const rawUserId = Cookies.get('USER_ID');
      const decryptedUserId = decryptPayload(rawUserId);
  
      let fileName = formData.attachment || ""; // Default to existing attachment or empty string
  
      // Check if new files are added or changed
      const isFileChanged = filesEvent.length > 0 && (
        !formData.attachment || // If no existing attachment
        !filesEvent.every(file => formData.attachment.includes(file.name)) // If file names are different
      );
      console.log("isFileChanged:", isFileChanged);
  
      // Only upload files if new files are added and there is a change
      if (isFileChanged) {
        fileName = await uploadFile(formData, token, isEditing);
      }
  
      // Prepare data to send, including the file(s)
      const formDataToSend = {
        ...formData,
        attachment: fileName, // If file is not changed, keep the old one
        created_by: decryptedUserId,
        updated_by: isEditing ? decryptedUserId : undefined,
      };
  
      const objectData = await sendFormData(formDataToSend, fileName, decryptedUserId, isEditing, token);
  
      if (objectData.status === 'success') {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || `Data ${isEditing ? 'Updated' : 'Added'} Successfully!`,
          isError: false,
        });
        setIsOpen(false);
        setIsEditing(false);
        setFormData(prevFormData => ({
          ...prevFormData,
          kode: "",
          title: "",
          description: "",
          attachment: "",
          duedate: "",
          assignee: "",
        }));
        fetchProjectToTask();
      } else {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || 'An Error Occurred While Saving The Data.',
          isError: true,
        });
      }
    } catch (error) {
      console.error("Error handling submit: ", error);
      setNotification({
        open: true,
        message: 'An Unexpected Error Occurred. Please Try Again Later.',
        isError: true,
      });
    }
  };  

  const uploadFileSub = async (formDataSub, token, isEditingSub) => {
    const isMultipleFiles = filesEvent.length > 1;
    
    const uploadFormData = new FormData();
    
    if (isEditingSub) {
      if (formDataSub.attachment) {
        uploadFormData.append('oldFile', formDataSub.attachment);
      }
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    } else {
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    }
    
    const url = isEditingSub
      ? `${import.meta.env.VITE_BASE_URL}/api/v1/update/file`
      : (isMultipleFiles
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/upload-multiple/file`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/upload/file`);
    
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
    
    const fileNames = Array.isArray(uploadObjectData.data.filename)
      ? uploadObjectData.data.filename.join(',')
      : uploadObjectData.data.filename;
    
    setFilesEvent([]);
    return fileNames;
  };

  const sendFormDataSub = async (formDataSub, fileNames, decryptedUserId, isEditingSub, token) => {
    const formDataToSend = {
      ...formDataSub,
      attachment: fileNames,
      created_by: decryptedUserId,
      updated_by: isEditingSub ? decryptedUserId : undefined,
    };
  
    console.log("Form Data to Send:", formDataToSend);
  
    const encryptedDataToSend = encryptPayload(JSON.stringify(formDataToSend));
    const method = isEditingSub ? "PUT" : "POST";
    const endpoint = isEditingSub
      ? `/api/v1/subtasklist/${formDataSub.kode}/edit`
      : "/api/v1/subtasklist/store";
  
    const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: method,
      body: JSON.stringify({ msg: encryptedDataToSend }),
    });
  
    const data = await response.json();
    const decryptedData = decryptPayload(data.msg);
    return JSON.parse(decryptedData);
  };

  const handleSubmitSub = async () => {
    try {
      const token = Cookies.get('TOKEN');
      const rawUserId = Cookies.get('USER_ID');
      const decryptedUserId = decryptPayload(rawUserId);
      
      let fileName = formDataSub.attachment; // Default ke attachment lama
  
      // Cek apakah ada file baru yang ditambahkan atau hanya file lama
      const isFileChanged = filesEvent.length > 0 && filesEvent[0].name !== formDataSub.attachment;
      console.log("isFileChanged:", isFileChanged);
  
      // Hanya upload file jika ada file baru yang berbeda dari file lama
      if (isFileChanged) {
        fileName = await uploadFileSub(formDataSub, token, isEditingSub);
      }
  
      // formDataToSend menyertakan attachment lama jika tidak ada file baru
      const formDataToSend = {
        ...formDataSub,
        attachment: fileName,
        created_by: decryptedUserId,
        updated_by: isEditing ? decryptedUserId : undefined,
      };
  
      const objectData = await sendFormDataSub(formDataToSend, fileName, decryptedUserId, isEditingSub, token);
  
      if (objectData.status === 'success') {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || `Data ${isEditingSub ? 'Updated' : 'Added'} Successfully!`,
          isError: false,
        });
        setIsOpenSub(false);
        setIsEditingSub(false);
        setFormDataSub(prevFormData => ({
          ...prevFormData,
          kode: "",
          tasklist_id: selectedTask.kode,
          title: "",
          description: "",
          attachment: "",
        }));
        fetchSubtasklist(selectedTask.kode);
      } else {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || 'An Error Occurred While Saving The Data.',
          isError: true,
        });
      }
    } catch (error) {
      console.error("Error handling submit: ", error);
      setNotification({
        open: true,
        message: 'An Unexpected Error Occurred. Please Try Again Later.',
        isError: true,
      });
    }
  }; 

  const handleEdit = (kode) => {
    const tasklist = TABLE_ROWS.find((tasklist) => tasklist.kode === kode);
    if (tasklist) {
      console.log('Editing Row Data:', tasklist);
      setFormData({
        kode: tasklist.kode,
        title: tasklist.title,
        description: tasklist.description,
        attachment: tasklist.attachment,
        duedate: formatDate(tasklist.duedate),
        project_id: tasklist.project_id,
        assignee: tasklist.assignee,
        business_analyst: tasklist.business_analyst,
      });
      setFilesEvent(tasklist.attachment ? tasklist.attachment.split(',').map(name => ({ name })) : []);
      setIsEditing(true);
      setIsOpen(true);
    }
  };

  const tableRows = currentPageData.map((row) => {
    const tdPadding = !projectSelected || isLoading ? "p-4" : "p-2";
  
    return (
      <tr key={row.kode} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
                {formData.project_id && (
          <>
            <td className={`border border-gray-300 ${tdPadding}`}>
              <div className="flex items-center">
                <IconButton variant="text" color="blue" onClick={() => handleEdit(row.kode)}>
                  <PencilIcon className="h-5 w-5" />
                </IconButton>
              </div>
            </td>
            <td className={`border border-gray-300 ${tdPadding}`}>
              <div className="flex items-center">
                <IconButton variant="text" color="blue" onClick={() => handleDetailClick(row)}>
                  <InformationCircleIcon onClick={() => fetchSubtasklist(row.kode)} className="h-5 w-5" />
                </IconButton>
              </div>
            </td>
          </>
        )}
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.kode)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.title)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(formatDate(row.duedate))}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.project_manager_name)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.business_analyst)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.assignee)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.created_by_name)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.updated_by_name)}</td>
      </tr>
    );
  });  

  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);

  const getUsernamesForProject = (project_id) => {
    const project = projectAssignment.find(p => p.project_id === project_id);
    if (project && project.username) {
      return project.username.split(',');
    }
    return [];
  };  

  const handleProjectChange = (value) => {
    console.log("Selected Project Value:", value);
    setShowDetail(false);
    setSelectedTask(null);
    setFormData(prevFormData => ({
      ...prevFormData,
      project_id: value,
    }));
    setProjectKey(prevKey => prevKey + 1);
  };

  const projectOptions = projectAssignment.map((project) => ({
    value: project.project_id,
    label: project.project_name,
  }));

  const LoadingOption = () => (
    <div className="flex items-center justify-center">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
    </div>
  ); 

  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Project Task Data
            </Typography>
          </div>
          <div className={`font-poppins w-72 ${!projectSelected ? 'py-2' : 'mb-5 py-1'}`}>
            <Select
              options={isLoading ? [{ value: '', label: <LoadingOption /> }] : projectOptions}
              value={projectOptions.find(option => option.value === formData.project_id) || null}
              onChange={(selectedOption) => {
                handleProjectChange(selectedOption.value);
                setProjectSelected(selectedOption !== null);
              }}
              isSearchable={true}
              placeholder="Project Name"
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
                    backgroundColor: 'transparent', // No background for loading state
                    cursor: 'default', // No hover effect
                    ':hover': {
                      backgroundColor: 'transparent', // No hover effect
                    },
                  }),
                }),
              }}
            />                 
          </div>
          <div className="flex items-center justify-between">
            {projectSelected && (
              <>
                <Button
                  color="blue"
                  className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      kode: "",
                      title: "",
                      description: "",
                      attachment: "",
                      duedate: "",
                      project_id: formData.project_id,
                      assignee: "",
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
              </>
            )}
          </div>
        </CardHeader>
  
        <CardBody className="overflow-scroll px-0">
          <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
          <thead className="bg-blue-gray-50/50">
            <tr>
              {TABLE_HEAD.map((head, index) => {
                if ((head === "Detail" || head === "Actions") && !formData.project_id) {
                  return null;
                }
                return (
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
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${sortConfig.key === head.toLowerCase().replace(' ', '_')
                              ? 'text-gray-500'
                              : 'text-gray-500'
                            }`}
                        >
                          <i className={`fa fa-sort-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
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
      
      {showDetail && selectedTask && (
            <div className="border-b border-gray-300 mt-20 mb-14">
              <TaskDetailCard task={selectedTask} />
            </div>
          )}

      {showDetail && selectedTask && (
        <SubTaskCard
          subtasklist={subtasklist}
          handleOpenSub={() => {
            setIsEditingSub(false);
            setFormDataSub({
              kode: "",
              tasklist_id: selectedTask.kode,
              title: "",
              description: "",
              attachment: "",
              assignee: "",
            });
            setIsOpenSub(true);
          }}
          handleEditSub={(subtask) => {
            setIsEditingSub(true);
            setFormDataSub({
              kode: subtask.kode,
              title: subtask.title,
              description: subtask.description,
              attachment: subtask.attachment,
              assignee: subtask.assignee,
              tasklist_id: subtask.tasklist_id,
            });
            setFilesEvent(subtask.attachment ? subtask.attachment.split(',').map(name => ({ name })) : []);
            setIsOpenSub(true);
          }}
        />
      )}

      <Dialog open={isOpenSub} handler={() => {}} dismiss={{ outsidePointerDown: false, escapeKeyDown: false }} size="sm">
        <DialogHeader className="font-poppins text-xl font-semibold">
          {isEditingSub ? "Edit Data" : "Add Data"}
        </DialogHeader>
        <DialogBody divider className="max-h-96 overflow-y-auto">
          <div className="space-y-6 font-poppins">
            <Input
              label="Title"
              name="title"
              value={formDataSub.title}
              onChange={handleChangeSub}
            />
            <div>
              <label className="block text-xs font-normal mb-2">Description</label>
              <CKEditor
                editor={ClassicEditor}
                data={formDataSub.description}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setFormDataSub({ ...formDataSub, description: data });
                }}
                config={{
                  toolbar: {
                    items: [
                      'undo', 'redo', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', // Hanya ikon yang ingin ditampilkan
                    ],
                  },
                }}
              />
            </div>
            {/* <Input
              label="Attachment"
              type="file"
              onChange={handleFileChangeSub}
            />
            {filesEvent.length < 0 ? null : (
              <div>
                <div className="flex flex-col">
                  {filesEvent.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-poppins font-semibold text-gray-500">{file.name}</span>
                    </div>
                  ))}
                </div>
                <span className="text-xs font-poppins font-semibold text-gray-500">
                  {filesEvent.length} file(s) selected
                </span>
              </div>
            )} */}
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
            <MaterialSelect
              label="Assignee"
              name="assignee"
              value={formDataSub.assignee}
              onChange={(value) => {
                console.log("Selected Assignee:", value);
                setFormDataSub({ ...formDataSub, assignee: value });
              }}
            >
              {getUsernamesForProject(formData.project_id).map(username => (
                <Option key={username} value={username} className="font-poppins">
                  {username}
                </Option>
              ))}
            </MaterialSelect>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setIsOpenSub(false)}
            className="mr-2"
          >
            <span className="font-poppins font-semibold">Cancel</span>
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={handleSubmitSub}
          >
            <span className="font-poppins font-semibold">
              {isEditingSub ? "Save" : "Add"}
            </span>
          </Button>
        </DialogFooter>
      </Dialog>
  
      <Dialog open={isOpen} handler={() => {}} dismiss={{ outsidePointerDown: false, escapeKeyDown: false }} size="sm">
        <DialogHeader className="font-poppins text-xl font-semibold">{isEditing ? "Edit Data" : "Add Data"}</DialogHeader>
        <DialogBody divider className="max-h-96 overflow-y-auto">
          <div className="space-y-6 font-poppins">
          <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
            />
            <div>
              <label className="block text-xs font-normal mb-2">Description</label>
              <CKEditor
                editor={ClassicEditor}
                data={formData.description}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setFormData({ ...formData, description: data });
                }}
                config={{
                  toolbar: {
                    items: [
                      'undo', 'redo', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', // Hanya ikon yang ingin ditampilkan
                    ],
                  },
                }}
              />
            </div>
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
            {/* <Input
              label="Attachment"
              type="file"
              onChange={handleFileChange}
            /> */}
            {/* {filesEvent.length < 0 ? null: (
              <div>
                  <div className="flex flex-col">
                  {filesEvent.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs font-poppins font-semibold text-gray-500">{file.name}</span>
                    </div>
                  ))}

                  </div>
                  <span className="text-xs font-poppins font-semibold text-gray-500">
                    {filesEvent.length} file(s) selected
                  </span>
              </div>
            )} */}
            <Input
              label="Due Date"
              name="duedate"
              type="date"
              value={formData.duedate}
              onChange={handleChange}
            />
            <MaterialSelect
              label="Business Analyst"
              name="bussiness_analyst"
              value={formData.business_analyst}
              onChange={(value) => {
                console.log("Selected Assignee:", value);
                setFormData({ ...formData, business_analyst: value });
              }}
            >
              {getUsernamesForProject(formData.project_id)
              .sort((a, b) => a.localeCompare(b))
              .map(username => (
                <Option key={username} value={username} className="font-poppins">
                  {username}
                </Option>
              ))}
            </MaterialSelect>
            <MaterialSelect
              label="Assignee"
              name="assignee"
              value={formData.assignee}
              onChange={(value) => {
                console.log("Selected Assignee:", value);
                setFormData({ ...formData, assignee: value });
              }}
            >
              {getUsernamesForProject(formData.project_id)
              .sort((a, b) => a.localeCompare(b))
              .map(username => (
                <Option key={username} value={username} className="font-poppins">
                  {username}
                </Option>
              ))}
            </MaterialSelect>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => {
              setIsOpen(false)
              setFilesEvent([])
            }}
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
        open={notification.open}
        setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
        message={notification.message}
        isError={notification.isError}
      />
    </>
  );  
}