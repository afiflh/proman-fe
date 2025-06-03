import Cookies from 'js-cookie';

  export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA');
  };

  export const formatKanbanDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  export const formatFilenames = (filenames) => {
    return filenames.split(',').map(file => file.trim()).join(', ');
  };

  export const capitalizeWords = (text) =>
    typeof text === 'string'
      ? text.split(' ').map(word => word[0]?.toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      : text;

  export const handleDownload = async (filename) => {
    const token = Cookies.get('TOKEN');

    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch(`https://cxt.co.id:5003/api/v1/download/file/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  export const handleTemplateDownload = async (filename) => {
    const token = Cookies.get('TOKEN');

    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch(`https://cxt.co.id:5003/api/v1/docs-standard/download/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  
  export const getInitial = (fullName) => {
    if (!fullName) return "";
    const firstName = fullName.split(" ")[0];
    return firstName.charAt(0).toUpperCase();
  };

  export const getInitialComment = (name) => {
    if (!name) return "";
    const initials = name
      .split(" ")
      .map(word => word.charAt(0).toUpperCase())
      .join("");
    return initials;
  };