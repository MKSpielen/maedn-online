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
