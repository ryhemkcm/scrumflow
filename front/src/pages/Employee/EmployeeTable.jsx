
const getRoleColor = (role) => {
    const colors = {
        'Administrator': '#7F9BB7', // Bleu pastel
        'Developer': '#A5B68D',     // Vert pastel
        'Tester': '#E0BBE4',       // Violet pastel
        'Designer': '#FFC7B2',     // Orange pastel
        'Product Owner': '#8FB4DA', // Bleu clair
        'Scrum Master': '#C4CBA3'   // Vert clair
    };
    return colors[role] || '#F0F2F5'; // Couleur par défaut
};
const getTeamColor = (teamName) => {
    console.log('Team name:', teamName);
    const colors = {

    };
    return colors[teamName] || '#E3DFFD';
};



const getSpecialtyColor = (specialty) => {
    const colors = {
        'Frontend': '#ADD8E6',
        'Backend': '#FFB6C1',
        'Fullstack': '#C3B1E1'
    };
    return colors[specialty] || '#D3D3D3';
};

import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Button, Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, MenuItem, Snackbar, Alert, IconButton,
    Avatar, Box, CircularProgress
} from '@mui/material';
import {
    AddPhotoAlternate,
    Edit,
    Delete
} from '@mui/icons-material';
import axios from 'axios';
import "./Employee.css";

const pastelColors = {
    primary: '#A5B68D', // Vert pastel (comme Developer dans Employee)
    primaryHover: '#8F9E84',
    secondary: '#D4E2F0', // Bleu clair (comme le header de table dans Employee)
    secondaryHover: '#BFD7EA',
    delete: '#E0BBE4',
    deleteHover: '#9A7A88',
    addEmployeeButton: '#FCC8D1',
    addEmployeeButtonHover: '#FFD1D1',
    text: '#3A4B5C', // Couleur de texte principale
    lightText: '#778899', // Texte secondaire
    headingText: '#5B7A92', // Couleur des titres
    background: '#F0F2F5',
    paper: '#FFFFFF',
    border: '#BFD7EA', // Bordure bleu clair
};

const roles = [
    { value: 'Administrator', label: 'Administrator' },
    { value: 'Developer', label: 'Developer' },
    { value: 'Tester', label: 'Tester' },
    { value: 'Designer', label: 'Designer' },
    { value: 'Product Owner', label: 'Product Owner' },
    { value: 'Scrum Master', label: 'Scrum Master' }
];

const specialties = [
    { value: 'Frontend', label: 'Frontend' },
    { value: 'Backend', label: 'Backend' },
    { value: 'Fullstack', label: 'Fullstack' }
];

const montserratFont = {
    fontFamily: "'Montserrat Alternates', sans-serif",
};

const EmployeeTable = () => {
    // States
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Developer',
        specialty: '',
        team_id: '',
        image_url: ''
    });
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);


    // --- Effects ---
    useEffect(() => {
        fetchEmployees();
        fetchTeams();
    }, []);

    // --- Data Fetching Functions ---
    const fetchEmployees = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:3001/api/employees', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            setEmployees(response.data);
        } catch (error) {
            showSnackbar('Erreur lors du chargement des employés', 'error');
            console.error('Error loading employees:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const fetchTeams = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/teams');
            setTeams(response.data);
        } catch (error) {
            showSnackbar('Erreur lors du chargement des équipes', 'error');
            console.error('Error loading teams:', error);
        }
    };


    const resetPassword = async (employeeId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet employé ? Un nouveau mot de passe temporaire sera généré et affiché.')) {
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post(`http://localhost:3001/api/employees/${employeeId}/reset-password`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            showSnackbar(`Mot de passe réinitialisé. Nouveau mot de passe temporaire: ${response.data.newPassword}`, 'info');
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error.response?.data || error.message);
            showSnackbar(error.response?.data?.message || 'Erreur lors de la réinitialisation du mot de passe', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Snackbar Handlers ---
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // --- Form Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreviewImage(formData.image_url || null); // Revert to current image_url if no file selected
        }
    };

    // --- Dialog Handlers ---
    const handleOpenDialog = (employee = null) => {
        if (employee) {
            setFormData({
                name: employee.name || '',
                email: employee.email || '',
                role: employee.role || 'Developer',
                specialty: employee.specialty || '',
                team_id: employee.team_id || '',
                // password: '', // Password field should generally be empty for editing
                image_url: employee.image_url || ''
            });
            setEditingEmployeeId(employee.id);
            setPreviewImage(
                employee.image_url
                    ? `http://localhost:3001${employee.image_url}`
                    : null
            );
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'Developer',
                specialty: '',
                team_id: '',
                // password: '', // Password is not set directly
                image_url: ''
            });
            setPreviewImage(null);
            setEditingEmployeeId(null);
        }
        setSelectedFile(null); // Clear selected file when opening dialog
        // setShowNewPassword(false); // No longer needed
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        // Reset form data and editing state on close
        setFormData({
            name: '', email: '', role: 'Developer', specialty: '', team_id: '', image_url: ''
        });
        setEditingEmployeeId(null);
        setSelectedFile(null);
        setPreviewImage(null);

    };

    // --- Validation Functions ---
    const validateForm = () => {
        if (!formData.name.trim()) {
            showSnackbar('Le nom est requis', 'error');
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            showSnackbar('Veuillez entrer une adresse email valide', 'error');
            return false;
        }

        if (formData.role === 'Developer' && !formData.specialty) {
            showSnackbar('La spécialité est requise pour les développeurs', 'error');
            return false;
        }
        // Removed password validation as it's no longer entered directly by admin
        return true;
    };

    const checkUniqueRolePerTeam = () => {
        // Only applies to Product Owner and Scrum Master roles within a team
        if (!formData.team_id || !['Product Owner', 'Scrum Master'].includes(formData.role)) {
            return true;
        }

        const existing = employees.find(emp =>
            emp.team_id === formData.team_id &&
            emp.role === formData.role &&
            emp.id !== editingEmployeeId // Exclude current employee if editing
        );

        if (existing) {
            showSnackbar(`Il ne peut y avoir qu'un seul ${formData.role} par équipe`, 'error');
            return false;
        }

        return true;
    };

    // --- CRUD Operations ---
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");

            const data = new FormData();

            data.append("name", formData.name);
            data.append("email", formData.email);
            data.append("role", formData.role);
            data.append("specialty", formData.specialty || "");
            data.append("team_id", formData.team_id || "");

            if (!editingEmployeeId) {
                data.append("password", "Employee123!");
            }

            if (selectedFile) {
                data.append("image", selectedFile);
            }

            const url = editingEmployeeId
                ? `http://localhost:3001/api/employees/${editingEmployeeId}`
                : "http://localhost:3001/api/employees";

            const method = editingEmployeeId ? "put" : "post";

            await axios[method](url, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            showSnackbar(
                editingEmployeeId
                    ? "Employé mis à jour avec succès"
                    : "Employé ajouté avec succès"
            );

            await fetchEmployees();
            handleCloseDialog();
        } catch (error) {
            console.error(
                "Erreur pendant l’enregistrement :",
                error.response?.data || error.message
            );

            showSnackbar(
                error.response?.data?.message ||
                "Erreur pendant l’enregistrement",
                "error"
            );
        } finally {
            setIsLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
            return;
        }
        setIsLoading(true);
        try {
            await axios.delete(`http://localhost:3001/api/employees/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            showSnackbar('Employé supprimé avec succès');
            fetchEmployees();
        } catch (error) {
            showSnackbar('Erreur lors de la suppression de l\'employé', 'error');
            console.error('Error deleting employee:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="EmployeeContainer">
            <div className="EmployeeGlass">
                <div className="header employee-header">
                    <h2 sx={{ color: pastelColors.headingText, margin: 0, ...montserratFont, fontWeight: '700' }}>
                        Gestion des employés
                    </h2>
                    <Button
                        variant="contained"
                        onClick={() => handleOpenDialog()}
                        sx={{
                            backgroundColor: '#D4E2F0',
                            color: pastelColors.text,
                            '&:hover': {
                                backgroundColor: '#A2D2DF',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            },
                            boxShadow: 'none',
                            textTransform: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            ...montserratFont,
                            fontWeight: '600',
                        }}
                        startIcon={<AddPhotoAlternate />}
                    >
                        Ajouter un employé
                    </Button>
                </div>

                {isLoading && employees.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress sx={{ color: pastelColors.primary }} />
                    </Box>
                ) : (
                    <TableContainer
                        component={Paper}
                        sx={{
                            width: '100%',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                        }}
                    >
                        <Table>
                            <TableHead sx={{ backgroundColor: pastelColors.secondary }}>
                                <TableRow>
                                    <TableCell sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text }}>Profile</TableCell>
                                    <TableCell sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text }}>Nom et prénom</TableCell>
                                    <TableCell sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text }}>Email</TableCell>
                                    <TableCell sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text }}>Role</TableCell>
                                    <TableCell sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text }}>Specialité</TableCell>
                                    <TableCell sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text }}>Equipes</TableCell>
                                    <TableCell sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {employees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ ...montserratFont, color: pastelColors.lightText }}>Aucun employé trouvé. Ajoutez-en un nouveau !</TableCell>
                                    </TableRow>
                                ) : (
                                    employees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell>
                                                <Avatar
                                                    src={
                                                        employee.image_url
                                                            ? `http://localhost:3001${employee.image_url}`
                                                            : "/default-avatar.png"
                                                    }
                                                    sx={{ width: 40, height: 40, border: `2px solid ${pastelColors.primary}` }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ ...montserratFont, color: pastelColors.text }}>{employee.name}</TableCell>
                                            <TableCell sx={{ ...montserratFont, color: pastelColors.text }}>{employee.email}</TableCell>
                                            <TableCell sx={{ ...montserratFont, color: pastelColors.text }}>
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        backgroundColor: getRoleColor(employee.role),
                                                        borderRadius: '4px',
                                                        padding: '4px 8px',
                                                        display: 'inline-block',
                                                        fontWeight: '600',
                                                        color: '#FFFFFF'
                                                    }}
                                                >
                                                    {employee.role || '-'}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ ...montserratFont, color: pastelColors.text }}>
                                                {employee.role === 'Developer' && employee.specialty ? (
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            backgroundColor: getSpecialtyColor(employee.specialty),
                                                            borderRadius: '4px',
                                                            padding: '4px 8px',
                                                            display: 'inline-block',
                                                            fontWeight: '600',
                                                            color: pastelColors.text
                                                        }}
                                                    >
                                                        {employee.specialty}
                                                    </Box>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {employee.teams && employee.teams.length > 0 ? (
                                                    employee.teams.map((team, index) => (
                                                        <Box
                                                            key={index}
                                                            sx={{
                                                                backgroundColor: getTeamColor(team.team_name),
                                                                borderRadius: '8px',
                                                                padding: '4px 12px',
                                                                marginBottom: '6px',
                                                                color: '#333',

                                                                fontSize: '14px',
                                                                display: 'block',
                                                                width: 'fit-content',
                                                                textAlign: 'center',
                                                                whiteSpace: 'normal',
                                                                wordBreak: 'break-word',
                                                                fontFamily: "'Montserrat Alternates', sans-serif",
                                                                boxShadow: '0 0 5px rgba(0,0,0,0.1)',
                                                            }}
                                                            title={`${team.team_name}`}
                                                        >
                                                            {team.team_name}
                                                        </Box>
                                                    ))
                                                ) : (
                                                    <em>Aucune équipe</em>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <IconButton
                                                    onClick={() => handleOpenDialog(employee)}
                                                    sx={{
                                                        color: pastelColors.primary,
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(170, 185, 154, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    <Edit />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => handleDelete(employee.id)}
                                                    sx={{
                                                        color: pastelColors.delete,
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(251, 180, 165, 0.1)'
                                                        }
                                                    }}
                                                >
                                                    <Delete />
                                                </IconButton>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => resetPassword(employee.id)}
                                                    sx={{
                                                        ml: 1,
                                                        borderColor: pastelColors.secondary,
                                                        color: pastelColors.text,
                                                        '&:hover': {
                                                            borderColor: pastelColors.secondaryHover,
                                                            backgroundColor: pastelColors.secondaryHover,
                                                            color: pastelColors.paper
                                                        },
                                                        ...montserratFont,
                                                        textTransform: 'none'
                                                    }}
                                                >
                                                    Réinitialiser MDP
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </div>

            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
                        backgroundColor: pastelColors.paper,
                    }
                }}
            >
                <DialogTitle sx={{ ...montserratFont, fontWeight: '700', color: pastelColors.text, borderBottom: `1px solid ${pastelColors.border}`, pb: 2 }}>
                    {editingEmployeeId ? 'Modifier employé' : 'Ajouter un nouvel employé'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Avatar
                                src={previewImage || '/default-avatar.png'}
                                sx={{ width: 100, height: 100, border: `3px solid ${pastelColors.primary}` }}
                            />
                        </Box>

                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="upload-photo"
                            type="file"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="upload-photo">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={<AddPhotoAlternate />}
                                fullWidth
                                sx={{
                                    ...montserratFont,
                                    color: pastelColors.primary,
                                    borderColor: pastelColors.primary,
                                    borderRadius: '8px',
                                    '&:hover': {
                                        borderColor: pastelColors.primaryHover,
                                        backgroundColor: 'rgba(170, 185, 154, 0.05)',
                                    },
                                }}
                            >
                                Télécharger une photo
                            </Button>
                        </label>

                        <TextField
                            label="Nom et prénom"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            sx={{
                                '& .MuiInputLabel-root': { color: pastelColors.lightText, ...montserratFont },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: pastelColors.border },
                                    '&:hover fieldset': { borderColor: pastelColors.primary },
                                    '&.Mui-focused fieldset': { borderColor: pastelColors.primary },
                                },
                                '& .MuiInputBase-input': { color: pastelColors.text, ...montserratFont },
                            }}
                        />

                        <TextField
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            sx={{
                                '& .MuiInputLabel-root': { color: pastelColors.lightText, ...montserratFont },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: pastelColors.border },
                                    '&:hover fieldset': { borderColor: pastelColors.primary },
                                    '&.Mui-focused fieldset': { borderColor: pastelColors.primary },
                                },
                                '& .MuiInputBase-input': { color: pastelColors.text, ...montserratFont },
                            }}
                        />

                        <TextField
                            select
                            label="Role"
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            fullWidth
                            required
                            sx={{
                                '& .MuiInputLabel-root': { color: pastelColors.lightText, ...montserratFont },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: pastelColors.border },
                                    '&:hover fieldset': { borderColor: pastelColors.primary },
                                    '&.Mui-focused fieldset': { borderColor: pastelColors.primary },
                                },
                                '& .MuiInputBase-input': { color: pastelColors.text, ...montserratFont },
                            }}
                        >
                            {roles.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        {formData.role === 'Developer' && (
                            <TextField
                                select
                                label="Specialité"
                                name="specialty"
                                value={formData.specialty}
                                onChange={handleInputChange}
                                fullWidth
                                required={formData.role === 'Developer'}
                                sx={{
                                    '& .MuiInputLabel-root': { color: pastelColors.lightText, ...montserratFont },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        '& fieldset': { borderColor: pastelColors.border },
                                        '&:hover fieldset': { borderColor: pastelColors.primary },
                                        '&.Mui-focused fieldset': { borderColor: pastelColors.primary },
                                    },
                                    '& .MuiInputBase-input': { color: pastelColors.text, ...montserratFont },
                                }}
                            >
                                {specialties.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}


                    </Box>
                </DialogContent>
                <DialogActions sx={{ borderTop: `1px solid ${pastelColors.border}`, pt: 2, justifyContent: 'space-between', px: 3, pb: 3 }}>
                    <Button
                        onClick={handleCloseDialog}
                        sx={{
                            ...montserratFont,
                            color: pastelColors.text,
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                            textTransform: 'none',
                        }}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                            backgroundColor: pastelColors.primary,
                            color: pastelColors.paper,
                            '&:hover': { backgroundColor: pastelColors.primaryHover },
                            boxShadow: 'none',
                            borderRadius: '8px',
                            padding: '8px 20px',
                            ...montserratFont,
                            textTransform: 'none',
                            fontWeight: '600'
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : (editingEmployeeId ? 'Mettre à jour' : 'Ajouter')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default EmployeeTable;
