
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#f35f4a', // Rouge orangé
            contrastText: '#fff',
        },
        secondary: {
            main: '#949b56', // Vert olive
            contrastText: '#fff',
        },
        background: {
            default: '#ebece1', // Beige clair
            paper: '#b9c496',   // Vert clair
        },
        custom: {
            lightBeige: '#ebece1',
            lightGreen: '#b9c496',
            darkGreen: '#949b56',
            orange: '#f35f4a',
            admin: '#6a1b9a',
            developer: '#0277bd',
            tester: '#ef6c00',
            designer: '#7b1fa2',
            productOwner: '#2e7d32',
            scrumMaster: '#c2185b'
        },
    },
    components: {
        MuiButton: {
        styleOverrides: {
            root: {
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            },
        },
        variants: [
            {
            props: { variant: 'custom-green' },
            style: {
                backgroundColor: '#949b56',
                color: 'white',
                '&:hover': {
                backgroundColor: '#b9c496',
                },
            },
            },
        ],
        },
        MuiChip: {
        styleOverrides: {
            root: {
            borderRadius: '16px',
            fontWeight: 500,
            },
        },
        },
    },
});

export default theme;