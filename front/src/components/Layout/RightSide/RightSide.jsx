import React, { useEffect, useState } from "react";
import "./RightSide.css";
import ProjectProgressChart from './ProjectProgressChart';
import Chart from "react-apexcharts";
import axios from "axios";
import { FiSearch, FiUsers, FiBriefcase, FiCheckCircle } from "react-icons/fi";

const RightSide = () => {
  const [summary, setSummary] = useState({
    projects: 0,
    employees: 0,
    clients: 0
  });
  const [status, setStatus] = useState({
    completed: 0,
    inProgress: 0,
    notStarted: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [summaryRes, statusRes] = await Promise.all([
          axios.get("http://localhost:3001/api/stats/summary"),
          axios.get("http://localhost:3001/api/stats/projects/status")
        ]);
        
        setSummary({
          projects: summaryRes.data.projects || 0,
          employees: summaryRes.data.employees || 0,
          clients: summaryRes.data.clients || 0
        });

        // Transforme les données de statut pour le format attendu
        const statusData = statusRes.data.reduce((acc, item) => {
          acc[item.status === 'completed' ? 'completed' : 
              item.status === 'in_progress' ? 'inProgress' : 'notStarted'] = item.count;
          return acc;
        }, { completed: 0, inProgress: 0, notStarted: 0 });

        setStatus(statusData);
      } catch (err) {
        console.error("Erreur lors de la récupération des stats:", err);
        setError("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implémentez votre logique de recherche ici
    console.log("Recherche:", searchQuery);
  };

  const pieOptions = {
    chart: {
      type: 'pie',
    },
    labels: ['Terminés', 'En cours', 'Non commencés'],
    colors: ['#B6BB79', '#FFC9CC', '#B8A6DE'],
    legend: {
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const pieSeries = [
    status.completed,
    status.inProgress,
    status.notStarted
  ];

  if (loading) return (
    <div className="RightSide loading">
      <div className="loader">Chargement en cours...</div>
    </div>
  );

  if (error) return (
    <div className="RightSide error">
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Réessayer</button>
    </div>
  );

  return (
    <div className="RightSide">


      {/* Graphique circulaire */}
      <div className="chart-container">
        <h3>Statut des projets</h3>
        <Chart 
          options={pieOptions} 
          series={pieSeries} 
          type="pie" 
        />
      </div>

      {/* Graphique d'avancement */}
      <div className="chart-container">
        <ProjectProgressChart />
      </div>
    </div>
  );
};

export default RightSide;