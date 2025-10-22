// ================== IMPORT ==================
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const { nanoid } = require("nanoid");
require("dotenv").config();

// ================== CONFIGURAZIONE ==================
const app = express();
app.use(express.json());
app.use(cors());
const upload = multer({ dest: "uploads/" });

// Connessione PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// ================== MIDDLEWARE ==================
const verificaAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token mancante" });

  try {
    const decoded = jwt.verify(token, "supersegreto");
    if (decoded.ruolo !== "admin") return res.status(403).json({ message: "Non hai privilegi admin" });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token non valido o scaduto" });
  }
};

const verificaGestioneUtenti = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token mancante" });

  try {
    const decoded = jwt.verify(token, "supersegreto");
    const haPermesso =
      decoded.ruolo === "admin" ||
      (Array.isArray(decoded.permessi) && decoded.permessi.includes("GESTIONE UTENTI"));
    if (!haPermesso) return res.status(403).json({ message: "Non hai privilegi per gestire utenti" });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Token non valido o scaduto" });
  }
};

// ================== ENDPOINT BASE ==================
app.get("/", (req, res) => res.send("API Gestionale Postale attiva 🚀"));

// ================== LOGIN ==================
app.post("/login", async (req, res) => {
  const { nome, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM "USER" WHERE NOME = $1', [nome]);
    if (result.rows.length === 0) return res.status(401).json({ message: "Utente non trovato" });

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Password errata" });

    const token = jwt.sign(
      { id: user.id_user, nome: user.nome, ruolo: user.ruolo, permessi: user.permessi || [] },
      "supersegreto",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login OK", token });
  } catch (err) {
    console.error("Errore login:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// ================== UTENTI ==================
app.post("/crea-utente", verificaGestioneUtenti, async (req, res) => {
  const { nome, password, descrizione, ruolo, permessi } = req.body;
  try {
    const check = await pool.query('SELECT * FROM "USER" WHERE NOME = $1', [nome]);
    if (check.rows.length > 0) return res.status(400).json({ message: "Utente già esistente" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO "USER" (NOME, PASSWORD, DESCRIZIONE, RUOLO, PERMESSI) VALUES ($1, $2, $3, $4, $5)',
      [nome, hashedPassword, descrizione, ruolo || "user", permessi || []]
    );
    res.json({ message: "Utente creato con successo" });
  } catch (err) {
    console.error("Errore creazione utente:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

app.get("/utenti", verificaGestioneUtenti, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_user, nome, descrizione, ruolo, permessi FROM "USER" ORDER BY id_user'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Errore caricamento utenti" });
  }
});

app.put("/utenti/:id", verificaGestioneUtenti, async (req, res) => {
  const { id } = req.params;
  const { descrizione, ruolo, permessi } = req.body;
  try {
    await pool.query(
      'UPDATE "USER" SET descrizione = $1, ruolo = $2, permessi = $3 WHERE id_user = $4',
      [descrizione, ruolo, permessi, id]
    );
    res.json({ message: "Utente aggiornato con successo" });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento utente" });
  }
});

app.delete("/utenti/:id", verificaGestioneUtenti, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM "USER" WHERE id_user = $1', [id]);
    res.json({ message: "Utente cancellato con successo" });
  } catch (err) {
    res.status(500).json({ message: "Errore cancellazione utente" });
  }
});

// ================== ZONARIO ==================
app.get("/api/zonario", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM zonario ORDER BY id_zonario");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Errore nel caricamento delle zone" });
  }
});

app.post("/api/zonario", async (req, res) => {
  const { cod_s, c_iva, stato } = req.body;
  try {
    await pool.query("INSERT INTO zonario (cod_s, c_iva, stato) VALUES ($1, $2, $3)", [
      cod_s,
      c_iva,
      stato,
    ]);
    res.json({ message: "Zona inserita" });
  } catch (err) {
    res.status(500).json({ message: "Errore inserimento zona" });
  }
});

app.put("/api/zonario/:id", async (req, res) => {
  const { id } = req.params;
  const { cod_s, c_iva, stato } = req.body;
  try {
    await pool.query(
      "UPDATE zonario SET cod_s=$1, c_iva=$2, stato=$3 WHERE id_zonario=$4",
      [cod_s, c_iva, stato, id]
    );
    res.json({ message: "Zona aggiornata" });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento zona" });
  }
});

app.delete("/api/zonario/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM zonario WHERE id_zonario=$1", [id]);
    res.json({ message: "Zona eliminata" });
  } catch (err) {
    res.status(500).json({ message: "Errore eliminazione zona" });
  }
});

// ================== GIACENZE ==================
app.get("/api/giacenze", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, cella, temperatura, qr_code, TO_CHAR(data, 'DD/MM/YY') AS data
      FROM giacenze
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Errore caricando giacenze" });
  }
});

app.post("/api/giacenze", async (req, res) => {
  try {
    const { cella, temperatura } = req.body;
    const qr_code = `QR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const result = await pool.query(
      "INSERT INTO giacenze (cella, temperatura, qr_code) VALUES ($1, $2, $3) RETURNING *",
      [cella, temperatura, qr_code]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Errore inserimento giacenza" });
  }
});

app.put("/api/giacenze/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { cella, temperatura } = req.body;
    await pool.query(
      "UPDATE giacenze SET cella=$1, temperatura=$2 WHERE id=$3",
      [cella, temperatura, id]
    );
    res.json({ message: "Giacenza aggiornata" });
  } catch (err) {
    res.status(500).json({ message: "Errore aggiornamento giacenza" });
  }
});

app.delete("/api/giacenze/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM giacenze WHERE id=$1", [id]);
    res.json({ message: "Giacenza eliminata" });
  } catch (err) {
    res.status(500).json({ message: "Errore eliminazione giacenza" });
  }
});
// ================== GESTIONE GIORNATA ==================


// GET tutti i record
app.get("/api/gestione_giornata", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, doc, fatta,
        TO_CHAR(data, 'YYYY-MM-DD') AS data,  -- ✅ sempre formato per React
        g_sett, note_1, mittente, n_camp, stato, destinazione,
        vettore, ghiaccio, note_2, costo, imb, trk, utente, qr_code, cella
      FROM gestione_giornata
      ORDER BY data DESC NULLS LAST, id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Errore GET gestione_giornata:", err.message);
    res.status(500).json({ error: "Errore nel caricamento dei dati" });
  }
});




// POST: inserisci un nuovo record
app.post("/api/gestione_giornata", async (req, res) => {
  try {
    const {
      doc, fatta, data, g_sett, note_1, mittente, n_camp,
      stato, destinazione, vettore, ghiaccio, note_2,
      costo, imb, trk, utente, qr_code, cella
    } = req.body;

    const result = await pool.query(
      `INSERT INTO gestione_giornata
        (doc, fatta, data, g_sett, note_1, mittente, n_camp, stato,
         destinazione, vettore, ghiaccio, note_2, costo, imb, trk, utente, qr_code, cella)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [doc, fatta, data, g_sett, note_1, mittente, n_camp, stato, destinazione,
       vettore, ghiaccio, note_2, costo, imb, trk, utente, qr_code, cella]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Errore inserimento gestione_giornata:", err.message);
    res.status(500).json({ error: "Errore nel salvataggio" });
  }
});

// PUT: aggiorna un record
app.put("/api/gestione_giornata/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      doc, fatta, data, g_sett, note_1, mittente, n_camp,
      stato, destinazione, vettore, ghiaccio, note_2,
      costo, imb, trk, utente, qr_code, cella
    } = req.body;

    // ✅ Normalizza la data
    let dataNorm = null;
    if (data) {
      if (data.includes('/')) {
        const [gg, mm, aa] = data.split('/');
        dataNorm = `20${aa}-${mm}-${gg}`;
      } else if (data.includes('-')) {
        dataNorm = data;
      }
    }

    const result = await pool.query(
      `UPDATE gestione_giornata SET
        doc=$1, fatta=$2, data=$3, g_sett=$4, note_1=$5, mittente=$6, n_camp=$7, stato=$8,
        destinazione=$9, vettore=$10, ghiaccio=$11, note_2=$12, costo=$13,
        imb=$14, trk=$15, utente=$16, qr_code=$17, cella=$18
       WHERE id=$19 RETURNING *`,
      [doc, fatta, dataNorm, g_sett, note_1, mittente, n_camp, stato, destinazione,
       vettore, ghiaccio, note_2, costo, imb, trk, utente, qr_code, cella, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Errore update gestione_giornata:", err.message);
    res.status(500).json({ error: "Errore aggiornamento" });
  }
});



// DELETE: cancella un record
app.delete("/api/gestione_giornata/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM gestione_giornata WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Errore delete gestione_giornata:", err.message);
    res.status(500).json({ error: "Errore eliminazione" });
  }
});


// ================== CLIENTI ==================
// ================== CLIENTI ==================

// GET: elenco clienti (già esistente, ma migliorato con filtri)
app.get("/clienti", async (req, res) => {
  try {
    const { search = "", azienda = "", sede = "" } = req.query;
    const params = [];
    const where = [];

    if (search) {
      params.push(`%${search}%`);
      where.push(`LOWER(azienda) LIKE LOWER($${params.length})`);
    }
    if (azienda) {
      params.push(`%${azienda}%`);
      where.push(`LOWER(azienda) LIKE LOWER($${params.length})`);
    }
    if (sede) {
      params.push(`LOWER(${sede})`);
      where.push(`LOWER(sede) = LOWER($${params.length})`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const query = `SELECT * FROM clienti ${whereSQL} ORDER BY id_cliente ASC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Errore caricando clienti:", err.message);
    res.status(500).json({ error: "Errore caricando clienti" });
  }
});

// POST: crea un nuovo cliente
app.post("/clienti", async (req, res) => {
  try {
    const f = req.body;

    const query = `
      INSERT INTO clienti (
        azienda, persona_contatto, indirizzo1, indirizzo2, indirizzo3,
        sede, cap, citta, provincia, stato,
        fda_numero, fda_scadenza, telefono1, telefono2, cell,
        email_generale, email_fatturazione, email_altro,
        partita_iva, sid, note
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11, NULLIF($12, '')::date, $13,$14,$15,
        $16,$17,$18,$19,$20,$21
      )
      RETURNING *;
    `;

    const params = [
      f.azienda, f.persona_contatto, f.indirizzo1, f.indirizzo2, f.indirizzo3,
      f.sede, f.cap, f.citta, f.provincia, f.stato,
      f.fda_numero, f.fda_scadenza, f.telefono1, f.telefono2, f.cell,
      f.email_generale, f.email_fatturazione, f.email_altro,
      f.partita_iva, f.sid, f.note
    ];

    const result = await pool.query(query, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Errore inserimento cliente:", err.message);
    res.status(500).json({ error: "Errore inserimento cliente" });
  }
});

// PUT: aggiorna un cliente
app.put("/clienti/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const f = req.body;

    const query = `
      UPDATE clienti SET
        azienda=$1, persona_contatto=$2, indirizzo1=$3, indirizzo2=$4, indirizzo3=$5,
        sede=$6, cap=$7, citta=$8, provincia=$9, stato=$10,
        fda_numero=$11, fda_scadenza=NULLIF($12, '')::date,
        telefono1=$13, telefono2=$14, cell=$15,
        email_generale=$16, email_fatturazione=$17, email_altro=$18,
        partita_iva=$19, sid=$20, note=$21
      WHERE id_cliente=$22
      RETURNING *;
    `;

    const params = [
      f.azienda, f.persona_contatto, f.indirizzo1, f.indirizzo2, f.indirizzo3,
      f.sede, f.cap, f.citta, f.provincia, f.stato,
      f.fda_numero, f.fda_scadenza, f.telefono1, f.telefono2, f.cell,
      f.email_generale, f.email_fatturazione, f.email_altro,
      f.partita_iva, f.sid, f.note, id
    ];

    const result = await pool.query(query, params);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Cliente non trovato" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Errore aggiornamento cliente:", err.message);
    res.status(500).json({ error: "Errore aggiornamento cliente" });
  }
});

// DELETE: elimina un cliente
app.delete("/clienti/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM clienti WHERE id_cliente=$1", [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Cliente non trovato" });
    res.json({ success: true });
  } catch (err) {
    console.error("Errore eliminazione cliente:", err.message);
    res.status(500).json({ error: "Errore eliminazione cliente" });
  }
});

// POST /clienti/bulk → import CSV
app.post("/clienti/bulk", async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      for (const f of records) {
        await client.query(
          `INSERT INTO clienti (
            azienda, persona_contatto, indirizzo1, indirizzo2, indirizzo3,
            sede, cap, citta, provincia, stato,
            fda_numero, fda_scadenza, telefono1, telefono2, cell,
            email_generale, email_fatturazione, email_altro,
            partita_iva, sid, note
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
            $11, NULLIF($12, '')::date, $13,$14,$15,
            $16,$17,$18,$19,$20,$21
          )`,
          [
            f.azienda, f.persona_contatto, f.indirizzo1, f.indirizzo2, f.indirizzo3,
            f.sede, f.cap, f.citta, f.provincia, f.stato,
            f.fda_numero, f.fda_scadenza, f.telefono1, f.telefono2, f.cell,
            f.email_generale, f.email_fatturazione, f.email_altro,
            f.partita_iva, f.sid, f.note
          ]
        );
      }
      await client.query("COMMIT");
      res.json({ success: true, imported: records.length });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Errore import CSV clienti:", err.message);
    res.status(500).json({ error: "Errore import CSV clienti" });
  }
});


// ================== CELLE ==================
app.get("/api/celle", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT cella FROM giacenze ORDER BY cella ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Errore caricando celle:", err.message);
    res.status(500).json({ error: "Errore caricando celle" });
  }
});

// ================== AVVIO SERVER ==================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server avviato sulla porta ${PORT}`));
