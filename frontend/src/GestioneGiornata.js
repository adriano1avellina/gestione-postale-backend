// src/GestioneGiornata.js
import React, { useEffect, useMemo, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "./GestioneGiornata.css";

const API = process.env.REACT_APP_API;
export default function GestioneGiornata({ token, utente, setVista }) {
  console.log("Utente loggato:", utente);
  // ------------------- STATE -------------------
  
  // stato per tracciare quali righe hanno il pannello di formattazione aperto
  const [formatRighe, setFormatRighe] = useState({}); // stato per stile riga
  const [rigaEditOpen, setRigaEditOpen] = useState({});
  const [righe, setRighe] = useState([]);
  const cycleColor = (id) => {
  setFormatRighe(prev => {
    const current = prev[id]?.color || "black";
    let next;
    if (current === "black") next = "red";
    else if (current === "red") next = "white";
    else next = "black";
    return {
      ...prev,
      [id]: { ...prev[id], color: next }
    };
  });
};

  // Per gestione selezione righe Label
const [righeSelezionate, setRigheSelezionate] = useState({});
const [showLabel, setShowLabel] = useState(false);

const toggleSelezioneRiga = (id) => {
  setRigheSelezionate(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};
// ✅ Seleziona tutte le righe visibili (filtrate)
const selezionaTutte = () => {
  const tutte = {};
  righeFiltrate.forEach(r => {
    tutte[r.id] = true;
  });
  setRigheSelezionate(tutte);
};

// ✅ Deseleziona tutte
const deselezionaTutte = () => {
  setRigheSelezionate({});
};

const stampaEtichette = () => {
  const selezionate = righeFiltrate.filter(r => righeSelezionate[r.id]);
  if (selezionate.length === 0) {
    alert("Nessuna riga selezionata!");
    return;
  }

  // recupero i CANVAS già renderizzati e li trasformo in <img src="data:...">
  const qrImgs = {};
  selezionate.forEach(r => {
    const canvas = document.querySelector(`[data-qr-id="${r.id}"] canvas`);
    if (canvas) {
      try {
        qrImgs[r.id] = canvas.toDataURL("image/png"); // base64 pronto da stampare
      } catch (e) {
        console.error("Errore toDataURL per id", r.id, e);
      }
    }
  });

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const contenuto = `
    <html>
      <head>
        <title>Etichette</title>
        <style>
          @page { margin: 10mm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
          .etichetta {
            width: 15cm; height: 10cm;
            border: 1px solid #000;
            margin: 0 0 10px 0;
            padding: 10px;
            box-sizing: border-box;
            position: relative;
            break-after: page;       /* una etichetta per pagina */
          }
          .etichetta:last-child { break-after: auto; } /* evita pagina bianca finale */
          .qr { position: absolute; top: 10px; right: 10px; }
          img { display: block; }
        </style>
      </head>
      <body>
        ${selezionate.map(r => `
          <div class="etichetta">
            <div class="qr">
              ${qrImgs[r.id] ? `<img src="${qrImgs[r.id]}" width="120" height="120" />` : ""}
            </div>
            <p><b>Mittente:</b> ${r.mittente || ""}</p>
            <p><b>Destinazione:</b> ${r.destinazione || ""}</p>
            <p><b>Stato:</b> ${r.stato || ""}</p>
            <p><b>Note:</b> ${r.note_2 || ""}</p>
          </div>
        `).join("")}
      </body>
    </html>
  `;

  printWindow.document.write(contenuto);
  printWindow.document.close();

  // attendo caricamento immagini base64 prima di lanciare la stampa
  const imgs = printWindow.document.images;
  if (imgs.length) {
    let loaded = 0;
    Array.from(imgs).forEach(img => {
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === imgs.length) {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      };
    });
  } else {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
};

  const [clienti, setClienti] = useState([]);
  const [zonario, setZonario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dryIceOpen, setDryIceOpen] = useState(false);

  const iniziale = {
    doc: false,
    fatta: false,
    data: "",
    g_sett: "",
    note_1: "",
    mittente: "",
    cella: "",
    n_camp: "",
    stato: "",
    destinazione: "",
    vettore: "",
    ghiaccio: "",
    note_2: "",
    costo: "",
    imb: "",
    trk: "",
    utente: utente || "",
    qr_code: "",
  };
  const [form, setForm] = useState(iniziale);

  // Inserimento rapido cliente
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickCliente, setQuickCliente] = useState({ azienda: "", sede: "" });

  // Filtri
  const [filtroData, setFiltroData] = useState("");
  const [filtroMittente, setFiltroMittente] = useState("");
  const [filtroCella, setFiltroCella] = useState("");
  const stampaGiornata = () => {
  // Genera HTML della tabella con le colonne richieste
  const tableHtml = `
    <html>
      <head>
        <title>Giornata</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid black; padding: 6px; text-align: left; }
          th { background-color: #eee; }
        </style>
      </head>
      <body>
        <h2>Giornata</h2>
        <table>
          <thead>
            <tr>
              <th>Mittente</th>
              <th>Stato</th>
              <th>Destinazione</th>
              <th>Vettore</th>
              <th>Note 1</th>
              <th>Ghiaccio</th>
              <th>Note 2</th>
            </tr>
          </thead>
          <tbody>
            ${righeFiltrate.map(r => `
              <tr>
                <td>${r.mittente || ""}</td>
                <td>${r.stato || ""}</td>
                <td>${r.destinazione || ""}</td>
                <td>${r.vettore || ""}</td>
                <td>${r.note_1 || ""}</td>
                <td>${r.ghiaccio || ""}</td>
                <td>${r.note_2 || ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Apri nuova finestra e stampa
  const win = window.open("", "_blank");
  win.document.write(tableHtml);
  win.document.close();
  win.print();
};

  //QRCODE RANDOM
  const generaQRCodeUnivoco = () => {
  return "QR" + Math.random().toString(36).substring(2, 8).toUpperCase();
};

const [celle, setCelle] = useState([]);

// --- INLINE EDITING: map id -> bozza della riga ---
const [inlineEdits, setInlineEdits] = useState({}); // { [id]: { ...campi } }
const [savingInline, setSavingInline] = useState({}); // { [id]: true/false }

const startInlineEdit = (row) => {
  setInlineEdits(prev => ({ ...prev, [row.id]: { ...row } }));
};

const cancelInlineEdit = (id) => {
  setInlineEdits(prev => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });
};

const updateInlineField = (id, field, value) => {
  setInlineEdits(prev => ({
    ...prev,
    [id]: { ...prev[id], [field]: value }
  }));
};

const saveInlineEdit = async (id) => {
  const draft = inlineEdits[id];
  if (!draft) return;

  // semplice validazione lato client
  if (!draft.mittente || !String(draft.mittente).trim()) {
    alert("Il campo MITTENTE è obbligatorio");
    return;
  }

  setSavingInline(prev => ({ ...prev, [id]: true }));

  try {
    // prendi la riga originale per fallback (assicurare tutti i campi nel payload)
    const original = righe.find(r => r.id === id) || {};

    const payload = {
      // costruisci payload completo nello stesso ordine atteso dal backend
      doc: draft.doc ?? original.doc ?? false,
      fatta: draft.fatta ?? original.fatta ?? false,
      data: draft.data ?? original.data ?? null,
      g_sett: calcolaGSett(draft.data ?? original.data ?? "") || null,
      note_1: draft.note_1 ?? original.note_1 ?? "",
      mittente: draft.mittente ?? original.mittente ?? "",
      n_camp: draft.n_camp ?? original.n_camp ?? "",
      stato: draft.stato ?? original.stato ?? "",
      destinazione: draft.destinazione ?? original.destinazione ?? "",
      vettore: draft.vettore ?? original.vettore ?? "",
      ghiaccio: draft.ghiaccio ?? original.ghiaccio ?? "",
      note_2: draft.note_2 ?? original.note_2 ?? "",
      costo: draft.costo ?? original.costo ?? 0,
      imb: draft.imb ?? original.imb ?? "",
      trk: draft.trk ?? original.trk ?? "",
      utente: draft.utente ?? original.utente ?? utente,
      qr_code: draft.qr_code ?? original.qr_code ?? generaQRCodeUnivoco(),
      cella: draft.cella ?? original.cella ?? ""
    };

    const res = await fetch(`${process.env.REACT_APP_API}/api/gestione_giornata/${id}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }

    // ricarica dati (puoi ottimizzare aggiornando solo la riga,
    // ma fetchTutto mantiene mapping/formattazioni esistenti)
    await fetchTutto();
    // remove draft
    cancelInlineEdit(id);
  } catch (err) {
    console.error("Errore salvataggio inline:", err);
    alert("Errore nel salvataggio inline. Controlla console.");
  } finally {
    setSavingInline(prev => ({ ...prev, [id]: false }));
  }
};


// ------------------- UTILS -------------------
const authHeaders = token
  ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
  : { "Content-Type": "application/json" };

// Ritorna YYYY-MM-DD "puro" senza shift
const toLocalYMD = (isoString) => {
  if (!isoString) return "";
  const [anno, mese, giorno] = isoString.split("T")[0].split("-");
  return `${anno}-${mese}-${giorno}`;
};

// Formatta YYYY-MM-DD → GG/MM/AA (per visualizzazione tabella)
const formattaData = (yyyyMMdd) => {
  if (!yyyyMMdd) return "";
  const [anno, mese, giorno] = yyyyMMdd.split("-");
  return `${giorno}/${mese}/${anno.slice(-2)}`;
};

// Calcola giorno della settimana da YYYY-MM-DD senza usare UTC
const calcolaGSett = (yyyyMMdd) => {
  if (!yyyyMMdd) return "";
  const giorni = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
  const [anno, mese, giorno] = yyyyMMdd.split("-").map(Number);
  const d = new Date(anno, mese - 1, giorno, 12, 0, 0); // ora 12 → niente shift
  return giorni[d.getDay()];
};


  // ------------------- FETCH -------------------
  const fetchTutto = async () => {
    setLoading(true);
    try {
      console.log("🔄 Carico gestione_giornata, clienti, zonario...");
      const [r1, r2, r3] = await Promise.all([
         fetch(`${process.env.REACT_APP_API}/api/gestione_giornata`, { headers: authHeaders }),
         fetch(`${process.env.REACT_APP_API}/clienti`, { headers: authHeaders }),
        fetch(`${process.env.REACT_APP_API}/api/zonario`, { headers: authHeaders }),
      ]);

      if (!r1.ok || !r2.ok || !r3.ok) {
        throw new Error(
          `HTTP non OK: gg=${r1.status} clienti=${r2.status} zonario=${r3.status}`
        );
      }

      const [gg, cl, zn] = await Promise.all([r1.json(), r2.json(), r3.json()]);
      console.log("✅ Dati caricati:", { gg, cl, zn });

      // mappa i dati
let mapped = Array.isArray(gg)
  ? gg.map((r) => ({
      ...r,
      data: r.data || "",                          // es. "2025-10-23"
      dataDisplay: r.data ? formattaData(r.data) : "",  // es. "23/10/25"
    }))
  : [];


// ordina per data DESC (più recente prima) e mittente ASC
mapped.sort((a, b) => {
  if (a.data === b.data) return (a.mittente || "").localeCompare(b.mittente || "");
  return b.data.localeCompare(a.data);
});

// assegna alla state
setRighe(mapped);


      setClienti(Array.isArray(cl) ? cl : []);
      setZonario(Array.isArray(zn) ? zn : []);
    } catch (e) {
      console.error("❌ Errore fetchTutto:", e);
      alert("Errore nel caricamento dati. Controlla console.");
    } finally {
      setLoading(false);
    }
  };
const fetchCelle = async () => {
  try {
    const res = await fetch(`${process.env.REACT_APP_API}/api/celle`, { headers: authHeaders });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setCelle(data);
  } catch (err) {
    console.error("❌ Errore caricando celle:", err);
  }
};
  useEffect(() => {
  fetchTutto();
  fetchCelle();  // 👈 aggiunto qui
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [token]);

useEffect(() => {
  const interval = setInterval(() => {
    fetchTutto();
    fetchCelle();  // 👈 aggiunto qui
    console.log("🔄 Aggiornamento automatico tabella");
  }, 30000);
  return () => clearInterval(interval);
}, [token]);


  // ------------------- CRUD -------------------
  const resetForm = () => {
    setEditingId(null);
    setForm({ ...iniziale });
    setShowForm(false);
  };

  const apriNuovo = () => {
  setEditingId(null);
  setForm({ ...iniziale, utente }); // utente loggato
  setShowForm(true);
};


  const apriModifica = (r) => {
    setEditingId(r.id);
    // mappa 1:1 (backend restituisce campi minuscoli)
    setForm({
      doc: !!r.doc,
      fatta: !!r.fatta,
      data: r.data || "", // r.data è già YYYY-MM-DD
      g_sett: r.g_sett || "",
      note_1: r.note_1 || "",
      mittente: r.mittente || "",
      cella: r.cella || "",
      n_camp: r.n_camp ?? "",
      stato: r.stato || "",
      destinazione: r.destinazione || "",
      vettore: r.vettore || "",
      ghiaccio: r.ghiaccio ?? "",
      note_2: r.note_2 || "",
      costo: r.costo ?? "",
      imb: r.imb ?? "",
      trk: r.trk || "",
      utente: r.utente || r.utente, // mantiene il valore originale
      qr_code: r.qr_code || "",
    });
    setShowForm(true);
  };

  const salva = async (e) => {
  e?.preventDefault?.();

  if (!form.mittente || !String(form.mittente).trim()) {
    alert("Il campo MITTENTE è obbligatorio ❌");
    return;
  }

  // normalizza la data in YYYY-MM-DD
  const dataNorm = form.data ? toLocalYMD(form.data) : null;

  // calcola giorno della settimana
  const gSett = calcolaGSett(dataNorm);

  // payload puro senza oggetti Date
const payload = {
  ...form,
  g_sett: calcolaGSett(form.data), // YYYY-MM-DD puro
  utente: utente,
  data: form.data || null,          // YYYY-MM-DD puro
  qr_code: editingId ? form.qr_code : generaQRCodeUnivoco(), // genera solo se nuova riga
};

  console.log("📌 Payload inviato:", payload);

  try {
    const url = editingId
      ? `${process.env.REACT_APP_API}/api/gestione_giornata/${editingId}`
  : `${process.env.REACT_APP_API}/api/gestione_giornata`;

    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: authHeaders,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status} - ${errText}`);
    }

    const saved = await res.json();

// mappo come in fetchTutto
// calcolo il giorno della settimana subito dal form
const ymd = form.data || ""; // YYYY-MM-DD dal form
const gSett = calcolaGSett(ymd);

const savedMapped = {
  ...saved,
  data: ymd,                             // dal form
  dataDisplay: ymd ? formattaData(ymd) : "",
  g_sett: gSett,                         // giorno della settimana subito
};

if (editingId) {
  setRighe((prev) => {
    const updated = prev.map((r) => (r.id === editingId ? savedMapped : r));
    // ordina per data DESC e mittente ASC
    updated.sort((a, b) => {
      if (a.data === b.data) return (a.mittente || "").localeCompare(b.mittente || "");
      return b.data.localeCompare(a.data);
    });
    return updated;
  });
} else {
  setRighe((prev) => {
    const updated = [...prev, savedMapped];
    updated.sort((a, b) => {
      if (a.data === b.data) return (a.mittente || "").localeCompare(b.mittente || "");
      return b.data.localeCompare(a.data);
    });
    return updated;
  });
}

resetForm();

  } catch (err) {
    console.error("❌ Errore nel salvataggio:", err);
    alert("Errore nel salvataggio (frontend). Controlla console.");
  }
};

// ------------------- DUPLICA RIGA (con salvataggio in DB) -------------------
const duplicaRiga = async (r) => {
  try {
    const nuovo = {
      ...r,
      id: undefined,                  // lascio che il DB generi un nuovo ID
      qr_code: generaQRCodeUnivoco(), // nuovo QR univoco
    };

    const res = await fetch(`${process.env.REACT_APP_API}/api/gestione_giornata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuovo),
    });

    if (!res.ok) throw new Error("Errore duplicazione riga");

    // ricarico i dati dal DB (così hai la riga appena duplicata)
    fetchTutto();
  } catch (err) {
    console.error("Errore duplicando la riga:", err);
  }
};



  const elimina = async (id) => {
    if (!window.confirm("Confermi cancellazione?")) return;
    try {
      console.log("🗑️ DELETE", id);
      const res = await fetch(`${process.env.REACT_APP_API}/api/gestione_giornata/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRighe((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error("❌ Errore eliminazione:", e);
      alert("Errore nella cancellazione. Controlla console.");
    }
  };
  const togglePanel = (id) => {
  setRigaEditOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ------------------- QUICK ADD CLIENTE -------------------
  const apriQuickAdd = () => {
    setQuickCliente({ azienda: form.mittente || "", sede: "" });
    setQuickAddOpen(true);
  };

  const salvaQuickCliente = async () => {
    if (!quickCliente.azienda || !quickCliente.sede) {
      alert("Inserisci almeno AZIENDA e SEDE per il cliente.");
      return;
    }


const toggleBold = (id) => {
  setFormatRighe(prev => ({
    ...prev,
    [id]: {
      ...prev[id],
      bold: !prev[id]?.bold
    }
  }));
};

const toggleStrike = (id) => {
  setFormatRighe(prev => ({
    ...prev,
    [id]: {
      ...prev[id],
      strike: !prev[id]?.strike
    }
  }));
};

const increaseFont = (id) => {
  setFormatRighe(prev => ({
    ...prev,
    [id]: {
      ...prev[id],
      fontSize: (prev[id]?.fontSize || 14) + 2
    }
  }));
};
const decreaseFont = (id) => {
  setFormatRighe(f => ({
    ...f,
    [id]: {
      ...f[id],
      fontSize: Math.max(8, (f[id]?.fontSize || 14) - 1) // minimo 8px
    }
  }));
};

const changeColor = (id, color) => {
  setFormatRighe(prev => ({
    ...prev,
    [id]: {
      ...prev[id],
      color
    }
  }));
};



    try {
      console.log("👤 QuickAdd cliente:", quickCliente);
      const res = await fetch(`${process.env.REACT_APP_API}/clienti`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          azienda: quickCliente.azienda,
          sede: quickCliente.sede,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} - ${t}`);
      }
      const nuovo = await res.json();
      // backend nostro di prima restituiva la riga intera o almeno *; se non lo fa, rilanciare fetch clienti
      await fetchTutto();
      setForm((f) => ({ ...f, mittente: quickCliente.azienda }));
      setQuickAddOpen(false);
      console.log("✅ Cliente inserito:", nuovo);
    } catch (e) {
      console.error("❌ Errore quick-add cliente:", e);
      alert("Errore inserimento cliente rapido. Controlla console.");
    }
  };

// COLORI PER GIORNO DELLA SETTIMANA (tenui)
const coloriGiorni = {
  "LUN": "#E3F2FD", // azzurro chiaro
  "MAR": "#E8F5E9", // verde chiaro
  "MER": "#FFF3E0", // arancio chiaro
  "GIO": "#F3E5F5", // viola chiaro
  "VEN": "#FFEBEE", // rosa chiaro
  "SAB": "#E0F7FA", // turchese chiaro
  "DOM": "#FFFDE7", // giallo chiaro
};
const toggleBold = (id) => {
  setFormatRighe(f => ({
    ...f,
    [id]: { ...f[id], bold: !f[id]?.bold }
  }));
};

const toggleStrike = (id) => {
  setFormatRighe(f => ({
    ...f,
    [id]: { ...f[id], strike: !f[id]?.strike }
  }));
};

const increaseFont = (id) => {
  setFormatRighe(f => ({
    ...f,
    [id]: { ...f[id], fontSize: (f[id]?.fontSize || 14) + 1 }
  }));
};

const changeColor = (id, color) => {
  setFormatRighe(f => ({
    ...f,
    [id]: { ...f[id], color }
  }));
};
  const decreaseFont = (id) => {
  setFormatRighe(f => ({
    ...f,
    [id]: {
      ...f[id],
      fontSize: Math.max(8, (f[id]?.fontSize || 14) - 1) // minimo 8px
    }
  }));
};

  // ------------------- FILTRI -------------------
 const righeFiltrate = useMemo(() => {
  return righe.filter((r) => {
    const okData = !filtroData || (r.data || "").startsWith(filtroData);
    const okMitt = !filtroMittente || (r.mittente || "") === filtroMittente;
    const okCella = !filtroCella || (r.cella || "").toLowerCase().includes(filtroCella.toLowerCase());
    return okData && okMitt && okCella;
  });
}, [righe, filtroData, filtroMittente, filtroCella]);

const dryIceData = useMemo(() => {
  const oggi = new Date();
  const giorniSettimana = [];
  let giornoCorrente = new Date(oggi);
  let count = 0;

  while (giorniSettimana.length < 7) {
    const day = giornoCorrente.getDay(); // 0=DOM, 6=SAB
    if (day !== 0 && day !== 6) { // escludi sab e dom
      const y = giornoCorrente.getFullYear();
      const m = String(giornoCorrente.getMonth() + 1).padStart(2, "0");
      const d = String(giornoCorrente.getDate()).padStart(2, "0");
      const dataStr = `${y}-${m}-${d}`;
      const gSett = calcolaGSett(dataStr);
      const sommaGhiaccio = righe
        .filter(r => r.data === dataStr)
        .reduce((acc, r) => acc + (Number(r.ghiaccio) || 0), 0);
      giorniSettimana.push({ data: dataStr, gSett, sommaGhiaccio });
    }
    giornoCorrente.setDate(giornoCorrente.getDate() + 1);
    count++;
    if (count > 14) break;
  }

  const settimanaNumero = (d => {
    const dCopy = new Date(d.getTime());
    dCopy.setHours(0,0,0,0);
    dCopy.setDate(dCopy.getDate() + 4 - (dCopy.getDay()||7));
    const yearStart = new Date(dCopy.getFullYear(),0,1);
    return Math.ceil((((dCopy - yearStart) / 86400000) + 1)/7);
  })(oggi);

  return { giorniSettimana, settimanaNumero };
}, [righe]);

  // ------------------- RENDER -------------------
 return (
  <div className="gestione-giornata-fullscreen">
    <header className="gestione-giornata-header">
      📦 Gestione Giornata
      <button
        className="btn-indietro"
        onClick={() => setVista("dashboard")}
      >
        ⬅️ Indietro
      </button>
    </header>

    <main className="gestione-giornata-main">

    {/* === FILTRI ELEGANTI === */}
<div className="filter-bar">
  <div className="filter-item">
    <label>Filtro Data</label>
    <input
      type="date"
      value={filtroData}
      onChange={(e) => setFiltroData(e.target.value)}
      className="filter-input"
    />
  </div>

  <div className="filter-item">
    <label>Filtro Mittente</label>
    <select
      value={filtroMittente}
      onChange={(e) => setFiltroMittente(e.target.value)}
      className="filter-input"
    >
      <option value="">-- Tutti --</option>
      {clienti.map((c) => (
        <option
          key={`${c.id_cliente || c.id || c.azienda}-${c.sede || ""}`}
          value={c.azienda}
        >
          {c.azienda}
        </option>
      ))}
    </select>
  </div>

  <div className="filter-item">
    <label>Filtro Cella</label>
    <input
      type="text"
      value={filtroCella}
      onChange={(e) => setFiltroCella(e.target.value)}
      placeholder="Inserisci cella"
      className="filter-input"
    />
  </div>

  <button
    className="filter-clear-btn"
    onClick={() => {
      setFiltroData("");
      setFiltroMittente("");
      setFiltroCella("");
    }}
  >
    ❌ Pulisci filtri
  </button>
</div>


      {/* AZIONI */}
   <div style={{ margin: "12px 0", textAlign: "center", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
  <button className="gestione-giornata-btn green" onClick={() => setShowForm(!showForm)}>
    {showForm ? "Nascondi form" : "➕ Nuova riga"}
  </button>
  <button className="gestione-giornata-btn blue" onClick={fetchTutto}>
    🔄 Aggiorna ora
  </button>
  <button className="gestione-giornata-btn purple" onClick={() => setDryIceOpen(prev => !prev)}>
    ❄️ Dry Ice
  </button>
  <button className="gestione-giornata-btn red" onClick={stampaEtichette}>
    🏷️ Etichette
  </button>
  <button className="gestione-giornata-btn blue" onClick={selezionaTutte}>
    ✅ Seleziona Tutte
  </button>
  <button className="gestione-giornata-btn purple" onClick={deselezionaTutte}>
    🚫 Deseleziona Tutte
  </button>
  <button className="gestione-giornata-btn green" onClick={stampaGiornata}>
    🗓️ Stampa Giornata
  </button>
</div>

{/* TABELLA DRY ICE */}
{dryIceOpen && (
  <div className="dry-ice-wrapper">
    <h4 className="dry-ice-title">SETTIMANA {dryIceData.settimanaNumero}</h4>
    <table className="dry-ice-table">
      <thead>
        <tr>
          <th>Giorno</th>
          <th>Data</th>
          <th>Somma Ghiaccio</th>
        </tr>
      </thead>
      <tbody>
        {dryIceData.giorniSettimana.map((g, idx) => (
          <tr key={idx} className={`riga-gsett-${g.gSett || ""}`}>
            <td>{g.gSett}</td>
            <td>{formattaData(g.data)}</td>
            <td>{g.sommaGhiaccio}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

{/* FORM A SCOMPARSA */}
{showForm && (
  <form
    onSubmit={salva}
    className="form-scomparsa"
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
    }}
  >
    {/* COLONNA 1 */}
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <label>
        DATA
        <input
          type="date"
          value={form.data || ""}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
          className="input-style"
        />
      </label>

      <label>
        MITTENTE *
        <div style={{ display: "flex", gap: "6px" }}>
          <select
            value={form.mittente || ""}
            onChange={(e) => setForm({ ...form, mittente: e.target.value })}
            className="input-style"
            style={{ flex: 1 }}
          >
            <option value="">-- Seleziona --</option>
            {clienti.map((c) => (
              <option
                key={`${c.id_cliente || c.id || c.azienda}-${c.sede || ""}`}
                value={c.azienda}
              >
                {c.azienda}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="gestione-giornata-btn blue"
            onClick={apriQuickAdd}
          >
            + Nuovo
          </button>
        </div>
      </label>

      <label>
        CELLA
        <select
          value={form.cella || ""}
          onChange={(e) => setForm({ ...form, cella: e.target.value })}
          className="input-style"
        >
          <option value="">-- Seleziona Cella --</option>
          {celle.map((c) => (
            <option key={c.id} value={c.cella}>
              {c.cella} ({c.temperatura})
            </option>
          ))}
        </select>
      </label>

      <label>
        NOTE_1
        <input
          type="text"
          value={form.note_1 || ""}
          onChange={(e) => setForm({ ...form, note_1: e.target.value })}
          className="input-style"
        />
      </label>

      <label>
        N_CAMP
        <input
          type="text"
          value={form.n_camp || ""}
          onChange={(e) => setForm({ ...form, n_camp: e.target.value })}
          className="input-style"
        />
      </label>

      <label>
        STATO
        <select
          value={form.stato || ""}
          onChange={(e) => setForm({ ...form, stato: e.target.value })}
          className="input-style"
        >
          <option value="">-- Seleziona Stato --</option>
          {zonario.map((z) => (
            <option key={z.id_zonario} value={z.stato}>
              {z.stato}
            </option>
          ))}
        </select>
      </label>

      <label>
        DESTINAZIONE
        <input
          type="text"
          value={form.destinazione || ""}
          onChange={(e) => setForm({ ...form, destinazione: e.target.value })}
          className="input-style"
        />
      </label>
    </div>

    {/* COLONNA 2 */}
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <label>
        GHIACCIO
        <select
          value={form.ghiaccio || ""}
          onChange={(e) => setForm({ ...form, ghiaccio: e.target.value })}
          className="input-style"
        >
          <option value="">-- Seleziona --</option>
          <option value="GEL">GEL</option>
          {Array.from({ length: 41 }, (_, i) => i * 5).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <label>
        VETTORE
        <select
          value={form.vettore || ""}
          onChange={(e) => setForm({ ...form, vettore: e.target.value })}
          className="input-style"
        >
          <option value="">-- Seleziona --</option>
          {["UPS", "FEDEX", "DHL", "TNT", "ALTRO"].map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>

      <label>
        NOTE_2
        <input
          type="text"
          value={form.note_2 || ""}
          onChange={(e) => setForm({ ...form, note_2: e.target.value })}
          className="input-style"
        />
      </label>
    </div>

    {/* COLONNA 3 */}
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <label>
        COSTO
        <input
          type="number"
          value={form.costo || ""}
          onChange={(e) => setForm({ ...form, costo: e.target.value })}
          className="input-style"
        />
      </label>

      <label>
        IMB
        <input
          type="number"
          value={form.imb || ""}
          onChange={(e) => setForm({ ...form, imb: e.target.value })}
          className="input-style"
        />
      </label>

      <label>
        TRK
        <input
          type="text"
          value={form.trk || ""}
          onChange={(e) => setForm({ ...form, trk: e.target.value })}
          className="input-style"
        />
      </label>

      <label>
        DOC
        <input
          type="checkbox"
          checked={!!form.doc}
          onChange={(e) => setForm({ ...form, doc: e.target.checked })}
          style={{ marginLeft: "10px" }}
        />
      </label>

      <label>
        FATTA
        <input
          type="checkbox"
          checked={!!form.fatta}
          onChange={(e) => setForm({ ...form, fatta: e.target.checked })}
          style={{ marginLeft: "10px" }}
        />
      </label>
    </div>

    {/* BOTTONI */}
    <div
      style={{
        gridColumn: "span 3",
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        marginTop: "20px",
      }}
    >
      <button type="submit" className="gestione-giornata-btn green">
        {editingId ? "💾 Aggiorna" : "➕ Salva"}
      </button>
      <button
        type="button"
        className="gestione-giornata-btn red"
        onClick={resetForm}
      >
        ❌ Annulla
      </button>
    </div>
  </form>
)}


     {/* QUICK ADD CLIENTE */}
{quickAddOpen && (
  <div
    style={{
      border: "1px solid #ccc",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      background: "#fafafa",
      borderRadius: "8px",
    }}
  >
    <h4>Inserimento rapido cliente</h4>
    <div style={{ display: "flex", gap: 10 }}>
      <input
        placeholder="Azienda *"
        value={quickCliente.azienda}
        onChange={(e) =>
          setQuickCliente({ ...quickCliente, azienda: e.target.value })
        }
      />
      <select
        value={quickCliente.sede}
        onChange={(e) =>
          setQuickCliente({ ...quickCliente, sede: e.target.value })
        }
      >
        <option value="">-- Seleziona sede --</option>
        <option value="LEGALE">LEGALE</option>
        <option value="OPERATIVA">OPERATIVA</option>
        <option value="ALTRO">ALTRO</option>
      </select>
      <button onClick={salvaQuickCliente}>Salva cliente</button>
      <button onClick={() => setQuickAddOpen(false)}>Chiudi</button>
    </div>
    <small>
      Nota: qui invio solo i campi minimi (azienda, sede). Tutti gli altri
      campi rimangono null o default nel DB.
    </small>
  </div>
)}


      {/* TABella */}
      <div style={{ overflowX: "auto" }}>
        <table className="gestione-giornata">
          <thead>
            <tr>
              <th>Azioni</th>
              <th>doc</th>
              <th>fatta</th>
              <th>data</th>
              <th>g_sett</th>
              <th>note_1</th>
              <th>mittente</th>
              <th>cella</th>
              <th>n_camp</th>
              <th>stato</th>
              <th>destinazione</th>
              <th>vettore</th>
              <th>ghiaccio</th>
              <th>note_2</th>
              <th>costo</th>
              <th>imb</th>
              <th>trk</th>
              <th>utente</th>
              <th>qr_code</th>
              <th>QR</th>
              <th>
  <input
    type="checkbox"
    onChange={(e) => {
      if (e.target.checked) {
        selezionaTutte();
      } else {
        deselezionaTutte();
      }
    }}
    checked={
      righeFiltrate.length > 0 &&
      righeFiltrate.every(r => righeSelezionate[r.id])
    }
  />
</th>

            </tr>
          </thead>
          <tbody>
  {loading ? (
    <tr>
      <td colSpan="21" style={{ textAlign: "center" }}>Caricamento...</td>
    </tr>
  ) : righeFiltrate.length === 0 ? (
    <tr>
      <td colSpan="21" style={{ textAlign: "center" }}>Nessun dato</td>
    </tr>
  ) : (
    righeFiltrate.map((r) => {
      const draft = inlineEdits[r.id] || {};
      const editingInline = !!inlineEdits[r.id];

      return (
   <tr
  key={r.id}
  className={`riga-gsett-${r.g_sett || ""}`}
  style={{
    color: formatRighe[r.id]?.color || "inherit",
    fontWeight: formatRighe[r.id]?.bold ? "bold" : "normal",
    textDecoration: formatRighe[r.id]?.strike ? "line-through" : "none",
    fontSize: formatRighe[r.id]?.fontSize ? `${formatRighe[r.id].fontSize}px` : "14px"
  }}
>


          {/* AZIONI */}
          <td>
            {editingInline ? (
              <>
                <button
                  onClick={() => saveInlineEdit(r.id)}
                  disabled={!!savingInline[r.id]}
                  title="Salva"
                >
                  {savingInline[r.id] ? "⏳" : "💾"}
                </button>
                <button onClick={() => cancelInlineEdit(r.id)} title="Annulla">❌</button>
              </>
            ) : (
              <>
                <button onClick={() => startInlineEdit(r)} title="Modifica inline">✏️</button>{" "}
                <button onClick={() => apriModifica(r)} title="Apri form">📋</button>{" "}
              </>
            )}

            <button onClick={() => elimina(r.id)} title="Elimina">🗑️</button>{" "}
            <button onClick={() => togglePanel(r.id)} title="Opzioni">⚙️</button>{" "}
            <button onClick={() => duplicaRiga(r)} title="Duplica">↔️</button>

            {/* pannello extra */}
            {rigaEditOpen[r.id] && (
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                <button onClick={() => toggleBold(r.id)}>B</button>
                <button onClick={() => toggleStrike(r.id)}>S</button>
                <button onClick={() => increaseFont(r.id)}>A+</button>
                <button onClick={() => decreaseFont(r.id)}>A-</button>
                <button onClick={() => cycleColor(r.id)}>🎨</button>
                <input
                  type="color"
                  value={formatRighe[r.id]?.color || "#000000"}
                  onChange={(e) => changeColor(r.id, e.target.value)}
                  style={{ width: 30, height: 24, padding: 0, border: "none" }}
                />
              </div>
            )}
          </td>

          {/* DOC */}
          <td>
            {editingInline ? (
              <input
                type="checkbox"
                checked={!!draft.doc}
                onChange={(e) => updateInlineField(r.id, "doc", e.target.checked)}
              />
            ) : (
              r.doc ? "✔️" : ""
            )}
          </td>

          {/* FATTA */}
          <td>
            {editingInline ? (
              <input
                type="checkbox"
                checked={!!draft.fatta}
                onChange={(e) => updateInlineField(r.id, "fatta", e.target.checked)}
              />
            ) : (
              r.fatta ? "✔️" : ""
            )}
          </td>

          {/* DATA (visual) */}
          <td>
            {editingInline ? (
              <input
                type="date"
                value={draft.data ?? r.data ?? ""}
                onChange={(e) => updateInlineField(r.id, "data", e.target.value)}
              />
            ) : (
              r.dataDisplay
            )}
          </td>

          {/* G_SETT (non editabile direttamente) */}
          <td>{r.g_sett}</td>

          {/* NOTE_1 */}
          <td>
            {editingInline ? (
              <input
                value={draft.note_1 ?? r.note_1 ?? ""}
                onChange={(e) => updateInlineField(r.id, "note_1", e.target.value)}
              />
            ) : (
              r.note_1 || ""
            )}
          </td>

          {/* MITTENTE */}
          <td>
            {editingInline ? (
              <select
                value={draft.mittente ?? r.mittente ?? ""}
                onChange={(e) => updateInlineField(r.id, "mittente", e.target.value)}
              >
                <option value="">-- Seleziona --</option>
                {clienti.map((c) => (
                  <option
                    key={`${c.id || c.azienda}-${c.sede || ""}`}
                    value={c.azienda}
                  >
                    {c.azienda}
                  </option>
                ))}
              </select>
            ) : (
              r.mittente || ""
            )}
          </td>

          {/* CELLA (select dalle celle esistenti) */}
          <td>
            {editingInline ? (
              <select
                value={draft.cella ?? r.cella ?? ""}
                onChange={(e) => updateInlineField(r.id, "cella", e.target.value)}
              >
                <option value="">-- Seleziona Cella --</option>
                {celle.map((c) => (
                  <option key={c.id || c.cella} value={c.cella}>
                    {c.cella} {c.temperatura ? `(${c.temperatura})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              r.cella || ""
            )}
          </td>

          {/* N_CAMP */}
          <td>
            {editingInline ? (
              <input
                value={draft.n_camp ?? r.n_camp ?? ""}
                onChange={(e) => updateInlineField(r.id, "n_camp", e.target.value)}
              />
            ) : (
              r.n_camp ?? ""
            )}
          </td>

          {/* STATO */}
          <td>
            {editingInline ? (
              <select
                value={draft.stato ?? r.stato ?? ""}
                onChange={(e) => updateInlineField(r.id, "stato", e.target.value)}
              >
                <option value="">-- Seleziona Stato --</option>
                {zonario.map((z) => (
                  <option key={z.id_zonario} value={z.stato}>
                    {z.stato}
                  </option>
                ))}
              </select>
            ) : (
              r.stato || ""
            )}
          </td>

          {/* DESTINAZIONE */}
          <td>
            {editingInline ? (
              <input
                value={draft.destinazione ?? r.destinazione ?? ""}
                onChange={(e) => updateInlineField(r.id, "destinazione", e.target.value)}
              />
            ) : (
              r.destinazione || ""
            )}
          </td>

          {/* VETTORE */}
          <td>
            {editingInline ? (
              <select
                value={draft.vettore ?? r.vettore ?? ""}
                onChange={(e) => updateInlineField(r.id, "vettore", e.target.value)}
              >
                <option value="">-- Seleziona --</option>
                {["UPS", "FEDEX", "DHL", "TNT", "ALTRO"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              r.vettore || ""
            )}
          </td>

          {/* GHIACCIO */}
          <td>
            {editingInline ? (
              <select
                value={draft.ghiaccio ?? r.ghiaccio ?? ""}
                onChange={(e) => updateInlineField(r.id, "ghiaccio", e.target.value)}
              >
                <option value="">-- Seleziona --</option>
                <option value="GEL">GEL</option>
                {Array.from({ length: 41 }, (_, i) => i * 5).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              r.ghiaccio ?? ""
            )}
          </td>

          {/* NOTE_2 */}
          <td>
            {editingInline ? (
              <input
                value={draft.note_2 ?? r.note_2 ?? ""}
                onChange={(e) => updateInlineField(r.id, "note_2", e.target.value)}
              />
            ) : (
              r.note_2 || ""
            )}
          </td>

          {/* COSTO */}
          <td>
            {editingInline ? (
              <input
                type="number"
                value={draft.costo ?? r.costo ?? ""}
                onChange={(e) => updateInlineField(r.id, "costo", e.target.value)}
              />
            ) : (
              r.costo ?? ""
            )}
          </td>

          {/* IMB */}
          <td>
            {editingInline ? (
              <input
                type="number"
                value={draft.imb ?? r.imb ?? ""}
                onChange={(e) => updateInlineField(r.id, "imb", e.target.value)}
              />
            ) : (
              r.imb ?? ""
            )}
          </td>

          {/* TRK */}
          <td>
            {editingInline ? (
              <input
                value={draft.trk ?? r.trk ?? ""}
                onChange={(e) => updateInlineField(r.id, "trk", e.target.value)}
              />
            ) : (
              r.trk || ""
            )}
          </td>

          {/* UTENTE (non edit) */}
          <td>{r.utente || ""}</td>

          {/* QR_CODE (visual string) */}
          <td>{r.qr_code || ""}</td>

          {/* QR canvas */}
          <td>
            {r.qr_code ? (
              <span data-qr-id={r.id}>
                <QRCodeCanvas value={String(r.qr_code)} size={48} includeMargin />
              </span>
            ) : null}
          </td>

          {/* selezione */}
          <td>
            <input
              type="checkbox"
              checked={!!righeSelezionate[r.id]}
              onChange={() => toggleSelezioneRiga(r.id)}
            />
          </td>
        </tr>
      );
    })
  )}
</tbody>
        </table>
        
           </div>
        </main>
  </div>
);
}
