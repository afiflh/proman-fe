import React from "react";
import Select from "react-select";

const LoadingOption = () => (
  <div className="flex items-center justify-center">
    <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
  </div>
); 

const ProjectSelector = ({ projectAssignee, formData, handleProjectChange, isLoading }) => { 
  const projectOptions = projectAssignee.map((project) => ({
    value: project.project_id,
    label: project.project_name,
  }));

  return (
      <div className="mt-4 font-poppins w-72 px-4 mb-4">
        <Select
          className="w-72"
          options={isLoading && projectOptions.length === 0 ? [{ value: '', label: <LoadingOption /> }] : projectOptions}
          value={projectOptions.find(option => option.value === formData.project_id) || null}
          onChange={(selectedOption) => {
            handleProjectChange(selectedOption.value);
          }}
          isSearchable={true}
          placeholder="Project Name"
          styles={{
            control: (base, state) => ({
              ...base,
              borderRadius: '7px',
              padding: '2px',
              fontSize: '14px',
              borderColor: state.isFocused ? 'black' : '#B0BEC5',
              boxShadow: state.isFocused ? '0 0 0 1px black' : base.boxShadow,
              '&:hover': {
                borderColor: state.isFocused ? 'black' : '#B0BEC5',
              },
            }),
            menu: (base) => ({
              ...base,
              borderRadius: '7px',
              padding: '12px 12px',
            }),
            option: (base, state) => ({
              ...base,
              borderRadius: '7px',
              fontSize: '14px',
              padding: '8px 12px',
              backgroundColor: state.isSelected
                ? '#2196F3'
                : state.isFocused
                ? '#E9F5FE'
                : base.backgroundColor,
              color: state.isSelected ? '#fff' : '#616161',
              ':active': {
                ...base[':active'],
                backgroundColor: state.isSelected ? '#2196F3' : '#E9F5FE',
              },
              ...(state.data.value === '' && {
                backgroundColor: 'transparent',
                cursor: 'default',
                ':hover': {
                  backgroundColor: 'transparent',
                },
              }),
            }),
          }}
        />
      </div>
  );
};

export default ProjectSelector;
