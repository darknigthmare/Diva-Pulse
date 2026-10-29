# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Version proposée — V36

La [PR #2](https://github.com/darknigthmare/Diva-Pulse/pull/2) applique les guides gamedev au rythme, au cycle audio, aux sauvegardes et au mouvement réduit. `main` reste sur V34, intégrée par la [PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1).

- Les restaurations contrôlent les versions de bibliothèque, les références obligatoires et les destinations en double avant toute écriture. Les erreurs désignent le champ concerné.
- Les copies restaurées conservent les signatures historiques des records et les brouillons récupérables. La restauration complète reste transactionnelle.
- Le mouvement réduit stabilise la caméra finale, y compris Director/VMD, Auto Show et les changements de plans, ainsi que les éléments de décor concernés. Le choix du jeu et la préférence système s'appliquent aussi au Canvas de secours et aux transitions CSS.
- Les correctifs de rythme et de cycle audio de V35 restent contrôlés : ordre musical des chaînes/MISS, annulation des préparations périmées et visibilité des cibles jusqu'à la fin de leur fenêtre de jugement.

[Excel courant : 136 points](planning/DIVA_PULSE_MANQUANTS_V36.xlsx) · [JSON](planning/BACKLOG_V36.json) · [CSV](planning/MANQUANTS_V36.csv) · [Guide V36 et preuves](docs/V36_ARCHIVES_SCENE_CALME.md)

Le classeur distingue 50 points réalisés dans leur périmètre, 25 partiels, 36 à faire et 25 à valider : 86 ouverts. `SAV-10` passe à Fait pour le contrôle des références déclarées des archives de bibliothèque ; `ARC-04`, `GAME-05` et `UX-05` conservent leurs validations restantes. Ces compteurs ne constituent pas un pourcentage de finition du jeu. La matrice complète des records/replays, les autres formats d'import, les animations intrinsèques des vidéos/modèles, le corpus MMD, la latence physique et la qualification sur appareils réels restent ouverts.

Les fonctionnalités précédentes restent documentées dans les guides [V35](docs/V35_RYTHME_FIABLE.md), [V34](docs/V34_BIBLIOTHEQUE_LIVE.md), [V33](docs/V33_RESSENTI_GAMEPLAY.md) et [V32](docs/V32_BOUCLES_SAUVEGARDES.md). Le [contrat des règles maison](docs/REGLES_DIVA_PULSE_V1.md) reste la référence pour les fenêtres, barèmes, HOLD, chaînes, accords et replays.

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
