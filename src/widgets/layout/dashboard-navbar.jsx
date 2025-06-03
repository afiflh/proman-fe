import { useLocation, Link, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import {
  Navbar,
  Typography,
  IconButton,
  Breadcrumbs,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import {
  Bars3Icon,
  PencilIcon,
  ArrowRightOnRectangleIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import {
  useMaterialTailwindController,
  setOpenSidenav,
} from "@/context";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { getInitial } from "@/utils/helper";
import { getColorForInitial, outerLetterColors, letterColors } from "@/utils/colors";

export function DashboardNavbar() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { fixedNavbar, openSidenav } = controller;
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [layout, page] = pathname.split("/").filter((el) => el !== "");
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [username, setUsername] = useState("");
  const [group_name, setGroupName] = useState("");
  const [showResetPasswordPopup, setShowResetPasswordPopup] = useState(false);
  const [showRegistPopup, setShowRegistPopup] = useState(false);
  const [passwordData, setPasswordData] = useState({ id: "", temporary_password: "", new_password: "" });
  const [registrationData, setRegistrationData] = useState({ name: "", email: "", password: "", retype_password: "" });

  useEffect(() => {
    const forgotPassword = Cookies.get("USER_FORGOT_PASSWORD") === "true";
    if (forgotPassword) {
      setShowResetPasswordPopup(true);
    }
  }, []);

  useEffect(() => {
    const unregisteredUser = Cookies.get("unregistered_flag");
    if (unregisteredUser) {
      setShowRegistPopup(true);
    }
  }, []);

  useEffect(() => {
    const encryptedUserName = Cookies.get("NAME"); // Assuming the cookie contains the encrypted name
    const encryptedUserEmail = Cookies.get("USER_ID"); // Assuming the cookie contains the encrypted email

    if (encryptedUserName && encryptedUserEmail) {
      const decryptedUserName = decryptPayload(encryptedUserName);
      const decryptedUserEmail = decryptPayload(encryptedUserEmail);

      setRegistrationData({
        name: decryptedUserName,
        email: decryptedUserEmail,
        password: '',
        retype_password: ''
      });
    }
  }, []);

  useEffect(() => {
    const rawName = Cookies.get("NAME");
    const rawGroupName = Cookies.get("GROUP_NAME");
    const decryptedName = decryptPayload(rawName);
    const decryptedGroupName = decryptPayload(rawGroupName);
    const firstName = decryptedName.split(' ')[0];
    setUsername(firstName);
    setGroupName(decryptedGroupName);
  }, []);  

  useEffect(() => {
    if (state && state.message) {
      const capitalizedMessage = capitalizeWords(state.message) + '!';
      toast.success(<div style={{ fontFamily: 'Poppins, sans-serif', fontSize: "14px" }}>{capitalizedMessage}</div>, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    }
  }, [state]);

  const showToast = (message, type) => {
    if (isToastVisible) return;
    setIsToastVisible(true);

    const capitalizeWords = (text) => {
      return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };
      
    const capitalizedMessage = capitalizeWords(message) + '!';

    const toastConfig = {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      onClose: () => setIsToastVisible(false),
    };

    const messageElement = (
      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: "14px" }}>
        {capitalizedMessage}
      </div>
    );
      type === "success" ? toast.success(messageElement, toastConfig) : toast.error(messageElement, toastConfig);
    };

  const capitalizeWords = (text) => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistrationChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPassword = async (event) => {
    event.preventDefault();
    try {
      const userId = Cookies.get("USER_ID");
      const decryptedUserId = decryptPayload(userId);

      if (!decryptedUserId) {
        console.error("USER_ID not found in cookies.");
        showToast("User ID not found. Please log in again.", "error");
        return;
      }

      const dataToSend = { ...passwordData, id: decryptedUserId };
      const msg = encryptPayload(JSON.stringify(dataToSend));
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/update/password/forgot-password`, {
        body: JSON.stringify({ msg: msg }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });

      const data = await res.json();
      const decryptedJWT = decryptPayload(data.msg);
      const objectJWT = JSON.parse(decryptedJWT);

      if (objectJWT.status === "success") {
        Cookies.remove("USER_FORGOT_PASSWORD", { path: '/' });
        setShowResetPasswordPopup(false);
        showToast(objectJWT.message, "success");
      } else {
        showToast(objectJWT.message || "Registration failed.", "error");
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      showToast("An error occurred. Please try again!", "error");
    }
  };

  const handleSubmitRegistration = async (event) => {
    event.preventDefault();
    try {
      const msg = encryptPayload(JSON.stringify(registrationData));
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/auth/google/register`, {
        body: JSON.stringify({ msg: msg }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();
      const decryptedJWT = decryptPayload(data.msg);
      const objectJWT = JSON.parse(decryptedJWT);
  
      if (objectJWT.status === "success") {
        Cookies.remove("unregistered_flag", { path: '/' });
        console.log("Cookies removed successfully.");
  
        setShowRegistPopup(false);
        console.log("Modal closed:", showRegistPopup);
  
        showToast(objectJWT.message, "success");
      } else {
        showToast(objectJWT.message || "Registration failed.", "error");
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      showToast("An error occurred. Please try again!", "error");
    }
  };  
  
  const handleLogout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/logout`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("TOKEN")}`,
        },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
      Cookies.remove("USER_ID");
      Cookies.remove("NAME");
      Cookies.remove("TOKEN");
      Cookies.remove("GROUP_ID");
      Cookies.remove("GROUP_NAME");
      Cookies.remove("MENU_LIST");
      Cookies.remove("USER_FORGOT_PASSWORD");
      Cookies.remove("unregistered_flag");
      Cookies.remove("EMAIL");
      Cookies.remove("PHONE_NUMBER");

      navigate("/auth/login");
    } catch (error) {
      console.error(`ERROR: ${error.message}`);
      alert("Logout failed! Please try again.");
    }
  };
  
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <Navbar
        color={fixedNavbar ? "white" : "transparent"}
        className={`rounded-xl transition-all ${fixedNavbar
          ? "sticky top-4 z-40 py-3 shadow-md shadow-blue-gray-500/5"
          : "px-0 py-1"
          } `}
        fullWidth
        blurred={fixedNavbar}
      >
        <div className="flex flex-col-reverse justify-between gap-6 md:flex-row md:items-center">
          <div className="capitalize">
            <Breadcrumbs
              className={`bg-transparent p-0 transition-all ${fixedNavbar ? "mt-1" : ""
                }`}
            >
              <Link to={`/${layout}`}>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal opacity-50 transition-all hover:text-blue-500 hover:opacity-100 font-poppins"
                >
                  {layout}
                </Typography>
              </Link>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal font-poppins"
              >
                {page.replace(/[^a-zA-Z0-9]/g, ' ')}
              </Typography>
            </Breadcrumbs>
            <Typography variant="h6" color="blue-gray" className="font-poppins">
              {page.replace(/[^a-zA-Z0-9]/g, ' ')}
            </Typography>
          </div>
          <div className="flex items-center">
            <IconButton
              variant="text"
              color="blue-gray"
              className="grid xl:hidden"
              onClick={() => setOpenSidenav(dispatch, !openSidenav)}
            >
              <Bars3Icon strokeWidth={3} className="h-6 w-6 text-blue-gray-500" />
            </IconButton>
          </div>
          <div className="relative flex items-center justify-center">
          <IconButton
              variant="text"
              color="blue-gray"
              onClick={toggleFullscreen}
              className="mr-2"
            >
              {isFullscreen ? (
                <ArrowsPointingOutIcon strokeWidth={3} className="h-8 w-8 text-blue-gray-500" />
              ) : (
                <ArrowsPointingInIcon strokeWidth={3} className="h-8 w-8 text-blue-gray-500" />
              )}
            </IconButton>
            <Menu open={profileMenuOpen} handler={setProfileMenuOpen}>
              <MenuHandler>
                <div
                  className="relative flex items-center cursor-pointer"
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                >
                  <div className="relative flex items-center">
                    <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center" style={{ backgroundColor: getColorForInitial(getInitial(username), outerLetterColors) }}>
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center" style={{ backgroundColor: getColorForInitial(getInitial(username), letterColors) }}>
                        <span className="text-xl font-semibold text-white">
                          {getInitial(username)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start ml-3">
                    <span className="text-sm text-blue-gray-800 font-semibold font-poppins">Halo, {username}!</span>
                    <span className="text-sm text-blue-gray-500 font-poppins capitalize">{group_name}</span>
                  </div>
                </div>
              </MenuHandler>
              <MenuList className="w-max border-0">
                <MenuItem onClick={() => navigate("/dashboard/edit-profile")} className="flex items-center font-poppins">
                  <PencilIcon className="h-4 w-4 text-blue-gray-500 mr-2" />
                  Edit Profile
                </MenuItem>
                <MenuItem onClick={() => navigate("/dashboard/activity-log")} className="flex items-center font-poppins">
                  <ClockIcon className="h-4 w-4 text-blue-gray-500 mr-2" />
                    Activity Log
                </MenuItem>
                <MenuItem onClick={handleLogout} className="flex items-center font-poppins">
                  <ArrowRightOnRectangleIcon className="h-5 w-5 text-blue-gray-500 mr-2" />
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </div>
        </div>
      </Navbar>
      {showResetPasswordPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-poppins">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Reset Password</h2>
              <p className="text-[14px] text-gray-600 mb-6 text-center">
                You need to reset your password before continuing.
              </p>
            <form onSubmit={handleSubmitPassword}>
              <input
                type="password"
                name="temporary_password"
                placeholder="Temporary Password"
                className="block w-full mb-4 px-3 py-2 border rounded-md text-[14px]"
                value={passwordData.temporary_password}
                onChange={handlePasswordChange}
                required
              />
              <input
                type="password"
                name="new_password"
                placeholder="New Password"
                className="block w-full mb-6 px-3 py-2 border rounded-md text-[14px]"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
              />
              <div className="flex justify-end space-x-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[14px]">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showRegistPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-poppins">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Complete Your Registration</h2>
              <p className="text-[14px] text-gray-600 mb-6 text-center">
                You need to complete your registration before continuing.
              </p>
            <form onSubmit={handleSubmitRegistration}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                className="block w-full mb-4 px-3 py-2 border rounded-md text-[14px]"
                value={registrationData.name}
                onChange={handleRegistrationChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="block w-full mb-4 px-3 py-2 border rounded-md text-[14px]"
                value={registrationData.email}
                onChange={handleRegistrationChange}
                readOnly
                required
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="block w-full mb-4 px-3 py-2 border rounded-md text-[14px]"
                value={registrationData.password}
                onChange={handleRegistrationChange}
                required
              />
              <input
                type="password"
                name="retype_password"
                placeholder="Retype Password"
                className="block w-full mb-6 px-3 py-2 border rounded-md text-[14px]"
                value={registrationData.retype_password}
                onChange={handleRegistrationChange}
                required
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowRegistPopup(false)}
                  type="button"
                  className="px-4 py-2 hover:bg-gray-400 bg-gray-300 text-gray-800 rounded-md text-[14px]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[14px]">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
}

DashboardNavbar.displayName = "/src/widgets/layout/dashboard-navbar.jsx";

export default DashboardNavbar;