# EGYPHONE V2 — piano operativo e collaudo

**Stato:** sviluppo. Non pubblicare direttamente su main finché i test reali non passano.
**Tenant:** EGYPHONE soltanto; nessun cambiamento agli altri tenant.
**Ripristino:** ramo `backup/pre-egyphone-v2-2026-10-30`.

## Fase 1 — navigazione e operatività (iniziata)
- [x] Ramo isolato feature/egyphone-v2.
- [x] Voci principali rinominate per le attività quotidiane: Dashboard, Vendite e cassa, Documenti e fatture, Magazzino e ricambi.
- [x] DDT conto lavorazione raggruppato in un pannello di operazioni aggiuntive (non cancellato).
- [ ] Test browser autenticato EGYPHONE su desktop e mobile.
- [ ] Verifica dei permessi admin/operatore e del menu.
- [ ] Test end-to-end accettazione rapida → riparazione → consegna.

## Fase 2 — ingresso dispositivo
- [ ] Ricerca clienti con suggerimenti, verifica di corrispondenza e duplicati.
- [ ] Checklist configurabile di ingresso/uscita: touch, display, camera, audio, microfono, Wi-Fi, ricarica, IMEI, stato estetico.
- [ ] Fotografie prima/dopo, firma cliente, cronologia verificabile.
- [ ] PDF e DYMO testati con etichettatrice collegata.

## Fase 3 — laboratorio
- [ ] Assegnazione a tecnico e tempi di lavorazione.
- [ ] Ricambi prelevati per singola riparazione; scarico giacenze atomico.
- [ ] Preventivo, acconto, saldo, garanzia e rientro collegati alla pratica originale.
- [ ] Test concorrenza fra due operatori e rollback transazionale.

## Fase 4 — vendite e documenti
- [ ] Cassa giornaliera: contanti, POS, bonifico, misto, acconti, resi.
- [ ] Riepilogo non fiscale distinto chiaramente da corrispettivi fiscali.
- [ ] Integrazione fiscale solo con servizio certificato e verifica professionale.
- [ ] Archivio documenti tenant-isolato, annullamento auditabile e report.

## Fase 5 — clienti e assistenza
- [ ] Portale QR cliente con accesso a token sicuro, dati limitati.
- [ ] Notifiche WhatsApp con consenso/strumenti autorizzati.
- [ ] Pannello Super Admin ticket, messaggi e transizioni di stato.
- [ ] Email alert e push reali: credenziali provider, consensi, log recapito e test.

## Gate obbligatori prima di distribuire
1. Backup database recuperabile e prova restore.
2. Due account di tenant diversi: nessuna lettura/incrocio di dati.
3. Accettazione completa + riparazione + ricambio + consegna verificati su dati di test.
4. Test PDF e stampante DYMO fisica.
5. Desktop 1366px, mobile 390px, nessuna sovrapposizione.
6. Nessuna regressione login, logout, gestione permessi, fatture del tenant principale.
7. Versione V2 abilitata in produzione solo dopo approvazione e collaudo.
