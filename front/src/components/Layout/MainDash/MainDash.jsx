import React from "react";
import "./MainDash.css";

const MainDash = ({ children }) => {
  return (
    <div className="MainDash">
      {children}
    </div>
  );
};

export default MainDash;