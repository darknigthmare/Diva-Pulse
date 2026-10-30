# V36 — Archives fiables et scène calme

## Périmètre

Ce lot poursuit l'application du [guide gamedev](GUIDE_DEVELOPPEMENT_GAMEDEV.md) après la V35. Il traite l'intégrité des restaurations (`SAV-10`), les versions de bibliothèque (`ARC-04`), la conservation des records historiques (`GAME-05`) et le mouvement réduit (`UX-05`). Le jeu reste autonome, avec les mêmes formats exportés et les règles `rules4` documentées.

## Archives et copies restaurées

Les archives de bibliothèque déclarent leur propre version, distincte de celle du jeu. Les versions historiques reconnues sont 2, 3, 4 et 5 ; `.pulsebundle` garde son conteneur binaire version 1. Les formats inconnus doivent être refusés avec un diagnostic avant la confirmation et toute écriture.

Le contrôle préalable vérifie les identifiants et les destinations réellement restaurées : morceaux, médias, partitions dans chaque morceau et familles de brouillons. Il vérifie les propriétaires et références requises. Pour une scène Director/Auto Show publiée, le modèle et les motions doivent aussi appartenir au pack MMD du morceau et aux fichiers que son chargeur sait effectivement sélectionner. Deux contenus visant la même destination ne doivent pas se remplacer silencieusement. Un brouillon conservé après suppression de sa partition source reste récupérable si son morceau propriétaire est présent. Un brouillon Director provenant d’un ancien pack conserve ses médias accessibles et reste séparé de la scène publiée ; sa réassociation exige toujours une action explicite.

La restauration conserve son fonctionnement en copies, avec de nouveaux identifiants de morceaux et médias. Les contenus déjà présents restent protégés. Les records dont la clé historique est reconnue conservent la signature de leur partition : seul l'identifiant du morceau est remappé. Plusieurs signatures historiques d'une même partition peuvent ainsi coexister sans être réattribuées à sa version actuelle.

## Réduction des mouvements

Le mode réduit s'applique à la caméra finalement utilisée par le rendu, y compris les caméras Director/VMD, les coupes intégrées et Auto Show. Il conserve un cadrage calme et une projection stable. Les données de scène, les clés manuelles, les verrous et les mouvements source restent éditables et inchangés.

La préférence effective combine le choix du jeu et celui du système. Elle doit rester cohérente entre WebGL, le décor Canvas de repli et les transitions CSS. Une préférence système active n'écrit pas automatiquement la case utilisateur dans la bibliothèque. La sauvegarde de la case utilisateur doit réussir avant de promouvoir son nouvel état ; un refus conserve l'état précédent et affiche l'erreur.

Les jugements, la vie, le combo, les jauges HOLD et les messages de chargement restent disponibles. La lecture audio et les règles de rythme ne sont pas modifiées par ce mode de présentation. Les vidéos importées, toutes les animations internes des modèles et le confort sur appareils physiques ne sont pas certifiés par ces contrôles.

## Validation et limites

Les preuves courantes sont rassemblées dans `qa/v36/verified.json`. Le contrôle `tools/verify_pr36.py` exige le build exact, tous les parcours de régression précédents, les nouveaux parcours archives/mouvement, le classeur exact et la concordance des 136 lignes Excel/JSON/CSV.

La suite logique courante passe 1 291 tests, dont 75 nouveaux cas d’archives et 16 de mouvement réduit. Les 10 contrôles du lanceur passent également. Les deux nouveaux parcours comptent 76 contrôles d’archives et 22 de mouvement réduit ; les neuf parcours hérités en comptent 186. Le contrôle complet exige donc 284 contrôles navigateur sur le même build.

Tests dédiés : `tests/archive-integrity.test.cjs`, `tests/v36-motion.test.cjs`, `tests/v36_archive_browser.py`, `tests/v36_motion_browser.py`. Les rapports doivent distinguer contrats en mémoire, HTTP/IndexedDB natifs, rendu WebGL avec GPU logiciel et préférences système émulées. Ils ne valident pas un GPU, un navigateur mobile ou un lecteur d'écran physique.

Le [suivi V36](../planning/README.md) conserve les historiques. `SAV-10` est réalisé pour les références explicites des archives de bibliothèque V2–5 ; les trois autres lignes du lot conservent leurs statuts. Les contrôles emploient de petits médias synthétiques et ne qualifient pas les codecs, les quotas/évictions réels ni les sauvegardes de 1 Gio. Les limites de compatibilité inter-versions complètes, appareils, latence acoustique et corpus MMD restent ouvertes.
