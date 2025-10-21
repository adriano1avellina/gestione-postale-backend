// import
//import React, { useState, useEffect } from "react";
import React, { useState } from "react";
import VisualizzaAnagrafiche from "./VisualizzaAnagrafiche";
import VisualizzaZone from "./VisualizzaZone";
import GestioneGiornata from "./GestioneGiornata";
import GestioneGiacenze from "./GestioneGiacenze";
import GestioneUtenti from "./GestioneUtenti";
// Stile comune per i bottoni della dashboard
const buttonStyle = (color) => ({
  backgroundColor: color,
  color: "white",
  border: "none",
  borderRadius: "50%",
  width: "130px",
  height: "130px",
  fontSize: "14px",
  fontWeight: "bold",
  lineHeight: "1.2",
  boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.3s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  textAlign: "center",
});

const API = process.env.REACT_APP_API;
console.log("API base URL:", API);

// ============================================================
// App principale
// ============================================================
function App() {
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [mostraPassword, setMostraPassword] = useState(false);
  const [messaggio, setMessaggio] = useState("");
  const [token, setToken] = useState("");
  const [ruolo, setRuolo] = useState("");
  const [permessi, setPermessi] = useState([]);
  const [userId, setUserId] = useState(null);
  const [vista, setVista] = useState("login"); // login | dashboard | gestioneUtenti | gestioneAnagrafiche

  // ————————————————— LOGIN —————————————————
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessaggio("...attendi...");
    try {
      const response = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token);
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        setRuolo(payload.ruolo);
        setPermessi(Array.isArray(payload.permessi) ? payload.permessi : []);
        setUserId(payload.id);
        setMessaggio(`✅ Login OK - ruolo: ${payload.ruolo}`);
        setVista("dashboard");
      } else {
        setMessaggio(`❌ ${data.message}`);
      }
    } catch {
      setMessaggio("❌ Errore di connessione");
    }
  };

  const logout = () => {
    setNome("");
    setPassword("");
    setToken("");
    setRuolo("");
    setPermessi([]);
    setUserId(null);
    setVista("login");
    setMessaggio("");
  };

  return (
    <div style={{ width: "90%", maxWidth: 1500, margin: "30px auto", fontFamily: "Arial" }}>
      {/* ————————————————— LOGIN ————————————————— */}
     {vista === "login" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
      fontFamily: "Arial, sans-serif",
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "40px 50px",
        borderRadius: "20px",
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
        textAlign: "center",
        width: "350px",
      }}
    >
      <h1 style={{ marginBottom: 30, color: "#2e7d32" }}>Accesso Gestionale</h1>
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          placeholder="NOME"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />
        <input
          type={mostraPassword ? "text" : "password"}
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />
        <label style={{ fontSize: "14px", color: "#555" }}>
          <input
            type="checkbox"
            checked={mostraPassword}
            onChange={(e) => setMostraPassword(e.target.checked)}
            style={{ marginRight: 8 }}
          />
          Visualizza password
        </label>
        <button
          type="submit"
          style={{
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "50px",
            padding: "12px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "10px",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#43a047")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#2e7d32")}
        >
          ACCEDI
        </button>
      </form>
      {messaggio && (
        <div style={{ marginTop: 20, color: "red", fontWeight: "bold" }}>{messaggio}</div>
      )}
    </div>
  </div>
)}


      {/* ————————————————— DASHBOARD ————————————————— */}
     {vista === "dashboard" && (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #f5f7fa, #c3cfe2)",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
    }}
  >
    <button
      onClick={logout}
      style={{
        position: "absolute",
        top: 20,
        right: 30,
        backgroundColor: "#145374",
        color: "white",
        padding: "10px 20px",
        border: "none",
        borderRadius: "25px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}
    >
      ESCI
    </button>

    <h1 style={{ color: "#145374", marginBottom: "10px" }}>
      Benvenuto, {nome}!
    </h1>
    <p style={{ color: "#333", marginBottom: "40px" }}>Ruolo: <b>{ruolo}</b></p>

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "25px",
        maxWidth: "700px",
      }}
    >
      {(ruolo === "admin" || permessi.includes("GESTIONE UTENTI")) && (
        <button
          onClick={() => setVista("gestioneUtenti")}
          style={buttonStyle("#4CAF50")}
        >
          👤<br />
          GESTIONE<br />UTENTI
        </button>
      )}

      {(ruolo === "admin" || permessi.includes("GESTIONE ANAGRAFICHE")) && (
        <button
          onClick={() => setVista("gestioneAnagrafiche")}
          style={buttonStyle("#2196F3")}
        >
          🗂️<br />
          GESTIONE<br />ANAGRAFICHE
        </button>
      )}

      {(ruolo === "admin" || permessi.includes("GESTIONE GIORNATA")) && (
        <button
          onClick={() => setVista("gestioneGiornata")}
          style={buttonStyle("#FF9800")}
        >
          📅<br />
          GESTIONE<br />GIORNATA
        </button>
      )}

      {(ruolo === "admin" || permessi.includes("GESTIONE ZONE")) && (
        <button
          onClick={() => setVista("gestioneZone")}
          style={buttonStyle("#9C27B0")}
        >
          🌍<br />
          GESTIONE<br />ZONE
        </button>
      )}

      {(ruolo === "admin" || permessi.includes("GESTIONE GIACENZE")) && (
        <button
          onClick={() => setVista("GestioneGiacenze")}
          style={buttonStyle("#E91E63")}
        >
          ❄️<br />
          GESTIONE<br />GIACENZE
        </button>
      )}
    </div>
  </div>
)}

 
  {/* ————————————————— GESTIONE UTENTI ————————————————— */}
{vista === "gestioneUtenti" &&
  (ruolo === "admin" || permessi.includes("GESTIONE UTENTI") ? (
    <div>
     <button
  onClick={() => setVista("dashboard")}
  style={{
    backgroundColor: "#a10909ff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    padding: "12px 28px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    float: "right",
    marginBottom: "20px",
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = "#43a047";
    e.currentTarget.style.transform = "scale(1.07)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = "#2e7d32";
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  ⬅️ INDIETRO
</button>

      <h2>GESTIONE UTENTI</h2>
      <GestioneUtenti token={token} utente={nome} />
    </div>
  ) : (
    <div>
      <p style={{ color: "red" }}>Accesso non autorizzato</p>
      <button onClick={() => setVista("dashboard")}>Torna indietro</button>
    </div>
  ))}

      {/* ————————————————— GESTIONE GIACENZE ————————————————— */}
      {vista === "GestioneGiacenze" &&
        (ruolo === "admin" || permessi.includes("GESTIONE GIACENZE") ? (
          <div>
            <button
  onClick={() => setVista("dashboard")}
  style={{
    backgroundColor: "#a10909ff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    padding: "12px 28px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    float: "right",
    marginBottom: "20px",
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = "#43a047";
    e.currentTarget.style.transform = "scale(1.07)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = "#2e7d32";
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  ⬅️ INDIETRO
</button>
            <h2>GESTIONE GIACENZE</h2>
            <GestioneGiacenze token={token} utente={nome} />
          </div>
        ) : (
          <div>
            <p style={{ color: "red" }}>Accesso non autorizzato</p>
            <button onClick={() => setVista("dashboard")}>Torna indietro</button>
          </div>
        ))}

      {/* ————————————————— GESTIONE ANAGRAFICHE ————————————————— */}
      {vista === "gestioneAnagrafiche" &&
        (ruolo === "admin" || permessi.includes("GESTIONE ANAGRAFICHE") ? (
          <div>
            <button
  onClick={() => setVista("dashboard")}
  style={{
    backgroundColor: "#a10909ff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    padding: "12px 28px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    float: "right",
    marginBottom: "20px",
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = "#43a047";
    e.currentTarget.style.transform = "scale(1.07)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = "#2e7d32";
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  ⬅️ INDIETRO
</button>
            <h2>GESTIONE ANAGRAFICHE</h2>
            <VisualizzaAnagrafiche token={token} />
          </div>
        ) : (
          <div>
            <p style={{ color: "red" }}>Accesso non autorizzato</p>
            <button onClick={() => setVista("dashboard")}>Torna indietro</button>
          </div>
        ))}

      {/* ————————————————— GESTIONE GIORNATA ————————————————— */}
      {vista === "gestioneGiornata" &&
        (ruolo === "admin" || permessi.includes("GESTIONE GIORNATA") ? (
          <div>
            <button
  onClick={() => setVista("dashboard")}
  style={{
    backgroundColor: "#a10909ff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    padding: "12px 28px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    float: "right",
    marginBottom: "20px",
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = "#43a047";
    e.currentTarget.style.transform = "scale(1.07)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = "#2e7d32";
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  ⬅️ INDIETRO
</button>
            <h2>GESTIONE GIORNATA</h2>
            <GestioneGiornata token={token} utente={nome} setVista={setVista} />
          </div>
        ) : (
          <div>
            <p style={{ color: "red" }}>Accesso non autorizzato</p>
            <button onClick={() => setVista("dashboard")}>Torna indietro</button>
          </div>
        ))}

      {/* ————————————————— GESTIONE ZONE ————————————————— */}
      {vista === "gestioneZone" &&
        (ruolo === "admin" || permessi.includes("GESTIONE ZONE") ? (
          <div>
            <button
  onClick={() => setVista("dashboard")}
  style={{
    backgroundColor: "#a10909ff",
    color: "white",
    border: "none",
    borderRadius: "50px",
    padding: "12px 28px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    transition: "all 0.3s ease",
    float: "right",
    marginBottom: "20px",
  }}
  onMouseOver={(e) => {
    e.currentTarget.style.backgroundColor = "#43a047";
    e.currentTarget.style.transform = "scale(1.07)";
  }}
  onMouseOut={(e) => {
    e.currentTarget.style.backgroundColor = "#2e7d32";
    e.currentTarget.style.transform = "scale(1)";
  }}
>
  ⬅️ INDIETRO
</button>
            <h2>GESTIONE ZONE</h2>
            <VisualizzaZone token={token} />
          </div>
        ) : (
          <div>
            <p style={{ color: "red" }}>Accesso non autorizzato</p>
            <button onClick={() => setVista("dashboard")}>Torna indietro</button>
          </div>
        ))}
    </div>
  );
}

export default App;
