import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";

const API = process.env.REACT_APP_API || "http://localhost:3000";

export default function GestioneGiacenze() {
  const [giacenze, setGiacenze] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newGiacenza, setNewGiacenza] = useState({
    cella: null,
    temperatura: null,
  });

  const generateQR = () => {
    return "QR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const fetchGiacenze = async () => {
    try {
      const res = await fetch(`${API}/api/giacenze`);
      const data = await res.json();
      setGiacenze(data);
    } catch (err) {
      console.error("Errore caricando giacenze:", err);
    }
  };

  useEffect(() => {
    fetchGiacenze();
  }, []);

  const handleInsert = async () => {
    if (!newGiacenza.cella || !newGiacenza.temperatura) {
      alert("Seleziona Cella e Temperatura prima di inserire!");
      return;
    }

    try {
      const toInsert = { ...newGiacenza, qr_code: generateQR() };

      const res = await fetch(`${API}/api/giacenze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toInsert),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Errore durante l'inserimento");
        return;
      }

      setNewGiacenza({ cella: null, temperatura: null });
      fetchGiacenze();
    } catch (err) {
      console.error("Errore inserendo giacenza:", err);
    }
  };

  const handleUpdate = async (id, updated) => {
    try {
      await fetch(`${API}/api/giacenze/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setEditingId(null);
      fetchGiacenze();
    } catch (err) {
      console.error("Errore modificando giacenza:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/api/giacenze/${id}`, {
        method: "DELETE",
      });
      fetchGiacenze();
    } catch (err) {
      console.error("Errore eliminando giacenza:", err);
    }
  };

  return (
    <div>
      <h2>Gestione Giacenze</h2>

      {/* Form inserimento */}
      <div style={{ marginBottom: "20px" }}>
        <select
          value={newGiacenza.cella || ""}
          onChange={(e) =>
            setNewGiacenza({
              ...newGiacenza,
              cella: e.target.value ? parseInt(e.target.value) : null,
            })
          }
        >
          <option value="">-- Seleziona Cella --</option>
          {Array.from({ length: 100 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <select
          value={newGiacenza.temperatura || ""}
          onChange={(e) =>
            setNewGiacenza({
              ...newGiacenza,
              temperatura: e.target.value || null,
            })
          }
        >
          <option value="">-- Seleziona Temperatura --</option>
          <option value="-18°">-18°</option>
          <option value="+4°">+4°</option>
        </select>

        <button onClick={handleInsert}>Inserisci</button>
      </div>

      {/* Tabella */}
      <table border="1" style={{ width: "100%", marginTop: "20px" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Data</th>
            <th>Cella</th>
            <th>Temperatura</th>
            <th>QR Code</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {giacenze.map((g) => (
            <tr key={g.id}>
              <td>{g.id}</td>
              <td>{g.data}</td>
              <td>
                {editingId === g.id ? (
                  <select
                    value={g.cella || ""}
                    onChange={(e) =>
                      setGiacenze((prev) =>
                        prev.map((x) =>
                          x.id === g.id
                            ? {
                                ...x,
                                cella: e.target.value
                                  ? parseInt(e.target.value)
                                  : null,
                              }
                            : x
                        )
                      )
                    }
                  >
                    <option value="">-- Seleziona Cella --</option>
                    {Array.from({ length: 100 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                ) : (
                  g.cella
                )}
              </td>

              <td>
                {editingId === g.id ? (
                  <select
                    value={g.temperatura || ""}
                    onChange={(e) =>
                      setGiacenze((prev) =>
                        prev.map((x) =>
                          x.id === g.id
                            ? { ...x, temperatura: e.target.value || null }
                            : x
                        )
                      )
                    }
                  >
                    <option value="">-- Seleziona Temperatura --</option>
                    <option value="-18°">-18°</option>
                    <option value="+4°">+4°</option>
                  </select>
                ) : (
                  g.temperatura
                )}
              </td>

              <td>
                {g.qr_code ? (
                  <QRCodeCanvas value={g.qr_code} size={64} />
                ) : (
                  "-"
                )}
              </td>

              <td>
                {editingId === g.id ? (
                  <>
                    <button
                      onClick={() =>
                        handleUpdate(g.id, {
                          cella: g.cella,
                          temperatura: g.temperatura,
                          qr_code: g.qr_code,
                        })
                      }
                    >
                      Salva
                    </button>
                    <button onClick={() => setEditingId(null)}>Annulla</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingId(g.id)}>Modifica</button>
                    <button onClick={() => handleDelete(g.id)}>Elimina</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
