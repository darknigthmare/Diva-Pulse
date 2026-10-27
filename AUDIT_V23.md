# DIVA PULSE V23 — Audit des manques et corrections

Date : 7 octobre 2026. Base : archive V22 complète conservée sans modification.

## Conclusion

**La V22 était une base jouable riche, pas un Project DIVA 1:1 ni un MMD Player universel.** Le passage des 474 tests historiques ne couvrait pas plusieurs échecs de sauvegarde, le SDEF/QDEF réel et la perte du contexte 3D. La V23 traite ces écarts, accélère AutoMap sans changer ses notes et rend le travail inachevé du Director récupérable.

Cet audit comporte **40 constats**. Ils n’ont pas tous le même poids : un défaut pouvant bloquer une sauvegarde est prioritaire sur l’ajout d’un effet graphique. Les états ci-dessous distinguent les corrections exécutées, les avancées partielles, les fonctions absentes et les essais non réalisables dans cet environnement. **La liste ne prétend pas épuiser tous les défauts possibles.**

## Méthode et traçabilité

Lecture des sources, comparaison avec les fonctionnalités annoncées, exécution des tests historiques, création de contrats mathématiques/binaires, contrôle dans un navigateur et injection de pannes de stockage. Les aperçus sont inspectés visuellement. Aucun ancien succès n’est reporté comme un test V23 sans réexécution.

Base ZIP SHA-256 : `a2e84bfa4e0156f742398acad755509bd9357ea5fabb795bed18159613484aa0`

HTML V23 testé et livré : `0c88113152e6ac4299d35611b44abbd6964e81ec23baa1861a5b9005ed6b7cf0` — 699 498 octets. `index.html` et le HTML autonome sont identiques.

**Résultats : 548/548 tests de logique, 168/168 contrôles navigateur, 4/4 contrôles PMX/VMD natifs et 10/10 contrôles du lanceur.** Les limites, avertissements et preuves figurent dans `RAPPORT_V23.md`. Un contrôle structurel valide n’est pas une certification musicale, artistique ou de physique.

## Lecture des priorités

P0 : protection ou récupération des données. P1 : fiabilité de l’expérience et compatibilité du moteur. P2 : qualité, fonctions avancées et production. Une priorité n’est pas une estimation de durée.

## Tableau de suivi

| ID | Priorité | Domaine | Constat | État V23 |
|---|---|---|---|---|
| A01 | P0 | Sauvegarde | L’export dépendait des écritures | **Corrigé et testé** |
| A02 | P0 | Sauvegarde | Transactions mémoire partiellement validées | **Corrigé et testé** |
| A03 | P0 | Sauvegarde | Stockage fermé pris pour un stockage vide | **Corrigé et testé** |
| A04 | P1 | Sauvegarde | Réglages affichés avant confirmation du stockage | **Corrigé et testé** |
| A05 | P1 | Bibliothèque | Métadonnées et favoris non conservés après échec | **Corrigé et testé** |
| A06 | P1 | Bibliothèque | Setlist fantôme après refus de sauvegarde | **Corrigé et testé** |
| A07 | P1 | Sauvegarde | Propriétaire d’une sauvegarde et remplacement GLB | **Avancé, validation partielle** |
| A08 | P1 | Director | Brouillon perdu en fermant le panneau | **Corrigé et testé** |
| A09 | P1 | Director | Brouillon refusé absent de la sauvegarde portable | **Corrigé et testé** |
| A10 | P1 | Rendu | Perte du contexte graphique pendant un PV | **Corrigé et testé** |
| A11 | P1 | Rendu | Échec de création du shader bloquant le démarrage | **Corrigé et testé** |
| A12 | P1 | Performances | Palette d’os répétée par matériau | **Corrigé et testé** |
| A13 | P1 | MMD | SDEF lu puis remplacé par une déformation linéaire | **Avancé et testé** |
| A14 | P1 | MMD | QDEF traité comme BDEF | **Avancé et testé** |
| A15 | P2 | MMD | Sphere map calculée dans le mauvais repère | **Corrigé, contrôle structurel** |
| A16 | P1 | AutoMap | Génération ralentie par des rescans globaux | **Corrigé et testé** |
| A17 | P1 | Validation | Préférences restaurées hors limites | **Corrigé et testé** |
| A18 | P1 | Validation | Director mal formé accepté partiellement | **Corrigé et testé** |
| A19 | P2 | Interface | Réglages devenus trop longs à parcourir | **Amélioré et testé** |
| A20 | P2 | Diagnostic | Aucun état global exploitable de la bibliothèque | **Ajouté et testé** |
| A21 | P1 | MMD | Physique Bullet, articulations et corps souples | **Ouvert** |
| A22 | P1 | MMD | Héritages de transformations et contraintes IK complètes | **Ouvert** |
| A23 | P2 | MMD | Matériaux et effets MME exhaustifs | **Ouvert** |
| A24 | P1 | Compatibilité | Collection représentative de modèles téléchargés | **Non validé** |
| A25 | P2 | Animation | BPM d’un VMD automatiquement détecté | **Ouvert** |
| A26 | P1 | Animation | Retargeting universel et appuis des pieds | **Ouvert** |
| A27 | P2 | Animation | Visèmes et synchronisation labiale depuis la chanson | **Ouvert** |
| A28 | P1 | AutoMap | Qualité des patterns sur de vraies chansons | **À évaluer musicalement** |
| A29 | P2 | AutoMap | Reconnaissance d’un audio réencodé | **Ouvert** |
| A30 | P2 | Catalogue | Recherche de partitions existantes en ligne | **Ouvert** |
| A31 | P2 | Performances | Très gros médias et sauvegardes volumineuses | **Ouvert** |
| A32 | P1 | Gameplay | Fidélité 1:1 aux règles Project DIVA | **Non certifié** |
| A33 | P2 | Director | Outils de montage avancés | **Ouvert** |
| A34 | P2 | Director | Accessoires et nouvelles scènes générées | **Ouvert** |
| A35 | P1 | Production | Persistance après fermeture et installation hors ligne | **Non exécuté** |
| A36 | P1 | Production | Safari/iPhone et contrôleurs physiques | **Non exécuté** |
| A37 | P1 | Sauvegarde | Conflits entre plusieurs fenêtres | **Ouvert** |
| A38 | P2 | Architecture | Accumulation des extensions historiques | **Ouvert** |
| A39 | P2 | Direction artistique | Personnages et PV finalisés | **Ouvert** |
| A40 | P2 | Livraison et cloud | Dépôt V23 sur Google Drive et synchronisation de jeu | **Indisponible dans cette session** |

## Constats détaillés et conditions de clôture

### A01 · L’export dépendait des écritures

**P0 — Corrigé et testé**

**Constat.** Le chemin exportBackup enregistrait de nouveau les morceaux avant de lire la bibliothèque. Une écriture refusée pouvait donc empêcher une sauvegarde de secours.

**Traitement / suite.** Export en lecture seule. La partition sale du studio est incluse comme brouillon distinct, pas publiée sur la source. Le test refuse toutes les nouvelles écritures et obtient quand même le fichier de sauvegarde.

**Preuves ou emplacement inspecté.** `src/enhancements.js: exportBackup ; tests/v23_browser_test.py ; qa/v23/integration/browser-final.json`

### A02 · Transactions mémoire partiellement validées

**P0 — Corrigé et testé**

**Constat.** Le mode temporaire devait valider et cloner toutes les lignes avant la première modification, comme une transaction complète.

**Traitement / suite.** Prévalidation des collections, identifiants et objets clonables. Échec sur la deuxième ligne : aucune première ligne ajoutée. Les valeurs sont des instantanés indépendants.

**Preuves ou emplacement inspecté.** `src/services.js: Store.atomic ; tests/v23.test.cjs`

### A03 · Stockage fermé pris pour un stockage vide

**P0 — Corrigé et testé**

**Constat.** Une connexion invalidée ne doit pas provoquer un retour silencieux à une nouvelle mémoire vide, ni afficher une réussite de sauvegarde.

**Traitement / suite.** État invalidated explicite ; toutes les lectures et mutations le refusent. Badge STOCKAGE FERMÉ, message de rechargement et pause de la partie. Gestion des événements de fermeture et de changement de version.

**Preuves ou emplacement inspecté.** `src/services.js: Store.invalidate/guard/open ; src/quality.js: install ; tests/v23.test.cjs`

### A04 · Réglages affichés avant confirmation du stockage

**P1 — Corrigé et testé**

**Constat.** L’objet de préférences pouvait conserver un changement alors que la transaction avait été annulée.

**Traitement / suite.** Instantané de la dernière écriture confirmée et remise en état sur abort. Une réussite n’est publiée qu’à la fin de la transaction. Une exception d’observateur ne transforme pas un commit réussi en échec.

**Preuves ou emplacement inspecté.** `src/services.js: Store.atomic/committed ; src/quality.js ; test navigateur avec transaction annulée`

### A05 · Métadonnées et favoris non conservés après échec

**P1 — Corrigé et testé**

**Constat.** Modifier un titre ou un favori pouvait laisser l’interface en désaccord avec les données réellement enregistrées.

**Traitement / suite.** Candidat enregistré avant publication ; rollback du favori. Une sauvegarde de métadonnées refusée conserve la source et le champ saisi pour réessayer.

**Preuves ou emplacement inspecté.** `src/quality.js: saveSong ; src/enhancements.js: songManager ; qa/v23/integration/browser-final.json`

### A06 · Setlist fantôme après refus de sauvegarde

**P1 — Corrigé et testé**

**Constat.** Le tableau des concerts pouvait être modifié avant la validation de son enregistrement ou de sa suppression.

**Traitement / suite.** Copie candidate puis publication après succès. La file de morceaux reste disponible après un échec. Tests d’ajout, de nouvelle tentative et de suppression refusée.

**Preuves ou emplacement inspecté.** `src/enhancements.js: setlistDialog ; tests/v23_browser_test.py`

### A07 · Propriétaire d’une sauvegarde et remplacement GLB

**P1 — Avancé, validation partielle**

**Constat.** Un changement de morceau pendant une écriture ne doit pas restaurer le mauvais objet. Un GLB prévisualisé mais non enregistré ne doit pas rester à la place de la scène sauvegardée.

**Traitement / suite.** Sauvegarde attachée au propriétaire et à un numéro de requête ; retour à la scène enregistrée en cas d’import GLB échoué. Revue et non-régression effectuées ; le scénario GLB de panne graphique pendant l’écriture n’a pas son propre test navigateur exhaustif dans cette passe.

**Preuves ou emplacement inspecté.** `src/quality.js: saveSong/importModel ; src/app.js: clearModel/modelClip`

### A08 · Brouillon perdu en fermant le panneau

**P1 — Corrigé et testé**

**Constat.** Les modifications non appliquées du Director dépendaient de la seule session du panneau.

**Traitement / suite.** Brouillon séparé par morceau, file d’écriture et récupération explicite à la réouverture. La récupération reste annulable. Source manuelle inchangée avant Enregistrer.

**Preuves ou emplacement inspecté.** `src/director-app.js: directorRecoveries/directorDraftWrite ; navigateur : fermeture, réouverture, undo/redo`

### A09 · Brouillon refusé absent de la sauvegarde portable

**P1 — Corrigé et testé**

**Constat.** Une dernière modification pouvait ne subsister qu’en mémoire après un quota refusé ; les anciens exports ne transportaient pas cet état Director.

**Traitement / suite.** Conservation en mémoire avec statut d’échec, fusion de l’état le plus récent dans directorDrafts du pulsepack, références médias et propriétaire remappés à la restauration. Rechargement des deux personnages restaurés.

**Preuves ou emplacement inspecté.** `src/enhancements.js: exportBackup/restoreBackup ; qa/v23/integration/browser-final.json`

### A10 · Perte du contexte graphique pendant un PV

**P1 — Corrigé et testé**

**Constat.** Les ressources GPU étaient invalides après une perte de contexte ; une simple nouvelle image ne suffisait pas à rétablir le spectacle.

**Traitement / suite.** Détection de la perte, arrêt de l’horloge audio, reconstruction des programmes et buffers, rechargement des personnages. La partie reste en pause jusqu’à l’action du joueur. Test réel WEBGL_lose_context, pas seulement un événement DOM fabriqué.

**Preuves ou emplacement inspecté.** `src/stage.js ; src/quality.js: onRestored/onError ; qa/v23/integration/browser-final.json`

### A11 · Échec de création du shader bloquant le démarrage

**P1 — Corrigé et testé**

**Constat.** Une compilation de shader refusée pouvait remonter hors du chemin de repli 2D.

**Traitement / suite.** Initialisation capturée, diagnostic initError, renderer indisponible et repli annoncé. Test de compilation volontairement refusée.

**Preuves ou emplacement inspecté.** `src/stage.js: constructor ; tests/v23.test.cjs`

### A12 · Palette d’os répétée par matériau

**P1 — Corrigé et testé**

**Constat.** Les données du squelette étaient préparées et envoyées pour chaque matériau, malgré un modèle et une pose identiques.

**Traitement / suite.** Palette partagée par les matériaux et réutilisation de son tableau en mémoire ; un envoi par modèle et par image. Deux matériaux contrôlés dans le vrai renderer.

**Preuves ou emplacement inspecté.** `src/stage.js: skin/paletteUploads ; qa/v23/integration/browser-final.json`

### A13 · SDEF lu puis remplacé par une déformation linéaire

**P1 — Avancé et testé**

**Constat.** Les centres C/R0/R1 étaient sautés par le parseur. Le rendu ne pouvait donc pas calculer le SDEF prévu par le fichier.

**Traitement / suite.** Conservation, conversion de coordonnées et validation des centres ; calcul sphérique spécifique CPU/GLSL. Équation vérifiée contre une forme développée indépendante et sortie GPU comparée. Support de transformations rigides, pas certification de tout squelette complexe.

**Preuves ou emplacement inspecté.** `src/mmd-core.js ; src/mmd-compat.js ; src/skinning.js ; tests/v23_gpu_probe.js`

### A14 · QDEF traité comme BDEF

**P1 — Avancé et testé**

**Constat.** Le type QDEF n’avait pas son chemin de déformation par quaternions duaux normalisés.

**Traitement / suite.** Chemin QDEF à quatre influences, correction du signe des quaternions, normalisation, translation et normales. Tests des torsions, des poids extrêmes et du résultat GPU. Les héritages d’os, échelles non rigides et la physique restent distincts.

**Preuves ou emplacement inspecté.** `src/skinning.js ; tests/v23.test.cjs ; qa/v23/integration/gpu-feedback.json`

### A15 · Sphere map calculée dans le mauvais repère

**P2 — Corrigé, contrôle structurel**

**Constat.** La normale utilisée pour la sphere map devait suivre le repère de la caméra, pas uniquement le repère du monde.

**Traitement / suite.** Normale transformée par la vue. Shader compilé et parcours MMD rejoués. La comparaison pixel à pixel de matériaux complexes avec MMD Desktop n’est pas faite.

**Preuves ou emplacement inspecté.** `src/stage.js: uView et normale sphere map ; test natif WebGL`

### A16 · Génération ralentie par des rescans globaux

**P1 — Corrigé et testé**

**Constat.** À chaque candidat d’accord, l’algorithme reconstruisait et triait les notes de toute la difficulté pour vérifier une densité locale.

**Traitement / suite.** Listes par difficulté maintenues en ordre et contrôle limité aux fenêtres de quatre secondes que le candidat peut modifier. Comparaison stricte des notes avec le moteur V22 conservé comme oracle.

**Preuves ou emplacement inspecté.** `src/automap-core.js ; tests/reference/automap-v22-baseline.js ; tests/v23-automap.test.cjs`

### A17 · Préférences restaurées hors limites

**P1 — Corrigé et testé**

**Constat.** Des valeurs nulles, booléennes, infinies, hors plage, ou des mappings de touches en doublon pouvaient produire des réglages incohérents.

**Traitement / suite.** Contrats numériques et de types, mappings uniques, profils de jugement connus. Récupération avec avertissement au démarrage ; restauration explicitement refusée et atomique pour les préférences invalides.

**Preuves ou emplacement inspecté.** `src/quality.js: preferences ; src/enhancements.js: restoreBackup ; tests/v23.test.cjs`

### A18 · Director mal formé accepté partiellement

**P1 — Corrigé et testé**

**Constat.** Des structures inattendues de slots/clips ou des clés de formation dupliquées pouvaient être normalisées de façon ambiguë.

**Traitement / suite.** Limites et types contrôlés, invalides refusés avant remplacement. Les sources ne sont pas modifiées lors du refus.

**Preuves ou emplacement inspecté.** `src/director-core.js: normalizeDirector ; tests/v23.test.cjs`

### A19 · Réglages devenus trop longs à parcourir

**P2 — Amélioré et testé**

**Constat.** L’empilement des systèmes rendait l’accès à Audio, AutoMap ou aux sauvegardes peu direct.

**Traitement / suite.** Six raccourcis vers les rubriques réelles, panneaux homogènes et lignes de diagnostic repliables. Capture mobile du Director et contrôle des dimensions.

**Preuves ou emplacement inspecté.** `src/quality.js ; src/style.css ; qa/v23/integration/03-mobile-recovery.png`

### A20 · Aucun état global exploitable de la bibliothèque

**P2 — Ajouté et testé**

**Constat.** Les contrôles MMD à l’import ne signalaient pas ensemble les niveaux manquants, médias absents et spectacles invalides de la bibliothèque courante.

**Traitement / suite.** Audit non destructif par morceau dans Réglages, avec export JSON et limites explicitement indiquées. Aucune réparation ou suppression silencieuse.

**Preuves ou emplacement inspecté.** `src/quality.js: songAudit/auditLibraryQuality ; qa/v23/integration/04-quality-report.png`

### A21 · Physique Bullet, articulations et corps souples

**P1 — Ouvert**

**Constat.** Le pipeline V23 ne simule pas exhaustivement les corps rigides, contraintes et tissus d’un pack PMX. Les options anciennes ne sont pas une preuve d’intégration Bullet.

**Traitement / suite.** À faire : importer toutes les propriétés, solveur à pas fixe, remise en état après seek/pause, collisions et limites d’articulations, puis tests cheveux/vêtements sur corpus autorisé. Ne pas activer une case sans solveur fonctionnel.

**Preuves ou emplacement inspecté.** `src/mmd-core.js ; src/stage.js ; diagnostic PulseQuality.limitations`

### A22 · Héritages de transformations et contraintes IK complètes

**P1 — Ouvert**

**Constat.** Le solveur présent ne couvre pas tous les grants/append transforms, axes locaux et limites IK attendus par les modèles avancés.

**Traitement / suite.** À faire : ordre d’évaluation explicite, tests de chaque drapeau et des dépendances entre os, comparaison des matrices avec un moteur MMD de référence. Corriger la déformation de peau ne résout pas ce problème.

**Preuves ou emplacement inspecté.** `src/stage.js: animation et IK ; src/mmd-core.js: flags des os`

### A23 · Matériaux et effets MME exhaustifs

**P2 — Ouvert**

**Constat.** Les morphs UV0/couleur/opacité et sphere maps existent, mais le rendu complet des UV additionnels, contours, toon, spéculaire et effets MME n’est pas équivalent à MMD Desktop.

**Traitement / suite.** À faire : matrice de compatibilité des matériaux, images de référence par fonction, règles de transparence, rendu des contours et effets explicitement supportés. Garder un avertissement sur les fonctions ignorées.

**Preuves ou emplacement inspecté.** `src/mmd-surface.js ; src/stage.js ; src/mmd-audit.js`

### A24 · Collection représentative de modèles téléchargés

**P1 — Non validé**

**Constat.** Les tests présents utilisent surtout des diagnostics originaux. Leur passage ne certifie pas un personnage quelconque avec des centaines de textures et contraintes.

**Traitement / suite.** À faire : corpus avec autorisation de test, provenance et licences consignées ; PMD/PMX, morphs, textures japonaises, os complexes et plusieurs tailles ; grille rendu/animation/physique indépendante.

**Preuves ou emplacement inspecté.** `examples/v19, v21, v22, v23 ; rapports navigateur`

### A25 · BPM d’un VMD automatiquement détecté

**P2 — Ouvert**

**Constat.** Le calage musical demande toujours un BPM source et un premier temps fournis. La durée d’un VMD ne suffit pas à déterminer sa pulsation.

**Traitement / suite.** À faire : proposition d’un tempo et d’une phase à partir de cycles de mouvement, alternatives moitié/double, confiance et aperçu comparatif ; validation manuelle conservée.

**Preuves ou emplacement inspecté.** `src/motion-sync.js ; src/motion-sync-app.js ; src/autoshow-core.js`

### A26 · Retargeting universel et appuis des pieds

**P1 — Ouvert**

**Constat.** La correspondance de noms d’os ne corrige ni les proportions, ni les poses de repos, ni les pénétrations. La danse procédurale MMD reste surtout sur le haut du corps reconnu.

**Traitement / suite.** À faire : mapping éditable, pose de repos, correction des axes/proportions, contacts des pieds, root motion et limites articulaires ; conserver la pose plutôt qu’un retargeting aveugle.

**Preuves ou emplacement inspecté.** `src/stage.js: mouvements procéduraux et VMD ; diagnostic MMD`

### A27 · Visèmes et synchronisation labiale depuis la chanson

**P2 — Ouvert**

**Constat.** Les morphs faciaux VMD sont lus ; le moteur ne déduit pas des paroles et visèmes fiables depuis un mix musical.

**Traitement / suite.** À faire : piste faciale séparée, import de repères phonétiques ou pipeline d’analyse explicite, réglage des visèmes par modèle et possibilité de correction manuelle.

**Preuves ou emplacement inspecté.** `src/mmd-surface.js ; src/autoshow-core.js`

### A28 · Qualité des patterns sur de vraies chansons

**P1 — À évaluer musicalement**

**Constat.** Les contraintes d’héritage, de cadence et de quantification sont testées. Les sections et attaques restent des heuristiques ; elles ne garantissent pas une partition agréable sur chaque genre.

**Traitement / suite.** À faire : corpus d’écoute annoté et libre d’usage couvrant rubato, swing, triolets, basses pauvres, voix seules, silences et tempos variables ; mesurer les erreurs de pulsation et faire noter les patterns.

**Preuves ou emplacement inspecté.** `src/automap-core.js ; exemples audio et tests historiques ; benchmark V23 non musical`

### A29 · Reconnaissance d’un audio réencodé

**P2 — Ouvert**

**Constat.** L’empreinte exacte identifie un même fichier, pas deux encodages d’un enregistrement ni une version concert/remix.

**Traitement / suite.** À faire : empreinte acoustique, estimation du décalage et confiance. Ne jamais appliquer automatiquement une chart exacte à un enregistrement seulement ressemblant.

**Preuves ou emplacement inspecté.** `src/hash-core.js ; catalogue local`

### A30 · Recherche de partitions existantes en ligne

**P2 — Ouvert**

**Constat.** Le catalogue de charts demeure local, alimenté par les imports. L’absence de niveau local déclenche AutoMap, pas une recherche mondiale.

**Traitement / suite.** À faire : connecteur de catalogue autorisé, provenance/version de chaque niveau, association de l’audio vérifiable, cache et décision de l’utilisateur avant une source incertaine.

**Preuves ou emplacement inspecté.** `src/automap-app.js ; catalogue .pulsecharts`

### A31 · Très gros médias et sauvegardes volumineuses

**P2 — Ouvert**

**Constat.** Le décodage audio, certains tableaux et les sauvegardes JSON/base64 occupent la mémoire. L’optimisation V23 concerne la génération, pas un décodage audio ou un export totalement en streaming.

**Traitement / suite.** À faire : budgets mémoire par plateforme, estimation avant import, annulation à chaque phase lourde, format de sauvegarde binaire/streaming, stress tests sur grandes bibliothèques.

**Preuves ou emplacement inspecté.** `src/services.js ; src/enhancements.js: blobToBase64/exportBackup ; src/automap-app.js`

### A32 · Fidélité 1:1 aux règles Project DIVA

**P1 — Non certifié**

**Constat.** Les profils de jugement, trajectoires et bonus actuels sont ceux de DIVA PULSE. Aucun banc de comparaison exhaustive par édition SEGA n’a été exécuté.

**Traitement / suite.** À faire : choisir une édition de référence, spécifier chaque type de note/bonus, fixtures d’entrée et score attendu, tests simultanés/maintien/chaînes ; séparer les records par règleset.

**Preuves ou emplacement inspecté.** `src/core.js ; src/app.js ; profils Standard/Accessible/Précision`

### A33 · Outils de montage avancés

**P2 — Ouvert**

**Constat.** Les clips, fondus, formations, caméras et lumières sont éditables ; l’éditeur ne dispose pas encore d’une ergonomie complète de logiciel de montage avec toutes les courbes, multi-sélections et raccourcis.

**Traitement / suite.** À faire : sélection multiple de clés, copier/coller entre pistes, tangentes visuelles, accrochage aux mesures, navigation clavier, prévisualisation sonore synchronisée et mixage de root motion.

**Preuves ou emplacement inspecté.** `src/director-app.js ; src/director-core.js ; captures de l’interface`

### A34 · Accessoires et nouvelles scènes générées

**P2 — Ouvert**

**Constat.** Auto Show assemble les scènes présentes ; il ne crée pas de nouveaux maillages. Les accessoires complexes et leurs interactions ne sont pas un système complet validé.

**Traitement / suite.** À faire : bibliothèque de props, rattachements aux os, clés d’activation, collisions de mise en scène, génération de placement contrainte et mesure des coûts graphiques.

**Preuves ou emplacement inspecté.** `src/stage.js ; src/autoshow-core.js ; Director`

### A35 · Persistance après fermeture et installation hors ligne

**P1 — Non exécuté**

**Constat.** Les essais graphiques utilisent un document d’origine opaque : stockage TEMPORAIRE. La navigation du navigateur vers le serveur est bloquée par l’infrastructure de cette session.

**Traitement / suite.** À faire sur une origine normale : fermer/réouvrir le navigateur, interruption au commit, mise à jour de version, installation/démarrage PWA hors ligne, export/restauration après quota atteint. Ne pas remplacer ces essais par le seul test du fichier sw.js.

**Preuves ou emplacement inspecté.** `qa/v23/environment-limitations.json ; tests/launcher_test.py ; sw.js`

### A36 · Safari/iPhone et contrôleurs physiques

**P1 — Non exécuté**

**Constat.** Les contrôles clavier/manette/MIDI automatisés ne mesurent pas un contrôleur physique, la latence réelle Bluetooth ni Safari/iOS.

**Traitement / suite.** À faire : matrice d’appareils, latence audio/entrée/affichage, multitouch, déconnexion/reconnexion, suspension de l’onglet et reprise, clavier international.

**Preuves ou emplacement inspecté.** `Rapports Playwright et limitations de cette livraison`

### A37 · Conflits entre plusieurs fenêtres

**P1 — Ouvert**

**Constat.** Le changement de version IndexedDB est géré, mais aucun protocole général de résolution des éditions concurrentes par deux fenêtres de même version n’est présent.

**Traitement / suite.** À faire : numéro de révision, détection de conflit au commit et récupération en copie ; notifications inter-fenêtres. Le scénario n’est pas reproduit avec une vraie origine dans cette session.

**Preuves ou emplacement inspecté.** `src/services.js ; src/quality.js: sérialisation locale seulement`

### A38 · Accumulation des extensions historiques

**P2 — Ouvert**

**Constat.** Le build fonctionne sans dépendance, mais plusieurs extensions remplacent ou enveloppent les méthodes de l’application. Certaines sources sont très compactes et difficiles à relire.

**Traitement / suite.** À faire progressivement : API de services explicites, modules métier, formatage des sources, tests d’intégration contractuels. Garder le HTML autonome comme sortie, pas comme source de développement.

**Preuves ou emplacement inspecté.** `build.py ; src/enhancements.js ; src/v7-app.js ; src/v9-app.js ; src/v10-app.js`

### A39 · Personnages et PV finalisés

**P2 — Ouvert**

**Constat.** Les silhouettes procédurales et modèles de diagnostic ne constituent pas des personnages Vocaloid détaillés. Les chansons, costumes et chorégraphies officiels ne sont pas inclus.

**Traitement / suite.** À faire : pipeline d’assets finaux fournis avec leur provenance, galerie et contrôle de compatibilité, presets artistiques et cohérence de scène ; ne pas assimiler une fixture technique à un personnage final.

**Preuves ou emplacement inspecté.** `examples/ ; personnages procéduraux de src/stage.js`

### A40 · Dépôt V23 sur Google Drive et synchronisation de jeu

**P2 — Indisponible dans cette session**

**Constat.** Le dossier dédié a été relu ; le connecteur expose maintenant uniquement des actions de lecture. Aucune création de dossier ou téléversement V23 n’a pu être exécuté. Le jeu ne synchronise pas automatiquement sa bibliothèque avec Drive.

**Traitement / suite.** Livrables locaux vérifiés fournis séparément. Conserver la V22 sur Drive intacte. Un futur dépôt devra créer une nouvelle version et relire les fichiers ; la synchronisation dans le jeu exigerait un chantier OAuth et conflits distinct.

**Preuves ou emplacement inspecté.** `Découverte des 29 actions Google Drive : lecture seule ; dossier V22 existant confirmé`

## Mesure AutoMap : ce qui a réellement accéléré

Le scénario de comparaison utilise **600 secondes de données d’analyse synthétiques et 7 475 attaques**, dans un même processus Node. Le générateur V22 prend **1.843 s**, contre **0.221 s** pour V23 sur cette exécution. Les cinq niveaux contiennent respectivement **896 / 1 403 / 2 228 / 3 301 / 4 483 notes**, identiques à l’oracle V22. Dix autres configurations de graine et de style vérifient cette égalité.

Cette mesure exclut le décodage de l’audio, son analyse, le stockage et le rendu. **Elle ne promet ni un gain constant sur toutes les machines, ni un meilleur goût musical des patterns.** Preuve : `qa/v23/automap-benchmark.json`.

## Compatibilité MMD : ce que le SDEF/QDEF ne résout pas

La déformation du maillage, l’évaluation du squelette, la physique et l’adaptation d’une animation sont des couches différentes. La V23 ajoute les calculs de déformation rigide SDEF/QDEF et vérifie leur application GPU. Elle ne crée pas pour autant un solveur d’héritage d’os, une physique Bullet ou un système de contacts des pieds. Les résultats numériques portent sur des fixtures originales ; une comparaison avec une grande collection de personnages reste nécessaire.

La documentation de référence de babylon-mmd distingue également [SDEF et déformation linéaire](https://noname0310.github.io/babylon-mmd/docs/reference/loader/mmd-model-loader/sdef-support/), et explique les [réglages de correspondance d’os et de pose de repos nécessaires au retargeting](https://noname0310.github.io/babylon-mmd/docs/reference/runtime/apply-mmd-animation-on-non-mmd-model/). Ces références ont servi à préciser le périmètre ; leur moteur n’a pas été ajouté comme dépendance de cette livraison.

## Ordre de poursuite recommandé

D’abord valider sur une vraie origine la persistance, les conflits entre fenêtres et les grandes sauvegardes. Ensuite traiter les héritages d’os et la physique avec un corpus MMD autorisé, puis les contacts de pieds et le calage automatique des motions. En parallèle, évaluer AutoMap à l’écoute et définir un ruleset Project DIVA de référence, plutôt que d’ajouter des types de notes sans oracle. Finaliser ensuite les assets, la timeline avancée et la matrice de périphériques.

Le JSON `AUDIT_V23.json` fournit les mêmes 40 constats pour créer un backlog dans un outil de suivi. Ce fichier ne contient aucune donnée privée de la bibliothèque du joueur.
