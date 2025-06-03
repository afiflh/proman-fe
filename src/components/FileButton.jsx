import React from 'react';
import { AiFillFilePdf } from 'react-icons/ai';

export const PDFButton = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center ml-2 gap-2 px-4 py-2 text-sm capitalize bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 font-poppins font-medium"
        >
            <AiFillFilePdf  className="w-5 h-5" aria-hidden="true" />
        </button>
    );
};