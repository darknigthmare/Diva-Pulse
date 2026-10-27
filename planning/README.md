# Suivi courant — V32

Classeur : [DIVA_PULSE_MANQUANTS_V32.xlsx](DIVA_PULSE_MANQUANTS_V32.xlsx).

123 points : 35 faits dans leur périmètre, 20 partiels, 41 à faire, 27 à valider ; 88 restent ouverts. Aucun pourcentage de finition du jeu n’est déduit de ces compteurs.

Le JSON `BACKLOG_V32.json` et le CSV `MANQUANTS_V32.csv` permettent une revue textuelle. Les onglets historiques V28 à V31 conservent leur contexte. Le code V31 précédemment local est désormais intégré avec V32 ; les preuves natives sont rattachées au build, et ne certifient aucun périphérique physique.

`V32_RELEASE.json` fixe les empreintes du build et du classeur. Le contrôle `tools/verify_pr32.py` compare les tâches et les compteurs du classeur au JSON et exige les nouvelles preuves natives.

PR #1 : https://github.com/darknigthmare/Diva-Pulse/pull/1. Aucune fusion dans main.
