# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Proposition V33 — PR #1

[PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1), sans fusion dans main. Effets localisés selon le jugement, sons procéduraux Pulse/Arcade/Soft, mouvement réduit du système, budgets audio/visuels et correctifs de reprise audio et de capture tactile. Voir [le guide V33](docs/V33_RESSENTI_GAMEPLAY.md).

[Excel détaillé des 132 points](planning/DIVA_PULSE_MANQUANTS_V33.xlsx) · [JSON](planning/BACKLOG_V33.json) · [CSV](planning/MANQUANTS_V33.csv)

Les fonctionnalités du Director et du Studio V30–V32 restent présentes : écoute indépendante, boucle A/B, montage groupé, grille à tempo variable, scission/fusion de clips compatibles, phase des boucles et sauvegardes atomiques. [Guide V30](docs/V30_MONTAGE.md) · [Guide V32](docs/V32_BOUCLES_SAUVEGARDES.md).

L'Excel distingue ce qui est présent, partiel et non qualifié. Compatibilité universelle MMD, root motion avancé, retargeting, contenus finaux, latence physique et qualification sur appareils réels restent à traiter.

## Développement

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tools/verify_release.py
```

Les deux HTML autonomes sont générés depuis `src/`, sans CDN. Les formats sauvegardés ne suivent pas le numéro de version de l'application : le Director conserve ses schémas 19/20. Les rapports historiques ne sont pas additionnés aux tests courants. La CI de revue finale est en lecture seule, ne pousse pas vers main et ne fusionne aucune PR. Les résultats à citer doivent correspondre au SHA du build réellement testé.
