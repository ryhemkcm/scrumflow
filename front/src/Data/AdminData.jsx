import {
  UilEstate,
  UilPresentation,
  UilUserSquare,
  UilUsersAlt,
} from "@iconscout/react-unicons";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Card from "../pages/Card/AdminCard";

export const SidebarData = [
  {
    IconComponent: UilEstate,
    heading: "Tableau de bord",
    path: "/home",
  },
  {
    IconComponent: UilUserSquare,
    heading: "Employés",
    path: "/employee",
  },
  {
    IconComponent: UilUsersAlt,
    heading: "Équipes",
    path: "/team",
  },
];

const AdminCards = () => {
  const [data, setData] = useState({
    administrators: 0,
    productOwners: 0,
    scrumMasters: 0,
    developers: 0,
    teams: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeeRes, teamRes] = await Promise.all([
          axios.get("http://localhost:3001/api/employees"),
          axios.get("http://localhost:3001/api/teams"),
        ]);

        const employees = employeeRes.data;

        setData({
          administrators: employees.filter(
            (e) => e.role === "Administrator"
          ).length,
          productOwners: employees.filter(
            (e) => e.role === "Product Owner"
          ).length,
          scrumMasters: employees.filter(
            (e) => e.role === "Scrum Master"
          ).length,
          developers: employees.filter(
            (e) => e.role === "Developer"
          ).length,
          teams: teamRes.data.length,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const cards = [
    {
      title: "Administrateurs",
      value: data.administrators,
      icon: UilUserSquare,
    },
    {
      title: "Product Owners",
      value: data.productOwners,
      icon: UilPresentation,
    },
    {
      title: "Scrum Masters",
      value: data.scrumMasters,
      icon: UilPresentation,
    },
    {
      title: "Développeurs",
      value: data.developers,
      icon: UilUsersAlt,
    },
    {
      title: "Équipes",
      value: data.teams,
      icon: UilUsersAlt,
    },
  ];

  return (
    <div className="cards">
      {cards.map((card, index) => (
        <Card
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
        />
      ))}
    </div>
  );
};

export default AdminCards;