// src/VisualizzaAnagrafiche.js
import React, { useState, useEffect } from "react";
import Papa from "papaparse";

const initialForm = {
  azienda: "",
  persona_contatto: "",
  indirizzo1: "",
  indirizzo2: "",
  indirizzo3: "",
  sede: "",
  cap: "",
  citta: "",
  provincia: "",
  stato: "",
  fda_numero: "",
  scadenza_fda: "",
  telefono1: "",
  telefono2: "",
  cell: "",
  email_generale: "",
  email_fatturazione: "",
  email_altro: "",
  partita_iva: "",
  sid: "",
  note: "",
};

const allColumns = [
  { key: "azienda", label: "Azienda" },
  { key: "persona_contatto", label: "Persona di contatto" },
  { key: "indirizzo1", label: "Indirizzo 1" },
  { key: "indirizzo2", label: "Indirizzo 2" },
  { key: "indirizzo3", label: "Indirizzo 3" },
  { key: "sede", label: "Sede" },
  { key: "cap", label: "CAP" },
  { key: "citta", label: "Città" },
  { key: "provincia", label: "Provincia" },
  { key: "stato", label: "Stato" },
  { key: "fda_numero", label: "FDA N°" },
  { key: "scadenza_fda", label: "Scadenza FDA" },
  { key: "telefono1", label: "Telefono 1" },
  { key: "telefono2", label: "Telefono 2" },
  { key: "cell", label: "Cellulare" },
  { key: "email_generale", label: "Email Generale" },
  { key: "email_fatturazione", label: "Email Fatturazione" },
  { key: "email_altro", label: "Email Altro" },
  { key: "partita_iva", label: "P.IVA / Cod. Fiscale" },
  { key: "sid", label: "SID" },
  { key: "note", label: "Note" },
];

export default function VisualizzaAnagrafiche({ token }) {
  const [rows, setRows] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" o "desc"
  const [search, setSearch] = useState("");
  const [filterAzienda, setFilterAzienda] = useState("");
  const [filterSede, setFilterSede] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem("clientiVisibleCols");
    return saved ? JSON.parse(saved) : allColumns.map((c) => c.key);
  });
  const [showColsPanel, setShowColsPanel] = useState(false);

  const toggleColumn = (key) => {
    setVisibleCols((cols) =>
      cols.includes(key) ? cols.filter((c) => c !== key) : [...cols, key]
    );
  };

  useEffect(() => {
    localStorage.setItem("clientiVisibleCols", JSON.stringify(visibleCols));
  }, [visibleCols]);

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowForm(false); // 👈 chiude anche il form
  };

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterAzienda) params.append("azienda", filterAzienda);
      if (filterSede) params.append("sede", filterSede);
      const url = `http://localhost:3000/clienti?${params.toString()}`;
   try {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // ✅ Ordina per nome azienda (case insensitive) secondo sortOrder
  const ordinati = [...data].sort((a, b) =>
    (a.azienda || "").localeCompare(b.azienda || "", "it", { sensitivity: "base" })
  );
  if (sortOrder === "desc") ordinati.reverse();

  setRows(ordinati);
} catch (err) {
  console.error("Errore fetch clienti:", err);
}


    }
    if (token) load();
  }, [token, search, filterAzienda, filterSede]);

  const visibleRows = rows.filter((r) =>
    r.azienda.toLowerCase().includes(search.toLowerCase())
  );

  const salva = async (e) => {
    e.preventDefault();
    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId
      ? `http://localhost:3000/clienti/${editingId}`
      : "http://localhost:3000/clienti";

    const payload = { ...form };

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Errore salva");

      if (editingId) {
        setRows(rows.map((r) =>
          r.id_cliente === editingId ? { ...r, ...payload } : r
        ));
      } else {
        const created = await res.json();
        setRows([...rows, created]);
      }
      resetForm();
      setShowForm(false); // 👈 CHIUSURA AUTOMATICA FORM
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  };

  const elimina = async (id) => {
    if (!window.confirm("Confermi cancellazione?")) return;
    try {
      const res = await fetch(`http://localhost:3000/clienti/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Errore delete");
      setRows(rows.filter((r) => r.id_cliente !== id));
      setSelectedIds((s) => {
        s.delete(id);
        return new Set(s);
      });
      resetForm();
    } catch (err) {
      console.error(err);
      alert("❌ " + err.message);
    }
  };

  const exportCsv = (all = false) => {
    const data = (all
      ? rows
      : visibleRows.filter((r) => selectedIds.has(r.id_cliente))
    ).map(({ id_cliente, ...rest }) => rest);
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clienti.csv";
    a.click();
  };

  const importCsv = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        await fetch("http://localhost:3000/clienti/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        const res = await fetch("http://localhost:3000/clienti", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRows(await res.json());
        resetForm();
      },
    });
  };

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
        maxWidth: "1200px",
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
        🧾 Gestione Anagrafiche
      </h1>

      {/* --- FILTRI E RICERCA --- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="🔍 Cerca azienda…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
            fontSize: "16px",
          }}
        />
        <input
          placeholder="Filtro sede"
          value={filterSede}
          onChange={(e) => setFilterSede(e.target.value)}
          style={{
            flex: 0.5,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />
        <input
          placeholder="Filtro azienda"
          value={filterAzienda}
          onChange={(e) => setFilterAzienda(e.target.value)}
          style={{
            flex: 0.5,
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* --- EXPORT / IMPORT --- */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => exportCsv(true)}
          style={{
            backgroundColor: "#1976D2",
            color: "white",
            border: "none",
            borderRadius: "30px",
            padding: "10px 18px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
          }}
        >
          Esporta TUTTO CSV
        </button>

        <button
          onClick={() => exportCsv(false)}
          style={{
            backgroundColor: "#0288D1",
            color: "white",
            border: "none",
            borderRadius: "30px",
            padding: "10px 18px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
          }}
        >
          Esporta SELEZIONATI
        </button>

   <div style={{ position: "relative", overflow: "hidden", display: "inline-block" }}>
  <button
    style={{
      backgroundColor: "#43A047",
      color: "white",
      border: "none",
      borderRadius: "30px",
      padding: "10px 20px",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
    }}
  >
    💾 Importa CSV
  </button>
  <input
    type="file"
    accept=".csv"
    onChange={(e) => importCsv(e.target.files[0])}
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      opacity: 0,
      width: "100%",
      height: "100%",
      cursor: "pointer",
    }}
  />
</div>

      </div>

      {/* --- PANNELLO COLONNE --- */}
      <button
        onClick={() => setShowColsPanel((v) => !v)}
        style={{
          backgroundColor: "#8E24AA",
          color: "white",
          border: "none",
          borderRadius: "30px",
          padding: "10px 20px",
          cursor: "pointer",
          fontWeight: "bold",
          marginBottom: 15,
          boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
        }}
      >
        {showColsPanel ? "Nascondi colonne" : "Personalizza colonne"}
      </button>

      {/* --- PULSANTE FORM --- */}
      <div style={{ textAlign: "center", marginBottom: 25 }}>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            backgroundColor: showForm ? "#9e9e9e" : "#145374",
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
          {showForm
            ? "Nascondi form anagrafica"
            : editingId
            ? "Modifica anagrafica"
            : "➕ Crea nuova anagrafica"}
        </button>
      </div>

      {/* --- FORM A SCOMPARSA --- */}
      {showForm && (
        <div
          style={{
            marginBottom: 30,
            padding: 20,
            borderRadius: "15px",
            background: "#f9f9f9",
            border: "1px solid #ccc",
            boxShadow: "inset 0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#145374",
              textAlign: "center",
            }}
          >
            {editingId ? "✏️ Modifica anagrafica" : "➕ Nuova anagrafica"}
          </h3>

          <form onSubmit={salva} style={{ display: "grid", gap: 8 }}>
            {/* --- BOTTONI IN ALTO --- */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 15,
                marginBottom: 10,
              }}
            >
              <button
                type="submit"
                style={{
                  backgroundColor: "#145374",
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
              {editingId && (
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
              )}
            </div>

            {/* --- QUI RESTANO I TUOI INPUT --- */}
            <input placeholder="Azienda *" value={form.azienda} onChange={(e) => setForm({ ...form, azienda: e.target.value })} required />
            <input placeholder="Persona di contatto" value={form.persona_contatto} onChange={(e) => setForm({ ...form, persona_contatto: e.target.value })} />
            <input placeholder="Indirizzo 1" value={form.indirizzo1} onChange={(e) => setForm({ ...form, indirizzo1: e.target.value })} />
            <input placeholder="Indirizzo 2" value={form.indirizzo2} onChange={(e) => setForm({ ...form, indirizzo2: e.target.value })} />
            <input placeholder="Indirizzo 3" value={form.indirizzo3} onChange={(e) => setForm({ ...form, indirizzo3: e.target.value })} />

            <div>
              <label>Sede</label>
              <select value={form.sede} onChange={(e) => setForm({ ...form, sede: e.target.value })} required>
                <option value="" disabled>
                  -- seleziona sede --
                </option>
                <option value="LEGALE">LEGALE</option>
                <option value="OPERATIVA">OPERATIVA</option>
                <option value="ALTRO">ALTRO</option>
              </select>
            </div>

            <input placeholder="CAP" value={form.cap} onChange={(e) => setForm({ ...form, cap: e.target.value })} />
            <input placeholder="Città" value={form.citta} onChange={(e) => setForm({ ...form, citta: e.target.value })} />
            <input placeholder="Provincia" value={form.provincia} onChange={(e) => setForm({ ...form, provincia: e.target.value })} />
            <input placeholder="Stato" value={form.stato} onChange={(e) => setForm({ ...form, stato: e.target.value })} />
            <input placeholder="FDA N°" value={form.fda_numero} onChange={(e) => setForm({ ...form, fda_numero: e.target.value })} />
            <input type="date" placeholder="Scadenza FDA" value={form.fda_scadenza} onChange={(e) => setForm({ ...form, fda_scadenza: e.target.value })} />
            <input placeholder="Telefono 1" value={form.telefono1} onChange={(e) => setForm({ ...form, telefono1: e.target.value })} />
            <input placeholder="Telefono 2" value={form.telefono2} onChange={(e) => setForm({ ...form, telefono2: e.target.value })} />
            <input placeholder="Cellulare" value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} />
            <input placeholder="Email Generale" value={form.email_generale} onChange={(e) => setForm({ ...form, email_generale: e.target.value })} />
            <input placeholder="Email Fatturazione" value={form.email_fatturazione} onChange={(e) => setForm({ ...form, email_fatturazione: e.target.value })} />
            <input placeholder="Email Altro" value={form.email_altro} onChange={(e) => setForm({ ...form, email_altro: e.target.value })} />
            <input placeholder="P.IVA / Cod. Fiscale" value={form.partita_iva} onChange={(e) => setForm({ ...form, partita_iva: e.target.value })} />
            <input placeholder="SID" value={form.sid} onChange={(e) => setForm({ ...form, sid: e.target.value })} />
            <textarea placeholder="Note" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </form>
        </div>
      )}

      {/* --- PANNELLO COLONNE --- */}
      {showColsPanel && (
        <div
          style={{
            padding: 8,
            border: "1px solid #ccc",
            marginBottom: 20,
            background: "#f9f9f9",
            borderRadius: "8px",
          }}
        >
          {allColumns.map((col) => (
            <label key={col.key} style={{ display: "inline-block", width: 180 }}>
              <input
                type="checkbox"
                checked={visibleCols.includes(col.key)}
                onChange={() => toggleColumn(col.key)}
              />{" "}
              {col.label}
            </label>
          ))}
        </div>
      )}

      {/* --- TABELLA --- */}
      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <thead style={{ backgroundColor: "#145374", color: "white" }}>
            <tr>
              <th>Azioni</th>
              <th>
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(visibleRows.map((r) => r.id_cliente)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }}
                />
              </th>
              {allColumns
  .filter((col) => visibleCols.includes(col.key))
  .map((col) => (
    <th
      key={col.key}
      onClick={() => {
        if (col.key === "azienda") {
          const newOrder = sortOrder === "asc" ? "desc" : "asc";
          setSortOrder(newOrder);
          setRows((prev) => {
            const sorted = [...prev].sort((a, b) =>
              (a.azienda || "").localeCompare(b.azienda || "", "it", { sensitivity: "base" })
            );
            if (newOrder === "desc") sorted.reverse();
            return sorted;
          });
        }
      }}
      style={{
        cursor: col.key === "azienda" ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      {col.label}
      {col.key === "azienda" && (sortOrder === "asc" ? " 🔼" : " 🔽")}
    </th>
  ))}

            </tr>
          </thead>
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((r) => (
                <tr
                  key={r.id_cliente}
                  style={{ transition: "background 0.2s" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = "#f1f8e9")}
                  onMouseOut={(e) => (e.currentTarget.style.background = "white")}
                >
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => {
                        setEditingId(r.id_cliente);
                        setForm({ ...form, ...r });
                        setShowForm(true);
                      }}
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
                      onClick={() => elimina(r.id_cliente)}
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
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id_cliente)}
                      onChange={(e) => {
                        const s = new Set(selectedIds);
                        e.target.checked ? s.add(r.id_cliente) : s.delete(r.id_cliente);
                        setSelectedIds(s);
                      }}
                    />
                  </td>
                  {allColumns
                    .filter((col) => visibleCols.includes(col.key))
                    .map((col) => (
                      <td key={col.key}>{r[col.key]}</td>
                    ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleCols.length + 2} style={{ textAlign: "center" }}>
                  Nessuna anagrafica trovata
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
