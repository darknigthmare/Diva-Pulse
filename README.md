# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Version courante — V34

V34 intégrée dans `main` via la [PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1), fusionnée le 28 octobre 2026. Nettoyage explicite des médias inutilisés avec relecture transactionnelle des références ; protection des morceaux, des réglages et des brouillons ; diagnostic exportable. Mise en pause lors des interruptions audio, reprise manuelle et jauges HOLD lisibles même lorsque les effets sont coupés. Les sons sont préparés silencieusement avant le premier jugement.

[Excel courant : 136 points](planning/DIVA_PULSE_MANQUANTS_V34.xlsx) · [JSON](planning/BACKLOG_V34.json) · [CSV](planning/MANQUANTS_V34.csv) · [Guide V34 et limites](docs/V34_BIBLIOTHEQUE_LIVE.md)

Les effets localisés et les signatures Pulse/Arcade/Soft V33 restent présents, ainsi que l’écoute indépendante, la boucle A/B, le montage groupé, la grille à tempo variable, la scission/fusion de clips compatibles et les sauvegardes atomiques. [Guide V33](docs/V33_RESSENTI_GAMEPLAY.md) · [Guide V32](docs/V32_BOUCLES_SAUVEGARDES.md).

Le classeur distingue 49 points réalisés dans leur périmètre, 25 partiels, 37 à faire et 25 à valider : 87 ouverts. Il ne constitue pas un pourcentage de finition du jeu. Root motion avancé, adaptation entre squelettes, corpus MMD, latence physique et qualification sur appareils réels restent ouverts.

## Guides pour la suite du développement

Les [consignes du dépôt](AGENTS.md) et le [guide gamedev adapté à Diva Pulse](docs/GUIDE_DEVELOPPEMENT_GAMEDEV.md) relient huit fiches du catalogue `awesome-gamedev-agent-skills` au moteur web du projet, aux fichiers et aux IDs du suivi. La [sélection est figée à une révision précise](docs/GAMEDEV_SKILLS_SELECTION.json). Elle couvre audio, commandes, feedback, interface, caméra, génération, sauvegardes et performances.

Les critères propres au jeu musical préservent le timing, les pistes manuelles et les données sauvegardées. Les manquants et validations matérielles conservent leurs statuts dans l'Excel courant.

## Développement

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tools/verify_release.py
```

Les deux HTML autonomes sont générés depuis `src/`, sans CDN. Les formats sauvegardés ne suivent pas le numéro de version de l'application : le Director conserve ses schémas 19/20. Les rapports historiques ne sont pas additionnés aux tests courants. La CI de revue finale est en lecture seule, ne pousse pas vers main et ne fusionne aucune PR. Les résultats à citer doivent correspondre au SHA du build réellement testé.
