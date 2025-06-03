import { useEffect, useState } from "react";
import { DragDropContext, Draggable, Droppable, resetServerContext } from "react-beautiful-dnd";
import { InboxIcon } from "@heroicons/react/24/solid";
import { decryptPayload } from "@/services/codec/codec";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Column from "@/components/Column";
import ProjectSelector from "@/components/ProjectSelector";
import Cookies from 'js-cookie';
import TaskDetailModal from "@/components/TaskDetailModal";
import NotificationDialog from "@/components/NotificationDialog";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatKanbanDate } from "@/utils/helper";
import MultiSelectAssignee from "@/components/MultiSelectAssignee";
import ReasonModal from "@/components/ReasonModal";

const INITIAL_COLUMN_ORDER = [];

const INITIAL_COL_DATA = {};

//add this if using next.js and keep the strict mode to false
export async function getServerSideProps(context) {
  resetServerContext();
  return {
    props: {},
  };
}

export function Assignment() {
  const [columnsOrder, setColumnsOrder] = useState(INITIAL_COLUMN_ORDER);
  const [data, setData] = useState(INITIAL_COL_DATA);
  const [projectStatus, setProjectStatus] = useState([]);
  const [assigneeTasklist, setAssigneeTasklist] = useState([]);
  const [projectAssignee, setProjectAssignee] = useState([]);
  const [userSelector, setUserSelector] = useState([]);
  const [comments, setComments] = useState([]);
  const [subComments, setSubComments] = useState([]);
  const [decryptedUserId, decryptedUserName] = [Cookies.get('USER_ID'), Cookies.get('NAME')].map(decryptPayload);
  const [projectKey, setProjectKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ tasklist_code: "", kode: "", title: "", description: "", attachment: "", duedate: "", project_id: "", assignee: "", status_id: "", assignee_id: "", assignee_name: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [subtasklist, setSubtasklist] = useState([]);
  const [projectAssignment, setProjectAssignment] = useState([]);
  const [userAssigned, setUserAssigned] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [commentMode, setCommentMode] = useState('tasklist');
  const [formDataComment, setFormDataComment] = useState({ id: "", tasklist_id: "", comment: "", comment_mode: "", subtasklist_id: "" });
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [subtasklistComment, setSubtasklistComment] = useState('');
  const [tasklistComment, setTasklistComment] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [openDropdownSubtask, setOpenDropdownSubtask] = useState(null);
  const [tags, setTags] = useState([]);
  const [isMentioning, setIsMentioning] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [reasonTask, setReasonTask] = useState(null);
  const [destinationColumnId, setDestinationColumnId] = useState(null);
  const [todoProject, setTodoProject] = useState([]);

  useEffect(() => {
    fetchProjectUserAssigned();
    fetchDetailUserAssigned();
    fetchUserMultiSelector();
    fetchTodoTaskToKanban();
    fetchComments();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchProjectTaskToKanban();
    } else {
      setIsLoading(false);
    }
  }, [formData.project_id]);

  useEffect(() => {
    if (formData.project_id) {
      fetchCommentUserAssigned();
    } else {
      setIsLoading(false);
    }
  }, [formData.project_id]);

  useEffect(() => {
    if (formData.project_id) {
      fetchUserMultiSelector();
    } else {
      setIsLoading(false);
    }
  }, [formData.project_id]);

  useEffect(() => {
    if (formData.project_id || formData.assignee_id) {
      fetchProjectTaskToKanban();
    } else {
      setIsLoading(false);
    }
  }, [formData.project_id, formData.assignee_id]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      assignee_id: selectedUsers.length > 0 ? selectedUsers.map(user => user.id).join(",") : "",
      assignee_name: selectedUsers.map(user => user.name).join(",")
    }));
  }, [selectedUsers]);
  
  const fetchProjectUserAssigned = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/project-assignee/${decryptedUserId}`;
    const data = await apiRequest(url);
    setIsLoading(false);
    processAndSetData(data?.data, setProjectAssignee);
  };

  const fetchUserMultiSelector = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/project-assignee/${formData.project_id}/assignees`;
    const data = await apiRequest(url);
    setIsLoading(false);
  
    if (data?.status === 'success' && Array.isArray(data.data)) {
      const formattedData = data.data.map(user => ({
        id: user.assignee_id,
        name: user.assignee_name === decryptedUserName 
          ? `Me (${user.assignee_name})`
          : user.assignee_name,
        originalName: user.assignee_name,
        project_id: user.project_id
      }));
  
      const meUser = formattedData.find(user => user.name.startsWith("Me"));
      const otherUsers = formattedData.filter(user => !user.name.startsWith("Me"));
  
      setUserSelector([meUser, ...otherUsers]);
    } else {
      console.error("Failed to fetch user data or data format is incorrect:", data);
      setUserSelector([]);
    }
  };

  const fetchTodoTaskToKanban = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/project-assignee/top-todo/project`;
    const data = await apiRequest(url);
    console.log("Todo Project:", data);
    setIsLoading(false);
  
    // Assuming the project_id is directly available in the fetched data
    const projectId = data?.data?.project_id;
    if (projectId) {
      // Automatically set the project_id in formData
      setFormData((prevFormData) => ({
        ...prevFormData,
        project_id: projectId,
      }));
  
      // Call handleProjectChange to update any other state (if necessary)
      handleProjectChange(projectId);
    }
  
    processAndSetData(data?.data, setTodoProject);
  };

  const fetchProjectTaskToKanban = async () => {
    setIsLoading(true);
  
    const assigneesId = formData.assignee_id
      ? formData.assignee_id.split(',').map(name => {
          return name.startsWith("Me")
            ? name.replace(/Me \((.*)\)/, '$1')
            : name.trim();
        }).join(',')
      : '';
  
    const url = assigneesId
      ? `${import.meta.env.VITE_BASE_URL}/api/v1/project-assignee/${formData.project_id}/boards?assigneesId=${encodeURIComponent(assigneesId)}`
      : `${import.meta.env.VITE_BASE_URL}/api/v1/project-assignee/${formData.project_id}/boards`;
  
    const data = await apiRequest(url);  
    if (data?.data) {
      const { project_status: statusData, assignee_tasklist: tasks } = data.data;
      setProjectStatus(statusData);
  
      const initialColumns = {};
      const columnOrder = statusData.map(status => {
        const statusId = `column-${status.status_id}`;
        initialColumns[statusId] = { id: statusId, title: status.status_name, itemsOrder: [] };
        return statusId;
      });
  
      tasks.forEach(task => {
        const taskId = task.tasklist_code;
        initialColumns[`column-${task.tasklist_status_id}`].itemsOrder.push(taskId);
      });
  
      setColumnsOrder(columnOrder);
      setData(initialColumns);
      setAssigneeTasklist(tasks);
    } else {
      setProjectStatus([]);
      setAssigneeTasklist([]);
    }
    setIsLoading(false);
  };
  
  const fetchDetailProjectTask = async (taskId) => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/task-list/${taskId}/detail`;
    const data = await apiRequest(url);
    setTaskDetails(data?.data || null);
  };

  const fetchProjectSubTask = async (taskId) => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/substasklist/${taskId}/get-all`;
    console.log('URL', url)
    const data = await apiRequest(url);
    console.log('SUB', data)
    const sortedSubtasks = data?.data.sort((a, b) => {
      return a.kode.localeCompare(b.kode);
    });
    setSubtasklist(sortedSubtasks);
  };

  const fetchDetailUserAssigned = async () => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/project-status`;
    const data = await apiRequest(url);
    processAndSetData(data?.data, setProjectAssignment);
  };

  const fetchCommentUserAssigned = async () => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/comments/${formData.project_id}/user-assigned`;
    try {
      const data = await apiRequest(url);
  
      if (data?.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
        const processedData = data.data.filter(user => user.email);
        setUserAssigned(processedData);
        return processedData;
      } else {
        console.error("No valid users found in response.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching user assigneed:", error);
      return [];
    }
  };

  const fetchComments = async (taskId, mode) => {
    const endpoint = mode === 'subtasklist' ? `${taskId}/subtasklist` : `${taskId}/tasklist`;
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/comments/${endpoint}`;
  
    try {
      const data = await apiRequest(url);
      const setterComment = mode === 'subtasklist'? setSubComments : setComments;
      processAndSetData(data?.data, setterComment);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };  

  const formatComment = (comment, users) => {
    if (!users || users.length === 0) {
      console.error("No users available to format the comment.");
      return comment;
    }
  
    return comment.replace(/@(\w+)/g, (_, name) => {
      const user = users.find(user => user.name.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, ''));
      return user ? `@["${user.email}"]` : `@${name}`;
    });
  };  

  const addComment = async (tasklistId) => {
    const users = await fetchCommentUserAssigned();
  
    if (!users || users.length === 0) {
      console.error("No users available to process the comment.");
      return;
    }
  
    const decryptedUserId = decryptPayload(Cookies.get('USER_ID'));
    const comment = Cookies.get("comment");
    const subtasklistId = Cookies.get("subtask_id");
  
    console.log("Subtasklist ID from cookies:", subtasklistId);
  
    const formattedComment = formatComment(comment, users);
  
    const dataToSend = {
      ...formDataComment,
      created_by: decryptedUserId,
      comment_mode: commentMode,
      tasklist_id: tasklistId || selectedTask?.id,
      comment: formattedComment,
      ...(commentMode === 'subtasklist' && { subtasklist_id: subtasklistId })
    };
  
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/comments/store`;
    try {
      const response = await apiRequest(url, "POST", dataToSend);
  
      if (response?.status === 'success') {
        console.log("Fetching comments with:", subtasklistId, commentMode);
        fetchComments(commentMode === 'subtasklist' ? subtasklistId : tasklistId, commentMode);
        setFormDataComment({ id: "", tasklist_id: "", comment: "", comment_mode: "", subtasklist_id: "" });
        setTasklistComment("");
        setSubtasklistComment("");
      } else {
        console.error('An Error Occurred While Saving The Comment:', response?.message);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };   

  const updateProjectTaskStatus = async (taskId, columnId, holdComment = null) => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/project-assignee/${taskId}/status/edit`;
    const body = { task_id: taskId, status_id: columnId.replace('column-', '') };
  
    if (holdComment) {
      body.hold_comment = holdComment;
    }

    try {
      const response = await apiRequest(url, "PUT", body);
      if (response.status === 'success') {
        showToast(response.message);
      } else {
        showToast(response.message || 'Failed to update task status!', true);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      showToast('An error occurred while updating task status.', true);
    } finally {
      await fetchProjectTaskToKanban();
    }
  };  

  const updateProjectTaskAssignee = async (taskId, newAssignee) => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/task-list/${taskId}/assignee/edit`;
    const dataToSend = { assignee: newAssignee }; // Data yang akan dikirim

    try {
        // Log data yang dikirim ke API
        console.log("Data to send:", dataToSend);

        const response = await apiRequest(url, "PUT", dataToSend);
        if (response?.status === 'success') {
            setNotification({ open: true, message: response.message, isError: false });
        } else {
            setNotification({ open: true, message: response.message || 'Failed to update assignee!', isError: true });
        }
    } catch (error) {
        console.error("Error updating assignee:", error);
        setNotification({ open: true, message: 'An error occurred while updating assignee.', isError: true });
    } finally {
        await fetchProjectTaskToKanban(); 
        await fetchDetailProjectTask(taskId);
        console.log("Assignee updated successfully.");
    }
};
  
  const updateProjectSubTaskAssignee = async (subTaskId, newAssignee) => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/subtasklist/${subTaskId}/assignee/edit`;
    const dataToSend = { assignee: newAssignee };
  
    // Log URL dan data yang akan dikirim
    console.log("URL:", url);
    console.log("Data to send:", dataToSend);
  
    await apiRequest(url, "PUT", dataToSend);
    fetchProjectSubTask(selectedTask.id);
  };  

  const updateProjectSubTaskStatus = async (subTaskId, newStatus) => {
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/subtasklist/${subTaskId}/status/edit`;
    await apiRequest(url, "PUT", { status_id: newStatus });
    fetchProjectSubTask(selectedTask.id);
  };

  const getUsernamesForProject = (project_id) => {
    const users = userSelector.filter(p => p.project_id === project_id);
    return users.map(user => ({
      id: user.id,
      name: user.name,
    }));
  };  
  
  const handleProjectChange = (value) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      project_id: value,
      assignee_id: null,
    }));
    setProjectKey(prevKey => prevKey + 1);
  };

  const handleSelectUsers = (selectedList) => {
    setSelectedUsers(selectedList);
  };

  const handleRemoveUsers = (removedList) => {
    setSelectedUsers(removedList);
  };

  const handleTaskDoubleClick = async (task) => {
    if (!task.id) {
      console.error("Task kode is not defined");
      return;
    }
    setCommentMode('tasklist');
    setSelectedTask(task);
    await fetchDetailProjectTask(task.id);
    await fetchProjectSubTask(task.id);
    await fetchComments(task.id, 'tasklist');
    setIsLoading(false);
    setIsModalOpen(true);
  };

  const handleDragDrop = async (results) => {
    const { source, destination, type } = results;
  
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
  
    if (type === "COLUMN") {
      // Dragging columns
      const reorderedColumns = [...columnsOrder];
      const [removedItem] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, removedItem);
  
      setColumnsOrder(reorderedColumns);
  
      // Save the reordered columns in the database if necessary
      return;
    } else {
      // Dragging tasks within or between columns
      const sourceCol = data[source.droppableId];
      const destinationCol = data[destination.droppableId];
      const sourceItems = [...sourceCol.itemsOrder];
      const destItems = [...destinationCol.itemsOrder];
      const [movedItem] = sourceItems.splice(source.index, 1);
  
      if (source.droppableId === destination.droppableId) {
        sourceItems.splice(destination.index, 0, movedItem);
        const newColData = {
          ...data,
          [source.droppableId]: {
            ...sourceCol,
            itemsOrder: sourceItems,
          },
        };
        setData(newColData);
  
        // Update the database with the new order within the same column
        await updateProjectTaskStatus(movedItem, source.droppableId);
      } else {
        destItems.splice(destination.index, 0, movedItem);
        const newColData = {
          ...data,
          [source.droppableId]: {
            ...sourceCol,
            itemsOrder: sourceItems,
          },
          [destination.droppableId]: {
            ...destinationCol,
            itemsOrder: destItems,
          },
        };
        setData(newColData);
      };
  
      const destinationStatus = projectStatus.find(
        (status) => `column-${status.status_id}` === destination.droppableId
      );
      if (destinationStatus?.status_mode === "3") {
        setReasonTask(movedItem);
        setDestinationColumnId(destination.droppableId);
        setIsReasonModalOpen(true);
      } else {
        await updateProjectTaskStatus(movedItem, destination.droppableId);
      }
    }
  };

  const handleSubmitReason = async (reason) => {
    if (reasonTask && destinationColumnId) {
      await updateProjectTaskStatus(reasonTask, destinationColumnId, reason);
    }
    setReasonTask(null);
    setDestinationColumnId(null);
    setIsReasonModalOpen(false);
  };

  const handleCloseReasonModal = () => {
    setReasonTask(null);
    setIsReasonModalOpen(false);
    fetchProjectTaskToKanban();
  };

  const handleCloseModal = () => {
    setSelectedSubtask(null);
    setTasklistComment("")
    setSubtasklistComment("")
    setIsMentioning("");
    setIsModalOpen(false);
  };

  const getColumnHeaderColor = (statusMode) => {
    switch (statusMode) {
      case "0":
        return ['rgba(248, 215, 218, 0.3)', '#f17171'];
      case "1":
        return ['rgba(255, 255, 204, 0.3)', '#f4c542'];
      case "2":
        return ['rgba(212, 237, 218, 0.3)', '#67b173'];
        case "3":
            return ['rgba(200, 200, 200, 0.3)', '#5a5a5a'];
        default:
            return ['rgba(226, 227, 229, 0.3)', '#383d41'];
    }
  };

  const toastConfig = {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "light",
    onClose: () => setIsToastVisible(false),
  };
  
  const showToast = (message, isError = false) => {
    toast(message, {
      ...toastConfig,
      type: isError ? "error" : "success",
      style: { fontFamily: "Poppins, sans-serif", fontSize: "14px" },
    });
  };  

  const selectedProject = projectAssignee.find(project => project.project_id === formData.project_id);
  const projectName = selectedProject ? selectedProject.project_name : "Select a Project";

  function renderColumn(colId, index) {
    const columnData = data[colId];
    const taskCount = columnData.itemsOrder ? columnData.itemsOrder.length : 0;
    const statusMode = projectStatus.find(status => `column-${status.status_id}` === colId)?.status_mode;
    const [bgColor, textColor] = getColumnHeaderColor(statusMode);
  
    return (
      <Draggable draggableId={columnData.id} key={columnData.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="rounded-md border flex flex-col w-70 max-w-xs mx-4 mb-4 shadow-md shadow-blue-100 bg-white"
          >
            <div
              {...provided.dragHandleProps}
              className={`relative flex items-center justify-center w-full p-2 rounded-t-md text-white`}
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              <p className="text-sm font-medium font-poppins flex-1 text-center">
                {columnData.title}
              </p>
              <span
                className="absolute right-2.5 top-2 flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full font-poppins"
                style={{ backgroundColor: textColor, color: 'white' }}
              >
                {taskCount}
              </span>
            </div>
            <Droppable droppableId={colId} type="TASK">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-1 min-h-20"
                >
                  <Column {...columnData} ITEMS={assigneeTasklist.reduce((acc, task) => {
                      acc[task.tasklist_code] = {
                        id: task.tasklist_code,
                        title: task.tasklist_title,
                        status: task.tasklist_status_id,
                        status_name: task.tasklist_status_name,
                        severity: task.tasklist_severity,
                        username: task.tasklist_assignee_name,
                        dueDate: formatKanbanDate(task.tasklist_duedate),
                        status_mode: task.tasklist_status_mode, 
                      };
                      return acc;
                    }, {})}
                    onTaskDoubleClick={handleTaskDoubleClick}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        )}
      </Draggable>
    );
  }  

  return (
    <>
      <div>
      <ToastContainer />
      <div className="flex space-x-4 bg-white rounded-lg shadow-sm mt-4">
        <ProjectSelector
          projectAssignee={projectAssignee}
          formData={formData}
          handleProjectChange={handleProjectChange}
          isLoading={isLoading}
        />
        <MultiSelectAssignee
        options={userSelector}
        selectedValues={selectedUsers}
        onSelect={handleSelectUsers}
        onRemove={handleRemoveUsers}
        placeholder="Assignee Name"
      />
      </div>
        <div className="flex h-full w-full items-center flex-col bg-white rounded-lg mt-4 shadow-md">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '145px' }}>
              <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full" role="status">
              </div>
            </div>
          ) : formData.project_id ? (
            <>
              <p className="font-bold font-poppins text-2xl bg-gradient-to-r from-blue-600 via-blue-800 to-blue-600 mt-6 text-transparent bg-clip-text">
                {projectName}
              </p>
              <DragDropContext onDragEnd={handleDragDrop}>
                <Droppable droppableId="ROOT" type="COLUMN" direction="horizontal">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex w-full overflow-x-auto mb-6 py-4 mt-2 gap-x-1 gap-y-12 md:max-w-6xl px-2.5 min-h-96 rounded-md"
                      style={{
                        minWidth: '100%',
                        paddingBottom: '20px',
                      }}
                    >
                      <div className="flex" style={{ minWidth: `${columnsOrder.length * 300}px` }}>
                        {columnsOrder.map((colId, index) => (
                          <div key={colId} style={{ width: '300px', minWidth: '300px' }}>
                            {renderColumn(colId, index)}
                          </div>
                        ))}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center" style={{ padding: '112px' }}>
              <InboxIcon className="h-16 w-16 text-gray-500 mb-4 animate-bounce" />
              <p className="text-center font-poppins text-xl font-medium text-gray-500">
                No Project Selected
              </p>
            </div>
          )}
        </div>
      </div>
      <TaskDetailModal
        task={selectedTask}
        taskDetails={taskDetails}
        subtasks={subtasklist}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        comments={comments}
        projectStatus={projectStatus}
        subComments={subComments}
        setCommentMode={setCommentMode}
        fetchComments={fetchComments}
        setSelectedSubtask={setSelectedSubtask}
        selectedSubtask = {selectedSubtask}
        addComment={addComment}
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
        subtasklistComment={subtasklistComment}
        setSubtasklistComment={setSubtasklistComment}
        tasklistComment={tasklistComment}
        setTasklistComment={setTasklistComment}
        setSubtasks={setSubtasks}
        updateProjectSubTaskStatus={updateProjectSubTaskStatus}
        getUsernamesForProject={getUsernamesForProject}
        formData={formData}
        setTaskDetails={setTaskDetails}
        setFormData = {setFormData}
        updateProjectTaskAssignee = {updateProjectTaskAssignee}
        updateProjectSubTaskAssignee = {updateProjectSubTaskAssignee}
        decryptedUserName = {decryptedUserName}
        dropdownOpen = {dropdownOpen}
        setDropdownOpen = {setDropdownOpen}
        openDropdownSubtask = {openDropdownSubtask}
        setOpenDropdownSubtask = {setOpenDropdownSubtask}
        tags = {tags}
        setTags = {setTags}
        isMentioning = {isMentioning}
        setIsMentioning = {setIsMentioning}
        fetchCommentUserAssigned = {fetchCommentUserAssigned}
        userAssigned = {userAssigned}
      />
      <NotificationDialog
        open={notification.open}
        setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
        message={notification.message}
        isError={notification.isError}
      />    
      <ReasonModal
        isOpen={isReasonModalOpen}
        onClose={handleCloseReasonModal}
        task={reasonTask}
        onSubmit={handleSubmitReason}
      />
    </>
  );
}