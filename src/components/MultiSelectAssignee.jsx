import React from 'react';
import Multiselect from 'multiselect-react-dropdown';

const MultiSelectAssignee = ({ options, selectedValues, onSelect, onRemove, placeholder }) => {
  const customStyles = {
    multiselectContainer: { 
      border: '1px solid rgba(30, 41, 59, 0.3)', 
      borderRadius: '7px', 
      padding: '2px', 
      paddingLeft: '5px', 
      fontSize: selectedValues.length >= 1 ? '12px' : '14px',
      width: selectedValues.length === 1 ? '300px' : (selectedValues.length === 0 ? '300px' : '560px'),
      marginBottom: selectedValues.length >= 1 ? '16px' : '0px',
      height: selectedValues.length === 1 ? 'auto' : (selectedValues.length === 0 ? '42px' : 'auto'),
    },
    dropdownContainer: { 
      border: '1px solid rgba(30, 41, 59, 0.3)', 
      borderRadius: '7px',
      width: selectedValues.length === 1 ? '300px' : (selectedValues.length === 0 ? '300px' : '560px'),
    },
    searchBox: { 
      border: 'none', 
      borderRadius: '7px', 
      padding: '5px',
    },
    optionContainer: { 
      backgroundColor: '#fff', 
      borderRadius: '7px',
    },
    option: { 
      padding: '10px',
      fontSize: '14px',
    },
    chips: {
      fontSize: '12px',
      padding: '2px 8px',
      borderRadius: '7px',
    },
  };

  return (
    <Multiselect
      options={options}
      selectedValues={selectedValues}
      onSelect={onSelect}
      onRemove={onRemove}
      displayValue="name"
      placeholder={placeholder}
      style={customStyles}
      className="text-sm mt-4 font-poppins ml-4 text-[#616161]"
    />
  );
};

export default MultiSelectAssignee;