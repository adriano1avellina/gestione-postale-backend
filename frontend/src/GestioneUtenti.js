// src/GestioneUtenti.js
import React, { useEffect, useMemo, useState } from "react";
//console.log("✅ GestioneUtenti caricato");
//console.log("🔑 Token ricevuto:", token);
// ✨ Animazione per comparsa del form (fade + slide)
const style = document.createElement("style");
style.innerHTML = `
@keyframes fadeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-15px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}`;
document.head.appendChild(style);

const API = (process.env.REACT_APP_API || "http://localhost:3000").replace(/\/$/, "");

const PERM_OPZIONI = [
  "GESTIONE UTENTI",
  "GESTIONE GIORNATA",
  "GESTIONE ZONE",
  "GESTIONE ANAGRAFICHE",
  "GESTIONE GIACENZE"
];

const initialForm = {
  nome: "",
  password: "",
  descrizione: "",
  ruolo: "user",
  permessi: [],
};

export default function GestioneUtenti({ token, utente }) {
  console.log("✅ GestioneUtenti caricato");
  console.log("🔑 Token ricevuto:", token);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  // ---- helpers ----
  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(false);
  };

  const fetchUtenti = async () => {
    console.log("📡 Chiamata API:", `${API}/utenti`);   // 👈 1️⃣ appena prima della fetch
    setLoading(true);
    try {
      const res = await fetch(`${API}/utenti`, { headers: { Authorization: `Bearer ${token}` } });
      console.log("🧾 Status risposta:", res.status);   // 👈 2️⃣ per vedere il codice HTTP
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Errore caricamento utenti (${res.status}) ${t}`);
      }
      const data = await res.json();
      console.log("📦 Risposta utenti:", data);          // 👈 3️⃣ per vedere il JSON ricevuto
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert("❌ Impossibile caricare gli utenti. Verifica permessi/token e server.");
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
    if (token) {
      fetchUtenti(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [token]);

  const visibleRows = rows.filter((r) =>
    `${r.nome ?? ""} ${r.descrizione ?? ""} ${r.ruolo ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ---- create/update/delete ----
  const salva = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // UPDATE: descrizione, ruolo, permessi
        const payload = {
          descrizione: form.descrizione || "",
          ruolo: form.ruolo || "user",
          permessi: Array.isArray(form.permessi) ? form.permessi : [],
        };
        const res = await fetch(`${API}/utenti/${editingId}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Errore aggiornamento (${res.status}) ${t}`);
        }
        await fetchUtenti();
        resetForm(); // chiude il form
      } else {
        // CREATE: nome + password obbligatori
        if (!form.nome.trim()) return alert("Inserisci il NOME utente.");
        if (!form.password.trim()) return alert("Inserisci la PASSWORD.");

        const payload = {
          nome: form.nome.trim(),
          password: form.password,
          descrizione: form.descrizione || "",
          ruolo: form.ruolo || "user",
          permessi: Array.isArray(form.permessi) ? form.permessi : [],
        };

        const res = await fetch(`${API}/crea-utente`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Errore creazione (${res.status}) ${t}`);
        }
        await fetchUtenti();
        resetForm(); // chiude il form
      }
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  };

  const elimina = async (id) => {
    if (!window.confirm("Confermi l'eliminazione dell'utente?")) return;
    try {
      const res = await fetch(`${API}/utenti/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Errore eliminazione (${res.status}) ${t}`);
      }
      setRows(rows.filter((r) => r.id_user !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  };

  const avviaModifica = (r) => {
    setEditingId(r.id_user);
    setForm({
      nome: r.nome || "",
      password: "",
      descrizione: r.descrizione || "",
      ruolo: r.ruolo || "user",
      permessi: Array.isArray(r.permessi) ? r.permessi : [],
    });
    setShowForm(true); // apre subito il form
  };

  // ---- UI ----
  return (
  <div
    style={{
      background: "linear-gradient(135deg, #f5f7fa, #e8f5e9)",
      minHeight: "100vh",
      padding: "50px 0",
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
        maxWidth: "1100px",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          color: "#145374",
          marginBottom: "30px",
          fontSize: "26px",
          letterSpacing: "1px",
        }}
      >
        👤 Gestione Utenti
      </h1>

      <input
        placeholder="🔍 Cerca per nome, descrizione o ruolo…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
          borderRadius: "10px",
          border: "1px solid #ccc",
          fontSize: "16px",
        }}
      />

      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            backgroundColor: showForm ? "#9e9e9e" : "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: "50px",
            padding: "12px 25px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          }}
        >
          {showForm ? "Nascondi form utente" : "➕ Crea nuovo utente"}
        </button>
      </div>

      {/* ---- FORM A SCOMPARSA (prima della tabella) ---- */}
      {showForm && (
  <div
    style={{
      marginBottom: 30,
      padding: 20,
      borderRadius: "15px",
      background: "#f9f9f9",
      border: "1px solid #ccc",
      boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
      animation: "fadeSlideIn 0.6s ease-out",
      opacity: 0,
      transform: "translateY(-15px)",
      animationFillMode: "forwards",
    }}
  >
          <h3 style={{ marginTop: 0, color: "#145374", textAlign: "center" }}>
            {editingId ? `✏️ Modifica utente: ${form.nome}` : "➕ Crea nuovo utente"}
          </h3>

          <form onSubmit={salva} style={{ display: "grid", gap: 12 }}>
            {/* Bottoni in alto */}
            <div style={{ display: "flex", justifyContent: "center", gap: 15 }}>
              <button
                type="submit"
                style={{
                  backgroundColor: "#2e7d32",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  padding: "10px 25px",
                  cursor: "pointer",
                  fontSize: "15px",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                }}
              >
                {editingId ? "Aggiorna" : "Crea"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  backgroundColor: "#e53935",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  padding: "10px 25px",
                  cursor: "pointer",
                  fontSize: "15px",
                  boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                }}
              >
                Annulla
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 15,
                marginTop: 10,
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <label>
                  Nome utente *
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="es. mario.rossi"
                    required
                    disabled={!!editingId}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                    }}
                  />
                </label>

                {!editingId && (
                  <label>
                    Password *
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="min 6 caratteri"
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </label>
                )}

                <label>
                  Descrizione
                  <input
                    value={form.descrizione}
                    onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
                    placeholder="note interne / ruolo operativo"
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                    }}
                  />
                </label>

                {/* Ruolo + Permessi (con blocco admin) */}
                <label>
                  Ruolo
                  <select
                    value={form.ruolo}
                    onChange={(e) => {
                      const nuovoRuolo = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        ruolo: nuovoRuolo,
                        permessi:
                          nuovoRuolo === "admin" ? [...PERM_OPZIONI] : prev.permessi,
                      }));
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                    }}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Permessi</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 8,
                    border: "1px solid #ddd",
                    padding: 10,
                    borderRadius: 8,
                    background: "#fff",
                    opacity: form.ruolo === "admin" ? 0.6 : 1,
                  }}
                >
                  {PERM_OPZIONI.map((perm) => (
                    <label key={perm} style={{ userSelect: "none" }}>
                      <input
                        type="checkbox"
                        checked={form.permessi.includes(perm)}
                        disabled={form.ruolo === "admin"}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setForm((prev) => {
                            const set = new Set(prev.permessi);
                            if (checked) set.add(perm);
                            else set.delete(perm);
                            return { ...prev, permessi: Array.from(set) };
                          });
                        }}
                      />{" "}
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ---- TABELLA ---- */}
      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <thead style={{ backgroundColor: "#145374", color: "white" }}>
            <tr>
              <th style={{ width: 120 }}>Azioni</th>
              <th>ID</th>
              <th>Nome</th>
              <th>Descrizione</th>
              <th>Ruolo</th>
              <th>Permessi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  Caricamento…
                </td>
              </tr>
            ) : visibleRows.length ? (
              visibleRows.map((r) => (
                <tr
                  key={r.id_user}
                  style={{
                    backgroundColor:
                      r.ruolo === "admin" ? "#e3f2fd" : "white",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#f1f8e9")}
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      r.ruolo === "admin" ? "#e3f2fd" : "white")
                  }
                >
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => avviaModifica(r)}
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
                      onClick={() => elimina(r.id_user)}
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
                  <td>{r.id_user}</td>
                  <td>{r.nome}</td>
                  <td>{r.descrizione || ""}</td>
                  <td>{r.ruolo}</td>
                  <td>
                    {Array.isArray(r.permessi) ? r.permessi.join(", ") : ""}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center" }}>
                  Nessun utente trovato
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
