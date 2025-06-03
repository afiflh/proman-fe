import React, { useEffect, useState } from "react";
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Dialog, DialogHeader, DialogBody, DialogFooter, Select, Option } from "@material-tailwind/react";
import NotificationDialog from "@/components/NotificationDialog";
import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/solid";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { capitalizeWords } from "@/utils/helper";
import Cookies from 'js-cookie';
import { apiRequest, processAndSetData } from "@/utils/api-helper";

const TABLE_HEAD = ["Actions", "Id", "Name", "Email", "Phone Number", "Group Name", "Last Login", "Last Logout", "Is Login", "Is Active", "Created By", "Created Time"];

export function UserManagement() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", name: "", email: "", phone_number: "", group_id: "", is_active: "" });
  const [groups, setGroups] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({key:'created_time', direction: 'descending'});
  const [isLoading, setIsLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetId, setResetId] = useState(null);

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/users`);
      processAndSetData(responseData, setTABLE_ROWS);
    } catch (error) {
      console.error("Error fetching users: ", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchGroups = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/groupsName`);
      processAndSetData(responseData, setGroups);
    } catch (error) {
      console.error("Error fetching groups: ", error);
    }
  };  

  const handleReset = (id) => {
    setResetId(id);
    setConfirmReset(true);
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

  const handleSubmit = async () => {
    const token = Cookies.get('TOKEN');
    const decryptedUserId = decryptPayload(Cookies.get('USER_ID'));
  
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `/api/v1/users/${formData.id}/edit` : "/api/v1/users/store";
  
    const dataToSend = {
      ...formData,
      created_by: isEditing ? decryptedUserId : decryptedUserId,
      updated_by: isEditing ? decryptedUserId : undefined,
      updated_time: isEditing ? new Date().toISOString() : undefined,
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
        setFormData({ id: "", name: "", email: "", phone_number: "", group_id: "", is_active: ""  });
        await fetchUsers();
      } else {
        setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
      }
    } catch (error) {
      console.error("Error saving data: ", error);
      setNotification({ open: true, message: 'An Unexpected Error Occurred. Please Try Again Later.', isError: true });
    }
  };  

  const handleEdit = (id) => {
    const user = TABLE_ROWS.find((user) => user.id === id);
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        group_id: user.group_id,
        is_active: user.is_active,
      });
      setIsEditing(true);
      setIsOpen(true);
    }
  };

  const confirmResetPassword = async () => {
    const token = Cookies.get('TOKEN');
  
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/users/${resetId}/password/edit`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        method: "PUT",
      });
  
      const data = await response.json();
      const decryptedData = decryptPayload(data.msg);
      const objectData = JSON.parse(decryptedData);
  
      const message = capitalizeWords(objectData.message) || 'Password reset successfully!';
      if (objectData.status === "success") {
        setNotification({ open: true, message, isError: false });
        await fetchUsers();
      } else {
        setNotification({ open: true, message: message || 'An error occurred while resetting the password.', isError: true });
      }
    } catch (error) {
      console.error('Error:', error);
      setNotification({ open: true, message: 'An unexpected error occurred. Please try again later.', isError: true });
    }
  };

  const highlightText = (text) => {
    if (!searchQuery || typeof text !== 'string') return text;
  
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };

  const filterRows = (rows) => {
    if (!searchQuery) return rows;
  
    const queries = searchQuery.toLowerCase().split(' ').filter(Boolean); // Pisahkan query berdasarkan spasi
    const fields = ['id', 'name', 'email', 'phone_number', 'group_name', 'last_login', 'last_logout', 'created_by_name', 'created_time'];
  
    return rows.filter(row => {
      // Periksa setiap field di baris apakah mengandung semua kata kunci dalam queries
      return queries.every(query => 
        fields.some(field => row[field] && row[field].toString().toLowerCase().includes(query)) ||
        (row.is_login && (row.is_login === "1" ? "logged in" : "logged out").toLowerCase().includes(query)) ||
        (row.is_active && (row.is_active === "1" ? "active" : "blocked").toLowerCase().includes(query))
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

  const getBadgeStyle = (status, type) => {
    if (type === 'login' || type === 'active') {
      return {
        backgroundColor: status === "1" ? "rgba(212, 237, 218, 0.3)" : "rgba(248, 215, 218, 0.3)",
        color: status === "1" ? "#67b173" : "#f17171",
        borderRadius: "5px",
        padding: "4px 10px",
        display: "inline-block",
        marginRight: "4px"
      };
    }
  };  

  const tableRows = currentPageData.map((row, index) => {
    return (
      <tr key={row.id} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-2">
          <div className="flex items-center">
            <IconButton variant="text" color="blue" onClick={() => handleEdit(row.id)}>
              <PencilIcon className="h-5 w-5" />
            </IconButton>
            <IconButton variant="text" color="red" onClick={() => handleReset(row.id)}>
              <ArrowPathIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </td>
        <td className="border border-gray-300 p-2">{highlightText(row.id)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.email)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.phone_number)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.group_name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.last_login)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.last_logout)}</td>
        <td className="border border-gray-300 p-2">
          <span style={getBadgeStyle(row.is_login, 'login')}>
            {highlightText(row.is_login === "1" ? "Logged In" : "Logged Out")}
          </span>
        </td>
        <td className="border border-gray-300 p-2">
          <span style={getBadgeStyle(row.is_active, 'active')}>
            {highlightText(row.is_active === "1" ? "Active" : "Blocked")}
          </span>
        </td>
        <td className="border border-gray-300 p-2">{highlightText(row.created_by_name)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.created_time)}</td>
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
              User Data
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
                  email: "",
                  phone_number: "",
                  group_id: "",
                  is_active: "",
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
        size="sm">
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
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={(e) => {
                const value = e.target.value;
                const numericValue = value.replace(/\D/g, '');
                handleChange({
                  target: {
                    name: e.target.name,
                    value: numericValue
                  }
                });
              }}
              type="text"
            />
            <Select
              label="Group Name"
              name="group_id"
              value={formData.group_id}
              onChange={(value) => setFormData({ ...formData, group_id: value })}
            >
              {groups.map(group => (
                <Option key={group.id} value={group.id} className="font-poppins">
                  {group.description}
                </Option>
              ))}
            </Select>
            <Select
              label="Is Active"
              name="is_active"
              value={formData.is_active}
              onChange={(value) => setFormData({ ...formData, is_active: value })}
            >
              <Option value="1" className="font-poppins">Active</Option>
              <Option value="0" className="font-poppins">Blocked</Option>
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
        open={confirmReset}
        setOpen={(isOpen) => setConfirmReset(isOpen)}
        message="Are you sure you want to reset this password?"
        isConfirmation={true}
        onConfirm={confirmResetPassword}
        onCancel={() => setConfirmReset(false)}
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