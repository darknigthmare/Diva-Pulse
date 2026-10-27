# Ateliers originaux V5

L’Académie est accessible directement depuis **Jouer → Académie · 6 leçons**. Au premier lancement d’une leçon, le jeu crée son instrumental et ajoute les six partitions à la bibliothèque. Il n’est pas nécessaire d’importer les fichiers de ce dossier pour suivre ces leçons ou gagner leurs médailles.

Ce dossier permet aussi de tester les imports et de réutiliser les exemples :

- `ATELIER_DU_RYTHME_120BPM.wav` : instrumental original de 32 secondes ; les six `academy-v5-*.pulse.json` sont les mêmes partitions que les leçons intégrées.
- `ATELIER_DES_MESURES.wav` : exercice sonore original de 28 secondes. Les notes commencent à 2 secondes ; la signature évolue du 3/4 au 7/8, puis au 6/8. Les accents faibles ne sont pas tous des notes à jouer.
- `MESURES_MIXTES_V5.pulse.json` et `.mid` : la même partition de cet exercice. Le MIDI contient les signatures standard et les métadonnées natives exactes, dont les groupes d’accents.
- `CATALOGUE_ATELIERS_V5.pulsecharts` : sept partitions associées aux deux WAV par leurs vrais SHA-256 ; aucune musique dans ce catalogue.

## Essayer les mesures mixtes

Importer `ATELIER_DES_MESURES.wav` comme morceau, puis `MESURES_MIXTES_V5.pulse.json` comme partition. Autre parcours : importer le catalogue dans **Partitions disponibles**, examiner l’association vérifiée du WAV, puis ajouter sa partition.

Dans le studio, ouvrir **Signatures & accents**. Mesure 1 : 3/4 ; pulsation 12 : 7/8, groupes 2+2+3 ; pulsation 26 : 6/8, groupes 3+3. Les pulsations de ce champ sont toujours comptées en noires, pas en croches. Le décalage audio de la partition vaut +2 secondes.

Les fichiers JSON/MIDI seuls n’emportent pas l’audio. L’import du catalogue ou d’une leçon comme morceau ordinaire ne remplace pas le parcours Académie qui valide les médailles.

Reconstruction exacte des WAV et partitions : `node tests/make_v5_fixtures.cjs` depuis la racine. Aucun téléchargement, média officiel ou paquet externe.
