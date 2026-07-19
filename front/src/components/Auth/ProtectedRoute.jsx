import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const employeeData =
    localStorage.getItem("employee");

  if (!token || !employeeData) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const employee = JSON.parse(employeeData);

    if (employee.role !== "administrator") {
      return (
        <Navigate
          to="/unauthorized"
          replace
        />
      );
    }

    return children;
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("employee");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }
}

export default ProtectedRoute;