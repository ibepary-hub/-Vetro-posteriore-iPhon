BeparyTech Magazzino — versione Gestione Utenti

NOVITÀ
- Sezione Utenti visibile solo agli amministratori.
- Creazione account con Username, Email, Password e Ruolo (Standard/Admin).
- Gli account creati entrano nello stesso magazzino BeparyTech e vedono le stesse quantità e vendite.
- Il tuo account principale è impostato come Admin.
- Modalità giorno/notte, foto iPhone, BackGlass, Housing, Vendite e Archivio restano attivi.
- Layout responsive per mobile, tablet, portatili e PC.

INSTALLAZIONE GITHUB
Carica TUTTI i file di questo ZIP nella cartella principale del repository e sostituisci i file esistenti.
Le immagini iPhone restano nella cartella principale.

BACKEND
La gestione utenti e la condivisione del magazzino sono già state configurate nel progetto Supabase BeparyTech.


Aggiornamento ruoli vendite:
- Utenti Standard: possono vedere le vendite ma NON vedono Modifica negozio / Elimina.
- Admin: mantiene i comandi di amministrazione delle vendite.
- Protezione applicata anche lato Supabase: un account Standard non può richiamare direttamente le funzioni di modifica/archiviazione.


AGGIORNAMENTO v14
- Menu laterale responsive
- Cronologia visibile a tutti gli utenti del workspace
- Gestione Admin di sezioni personalizzate e prodotti
- Giacenza iniziale e soglia scorta bassa per nuovi prodotti
- Uscita -1 sui prodotti personalizzati con operatore/password/negozio/nota
- Pulsanti e interazioni animate

AGGIORNAMENTO v17 COMPLETA
- Dashboard con totale pezzi, scorte basse/esaurite, richieste aperte, operazioni di oggi e attività recenti
- Magazzino completamente dinamico su database: BackGlass e Housing compresi, con quantità esistenti preservate
- Admin: crea, rinomina, riordina, disattiva/riattiva sezioni; crea e modifica prodotti
- Prodotti con SKU, barcode/QR, soglia scorta, foto iPhone e giacenza
- Ricerca globale su prodotto, variante, SKU, barcode e richieste
- Scanner fotocamera QR/barcode con inserimento manuale di riserva
- “Da ordinare” con flusso Richiesto → Approvato → Ordinato → Arrivato → Consegnato
- Cronologia generale immutabile: vendite storiche, uscite, rientri, giacenze, richieste, sezioni e prodotti
- Backup Admin: CSV magazzino, CSV richieste e JSON completo
- Layout desktop/tablet/mobile più ampio e responsive
- Login isolato: prima dell'accesso è visibile soltanto la pagina login
- Service Worker v17: shell essenziale, immagini caricate in cache solo quando servono, pulizia automatica vecchie cache
- Sicurezza Supabase rafforzata con RLS e revoca accessi anonimi alle funzioni operative

AGGIORNAMENTO v28 — ORARI PRIVATI ADMIN
- Nuova sezione “Orari” visibile esclusivamente agli account Admin.
- Registrazione entrata/uscita mattina e pomeriggio, azienda/attività e note.
- Calcolo automatico ore giornaliere e riepilogo mensile.
- Extra multipli per giorno con descrizione, durata, importo, azienda/cliente e nota.
- Totali mensili separati: ore normali, ore extra, totale e importi extra.
- Protezione anche lato database Supabase con RLS: gli account Standard non possono leggere né modificare i dati Orari, anche chiamando direttamente l'API.


AGGIORNAMENTO v39 — VENDITE RICAMBI ADMIN
- Nuova sezione “Vendite ricambi” visibile esclusivamente agli account Admin.
- Inserimento manuale di data, negozio, ricambio/articolo e prezzo vendita IVA inclusa.
- IVA predefinita 22% modificabile, con imponibile e quota IVA calcolati automaticamente.
- Nomi negozi riutilizzati dalla versione esistente: RPL, MELA, DP ed E-POL.
- Campo link acquisto/riferimento con riconoscimento automatico del fornitore (AliExpress, eBay, Amazon, Temu, Back Market e dominio generico).
- Link originale conservato e cliccabile nello storico.
- RLS Supabase: i dati non sono leggibili/modificabili dagli account Standard.
- In Gestione utenti, Admin può cambiare la password login propria o degli altri utenti del workspace tramite Edge Function sicura.
