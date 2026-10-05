# Mensch ärgere Dich nicht – gemeinsame Lobby

Diese Version verwendet keine Raum-Erstellung und keinen Raumcode.

## Korrekturen
- Die gemeinsame Lobby verwendet eine feste PeerJS-Lobby-ID.
- Wenn zwei Personen gleichzeitig eintreten, wird der Fall `unavailable-id` korrekt als „Lobby existiert bereits“ behandelt; der zweite Client verbindet sich danach mit der vorhandenen Lobby statt einen Verbindungsfehler anzuzeigen.
- Bereits vergebene Farben werden im Farbwähler als grau/deaktiviert markiert.
- Die Farbauswahl wird bei jedem synchronisierten Lobby-Stand aktualisiert.
- Eine bereits belegte Farbe kann von einem anderen Spieler nicht ausgewählt werden.
- Bis zu 6 Spieler können in der Lobby sein; ab 2 Spielern kann das Spiel gestartet werden.
- „Neues Spiel“ bleibt erhalten.
- Spielbrett, Layout und die bestehende Spiellogik bleiben unverändert.


## Fehlerkorrektur 06.10.2026
- Kritischer JavaScript-Reihenfolgefehler behoben: `$()` wird jetzt vor dem ersten Aufruf von `setupPasswordGate()` definiert. Dadurch funktionieren Spielpasswort-Login, Admin-Link und Farbauswahl wieder.
- Admin-Link ist zusätzlich ein normaler Link zu `admin.html` und bleibt damit auch bei einem späteren JavaScript-Fehler erreichbar.
- Spielpasswort-Prüfung zeigt jetzt verständliche Netzwerk-/Konfigurationsfehler statt scheinbar nichts zu tun.
- CORS der Edge Function verwendet die aktuelle Supabase-SDK-CORS-Liste.
- Die vorhandenen Spielregeln und getesteten Spielmechaniken wurden nicht verändert.
