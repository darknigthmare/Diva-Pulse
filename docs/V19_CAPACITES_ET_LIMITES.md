# V19 — capacités effectivement livrées et limites

Ce document concerne le build 19.0.0, pas les annonces des versions intermédiaires non récupérables. Les validations détaillées sont dans `../RAPPORT_V19.md`.

| Domaine | Présent en V19 | Limite explicite |
|---|---|---|
| Import musical | Décodage local, empreinte du fichier, famille de difficultés, mode manuel | Décodabilité dépendante du navigateur ; audio de dix minutes maximum |
| Niveaux existants | Catalogue local, association par empreinte exacte, conservation des données compatibles | Pas de recherche Internet ni identification acoustique entre deux réencodages |
| AutoMap | Attaques/énergie multibande, tempo-map, silences, difficulté héritée, sélection locale binaire/ternaire | Heuristique, pas transcription vocale/mélodique ni garantie de qualité universelle |
| Grille | Carte de tempo, mesures composées et subdivisions dans le Studio | Une estimation automatique de la mesure reste incertaine |
| Profils de jugement | Standard, Accessible, Précision réellement appliqués aux frappes, ratés, replays et clés de records | Ce sont des règles DIVA PULSE, pas un barème SEGA certifié |
| PMX | Géométrie, matériaux de base, squelette BDEF, VMD, morphs sommets/os et groupes pris en charge par le runtime | SDEF/QDEF restent approximés par BDEF ; morphs UV/matériaux/impulsions non reproduits |
| PMD | Géométrie, textures, squelette, VMD et morphs faciaux avec indexation de base | Modèles de diagnostic testés ; collection réelle complexe non validée exhaustivement |
| TGA | Couleur/niveaux de gris/indexées, brut/RLE, orientations, vérification des bornes | Formats reconnus uniquement ; TGA entrelacé refusé, maximum 16 777 216 pixels |
| Textures | Chemins de dossier conservés, résolution relative, refus des homonymes ambigus | Pas de téléchargement distant pour réparer une texture absente |
| Matériaux | Textures principales, sphere maps décodables, shader stylisé existant | Toon, transparence, contours et lumières non identiques à MMD Desktop |
| VMD | Os/morphs/caméra, interpolation existante, horloge liée à l’audio, clips | Pas de promesse de compatibilité avec tous les comportements VMD |
| IK | Solveur CCD optionnel et borné | Contraintes d’axes/genoux et ordre complet MMD non exhaustifs |
| Physique | Aucune intégration Bullet dans cette livraison ; option désactivée et annoncée | Pas de rigid bodies/joints/soft bodies MMD complets, pas de simulation cheveux/vêtements de référence |
| Director | Jusqu’à quatre modèles distincts, pistes, édition précise, glisser, undo/redo | Pas de montage vidéo professionnel ni de retargeting automatique entre squelettes différents |
| Fondus | Mélange positions/quaternions/poids de morphs depuis la pose finale du clip précédent | La motion sortante est maintenue à sa pose de fin ; pas de double lecture continue pendant le fondu |
| Intervalles | Absence de clip = danseur masqué ; clip sans VMD = pose VPD/repos | Les entrées/sorties ne sont pas des animations automatiques de marche |
| Formations | Auto-PV, positions interpolées, lead et visibilité conservés | Pas d’évitement de collision entre danseurs ; les translations propres au VMD peuvent les rapprocher |
| Caméra/lumière | Clés manuelles sauvegardées, courbes smooth/linear/step, aperçu au curseur | Pas d’éditeur graphique des tangentes ; pas de light rigs MMD complets |
| Accessoires | Les maillages intégrés au modèle suivent son squelette | Pas de système général d’accessoires externes animés livré dans cette passe |
| Sauvegardes | Export/restauration `.pulsepack` incluant tous les médias référencés et remappage | Un ancien pack ayant déjà perdu ses médias ne permet pas de les reconstruire |
| Sauvegarde du Director | Transaction avant remplacement ; brouillon conservé si erreur d’écriture | Brouillon du Director uniquement en mémoire tant qu’il n’est pas enregistré/exporté |
| Rendu | WebGL2, repli 2D pour le jeu en absence de WebGL2 | Les modèles MMD ne sont pas rendus dans le repli 2D |
| Tests navigateur | Import réel via sélecteur, WebGL logiciel, montage, pannes, sauvegardes, WAV, fin de partie, mobile simulé | Pas de vrais périphériques ni Safari/iOS ; pas de persistance après fermeture validée |
| Distribution | ZIP avec code, HTML autonome, serveur local facultatif, pas de CDN | Pas de déploiement distant ni de binaire natif PC/mobile produit |

## Persistance et environnement de test

Dans cette session, Chromium refuse la navigation vers les URL locales HTTP et file avec `ERR_BLOCKED_BY_ADMINISTRATOR`. Les tests UI utilisent donc l’injection du document HTML via Playwright. Cette méthode permet d’exécuter réellement le JavaScript, le Worker audio et WebGL, mais le document utilise le stockage temporaire explicitement signalé par le jeu. Les tests d’export/restauration passent par les vraies méthodes de l’application, avec son adaptateur en mémoire.

Le serveur HTTP local est vérifié séparément avec Python. Cela ne transforme pas les essais du stockage temporaire en une preuve de persistance IndexedDB. Installation PWA, fonctionnement après fermeture complète du navigateur et comportement sur les appareils réels restent à vérifier.

## Références techniques étudiées

Les dépôts `yohawing/three-mmd-loader` et `moeru-ai/three-mmd`, ainsi que la documentation TGALoader de three.js, ont été consultés lors de l’étude du chantier. Cette livraison conserve le runtime local du projet et son décodeur : elle **n’embarque pas** ces bibliothèques ni Bullet/Ammo. La présence d’une fonctionnalité dans ces projets tiers n’implique pas qu’elle est implémentée ici.
