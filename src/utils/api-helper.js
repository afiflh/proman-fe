import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';

  export const apiRequest = async (url, method = "GET", body = null) => {
    const token = Cookies.get("TOKEN");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify({ msg: encryptPayload(JSON.stringify(body)) });
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (response.status === 409) {
        Swal.fire({
          icon: 'error',
          title: 'Session Expired',
          text: 'You will be logged out automatically.',
          timer: 3000,
          showConfirmButton: false,
          willClose: () => {
            Cookies.remove("TOKEN");
            Cookies.remove("USER_ID");
            Cookies.remove("NAME");
            Cookies.remove("GROUP_ID");
            Cookies.remove("GROUP_NAME");
            Cookies.remove("MENU_LIST");

            window.location.href = "/auth/login";
          },
          width: '400px',
          borderRadius: '10px',
          didOpen: () => {
            document.querySelector('.swal2-popup').style.fontFamily = 'Poppins, sans-serif';
            const title = document.querySelector('.swal2-title');
            if (title) {
              title.style.fontSize = '20px';
            }
            const text = document.querySelector('.swal2-html-container');
            if (text) {
              text.style.fontSize = '14px';
            }
          }
        });
      }
      return JSON.parse(decryptPayload(data.msg));
    } catch (error) {
      console.error(`Error in ${method} request to ${url}:`, error);
      return null;
    }
  };

  export const processAndSetData = (responseData, setDataFunc, defaultValue = []) => {
    if (responseData && Array.isArray(responseData)) {
      setDataFunc(responseData.length === 0 ? defaultValue : responseData);
    } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
      setDataFunc(responseData.data.length === 0 ? defaultValue : responseData.data);
    } else {
      console.error("Received data is not an array or missing 'data' property:", responseData);
      setDataFunc(defaultValue);
    }
  };

  export const processAndSetDataKPI = (reportData, setKPIData) => {
    if (reportData.status === 'success' && reportData.data.kpi_by_dates) {
        const flattenedData = [];
        const uniqueAssignees = new Set();

        // Iterate through each date in kpi_by_dates
        for (const date in reportData.data.kpi_by_dates) {
            const entries = reportData.data.kpi_by_dates[date];
            if (Object.keys(entries).length === 0) {
                // If there are no entries for that date, add an entry with N/A for all fields
                flattenedData.push({
                    date,
                    assignees: []
                });
            } else {
                const assigneeEntries = [];
                // Iterate through each assignee for that date
                for (const assignee in entries) {
                    if (entries.hasOwnProperty(assignee)) {
                        const entry = entries[assignee];
                        uniqueAssignees.add(entry.assignee_name || 'N/A'); // Collect unique assignee names
                        assigneeEntries.push({
                            assignee_name: entry.assignee_name || 'N/A',
                            task_code: entry.task_code || 'N/A',
                            task_title: entry.task_title || 'N/A',
                        });
                    }
                }
                flattenedData.push({
                    date,
                    assignees: assigneeEntries
                });
            }
        }

        setKPIData({ flattenedData, uniqueAssignees: Array.from(uniqueAssignees) });
    } else {
        setKPIData({ flattenedData: [], uniqueAssignees: [] }); // Set to empty if no data
    }
};