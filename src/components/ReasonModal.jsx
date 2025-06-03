import React, { useState, useEffect } from 'react';
import { Button } from '@material-tailwind/react';

const ReasonModal = ({ isOpen, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen]);

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-poppins">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-md">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Hold Reason</h2>
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md mb-4 text-sm text-gray-700"
            rows="4"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for moving the task to this status..."
          />

          <div className="flex justify-end gap-2">
            <Button
              variant="text"
              color="red"
              onClick={onClose}
              className="font-poppins font-semibold px-4 py-2.5 text-[12px]"
            >
              Cancel
            </Button>
            <Button
              variant="gradient"
              color="green"
              onClick={() => onSubmit(reason)}
              className="font-poppins font-semibold px-4 py-2.5 text-[12px]"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    )
  );
};

export default ReasonModal;