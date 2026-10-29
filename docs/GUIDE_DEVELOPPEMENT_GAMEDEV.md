# Utiliser les guides gamedev pour Diva Pulse

## Périmètre et base vérifiée

Ce guide traduit une sélection de fiches du catalogue [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) en règles de travail propres à Diva Pulse. Il organise les prochaines interventions et leurs preuves ; il n'ajoute pas à lui seul une fonctionnalité de jeu.

- Base examinée : Diva Pulse **34.0.0**, commit `1337f0889cb52fd899ab963443273b9feffa0fa6` de `main`, le 29 octobre 2026.
- La [PR #1](https://github.com/darknigthmare/Diva-Pulse/pull/1) a été fusionnée le 28 octobre 2026.
- Catalogue retenu : commit `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`. Les liens ci-dessous sont figés à cette révision.
- Suivi de référence : [BACKLOG_V34.json](../planning/BACKLOG_V34.json) et [Excel V34](../planning/DIVA_PULSE_MANQUANTS_V34.xlsx), 136 points dont 87 ouverts à la date de l'examen. Cette sélection ne change aucun statut.

## Le contrat technique du projet

| Domaine | Sources à lire avant modification | Contrat |
| --- | --- | --- |
| Build et lancement | `build.py`, `src/template.html`, `package.json`, `lancer.py` | Sources JavaScript/CSS intégrées dans deux HTML identiques ; jeu autonome sans CDN ; Node >=22 pour les tests, Python 3 pour le build/lanceur. |
| Rythme et entrées | `src/core.js`, `src/app.js`, `src/live-core.js`, `src/services.js`, `src/enhancements.js`, `src/precision-core.js` | Le transport audio et les timestamps pilotent le temps musical ; les extensions actives doivent être lues avec le module de base. |
| Présentation | `src/stage.js`, `src/feedback33.js`, `src/live-feedback34.js` | WebGL 2 direct pour la scène, Canvas 2D pour le jeu, Web Audio pour les sons ; effets séparés des jugements. |
| Édition et génération | `src/director-core.js`, `src/director-workflow.js`, `src/autoshow-core.js`, `src/automap-core.js` | Données éditables, génération reproductible, respect des verrous manuels et des schémas persistés. |
| Persistance | `src/services.js`, `src/reliability.js`, `src/media-vault.js`, `src/bundle-core.js` | Droit d'écriture contrôlé, sauvegarde transactionnelle, intégrité des références et récupération explicite. |

Le moteur identifié est **le moteur web maison du dépôt**. Le [routeur du catalogue](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/router/SKILL.md) et sa [référence pour moteurs personnalisés](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/router/references/custom-engines.md) permettent d'utiliser les disciplines sans importer un moteur supplémentaire.

## Huit fiches utiles, à charger selon la tâche

| Fiche | Application à Diva Pulse | Adaptation indispensable |
| --- | --- | --- |
| [audio-design](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/audio-design/SKILL.md) | Transport, volumes, mix Music/SFX/UI, préparation des sons, événements musicaux. | Préserver la chanson et la chronologie de la partition. L'adaptation musicale, le ducking et la quantification d'actions ne s'appliquent pas automatiquement au morceau jugé. |
| [input-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/input-systems/SKILL.md) | Actions, remappage, conflits, clavier/manette/tactile, pressions et relâchements. | Conserver le timestamp effectif ; aucun buffer de saut ni coyote time ajouté aux fenêtres de jugement. |
| [game-feel](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-feel/SKILL.md) | Retours de notes, combos, HOLD, signatures VFX/SFX, réglage d'intensité. | Les effets restent décoratifs ; aucun gel de l'horloge musicale, du traitement des entrées ou du barème. |
| [game-ui-ux](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux/SKILL.md) | HUD, menus, focus clavier/manette, lisibilité, petits écrans et zones sûres. | Distinguer les actions de menu des frappes musicales ; les cibles et informations utiles restent visibles. |
| [camera-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/camera-systems/SKILL.md) | Cadrage du groupe, transitions, contraintes de scène et réduction du mouvement. | Évaluer les plans au temps musical, préserver les clés manuelles et remettre les états de lissage en cohérence après un seek. |
| [procedural-gen](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/procedural-gen/SKILL.md) | Déterminisme d'AutoMap/Auto Show, graine, validation et reproductibilité. | Les exemples de terrains/donjons ne créent pas une chorégraphie musicale ; les contraintes de notes, poses et plans sont propres au projet. |
| [save-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/save-systems/SKILL.md) | Schémas, migrations, intégrité, export/restauration et reprise après incident. | Traduire les concepts vers IndexedDB et les bundles existants ; le code de renommage de fichiers Godot n'est pas une transaction navigateur. |
| [performance-optimization](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/performance-optimization/SKILL.md) | Profilage CPU/GPU, allocations, mémoire, scènes MMD et effets. | Mesurer sur un scénario identique ; protéger le rythme et l'audio avant d'enrichir le spectacle. |

Le manifeste [GAMEDEV_SKILLS_SELECTION.json](GAMEDEV_SKILLS_SELECTION.json) relie chaque fiche à ses fichiers, aux tests existants et aux IDs du suivi. Il sert de registre de sélection, sans téléchargement ou installation automatique.

Le catalogue ne contient pas de fiche dédiée au jeu de rythme ni à MMD. Les fiches Three.js ne correspondent pas au moteur actuel, même pour l'import GLB déjà présent. Des guides supplémentaires sur les shaders ou la création d'assets pourront être sélectionnés lorsqu'un chantier précis en a besoin.

## Règles d'application et critères de validation

### 1. Garder des jugements stables

Préserver les règles de score actuelles tant qu'un changement de règles n'est pas demandé et spécifié. Pour toute modification du timing, construire des entrées horodatées avec résultats attendus, couvrant les frontières de jugement, notes simultanées, HOLD, slides, vitesse, calibration, pause et reprise.

Comparer le même historique d'entrées avec plusieurs cadences d'affichage simulées, par exemple 30/60/144 Hz : les jugements et le score doivent être identiques lorsque les timestamps sont identiques. Cette proposition de validation ne certifie pas la latence des périphériques physiques.

Préserver le comportement V34 : une interruption audio met en pause ; la reprise du contexte ne relance pas la partie ; une préparation devenue périmée est annulée. Les SFX de frappe ne sont pas retardés au prochain temps pour satisfaire un exemple générique de synchronisation musicale.

### 2. Rendre les effets lisibles

Un même événement peut produire un son et une animation courte, sans changer la partition ni les journaux de replay. Les compteurs et jauges utiles restent accessibles lorsque les effets décoratifs sont coupés. Vérifier les passages denses, le contraste sur fond lumineux et le mouvement réduit.

Le feedback V33 borne déjà ses ressources à 48 impacts, 12 voix et 96 buffers ; ce sont des limites de cette couche, pas un budget global certifié pour le jeu. Le test de présentation dans `tests/v33.test.cjs` vérifie déjà la conservation du jugement, du replay et de la signature de partition.

### 3. Générer sans effacer le travail manuel

Conserver les entrées musicales, paramètres, graine et version de génération, ou sauvegarder le résultat complet. Vérifier une génération identique à données identiques, puis les cas silence, retour arrière, durée courte et contenu inhabituel.

Les verrous doivent protéger toutes les pistes manuelles, y compris après sauvegarde/restauration. La progression technique des cinq difficultés se complète par des parties jouées : densité et cohérence des ancres ne prouvent pas le confort d'un pattern.

### 4. Décrire la compatibilité MMD avec des preuves

Partir du diagnostic et des formats réellement pris en charge. Qualifier séparément textures, échelle, axes, squelette, morphs, interpolation, IK, skinning et physique. Enregistrer pour chaque modèle du corpus sa provenance, son empreinte, le scénario et les limitations observées, conformément à `MMD-14`.

L'import d'un petit modèle de test ne clôt ni l'adaptation entre squelettes, ni les contacts de pieds, ni le root motion. Ces travaux restent identifiés par `ANI-01` à `ANI-04`.

### 5. Vérifier sauvegardes et performances dans leur contexte

Valider les données avant écriture, publier un succès après le commit transactionnel et préserver les anciennes données si une restauration échoue. Couvrir les références manquantes, doublons, versions inconnues, annulations et reprise depuis une autre session. Les schémas Director 19/20 sont distincts de la version 34 de l'application.

Pour les performances, fixer chanson, partition, scène, modèles, options, navigateur et appareil. Relever p50/p95/p99 des temps d'image, mémoire et interruptions audio, puis comparer avant/après. Une cible de 60 FPS correspond à 16,67 ms par image ; c'est un objectif éventuel, pas une mesure acquise. Le coût du rendu ne doit pas être compensé en décalant les notes.

## Ordre de travail recommandé à partir du suivi existant

Cet ordre est une proposition de développement. Les priorités et statuts du classeur restent la référence.

| Lot | Identifiants existants | Résultat concret attendu |
| --- | --- | --- |
| Règles et timing | `GAME-01`, `GAME-02`, `GAME-03`, `GAME-04` | Spécification versionnée du comportement visé et cas limites avec résultats attendus. |
| Commandes et cibles réelles | `GAME-07`, `QA-02`, `QA-03`, `PER-01`, `PER-02`, `PER-04` | Matrice de périphériques/navigateurs, rapports de latence et temps d'image sur les scénarios définis. |
| Corpus MMD et animation | `MMD-14`, `MMD-11`, `MMD-12`, `MMD-15`, `MMD-16`, `ANI-01` à `ANI-04` | Cas représentatifs documentés, puis correction des rigs, appuis et déplacements mesurée sur ces cas. |
| Génération et spectacle | `MAP-01`, `MAP-02`, `MAP-04`, `ANI-09`, `ANI-10`, `ANI-11`, `UX-03`, `UX-05`, `QA-07` | Charts jouables, régénération respectant les verrous, cadrages lisibles et effets réglables. |
| Reprise et intégrité | `SAV-05`, `SAV-06`, `SAV-08`, `SAV-09`, `SAV-10` | Archives et sessions reprises sans références cassées ni mutation partielle. |

Les dépendances détaillées restent dans le JSON/Excel, notamment `PUB-05` pour `MMD-14`. Utiliser les IDs existants évite une seconde liste de tâches concurrente.

## Vérifications à choisir selon les fichiers touchés

Après une modification du runtime, reconstruire avec `python3 build.py`, puis exécuter `npm test`, `python3 tests/launcher_test.py` et `python3 tools/verify_release.py`. Vérifier le diff des deux HTML générés.

| Zone modifiée | Vérifications existantes utiles |
| --- | --- |
| Jugements, entrées, interruptions, feedback | `tests/core.test.cjs`, `tests/live.test.cjs`, `tests/precision.test.cjs`, `tests/v33.test.cjs`, `tests/v34.test.cjs` ; `python3 tests/v33_browser_test.py`, `python3 tests/v34_browser_test.py`. |
| Director, audition et montage | `tests/v30.test.cjs`, `tests/v31.test.cjs`, `tests/v32.test.cjs` ; `python3 tests/v30_browser_test.py`, `python3 tests/v31_browser_test.py`, `python3 tests/v32_browser_test.py`. |
| AutoMap et Auto Show | `tests/automap.test.cjs`, `tests/v20-autoshow.test.cjs`, `tests/v23-automap.test.cjs` et corpus `tests/v24-audio-corpus.cjs` ; compléter avec le parcours correspondant à la modification. |
| MMD et rendu | `tests/mmd.test.cjs`, tests de skinning/physique des versions concernées ; `python3 tests/v28_native_mmd_browser.py` pour la fixture existante, puis corpus représentatif à compléter. |
| Sauvegardes et médias | `python3 tests/v29_persistence_test.py`, `python3 tests/v32_transactions_test.py`, `python3 tests/v34_browser_test.py`. |
| Documentation seule | Vérification des liens, chemins, SHA, commandes documentées et IDs du backlog ; aucune conclusion nouvelle sur le comportement du jeu. |

Le job [quality.yml](../.github/workflows/quality.yml) exécute ses contrôles complets sur la PR. Une session de validation doit enregistrer le commit réellement testé, les commandes et leurs résultats. Le SHA du code et le hash du build sont des preuves différentes.

`tools/verify_pr34.py` vérifie actuellement le hash exact de l'Excel, ses 17 onglets, ses lignes et les résultats navigateur frais. Conserver ce gate lors de l'adoption des guides. Une évolution ultérieure du suivi nécessitera un export cohérent et une mise à jour explicite de ses contrôles.

Les preuves Chromium/SwiftShader, document injecté et HTTP natif n'ont pas la même portée. En particulier, `PULSE_DOCUMENT_MODE=1` ne réalise pas l'abandon natif de transaction du scénario V34. Safari, iPhone, manettes physiques, éviction réelle du stockage et latence acoustique restent à qualifier selon le suivi.

## Maintenance des références

Pour mettre à jour la sélection : relire le diff amont, vérifier les exemples contre les API du projet, modifier ensemble le manifeste et ce guide, puis indiquer les adaptations dans la PR. Le catalogue peut évoluer indépendamment du jeu.

Cette intégration référence les fiches ; elle n'en redistribue pas les fichiers. La source annonce la licence Apache-2.0. Si des fiches sont copiées ultérieurement, conserver les mentions et obligations de la licence ainsi que `NOTICE`.
