# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Version proposée — V37

La [PR #2](https://github.com/darknigthmare/Diva-Pulse/pull/2) poursuit l’application des guides gamedev au rythme, au cycle audio, aux sauvegardes et à la fiabilité des prises. `main` reste sur V34, intégrée par la [PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1).

- La finalisation d’une prise conserve ses options moteur, sa partition, ses entrées et son résultat avant toute attente du stockage. Les modes assistés restent séparés des records normaux.
- Une écriture tardive ne rouvre pas un ancien résultat et ne modifie pas une nouvelle partie. Les records et l’historique sont enregistrés dans un ordre cohérent.
- La lecture d’un replay utilise sa propre partition sans remplacer temporairement les partitions de la bibliothèque.
- Les brouillons Director d’un ancien pack sont présentés avant toute modification susceptible de les écraser. Reprise, réassociation, export source et abandon sont des choix explicites.
- Les versions Director embarquées dans les archives sont contrôlées à l’import, en conservant les formats historiques pris en charge et le schéma de bibliothèque 5.

[Excel courant : 136 points](planning/DIVA_PULSE_MANQUANTS_V37.xlsx) · [JSON](planning/BACKLOG_V37.json) · [CSV](planning/MANQUANTS_V37.csv) · [Guide V37 et preuves](docs/V37_PRISES_RECUPERATION.md)

Le suivi compte **50 points faits, 27 partiels, 36 à faire et 23 à valider**, soit **86 ouverts**. `SAV-08` et `GAME-05` passent de À valider à Partiel ; `ARC-04` reste Partiel. Les validations sur appareils réels, la latence acoustique, les autres formats, le corpus MMD et la matrice réelle complète des anciennes bibliothèques conservent leurs travaux restants. Les compteurs du classeur ne représentent pas un pourcentage de finition commerciale du jeu.

Les fonctionnalités précédentes restent documentées dans les guides [V36](docs/V36_ARCHIVES_SCENE_CALME.md), [V35](docs/V35_RYTHME_FIABLE.md), [V34](docs/V34_BIBLIOTHEQUE_LIVE.md), [V33](docs/V33_RESSENTI_GAMEPLAY.md) et [V32](docs/V32_BOUCLES_SAUVEGARDES.md). Le [contrat des règles maison](docs/REGLES_DIVA_PULSE_V1.md) reste la référence pour les fenêtres, barèmes, HOLD, chaînes, accords et replays.

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
