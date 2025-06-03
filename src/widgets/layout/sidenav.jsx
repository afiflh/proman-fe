import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  Avatar,
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import ProMan from "@/assets/pro-man.svg";
import React, { useState, useEffect } from "react";

export function Sidenav({ brandImg, brandName, routes, onSidenavToggle }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [openMenu, setOpenMenu] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleSidenav = () => {
    setIsMinimized(!isMinimized);
  };

  useEffect(() => {
    onSidenavToggle(isMinimized);
  }, [isMinimized]);

  const toggleMenu = (name, hasChild) => {
    if (hasChild) {
      setOpenMenu(openMenu === name ? null : name);
    } else {
      setOpenMenu(null);
    }
  };

  const sidenavTypes = {
    blue: "bg-gradient-to-br from-blue-900 to-blue-800",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${isMinimized ? 'w-20' : 'w-72'} ${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-gray-100 overflow-y-auto`}
    >
    <div className="relative">
      <Link to="/dashboard/home" className="py-6 px-8 text-center">
        <div className="flex justify-center items-center mt-4">
          <img className={`${isMinimized ? 'w-8' : 'w-48'}`} src={ProMan} alt={brandName} />
        </div>
      </Link>
      <IconButton
        variant="text"
        color="black"
        size="sm"
        ripple={false}
        className="absolute left-0 top-0 grid rounded-br-none rounded-tl-none"
        onClick={toggleSidenav}
      >
        <div className="flex items-center justify-center w-4 h-4 rounded-full border border-blue-200 text-white bg-blue-500">
          {isMinimized ? (
            <ChevronRightIcon className="h-3 w-3" />
          ) : (
            <ChevronLeftIcon className="h-3 w-3" />
          )}
        </div>
      </IconButton>
      {!isMinimized && (
        <Typography
          variant="h6"
          color={sidenavType === "blue" ? "white" : "blue-gray"}
        >
          {brandName}
        </Typography>
      )}
    </div>
      <div className="m-4">
        {routes.map(({ layout, title, pages }, index) => (
          <ul key={index} className="mb-4 flex flex-col gap-1">
            {title && !isMinimized && (
              <li className="mx-3.5 mt-4 mb-2">
                <Typography
                  variant="small"
                  color={sidenavType === "blue" ? "white" : "blue-gray"}
                  className="font-black uppercase opacity-75"
                >
                  {title}
                </Typography>
              </li>
            )}
            {pages.map((data) => {
              const { icon, name, path, child } = data;
              const hasChild = child && child.length > 0; // Check if the menu has child items
              return (
                <React.Fragment key={name}>
                  <SideElement
                    name={name}
                    layout={layout}
                    path={path}
                    icon={icon}
                    onClick={() => toggleMenu(name, hasChild)} // Pass hasChild flag
                    isParent={hasChild}
                    isOpen={openMenu === name}
                    isMinimized={isMinimized}
                  />
                  {openMenu === name && hasChild &&
                    child.map((childData) => {
                      const { name, url, icon } = childData;
                      return (
                        <SideElement
                          key={name}
                          name={name}
                          layout={layout}
                          path={`/${url}`}
                          icon={icon}
                          className={isMinimized ? 'ml-0' : 'ml-8'}
                          isMinimized={isMinimized}
                        />
                      );
                    })}
                </React.Fragment>
              );
            })}
          </ul>
        ))}
      </div>
    </aside>
  );
}

export const SideElement = ({ name, layout, path, icon, onClick, className, isParent, isOpen, isMinimized }) => {
  const [controller] = useMaterialTailwindController();
  const { sidenavColor, sidenavType } = controller;
  if (isParent) {
    return (
      <li key={name} className={className} onClick={onClick}>
        <Button
          variant="text"
          color={sidenavType === "blue" ? "white" : "blue-gray"}
          className="flex items-center justify-between gap-4 px-4 capitalize"
          fullWidth
        >
          <div className="flex items-center gap-4">
            {icon}
            {!isMinimized && (
              <Typography
                color="inherit"
                className="font-medium capitalize font-poppins text-[13.5px]"
              >
                {name}
              </Typography>
            )}
          </div>
          {!isMinimized && (
            isOpen ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )
          )}
        </Button>
      </li>
    );
  }

  return (
    <li key={name} className={className}>
      <NavLink to={`/${layout}${path}`} onClick={onClick}>
        {({ isActive }) => (
          <Button
            variant={isActive ? "gradient" : "text"}
            color={
              isActive
                ? sidenavColor
                : sidenavType === "blue"
                ? "white"
                : "blue-gray"
            }
            className={`flex items-center justify-between gap-4 px-4 capitalize ${isMinimized ? 'py-2' : 'py-3'}`}
            fullWidth
          >
            <div className="flex items-center gap-4">
              {icon}
              {!isMinimized && (
                <Typography
                  color="inherit"
                  className="font-medium capitalize font-poppins text-[13.5px]"
                >
                  {name}
                </Typography>
              )}
            </div>
            {!isMinimized && isParent && (
              isOpen ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )
            )}
          </Button>
        )}
      </NavLink>
    </li>
  );
};

Sidenav.defaultProps = {
  brandImg: ProMan,
  brandName: "",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSidenavToggle: PropTypes.func.isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;