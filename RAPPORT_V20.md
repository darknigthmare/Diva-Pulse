# DIVA PULSE V20 — Auto Show : rapport de vérification

**Version 20.0.0.** Extension réalisée depuis l’archive V19 Studio & Reliability fournie dans la conversation. Les comptes de réussite ci-dessous proviennent uniquement des commandes relancées sur les sources V20 et de l’HTML livré, pas de la reprise d’un ancien rapport.

## Résultats finaux exécutés

| Ensemble | Réussis | Échecs | Portée |
|---|---:|---:|---|
| Contrats Node | 392 | 0 | 338 contrats existants + 54 contrats Auto Show V20 |
| Parcours navigateur V20 | 57 | 0 | Import audio, spectacle, protection du manuel, playback, MMD, export/restauration, mobile et repli 2D |
| Diagnostic PMX/VMD | 4 | 0 | Chargement, rendu WebGL2, transformations d’os et contrôles MMD |
| Lanceur HTTP Python | 10 | 0 | Identité du build, octets servis, ressources, en-têtes et conflits de port |

Ces nombres sont des assertions automatisées, pas des testeurs humains distincts, ni une certification sans bug. La suite navigateur historique V19 de 57 contrôles n’est **pas** ajoutée à ce total : les parcours V20 exécutés sont listés individuellement dans `qa/v20/browser-final.json`.

## Identité du build testé

SHA-256 des deux HTML identiques :

`965bd7fdb4108355aa296af7f28386cdfdba8e088ff3d0dd19d728e3deff2c30`

Les suites navigateur principale et PMX enregistrent l’empreinte de l’HTML effectivement chargé. Le packaging vérifie qu’elle correspond encore au fichier livré. `BUILD_V20.json` identifie également l’archive V19 source.

## Environnement et restrictions

Chromium 144.0.7559.96 sur Linux, lancé sous Xvfb. WebGL2 est fourni par ANGLE/SwiftShader : le rendu est réel mais logiciel. Aucune performance GPU matérielle n’est déduite de ces essais. Node 22.16.0 et Python 3.13 sont utilisés pour les tests de logique et du lanceur.

La navigation du navigateur vers le serveur local est bloquée par la politique de cet environnement. Playwright injecte donc le contenu de l’HTML autonome. L’application utilise son adaptateur **TEMPORAIRE** et le signale visiblement. La sauvegarde, les transactions et la restauration ont été testées dans cet adaptateur, **pas après fermeture et redémarrage d’IndexedDB**. Le serveur HTTP local est testé séparément depuis Python.

Le parcours final ne remonte aucune exception JavaScript non interceptée ni défaillance de la boucle de rendu. Aucun appel réseau HTTP(S) externe n’a été observé. Les avertissements console conservent les refus d’écriture et l’import invalide volontairement injectés ; ceux-ci ne sont pas dissimulés comme des succès ordinaires.

## Ce qui est vérifié

### Création automatique à l’import

Un véritable `TRIPLE_PULSE.wav` original est décodé et analysé. L’import prépare les cinq difficultés et un plan Auto Show complet. Les notes communes restent héritées entre les niveaux. Les données audio, partitions et scène sont présentes dans le même stockage actif. Une deuxième importation des mêmes octets ne double ni les morceaux ni leur spectacle.

Lorsque l’option AutoMap est désactivée, une seconde musique reste analysée et reçoit un spectacle sans nécessiter de chart. Les morceaux déjà présents sont complétés individuellement ; un plan figé ne redevient pas automatique lors de cette opération.

### Synchronisation et rendu

Les tests examinent les rotations réelles des personnages procéduraux, la position de la caméra, le décor actif et l’intensité envoyée au shader. Un PV de diagnostic joue avec son véritable audio, se met en pause, reprend et revient à la bibliothèque à la fin, sans score. Une partie complète en Autoplay atteint 100 % sur le chart de diagnostic.

Les contrats contrôlent les BPM variables, les mesures composées, le décalage d’origine de la grille, les offsets de chart positifs/négatifs, les pauses mesurées, la continuité des phrases, les bornes du plan et la reproductibilité de la graine. Les mouvements procéduraux suivent la pulsation relative à son origine, pas seulement le BPM moyen. Une recherche temporelle arrière ne dépend pas de l’ordre des images précédemment rendues.

Le rendu du menu boucle sur la durée du morceau : une courte musique ne fait plus disparaître tous les danseurs une fois le temps de prévisualisation dépassé. Cette boucle n’est pas appliquée au transport audio de la partie.

### MMD sans et avec VMD

Deux PMD originaux sont réellement importés avec leur texture TGA, d’abord **sans VMD**. Auto Show construit une troupe de deux personnages, produit des pistes pour les os reconnus et modifie leurs rotations. Il ne se contente pas d’enregistrer une description de danse.

Le même pack est ensuite remplacé volontairement par les deux modèles, deux VMD et la texture. Les descripteurs enregistrés mesurent les rotations des motions et les noms des os des modèles. Des clips VMD compatibles sont planifiés sans ouvrir le Director. La réanalyse de l’audio et des motions est exécutée depuis le panneau et ne modifie pas les notes.

Ce contrôle ne prouve pas la compatibilité avec tout squelette ni une chorégraphie musicale parfaite. Le repli procédural est surtout un mouvement du haut du corps sur les alias reconnus ; les VMD fournis gardent leur vitesse source.

### Priorité aux choix manuels

Une modification de caméra protège cette piste sans bloquer la chorégraphie. La caméra manuelle est utilisée par le renderer ; changer la graine ou l’ambiance conserve son réglage. Un déverrouillage explicite autorise l’auto à la reprendre sans supprimer la valeur manuelle originale.

Le Director peut ouvrir la timeline automatique. Une lumière manuelle réglée à zéro est vérifiée jusqu’au shader de l’aperçu, puis enregistrée. Une nouvelle génération conserve le Director manuel et ses associations. Les partitions restent identiques avant et après ces opérations.

Une sauvegarde volontairement refusée conserve l’ancienne proposition et le dialogue ouvert. Les réglages manuels non standards d’une ancienne démo intégrée sont protégés au même titre que ceux d’un morceau importé.

### Export et restauration

La méthode d’export réellement utilisée par l’application contient le plan automatique et tous les médias MMD référencés. La restauration crée une copie distincte et remappe également les IDs de modèles/motions utilisés dans le plan Auto Show. Les personnages de cette copie sont rechargés dans le runtime graphique.

Un plan volontairement invalide, contenant une distance caméra négative, est refusé sans insérer de morceau ou d’asset partiel. L’export `.pulseshow.json` du panneau est un diagnostic sans médias et n’est pas annoncé comme un format d’import complet ; le `.pulsepack` reste le format de sauvegarde exploitable.

### Présentation et repli

Le panneau Auto Show est contrôlé en viewport 390 × 844. Les boutons et libellés n’ont pas de débordement horizontal. Ce viewport simulé n’est pas un test sur iPhone. Un deuxième contexte avec WebGL désactivé génère, conserve et modifie le plan automatique en utilisant le décor 2D de secours.

## Correctifs apportés pendant la validation

Les premiers parcours ont mis en évidence un débordement des boutons Auto Show sur mobile ; le panneau possède désormais un agencement spécifique, des cases compactes et des libellés multiligne.

La revue du rendu a révélé que le temps des menus continuait au-delà de la durée des clips d’un morceau court, masquant la troupe. L’aperçu automatique boucle maintenant sur la musique, tandis que la lecture et le curseur manuel conservent leur propre temps.

La revue rythmique a corrigé l’usage de l’origine de grille et le déplacement des changements de tempo par l’offset d’une partition sans analyse audio. Quatre contrats dédiés couvrent ces cas. La protection des scènes anciennes s’applique aussi aux démos intégrées modifiées.

Les premiers harnais navigateur contenaient des affectations de fonction renvoyées par `evaluate`, une attente erronée d’un écran de score après un PV et une navigation par menu masqué depuis les résultats. Ces erreurs de test ont été corrigées pour utiliser les parcours réels ; elles ne sont pas présentées comme des fonctionnalités du jeu. Les journaux `browser-development*.log` sont conservés, avec leurs échecs, séparément de la passe finale.

## Limites réelles

Auto Show est un générateur procédural local. Il assemble les quatre décors existants, des motifs de mouvements et des pistes de montage ; il ne crée pas de nouveaux environnements 3D. Les rôles musicaux et l’énergie ne représentent pas une compréhension garantie des paroles ou de la structure réelle.

Sans VMD compatible, le mouvement MMD vise les os reconnus et reste principalement limité au haut du corps. Aucun lip-sync ou retargeting universel n’est ajouté. Avec VMD, le montage sélectionne et boucle les fichiers fournis, mais n’en déduit pas le tempo propre pour recaler chaque pas. Les médias officiels ne sont pas distribués et la chorégraphie originale d’une chanson n’est pas reproduite à partir du seul audio.

Les physiques Bullet/rigid bodies/joints/soft bodies exhaustives, le SDEF/QDEF exact et l’égalité visuelle avec MMD Desktop ne sont pas ajoutés. Les manettes et appareils MIDI physiques, Safari/iPhone, le stockage après fermeture, les quotas réels, l’installation hors ligne et les performances sur GPU matériel restent à valider. Aucun site distant ni dépôt GitHub n’a été modifié.

## Preuves incluses

`qa/v20/logic-final.log`, `qa/v20/browser-run.log`, `qa/v20/browser-final.json`, `qa/v20/pmx-runtime-final.log`, `qa/v20/launcher-final.log`, `qa/v20/launcher-results.json`, ainsi que les captures `01-library.png` à `07-2d-fallback.png` et `native-mmd/mmd-runtime.png`.

L’archive est relue après compression ; ses fichiers sont comparés aux empreintes de `SHA256SUMS.txt`. Ce contrôle valide l’intégrité de la livraison, pas l’absence de bugs.
