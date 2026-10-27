# Arborescence — V4

`DIVA_PULSE_JOUER.html` et `index.html` : jeu autonome généré, mêmes octets. Aucun CDN requis.

`src/core.js` : validateurs, DSC/CSV, jugement, HOLD/CHAIN, synthèse des démos et analyse audio de base. `src/creator.js` : tempos, transformations de groupe, audit, MIDI, replay et statistiques. `src/live-core.js` : catalogue, validation d’identité/sections, fenêtre de rendu, générateur musical V4 et logique de progression.

`src/services.js` : Web Audio, décodage/analyse, IndexedDB/repli mémoire, transactions, empreintes et exports. `src/stage.js` : scènes WebGL 2, rigs, caméras, projecteurs/public et GLB embarqués.

`src/editor.js`, `src/editor-v3.js` : studio, cibles, waveform, tempo, sélection et PV. `src/app.js` : écrans, bibliothèque, gameplay et résultats. `src/enhancements.js` : intégration V3 et sauvegardes V4. `src/live-app.js` : catalogue, aperçu de génération, brouillons, sections, entraînement, accords, confort et scène de secours. Les intégrations sont installées avant `app.init()`.

`src/template.html`, `src/style.css`, `src/v3.css`, `src/v4.css` : structure et styles. Les noms V3 indiquent la provenance des modules, pas un ancien build chargé par erreur.

`build.py` : assemble le jeu inline et échappe les fermetures de script. `lancer.py` et les lanceurs OS : serveur de lecture local à origine fixe, contrôle de santé/version et conflit de port. `manifest.webmanifest`, `sw.js`, `icons/` : installation hors ligne facultative, sans médias personnels dans le cache du service worker.

`examples/` : exemples originaux V2/V3 conservés, avec catalogue et sections V4. `tests/make_v4_fixtures.cjs` reconstruit ces exemples et leur SHA audio réel.

`tests/core.test.cjs`, `creator.test.cjs`, `live.test.cjs`, `offline-shell.test.cjs` : logique Node, la dernière utilisant une VM simulée pour le contrat du service worker. `tests/launcher_test.py` : serveur Python réellement lancé et interrogé en HTTP loopback.

`tests/regression-v3.py`, `advanced_browser_test.py`, `creator_browser_test.py`, `live_browser_test.py` : scénarios navigateur actuels sur le HTML V4, lancés séquentiellement par `run_browser_suites.py`. Les noms des trois premières suites sont historiques ; leur compte rendu final provient de la V4. `tests/legacy-v2/` conserve les anciens scénarios à titre documentaire.

`qa/` : résultats JSON et captures de cette livraison. `qa/archive-v3/` et `docs/archive/` : archives distinctes, non comptées comme des exécutions V4. `docs/RAPPORT_TESTS.md` identifie les fichiers de preuve pertinents.

`SHA256SUMS.txt` : SHA-256 des fichiers du pack, sauf lui-même. Le zip de livraison n’est pas inclus dans son propre manifeste.
