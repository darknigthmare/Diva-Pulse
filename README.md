# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Proposition V30

[PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1) : grille à tempo variable et mesures réelles, raccourcis clavier protégés, scission de clips et correctifs de brouillon. Voir [le guide et les limites](docs/V30_MONTAGE.md).

[Excel détaillé des 114 points](planning/DIVA_PULSE_MANQUANTS_V30.xlsx) · [JSON](planning/BACKLOG_V30.json) · [CSV](planning/MANQUANTS_V30.csv)

L'Excel distingue les fonctionnalités présentes, partielles et non qualifiées. La compatibilité avec n'importe quel modèle MMD n'est pas garantie. Physique complète, rigs complexes, contenus finaux et validation sur appareils réels restent à traiter. La scission des clips synchronisés à un BPM source est explicitement refusée dans cette passe.

## Développement

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tools/verify_release.py
```

Les deux HTML autonomes sont générés depuis `src/`, sans CDN. Les formats sauvegardés ne suivent pas le numéro de version de l'application : le Director conserve son schéma 19. Les rapports historiques restent disponibles ; ne pas les additionner aux tests courants.

La CI de revue ne pousse pas vers main et ne fusionne aucune PR. Les workflows historiques d'autopublication sont retirés ; leurs versions restent dans l'historique Git.
