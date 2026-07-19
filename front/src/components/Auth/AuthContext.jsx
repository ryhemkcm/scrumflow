import React, { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check if user data is stored in localStorage
        const userRole = localStorage.getItem("role");
        const userId = localStorage.getItem("userId");
        if (userRole && userId) {
        setUser({
            id: userId,
            role: userRole,
        });
        }
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("role", userData.role);
        localStorage.setItem("userId", userData.id);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
        {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
