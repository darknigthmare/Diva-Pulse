# DIVA PULSE V27 — Audit actualisé

Lecture des tables physiques PMX/PMD ; dynamique secondaire positionnelle approximative, optionnelle et locale au modèle ; diagnostic, aperçu et sauvegarde non destructifs. Ce moteur n’est pas Bullet. Le catalogue en ligne, le retargeting universel, les corps souples et la certification de persistance restent ouverts.

## État de la passe

Le suivi contient **56 constats**. Les statuts historiques ne prétendent pas qu’un chantier entier a été terminé dans cette version. Les preuves du build courant sont détaillées dans RAPPORT_V27.md.

## Constats

### A01 — L’export dépendait des écritures

**P0 · Sauvegarde · Corrigé et testé**

Le chemin exportBackup enregistrait de nouveau les morceaux avant de lire la bibliothèque. Une écriture refusée pouvait donc empêcher une sauvegarde de secours.

Export en lecture seule. La partition sale du studio est incluse comme brouillon distinct, pas publiée sur la source. Le test refuse toutes les nouvelles écritures et obtient quand même le fichier de sauvegarde.

Preuve : `src/enhancements.js: exportBackup ; tests/v23_browser_test.py ; qa/v23/integration/browser-final.json`.

### A02 — Transactions mémoire partiellement validées

**P0 · Sauvegarde · Corrigé et testé**

Le mode temporaire devait valider et cloner toutes les lignes avant la première modification, comme une transaction complète.

Prévalidation des collections, identifiants et objets clonables. Échec sur la deuxième ligne : aucune première ligne ajoutée. Les valeurs sont des instantanés indépendants.

Preuve : `src/services.js: Store.atomic ; tests/v23.test.cjs`.

### A03 — Stockage fermé pris pour un stockage vide

**P0 · Sauvegarde · Corrigé et testé**

Une connexion invalidée ne doit pas provoquer un retour silencieux à une nouvelle mémoire vide, ni afficher une réussite de sauvegarde.

État invalidated explicite ; toutes les lectures et mutations le refusent. Badge STOCKAGE FERMÉ, message de rechargement et pause de la partie. Gestion des événements de fermeture et de changement de version.

Preuve : `src/services.js: Store.invalidate/guard/open ; src/quality.js: install ; tests/v23.test.cjs`.

### A04 — Réglages affichés avant confirmation du stockage

**P1 · Sauvegarde · Corrigé et testé**

L’objet de préférences pouvait conserver un changement alors que la transaction avait été annulée.

Instantané de la dernière écriture confirmée et remise en état sur abort. Une réussite n’est publiée qu’à la fin de la transaction. Une exception d’observateur ne transforme pas un commit réussi en échec.

Preuve : `src/services.js: Store.atomic/committed ; src/quality.js ; test navigateur avec transaction annulée`.

### A05 — Métadonnées et favoris non conservés après échec

**P1 · Bibliothèque · Corrigé et testé**

Modifier un titre ou un favori pouvait laisser l’interface en désaccord avec les données réellement enregistrées.

Candidat enregistré avant publication ; rollback du favori. Une sauvegarde de métadonnées refusée conserve la source et le champ saisi pour réessayer.

Preuve : `src/quality.js: saveSong ; src/enhancements.js: songManager ; qa/v23/integration/browser-final.json`.

### A06 — Setlist fantôme après refus de sauvegarde

**P1 · Bibliothèque · Corrigé et testé**

Le tableau des concerts pouvait être modifié avant la validation de son enregistrement ou de sa suppression.

Copie candidate puis publication après succès. La file de morceaux reste disponible après un échec. Tests d’ajout, de nouvelle tentative et de suppression refusée.

Preuve : `src/enhancements.js: setlistDialog ; tests/v23_browser_test.py`.

### A07 — Propriétaire d’une sauvegarde et remplacement GLB

**P1 · Sauvegarde · Avancé, validation partielle**

Un changement de morceau pendant une écriture ne doit pas restaurer le mauvais objet. Un GLB prévisualisé mais non enregistré ne doit pas rester à la place de la scène sauvegardée.

Sauvegarde attachée au propriétaire et à un numéro de requête ; retour à la scène enregistrée en cas d’import GLB échoué. Revue et non-régression effectuées ; le scénario GLB de panne graphique pendant l’écriture n’a pas son propre test navigateur exhaustif dans cette passe.

Preuve : `src/quality.js: saveSong/importModel ; src/app.js: clearModel/modelClip`.

### A08 — Brouillon perdu en fermant le panneau

**P1 · Director · Corrigé et testé**

Les modifications non appliquées du Director dépendaient de la seule session du panneau.

Brouillon séparé par morceau, file d’écriture et récupération explicite à la réouverture. La récupération reste annulable. Source manuelle inchangée avant Enregistrer.

Preuve : `src/director-app.js: directorRecoveries/directorDraftWrite ; navigateur : fermeture, réouverture, undo/redo`.

### A09 — Brouillon refusé absent de la sauvegarde portable

**P1 · Director · Corrigé et testé**

Une dernière modification pouvait ne subsister qu’en mémoire après un quota refusé ; les anciens exports ne transportaient pas cet état Director.

Conservation en mémoire avec statut d’échec, fusion de l’état le plus récent dans directorDrafts du pulsepack, références médias et propriétaire remappés à la restauration. Rechargement des deux personnages restaurés.

Preuve : `src/enhancements.js: exportBackup/restoreBackup ; qa/v23/integration/browser-final.json`.

### A10 — Perte du contexte graphique pendant un PV

**P1 · Rendu · Corrigé et testé**

Les ressources GPU étaient invalides après une perte de contexte ; une simple nouvelle image ne suffisait pas à rétablir le spectacle.

Détection de la perte, arrêt de l’horloge audio, reconstruction des programmes et buffers, rechargement des personnages. La partie reste en pause jusqu’à l’action du joueur. Test réel WEBGL_lose_context, pas seulement un événement DOM fabriqué.

Preuve : `src/stage.js ; src/quality.js: onRestored/onError ; qa/v23/integration/browser-final.json`.

### A11 — Échec de création du shader bloquant le démarrage

**P1 · Rendu · Corrigé et testé**

Une compilation de shader refusée pouvait remonter hors du chemin de repli 2D.

Initialisation capturée, diagnostic initError, renderer indisponible et repli annoncé. Test de compilation volontairement refusée.

Preuve : `src/stage.js: constructor ; tests/v23.test.cjs`.

### A12 — Palette d’os répétée par matériau

**P1 · Performances · Corrigé et testé; allocations de morphs améliorées**

Les données du squelette étaient préparées et envoyées pour chaque matériau, malgré un modèle et une pose identiques.

Palette partagée par les matériaux et réutilisation de son tableau en mémoire ; un envoi par modèle et par image. Deux matériaux contrôlés dans le vrai renderer.

Preuve : `src/stage.js: skin/paletteUploads ; qa/v23/integration/browser-final.json`.

### A13 — SDEF lu puis remplacé par une déformation linéaire

**P1 · MMD · Avancé et testé**

Les centres C/R0/R1 étaient sautés par le parseur. Le rendu ne pouvait donc pas calculer le SDEF prévu par le fichier.

Conservation, conversion de coordonnées et validation des centres ; calcul sphérique spécifique CPU/GLSL. Équation vérifiée contre une forme développée indépendante et sortie GPU comparée. Support de transformations rigides, pas certification de tout squelette complexe.

Preuve : `src/mmd-core.js ; src/mmd-compat.js ; src/skinning.js ; tests/v23_gpu_probe.js`.

### A14 — QDEF traité comme BDEF

**P1 · MMD · Avancé et testé**

Le type QDEF n’avait pas son chemin de déformation par quaternions duaux normalisés.

Chemin QDEF à quatre influences, correction du signe des quaternions, normalisation, translation et normales. Tests des torsions, des poids extrêmes et du résultat GPU. Les héritages d’os, échelles non rigides et la physique restent distincts.

Preuve : `src/skinning.js ; tests/v23.test.cjs ; qa/v23/integration/gpu-feedback.json`.

### A15 — Sphere map calculée dans le mauvais repère

**P2 · MMD · Corrigé, contrôle structurel**

La normale utilisée pour la sphere map devait suivre le repère de la caméra, pas uniquement le repère du monde.

Normale transformée par la vue. Shader compilé et parcours MMD rejoués. La comparaison pixel à pixel de matériaux complexes avec MMD Desktop n’est pas faite.

Preuve : `src/stage.js: uView et normale sphere map ; test natif WebGL`.

### A16 — Génération ralentie par des rescans globaux

**P1 · AutoMap · Corrigé et testé**

À chaque candidat d’accord, l’algorithme reconstruisait et triait les notes de toute la difficulté pour vérifier une densité locale.

Listes par difficulté maintenues en ordre et contrôle limité aux fenêtres de quatre secondes que le candidat peut modifier. Comparaison stricte des notes avec le moteur V22 conservé comme oracle.

Preuve : `src/automap-core.js ; tests/reference/automap-v22-baseline.js ; tests/v23-automap.test.cjs`.

### A17 — Préférences restaurées hors limites

**P1 · Validation · Corrigé et testé**

Des valeurs nulles, booléennes, infinies, hors plage, ou des mappings de touches en doublon pouvaient produire des réglages incohérents.

Contrats numériques et de types, mappings uniques, profils de jugement connus. Récupération avec avertissement au démarrage ; restauration explicitement refusée et atomique pour les préférences invalides.

Preuve : `src/quality.js: preferences ; src/enhancements.js: restoreBackup ; tests/v23.test.cjs`.

### A18 — Director mal formé accepté partiellement

**P1 · Validation · Corrigé et testé**

Des structures inattendues de slots/clips ou des clés de formation dupliquées pouvaient être normalisées de façon ambiguë.

Limites et types contrôlés, invalides refusés avant remplacement. Les sources ne sont pas modifiées lors du refus.

Preuve : `src/director-core.js: normalizeDirector ; tests/v23.test.cjs`.

### A19 — Réglages devenus trop longs à parcourir

**P2 · Interface · Amélioré et testé**

L’empilement des systèmes rendait l’accès à Audio, AutoMap ou aux sauvegardes peu direct.

Six raccourcis vers les rubriques réelles, panneaux homogènes et lignes de diagnostic repliables. Capture mobile du Director et contrôle des dimensions.

Preuve : `src/quality.js ; src/style.css ; qa/v23/integration/03-mobile-recovery.png`.

### A20 — Aucun état global exploitable de la bibliothèque

**P2 · Diagnostic · Ajouté et testé**

Les contrôles MMD à l’import ne signalaient pas ensemble les niveaux manquants, médias absents et spectacles invalides de la bibliothèque courante.

Diagnostic non destructif de bibliothèque conservé. Il signale aussi les descripteurs acoustiques invalides et indique que les copies acoustiques ne sont pas des identités vérifiées.

Preuve : `src/quality.js ; tests/v26.test.cjs ; tests/v26_regression_v23_browser.py`.

### A21 — Physique Bullet, articulations et corps souples

**P1 · MMD · Avancé : dynamique secondaire native ; Bullet et corps souples ouverts**

Le pipeline V23 ne simule pas exhaustivement les corps rigides, contraintes et tissus d’un pack PMX. Les options anciennes ne sont pas une preuve d’intégration Bullet.

Lecture complète des tables de corps PMX/PMD et articulations prises en charge. Solveur positionnel natif optionnel, gravité, collisions approchées, limites/corrections de rappel, réinjection dans les os. Pas de Bullet, pas de tissu/corps souples, pas de tenseur complet ni de fidélité universelle. L’aperçu et la sauvegarde par morceau sont testés.

Preuve : `src/physics-data.js ; src/secondary-physics.js ; src/v27-app.js ; tests/v27.test.cjs ; qa/v27/features/browser-final.json`.

### A22 — Héritages de transformations et contraintes IK complètes

**P1 · MMD · Avancé, compatibilité partielle**

Le solveur présent ne couvre pas tous les grants/append transforms, axes locaux et limites IK attendus par les modèles avancés.

Héritages standards non locaux de rotation et translation, ratios et chaînes, cycles refusés, projection XYZ des limites IK dans le bon repère, plafond de 32 itérations. Les héritages locaux/monde, axes, interactions après IK et physique restent ouverts.

Preuve : `src/skeleton.js ; src/stage.js ; src/mmd-core.js ; tests/v24.test.cjs ; tests/v24_browser_test.py`.

### A23 — Matériaux et effets MME exhaustifs

**P2 · MMD · Ouvert**

Les morphs UV0/couleur/opacité et sphere maps existent, mais le rendu complet des UV additionnels, contours, toon, spéculaire et effets MME n’est pas équivalent à MMD Desktop.

À faire : matrice de compatibilité des matériaux, images de référence par fonction, règles de transparence, rendu des contours et effets explicitement supportés. Garder un avertissement sur les fonctions ignorées.

Preuve : `src/mmd-surface.js ; src/stage.js ; src/mmd-audit.js`.

### A24 — Collection représentative de modèles téléchargés

**P1 · Compatibilité · Non validé**

Les tests présents utilisent surtout des diagnostics originaux. Leur passage ne certifie pas un personnage quelconque avec des centaines de textures et contraintes.

À faire : corpus avec autorisation de test, provenance et licences consignées ; PMD/PMX, morphs, textures japonaises, os complexes et plusieurs tailles ; grille rendu/animation/physique indépendante.

Preuve : `examples/v19, v21, v22, v23 ; rapports navigateur`.

### A25 — BPM d’un VMD automatiquement détecté

**P2 · Animation · Avancé, proposition à valider**

Le calage musical demande toujours un BPM source et un premier temps fournis. La durée d’un VMD ne suffit pas à déterminer sa pulsation.

Recherche bornée de cycles de pose VMD, stabilité sur deux moitiés, plusieurs interprétations BPM. Sélection explicite puis sauvegarde ; aucune phase certaine ni application automatique. VMD statiques et sans cycle refusés comme source de BPM.

Preuve : `src/motion-analysis.js ; src/reliability.js ; tests/v24_browser_test.py`.

### A26 — Retargeting universel et appuis des pieds

**P1 · Animation · Ouvert**

La correspondance de noms d’os ne corrige ni les proportions, ni les poses de repos, ni les pénétrations. La danse procédurale MMD reste surtout sur le haut du corps reconnu.

À faire : mapping éditable, pose de repos, correction des axes/proportions, contacts des pieds, root motion et limites articulaires ; conserver la pose plutôt qu’un retargeting aveugle.

Preuve : `src/stage.js: mouvements procéduraux et VMD ; diagnostic MMD`.

### A27 — Visèmes et synchronisation labiale depuis la chanson

**P2 · Animation · Avancé, enveloppe audio et édition manuelle; visèmes ouverts**

Les morphs faciaux VMD sont lus ; le moteur ne déduit pas des paroles et visèmes fiables depuis un mix musical.

À faire : piste faciale séparée, import de repères phonétiques ou pipeline d’analyse explicite, réglage des visèmes par modèle et possibilité de correction manuelle.

Preuve : `src/mmd-surface.js ; src/autoshow-core.js`.

### A28 — Qualité des patterns sur de vraies chansons

**P1 · AutoMap · Avancé, corpus synthétique seulement**

Les contraintes d’héritage, de cadence et de quantification sont testées. Les sections et attaques restent des heuristiques ; elles ne garantissent pas une partition agréable sur chaque genre.

Cinq WAV originaux annotés (binaire, ternaire, swing, changement de tempo, silence), analyse PCM réelle et contrôle des cinq difficultés. Rappel/précision mesurés. Pas de corpus de chansons mixées ni d’évaluation humaine ; moteur générateur V23 conservé.

Preuve : `tests/v24-audio-corpus.cjs ; examples/v24/audio-corpus ; qa/v24/audio-corpus.json`.

### A29 — Reconnaissance d’un audio réencodé

**P2 · AutoMap · Avancé, candidats acoustiques locaux; validation en corpus réel ouverte**

L’empreinte exacte identifie un même fichier, pas deux encodages d’un enregistrement ni une version concert/remix.

Index spectral/énergie du PCM, propositions après import réencodé, offset ±2 s estimé par pas de 50 ms, contrôle en quatre portions. La copie demande sélection, écoute et confirmation ; nouveaux identifiants et provenance non vérifiée, sans écraser aucune source. Les WAV/MP3 du diagnostic sont reconnus, une autre composition de même BPM est refusée. Aucune preuve d’identité universelle ou recherche en ligne.

Preuve : `src/audio-match.js ; src/v26-app.js ; tests/v26.test.cjs ; qa/v26/acoustic-fixtures-results.json ; qa/v26/features/browser-final.json`.

### A30 — Recherche de partitions existantes en ligne

**P2 · Catalogue · Ouvert**

Le catalogue de charts demeure local, alimenté par les imports. L’absence de niveau local déclenche AutoMap, pas une recherche mondiale.

À faire : connecteur de catalogue autorisé, provenance/version de chaque niveau, association de l’audio vérifiable, cache et décision de l’utilisateur avant une source incertaine.

Preuve : `src/automap-app.js ; catalogue .pulsecharts`.

### A31 — Très gros médias et sauvegardes volumineuses

**P2 · Performances · Avancé, format binaire et banc synthétique; plafond réel à valider**

Le décodage audio, certains tableaux et les sauvegardes JSON/base64 occupent la mémoire. L’optimisation V23 concerne la génération, pas un décodage audio ou un export totalement en streaming.

À faire : budgets mémoire par plateforme, estimation avant import, annulation à chaque phase lourde, format de sauvegarde binaire/streaming, stress tests sur grandes bibliothèques.

Preuve : `src/services.js ; src/enhancements.js: blobToBase64/exportBackup ; src/automap-app.js`.

### A32 — Fidélité 1:1 aux règles Project DIVA

**P1 · Gameplay · Non certifié**

Les profils de jugement, trajectoires et bonus actuels sont ceux de DIVA PULSE. Aucun banc de comparaison exhaustive par édition SEGA n’a été exécuté.

À faire : choisir une édition de référence, spécifier chaque type de note/bonus, fixtures d’entrée et score attendu, tests simultanés/maintien/chaînes ; séparer les records par règleset.

Preuve : `src/core.js ; src/app.js ; profils Standard/Accessible/Précision`.

### A33 — Outils de montage avancés

**P2 · Director · Avancé, piste faciale éditable; montage complet ouvert**

Les clips, fondus, formations, caméras et lumières sont éditables ; l’éditeur ne dispose pas encore d’une ergonomie complète de logiciel de montage avec toutes les courbes, multi-sélections et raccourcis.

À faire : sélection multiple de clés, copier/coller entre pistes, tangentes visuelles, accrochage aux mesures, navigation clavier, prévisualisation sonore synchronisée et mixage de root motion.

Preuve : `src/director-app.js ; src/director-core.js ; captures de l’interface`.

### A34 — Accessoires et nouvelles scènes générées

**P2 · Director · Ouvert**

Auto Show assemble les scènes présentes ; il ne crée pas de nouveaux maillages. Les accessoires complexes et leurs interactions ne sont pas un système complet validé.

À faire : bibliothèque de props, rattachements aux os, clés d’activation, collisions de mise en scène, génération de placement contrainte et mesure des coûts graphiques.

Preuve : `src/stage.js ; src/autoshow-core.js ; Director`.

### A35 — Persistance après fermeture et installation hors ligne

**P1 · Production · Toujours non validé après fermeture**

Les essais graphiques utilisent un document d’origine opaque : stockage TEMPORAIRE. La navigation du navigateur vers le serveur est bloquée par l’infrastructure de cette session.

Diagnostic quota/protection, demande explicite persist(), refus géré. Lecture opaque TEMPORAIRE : persistance après fermeture et installation hors ligne non vérifiées. Lanceur testé séparément.

Preuve : `src/reliability.js ; qa/v24 ; tests/launcher_test.py`.

### A36 — Safari/iPhone et contrôleurs physiques

**P1 · Production · Non exécuté**

Les contrôles clavier/manette/MIDI automatisés ne mesurent pas un contrôleur physique, la latence réelle Bluetooth ni Safari/iOS.

À faire : matrice d’appareils, latence audio/entrée/affichage, multitouch, déconnexion/reconnexion, suspension de l’onglet et reprise, clavier international.

Preuve : `Rapports Playwright et limitations de cette livraison`.

### A37 — Conflits entre plusieurs fenêtres

**P1 · Sauvegarde · Avancé, coordination native à valider**

Le changement de version IndexedDB est géré, mais aucun protocole général de résolution des éditions concurrentes par deux fenêtres de même version n’est présent.

Réservation exclusive Web Locks lorsqu’IndexedDB est actif, seconde fenêtre en lecture/export uniquement, refus des mutations, libération à la sortie. Test de deux contextes JS à gestionnaire de verrous simulé et test UI du refus. Anciennes versions exclues. Navigation navigateur de test bloquée : vraie coordination IndexedDB de plusieurs fenêtres non exécutée.

Preuve : `src/services.js ; src/reliability.js ; tests/v24.test.cjs ; tests/v24_browser_test.py`.

### A38 — Accumulation des extensions historiques

**P2 · Architecture · Ouvert**

Le build fonctionne sans dépendance, mais plusieurs extensions remplacent ou enveloppent les méthodes de l’application. Certaines sources sont très compactes et difficiles à relire.

À faire progressivement : API de services explicites, modules métier, formatage des sources, tests d’intégration contractuels. Garder le HTML autonome comme sortie, pas comme source de développement.

Preuve : `build.py ; src/enhancements.js ; src/v7-app.js ; src/v9-app.js ; src/v10-app.js`.

### A39 — Personnages et PV finalisés

**P2 · Direction artistique · Ouvert**

Les silhouettes procédurales et modèles de diagnostic ne constituent pas des personnages Vocaloid détaillés. Les chansons, costumes et chorégraphies officiels ne sont pas inclus.

À faire : pipeline d’assets finaux fournis avec leur provenance, galerie et contrôle de compatibilité, presets artistiques et cohérence de scène ; ne pas assimiler une fixture technique à un personnage final.

Preuve : `examples/ ; personnages procéduraux de src/stage.js`.

### A40 — Dépôts Google Drive et absence de synchronisation du jeu

**P2 · Livraison et cloud · Dépôt V27 consigné dans le reçu séparé**

Le dossier dédié a été relu ; le connecteur expose maintenant uniquement des actions de lecture. Aucune création de dossier ou téléversement V23 n’a pu être exécuté. Le jeu ne synchronise pas automatiquement sa bibliothèque avec Drive.

Livrables locaux vérifiés ; le résultat du dépôt Google Drive doit être confirmé par les retours du connecteur et un reçu séparé. Pas de synchronisation des sauvegardes du navigateur.

Preuve : `DIVA_PULSE_V26_DEPOT_DRIVE.json (produit seulement après les retours du connecteur)`.

### V24-01 — Rejets non interceptés sur certains réglages et remappages clavier

**Priorité non précisée · Sauvegarde · Corrigé, tests de refus**

Gestion explicite des promesses rejetées, formulaire disponible et retour à la valeur confirmée lorsque le stockage refuse une écriture.

Preuve : `src/app.js ; src/enhancements.js ; tests/v24_browser_test.py`.

### V24-02 — Le diagnostic quota/protection ne doit pas bloquer le jeu

**Priorité non précisée · Démarrage · Corrigé, diagnostic dégradé**

API estimate()/persisted() capturées séparément ; informations partielles et erreur lisible si le navigateur refuse.

Preuve : `src/reliability.js ; tests/v24_browser_test.py`.

### V24-03 — Étiquette de version du lanceur restée à V23

**Priorité non précisée · Livraison · Corrigé et testé**

Lire VERSION.txt au démarrage plutôt que dupliquer une constante. Reprise des dix contrôles HTTP après correction.

Preuve : `lancer.py ; qa/v24/launcher-results.json`.

### V25-01 — Priorité des expressions VMD même à zéro

**Priorité non précisée · Animation · Ajouté et testé**

La présence d’une piste faciale, d’un groupe de morphs ou d’une motion sortante protège la bouche. Le remplacement demande de décocher volontairement la protection.

Preuve : `tests/v25.test.cjs ; qa/v25/features/browser-final.json`.

### V25-02 — Voix guide et expression enregistrées ensemble

**Priorité non précisée · Sauvegarde · Ajouté et testé**

Validation avant transaction, scène source préservée si écriture refusée, ressource incluse dans les deux formats portables et remappée en restauration.

Preuve : `src/director-core.js ; src/v25-app.js ; qa/v25/features/browser-final.json`.

### V25-03 — Archive binaire vérifiée avant confirmation

**Priorité non précisée · Intégrité · Ajouté et testé**

Empreintes de manifeste et blocs, tailles exactes, refus de corruption, troncature, données finales supplémentaires et descripteurs mal formés. Aucun contenu exécuté.

Preuve : `src/bundle-core.js ; tests/v25.test.cjs ; qa/v25/features/browser-final.json`.

### V25-04 — Le mix instrumental peut ouvrir la bouche

**Priorité non précisée · Animation · Ajouté, portée limitée**

Option d’import désactivée par défaut, avertissement explicite et voix isolée optionnelle. Ne pas présenter l’énergie comme reconnaissance du chant. Signal DC/silence à zéro et canaux séparés.

Preuve : `src/face-core.js ; README_V25.md`.

### V25-05 — Clés manuelles non enregistrées à la fermeture du panneau

**Priorité non précisée · Interface · Avancé, récupération locale et portable; durabilité native non validée**

Un brouillon facial validé est conservé séparément, avec sa nouvelle voix guide. À la réouverture, reprise explicite ou abandon sans changer la scène. Une publication atomique du visage marque la récupération traitée. Les deux formats de sauvegarde transportent les derniers brouillons et voix guides, même si toutes les écritures sont refusées ; restauration remappée en copies.

Preuve : `src/face-drafts.js ; src/v26-app.js ; src/v25-app.js ; src/enhancements.js ; qa/v26/features/browser-final.json`.

### V26-01 — Une ressemblance acoustique ne doit pas remplacer une identité binaire

**P1 · Intégrité des partitions · Ajouté et testé**

Scores clairement non probabilistes, aucun niveau précoché, confirmation du timing obligatoire, variantes ajoutées sans écraser les cinq niveaux courants, limite de durée/offset et provenance identityVerified:false. Échec d’écriture atomique sans insertion partielle.

Preuve : `src/audio-match.js ; src/v26-app.js ; tests/v26.test.cjs ; qa/v26/features/browser-final.json`.

### V26-02 — La nouvelle voix guide refusée devait rester dans l’export de secours

**P1 · Sauvegarde · Corrigé et testé**

Une ressource de voix refusée est gardée avec le dernier brouillon en mémoire. L’export l’inclut sans demander de nouvelles écritures. La restauration réassocie propriétaire et guide avant de proposer une récupération explicite. Un propriétaire ou guide absent est refusé.

Preuve : `src/enhancements.js ; src/face-drafts.js ; src/v26-app.js ; qa/v26/features/browser-final.json`.

### V26-03 — Les longues actions du panneau acoustique débordaient en portrait

**P2 · Interface · Corrigé et testé**

Largeur du contenu de modale bornée, retours à la ligne des actions et sélecteurs en lignes lisibles. Contrôle de scrollWidth/clientWidth et capture à 390×844, après correction d’un débordement détecté visuellement.

Preuve : `src/v26.css ; qa/v26/features/02-mobile-candidates.png ; qa/v26/features/browser-final.json`.

### V27-01 — Tables physiques ignorées après les morphs

**P1 · Import MMD · Ajouté et testé**

Aucun corps physique ni joint exploitable ne parvenait au runtime V26.

Lecteurs PMX/PMD bornés ; positions PMD relatives aux os ; conversion de repère ; index, dimensions, masses, tables et valeurs non finies validés ; données non simulées signalées.

Preuve : `src/physics-data.js ; src/mmd-core.js ; tests/v27.test.cjs`.

### V27-02 — Chaînes dynamiques absentes du rendu

**P1 · Dynamique · Ajouté, expérimental**

Solveur positionnel à pas fixe ; mondes indépendants par modèle, gravité, joints, collisions locales approchées. Influence réglable. Limites 128 corps / 256 joints, masses angulaires scalaires, corps dynamiques sphérisés ; pas Bullet.

Preuve : `src/secondary-physics.js ; src/stage.js ; qa/v27/benchmark-final.json ; qa/v27/features/browser-final.json`.

### V27-03 — Aucun aperçu non destructif des réglages physiques

**P1 · Sauvegarde et aperçu · Ajouté et testé**

Panneau opt-in par morceau, curseur/lecture/pause silencieuse, annulation, export de diagnostic. Enregistrement après succès du stockage seulement ; réglages et octets du modèle conservés en .pulsebundle et restaurés en copies. Pas d’autosave du formulaire de physique.

Preuve : `src/v27-app.js ; qa/v27/features/browser-final.json`.

### V27-04 — Affichage mobile, fenêtre basse et danseur masqué

**P2 · Non-régression et interface · Corrigé et testé**

Largeur du dialogue et retours à la ligne bornés. Rétablissement de l’évaluation animée des modèles masqués, mais sans y conserver de simulation physique inutile. Le bouton Autoplay était couvert par le pied de page à 800×520 après un PV ; le décalage relatif a été supprimé et le pied de page réintégré au flux dans ce cas.

Preuve : `src/v27.css ; src/stage.js ; qa/v27/features/02-mobile-physics.png ; qa/v27/regression-v20/browser-final.json`.

### V27-05 — Images lentes réinitialisant fréquemment la dynamique

**P1 · Performance et validation · Limite observée, à contrôler sur matériel réel**

Le budget conserve un reset au-delà de 133 ms afin de ne pas rattraper sans borne. Une grande fenêtre SwiftShader a produit de nombreuses remises à zéro. Le benchmark Node synthétique et une petite fenêtre de rendu ne garantissent pas le temps réel sur appareils réels. Réduire la charge, désactiver la dynamique ou privilégier le rythme.

Preuve : `qa/v27/playback-large-viewport.txt ; qa/v27/playback/debug-game.json ; qa/v27/benchmark-final.json`.

## Hors de cette validation

Pas de corpus représentatif de personnages MMD, de vêtements complexes, de corps souples ou de contacts rapides certifiés. Pas de GPU physique, Safari/iPhone, périphérique MIDI/manette réel, test de fermeture/reprise IndexedDB ou installation hors ligne complète. La physique reste une approximation indépendante, pas Bullet.
