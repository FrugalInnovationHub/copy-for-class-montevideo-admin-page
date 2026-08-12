import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./stylesheets/index.css";
import LandingPage from "./pages/LandingPage";
import ActiveMaterials from "./pages/active_materials";
import UsersPage from "./pages/UsersPage";
import ClientsPage from "./pages/ClientsPage";
import StatisticReports from "./pages/StatisticReports";
import EvidencePage from "./pages/EvidencePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/clients",
    element: <ClientsPage />,
  },
  {
    path: "/users",
    element: <UsersPage />,
  },
  {
    path: "/statistic-reports",
    element: <StatisticReports />,
  },
  {
    path: "/evidence",
    element: <EvidencePage />,
  },
  {
    path: "/materials",
    element: <ActiveMaterials />,
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
