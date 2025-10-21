[33mcommit 945c004d758af0486fa289e390b08af3f79b7417[m
Author: Adriano Avellina <info@esmnovara.it>
Date:   Mon Sep 1 17:24:03 2025 +0200

    tabella giacenza aggiungi elimina modifica ok

[1mdiff --git a/gestionale-frontend/src/App.js b/gestionale-frontend/src/App.js[m
[1mindex 33b1924..08346a9 100644[m
[1m--- a/gestionale-frontend/src/App.js[m
[1m+++ b/gestionale-frontend/src/App.js[m
[36m@@ -2,6 +2,7 @@[m [mimport React, { useState, useEffect } from "react";[m
 import VisualizzaAnagrafiche from "./VisualizzaAnagrafiche";[m
 import VisualizzaZone from "./VisualizzaZone"; [m
 import GestioneGiornata from "./gestioneGiornata";[m
[32m+[m[32mimport GestioneGiacenze from "./GestioneGiacenze";[m
 // ============================================================[m
 // App principale[m
 // ============================================================[m
[36m@@ -144,6 +145,7 @@[m [mfunction App() {[m
   >[m
           GESTIONE GIORNATA[m
           </button>[m
[32m+[m
 )}[m
 {/* Gestione Zone */}[m
 {(ruolo === "admin" || permessi.includes("GESTIONE ZONE")) && ([m
[36m@@ -154,11 +156,52 @@[m [mfunction App() {[m
     GESTIONE ZONE[m
   </button>[m
 )}[m
[32m+[m
[32m+[m[32m{/* Gestione Giacenze */}[m
[32m+[m[32m{(ruolo === "admin" || permessi.includes("GESTIONE GIACENZE")) && ([m
[32m+[m[32m  <button[m
[32m+[m[32m    style={{ padding: 20, background: "#c27c1a", color: "white", borderRadius: "8px" }}[m
[32m+[m[32m    onClick={() => setVista("GestioneGiacenze")}[m
[32m+[m[32m  >[m
[32m+[m[32m    GESTIONE GIACENZE[m
[32m+[m[32m  </button>[m
[32m+[m[32m)}[m
[32m+[m
     </div>[m
   </div>[m
 )}[m
 [m
 [m
[32m+[m
[32m+[m[32m{/* ————————————————— GESTIONE GIACENZE ————————————————— */}[m
[32m+[m[32m{vista === "GestioneGiacenze" &&[m
[32m+[m[32m  (ruolo === "admin" || permessi.includes("GESTIONE GIACENZE") ? ([m
[32m+[m[32m    <div>[m
[32m+[m[32m      <button[m
[32m+[m[32m        onClick={() => setVista("dashboard")}[m
[32m+[m[32m        style={{[m
[32m+[m[32m          float: "right",[m
[32m+[m[32m          backgroundColor: "#145374",[m
[32m+[m[32m          color: "white",[m
[32m+[m[32m          padding: 10,[m
[32m+[m[32m        }}[m
[32m+[m[32m      >[m
[32m+[m[32m        INDIETRO[m
[32m+[m[32m      </button>[m
[32m+[m[32m      <h2>GESTIONE GIACENZE</h2>[m
[32m+[m[32m      <GestioneGiacenze token={token} utente={nome} />[m
[32m+[m[32m    </div>[m
[32m+[m[32m  ) : ([m
[32m+[m[32m    <div>[m
[32m+[m[32m      <p style={{ color: "red" }}>Accesso non autorizzato</p>[m
[32m+[m[32m      <button onClick={() => setVista("dashboard")}>[m
[32m+[m[32m        Torna indietro[m
[32m+[m[32m      </button>[m
[32m+[m[32m    </div>[m
[32m+[m[32m  ))}[m
[32m+[m
[32m+[m
[32m+[m
       {/* ————————————————— GESTIONE UTENTI ————————————————— */}[m
       {vista === "gestioneUtenti" &&[m
         (ruolo === "admin" || permessi.includes("GESTIONE UTENTI") ? ([m
[36m@@ -281,6 +324,7 @@[m [mfunction VisualizzaUtenti({ token, userId, permessi }) {[m
   "GESTIONE UTENTI",[m
   "GESTIONE ANAGRAFICHE",[m
   "GESTIONE GIORNATA",[m
[32m+[m[32m  "GESTIONE GIACENZE"[m
 ];[m
 [m
   // non posso modificare/eliminare me stesso[m
[1mdiff --git a/gestionale-frontend/src/GestioneGiacenze.js b/gestionale-frontend/src/GestioneGiacenze.js[m
[1mnew file mode 100644[m
[1mindex 0000000..ec5ab5e[m
[1m--- /dev/null[m
[1m+++ b/gestionale-frontend/src/GestioneGiacenze.js[m
[36m@@ -0,0 +1,199 @@[m
[32m+[m[32mimport React, { useState, useEffect } from "react";[m
[32m+[m
[32m+[m[32mexport default function GestioneGiacenze() {[m
[32m+[m[32m  const [giacenze, setGiacenze] = useState([]);[m
[32m+[m[32m  const [editingId, setEditingId] = useState(null);[m
[32m+[m[32m  const [newGiacenza, setNewGiacenza] = useState({[m
[32m+[m[32m    cella: null,[m
[32m+[m[32m    temperatura: null,[m
[32m+[m[32m  });[m
[32m+[m
[32m+[m[32m  const generateQR = () => {[m
[32m+[m[32m    return "QR-" + Math.random().toString(36).substr(2, 9).toUpperCase();[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const fetchGiacenze = async () => {[m
[32m+[m[32m    try {[m
[32m+[m[32m      const res = await fetch("http://localhost:3000/api/giacenze");[m
[32m+[m[32m      const data = await res.json();[m
[32m+[m[32m      setGiacenze(data);[m
[32m+[m[32m    } catch (err) {[m
[32m+[m[32m      console.error("Errore caricando giacenze:", err);[m
[32m+[m[32m    }[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  useEffect(() => {[m
[32m+[m[32m    fetchGiacenze();[m
[32m+[m[32m  }, []);[m
[32m+[m
[32m+[m[32m  const handleInsert = async () => {[m
[32m+[m[32m    if (!newGiacenza.cella || !newGiacenza.temperatura) {[m
[32m+[m[32m      alert("Seleziona Cella e Temperatura prima di inserire!");[m
[32m+[m[32m      return;[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    try {[m
[32m+[m[32m      const toInsert = {[m[41m [m
[32m+[m[32m        ...newGiacenza,[m[41m [m
[32m+[m[32m        qr_code: generateQR()[m[41m [m
[32m+[m[32m      };[m
[32m+[m[32m      await fetch("http://localhost:3000/api/giacenze", {[m
[32m+[m[32m        method: "POST",[m
[32m+[m[32m        headers: { "Content-Type": "application/json" },[m
[32m+[m[32m        body: JSON.stringify(toInsert),[m
[32m+[m[32m      });[m
[32m+[m[32m      setNewGiacenza({ cella: null, temperatura: null });[m
[32m+[m[32m      fetchGiacenze();[m
[32m+[m[32m    } catch (err) {[m
[32m+[m[32m      console.error("Errore inserendo giacenza:", err);[m
[32m+[m[32m    }[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const handleUpdate = async (id, updated) => {[m
[32m+[m[32m    try {[m
[32m+[m[32m      await fetch(`http://localhost:3000/api/giacenze/${id}`, {[m
[32m+[m[32m        method: "PUT",[m
[32m+[m[32m        headers: { "Content-Type": "application/json" },[m
[32m+[m[32m        body: JSON.stringify(updated),[m
[32m+[m[32m      });[m
[32m+[m[32m      setEditingId(null);[m
[32m+[m[32m      fetchGiacenze();[m
[32m+[m[32m    } catch (err) {[m
[32m+[m[32m      console.error("Errore modificando giacenza:", err);[m
[32m+[m[32m    }[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  const handleDelete = async (id) => {[m
[32m+[m[32m    try {[m
[32m+[m[32m      await fetch(`http://localhost:3000/api/giacenze/${id}`, {[m
[32m+[m[32m        method: "DELETE",[m
[32m+[m[32m      });[m
[32m+[m[32m      fetchGiacenze();[m
[32m+[m[32m    } catch (err) {[m
[32m+[m[32m      console.error("Errore eliminando giacenza:", err);[m
[32m+[m[32m    }[m
[32m+[m[32m  };[m
[32m+[m
[32m+[m[32m  return ([m
[32m+[m[32m    <div>[m
[32m+[m[32m      <h2>Gestione Giacenze</h2>[m
[32m+[m
[32m+[m[32m      {/* Form inserimento */}[m
[32m+[m[32m      <div style={{ marginBottom: "20px" }}>[m
[32m+[m[32m        <select[m
[32m+[m[32m          value={newGiacenza.cella || ""}[m
[32m+[m[32m          onChange={(e) =>[m
[32m+[m[32m            setNewGiacenza({ ...newGiacenza, cella: e.target.value ? parseInt(e.target.value) : null })[m
[32m+[m[32m          }[m
[32m+[m[32m        >[m
[32m+[m[32m          <option value="">-- Seleziona Cella --</option>[m
[32m+[m[32m          {Array.from({ length: 100 }, (_, i) => ([m
[32m+[m[32m            <option key={i + 1} value={i + 1}>[m
[32m+[m[32m              {i + 1}[m
[32m+[m[32m            </option>[m
[32m+[m[32m          ))}[m
[32m+[m[32m        </select>[m
[32m+[m[32m        <select[m
[32m+[m[32m          value={newGiacenza.temperatura || ""}[m
[32m+[m[32m          onChange={(e) =>[m
[32m+[m[32m            setNewGiacenza({ ...newGiacenza, temperatura: e.target.value || null })[m
[32m+[m[32m          }[m
[32m+[m[32m        >[m
[32m+[m[32m          <option value="">-- Seleziona Temperatura --</option>[m
[32m+[m[32m          <option value="-18°">-18°</option>[m
[32m+[m[32m          <option value="+4°">+4°</option>[m
[32m+[m[32m        </select>[m
[32m+[m[32m        <button onClick={handleInsert}>Inserisci</button>[m
[32m+[m[32m      </div>[m
[32m+[m
[32m+[m[32m      {/* Tabella */}[m
[32m+[m[32m      <table border="1" style={{ width: "100%", marginTop: "20px" }}>[m
[32m+[m[32m        <thead>[m
[32m+[m[32m          <tr>[m
[32m+[m[32m            <th>ID</th>[m
[32m+[m[32m            <th>Data</th>[m
[32m+[m[32m            <th>Cella</th>[m
[32m+[m[32m            <th>Temperatura</th>[m
[32m+[m[32m            <th>QR Code</th>[m
[32m+[m[32m            <th>Azioni</th>[m
[32m+[m[32m          </tr>[m
[32m+[m[32m        </thead>[m
[32m+[m[32m        <tbody>[m
[32m+[m[32m          {giacenze.map((g) => ([m
[32m+[m[32m            <tr key={g.id}>[m
[32m+[m[32m              <td>{g.id}</td>[m
[32m+[m[32m              <td>{g.data}</td> {/* NON modificabile */}[m
[32m+[m[32m              <td>[m
[32m+[m[32m                {editingId === g.id ? ([m
[32m+[m[32m                  <select[m
[32m+[m[32m                    value={g.cella || ""}[m
[32m+[m[32m                    onChange={(e) =>[m
[32m+[m[32m                      setGiacenze((prev) =>[m
[32m+[m[32m                        prev.map((x) =>[m
[32m+[m[32m                          x.id === g.id ? { ...x, cella: e.target.value ? parseInt(e.target.value) : null } : x[m
[32m+[m[32m                        )[m
[32m+[m[32m                      )[m
[32m+[m[32m                    }[m
[32m+[m[32m                  >[m
[32m+[m[32m                    <option value="">-- Seleziona Cella --</option>[m
[32m+[m[32m                    {Array.from({ length: 100 }, (_, i) => ([m
[32m+[m[32m                      <option key={i + 1} value={i + 1}>[m
[32m+[m[32m                        {i + 1}[m
[32m+[m[32m                      </option>[m
[32m+[m[32m                    ))}[m
[32m+[m[32m                  </select>[m
[32m+[m[32m                ) : ([m
[32m+[m[32m                  g.cella[m
[32m+[m[32m                )}[m
[32m+[m[32m              </td>[m
[32m+[m[32m              <td>[m
[32m+[m[32m                {editingId === g.id ? ([m
[32m+[m[32m                  <select[m
[32m+[m[32m                    value={g.temperatura || ""}[m
[32m+[m[32m                    onChange={(e) =>[m
[32m+[m[32m                      setGiacenze((prev) =>[m
[32m+[m[32m                        prev.map((x) =>[m
[32m+[m[32m                          x.id === g.id ? { ...x, temperatura: e.target.value || null } : x[m
[32m+[m[32m                        )[m
[32m+[m[32m                      )[m
[32m+[m[32m                    }[m
[32m+[m[32m                  >[m
[32m+[m[32m                    <option value="">-- Seleziona Temperatura --</option>[m
[32m+[m[32m                    <option value="-18°">-18°</option>[m
[32m+[m[32m                    <option value="+4°">+4°</option>[m
[32m+[m[32m                  </select>[m
[32m+[m[32m                ) : ([m
[32m+[m[32m                  g.temperatura[m
[32m+[m[32m                )}[m
[32m+[m[32m              </td>[m
[32m+[m[32m              <td>{g.qr_code}</td>[m
[32m+[m[32m              <td>[m
[32m+[m[32m                {editingId === g.id ? ([m
[32m+[m[32m                  <>[m
[32m+[m[32m                    <button[m
[32m+[m[32m                      onClick={() =>[m
[32m+[m[32m                        handleUpdate(g.id, {[m
[32m+[m[32m                          cella: g.cella,[m
[32m+[m[32m                          temperatura: g.temperatura,[m
[32m+[m[32m                          qr_code: g.qr_code,[m
[32m+[m[32m                        })[m
[32m+[m[32m                      }[m
[32m+[m[32m                    >[m
[32m+[m[32m                      Salva[m
[32m+[m[32m                    </button>[m
[32m+[m[32m                    <button onClick={() => setEditingId(null)}>Annulla</button>[m
[32m+[m[32m                  </>[m
[32m+[m[32m                ) : ([m
[32m+[m[32m                  <>[m
[32m+[m[32m                    <button onClick={() => setEditingId(g.id)}>Modifica</button>[m
[32m+[m[32m                    <button onClick={() => handleDelete(g.id)}>Elimina</button>[m
[32m+[m[32m                  </>[m
[32m+[m[32m                )}[m
[32m+[m[32m              </td>[m
[32m+[m[32m            </tr>[m
[32m+[m[32m          ))}[m
[32m+[m[32m        </tbody>[m
[32m+[m[32m      </table>[m
[32m+[m[32m    </div>[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
[1mdiff --git a/index.js b/index.js[m
[1mindex 5ae81e6..bdd9606 100644[m
[1m--- a/index.js[m
[1m+++ b/index.js[m
[36m@@ -526,7 +526,78 @@[m [mapp.get("/api/gestione_giornata", async (req, res) => {[m
   }[m
 });[m
 [m
[32m+[m[32m// ------------------- GIACENZE -------------------[m
[32m+[m[32mapp.get("/api/giacenze", async (req, res) => {[m
[32m+[m[32m  try {[m
[32m+[m[32m    const result = await pool.query("SELECT * FROM giacenze ORDER BY id DESC");[m
[32m+[m[32m    res.json(result.rows);[m
[32m+[m[32m  } catch (err) {[m
[32m+[m[32m    console.error(err);[m
[32m+[m[32m    res.status(500).send("Errore caricando giacenze");[m
[32m+[m[32m  }[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32mconst { nanoid } = require("nanoid"); // Assicurati di installarlo: npm install nanoid[m
[32m+[m
[32m+[m[32mapp.post("/api/giacenze", async (req, res) => {[m
[32m+[m[32m  try {[m
[32m+[m[32m    const { cella, temperatura } = req.body;[m
[32m+[m
[32m+[m[32m    // genera QR code univoco (puoi anche concatenare id o altri dati se vuoi)[m
[32m+[m[32m    const qr_code = `GIA-${nanoid(8)}`;[m
[32m+[m
[32m+[m[32m    const result = await pool.query([m
[32m+[m[32m      "INSERT INTO giacenze (cella, temperatura, qr_code) VALUES ($1, $2, $3) RETURNING *",[m
[32m+[m[32m      [cella || null, temperatura || null, qr_code][m
[32m+[m[32m    );[m
 [m
[32m+[m[32m    res.json(result.rows[0]);[m
[32m+[m[32m  } catch (err) {[m
[32m+[m[32m    console.error(err);[m
[32m+[m[32m    res.status(500).send("Errore inserimento giacenza");[m
[32m+[m[32m  }[m
[32m+[m[32m});[m
[32m+[m
[32m+[m[32m// DELETE GIACENZA[m
[32m+[m[32mapp.delete("/api/giacenze/:id", async (req, res) => {[m
[32m+[m[32m  try {[m
[32m+[m[32m    const { id } = req.params;[m
[32m+[m[32m    const result = await pool.query([m
[32m+[m[32m      "DELETE FROM giacenze WHERE id = $1 RETURNING *",[m
[32m+[m[32m      [id][m
[32m+[m[32m    );[m
[32m+[m
[32m+[m[32m    if (result.rowCount === 0) {[m
[32m+[m[32m      return res.status(404).send("Giacenza non trovata");[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    res.json({ message: "Giacenza eliminata con successo" });[m
[32m+[m[32m  } catch (err) {[m
[32m+[m[32m    console.error(err);[m
[32m+[m[32m    res.status(500).send("Errore eliminazione giacenza");[m
[32m+[m[32m  }[m
[32m+[m[32m});[m
[32m+[m[32m// UPDATE GIACENZA[m
[32m+[m[32mapp.put("/api/giacenze/:id", async (req, res) => {[m
[32m+[m[32m  try {[m
[32m+[m[32m    const { id } = req.params;[m
[32m+[m[32m    const { cella, temperatura } = req.body;[m
[32m+[m
[32m+[m[32m    const result = await pool.query([m
[32m+[m[32m      "UPDATE giacenze SET cella = $1, temperatura = $2 WHERE id = $3 RETURNING *",[m
[32m+[m[32m      [cella, temperatura, id][m
[32m+[m[32m    );[m
[32m+[m
[32m+[m[32m    if (result.rowCount === 0) {[m
[32m+[m[32m      return res.status(404).send("Giacenza non trovata");[m
[32m+[m[32m    }[m
[32m+[m
[32m+[m[32m    res.json(result.rows[0]);[m
[32m+[m[32m  } catch (err) {[m
[32m+[m[32m    console.error(err);[m
[32m+[m[32m    res.status(500).send("Errore aggiornamento giacenza");[m
[32m+[m[32m  }[m
[32m+[m[32m});[m
 // avvia il server[m
 app.listen(3000, () => {[m
   console.log('Server in ascolto sulla porta 3000');[m
