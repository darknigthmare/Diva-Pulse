# DIVA PULSE V4 — Rapport de vérification

**Version : 4.0.0 — Encore & Library Edition. Date : 6 octobre 2026.**

Livraison reconstruite à partir de l’archive V3 Performance & Creator Edition fournie dans cette conversation. Les résultats ci-dessous concernent le HTML V4 construit depuis les sources du présent dossier, pas uniquement les résultats hérités de la V3.

## Résultat final

**150 tests de logique réussis sur 150 ; 173 vérifications navigateur réussies sur 173 ; 10 contrôles du lanceur HTTP réussis sur 10.** Aucun échec dans les exécutions finales. Aucun événement JavaScript non intercepté n’a été remonté par les scénarios navigateur finaux. Des erreurs attendues sont volontairement injectées ou déclenchées pour tester les refus et récupérations ; elles ne sont pas des preuves d’absence de tout bug.

| Suite | Résultat | Preuve |
|---|---:|---|
| Logique Node : moteur, studio, V4 et contrat de cache | 150/150 | `qa/v4-unit.tap` |
| Régression générale héritée | 32/32 | `qa/regression-v3.json` |
| Audio, saisie, modes et vidéo | 19/19 | `qa/advanced-results.json` |
| Studio V3, MIDI, replays, GLB et sauvegardes | 50/50 | `qa/creator-browser-results.json` |
| Catalogue, génération, brouillons et entraînement V4 | 72/72 | `qa/v4-browser-results.json` |
| Lanceur Python, identité, HTTP, conflit de port | 10/10 | `qa/v4-launcher-results.json` |

Les 150 tests Node regroupent 48 tests de base, 51 tests du créateur V3, 45 tests V4 et 6 contrats du service worker dans une VM. Les 173 contrôles navigateur regroupent 101 contrôles hérités réexécutés et 72 nouveaux contrôles V4. Le journal séquentiel final est `qa/v4-final-browser.log`.

## Environnement et portée

Node 22.16.0 ; Python 3.13 ; Playwright ; Chromium installé dans l’environnement. Les scénarios 3D sont exécutés avec Xvfb, Chromium fenêtré et ANGLE/SwiftShader. Le repli 2D est testé dans un autre navigateur avec indisponibilité WebGL explicitement simulée. Les scénarios ne modifient aucune politique de sécurité.

La navigation navigateur vers le serveur loopback est bloquée par la politique de cet environnement. Les scripts ont donc injecté le HTML autonome comme contenu d’une page vide, **sur une origine opaque**. Le statut de stockage est alors TEMPORAIRE. La 3D, le décodage audio/vidéo, les menus, l’analyse, les contrôles et la sérialisation fonctionnent dans ce contexte ; **cela ne valide pas IndexedDB après fermeture, un lancement `file://`, une installation PWA ou un redémarrage hors ligne**.

Le lanceur a été exécuté et interrogé séparément par HTTP Python sur `127.0.0.1`. Les contrôles de service worker sont des tests isolés de sa logique de cache dans une VM Node. Ni ces tests ni le service HTTP ne remplacent une installation navigateur réelle.

Les exports de l’application sont interceptés comme Blobs/chaînes, décodés et inspectés. Les téléchargements par l’interface native de chaque système ne sont pas certifiés. Les archives et le HTML livrés dans la conversation sont en revanche des fichiers effectivement créés et contrôlés.

## Nouveautés V4 vérifiées

**Catalogue.** Ajout sans retirer les sources, déduplication, export sans audio, import annulable, association de démo identifiée, conservation des décimales et de la carte de tempo, exigence de confirmation pour titre seul, maintien de la provenance non vérifiée. Validation des limites, URL source, SHA-256 complet, identifiants de démo et capacité de morceau. La comparaison ne transforme pas une correspondance de titre en identité audio et ne vérifie pas l’authenticité officielle d’un niveau.

**Génération.** Analyse audio réelle d’un WAV de contrôle ; aperçu des cinq difficultés sans écriture immédiate ; désactivation des accords/HOLD/slides ; annulation sans changement ; confirmation ajoutant exactement les signatures prévisualisées ; conservation des attaques hors quantification. Analyse d’un AudioBuffer stéréo de phases opposées, et refus d’un signal d’annulation déjà activé. Tests déterministes des motifs répétés, densités, placements, silences et limites.

**Studio.** Ajout/refus/annulation de sections sans retimer les notes. Brouillon séparé de la source ; récupération ; enregistrement dérivé ; suppression du brouillon après succès. Écriture de morceau volontairement refusée : éditeur toujours modifié, brouillon encore présent ; rétablissement du stockage puis enregistrement réussi. Brouillon dont le parent a été supprimé : récupération sans écraser une partition différente.

**Contrôles et entraînement.** Ajout volontaire d’un raccourci d’accord, refus d’une touche déjà unitaire, événements clavier Q/D avec relâchements indépendants ; gâchette L2 via API Gamepad simulée. Sections choisies dans le dialogue d’entraînement. Simulation déterministe d’une boucle parfaite augmentant la vitesse de 75 à 80 %, puis d’une boucle manquée conservant 80 %. Historique indépendant des records, HUD de tentative. Une suite héritée vérifie séparément la répétition effective du segment audio.

**Bibliothèque et sauvegardes.** Aperçu audio démarré puis arrêté à la navigation ; tri de deux morceaux au même titre par leur identifiant ; retrait de partition annulé puis confirmé avec possibilité d’export. Pack V4 avec catalogue/brouillons, confirmation facultative des préférences, restauration en copies et remappage des propriétaires, catalogue non doublé et refus d’un catalogue corrompu avant écriture.

**Rendu et confort.** NoteScale, masque et réduction d’effets, scènes WebGL sans erreur GL, repli 2D dessiné et annoncé honnêtement. Vérification d’absence de débordement horizontal de bibliothèque/réglages/studio sur 390×844 et 844×390 ; catalogue en portrait. Ce sont des dimensions simulées, pas des téléphones physiques. Les captures figurent dans `qa/v4-*.png`.

## Corrections reproduites et contrôlées

Maintenir une slide avant la première note de chaîne validait auparavant la chaîne sans frappe de tête. Le cas est désormais refusé, tandis qu’une frappe de tête valide permet la continuation tenue. Le relâchement réarme correctement la condition. Un mode historique explicite préserve cette ancienne interprétation pour les replays marqués V3 ; ce n’est pas une garantie générale d’équivalence avec tout moteur passé/futur.

La fenêtre de rendu est recherchée dans la liste triée ; test sur 50 000 notes et vérification conservatrice avec durées d’approche, offsets et vitesses différents. Ce test démontre le bornage du parcours de données, **pas un objectif garanti d’images par seconde**.

Échec de sauvegarde : les données en cours restent récupérables. Changement de version de base : les écritures sont refusées au lieu d’un faux succès dans un repli mémoire. La durabilité matérielle et la fermeture réelle de navigateur ne sont pas couvertes.

Un cache plein ne fait plus échouer une réponse réseau valide du service worker. Son routage ignore les médias audio, les requêtes étrangères et les méthodes autres que GET ; son nettoyage n’efface pas les caches d’autres applications. Ces six points sont des contrats VM, pas des essais de cache navigateur.

## Régressions V3 réexécutées

Partie complète, score éligible local et absence de score pour les modes non classés ; pause/reprise ; boucles audio ; enregistrement manuel des touches ; réglages/remappage ; vidéo MP4 décodée et jouée en PV ; GLB animé et refus d’un GLB invalide ; import natif/DSC/CSV/MIDI ; grille de tempo et sélection multiple ; historique atomique ; MIDI de 5 000 notes en aller-retour natif ; replays et pause de replay ; setlists ; sauvegardes/restauration ; formats portrait/paysage. Les événements de clavier et de manette de ces tests sont synthétiques.

## Pas validé / pas livré

La persistance réelle après fermeture/réouverture, l’installation PWA et le hors-ligne navigateur, Safari/iOS, Firefox, Android, contrôleur physique, écran tactile réel, Bluetooth, mesure instrumentale de latence et framerate matériel restent à vérifier. Le ralenti modifie la hauteur du son. Les historiques de sessions, replays et tentatives exportés ne sont pas fusionnés automatiquement à la restauration.

Les modèles, costumes et mouvements restent procéduraux ; aucun pack officiel SEGA, aucune chanson commerciale, aucun niveau officiel téléchargé ou recherche distante n’est ajouté. Le barème et les trajectoires ne sont pas certifiés 1:1. Aucun site n’a été publié ou redéployé pendant cette livraison. Ces contrôles ne constituent ni une certification commerciale ni une garantie « zéro bug ».

## Reproduire

`python3 build.py` reconstruit les deux HTML. `npm test` lance les quatre suites Node. `python3 tests/launcher_test.py` teste le serveur. `python3 tests/run_browser_suites.py` lance les quatre suites navigateur l’une après l’autre ; Python Playwright, Chromium et Xvfb doivent déjà être disponibles. Aucun téléchargement automatique de dépendance ni changement de politique navigateur n’est effectué.

`SHA256SUMS.txt` donne les empreintes SHA-256 du contenu livré. Les rapports sous `qa/archive-v3/` et `docs/archive/` sont historiques et ne sont pas comptés dans les résultats V4 ci-dessus.
