import React from "react";
import "./EmployeeDetailModal.css";

const EmployeeDetailModal = ({ title, content = [], onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {content.length > 0 ? (
            <ul>
              {content.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Aucun élément trouvé.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;