# EGYPHONE — rilascio multi-tenant

Branch di integrazione: `feature/egyphone-multitenant-rc9`.

## Configurazione cliente
- Marchio: EGYPHONE
- Ragione sociale: EGYPTER PHONE DI ABDELRAHMAN TAMER MOHAMED ABDELWAHA
- Indirizzo: Viale Dante Alighieri 98, Piacenza
- Partita IVA: 01753890332
- Codice fiscale: BDLTRM82A01Z336O
- SDI: KRRH6B9
- PEC: egypter.phone@pec.it
- Amministratore: king_00022@yahoo.com
- Logo: `logo-egyphone.png` nel pacchetto RC9.

## Condizioni prima della pubblicazione
1. Integrare e confrontare il pacchetto RC9 con `main` senza eliminare funzionalità più recenti.
2. Creare il workspace EGYPHONE mediante funzione Supabase autenticata `beparytech-saas-company`; non memorizzare password nei file GitHub.
3. Verificare accessi EGYPHONE ↔ BeparyTech con sessioni realmente separate, inclusi INSERT/UPDATE/DELETE, RPC e Storage.
4. Implementare l'assistenza Super Admin con operazioni autorizzate, audit server e informativa al cliente; nessun accesso invisibile.
5. Verificare documenti, stampa DYMO, login e logout con test fisici.
6. Eseguire backup e test di regressione prima del merge su `main`.

Questo file non rappresenta un collaudo superato né un'autorizzazione a distribuire in produzione.
