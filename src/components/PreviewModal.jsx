import React from 'react';
import { Typography } from "@material-tailwind/react";
import { AiOutlineDownload } from 'react-icons/ai';
import { handleDownload } from '@/utils/helper';

const PreviewModal = ({ showModal, file, closeModal }) => {
  if (!showModal) return null;

  const extension = file.split('.').pop().toLowerCase();
  let fileContent;

  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      fileContent = (
        <div className="flex justify-center items-center">
          <img src={`https://cxt.co.id:5003/attachments/${file}`} alt="attachment preview" className="max-w-full max-h-96 object-contain" />
        </div>
      );
      break;
    case 'pdf':
      fileContent = <iframe src={`https://cxt.co.id:5003/attachments/${file}`} className="w-full h-96" />;
      break;
    case 'mp4':
    case 'avi':
      fileContent = <video src={`https://cxt.co.id:5003/attachments/${file}`} controls className="max-w-full max-h-96 object-contain" />;
      break;
    default:
      fileContent = <Typography className="font-normal text-xs font-poppins px-8">Unsupported file type</Typography>;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-4 rounded-lg w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 relative">
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handleDownload(file)}
            className="flex items-center text-blue-500 hover:text-blue-700 text-xs font-medium font-poppins"
          >
            <AiOutlineDownload className="h-4 w-4 mr-1" />
            Download
          </button>
        </div>
        <div className="mt-4 mb-4">{fileContent}</div>
      </div>
    </div>
  );
};

export default PreviewModal;