# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Proposition V32 — PR #1

[PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1), sans fusion automatique vers `main`.

La V31 précédemment locale est intégrée : écoute audio du Director, boucle A/B, vitesse, glisser groupé, formations numériques, fusion et copie entre danseurs portant le même modèle identifié. La V32 ajoute les scissions de boucles VMD sans perte de phase, leur fusion cohérente et l'enregistrement indivisible du Studio avec suppression de son brouillon. Un échec laisse la source et le brouillon récupérables.

[Guide V32 et limites](docs/V32_BOUCLES_SAUVEGARDES.md) · [Guide historique V30](docs/V30_MONTAGE.md)

[Excel détaillé des 123 points](planning/DIVA_PULSE_MANQUANTS_V32.xlsx) · [JSON](planning/BACKLOG_V32.json) · [CSV](planning/MANQUANTS_V32.csv) · [Méthode de suivi](planning/README.md)

Le suivi comporte 13 onglets, 35 points faits dans leur périmètre et 88 points ouverts. Ce décompte inclut les acquis antérieurs : ce n'est pas un pourcentage de finition du jeu. Physique complète, retargeting général, manipulation 3D des formations, contenus finaux et qualification sur appareils réels restent à traiter. La compatibilité universelle MMD n'est pas garantie.

## Compatibilité des sauvegardes

La version de l'application est 32.0.0. Un Director sans phase de boucle conserve le schéma 19 ; une phase non nulle requiert le schéma 20. Les imports 19 et 20 sont vérifiés. Une version antérieure du jeu ne sait pas interpréter la phase V20 : conserver une sauvegarde avant de revenir à une ancienne version. Les coupes dans un fondu restent explicitement refusées.

## Développement et preuves

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tools/verify_release.py
```

Les deux HTML autonomes sont générés depuis `src/`, sans CDN. `tools/verify_pr32.py` exige les rapports de tests correspondant exactement au build et au classeur, ainsi que 123 identifiants de suivi uniques. Les rapports historiques ne doivent pas être additionnés aux résultats courants.

La CI de revue est en lecture seule et rejoue 947 tests logiques, 10 contrôles du lanceur et 114 contrôles navigateur. Parmi ces derniers, les 23 contrôles de régression Director utilisent un document injecté ; les parcours courants, la persistance et l'annulation de transaction utilisent une origine HTTP réelle. Chromium et GPU logiciel ne constituent pas une qualification iPhone, Safari, Firefox ou manettes physiques. Un abandon volontaire d'une transaction IndexedDB n'est pas un test de panne disque ou d'arrêt du système.

Les workflows ponctuels de transfert ont été supprimés après vérification de la livraison ; leur historique reste disponible. Aucun workflow courant ne publie vers `main` ni ne fusionne cette PR.
