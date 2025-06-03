import { useState } from "react";
import { Card, Typography, CardBody, Dialog, DialogBody } from "@material-tailwind/react";
import { ChevronDownIcon, ChevronUpIcon, ClipboardDocumentListIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { formatDate, formatFilenames, handleDownload, getInitial, getInitialComment } from "@/utils/helper";
import { letterColors, outerLetterColors, getColorForInitial } from "@/utils/colors";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import Cookies from 'js-cookie';
import PreviewModal from "./PreviewModal";

const TaskDetailModal = ({ taskDetails, subtasks, isOpen, onClose,comments, projectStatus, subComments, setCommentMode, fetchComments, setSelectedSubtask, selectedSubtask, addComment, selectedTask, subtasklistComment, setSubtasklistComment, tasklistComment, setTasklistComment, setSubtasks, updateProjectSubTaskStatus, getUsernamesForProject, formData, setTaskDetails, setFormData, updateProjectTaskAssignee, updateProjectSubTaskAssignee, decryptedUserName, dropdownOpen, setDropdownOpen, openDropdownSubtask, setOpenDropdownSubtask, tags, setTags, isMentioning, setIsMentioning, userAssigned }) => {
  const filenames = taskDetails?.attachment ? formatFilenames(taskDetails.attachment) : '';
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

  const CommentSection = ({ comments }) => {
    const sortedComments = [...comments].sort((a, b) => new Date(b.created_time) - new Date(a.created_time));
  
    return (
      <div className="font-poppins">
        <div>
          {sortedComments.map((comment, index) => {
            const createdTime = new Date(comment.created_time);
            const formattedDate = createdTime.toLocaleDateString();
            const formattedTime = createdTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const initials = getInitialComment(comment.user_sender?.name);
            const initial = initials.charAt(0).toUpperCase();
            const color = getColorForInitial(initial, letterColors);
            const colorOuter = getColorForInitial(initial, outerLetterColors);
  
            return (
              <div key={index} className="flex items-start mb-4 font-poppins mt-4">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-full" style={{ backgroundColor: colorOuter }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                    <span className="text-[14px] font-semibold text-white">
                      {initial}
                    </span>
                  </div>
                </div>
                <div className="flex-1 ml-3">
                  <div className="flex justify-between">
                    <Typography className="font-semibold text-[11px] font-poppins" style={{ color: '#212529' }}>
                      {comment.user_sender?.name}
                    </Typography>
                    <Typography className="text-[11px] font-poppins px-9" style={{ color: '#212529', textAlign: 'right' }}>
                      {formattedDate}
                    </Typography>
                  </div>
                  <div className="flex justify-between mt-1">
                    <Typography className="text-[11px] font-poppins font-normal" style={{ color: '#212529' }}>
                      <span dangerouslySetInnerHTML={{ __html: comment.comment }} />
                    </Typography>
                    <Typography className="text-[11px] font-poppins px-9" style={{ color: '#212529', textAlign: 'right' }}>
                      {formattedTime}
                    </Typography>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };    

  const handleSubtaskClick = (subtask) => {
    setSelectedSubtask(subtask);
    // setCommentMode('subtasklist');
    fetchComments(subtask.kode, 'subtasklist');
  };

  const handleAssigneeChange = (subtask, username) => {
    const subTaskId = subtask.kode;
    if (!subTaskId) {
      console.error("Subtask ID is undefined");
      return;
    }
    // Pass username.name instead of the full object
    updateProjectSubTaskAssignee(subTaskId, username.name)
      .then(() => {
        setSubtasks(prevSubtasks =>
          prevSubtasks.map(st =>
            st.kode === subTaskId ? { ...st, assignee: username.name } : st
          )
        );
      })
      .catch(error => {
        console.error("Failed to update assignee:", error);
      });
    setOpenDropdownSubtask(null);
  };  

  const DetailSection = ({ title, icon, content }) => (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <Typography variant="small" className="font-bold text-lg mr-2 text-[14px]">{icon}</Typography>
        <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '12px' }}>{title}</Typography>
      </div>
      <Typography className="font-normal text-[11px] font-poppins px-8" style={{ color: '#212529' }}>{content}</Typography>
    </div>
  );

  const AttachmentSection = ({ attachment }) => (
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <Typography variant="small" className="font-bold text-lg mr-2 text-[14px]">📎</Typography>
          <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '12px' }}>Attachment</Typography>
        </div>
        <div>
          {attachment ? (
            attachment.split(', ').map((file, index) => (
              <button
                key={index}
                onClick={() => openModal(file)}
                className="text-blue-500 hover:underline block my-1 text-[11px] font-poppins font-normal px-8"
              >
                {file}
              </button>
            ))
          ) : (
            <Typography className="font-normal text-xs font-poppins px-8">No attachment</Typography>
          )}
        </div>
      </div>
  );
  
  const AssigneeDropdown = ({ assignee, onClick }) => (
    <div className="relative cursor-pointer" onClick={onClick}>
      <Typography
        className="flex items-center font-normal text-[11px] font-poppins px-7"
        style={{ color: '#212529' }}
      >
        {assignee}
        <span className="ml-2 flex items-center justify-center bg-blue-500 rounded-full w-3 h-3">
          {dropdownOpen ? (
            <ChevronUpIcon className="w-2 h-2 text-white" />
          ) : (
            <ChevronDownIcon className="w-2 h-2 text-white" />
          )}
        </span>
      </Typography>
      {dropdownOpen && (
        <div
          className="absolute left-5 top-full rounded-lg bg-white shadow-lg mt-1 z-10 w-60 text-[11px]"
          style={{ color: '#212529' }}
        >
          {getUsernamesForProject(formData.project_id).map(user => (
            <div
              key={user.id}
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer font-poppins font-normal"
              onClick={() => {
                setTaskDetails(prevTaskDetails => ({...prevTaskDetails, assignee: user.id}));
                setFormData(prevFormData => ({...prevFormData, assignee: user.id}));
                updateProjectTaskAssignee(selectedTask.id, user.id, formData.project_id);
                setDropdownOpen(false);
              }}
            >
              {user.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );  

  const getStatusBadgeStyle = (statusName) => {
    const baseStyle = {
      borderRadius: '5px',
      padding: '4px 6px',
      display: 'inline-block',
      textAlign: 'center',
      minWidth: '80px',
    };
  
    const styles = {
      'DONE': ['rgba(212, 237, 218, 0.3)', '#67b173'],
      'COMPLETE': ['rgba(204, 230, 255, 0.3)', '#004085'],
      'UAT': ['rgba(255, 239, 179, 0.3)', '#856404'],
      'TODO': ['rgba(226, 227, 229, 0.3)', '#383d41'],
      'IN PROGRESS': ['rgba(255, 255, 204, 0.3)', '#f4c542'],
      'SIT': ['rgba(248, 215, 218, 0.3)', '#f17171'],
    };
  
    const [backgroundColor, color] = styles[statusName] || ['rgba(226, 227, 229, 0.3)', '#383d41'];
  
    return { ...baseStyle, backgroundColor, color };
  };    
  
  const getStatusName = (statusId) => {
    console.log("Subtask statusId in getStatusName:", statusId);
    const status = projectStatus.find(s => s.status_id === statusId);
    return status ? status.status_name : 'Unknown';
  };    
  
  const handleStatusChange = (subtask, statusId) => {
    setSubtasks(prevSubtasks =>
      prevSubtasks.map(st =>
        st.kode === subtask.kode ? { ...st, tasklist_status_id: statusId } : st
      )
    );
    updateProjectSubTaskStatus(subtask.kode, statusId);
  };    

  const SubtaskList = () => {
    const [openDropdownAssignee, setOpenDropdownAssignee] = useState(null);
    const [openDropdownStatus, setOpenDropdownStatus] = useState(null);
  
    if (!projectStatus.length) return null;
    return (
      <div className="mb-4 relative">
        <div className="flex items-center mb-2">
          <Typography variant="small" className="font-bold text-lg mr-2 text-[14px]">🗂️</Typography>
          <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '12px' }}>Sub Task List</Typography>
        </div>
        <div className="overflow-x-auto mt-4">
          <ul className="space-y-4">
            {subtasks.map((subtask, index) => {
              const statusName = getStatusName(subtask.status_id);
              const badgeStyle = getStatusBadgeStyle(statusName);
              const initial = getInitial(subtask.assignee);
              const backgroundColor = getColorForInitial(initial, outerLetterColors);
              const color = getColorForInitial(initial, letterColors);
  
              return (
                <li
                  key={index}
                  className="h-14 border border-blue-gray-300 rounded-md py-1 px-2 font-poppins text-[11px] font-normal cursor-pointer flex justify-between items-center w-[610px]"
                  onClick={() => handleSubtaskClick(subtask)}
                >
                  <span className="truncate max-w-[400px]">
                    <a className="text-blue-600">{subtask.kode}</a> - {subtask.title}
                  </span>
                  <div className="absolute flex items-center ml-[450px]">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer relative"
                      style={{ backgroundColor: backgroundColor }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownAssignee(openDropdownAssignee === subtask ? null : subtask);
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        <span className="text-[11px] font-semibold text-white leading-none">
                          {initial}
                        </span>
                      </div>
                    </div>
                    {/* Status Dropdown */}
                    <div className="ml-1 relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownStatus(openDropdownStatus === subtask ? null : subtask);
                        }}
                        className="bg-white min-w-[100px] py-1 -mr-2 text-[11px] flex justify-center items-center"
                      >
                        <span style={badgeStyle}>{statusName}</span>
                      </button>
                      {openDropdownStatus === subtask && (
                        <div className="absolute right-full bottom-[1px] mb-1 w-40 rounded-lg bg-white shadow-lg z-10 font-poppins font-normal text-[11px]" style={{ color: '#212529' }}>
                          {projectStatus.map(status => (
                            <div
                              key={status.status_id}
                              className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(subtask, status.status_id);
                              }}
                            >
                              {status.status_name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
  
                    {openDropdownAssignee === subtask && (
                      <div className="absolute right-full bottom-[5px] mr-2 rounded-lg bg-white shadow-lg w-60 text-[11px]" style={{ color: '#212529' }}>
                        {getUsernamesForProject(formData.project_id).map(user => (
                          <div
                            key={user.id}
                            className="px-4 py-2 hover:bg-gray-200 cursor-pointer font-poppins font-normal"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssigneeChange(subtask, user); // Pass the full user object
                            }}
                          >
                            {user.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  };  

  return (
    <Dialog open={isOpen} onClose={onClose} size="xl" className="p-0 overflow-auto">
      <DialogBody className="p-0">
        <Card className="border border-gray-200 rounded-lg shadow-lg bg-white h-[80vh]">
          <CardBody className="p-6 text-black h-full overflow-y-auto">
            <div className="grid grid-cols-3 gap-4 h-full">
              {/* Bagian kiri */}
              <div className="col-span-2 p-1 overflow-y-auto">
                <Typography className="font-semibold text-base font-poppins mb-4" style={{ color: '#212529' }}>Task Details</Typography>
                <DetailSection title="Title" icon="📝" content={taskDetails?.title} />
                <DetailSection title="Description" icon="📄" content={<span dangerouslySetInnerHTML={{ __html: taskDetails?.description }}></span>} />
                {taskDetails?.attachment && <AttachmentSection attachment={filenames} />}
                <DetailSection title="Severity" icon="⚡" content={taskDetails?.task_severity} />
                <DetailSection title="Due Date" icon="📅" content={formatDate(taskDetails?.duedate)} />
                <DetailSection title="Project Manager" icon="🧑‍💻" content={taskDetails?.project_manager} />
                <DetailSection title="Business Analyst" icon="🧑‍💼" content={taskDetails?.business_analyst} />
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Typography className="font-bold text-lg mr-2 text-[14px]">👤</Typography>
                    <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '12px' }}>Assignee</Typography>
                  </div>
                  <AssigneeDropdown assignee={taskDetails?.assignee_name} onClick={() => setDropdownOpen(!dropdownOpen)} />
                </div>
                {subtasks.length > 0 && <SubtaskList />}
                <div className="mt-4">
                  <DetailSection title="Comment" icon="🗨️"/>
                  <div className="flex items-center space-x-3 mb-4 w-full max-w-[610px]">
                    <div className="w-full max-w-[610px]">
                      {isMentioning && <div className="border-t border-l border-r border-gray-200 rounded-t-md">
                      {userAssigned && userAssigned.map(data=> (
                      <div
                        key={data.name}
                        className="px-4 py-2 hover:bg-gray-200 cursor-pointer font-poppins font-normal text-[11px]"
                        onClick={() => {
                          setTags([...tags, data.name]);
                          console.log("Tasklist comment:", tasklistComment);
                          const newComment = tasklistComment.replace(/@(?=[^@]*$)/, `@${data.name.toLowerCase().replace(/\s/g, '')} `);
                          console.log("New comment:", newComment);
                          setTasklistComment(newComment);
                          console.log(tasklistComment);
                        }}
                      >
                        {data.name}
                      </div>
                    ))}
                    </div>}
                    <CKEditor
                      editor={ClassicEditor}
                      onFocus={(e) => setCommentMode('tasklist')}
                      data={tasklistComment}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        const rawText = editor.getData().replace(/<[^>]*>/g, '');
                        if (rawText[rawText.length - 1] === '@') {
                          setIsMentioning(true);
                          console.log("Mentioning is true");
                        }else{
                          setIsMentioning(false);
                        }
                        setTasklistComment(data);

                        Cookies.set("comment",data)
                        console.log(data);
                      }}
                      config={{
                        toolbar: {
                          items: [
                            'undo', 'redo', 'bold', 'italic', 'bulletedList', 'numberedList', // Hanya ikon yang ingin ditampilkan
                          ],
                        },
                      }}
                    />
                    <div className="mt-4">
                      <button
                          type="button"
                          className="px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
                          onClick={() => addComment(selectedTask?.id)}
                        >
                        Save
                      </button>
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-xs w-full max-w-[610px] font-poppins mt-3 mb-2" style={{ color: '#212529' }}>
                    {Array.isArray(comments) && comments.length > 0 ? (
                      `${comments.length} ${comments.length === 1 ? "Comment" : "Comments"}`
                    ) : (
                      "No comments yet"
                    )}
                  </div>
                  <hr className="border-t-2 border-gray-300 w-full max-w-[610px] mt-0 mb-1" />

                  <CommentSection comments={comments} />
                </div>
              </div>

              {/* Bagian kanan */}
              <div className="col-span-1 border-l border-gray-200 pl-4 h-full overflow-y-auto flex flex-col items-start">
                {selectedSubtask ? (
                  <>
                    <Typography className="font-semibold text-base mb-4 font-poppins">Subtask Details</Typography>
                    <DetailSection title="Title" icon="📝" content={selectedSubtask.title} />
                    <DetailSection title="Description" icon="📄" content={<span dangerouslySetInnerHTML={{ __html: selectedSubtask.description }}></span>} />
                    {selectedSubtask.attachment && <AttachmentSection attachment={formatFilenames(selectedSubtask.attachment)} />}
                    <DetailSection title="Assignee" icon="👤" content={selectedSubtask.assignee} />
                    <DetailSection title="Status" icon="⏳" content={selectedSubtask.status_name} /> 

                    <div className="w-full max-w-[800px]">
                      <DetailSection title="Comment" icon="🗨️"/>
                      <div className="flex items-center space-x-3 mb-4">
                        {/* User Logo */}
                        <div className="relative flex items-center justify-center shrink-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center absolute"
                          style={{ backgroundColor: getColorForInitial(getInitial(decryptedUserName), outerLetterColors) }}
                        >
                        </div>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center z-10"
                            style={{ backgroundColor: getColorForInitial(getInitial(decryptedUserName), letterColors) }}
                          >
                            <span className="text-[14px] font-semibold text-white leading-none">
                              {getInitial(decryptedUserName)}
                            </span>
                          </div>
                        </div>
                        {/* Comment Input */}
                        <textarea
                         value={subtasklistComment}
                         onChange={(e) => {
                          const newComment = e.target.value;
                          setSubtasklistComment(newComment);
                          Cookies.set("comment", newComment);
                          console.log("Textarea comment:", newComment);
                        }}
                         className="w-full p-2 border border-gray-300 rounded font-poppins text-xs"
                         rows="4"
                         placeholder="Write your comment here..."
                         onFocus={() => {
                          setCommentMode('subtasklist');
                          if (selectedSubtask && selectedSubtask.kode) {
                            Cookies.set("subtask_id", selectedSubtask.kode);
                          }
                        }}                          
                        />
                        <button
                          type="button"
                          className="text-blue-500 flex items-center justify-center"
                          onClick={() => addComment(selectedSubtask?.tasklist_id)}
                        >
                          <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-gray-700 font-medium w-full max-w-[610px] font-poppins text-xs mt-3 mb-2" style={{ color: '#212529' }}>
                        {Array.isArray(subComments) && subComments.length > 0 ? (
                          `${subComments.length} ${subComments.length === 1 ? "Comment" : "Comments"}`
                        ) : (
                          "No comments yet"
                        )}
                      </div>
                      <hr className="border-t-2 border-gray-300 w-full max-w-[610px] mt-0 mb-1" />
                      <CommentSection comments={subComments} />
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center items-center h-full w-full">
                    <div className="flex flex-col items-center justify-center">
                      <ClipboardDocumentListIcon className="text-blue-gray-200 h-14 w-14 animate-bounce mb-2" />
                      <Typography className="text-center text-blue-gray-200 font-poppins font-medium text-sm">
                        Select a subtask to view details
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Close */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </CardBody>
        </Card>
      </DialogBody>
      <PreviewModal showModal={showModal} file={selectedFile} closeModal={closeModal} />
    </Dialog>
  );
}; 

export default TaskDetailModal;