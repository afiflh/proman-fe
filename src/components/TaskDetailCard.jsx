import React, { useState } from 'react';
import { Card, CardHeader, Typography, CardBody } from "@material-tailwind/react";
import { formatDate, formatFilenames } from '@/utils/helper';
import PreviewModal from './PreviewModal';

const TaskDetailCard = ({ task }) => {
  const filenames = task.attachment ? formatFilenames(task.attachment) : '';
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');

  const openModal = (file) => {
    setSelectedFile(file);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile('');
  };

  return (
    <Card className="border border-gray-200 rounded-lg shadow-lg bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 border-b border-gray-200 p-4 text-center w-80">
        <Typography className="text-base font-semibold text-white font-poppins">
          PROJECT TASK DETAIL OF {task.kode}
        </Typography>
      </CardHeader>
      <CardBody className="p-6 text-black">
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Typography variant="small" className="font-bold text-lg mr-2">📝</Typography>
            <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '14px' }}>Title</Typography>
          </div>
          <Typography className="font-normal text-xs font-poppins px-8" style={{ color: '#212529' }}>{task.title}</Typography>
        </div>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Typography variant="small" className="font-bold text-lg mr-2">📄</Typography>
            <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '14px' }}>Description</Typography>
          </div>
          <Typography className="font-normal text-xs font-poppins px-8" style={{ color: '#212529', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: task.description }}></Typography>
        </div>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Typography variant="small" className="font-bold text-lg mr-2">📎</Typography>
            <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '14px' }}>Attachment</Typography>
          </div>
          <div>
            {task.attachment ? (
              filenames.split(', ').map((file, index) => (
                <button
                  key={index}
                  onClick={() => openModal(file)}
                  className="flex items-center text-blue-500 hover:underline block my-1 text-xs font-poppins font-normal px-8"
                >
                  {file}
                </button>
              ))
            ) : (
              <Typography className="font-normal text-xs font-poppins px-8">No attachment</Typography>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Typography variant="small" className="font-bold text-lg mr-2">📅</Typography>
            <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '14px' }}>Due Date</Typography>
          </div>
          <Typography className="font-normal text-xs font-poppins px-8" style={{ color: '#212529' }}>{formatDate(task.duedate)}</Typography>
        </div>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Typography variant="small" className="font-bold text-lg mr-2">🧑‍💻</Typography>
            <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '14px' }}>Project Manager</Typography>
          </div>
          <Typography className="font-normal text-xs font-poppins px-8" style={{ color: '#212529' }}>{task.project_manager}</Typography>
        </div>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Typography variant="small" className="font-bold text-lg mr-2">🧑‍💼</Typography>
            <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '14px' }}>Business Analyst</Typography>
          </div>
          <Typography className="font-normal text-xs font-poppins px-8" style={{ color: '#212529' }}>{task.business_analyst}</Typography>
        </div>
        <div>
          <div className="flex items-center mb-2">
            <Typography variant="small" className="font-bold text-lg mr-2">👤</Typography>
            <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '14px' }}>Assignee</Typography>
          </div>
          <Typography className="font-normal text-xs font-poppins px-8" style={{ color: '#212529' }}>{task.assignee}</Typography>
        </div>
      </CardBody>

      <PreviewModal showModal={showModal} file={selectedFile} closeModal={closeModal} />
    </Card>
  );
};

export default TaskDetailCard;