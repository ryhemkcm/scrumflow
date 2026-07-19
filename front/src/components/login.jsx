import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Connexion impossible."
        );
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "employee",
        JSON.stringify(data.employee)
      );

      navigate("/home", {
        replace: true,
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-container">
        <h1 className="form-title">
          Connexion administrateur
        </h1>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="input-wrapper">
            <input
              className="input-field"
              id="email"
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
            />

            <i className="uil uil-envelope" />
          </div>

          <div className="input-wrapper">
            <input
              className="input-field"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              required
            />

            <i className="uil uil-lock" />

            <button
              type="button"
              className="toggle-password"
              onClick={() =>
                setShowPassword(
                  (previousValue) => !previousValue
                )
              }
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
            >
              <i
                className={
                  showPassword
                    ? "uil uil-eye-slash"
                    : "uil uil-eye"
                }
              />
            </button>
          </div>

          <button
            type="submit"
            className="cnx-button"
            disabled={loading}
          >
            {loading
              ? "Connexion..."
              : "Se connecter"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;