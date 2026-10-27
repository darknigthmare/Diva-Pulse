# Rapport de vérification — DIVA PULSE 2.0.0

Date de livraison : 6 octobre 2026.

## Résumé

| Suite réellement exécutée | Réussites | Échecs |
|---|---:|---:|
| Moteur et formats — Node.js | 48 | 0 |
| Parcours navigateur principal | 32 | 0 |
| Entrées, entraînement et médias | 19 | 0 |
| **Total** | **99** | **0** |

Ces résultats concernent le périmètre des tests fournis, pas une certification de compatibilité générale ou d’absence de tous les bugs.

## Ce qui a été observé

Le démarrage, les trois démos et quinze charts, la sélection de personnages, un trio et ses variantes de tenue, les changements d’environnement, un import GLB avec skinning et animation, les cibles rythmiques, le studio et l’affichage responsive ont été exercés dans Chromium. Les captures `qa/01` à `qa/08` montrent le rendu de l’application, pas des maquettes générées.

Une partie Autoplay complète sur le fichier de contrôle de huit secondes a produit **15/15 COOL, 100 %, Full Combo**, puis l’écran de résultats sans enregistrer de record. Les quinze charts de démo ont aussi été parcourus intégralement par le moteur de test en Autoplay.

Une partie normale pilotée par **événements clavier DOM simulés**, en mode fond fixe, a produit **14 COOL, 1 FINE, 98.33 %**, avec inscription d’un record local. Ce n’est pas une mesure de performance d’un joueur ou d’un clavier physique. La session sans échec et l’entraînement n’ont pas remplacé le record normal.

Le WAV de test a été réellement décodé et analysé dans un worker du navigateur. Cinq nouvelles difficultés ont été créées sans écraser le JSON d’origine. Le même fichier audio réimporté a retrouvé sa bibliothèque. Le DSC synthétique, le LRC, le GLB à deux articulations et le MP4 de test ont été chargés par les véritables chemins d’import. Le lecteur PV a affiché le clip, puis sa pause a également suspendu la vidéo.

L’éditeur a été testé pour l’ajout, les coordonnées, undo/redo, création de version dérivée, capture de frappes et HOLD, sauvegarde et plans PV. Les exports ont été sérialisés et inspectés ; la restauration a ajouté des copies sans écraser les morceaux existants.

## Corrections vérifiées pendant cette passe

Les chaînes de slides acceptent désormais le maintien de la direction. Les sources clavier équivalentes n’interrompent pas le maintien de l’autre touche. Les empreintes de record incluent l’offset de partition. Un temps de vol DSC hors plage est refusé plutôt que modifié silencieusement. Les positions CSV omises ont un défaut valide. Les plans PV ne remplacent plus la scène choisie dans l’aperçu des modules ; cet aperçu applique la caméra et la danse sélectionnées. Les petits écrans ont une navigation sur deux lignes et une disposition paysage compacte. Le mode rythme prioritaire réduit le coût de rendu animé pendant la partie. Le clip court peut conserver son dernier cadre plutôt que relancer continuellement sa lecture.

## Environnement et restrictions

Node.js 22.16.0 ; Chromium 144 sous Linux ; Python Playwright ; affichage virtuel Xvfb et rendu logiciel SwiftShader. Le jeu fonctionne sans bibliothèque JavaScript distante.

La navigation HTTP localhost et `file://` était refusée par les politiques du navigateur de test. Aucune politique n’a été modifiée. Les tests chargent donc le HTML généré avec `set_content` dans une page vide. **Ce contexte opaque n’autorise pas la validation d’IndexedDB persistant entre rechargements.** Le repli mémoire et l’export ont été exercés ; le badge TEMPORAIRE présent dans les captures correspond à cet état réel.

Les actions d’export sont interceptées en mémoire pour contrôler les données, sans certifier l’enregistrement du téléchargement par le système d’exploitation. L’archive de livraison est créée et contrôlée séparément par Python.

La manette est simulée via l’API Gamepad. Les actions clavier sont des événements du navigateur ou des événements DOM simulés suivant le test. Aucun périphérique physique, casque Bluetooth ou écran tactile réel n’a été mesuré. Safari/iOS, Android, Firefox, les lanceurs Windows/macOS sur leurs systèmes respectifs et la persistance après fermeture réelle restent à vérifier.

Le rendu 3D logiciel animé a présenté des retards de cadence dans les tests d’entrée. Le mode fond fixe permet de tester le rythme sans ce coût. Aucun chiffre de latence matérielle ou promesse de 60 FPS universels n’est fourni.

## Détail des contrôles navigateur

### Parcours principal

| Contrôle | Résultat |
|---|---|
| Boot: three original songs and fifteen charts | Réussi |
| Real WebGL2 context, shader and stage drawing | Réussi |
| Modules: trio, per-slot costume and sakura stage | Réussi |
| GLB: embedded skinned model and animation loaded | Réussi |
| GLB: animation changes joint rotation | Réussi |
| GLB: original cast restored after clearing import | Réussi |
| Audio import: decoded eight-second WAV, empty chart library | Réussi |
| No chart: play disabled rather than inventing a level | Réussi |
| Native chart import: all fifteen notes unchanged | Réussi |
| LRC: synchronized local lyrics imported | Réussi |
| Pause: audio clock is frozen | Réussi |
| Complete real-time Autoplay: 15/15 COOL and 100% | Réussi |
| Autoplay never creates a record | Réussi |
| Manual editor: click adds an independent note | Réussi |
| Manual editor: target position changed precisely | Réussi |
| Manual editor: undo | Réussi |
| Manual editor: redo | Réussi |
| Edited imports saved as new versions, source intact | Réussi |
| PV director: timed camera, dance and stage event saved | Réussi |
| JSON export action serializes chart, scene and lyrics | Réussi |
| Actual audio worker creates five additional chart difficulties | Réussi |
| Generation does not overwrite the original chart | Réussi |
| Binary DSC import through UI preserves timing and chord mapping | Réussi |
| Reimporting exact audio file reuses song and charts | Réussi |
| Malformed import: friendly error, library unchanged | Réussi |
| Library export contains all songs and original media | Réussi |
| Library restore creates copies without overwriting originals | Réussi |
| Tactile setting stored | Réussi |
| Search filters the visible song library | Réussi |
| Mobile portrait has no horizontal page overflow | Réussi |
| Mobile landscape has no horizontal page overflow | Réussi |
| No uncaught JS or rendering errors in all tested flows | Réussi |

### Scénarios complémentaires

| Contrôle | Résultat |
|---|---|
| Menu preview is not overridden by a time-zero PV event | Réussi |
| Module preview uses chosen camera and animated dance | Réussi |
| Two keyboard aliases: releasing one preserves the other HOLD | Réussi |
| Releasing last alias clears held input | Réussi |
| Gamepad adapter maps R1 to right slide (simulated) | Réussi |
| Gamepad release clears input (simulated) | Réussi |
| Normal mode receives timed keyboard events and clears the song (fixed-stage mode) | Réussi |
| Normal eligible clear writes one local record | Réussi |
| Practice actually loops the chosen audio segment | Réussi |
| Live manual recording captures taps and held durations | Réussi |
| Recorded chart is independently saved | Réussi |
| Keyboard remapping updates the active binding | Réussi |
| Bindings can be restored | Réussi |
| No-fail session does not create or replace normal records | Réussi |
| Local MP4 decodes and is associated to the song | Réussi |
| PV viewer plays actual MP4 without rhythm notes | Réussi |
| PV pause also pauses its video | Réussi |
| Invalid GLB reports an error while preserving the built-in stage | Réussi |
| No uncaught errors in advanced scenarios | Réussi |

Les noms techniques des tests du moteur et leurs sorties sont conservés dans `qa/core-tests.tap`. Les résultats JSON complets se trouvent dans `qa/browser-results.json` et `qa/advanced-results.json`.
