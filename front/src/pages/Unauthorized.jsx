import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../assets/lotties/Animation - 1746824500183.json';

const Unauthorized = () => {
    return (
        <div style={{
            textAlign: 'center',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '90vh',
            backgroundColor: '#f9f9f9',
            fontFamily: 'Segoe UI, Roboto, sans-serif'
        }}>
            <div style={{ width: 500, height: 300, marginBottom: '0.2rem' }}>
                <Lottie animationData={animationData} loop autoplay />
            </div>
            <h1 style={{
                marginTop: '0',
                fontSize: '1.8rem',
                fontWeight: '600',
                color: '#4a9ad4', 
                marginBottom: '0.5rem'
            }}>
                403 - Accès refusé
            </h1>
            <p style={{
                fontSize: '1rem',
                color: '#555',
                maxWidth: '400px'
            }}>
                Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
            </p>
        </div>
    );
};

export default Unauthorized;
