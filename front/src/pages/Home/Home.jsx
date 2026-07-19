import React from "react";
import { useNavigate } from "react-router-dom";
import {
  UilUsersAlt,
  UilUserSquare,
  UilShieldCheck,
} from "@iconscout/react-unicons";

import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const employee = JSON.parse(
    localStorage.getItem("employee") || "{}"
  );

  return (
    <div className="home-page">
      <header className="home-header">
        <div>
          <p className="home-eyebrow">Tableau de bord</p>

          <h1>
            Bonjour {employee.name || "Administrateur"}
          </h1>

          <p>
            Gérez les employés et les équipes depuis votre
            espace sécurisé.
          </p>
        </div>

        <div className="security-badge">
          <UilShieldCheck />
          Session sécurisée
        </div>
      </header>

      <section className="dashboard-cards">
        <button
          type="button"
          className="dashboard-card"
          onClick={() => navigate("/employee")}
        >
          <div className="dashboard-card-icon">
            <UilUsersAlt />
          </div>

          <div>
            <h2>Employés</h2>
            <p>
              Ajouter, modifier et supprimer les employés.
            </p>
          </div>

          <span>Ouvrir →</span>
        </button>

        <button
          type="button"
          className="dashboard-card"
          onClick={() => navigate("/team")}
        >
          <div className="dashboard-card-icon">
            <UilUserSquare />
          </div>

          <div>
            <h2>Équipes</h2>
            <p>
              Créer et administrer les différentes équipes.
            </p>
          </div>

          <span>Ouvrir →</span>
        </button>
      </section>
    </div>
  );
}

export default Home;