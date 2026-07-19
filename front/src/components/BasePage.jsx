import React from "react";
import "./Layout/MainDash/MainDash.css";

const BasePage = ({ title, children }) => {
  return (
    <section className="MainDash">
      {title && <h1>{title}</h1>}
      {children}
    </section>
  );
};

export default BasePage;