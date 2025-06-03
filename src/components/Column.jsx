import React from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { CalendarIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
import { getInitial } from "@/utils/helper";
import { letterColors, outerLetterColors, getColorForInitial } from "@/utils/colors";

const getStatusOutlineStyle = (statusMode) => {
  const styles = {
    "0": { boxShadow: '0 0 0 1px #f17171', backgroundColor: 'white', color: '#f17171' },
    "1": { boxShadow: '0 0 0 1px #f4c542', backgroundColor: 'white', color: '#f4c542' },
    "2": { boxShadow: '0 0 0 1px #67b173', backgroundColor: 'white', color: '#67b173' },
    "3": { boxShadow: '0 0 0 1px #5a5a5a', backgroundColor: 'white', color: '#5a5a5a' },
    default: { boxShadow: '0 0 0 1px #383d41', backgroundColor: 'white', color: '#383d41' },
  };

  return styles[statusMode] || styles.default;
};

const getStatusBadgeStyle = (statusMode) => {
  const baseStyle = {
    borderRadius: '5px',
    padding: '4px 8px',
    display: 'inline-block',
    marginRight: '4px',
  };

  const styles = {
    "HIGH": { backgroundColor: 'rgba(248, 215, 218, 0.3)', color: '#f17171' },
    "MEDIUM": { backgroundColor: 'rgba(255, 255, 204, 0.3)', color: '#f4c542' },
    "LOW": { backgroundColor: 'rgba(212, 237, 218, 0.3)', color: '#67b173' },
    default: { backgroundColor: 'rgba(226, 227, 229, 0.3)', color: '#383d41' },
  };

  return { ...baseStyle, ...styles[statusMode] || styles.default };
};

const Column = ({ id, itemsOrder, ITEMS, onTaskDoubleClick }) => {
  return (
    <Droppable droppableId={id} type="TASK">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex flex-col w-full min-h-60 h-fit"
        >
          {itemsOrder && itemsOrder.length > 0 ? (
            itemsOrder.map((itemId, index) => {
              const item = ITEMS[itemId];
              if (!item) {
                console.error(`Item with id ${itemId} not found`);
                return null;
              }

              const initial = getInitial(item.username);
              const backgroundColor = getColorForInitial(initial, outerLetterColors);
              const color = getColorForInitial(initial, letterColors);

              return (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="border-b rounded-sm flex flex-col my-2.5 mx-3 bg-white"
                      style={{
                        ...getStatusOutlineStyle(item.status_mode || "default"),
                        ...provided.draggableProps.style,
                      }}
                      onDoubleClick={() => onTaskDoubleClick(item)}
                    >
                      <p className="text-[11px] font-poppins py-1 px-2 text-blue-gray-800 font-semibold">
                        {item.title}
                      </p>
                      <p className="text-[11px] font-poppins py-1 px-2 text-blue-gray-800 font-semibold">
                        {item.severity}
                      </p>
                      <p className="text-[11px] font-poppins py-1 px-2 text-blue-gray-700 flex items-center">
                        <InformationCircleIcon className="w-4 h-4 mr-2" style={{ color: getStatusBadgeStyle(item.severity).color }} />
                        <span style={getStatusBadgeStyle(item.severity)}>
                          {item.severity}
                        </span>
                      </p>
                      <div className="flex items-center py-1 px-2">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center mr-2"
                          style={{ backgroundColor: backgroundColor }}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: color }}
                          >
                            <span className="text-[7px] font-semibold text-white">
                              {initial}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] font-poppins text-blue-gray-800">
                          {item.username}
                        </p>
                      </div>
                      <p className="text-[11px] font-poppins py-1 px-2 text-blue-gray-800 flex items-center">
                        <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                        {item.dueDate}
                      </p>
                    </div>
                  )}
                </Draggable>
              );
            })
          ) : (
            <p className="text-center text-blue-gray-500 font-poppins p-4 text-sm">No tasks</p>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default Column;
