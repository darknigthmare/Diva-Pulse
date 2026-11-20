# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Version courante — V38

`main` a intégré la V37 via la [PR #2](https://github.com/darknigthmare/Diva-Pulse/pull/2). La V38 ferme la boucle joueur et documente la cible de production.

- Progression locale dérivée : huit objectifs, six niveaux, modules AURORA et EMBER, sans compte ni double crédit.
- Académie étendue à huit leçons, avec guide de calibration et de sauvegarde.
- Cinq démos originales synthétisées localement, cinq difficultés chacune, sans média tiers.
- États d’erreur actionnables (réessayer, copier le détail, fermer) et états vides avec action.
- [Bible du jeu V1](docs/BIBLE_DIVA_PULSE_V1.md) et [inventaire de provenance](docs/PROVENANCE_CONTENUS.md).

[Excel courant : 136 points](planning/DIVA_PULSE_MANQUANTS_V38.xlsx) · [JSON](planning/BACKLOG_V38.json) · [CSV](planning/MANQUANTS_V38.csv) · [Guide V38 et preuves](docs/V38_FINITION_JOYABLE.md)

Le suivi compte **52 points faits, 30 partiels, 31 à faire et 23 à valider**, soit **84 ouverts**. `GAME-06` et `UX-06` passent à Fait ; `GAME-08`, `ART-06` et `PUB-05` restent Partiel. Les validations sur appareils réels, la latence acoustique, les autres formats, le corpus MMD, la localisation et la matrice réelle complète des anciennes bibliothèques conservent leurs travaux restants. Les compteurs du classeur ne représentent pas un pourcentage de finition commerciale du jeu.

Les fonctionnalités précédentes restent documentées dans les guides [V37](docs/V37_PRISES_RECUPERATION.md), [V36](docs/V36_ARCHIVES_SCENE_CALME.md), [V35](docs/V35_RYTHME_FIABLE.md), [V34](docs/V34_BIBLIOTHEQUE_LIVE.md), [V33](docs/V33_RESSENTI_GAMEPLAY.md) et [V32](docs/V32_BOUCLES_SAUVEGARDES.md). Le [contrat des règles maison](docs/REGLES_DIVA_PULSE_V1.md) reste la référence pour les fenêtres, barèmes, HOLD, chaînes, accords et replays.

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
