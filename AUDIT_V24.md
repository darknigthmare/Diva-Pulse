# DIVA PULSE V24 — Audit actualisé

Les 40 constats V23 sont conservés et réévalués ci-dessous. Trois nouveaux constats de fiabilité sont ajoutés. **Avancé ne signifie pas clôturé.** Le rapport de tests V24 distingue le code testé, les scénarios simulés et les essais non exécutés.

## Résumé des avancées

Héritages standards et limites IK ; proposition de tempo VMD avec validation ; protection single-writer lorsque les API sont disponibles ; diagnostic quota/protection ; cinq signaux AutoMap annotés. Physique Bullet, retargeting, visèmes, médias finaux, catalogue réseau et fidélité exhaustive Project DIVA restent ouverts.

## A01 — L’export dépendait des écritures

**État : Corrigé et testé** · Sauvegarde

État V23 : Corrigé et testé.

Le chemin exportBackup enregistrait de nouveau les morceaux avant de lire la bibliothèque. Une écriture refusée pouvait donc empêcher une sauvegarde de secours.

Export en lecture seule. La partition sale du studio est incluse comme brouillon distinct, pas publiée sur la source. Le test refuse toutes les nouvelles écritures et obtient quand même le fichier de sauvegarde.

**Preuve / emplacement :** src/enhancements.js: exportBackup ; tests/v23_browser_test.py ; qa/v23/integration/browser-final.json

## A02 — Transactions mémoire partiellement validées

**État : Corrigé et testé** · Sauvegarde

État V23 : Corrigé et testé.

Le mode temporaire devait valider et cloner toutes les lignes avant la première modification, comme une transaction complète.

Prévalidation des collections, identifiants et objets clonables. Échec sur la deuxième ligne : aucune première ligne ajoutée. Les valeurs sont des instantanés indépendants.

**Preuve / emplacement :** src/services.js: Store.atomic ; tests/v23.test.cjs

## A03 — Stockage fermé pris pour un stockage vide

**État : Corrigé et testé** · Sauvegarde

État V23 : Corrigé et testé.

Une connexion invalidée ne doit pas provoquer un retour silencieux à une nouvelle mémoire vide, ni afficher une réussite de sauvegarde.

État invalidated explicite ; toutes les lectures et mutations le refusent. Badge STOCKAGE FERMÉ, message de rechargement et pause de la partie. Gestion des événements de fermeture et de changement de version.

**Preuve / emplacement :** src/services.js: Store.invalidate/guard/open ; src/quality.js: install ; tests/v23.test.cjs

## A04 — Réglages affichés avant confirmation du stockage

**État : Corrigé et testé** · Sauvegarde

État V23 : Corrigé et testé.

L’objet de préférences pouvait conserver un changement alors que la transaction avait été annulée.

Instantané de la dernière écriture confirmée et remise en état sur abort. Une réussite n’est publiée qu’à la fin de la transaction. Une exception d’observateur ne transforme pas un commit réussi en échec.

**Preuve / emplacement :** src/services.js: Store.atomic/committed ; src/quality.js ; test navigateur avec transaction annulée

## A05 — Métadonnées et favoris non conservés après échec

**État : Corrigé et testé** · Bibliothèque

État V23 : Corrigé et testé.

Modifier un titre ou un favori pouvait laisser l’interface en désaccord avec les données réellement enregistrées.

Candidat enregistré avant publication ; rollback du favori. Une sauvegarde de métadonnées refusée conserve la source et le champ saisi pour réessayer.

**Preuve / emplacement :** src/quality.js: saveSong ; src/enhancements.js: songManager ; qa/v23/integration/browser-final.json

## A06 — Setlist fantôme après refus de sauvegarde

**État : Corrigé et testé** · Bibliothèque

État V23 : Corrigé et testé.

Le tableau des concerts pouvait être modifié avant la validation de son enregistrement ou de sa suppression.

Copie candidate puis publication après succès. La file de morceaux reste disponible après un échec. Tests d’ajout, de nouvelle tentative et de suppression refusée.

**Preuve / emplacement :** src/enhancements.js: setlistDialog ; tests/v23_browser_test.py

## A07 — Propriétaire d’une sauvegarde et remplacement GLB

**État : Avancé, validation partielle** · Sauvegarde

État V23 : Avancé, validation partielle.

Un changement de morceau pendant une écriture ne doit pas restaurer le mauvais objet. Un GLB prévisualisé mais non enregistré ne doit pas rester à la place de la scène sauvegardée.

Sauvegarde attachée au propriétaire et à un numéro de requête ; retour à la scène enregistrée en cas d’import GLB échoué. Revue et non-régression effectuées ; le scénario GLB de panne graphique pendant l’écriture n’a pas son propre test navigateur exhaustif dans cette passe.

**Preuve / emplacement :** src/quality.js: saveSong/importModel ; src/app.js: clearModel/modelClip

## A08 — Brouillon perdu en fermant le panneau

**État : Corrigé et testé** · Director

État V23 : Corrigé et testé.

Les modifications non appliquées du Director dépendaient de la seule session du panneau.

Brouillon séparé par morceau, file d’écriture et récupération explicite à la réouverture. La récupération reste annulable. Source manuelle inchangée avant Enregistrer.

**Preuve / emplacement :** src/director-app.js: directorRecoveries/directorDraftWrite ; navigateur : fermeture, réouverture, undo/redo

## A09 — Brouillon refusé absent de la sauvegarde portable

**État : Corrigé et testé** · Director

État V23 : Corrigé et testé.

Une dernière modification pouvait ne subsister qu’en mémoire après un quota refusé ; les anciens exports ne transportaient pas cet état Director.

Conservation en mémoire avec statut d’échec, fusion de l’état le plus récent dans directorDrafts du pulsepack, références médias et propriétaire remappés à la restauration. Rechargement des deux personnages restaurés.

**Preuve / emplacement :** src/enhancements.js: exportBackup/restoreBackup ; qa/v23/integration/browser-final.json

## A10 — Perte du contexte graphique pendant un PV

**État : Corrigé et testé** · Rendu

État V23 : Corrigé et testé.

Les ressources GPU étaient invalides après une perte de contexte ; une simple nouvelle image ne suffisait pas à rétablir le spectacle.

Détection de la perte, arrêt de l’horloge audio, reconstruction des programmes et buffers, rechargement des personnages. La partie reste en pause jusqu’à l’action du joueur. Test réel WEBGL_lose_context, pas seulement un événement DOM fabriqué.

**Preuve / emplacement :** src/stage.js ; src/quality.js: onRestored/onError ; qa/v23/integration/browser-final.json

## A11 — Échec de création du shader bloquant le démarrage

**État : Corrigé et testé** · Rendu

État V23 : Corrigé et testé.

Une compilation de shader refusée pouvait remonter hors du chemin de repli 2D.

Initialisation capturée, diagnostic initError, renderer indisponible et repli annoncé. Test de compilation volontairement refusée.

**Preuve / emplacement :** src/stage.js: constructor ; tests/v23.test.cjs

## A12 — Palette d’os répétée par matériau

**État : Corrigé et testé** · Performances

État V23 : Corrigé et testé.

Les données du squelette étaient préparées et envoyées pour chaque matériau, malgré un modèle et une pose identiques.

Palette partagée par les matériaux et réutilisation de son tableau en mémoire ; un envoi par modèle et par image. Deux matériaux contrôlés dans le vrai renderer.

**Preuve / emplacement :** src/stage.js: skin/paletteUploads ; qa/v23/integration/browser-final.json

## A13 — SDEF lu puis remplacé par une déformation linéaire

**État : Avancé et testé** · MMD

État V23 : Avancé et testé.

Les centres C/R0/R1 étaient sautés par le parseur. Le rendu ne pouvait donc pas calculer le SDEF prévu par le fichier.

Conservation, conversion de coordonnées et validation des centres ; calcul sphérique spécifique CPU/GLSL. Équation vérifiée contre une forme développée indépendante et sortie GPU comparée. Support de transformations rigides, pas certification de tout squelette complexe.

**Preuve / emplacement :** src/mmd-core.js ; src/mmd-compat.js ; src/skinning.js ; tests/v23_gpu_probe.js

## A14 — QDEF traité comme BDEF

**État : Avancé et testé** · MMD

État V23 : Avancé et testé.

Le type QDEF n’avait pas son chemin de déformation par quaternions duaux normalisés.

Chemin QDEF à quatre influences, correction du signe des quaternions, normalisation, translation et normales. Tests des torsions, des poids extrêmes et du résultat GPU. Les héritages d’os, échelles non rigides et la physique restent distincts.

**Preuve / emplacement :** src/skinning.js ; tests/v23.test.cjs ; qa/v23/integration/gpu-feedback.json

## A15 — Sphere map calculée dans le mauvais repère

**État : Corrigé, contrôle structurel** · MMD

État V23 : Corrigé, contrôle structurel.

La normale utilisée pour la sphere map devait suivre le repère de la caméra, pas uniquement le repère du monde.

Normale transformée par la vue. Shader compilé et parcours MMD rejoués. La comparaison pixel à pixel de matériaux complexes avec MMD Desktop n’est pas faite.

**Preuve / emplacement :** src/stage.js: uView et normale sphere map ; test natif WebGL

## A16 — Génération ralentie par des rescans globaux

**État : Corrigé et testé** · AutoMap

État V23 : Corrigé et testé.

À chaque candidat d’accord, l’algorithme reconstruisait et triait les notes de toute la difficulté pour vérifier une densité locale.

Listes par difficulté maintenues en ordre et contrôle limité aux fenêtres de quatre secondes que le candidat peut modifier. Comparaison stricte des notes avec le moteur V22 conservé comme oracle.

**Preuve / emplacement :** src/automap-core.js ; tests/reference/automap-v22-baseline.js ; tests/v23-automap.test.cjs

## A17 — Préférences restaurées hors limites

**État : Corrigé et testé** · Validation

État V23 : Corrigé et testé.

Des valeurs nulles, booléennes, infinies, hors plage, ou des mappings de touches en doublon pouvaient produire des réglages incohérents.

Contrats numériques et de types, mappings uniques, profils de jugement connus. Récupération avec avertissement au démarrage ; restauration explicitement refusée et atomique pour les préférences invalides.

**Preuve / emplacement :** src/quality.js: preferences ; src/enhancements.js: restoreBackup ; tests/v23.test.cjs

## A18 — Director mal formé accepté partiellement

**État : Corrigé et testé** · Validation

État V23 : Corrigé et testé.

Des structures inattendues de slots/clips ou des clés de formation dupliquées pouvaient être normalisées de façon ambiguë.

Limites et types contrôlés, invalides refusés avant remplacement. Les sources ne sont pas modifiées lors du refus.

**Preuve / emplacement :** src/director-core.js: normalizeDirector ; tests/v23.test.cjs

## A19 — Réglages devenus trop longs à parcourir

**État : Amélioré et testé** · Interface

État V23 : Amélioré et testé.

L’empilement des systèmes rendait l’accès à Audio, AutoMap ou aux sauvegardes peu direct.

Six raccourcis vers les rubriques réelles, panneaux homogènes et lignes de diagnostic repliables. Capture mobile du Director et contrôle des dimensions.

**Preuve / emplacement :** src/quality.js ; src/style.css ; qa/v23/integration/03-mobile-recovery.png

## A20 — Aucun état global exploitable de la bibliothèque

**État : Ajouté et testé** · Diagnostic

État V23 : Ajouté et testé.

Les contrôles MMD à l’import ne signalaient pas ensemble les niveaux manquants, médias absents et spectacles invalides de la bibliothèque courante.

Audit non destructif par morceau dans Réglages, avec export JSON et limites explicitement indiquées. Aucune réparation ou suppression silencieuse.

**Preuve / emplacement :** src/quality.js: songAudit/auditLibraryQuality ; qa/v23/integration/04-quality-report.png

## A21 — Physique Bullet, articulations et corps souples

**État : Ouvert** · MMD

État V23 : Ouvert.

Le pipeline V23 ne simule pas exhaustivement les corps rigides, contraintes et tissus d’un pack PMX. Les options anciennes ne sont pas une preuve d’intégration Bullet.

À faire : importer toutes les propriétés, solveur à pas fixe, remise en état après seek/pause, collisions et limites d’articulations, puis tests cheveux/vêtements sur corpus autorisé. Ne pas activer une case sans solveur fonctionnel.

**Preuve / emplacement :** src/mmd-core.js ; src/stage.js ; diagnostic PulseQuality.limitations

## A22 — Héritages de transformations et contraintes IK complètes

**État : Avancé, compatibilité partielle** · MMD

État V23 : Ouvert.

Le solveur présent ne couvre pas tous les grants/append transforms, axes locaux et limites IK attendus par les modèles avancés.

Héritages standards non locaux de rotation et translation, ratios et chaînes, cycles refusés, projection XYZ des limites IK dans le bon repère, plafond de 32 itérations. Les héritages locaux/monde, axes, interactions après IK et physique restent ouverts.

**Preuve / emplacement :** src/skeleton.js ; src/stage.js ; src/mmd-core.js ; tests/v24.test.cjs ; tests/v24_browser_test.py

## A23 — Matériaux et effets MME exhaustifs

**État : Ouvert** · MMD

État V23 : Ouvert.

Les morphs UV0/couleur/opacité et sphere maps existent, mais le rendu complet des UV additionnels, contours, toon, spéculaire et effets MME n’est pas équivalent à MMD Desktop.

À faire : matrice de compatibilité des matériaux, images de référence par fonction, règles de transparence, rendu des contours et effets explicitement supportés. Garder un avertissement sur les fonctions ignorées.

**Preuve / emplacement :** src/mmd-surface.js ; src/stage.js ; src/mmd-audit.js

## A24 — Collection représentative de modèles téléchargés

**État : Non validé** · Compatibilité

État V23 : Non validé.

Les tests présents utilisent surtout des diagnostics originaux. Leur passage ne certifie pas un personnage quelconque avec des centaines de textures et contraintes.

À faire : corpus avec autorisation de test, provenance et licences consignées ; PMD/PMX, morphs, textures japonaises, os complexes et plusieurs tailles ; grille rendu/animation/physique indépendante.

**Preuve / emplacement :** examples/v19, v21, v22, v23 ; rapports navigateur

## A25 — BPM d’un VMD automatiquement détecté

**État : Avancé, proposition à valider** · Animation

État V23 : Ouvert.

Le calage musical demande toujours un BPM source et un premier temps fournis. La durée d’un VMD ne suffit pas à déterminer sa pulsation.

Recherche bornée de cycles de pose VMD, stabilité sur deux moitiés, plusieurs interprétations BPM. Sélection explicite puis sauvegarde ; aucune phase certaine ni application automatique. VMD statiques et sans cycle refusés comme source de BPM.

**Preuve / emplacement :** src/motion-analysis.js ; src/reliability.js ; tests/v24_browser_test.py

## A26 — Retargeting universel et appuis des pieds

**État : Ouvert** · Animation

État V23 : Ouvert.

La correspondance de noms d’os ne corrige ni les proportions, ni les poses de repos, ni les pénétrations. La danse procédurale MMD reste surtout sur le haut du corps reconnu.

À faire : mapping éditable, pose de repos, correction des axes/proportions, contacts des pieds, root motion et limites articulaires ; conserver la pose plutôt qu’un retargeting aveugle.

**Preuve / emplacement :** src/stage.js: mouvements procéduraux et VMD ; diagnostic MMD

## A27 — Visèmes et synchronisation labiale depuis la chanson

**État : Ouvert** · Animation

État V23 : Ouvert.

Les morphs faciaux VMD sont lus ; le moteur ne déduit pas des paroles et visèmes fiables depuis un mix musical.

À faire : piste faciale séparée, import de repères phonétiques ou pipeline d’analyse explicite, réglage des visèmes par modèle et possibilité de correction manuelle.

**Preuve / emplacement :** src/mmd-surface.js ; src/autoshow-core.js

## A28 — Qualité des patterns sur de vraies chansons

**État : Avancé, corpus synthétique seulement** · AutoMap

État V23 : À évaluer musicalement.

Les contraintes d’héritage, de cadence et de quantification sont testées. Les sections et attaques restent des heuristiques ; elles ne garantissent pas une partition agréable sur chaque genre.

Cinq WAV originaux annotés (binaire, ternaire, swing, changement de tempo, silence), analyse PCM réelle et contrôle des cinq difficultés. Rappel/précision mesurés. Pas de corpus de chansons mixées ni d’évaluation humaine ; moteur générateur V23 conservé.

**Preuve / emplacement :** tests/v24-audio-corpus.cjs ; examples/v24/audio-corpus ; qa/v24/audio-corpus.json

## A29 — Reconnaissance d’un audio réencodé

**État : Ouvert** · AutoMap

État V23 : Ouvert.

L’empreinte exacte identifie un même fichier, pas deux encodages d’un enregistrement ni une version concert/remix.

À faire : empreinte acoustique, estimation du décalage et confiance. Ne jamais appliquer automatiquement une chart exacte à un enregistrement seulement ressemblant.

**Preuve / emplacement :** src/hash-core.js ; catalogue local

## A30 — Recherche de partitions existantes en ligne

**État : Ouvert** · Catalogue

État V23 : Ouvert.

Le catalogue de charts demeure local, alimenté par les imports. L’absence de niveau local déclenche AutoMap, pas une recherche mondiale.

À faire : connecteur de catalogue autorisé, provenance/version de chaque niveau, association de l’audio vérifiable, cache et décision de l’utilisateur avant une source incertaine.

**Preuve / emplacement :** src/automap-app.js ; catalogue .pulsecharts

## A31 — Très gros médias et sauvegardes volumineuses

**État : Ouvert** · Performances

État V23 : Ouvert.

Le décodage audio, certains tableaux et les sauvegardes JSON/base64 occupent la mémoire. L’optimisation V23 concerne la génération, pas un décodage audio ou un export totalement en streaming.

À faire : budgets mémoire par plateforme, estimation avant import, annulation à chaque phase lourde, format de sauvegarde binaire/streaming, stress tests sur grandes bibliothèques.

**Preuve / emplacement :** src/services.js ; src/enhancements.js: blobToBase64/exportBackup ; src/automap-app.js

## A32 — Fidélité 1:1 aux règles Project DIVA

**État : Non certifié** · Gameplay

État V23 : Non certifié.

Les profils de jugement, trajectoires et bonus actuels sont ceux de DIVA PULSE. Aucun banc de comparaison exhaustive par édition SEGA n’a été exécuté.

À faire : choisir une édition de référence, spécifier chaque type de note/bonus, fixtures d’entrée et score attendu, tests simultanés/maintien/chaînes ; séparer les records par règleset.

**Preuve / emplacement :** src/core.js ; src/app.js ; profils Standard/Accessible/Précision

## A33 — Outils de montage avancés

**État : Ouvert** · Director

État V23 : Ouvert.

Les clips, fondus, formations, caméras et lumières sont éditables ; l’éditeur ne dispose pas encore d’une ergonomie complète de logiciel de montage avec toutes les courbes, multi-sélections et raccourcis.

À faire : sélection multiple de clés, copier/coller entre pistes, tangentes visuelles, accrochage aux mesures, navigation clavier, prévisualisation sonore synchronisée et mixage de root motion.

**Preuve / emplacement :** src/director-app.js ; src/director-core.js ; captures de l’interface

## A34 — Accessoires et nouvelles scènes générées

**État : Ouvert** · Director

État V23 : Ouvert.

Auto Show assemble les scènes présentes ; il ne crée pas de nouveaux maillages. Les accessoires complexes et leurs interactions ne sont pas un système complet validé.

À faire : bibliothèque de props, rattachements aux os, clés d’activation, collisions de mise en scène, génération de placement contrainte et mesure des coûts graphiques.

**Preuve / emplacement :** src/stage.js ; src/autoshow-core.js ; Director

## A35 — Persistance après fermeture et installation hors ligne

**État : Toujours non exécuté sur navigateur réel** · Production

État V23 : Non exécuté.

Les essais graphiques utilisent un document d’origine opaque : stockage TEMPORAIRE. La navigation du navigateur vers le serveur est bloquée par l’infrastructure de cette session.

Diagnostic quota/protection, demande explicite persist(), refus géré. Lecture opaque TEMPORAIRE : persistance après fermeture et installation hors ligne non vérifiées. Lanceur testé séparément.

**Preuve / emplacement :** src/reliability.js ; qa/v24 ; tests/launcher_test.py

## A36 — Safari/iPhone et contrôleurs physiques

**État : Non exécuté** · Production

État V23 : Non exécuté.

Les contrôles clavier/manette/MIDI automatisés ne mesurent pas un contrôleur physique, la latence réelle Bluetooth ni Safari/iOS.

À faire : matrice d’appareils, latence audio/entrée/affichage, multitouch, déconnexion/reconnexion, suspension de l’onglet et reprise, clavier international.

**Preuve / emplacement :** Rapports Playwright et limitations de cette livraison

## A37 — Conflits entre plusieurs fenêtres

**État : Avancé, coordination native à valider** · Sauvegarde

État V23 : Ouvert.

Le changement de version IndexedDB est géré, mais aucun protocole général de résolution des éditions concurrentes par deux fenêtres de même version n’est présent.

Réservation exclusive Web Locks lorsqu’IndexedDB est actif, seconde fenêtre en lecture/export uniquement, refus des mutations, libération à la sortie. Test de deux contextes JS à gestionnaire de verrous simulé et test UI du refus. Anciennes versions exclues. Navigation navigateur de test bloquée : vraie coordination IndexedDB de plusieurs fenêtres non exécutée.

**Preuve / emplacement :** src/services.js ; src/reliability.js ; tests/v24.test.cjs ; tests/v24_browser_test.py

## A38 — Accumulation des extensions historiques

**État : Ouvert** · Architecture

État V23 : Ouvert.

Le build fonctionne sans dépendance, mais plusieurs extensions remplacent ou enveloppent les méthodes de l’application. Certaines sources sont très compactes et difficiles à relire.

À faire progressivement : API de services explicites, modules métier, formatage des sources, tests d’intégration contractuels. Garder le HTML autonome comme sortie, pas comme source de développement.

**Preuve / emplacement :** build.py ; src/enhancements.js ; src/v7-app.js ; src/v9-app.js ; src/v10-app.js

## A39 — Personnages et PV finalisés

**État : Ouvert** · Direction artistique

État V23 : Ouvert.

Les silhouettes procédurales et modèles de diagnostic ne constituent pas des personnages Vocaloid détaillés. Les chansons, costumes et chorégraphies officiels ne sont pas inclus.

À faire : pipeline d’assets finaux fournis avec leur provenance, galerie et contrôle de compatibilité, presets artistiques et cohérence de scène ; ne pas assimiler une fixture technique à un personnage final.

**Preuve / emplacement :** examples/ ; personnages procéduraux de src/stage.js

## A40 — Dépôt V23 sur Google Drive et synchronisation de jeu

**État : Transfert Drive à vérifier** · Livraison et cloud

État V23 : Indisponible dans cette session.

Le dossier dédié a été relu ; le connecteur expose maintenant uniquement des actions de lecture. Aucune création de dossier ou téléversement V23 n’a pu être exécuté. Le jeu ne synchronise pas automatiquement sa bibliothèque avec Drive.

Dossier V24 identifié sur Drive. La réussite de chaque transfert, les tailles et parents seront consignés séparément après la relecture du dossier. Le dépôt des fichiers du jeu n’est pas une synchronisation de la bibliothèque.

**Preuve / emplacement :** DIVA_PULSE_V24_DEPOT_DRIVE.json (document de livraison externe après transfert)

## V24-01 — Rejets non interceptés sur certains réglages et remappages clavier

**État : Corrigé, tests de refus** · Sauvegarde

Gestion explicite des promesses rejetées, formulaire disponible et retour à la valeur confirmée lorsque le stockage refuse une écriture.

**Preuve / emplacement :** src/app.js ; src/enhancements.js ; tests/v24_browser_test.py

## V24-02 — Le diagnostic quota/protection ne doit pas bloquer le jeu

**État : Corrigé, diagnostic dégradé** · Démarrage

API estimate()/persisted() capturées séparément ; informations partielles et erreur lisible si le navigateur refuse.

**Preuve / emplacement :** src/reliability.js ; tests/v24_browser_test.py

## V24-03 — Version du lanceur

**Corrigé et testé** : le lanceur lit VERSION.txt au lieu de conserver 23.0.0. Les dix contrôles HTTP passent après correction. Voir qa/v24/launcher-results.json.
