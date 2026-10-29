# DIVA PULSE

Jeu de rythme autonome : cinq difficultés, partitions éditables, AutoMap, Auto Show, import MMD et Director pour monter clips, caméra et éclairage. Aucun catalogue musical officiel n'est fourni.

## Jouer

Lancer `LANCER_WINDOWS.bat` sous Windows ou `LANCER_MAC_LINUX.command` sous macOS/Linux. Python 3 doit être disponible. Autre possibilité : `python3 lancer.py`. Les données de bibliothèque restent dans le navigateur ; exporter un `.pulsebundle` avant migration ou nettoyage du stockage.

## Version proposée — V35

La [PR #2](https://github.com/darknigthmare/Diva-Pulse/pull/2) applique les guides gamedev au rythme et au cycle audio. `main` reste sur V34, intégrée par la [PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1).

- Les continuations de chaînes et les MISS suivent l'ordre musical des événements. Des entrées livrées chronologiquement donnent le même résultat avec différentes cadences d'affichage simulées.
- Les lancements, reprises et boucles devenus périmés pendant une préparation audio, scène ou vidéo sont annulés. Une interruption impose une nouvelle action explicite.
- Les cibles restent visibles jusqu'à la fin de la fenêtre du profil de jugement, notamment les 180 ms du profil Accessible.
- Un [contrat versionné des règles maison](docs/REGLES_DIVA_PULSE_V1.md) précise les fenêtres, barèmes, HOLD, chaînes, accords, replays et limites.

[Excel courant : 136 points](planning/DIVA_PULSE_MANQUANTS_V35.xlsx) · [JSON](planning/BACKLOG_V35.json) · [CSV](planning/MANQUANTS_V35.csv) · [Guide V35 et preuves](docs/V35_RYTHME_FIABLE.md)

Le classeur distingue 49 points réalisés dans leur périmètre, 26 partiels, 36 à faire et 25 à valider : 87 ouverts. `GAME-01` passe à Partiel ; `GAME-03`, `GAME-04` et `UX-03` reçoivent les constats et limites du correctif. Ces compteurs ne constituent pas un pourcentage de finition du jeu. Le root motion avancé, l'adaptation entre squelettes, le corpus MMD, la latence physique et la qualification sur appareils réels restent ouverts.

Les fonctionnalités précédentes restent documentées dans les guides [V34](docs/V34_BIBLIOTHEQUE_LIVE.md), [V33](docs/V33_RESSENTI_GAMEPLAY.md) et [V32](docs/V32_BOUCLES_SAUVEGARDES.md).

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
