SOUND-EFFEKTE

Sound1.wav              = Figur kommt aus dem Haus
Rauswurf-Rot.wav        = rote Figur wurde rausgeschmissen
Rauswurf-Gelb.wav       = gelbe Figur wurde rausgeschmissen
Rauswurf-Gruen.wav      = grüne Figur wurde rausgeschmissen
Rauswurf-Blau.wav       = blaue Figur wurde rausgeschmissen
Rauswurf-Lila.wav       = lila Figur wurde rausgeschmissen
Rauswurf-Schwarz.wav    = schwarze Figur wurde rausgeschmissen
Sound2.wav              = Spieler gewinnt

Die Dateien müssen im Ordner "sounds" neben app.js liegen.
Die Sounds sind kurze, selbst erzeugte WAV-Dateien und benötigen keine externe Musik-/Soundbibliothek.


SOUND-FIX 06-10-2026:
- Sound1 plays when a 6 is rolled and the rolling player has a pawn in the house.
- The roll sound is synchronized to remote devices via the game state.
- Capture sounds are synchronized to remote devices.
- Audio files use the exact Rauswurf-*.wav names.
- Mobile browsers still require at least one user interaction on each device before audio can play; the game registers the first touch/click/keypress to unlock audio.

- Remote devices also play Sound1 on the synchronized roll-to-6 state transition.
