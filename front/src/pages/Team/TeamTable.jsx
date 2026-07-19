import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import "./Team.css";

const API_URL = "http://localhost:3001/api";

const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};
const TeamTable = () => {
    const [teams, setTeams] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentTeam, setCurrentTeam] = useState(null);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const [formData, setFormData] = useState({
        team_name: "",
        product_owner: "",
        scrum_master: "",
        developers: [],
    });

    const showSnackbar = (message, severity = "success") => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar((previousState) => ({
            ...previousState,
            open: false,
        }));
    };

    const fetchTeams = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/teams`,
            getAuthConfig()
        );

        setTeams(
            Array.isArray(response.data)
                ? response.data
                : []
        );
    } catch (error) {
        console.error(
            "Erreur lors du chargement des équipes :",
            error.response?.data || error.message
        );

        setTeams([]);

        showSnackbar(
            error.response?.data?.message ||
                "Erreur lors du chargement des équipes",
            "error"
        );
    }
};

    const fetchEmployees = async () => {
    try {
        const response = await axios.get(
            `${API_URL}/employees`,
            getAuthConfig()
        );

        console.log(
            "Liste des employés :",
            response.data
        );

        setEmployees(
            Array.isArray(response.data)
                ? response.data
                : []
        );
    } catch (error) {
        console.error(
            "Erreur lors du chargement des employés :",
            error.response?.data || error.message
        );

        setEmployees([]);

        showSnackbar(
            error.response?.data?.message ||
                "Erreur lors du chargement des employés",
            "error"
        );
    }
};

    const loadData = async () => {
        setLoading(true);

        try {
            await Promise.all([fetchTeams(), fetchEmployees()]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previousState) => ({
            ...previousState,
            [name]: value,
        }));
    };

    const handleMultiSelectChange = (event) => {
        const { value } = event.target;

        setFormData((previousState) => ({
            ...previousState,
            developers: Array.isArray(value) ? value : [],
        }));
    };

    const parseDevelopers = (developers) => {
        if (!developers) {
            return [];
        }

        if (Array.isArray(developers)) {
            return developers
                .map((developer) => {
                    if (typeof developer === "object" && developer !== null) {
                        return Number(developer.id);
                    }

                    return Number(developer);
                })
                .filter((id) => Number.isInteger(id));
        }

        if (typeof developers === "string") {
            return developers
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => Number.isInteger(id));
        }

        return [];
    };

    const handleOpenDialog = (team = null) => {
        setCurrentTeam(team);

        if (team) {
            setFormData({
                team_name: team.name || team.team_name || "",
                product_owner: team.product_owner
                    ? String(team.product_owner)
                    : "",
                scrum_master: team.scrum_master
                    ? String(team.scrum_master)
                    : "",
                developers: parseDevelopers(team.developers),
            });
        } else {
            setFormData({
                team_name: "",
                product_owner: "",
                scrum_master: "",
                developers: [],
            });
        }

        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentTeam(null);

        setFormData({
            team_name: "",
            product_owner: "",
            scrum_master: "",
            developers: [],
        });
    };

    const validateForm = () => {
        if (!formData.team_name.trim()) {
            showSnackbar("Le nom de l'équipe est obligatoire", "error");
            return false;
        }

        if (!formData.product_owner) {
            showSnackbar("Le Product Owner est obligatoire", "error");
            return false;
        }

        if (!formData.scrum_master) {
            showSnackbar("Le Scrum Master est obligatoire", "error");
            return false;
        }

        if (formData.developers.length === 0) {
            showSnackbar(
                "Sélectionnez au moins un membre pour l'équipe",
                "error"
            );
            return false;
        }

        if (formData.product_owner === formData.scrum_master) {
            showSnackbar(
                "Le Product Owner et le Scrum Master doivent être différents",
                "error"
            );
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    const payload = {
        name: formData.team_name.trim(),
        product_owner: Number(formData.product_owner),
        scrum_master: Number(formData.scrum_master),
        developers: formData.developers.map(
            (developerId) => Number(developerId)
        ),
    };

    try {
        if (currentTeam) {
            await axios.put(
                `${API_URL}/teams/${currentTeam.id}`,
                payload,
                getAuthConfig()
            );

            showSnackbar(
                "Équipe modifiée avec succès",
                "success"
            );
        } else {
            await axios.post(
                `${API_URL}/teams`,
                payload,
                getAuthConfig()
            );

            showSnackbar(
                "Équipe créée avec succès",
                "success"
            );
        }

        await fetchTeams();
        handleCloseDialog();
    } catch (error) {
        console.error(
            "Erreur lors de l'enregistrement de l'équipe :",
            error.response?.data || error.message
        );

        showSnackbar(
            error.response?.data?.message ||
                "Erreur lors de l'enregistrement de l'équipe",
            "error"
        );
    }
};

    const handleDelete = async (teamId) => {
    const confirmed = window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette équipe ?"
    );

    if (!confirmed) {
        return;
    }

    try {
        await axios.delete(
            `${API_URL}/teams/${teamId}`,
            getAuthConfig()
        );

        showSnackbar(
            "Équipe supprimée avec succès",
            "success"
        );

        await fetchTeams();
    } catch (error) {
        console.error(
            "Erreur lors de la suppression de l'équipe :",
            error.response?.data || error.message
        );

        showSnackbar(
            error.response?.data?.message ||
                "Erreur lors de la suppression de l'équipe",
            "error"
        );
    }
};

    const getEmployeeById = (employeeId) => {
        return employees.find(
            (employee) => Number(employee.id) === Number(employeeId)
        );
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "Developer":
                return "primary";
            case "Tester":
                return "secondary";
            case "Designer":
                return "success";
            case "Product Owner":
                return "warning";
            case "Scrum Master":
                return "error";
            case "Administrator":
                return "info";
            default:
                return "default";
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 4,
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="TeamContainer">
            <div className="TeamGlass">
                <Button
                    variant="contained"
                    className="sidebar-green-bg"
                    onClick={() => handleOpenDialog()}
                    sx={{ marginBottom: 2 }}
                >
                    Créer une équipe
                </Button>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Nom de l'équipe</TableCell>
                                <TableCell>Product Owner</TableCell>
                                <TableCell>Scrum Master</TableCell>
                                <TableCell>Membres</TableCell>
                                <TableCell>Rôles</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {teams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography>
                                            Aucune équipe trouvée.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                teams.map((team) => {
                                    const productOwner = getEmployeeById(
                                        team.product_owner
                                    );

                                    const scrumMaster = getEmployeeById(
                                        team.scrum_master
                                    );

                                    const developerIds = parseDevelopers(
                                        team.developers
                                    );

                                    const members = developerIds
                                        .map((developerId) =>
                                            getEmployeeById(developerId)
                                        )
                                        .filter(Boolean);

                                    const memberRoles = [
                                        ...new Set(
                                            members
                                                .map((member) => member.role)
                                                .filter(Boolean)
                                        ),
                                    ];

                                    return (
                                        <TableRow key={team.id}>
                                            <TableCell>{team.id}</TableCell>

                                            <TableCell>
                                                {team.name || team.team_name || "-"}
                                            </TableCell>

                                            <TableCell>
                                                {productOwner ? (
                                                    <Chip
                                                        label={productOwner.name}
                                                        color={getRoleColor(productOwner.role)}
                                                    />
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {scrumMaster ? (
                                                    <Chip
                                                        label={scrumMaster.name}
                                                        color={getRoleColor(scrumMaster.role)}
                                                    />
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {members.length > 0 ? (
                                                    members.map((member) => (
                                                        <Box
                                                            key={member.id}
                                                            sx={{ marginBottom: 0.5 }}
                                                        >
                                                            <Chip
                                                                label={`${member.name}${member.specialty
                                                                        ? ` (${member.specialty})`
                                                                        : ""
                                                                    }`}
                                                                color={getRoleColor(member.role)}
                                                                variant="outlined"
                                                            />
                                                        </Box>
                                                    ))
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {memberRoles.length > 0 ? (
                                                    memberRoles.map((role) => (
                                                        <Chip
                                                            key={role}
                                                            label={role}
                                                            color={getRoleColor(role)}
                                                            sx={{ margin: 0.5 }}
                                                        />
                                                    ))
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 1,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <Button
                                                        variant="outlined"
                                                        onClick={() =>
                                                            handleOpenDialog(team)
                                                        }
                                                        sx={{
                                                            color: "#4caf50",
                                                            borderColor: "#4caf50",
                                                            "&:hover": {
                                                                backgroundColor:
                                                                    "rgba(76, 175, 80, 0.08)",
                                                                borderColor: "#388e3c",
                                                            },
                                                        }}
                                                    >
                                                        Modifier
                                                    </Button>

                                                    <Button
                                                        variant="outlined"
                                                        onClick={() =>
                                                            handleDelete(team.id)
                                                        }
                                                        sx={{
                                                            color: "#ff9800",
                                                            borderColor: "#ff9800",
                                                            "&:hover": {
                                                                backgroundColor:
                                                                    "rgba(255, 152, 0, 0.08)",
                                                                borderColor: "#f57c00",
                                                            },
                                                        }}
                                                    >
                                                        Supprimer
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>

            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {currentTeam
                        ? "Modifier l'équipe"
                        : "Créer une nouvelle équipe"}
                </DialogTitle>

                <DialogContent>
                    <TextField
                        label="Nom de l'équipe"
                        name="team_name"
                        value={formData.team_name}
                        onChange={handleInputChange}
                        fullWidth
                        margin="normal"
                        required
                    />

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="product-owner-label">
                            Product Owner
                        </InputLabel>

                        <Select
                            labelId="product-owner-label"
                            name="product_owner"
                            value={formData.product_owner}
                            onChange={handleInputChange}
                            label="Product Owner"
                        >
                            {employees
                                .filter(
                                    (employee) =>
                                        employee.role === "Product Owner"
                                )
                                .map((employee) => (
                                    <MenuItem
                                        key={employee.id}
                                        value={String(employee.id)}
                                    >
                                        {employee.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="scrum-master-label">
                            Scrum Master
                        </InputLabel>

                        <Select
                            labelId="scrum-master-label"
                            name="scrum_master"
                            value={formData.scrum_master}
                            onChange={handleInputChange}
                            label="Scrum Master"
                        >
                            {employees
                                .filter(
                                    (employee) =>
                                        employee.role === "Scrum Master"
                                )
                                .map((employee) => (
                                    <MenuItem
                                        key={employee.id}
                                        value={String(employee.id)}
                                    >
                                        {employee.name}
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" required>
                        <InputLabel id="team-members-label">
                            Membres de l'équipe
                        </InputLabel>

                        <Select
                            labelId="team-members-label"
                            multiple
                            name="developers"
                            value={formData.developers}
                            onChange={handleMultiSelectChange}
                            label="Membres de l'équipe"
                            renderValue={(selected) =>
                                selected
                                    .map((employeeId) => {
                                        const employee =
                                            getEmployeeById(employeeId);

                                        return employee
                                            ? `${employee.name} (${employee.role})`
                                            : "";
                                    })
                                    .filter(Boolean)
                                    .join(", ")
                            }
                        >
                            {employees
                                .filter((employee) =>
                                    ["Developer", "Tester", "Designer"].includes(
                                        employee.role
                                    )
                                )
                                .map((employee) => (
                                    <MenuItem
                                        key={employee.id}
                                        value={Number(employee.id)}
                                    >
                                        {employee.name} ({employee.role})
                                    </MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog}>
                        Annuler
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                    >
                        {currentTeam ? "Mettre à jour" : "Créer"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default TeamTable;