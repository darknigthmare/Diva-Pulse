# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Version courante — V39

`main` a intégré la V37 via la [PR #2](https://github.com/darknigthmare/Diva-Pulse/pull/2). La V38 (boucle joueur, bible et provenance) reste sur la branche `feat/v38-bible-finition` ; la V39 y ajoute la première visite et des mesures d'accessibilité rattachées au build.

- Première visite non bloquante : quatre glyphes, HOLD et CHAIN expliqués, saut persistant, rejeu depuis l'aide, **un clic** jusqu'à la première note.
- Mesures C1–C8 : contrastes texte et non textuels, focus visible, cibles 24/44 px, reflow 320 px, zoom 200 %, états actifs sans couleur seule, absence de piège de focus.
- Rapport `qa/v39/accessibility/report.json` lié au `buildSha256` ; la gate V39 refuse un rapport absent, périmé ou en échec.
- [Guide V39 et limites](docs/V39_PREMIERE_VISITE_ACCESSIBILITE.md) · [protocole QA-07](docs/QA07_PROTOCOLE_V39.md) · [bible du jeu V1](docs/BIBLE_DIVA_PULSE_V1.md) · [provenance](docs/PROVENANCE_CONTENUS.md).

[Excel courant : 143 points](planning/DIVA_PULSE_MANQUANTS_V39.xlsx) · [JSON](planning/BACKLOG_V39.json) · [CSV](planning/MANQUANTS_V39.csv)

Le suivi compte **53 points faits dans leur périmètre, 33 partiels, 34 à faire et 23 à valider**, soit **90 ouverts**. `GAME-12`, `UX-08` et `UX-09` passent à Partiel : le code et les contrôles statiques existent, la preuve navigateur et les cinq sessions `QA-07` restent à exécuter. `QA-13` est documentaire. Les validations sur appareils réels, la latence acoustique, les autres formats, le corpus MMD, la localisation et la matrice réelle complète des anciennes bibliothèques conservent leurs travaux restants. Les compteurs du classeur ne représentent pas un pourcentage de finition commerciale du jeu.

Les fonctionnalités précédentes restent documentées dans les guides [V38](docs/V38_FINITION_JOYABLE.md), [V37](docs/V37_PRISES_RECUPERATION.md), [V36](docs/V36_ARCHIVES_SCENE_CALME.md), [V35](docs/V35_RYTHME_FIABLE.md), [V34](docs/V34_BIBLIOTHEQUE_LIVE.md), [V33](docs/V33_RESSENTI_GAMEPLAY.md) et [V32](docs/V32_BOUCLES_SAUVEGARDES.md). Le [contrat des règles maison](docs/REGLES_DIVA_PULSE_V1.md) reste la référence pour les fenêtres, barèmes, HOLD, chaînes, accords et replays.

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
