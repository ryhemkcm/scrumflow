import React, { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Typography,
    Avatar,
    Box,
} from "@mui/material";
import axios from "axios";
import "./Employee.css";

const montserratFont = {
    fontFamily: "'Montserrat Alternates', sans-serif",
};

const getRoleColor = (role) => {
    const colors = {
        administrator: "#7F9BB7",
        developer: "#A5B68D",
        tester: "#E0BBE4",
        designer: "#FFC7B2",
        "product owner": "#8FB4DA",
        "scrum master": "#C4CBA3",
    };

    return colors[role?.toLowerCase()] || "#A0A0A0";
};

const Employee = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEmployees = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:3001/api/employees",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setEmployees(response.data);
        } catch (err) {
            console.error(err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Erreur lors du chargement des employés."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                    ...montserratFont,
                }}
            >
                <CircularProgress />

                <Typography sx={{ ml: 2 }}>
                    Chargement des employés...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                }}
            >
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ width: "100%" }}>
            <Typography
                variant="h4"
                sx={{
                    mb: 3,
                    fontWeight: 700,
                    ...montserratFont,
                }}
            >
                Liste des employés
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Photo</TableCell>
                            <TableCell>Nom</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Rôle</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    Aucun employé trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee.id}>
                                    <TableCell>
                                        <Avatar>
                                            {employee.name?.charAt(0)?.toUpperCase()}
                                        </Avatar>
                                    </TableCell>

                                    <TableCell>
                                        {employee.name}

                                        <Typography variant="body2" color="text.secondary">
                                            ID : {employee.id}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>{employee.email}</TableCell>

                                    <TableCell>
                                        <Box
                                            component="span"
                                            sx={{
                                                padding: "4px 8px",
                                                borderRadius: "6px",
                                                backgroundColor: getRoleColor(employee.role),
                                                color: "white",
                                                display: "inline-block",
                                            }}
                                        >
                                            {employee.role}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Employee;