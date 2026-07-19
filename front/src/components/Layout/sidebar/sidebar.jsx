import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UilBars,
  UilEstate,
  UilSignOutAlt,
  UilUsersAlt,
  UilUserSquare,
} from "@iconscout/react-unicons";

import "./Sidebar.css";

const sidebarItems = [
  {
    heading: "Accueil",
    path: "/home",
    IconComponent: UilEstate,
  },
  {
    heading: "Employés",
    path: "/employee",
    IconComponent: UilUsersAlt,
  },
  {
    heading: "Équipes",
    path: "/team",
    IconComponent: UilUserSquare,
  },
];

const Sidebar = () => {
  const [expanded, setExpanded] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);

    if (window.innerWidth <= 768) {
      setExpanded(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employee");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("role");

    navigate("/login", {
      replace: true,
    });
  };

  const sidebarVariants = {
    open: {
      left: "0",
    },
    closed: {
      left: "-60%",
    },
  };

  return (
    <>
      <button
        type="button"
        className="bars"
        onClick={() =>
          setExpanded((previousValue) => !previousValue)
        }
        aria-label={
          expanded
            ? "Fermer le menu"
            : "Ouvrir le menu"
        }
      >
        <UilBars />
      </button>

      <motion.aside
        className="sidebar"
        variants={sidebarVariants}
        animate={
          window.innerWidth <= 768
            ? expanded
              ? "open"
              : "closed"
            : "open"
        }
        data-expanded={expanded}
      >
        <nav className="menu">
          {sidebarItems.map((item) => {
            const Icon = item.IconComponent;

            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(
                `${item.path}/`
              );

            return (
              <button
                type="button"
                key={item.path}
                className={`menuItem ${
                  isActive ? "active" : ""
                }`}
                onClick={() =>
                  handleNavigation(item.path)
                }
              >
                <Icon className="sidebar-icon" />

                {expanded && (
                  <span>{item.heading}</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            className="menuItem"
            onClick={handleSignOut}
          >
            <UilSignOutAlt className="sidebar-icon" />

            {expanded && (
              <span>Déconnexion</span>
            )}
          </button>
        </nav>
      </motion.aside>
    </>
  );
};

export default Sidebar;