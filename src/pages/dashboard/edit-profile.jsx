import NotificationDialog from '@/components/NotificationDialog';
import { decryptPayload, encryptPayload } from '@/services/codec/codec';
import { capitalizeWords } from '@/utils/helper';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function EditProfile() {
    const [formData, setFormData] = useState({ phone_number: "", email: "", new_password: "", retype_password: "" });
    const [notification, setNotification] = useState({ open: false, message: '', isError: false });

    const fetchUserProfile = () => {
        const encryptedEmail = Cookies.get('EMAIL');
        const encryptedPhoneNumber = Cookies.get('PHONE_NUMBER');
        
        const updatedData = {};
        if (encryptedEmail) {
            updatedData.email = decryptPayload(encryptedEmail);
        }
        if (encryptedPhoneNumber) {
            updatedData.phone_number = decryptPayload(encryptedPhoneNumber);
        }
        setFormData((prevData) => ({ ...prevData, ...updatedData }));
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const encryptedEmail = Cookies.get('EMAIL');
        const encryptedPhoneNumber = Cookies.get('PHONE_NUMBER');
        
        if (encryptedEmail) {
            const decryptedEmail = decryptPayload(encryptedEmail); // Dekripsi email
            setFormData((prevData) => ({ ...prevData, email: decryptedEmail })); // Update email dalam formData
        }
    
        if (encryptedPhoneNumber) {
            const decryptedPhoneNumber = decryptPayload(encryptedPhoneNumber); // Dekripsi phone number
            setFormData((prevData) => ({ ...prevData, phone_number: decryptedPhoneNumber })); // Update phone_number dalam formData
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = Cookies.get('TOKEN');
        const encryptedUserId = Cookies.get('USER_ID');
        const dataToSend = { ...formData };

        if (!encryptedUserId) {
            setNotification({ open: true, message: 'User ID not found. Please log in again.', isError: true });
            return;
        }

        const userId = decryptPayload(encryptedUserId);

        if (!userId) {
            setNotification({ open: true, message: 'Failed to decrypt User ID. Please log in again.', isError: true });
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/users/${userId}/edit-profile`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                method: "PUT",
                body: JSON.stringify({ msg: encryptPayload(JSON.stringify(dataToSend)) }),
            });

            console.log("Data to send: ", dataToSend);

            const statusCode = response.status;
            const data = await response.json();
            const decryptedData = decryptPayload(data.msg);
            const objectData = JSON.parse(decryptedData);

            console.log("Resp: ", objectData);

            const message = capitalizeWords(objectData.message) || 'Data Added Successfully!';

            if (statusCode === 500) {
                setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
            } else if (statusCode >= 400 && statusCode < 500) {
                setNotification({ open: true, message: message || 'A Warning Occurred.', isError: false, isWarning: true });
            } else if (statusCode === 200) {
                Cookies.set('EMAIL', encryptPayload(objectData.email || formData.email));
                Cookies.set('PHONE_NUMBER', encryptPayload(objectData.phone_number || formData.phone_number));
                setFormData((prevData) => ({
                    ...prevData,
                    email: objectData.email || prevData.email,
                    phone_number: objectData.phone_number || prevData.phone_number,
                }));
    setNotification({ open: true, message, isError: false });
            } else {
                setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
            }
        } catch (error) {
            console.error("Error saving data: ", error);
            setNotification({ open: true, message: 'An Unexpected Error Occurred. Please Try Again Later.', isError: true });
        }
    };

    return (
        <div className="container mx-auto py-4">
            <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
                <UserCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-lg font-semibold font-poppins">Profile Information</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-poppins">
                {/* Card Pertama */}
                <div className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-base font-semibold mb-2">Contact</h2>
                    <hr className="border-gray-300 mb-4" />
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                type="text"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleInputChange}
                                className="mt-2 block w-full border border-gray-300 rounded-md p-2 text-[14px]"
                                placeholder="Enter your phone number"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="mt-2 block w-full border border-gray-300 rounded-md p-2 text-[14px]"
                                placeholder="Enter your email address"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-6 py-2 rounded-md w-full text-sm mt-2"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>

                {/* Card Kedua */}
                <div className="bg-white shadow-md rounded-lg p-4">
                    <h2 className="text-base font-semibold mb-2">Security</h2>
                    <hr className="border-gray-300 mb-4" />
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input
                                type="password"
                                name="new_password"
                                value={formData.new_password}
                                onChange={handleInputChange}
                                className="mt-2 block w-full border border-gray-300 rounded-md p-2 text-[14px]"
                                placeholder="Enter your new password"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Retype Password</label>
                            <input
                                type="password"
                                name="retype_password"
                                value={formData.retype_password}
                                onChange={handleInputChange}
                                className="mt-2 block w-full border border-gray-300 rounded-md p-2 text-[14px]"
                                placeholder="Retype new password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-6 py-2 rounded-md w-full text-sm mt-2"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>

            <NotificationDialog
                open={notification.open}
                setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
                message={notification.message}
                isError={notification.isError}
                isWarning={notification.isWarning}
            />
        </div>
    );
}
