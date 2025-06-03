import { Routes, Route, useNavigate } from "react-router-dom";
import { HomeIcon, UserGroupIcon, UserIcon, KeyIcon, BriefcaseIcon, ClipboardDocumentListIcon, InformationCircleIcon, ArrowTrendingUpIcon, ListBulletIcon, ClipboardDocumentIcon, FolderIcon, CalendarDaysIcon, DocumentChartBarIcon, FlagIcon, PencilSquareIcon, ReceiptPercentIcon, IdentificationIcon, PresentationChartBarIcon, StarIcon, FireIcon, FingerPrintIcon, CheckCircleIcon, ClockIcon, FunnelIcon, AdjustmentsHorizontalIcon, DocumentCheckIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import {
  Sidenav,
  DashboardNavbar,
  Configurator,
  Footer,
} from "@/widgets/layout";
import routes from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { decryptPayload } from "@/services/codec/codec";
import { Home, UserManagement, GroupManagement, Projects, Status, Assignment, TaskList } from "@/pages/dashboard";
import { ProjectAssignment } from "@/pages/dashboard/project-assignment";
import { AssignmentTimeFrame } from "@/pages/dashboard/assignment-time-frame";
import { ProjectTimeFrame } from "@/pages/dashboard/project-time-frame";
import { RewriteTask } from "@/pages/dashboard/rewrite-task";
import { PurchaseOrder } from "@/pages/dashboard/purchase-order";
import { CustomerManagement } from "@/pages/dashboard/customer-management";
import { CustomerProject } from "@/pages/dashboard/customer-project";
import { ActivityLog } from "@/pages/dashboard/activity-log";
import { UserTask } from "@/pages/dashboard/user-task";
import { TodayActivity } from "@/pages/dashboard/today-activity";
// import { Parameter } from "@/pages/dashboard/parameter";
import { DocumentTemplate } from "@/pages/dashboard/document-template";
import { EditProfile} from "@/pages/dashboard/edit-profile";
import { AiOutlineProfile } from "react-icons/ai";

const icon = {
  className: "w-4 h-4 text-inherit",
};
const componentList = {
  "home": <Home />,
  "group-management": <GroupManagement />,
  "user-management": <UserManagement />,
  "project-list": <Projects />,
  "status-management": <Status />,
  "project-assignment": <ProjectAssignment />,
  "project-task": <TaskList />,
  "assignment": <Assignment />, 
  "assign-time-frame": <AssignmentTimeFrame />,
  "project-time-frame": <ProjectTimeFrame />,
  "rewrite-task": <RewriteTask />,
  "purchase-order": <PurchaseOrder />,
  "customer-management": <CustomerManagement />,
  "customer-project": <CustomerProject />,
  "activity-log": <ActivityLog />,
  "user-task": <UserTask />,
  "today-activity": <TodayActivity />,
  // "parameter": < Parameter/>,
  "document-template": < DocumentTemplate />,
  "edit-profile": <EditProfile />,
};

const iconList = {
  "home": <HomeIcon {...icon} />,
  "setting": <KeyIcon {...icon} />,
  "master-data": <ClipboardDocumentListIcon {...icon} />,
  "group-management": <UserGroupIcon {...icon} />,
  "user-management": <UserIcon {...icon} />,
  "project-list": <BriefcaseIcon {...icon} />,
  "status-management": <InformationCircleIcon {...icon} />,
  "project-assignment": <ArrowTrendingUpIcon {...icon} />,
  "project": <FolderIcon {...icon} />,
  "project-task": <ListBulletIcon {...icon} />,
  "assignment": <ClipboardDocumentIcon {...icon} />,
  "report": <DocumentChartBarIcon {...icon} />,
  "assign-time-frame": <FlagIcon {...icon} />,
  "project-time-frame": <CalendarDaysIcon {...icon} />,
  "rewrite-task": <PencilSquareIcon {...icon} />,
  "purchase-order": <ReceiptPercentIcon {...icon} />,
  "customer-management": <IdentificationIcon {...icon} />,
  "customer-project": <PresentationChartBarIcon {...icon} />,
  "user-task": <CheckCircleIcon {...icon} />,
  "today-activity": <ClockIcon {...icon} />,
  // "parameter": <AdjustmentsHorizontalIcon {...icon} />,
  "document-template": <DocumentCheckIcon {...icon} />,
};

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false); // track sidenav minimize state
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("TOKEN");
    const menuListCookies = Cookies.get("MENU_LIST");
    if (!token) {
      navigate("/auth/login");
    }
    if (token && menuListCookies) {
      const menuList = JSON.parse(decryptPayload(menuListCookies));

      const pages = menuList
        .map((menu) => {
          if (menu.url === "activity-log" || menu.url === "edit-profile") {
            return null;
          }

          const newMenu = {
            icon: iconList[menu.url] || <HomeIcon {...icon} />,
            name: `${menu.name}`,
            path: `/${menu.url}`,
            element: componentList[menu.url],
            ...menu,
          };

          if (newMenu.child) {
            newMenu.child = newMenu.child.map((e) => ({
              ...e,
              icon: iconList[e.url] || <HomeIcon {...icon} />,
            }));
          }

          return newMenu;
        })
        .filter(Boolean);

      setRoutes([{ layout: "dashboard", pages }]);
    }

    setIsLoading(false);
  }, []);

  // Function to handle sidenav toggle state
  const handleSidenavToggle = (isMinimized) => {
    setIsMinimized(isMinimized);
  };

  return isLoading ? (
    <></>
  ) : (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav
        routes={routes}
        brandImg={sidenavType === "blue" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"}
        onSidenavToggle={handleSidenavToggle} // passing function to Sidenav
        isMinimized={isMinimized} // pass down the state to Sidenav
      />
      <div className={`p-4 ${isMinimized ? "xl:ml-28" : "xl:ml-80"} transition-all duration-500`}>
        <DashboardNavbar />
        <Configurator />
        <Routes>
          {routes.map(({ layout, pages }) =>
            layout === "dashboard" &&
            pages.map((data) => {
              const { path, element, child } = data;
              const allRoutes = [];
              allRoutes.push(
                <Route key={path} exact path={path} element={element} />
              );
              if (child) {
                child.forEach((childRoute) => {
                  const { url } = childRoute;
                  allRoutes.push(
                    <Route
                      key={url}
                      exact
                      path={`/${url}`}
                      element={componentList[url]}
                    />
                  );
                });
              }
              return allRoutes;
            })
          )}
          <Route path="/activity-log" element={<ActivityLog />} /> {/* Keep this route */}
          <Route path="/edit-profile" element={<EditProfile />} /> {/* Keep this route */}
        </Routes>
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;
