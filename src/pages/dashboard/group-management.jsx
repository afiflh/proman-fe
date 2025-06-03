import React, { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Dialog, DialogHeader, DialogBody, DialogFooter, Select, Option, Checkbox } from "@material-tailwind/react";
import NotificationDialog from "@/components/NotificationDialog";
import { ArrowPathRoundedSquareIcon } from "@heroicons/react/24/solid";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import Cookies from "js-cookie";
import { apiRequest, processAndSetData } from "@/utils/api-helper";

const TABLE_HEAD = ["Actions", "Id", "Description", "Is Active", "Created By", "Created Time"];

export function GroupManagement() {
  const [currentPage, setCurrentPage] = useState(0);
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ id: "", description: "", is_active: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [menuOptions, setMenuOptions] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({key:'created_time', direction: 'descending'});
  const [isLoading, setIsLoading] = useState(true);
  const [availableMenus, setAvailableMenus] = useState([]);

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchGroups();
    fetchMenus();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/groups`);
      processAndSetData(responseData, setTABLE_ROWS);
    } catch (error) {
      console.error("Error fetching groups: ", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchMenus = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/menus`);
      processAndSetData(responseData, setAvailableMenus);
    } catch (error) {
      console.error("Error fetching menus: ", error);
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

  const handleCheckboxChange = (value) => {
    setMenuOptions((prevOptions) =>
      prevOptions.includes(value)
        ? prevOptions.filter((option) => option !== value)
        : [...prevOptions, value]
    );
  };

  const handleSubmit = async () => {
    const token = Cookies.get('TOKEN');
    const decryptedUserId = decryptPayload(Cookies.get('USER_ID'));
  
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `/api/v1/groups/${formData.id}/edit` : "/api/v1/groups/store";
  
    const dataToSend = {
      ...formData,
      created_by: isEditing ? decryptedUserId : decryptedUserId,
      updated_by: isEditing ? decryptedUserId : undefined,
      updated_time: isEditing ? new Date().toISOString() : undefined,
      menu_list: menuOptions.join(","),
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
        setFormData({ id: "", description: "", is_active: ""  });
        setMenuOptions([]);
        await fetchGroups();
      } else {
        setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
      }
    } catch (error) {
      console.error("Error saving data: ", error);
      setNotification({ open: true, message: 'An Unexpected Error Occurred. Please Try Again Later.', isError: true });
    }
  };  

  const handleEdit = (id) => {
    const group = TABLE_ROWS.find((group) => group.id === id);
    if (group) {
      setFormData({
        id: group.id,
        description: group.description,
        is_active: group.is_active,
      });
      setMenuOptions(group.menu_list ? group.menu_list.split(",") : []);
      setIsEditing(true);
      setIsOpen(true);
    }
  };

  const highlightText = (text) => {
    if (!text || !searchQuery) return text;
  
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
        regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };
  
  const filterRows = (rows) => {
    if (!searchQuery) return rows;
  
    const query = searchQuery.toLowerCase();
  
    return rows.filter(row => 
      ['id', 'description', 'created_by_name', 'created_time'].some(field => 
        row[field] && row[field].toString().toLowerCase().includes(query)
      ) ||
      (row.is_active && (row.is_active === "1" ? "active" : "blocked").toLowerCase().includes(query))
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

  const getBadgeStyle = (status) => {
    return {
      backgroundColor: status === "1" ? "rgba(212, 237, 218, 0.3)" : "rgba(248, 215, 218, 0.3)",
      color: status === "1" ? "#67b173" : "#f17171",
      borderRadius: "5px",
      padding: "4px 10px",
      display: "inline-block",
      marginRight: "4px",
    };
  };

  const tableRows = currentPageData.map((row, index) => {
    const isLast = index === currentPageData.length - 1;
    const classes = isLast ? "p-4 border border-gray-300" : "p-4 border-b border-blue-gray-50 border border-gray-300";

    return (
      <tr key={row.id} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-2">
          <div className="flex items-center gap-2">
            <IconButton variant="text" color="blue" onClick={() => handleEdit(row.id)}>
              <PencilIcon className="h-5 w-5" />
            </IconButton>
            {/* <IconButton variant="text" color="red" onClick={() => handleDelete(id)}>
              <TrashIcon className="h-5 w-5" />
            </IconButton> */}
          </div>
        </td>
        <td className="border border-gray-300 p-2">{highlightText(row.id)}</td>
        <td className="border border-gray-300 p-2">{highlightText(row.description)}</td>
        <td className="border border-gray-300 p-2">
          <span style={getBadgeStyle(row.is_active)}>
            {highlightText(row.is_active === "1" ? "Active" : "Blocked")}
          </span>
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
              Group Data
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
                  description: "",
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
                value= {searchQuery}
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
        <DialogHeader className="font-poppins">{isEditing ? "Edit Data" : "Add Data"}</DialogHeader>
        <DialogBody className="overflow-y-auto max-h-[400px] p-4" divider>
          <div className="space-y-6 font-poppins">
            <Input
              label="ID"
              name="id"
              value={formData.id}
              onChange={handleChange}
              disabled={isEditing}
            />
            <Input
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
            <Select
              label="Is Active"
              name="is_active"
              value={formData.is_active}
              onChange={(value) => setFormData({ ...formData, is_active: value })}
            >
              <Option value="1" className="font-poppins">Active</Option>
              <Option value="0" className="font-poppins">Blocked</Option>
            </Select>
            <div className="space-y-2 ml-3c">
              <Typography
                variant="small"
                className="text-blue-gray-700 font-normal leading-none opacity-80 font-poppins text-left text-sm"
              >
                Menu
              </Typography>
              <div className="flex flex-col space-y-2">
                {availableMenus.map((menu) => (
                  <div key={menu.id} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      label={<span className="text-sm text-blue-gray-700 font-normal opacity-80 text-bold">{menu.name}</span>}
                      value={menu.id.toString()}
                      className="h-4 w-4 border-blue-gray-700 opacity-70"
                      checked={menuOptions.includes(menu.id.toString())}
                      onChange={(e) => handleCheckboxChange(e.target.value)}
                    />
                  </div>
                  {menu.child && menu.child.length > 0 && (
                    <div className="ml-4 flex flex-col space-y-2">
                      {menu.child.map((child) => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <Checkbox
                            label={<span className="text-sm text-blue-gray-700 font-normal opacity-80">{child.name}</span>}
                            value={child.id.toString()}
                            className="h-3 w-3 border-blue-gray-700 opacity-70"
                            checked={menuOptions.includes(child.id.toString())}
                            onChange={(e) => handleCheckboxChange(e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                ))}
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setIsOpen(false)}
            className="mr-1"
          >
            <span>Cancel</span>
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
        isWarning={notification.isWarning}
      />
    </>
  );
}
