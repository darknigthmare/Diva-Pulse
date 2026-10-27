# Diagnostics originaux V26

ECHOS_ORIGINAL.wav est un instrumental synthétisé par DIVA PULSE (19 secondes,
120 BPM), sans chanson ou enregistrement commercial. Les variantes sont produites
par `tests/v26-fixtures.cjs` :

- ECHOS_DECALE_500MS.wav : silence initial de 5513 échantillons à 11025 Hz, gain 0,62.
- ECHOS_GAIN90.wav : gain 0,90, utile pour contrôler l'indexation désactivée puis volontaire.
- AUTRE_MUSIQUE.wav : autre mélodie/pattern au même BPM et de même durée.
- ECHOS_REENCODE.mp3 : véritable encodage libmp3lame, débit 48 kb/s.
- REENCODE_DECODE.f32 : décodage de ce MP3 en Float32 mono 11025 Hz pour les tests Node.

Reproduction (ffmpeg local requis pour les deux dernières commandes) :

```sh
node tests/v26-fixtures.cjs
ffmpeg -v error -y -i examples/v26/ECHOS_ORIGINAL.wav -codec:a libmp3lame -b:a 48k examples/v26/ECHOS_REENCODE.mp3
ffmpeg -v error -y -i examples/v26/ECHOS_REENCODE.mp3 -ac 1 -ar 11025 -f f32le examples/v26/REENCODE_DECODE.f32
node --test tests/v26.test.cjs
```

Importer d'abord l'original, puis le MP3 ou le WAV décalé avec la comparaison
acoustique activée. Les fichiers restent des morceaux distincts. Le bouton
« examiner les anciennes partitions » doit proposer l'original. Aucun niveau
n'est copié sans votre sélection et la confirmation du décalage.

Ce corpus contrôle l'implémentation. Il ne démontre pas une identification
universelle, ni des taux de faux positifs sur une discothèque réelle.
Les personnages des tests faciaux viennent des diagnostics originaux `examples/v25/`.
