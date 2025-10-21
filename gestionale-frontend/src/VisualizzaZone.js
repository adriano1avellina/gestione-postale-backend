// src/VisualizzaZone.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API || "http://localhost:3000";

export default function VisualizzaZone() {
  const [zone, setZone] = useState([]);
  const [filtroPaese, setFiltroPaese] = useState("");
  const [filtroCodS, setFiltroCodS] = useState("");
  const [filtroCiva, setFiltroCiva] = useState("");
  const [form, setForm] = useState({ cod_s: "", c_iva: "", stato: "" });
  const [modificaId, setModificaId] = useState(null);

  useEffect(() => {
    caricaZone();
  }, []);

  const caricaZone = async () => {
    try {
      const res = await axios.get(`${API}/api/zonario`);
      setZone(res.data);
    } catch (err) {
      console.error("Errore caricamento zone:", err);
    }
  };

  const salvaZona = async () => {
    try {
      if (modificaId) {
        await axios.put(`${API}/api/zonario/${modificaId}`, form);
      } else {
        await axios.post(`${API}/api/zonario`, form);
      }
      setForm({ cod_s: "", c_iva: "", stato: "" });
      setModificaId(null);
      caricaZone();
    } catch (err) {
      console.error("Errore salva zona:", err);
    }
  };

  const modificaZona = (zona) => {
    setForm({ cod_s: zona.cod_s, c_iva: zona.c_iva, stato: zona.stato });
    setModificaId(zona.id_zonario);
  };

  const eliminaZona = async (id) => {
    if (!window.confirm("Confermi cancellazione zona?")) return;
    try {
      await axios.delete(`${API}/api/zonario/${id}`);
      caricaZone();
    } catch (err) {
      console.error("Errore elimina zona:", err);
    }
  };

  const zoneFiltrate = zone.filter(
    (z) =>
      z.stato.toLowerCase().includes(filtroPaese.toLowerCase()) &&
      z.cod_s.toLowerCase().includes(filtroCodS.toLowerCase()) &&
      z.c_iva.toLowerCase().includes(filtroCiva.toLowerCase())
  );

  return (
  <div
    style={{
      background: "linear-gradient(135deg, #f5f7fa, #e8f5e9)",
      minHeight: "100vh",
      padding: "40px 0",
      fontFamily: "Arial, sans-serif",
    }}
  >
    <div
      style={{
        background: "white",
        margin: "0 auto",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        width: "90%",
        maxWidth: "1000px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#145374",
          marginBottom: "30px",
          fontSize: "28px",
          letterSpacing: "1px",
        }}
      >
        🌍 Gestione Zone
      </h1>

      {/* === FILTRI === */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          marginBottom: "25px",
          background: "#fff",
          padding: "16px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ flex: "1" }}>
          <label style={{ fontWeight: 600, color: "#145374" }}>Filtro Stato</label>
          <input
            type="text"
            placeholder="Es: Italia"
            value={filtroPaese}
            onChange={(e) => setFiltroPaese(e.target.value)}
            className="filter-input"
          />
        </div>

        <div style={{ flex: "1" }}>
          <label style={{ fontWeight: 600, color: "#145374" }}>Filtro COD_S</label>
          <input
            type="text"
            placeholder="Es: ITA001"
            value={filtroCodS}
            onChange={(e) => setFiltroCodS(e.target.value)}
            className="filter-input"
          />
        </div>

        <div style={{ flex: "1" }}>
          <label style={{ fontWeight: 600, color: "#145374" }}>Filtro C_IVA</label>
          <input
            type="text"
            placeholder="Es: 22%"
            value={filtroCiva}
            onChange={(e) => setFiltroCiva(e.target.value)}
            className="filter-input"
          />
        </div>

        <button
          onClick={() => {
            setFiltroPaese("");
            setFiltroCodS("");
            setFiltroCiva("");
          }}
          style={{
            backgroundColor: "#e53935",
            color: "white",
            border: "none",
            borderRadius: "30px",
            padding: "10px 20px",
            cursor: "pointer",
            fontWeight: "bold",
            alignSelf: "flex-end",
            boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
          }}
        >
          ❌ Pulisci filtri
        </button>
      </div>

      {/* === FORM INSERIMENTO/MODIFICA === */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          borderRadius: "15px",
          background: "#f9f9f9",
          border: "1px solid #ccc",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{
            textAlign: "center",
            color: "#145374",
            marginBottom: "15px",
          }}
        >
          {modificaId ? "✏️ Modifica Zona" : "➕ Nuova Zona"}
        </h3>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "15px",
            justifyContent: "center",
          }}
        >
          <input
            placeholder="COD_S"
            value={form.cod_s}
            onChange={(e) => setForm({ ...form, cod_s: e.target.value })}
            className="input-style"
          />
          <input
            placeholder="C_IVA"
            value={form.c_iva}
            onChange={(e) => setForm({ ...form, c_iva: e.target.value })}
            className="input-style"
          />
          <input
            placeholder="STATO"
            value={form.stato}
            onChange={(e) => setForm({ ...form, stato: e.target.value })}
            className="input-style"
          />
          <button
            onClick={salvaZona}
            style={{
              backgroundColor: modificaId ? "#0288d1" : "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: "25px",
              padding: "10px 25px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
            }}
          >
            {modificaId ? "💾 Salva Modifiche" : "➕ Inserisci"}
          </button>
        </div>
      </div>

      {/* === TABELLA === */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <thead style={{ backgroundColor: "#145374", color: "white" }}>
            <tr>
              <th style={{ padding: "10px" }}>Azioni</th>
              <th style={{ padding: "10px" }}>COD_S</th>
              <th style={{ padding: "10px" }}>C_IVA</th>
              <th style={{ padding: "10px" }}>STATO</th>
            </tr>
          </thead>
          <tbody>
            {zoneFiltrate.length > 0 ? (
              zoneFiltrate.map((z) => (
                <tr
                  key={z.id_zonario}
                  style={{
                    textAlign: "center",
                    transition: "background 0.3s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#f1f8e9")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td>
                    <button
                      onClick={() => modificaZona(z)}
                      style={{
                        backgroundColor: "#2196F3",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        padding: "6px 12px",
                        marginRight: "6px",
                        cursor: "pointer",
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => eliminaZona(z.id_zonario)}
                      style={{
                        backgroundColor: "#E53935",
                        color: "white",
                        border: "none",
                        borderRadius: "20px",
                        padding: "6px 12px",
                        cursor: "pointer",
                      }}
                    >
                      🗑️
                    </button>
                  </td>
                  <td>{z.cod_s}</td>
                  <td>{z.c_iva}</td>
                  <td>{z.stato}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "15px" }}>
                  Nessuna zona trovata
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

}
