import React, { useEffect, useState } from "react";
import { Button, ImageComponent } from "../../components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { decryptPayload, encryptPayload } from "../../services/codec/codec";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GoogleLogo from "@/assets/logo-google.png";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [id, setId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [showConflictPopup, setShowConflictPopup] = useState(false);
  const [currentDeviceId, setCurrentDeviceId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = Cookies.get('TOKEN');
    const userReqLogin = Cookies.get('user_req_login');
    const errorMessage = Cookies.get('error_message');
  
    if (token) {
      navigate("/dashboard/home");
    }
  
    if (userReqLogin) {
      setShowConflictPopup(true);
      const { user_id, device_id } = JSON.parse(decryptPayload(userReqLogin));
      setCurrentUserId(user_id);
      setCurrentDeviceId(device_id);
      Cookies.remove('user_req_login');
    }
  
    if (errorMessage) {
      const decryptedErrorMessage = decryptPayload(errorMessage);
      showToast(decryptedErrorMessage, "error");
      Cookies.remove('error_message');
    }
  
    setIsLoading(false);
  }, [navigate]);  
  
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BASE_URL}/auth/google/consent`;
  };  

  const handleConfirmLogin = async () => {
    try {
      const msg = encryptPayload(
        JSON.stringify({
          user_id: currentUserId,
          device_id: currentDeviceId,
        })
      );
  
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/confirm-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg }),
      });
  
      const data = await res.json();
      console.log("Confirm Login API Response:", data);
  
      if (res.status === 200) {
        const decryptedJWT = decryptPayload(data.msg);
        const objectJWT = JSON.parse(decryptedJWT);
  
        if (objectJWT.status === "success") {
          Cookies.set("TOKEN", objectJWT.data.token, { expires: 1 });
          Cookies.set("USER_ID", encryptPayload(objectJWT.data.user_id), { expires: 1 });
          Cookies.set("NAME", encryptPayload(objectJWT.data.name), { expires: 1 });
          Cookies.set("GROUP_ID", encryptPayload(objectJWT.data.group_id), { expires: 1 });
          Cookies.set("GROUP_NAME", encryptPayload(objectJWT.data.group_name), { expires: 1 });
          Cookies.set("MENU_LIST", encryptPayload(JSON.stringify(objectJWT.data.menu_list)), {
            expires: 1,
          });
  
          showToast(objectJWT.message, "success");
          navigate("/dashboard/home", { state: { message: objectJWT.message } });
        } else {
          showToast(objectJWT.message || "Failed to confirm login.", "error");
        }
      } else {
        showToast(data.message || "Failed to confirm login.", "error");
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      showToast("An error occurred while confirming login.", "error");
    }
  };  

  const handleSubmitLogin = async (event) => {
    event.preventDefault();

    try {
      const msg = encryptPayload(JSON.stringify({ id: id, secret_key: password }));

      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/login`, {
        body: JSON.stringify({ msg: msg }),
        headers: {"Content-Type": "application/json"},
        method: "POST",
      });
      const data = await res.json();

      if (res.status === 409) {
        setCurrentDeviceId(data.current_device_id);
        setCurrentUserId(data.current_user_id);
        setShowConflictPopup(true);
        return;
      }

      const decryptedJWT = decryptPayload(data.msg);
      const objectJWT = JSON.parse(decryptedJWT);

      console.log("Decrypted JWT:", decryptedJWT);

      if (res.status === 200 && objectJWT.status !== "error") {
        const decryptedToken = jwtDecode(decryptedJWT);
  
        const decryptedTokenPayload = decryptPayload(decryptedToken.payload);
        console.log("Decrypted Token Payload:", decryptedTokenPayload);
  
        const { email, phone_number } = JSON.parse(decryptedTokenPayload);

        Cookies.set("TOKEN", objectJWT.data.token, { expires: 1 });
        Cookies.set("USER_ID", encryptPayload(objectJWT.data.user_id), { expires: 1 });
        Cookies.set("NAME", encryptPayload(objectJWT.data.name), { expires: 1 });
        Cookies.set("GROUP_ID", encryptPayload(objectJWT.data.group_id), { expires: 1 });
        Cookies.set("GROUP_NAME", encryptPayload(objectJWT.data.group_name), { expires: 1 });
        Cookies.set("MENU_LIST", encryptPayload(JSON.stringify(objectJWT.data.menu_list)), {expires: 1 });
        const { user_forgot_password } = objectJWT.data;
        Cookies.set("USER_FORGOT_PASSWORD", user_forgot_password, { expires: 1 });
        Cookies.set("EMAIL", encryptPayload(email), { expires: 1 });
        Cookies.set("PHONE_NUMBER", encryptPayload(phone_number), { expires: 1 });

        showToast(objectJWT.message, "success");
        navigate("/dashboard/home", { state: { message: objectJWT.message} });
      } else {
        showToast(objectJWT.message, "error");
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      showToast("An error occurred. Please try again!", "error");
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
  
    try {
      const msg = encryptPayload(JSON.stringify({ email }));
  
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/send/email/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ msg }),
      });
  
      const data = await res.json();
  
      if (res.status === 200) {
        showToast("Password reset link sent to your email.", "success");
        setEmail("");
        setShowForgotPasswordModal(false);
      } else {
        showToast(data.message || "Failed to send reset link.", "error");
      }
    } catch (error) {
      console.error(`ERROR: ${error}`);
      showToast("An error occurred. Please try again!", "error");
    }
  };  

  const handleCancelForgotPassword = () => {
    setEmail("");
    setShowForgotPasswordModal(false);
  };

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

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  }

  return (
    isLoading? <></>:
      <div className="flex flex-col md:flex-row min-h-screen">
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
          <ImageComponent />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 lg:p-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-blue-600 font-poppins">
                Welcome back!
              </h2>
              <p className="mt-2 text-sm text-gray-600 font-poppins">
                Sign in to continue to Project Management.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmitLogin}>
              <div className="space-y-4 font-poppins">
                <div>
                  <label
                    htmlFor="Id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Id
                  </label>
                  <input
                    id="id"
                    name="id"
                    type="text"
                    autoComplete="id"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                    placeholder="Enter id"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2 mt-6"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEye : faEyeSlash}
                        className="text-gray-500 hover:text-gray-700 size-4"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-left">
              <p className="text-[12px] text-gray-600 font-poppins -mt-4">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="font-medium text-blue-600 hover:text-blue-500 underline"
              >
                Forgot password?
              </button>
              </p>
            </div>
              <div>
                <Button className="py-2 px-4 text-sm">Sign in</Button>
              </div>
              <div className="w-full flex flex-col items-center text-sm text-gray-700 mt-6 font-poppins">
                <div className="flex items-center w-full">
                  <hr className="flex-grow border-t border-gray-300" />
                  <span className="px-4 text-[12px] text-gray-700">Or Sign In With</span>
                  <hr className="flex-grow border-t border-gray-300" />
                </div>
              </div>

              <div className="w-full flex flex-col items-center mt-4">
                <div className="flex flex-col items-center bg-white rounded-full border border-gray-300 w-10 h-10 justify-center">
                  <img
                  onClick={handleGoogleLogin}
                    src={GoogleLogo}
                    alt="Google Logo"
                    className="w-6 h-6 object-contain"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
        {showConflictPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-poppins">
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-4 text-center">Login Confirmation</h2>
              <p className="text-[14px] text-gray-600 mb-6 text-center">
                This user is already logged in on another device. Do you want to proceed with this device?
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md text-[14px] hover:bg-gray-400 transition duration-150"
                  onClick={() => setShowConflictPopup(false)}
                >
                  No
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-[14px] hover:bg-blue-700 transition duration-150"
                  onClick={handleConfirmLogin}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}
        {showForgotPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-poppins">
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 w-full max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-4 text-center">Forgot Password</h2>
              <form onSubmit={handleForgotPassword}>
                <p className="text-[14px] text-gray-600 mb-6 text-center">
                  Enter your email to reset your password.
                </p>
                <div className="mb-4">
                  <input
                    type="email"
                    required
                    className="block w-full px-3 py-2 border rounded-md text-[14px] placeholder-gray-500"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 rounded-md text-[14px] hover:bg-gray-400 text-gray-800 transition duration-150"
                    onClick={handleCancelForgotPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-[14px] hover:bg-blue-700 transition duration-150"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <ToastContainer />
      </div>
    );
};

export default Login;