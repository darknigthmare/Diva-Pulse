# DIVA PULSE V26 — Audit actualisé

**51 constats suivis**, dont les 48 précédents. Version 26.0.0, base V25 contrôlée.

Comparaison acoustique locale de versions réencodées, copie volontaire en variantes avec offset accepté, récupération séparée des brouillons faciaux et guides refusés, archives portables remappées, interface mobile. Le runtime physique, le catalogue en ligne et le moteur musical ne sont pas remplacés. Pas de compatibilité universelle ni de persistance native certifiée.

Les états distinguent les fonctions implémentées, les preuves exécutées et les validations encore manquantes. Les versions historiques et leurs rapports restent conservés. Un test automatisé ne certifie ni un résultat musical humain, ni tous les packs MMD, ni un appareil physique.

## Avancées de cette passe

Reconnaissance locale en candidats pour les audios réencodés ; aucune fusion automatique. Récupération explicite des brouillons faciaux et de leurs voix guides, même après refus d’écriture. Archives remappées, préférence désactivable et panneau mobile corrigé. Aucun moteur Bullet livré.

## Registre complet

### A01 — L’export dépendait des écritures
**Domaine :** Sauvegarde · **État :** Corrigé et testé

Le chemin exportBackup enregistrait de nouveau les morceaux avant de lire la bibliothèque. Une écriture refusée pouvait donc empêcher une sauvegarde de secours.

Export en lecture seule. La partition sale du studio est incluse comme brouillon distinct, pas publiée sur la source. Le test refuse toutes les nouvelles écritures et obtient quand même le fichier de sauvegarde.
 
**Preuves :** `src/enhancements.js: exportBackup ; tests/v23_browser_test.py ; qa/v23/integration/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A02 — Transactions mémoire partiellement validées
**Domaine :** Sauvegarde · **État :** Corrigé et testé

Le mode temporaire devait valider et cloner toutes les lignes avant la première modification, comme une transaction complète.

Prévalidation des collections, identifiants et objets clonables. Échec sur la deuxième ligne : aucune première ligne ajoutée. Les valeurs sont des instantanés indépendants.
 
**Preuves :** `src/services.js: Store.atomic ; tests/v23.test.cjs`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A03 — Stockage fermé pris pour un stockage vide
**Domaine :** Sauvegarde · **État :** Corrigé et testé

Une connexion invalidée ne doit pas provoquer un retour silencieux à une nouvelle mémoire vide, ni afficher une réussite de sauvegarde.

État invalidated explicite ; toutes les lectures et mutations le refusent. Badge STOCKAGE FERMÉ, message de rechargement et pause de la partie. Gestion des événements de fermeture et de changement de version.
 
**Preuves :** `src/services.js: Store.invalidate/guard/open ; src/quality.js: install ; tests/v23.test.cjs`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A04 — Réglages affichés avant confirmation du stockage
**Domaine :** Sauvegarde · **État :** Corrigé et testé

L’objet de préférences pouvait conserver un changement alors que la transaction avait été annulée.

Instantané de la dernière écriture confirmée et remise en état sur abort. Une réussite n’est publiée qu’à la fin de la transaction. Une exception d’observateur ne transforme pas un commit réussi en échec.
 
**Preuves :** `src/services.js: Store.atomic/committed ; src/quality.js ; test navigateur avec transaction annulée`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A05 — Métadonnées et favoris non conservés après échec
**Domaine :** Bibliothèque · **État :** Corrigé et testé

Modifier un titre ou un favori pouvait laisser l’interface en désaccord avec les données réellement enregistrées.

Candidat enregistré avant publication ; rollback du favori. Une sauvegarde de métadonnées refusée conserve la source et le champ saisi pour réessayer.
 
**Preuves :** `src/quality.js: saveSong ; src/enhancements.js: songManager ; qa/v23/integration/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A06 — Setlist fantôme après refus de sauvegarde
**Domaine :** Bibliothèque · **État :** Corrigé et testé

Le tableau des concerts pouvait être modifié avant la validation de son enregistrement ou de sa suppression.

Copie candidate puis publication après succès. La file de morceaux reste disponible après un échec. Tests d’ajout, de nouvelle tentative et de suppression refusée.
 
**Preuves :** `src/enhancements.js: setlistDialog ; tests/v23_browser_test.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A07 — Propriétaire d’une sauvegarde et remplacement GLB
**Domaine :** Sauvegarde · **État :** Avancé, validation partielle

Un changement de morceau pendant une écriture ne doit pas restaurer le mauvais objet. Un GLB prévisualisé mais non enregistré ne doit pas rester à la place de la scène sauvegardée.

Sauvegarde attachée au propriétaire et à un numéro de requête ; retour à la scène enregistrée en cas d’import GLB échoué. Revue et non-régression effectuées ; le scénario GLB de panne graphique pendant l’écriture n’a pas son propre test navigateur exhaustif dans cette passe.
 
**Preuves :** `src/quality.js: saveSong/importModel ; src/app.js: clearModel/modelClip`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A08 — Brouillon perdu en fermant le panneau
**Domaine :** Director · **État :** Corrigé et testé

Les modifications non appliquées du Director dépendaient de la seule session du panneau.

Brouillon séparé par morceau, file d’écriture et récupération explicite à la réouverture. La récupération reste annulable. Source manuelle inchangée avant Enregistrer.
 
**Preuves :** `src/director-app.js: directorRecoveries/directorDraftWrite ; navigateur : fermeture, réouverture, undo/redo`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A09 — Brouillon refusé absent de la sauvegarde portable
**Domaine :** Director · **État :** Corrigé et testé

Une dernière modification pouvait ne subsister qu’en mémoire après un quota refusé ; les anciens exports ne transportaient pas cet état Director.

Conservation en mémoire avec statut d’échec, fusion de l’état le plus récent dans directorDrafts du pulsepack, références médias et propriétaire remappés à la restauration. Rechargement des deux personnages restaurés.
 
**Preuves :** `src/enhancements.js: exportBackup/restoreBackup ; qa/v23/integration/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A10 — Perte du contexte graphique pendant un PV
**Domaine :** Rendu · **État :** Corrigé et testé

Les ressources GPU étaient invalides après une perte de contexte ; une simple nouvelle image ne suffisait pas à rétablir le spectacle.

Détection de la perte, arrêt de l’horloge audio, reconstruction des programmes et buffers, rechargement des personnages. La partie reste en pause jusqu’à l’action du joueur. Test réel WEBGL_lose_context, pas seulement un événement DOM fabriqué.
 
**Preuves :** `src/stage.js ; src/quality.js: onRestored/onError ; qa/v23/integration/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A11 — Échec de création du shader bloquant le démarrage
**Domaine :** Rendu · **État :** Corrigé et testé

Une compilation de shader refusée pouvait remonter hors du chemin de repli 2D.

Initialisation capturée, diagnostic initError, renderer indisponible et repli annoncé. Test de compilation volontairement refusée.
 
**Preuves :** `src/stage.js: constructor ; tests/v23.test.cjs`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A12 — Palette d’os répétée par matériau
**Domaine :** Performances · **État :** Corrigé et testé; allocations de morphs améliorées

Les données du squelette étaient préparées et envoyées pour chaque matériau, malgré un modèle et une pose identiques.

Palette partagée par les matériaux et réutilisation de son tableau en mémoire ; un envoi par modèle et par image. Deux matériaux contrôlés dans le vrai renderer.
 
**Preuves :** `src/stage.js: skin/paletteUploads ; qa/v23/integration/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A13 — SDEF lu puis remplacé par une déformation linéaire
**Domaine :** MMD · **État :** Avancé et testé

Les centres C/R0/R1 étaient sautés par le parseur. Le rendu ne pouvait donc pas calculer le SDEF prévu par le fichier.

Conservation, conversion de coordonnées et validation des centres ; calcul sphérique spécifique CPU/GLSL. Équation vérifiée contre une forme développée indépendante et sortie GPU comparée. Support de transformations rigides, pas certification de tout squelette complexe.
 
**Preuves :** `src/mmd-core.js ; src/mmd-compat.js ; src/skinning.js ; tests/v23_gpu_probe.js`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A14 — QDEF traité comme BDEF
**Domaine :** MMD · **État :** Avancé et testé

Le type QDEF n’avait pas son chemin de déformation par quaternions duaux normalisés.

Chemin QDEF à quatre influences, correction du signe des quaternions, normalisation, translation et normales. Tests des torsions, des poids extrêmes et du résultat GPU. Les héritages d’os, échelles non rigides et la physique restent distincts.
 
**Preuves :** `src/skinning.js ; tests/v23.test.cjs ; qa/v23/integration/gpu-feedback.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A15 — Sphere map calculée dans le mauvais repère
**Domaine :** MMD · **État :** Corrigé, contrôle structurel

La normale utilisée pour la sphere map devait suivre le repère de la caméra, pas uniquement le repère du monde.

Normale transformée par la vue. Shader compilé et parcours MMD rejoués. La comparaison pixel à pixel de matériaux complexes avec MMD Desktop n’est pas faite.
 
**Preuves :** `src/stage.js: uView et normale sphere map ; test natif WebGL`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A16 — Génération ralentie par des rescans globaux
**Domaine :** AutoMap · **État :** Corrigé et testé

À chaque candidat d’accord, l’algorithme reconstruisait et triait les notes de toute la difficulté pour vérifier une densité locale.

Listes par difficulté maintenues en ordre et contrôle limité aux fenêtres de quatre secondes que le candidat peut modifier. Comparaison stricte des notes avec le moteur V22 conservé comme oracle.
 
**Preuves :** `src/automap-core.js ; tests/reference/automap-v22-baseline.js ; tests/v23-automap.test.cjs`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A17 — Préférences restaurées hors limites
**Domaine :** Validation · **État :** Corrigé et testé

Des valeurs nulles, booléennes, infinies, hors plage, ou des mappings de touches en doublon pouvaient produire des réglages incohérents.

Contrats numériques et de types, mappings uniques, profils de jugement connus. Récupération avec avertissement au démarrage ; restauration explicitement refusée et atomique pour les préférences invalides.
 
**Preuves :** `src/quality.js: preferences ; src/enhancements.js: restoreBackup ; tests/v23.test.cjs`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A18 — Director mal formé accepté partiellement
**Domaine :** Validation · **État :** Corrigé et testé

Des structures inattendues de slots/clips ou des clés de formation dupliquées pouvaient être normalisées de façon ambiguë.

Limites et types contrôlés, invalides refusés avant remplacement. Les sources ne sont pas modifiées lors du refus.
 
**Preuves :** `src/director-core.js: normalizeDirector ; tests/v23.test.cjs`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A19 — Réglages devenus trop longs à parcourir
**Domaine :** Interface · **État :** Amélioré et testé

L’empilement des systèmes rendait l’accès à Audio, AutoMap ou aux sauvegardes peu direct.

Six raccourcis vers les rubriques réelles, panneaux homogènes et lignes de diagnostic repliables. Capture mobile du Director et contrôle des dimensions.
 
**Preuves :** `src/quality.js ; src/style.css ; qa/v23/integration/03-mobile-recovery.png`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A20 — Aucun état global exploitable de la bibliothèque
**Domaine :** Diagnostic · **État :** Ajouté et testé

Les contrôles MMD à l’import ne signalaient pas ensemble les niveaux manquants, médias absents et spectacles invalides de la bibliothèque courante.

Diagnostic non destructif de bibliothèque conservé. Il signale aussi les descripteurs acoustiques invalides et indique que les copies acoustiques ne sont pas des identités vérifiées.
 
**Preuves :** `src/quality.js ; tests/v26.test.cjs ; tests/v26_regression_v23_browser.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A21 — Physique Bullet, articulations et corps souples
**Domaine :** MMD · **État :** Ouvert

Le pipeline V23 ne simule pas exhaustivement les corps rigides, contraintes et tissus d’un pack PMX. Les options anciennes ne sont pas une preuve d’intégration Bullet.

Physique Bullet, joints et corps souples toujours absents. Une tentative de récupération de la dépendance a échoué dans cette session ; aucun faux moteur, binaire incomplet ou CDN n’est intégré. Les tests existants ne deviennent pas des preuves de physique.
 
**Preuves :** `src/mmd-core.js ; src/stage.js ; diagnostic PulseQuality.limitations`

Aucune nouvelle simulation physique livrée ou certifiée.

### A22 — Héritages de transformations et contraintes IK complètes
**Domaine :** MMD · **État :** Avancé, compatibilité partielle

Le solveur présent ne couvre pas tous les grants/append transforms, axes locaux et limites IK attendus par les modèles avancés.

Héritages standards non locaux de rotation et translation, ratios et chaînes, cycles refusés, projection XYZ des limites IK dans le bon repère, plafond de 32 itérations. Les héritages locaux/monde, axes, interactions après IK et physique restent ouverts.
 
**Preuves :** `src/skeleton.js ; src/stage.js ; src/mmd-core.js ; tests/v24.test.cjs ; tests/v24_browser_test.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A23 — Matériaux et effets MME exhaustifs
**Domaine :** MMD · **État :** Ouvert

Les morphs UV0/couleur/opacité et sphere maps existent, mais le rendu complet des UV additionnels, contours, toon, spéculaire et effets MME n’est pas équivalent à MMD Desktop.

À faire : matrice de compatibilité des matériaux, images de référence par fonction, règles de transparence, rendu des contours et effets explicitement supportés. Garder un avertissement sur les fonctions ignorées.
 
**Preuves :** `src/mmd-surface.js ; src/stage.js ; src/mmd-audit.js`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A24 — Collection représentative de modèles téléchargés
**Domaine :** Compatibilité · **État :** Non validé

Les tests présents utilisent surtout des diagnostics originaux. Leur passage ne certifie pas un personnage quelconque avec des centaines de textures et contraintes.

À faire : corpus avec autorisation de test, provenance et licences consignées ; PMD/PMX, morphs, textures japonaises, os complexes et plusieurs tailles ; grille rendu/animation/physique indépendante.
 
**Preuves :** `examples/v19, v21, v22, v23 ; rapports navigateur`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A25 — BPM d’un VMD automatiquement détecté
**Domaine :** Animation · **État :** Avancé, proposition à valider

Le calage musical demande toujours un BPM source et un premier temps fournis. La durée d’un VMD ne suffit pas à déterminer sa pulsation.

Recherche bornée de cycles de pose VMD, stabilité sur deux moitiés, plusieurs interprétations BPM. Sélection explicite puis sauvegarde ; aucune phase certaine ni application automatique. VMD statiques et sans cycle refusés comme source de BPM.
 
**Preuves :** `src/motion-analysis.js ; src/reliability.js ; tests/v24_browser_test.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A26 — Retargeting universel et appuis des pieds
**Domaine :** Animation · **État :** Ouvert

La correspondance de noms d’os ne corrige ni les proportions, ni les poses de repos, ni les pénétrations. La danse procédurale MMD reste surtout sur le haut du corps reconnu.

À faire : mapping éditable, pose de repos, correction des axes/proportions, contacts des pieds, root motion et limites articulaires ; conserver la pose plutôt qu’un retargeting aveugle.
 
**Preuves :** `src/stage.js: mouvements procéduraux et VMD ; diagnostic MMD`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A27 — Visèmes et synchronisation labiale depuis la chanson
**Domaine :** Animation · **État :** Avancé, enveloppe audio et édition manuelle; visèmes ouverts

Les morphs faciaux VMD sont lus ; le moteur ne déduit pas des paroles et visèmes fiables depuis un mix musical.

À faire : piste faciale séparée, import de repères phonétiques ou pipeline d’analyse explicite, réglage des visèmes par modèle et possibilité de correction manuelle.
 
**Preuves :** `src/mmd-surface.js ; src/autoshow-core.js`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A28 — Qualité des patterns sur de vraies chansons
**Domaine :** AutoMap · **État :** Avancé, corpus synthétique seulement

Les contraintes d’héritage, de cadence et de quantification sont testées. Les sections et attaques restent des heuristiques ; elles ne garantissent pas une partition agréable sur chaque genre.

Cinq WAV originaux annotés (binaire, ternaire, swing, changement de tempo, silence), analyse PCM réelle et contrôle des cinq difficultés. Rappel/précision mesurés. Pas de corpus de chansons mixées ni d’évaluation humaine ; moteur générateur V23 conservé.
 
**Preuves :** `tests/v24-audio-corpus.cjs ; examples/v24/audio-corpus ; qa/v24/audio-corpus.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A29 — Reconnaissance d’un audio réencodé
**Domaine :** AutoMap · **État :** Avancé, candidats acoustiques locaux; validation en corpus réel ouverte

L’empreinte exacte identifie un même fichier, pas deux encodages d’un enregistrement ni une version concert/remix.

Index spectral/énergie du PCM, propositions après import réencodé, offset ±2 s estimé par pas de 50 ms, contrôle en quatre portions. La copie demande sélection, écoute et confirmation ; nouveaux identifiants et provenance non vérifiée, sans écraser aucune source. Les WAV/MP3 du diagnostic sont reconnus, une autre composition de même BPM est refusée. Aucune preuve d’identité universelle ou recherche en ligne.
 
**Preuves :** `src/audio-match.js ; src/v26-app.js ; tests/v26.test.cjs ; qa/v26/acoustic-fixtures-results.json ; qa/v26/features/browser-final.json`

Réencodage MP3 réel, gain, polarité, stéréo opposée, décalage ±0,5 s, différence de composition, silence, limites, refus d’écriture et opt-out testés. Pas de mesure de précision/rappel sur une discothèque représentative.

### A30 — Recherche de partitions existantes en ligne
**Domaine :** Catalogue · **État :** Ouvert

Le catalogue de charts demeure local, alimenté par les imports. L’absence de niveau local déclenche AutoMap, pas une recherche mondiale.

À faire : connecteur de catalogue autorisé, provenance/version de chaque niveau, association de l’audio vérifiable, cache et décision de l’utilisateur avant une source incertaine.
 
**Preuves :** `src/automap-app.js ; catalogue .pulsecharts`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A31 — Très gros médias et sauvegardes volumineuses
**Domaine :** Performances · **État :** Avancé, format binaire et banc synthétique; plafond réel à valider

Le décodage audio, certains tableaux et les sauvegardes JSON/base64 occupent la mémoire. L’optimisation V23 concerne la génération, pas un décodage audio ou un export totalement en streaming.

À faire : budgets mémoire par plateforme, estimation avant import, annulation à chaque phase lourde, format de sauvegarde binaire/streaming, stress tests sur grandes bibliothèques.
 
**Preuves :** `src/services.js ; src/enhancements.js: blobToBase64/exportBackup ; src/automap-app.js`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A32 — Fidélité 1:1 aux règles Project DIVA
**Domaine :** Gameplay · **État :** Non certifié

Les profils de jugement, trajectoires et bonus actuels sont ceux de DIVA PULSE. Aucun banc de comparaison exhaustive par édition SEGA n’a été exécuté.

À faire : choisir une édition de référence, spécifier chaque type de note/bonus, fixtures d’entrée et score attendu, tests simultanés/maintien/chaînes ; séparer les records par règleset.
 
**Preuves :** `src/core.js ; src/app.js ; profils Standard/Accessible/Précision`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A33 — Outils de montage avancés
**Domaine :** Director · **État :** Avancé, piste faciale éditable; montage complet ouvert

Les clips, fondus, formations, caméras et lumières sont éditables ; l’éditeur ne dispose pas encore d’une ergonomie complète de logiciel de montage avec toutes les courbes, multi-sélections et raccourcis.

À faire : sélection multiple de clés, copier/coller entre pistes, tangentes visuelles, accrochage aux mesures, navigation clavier, prévisualisation sonore synchronisée et mixage de root motion.
 
**Preuves :** `src/director-app.js ; src/director-core.js ; captures de l’interface`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A34 — Accessoires et nouvelles scènes générées
**Domaine :** Director · **État :** Ouvert

Auto Show assemble les scènes présentes ; il ne crée pas de nouveaux maillages. Les accessoires complexes et leurs interactions ne sont pas un système complet validé.

À faire : bibliothèque de props, rattachements aux os, clés d’activation, collisions de mise en scène, génération de placement contrainte et mesure des coûts graphiques.
 
**Preuves :** `src/stage.js ; src/autoshow-core.js ; Director`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A35 — Persistance après fermeture et installation hors ligne
**Domaine :** Production · **État :** Toujours non validé après fermeture

Les essais graphiques utilisent un document d’origine opaque : stockage TEMPORAIRE. La navigation du navigateur vers le serveur est bloquée par l’infrastructure de cette session.

Diagnostic quota/protection, demande explicite persist(), refus géré. Lecture opaque TEMPORAIRE : persistance après fermeture et installation hors ligne non vérifiées. Lanceur testé séparément.
 
**Preuves :** `src/reliability.js ; qa/v24 ; tests/launcher_test.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A36 — Safari/iPhone et contrôleurs physiques
**Domaine :** Production · **État :** Non exécuté

Les contrôles clavier/manette/MIDI automatisés ne mesurent pas un contrôleur physique, la latence réelle Bluetooth ni Safari/iOS.

À faire : matrice d’appareils, latence audio/entrée/affichage, multitouch, déconnexion/reconnexion, suspension de l’onglet et reprise, clavier international.
 
**Preuves :** `Rapports Playwright et limitations de cette livraison`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A37 — Conflits entre plusieurs fenêtres
**Domaine :** Sauvegarde · **État :** Avancé, coordination native à valider

Le changement de version IndexedDB est géré, mais aucun protocole général de résolution des éditions concurrentes par deux fenêtres de même version n’est présent.

Réservation exclusive Web Locks lorsqu’IndexedDB est actif, seconde fenêtre en lecture/export uniquement, refus des mutations, libération à la sortie. Test de deux contextes JS à gestionnaire de verrous simulé et test UI du refus. Anciennes versions exclues. Navigation navigateur de test bloquée : vraie coordination IndexedDB de plusieurs fenêtres non exécutée.
 
**Preuves :** `src/services.js ; src/reliability.js ; tests/v24.test.cjs ; tests/v24_browser_test.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A38 — Accumulation des extensions historiques
**Domaine :** Architecture · **État :** Ouvert

Le build fonctionne sans dépendance, mais plusieurs extensions remplacent ou enveloppent les méthodes de l’application. Certaines sources sont très compactes et difficiles à relire.

À faire progressivement : API de services explicites, modules métier, formatage des sources, tests d’intégration contractuels. Garder le HTML autonome comme sortie, pas comme source de développement.
 
**Preuves :** `build.py ; src/enhancements.js ; src/v7-app.js ; src/v9-app.js ; src/v10-app.js`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A39 — Personnages et PV finalisés
**Domaine :** Direction artistique · **État :** Ouvert

Les silhouettes procédurales et modèles de diagnostic ne constituent pas des personnages Vocaloid détaillés. Les chansons, costumes et chorégraphies officiels ne sont pas inclus.

À faire : pipeline d’assets finaux fournis avec leur provenance, galerie et contrôle de compatibilité, presets artistiques et cohérence de scène ; ne pas assimiler une fixture technique à un personnage final.
 
**Preuves :** `examples/ ; personnages procéduraux de src/stage.js`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### A40 — Dépôts Google Drive et absence de synchronisation du jeu
**Domaine :** Livraison et cloud · **État :** Dépôt V26 à vérifier par reçu séparé

Le dossier dédié a été relu ; le connecteur expose maintenant uniquement des actions de lecture. Aucune création de dossier ou téléversement V23 n’a pu être exécuté. Le jeu ne synchronise pas automatiquement sa bibliothèque avec Drive.

Créer un dossier V26 distinct dans le dossier Drive existant, conserver les versions précédentes, envoyer les livrables et relire noms/tailles. La présence dans Drive ne synchronise pas le jeu et ne le publie pas. Voir reçu de dépôt pour les résultats réels, pas cette intention.
 
**Preuves :** `DIVA_PULSE_V26_DEPOT_DRIVE.json (produit seulement après les retours du connecteur)`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V24-01 — Rejets non interceptés sur certains réglages et remappages clavier
**Domaine :** Sauvegarde · **État :** Corrigé, tests de refus

Gestion explicite des promesses rejetées, formulaire disponible et retour à la valeur confirmée lorsque le stockage refuse une écriture.
 
**Preuves :** `src/app.js ; src/enhancements.js ; tests/v24_browser_test.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V24-02 — Le diagnostic quota/protection ne doit pas bloquer le jeu
**Domaine :** Démarrage · **État :** Corrigé, diagnostic dégradé

API estimate()/persisted() capturées séparément ; informations partielles et erreur lisible si le navigateur refuse.
 
**Preuves :** `src/reliability.js ; tests/v24_browser_test.py`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V24-03 — Étiquette de version du lanceur restée à V23
**Domaine :** Livraison · **État :** Corrigé et testé

Lire VERSION.txt au démarrage plutôt que dupliquer une constante. Reprise des dix contrôles HTTP après correction.
 
**Preuves :** `lancer.py ; qa/v24/launcher-results.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V25-01 — Priorité des expressions VMD même à zéro
**Domaine :** Animation · **État :** Ajouté et testé

La présence d’une piste faciale, d’un groupe de morphs ou d’une motion sortante protège la bouche. Le remplacement demande de décocher volontairement la protection.
 
**Preuves :** `tests/v25.test.cjs ; qa/v25/features/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V25-02 — Voix guide et expression enregistrées ensemble
**Domaine :** Sauvegarde · **État :** Ajouté et testé

Validation avant transaction, scène source préservée si écriture refusée, ressource incluse dans les deux formats portables et remappée en restauration.
 
**Preuves :** `src/director-core.js ; src/v25-app.js ; qa/v25/features/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V25-03 — Archive binaire vérifiée avant confirmation
**Domaine :** Intégrité · **État :** Ajouté et testé

Empreintes de manifeste et blocs, tailles exactes, refus de corruption, troncature, données finales supplémentaires et descripteurs mal formés. Aucun contenu exécuté.
 
**Preuves :** `src/bundle-core.js ; tests/v25.test.cjs ; qa/v25/features/browser-final.json`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V25-04 — Le mix instrumental peut ouvrir la bouche
**Domaine :** Animation · **État :** Ajouté, portée limitée

Option d’import désactivée par défaut, avertissement explicite et voix isolée optionnelle. Ne pas présenter l’énergie comme reconnaissance du chant. Signal DC/silence à zéro et canaux séparés.
 
**Preuves :** `src/face-core.js ; README_V25.md`

Preuves historiques conservées. RAPPORT_V26.md indique les suites réexécutées sur le HTML V26 ; les anciens résultats ne constituent pas de nouveaux tests.

### V25-05 — Clés manuelles non enregistrées à la fermeture du panneau
**Domaine :** Interface · **État :** Avancé, récupération locale et portable; durabilité native non validée

Un brouillon facial validé est conservé séparément, avec sa nouvelle voix guide. À la réouverture, reprise explicite ou abandon sans changer la scène. Une publication atomique du visage marque la récupération traitée. Les deux formats de sauvegarde transportent les derniers brouillons et voix guides, même si toutes les écritures sont refusées ; restauration remappée en copies.
 
**Preuves :** `src/face-drafts.js ; src/v26-app.js ; src/v25-app.js ; src/enhancements.js ; qa/v26/features/browser-final.json`

Fermeture/réouverture du panneau, reprise volontaire, refus d’écriture, guide uniquement en mémoire, export binaire de secours, restauration, publication et abandon contrôlés. Le document est TEMPORAIRE, donc pas de test après fermeture réelle du navigateur.

### V26-01 — Une ressemblance acoustique ne doit pas remplacer une identité binaire
**Domaine :** Intégrité des partitions · **État :** Ajouté et testé

Scores clairement non probabilistes, aucun niveau précoché, confirmation du timing obligatoire, variantes ajoutées sans écraser les cinq niveaux courants, limite de durée/offset et provenance identityVerified:false. Échec d’écriture atomique sans insertion partielle.
 
**Preuves :** `src/audio-match.js ; src/v26-app.js ; tests/v26.test.cjs ; qa/v26/features/browser-final.json`

Contrôle ajouté dans la passe V26 ; voir les preuves ci-dessus.

### V26-02 — La nouvelle voix guide refusée devait rester dans l’export de secours
**Domaine :** Sauvegarde · **État :** Corrigé et testé

Une ressource de voix refusée est gardée avec le dernier brouillon en mémoire. L’export l’inclut sans demander de nouvelles écritures. La restauration réassocie propriétaire et guide avant de proposer une récupération explicite. Un propriétaire ou guide absent est refusé.
 
**Preuves :** `src/enhancements.js ; src/face-drafts.js ; src/v26-app.js ; qa/v26/features/browser-final.json`

Contrôle ajouté dans la passe V26 ; voir les preuves ci-dessus.

### V26-03 — Les longues actions du panneau acoustique débordaient en portrait
**Domaine :** Interface · **État :** Corrigé et testé

Largeur du contenu de modale bornée, retours à la ligne des actions et sélecteurs en lignes lisibles. Contrôle de scrollWidth/clientWidth et capture à 390×844, après correction d’un débordement détecté visuellement.
 
**Preuves :** `src/v26.css ; qa/v26/features/02-mobile-candidates.png ; qa/v26/features/browser-final.json`

Contrôle ajouté dans la passe V26 ; voir les preuves ci-dessus.

## Dépôt et portée de la livraison

Le reçu Drive est produit séparément à partir des retours réels de transfert et de la relecture du dossier. Cet audit n’affirme pas qu’un transfert a réussi avant sa vérification. Aucun partage public ni déploiement n’est demandé.

**SHA-256 du HTML testé :** `7f294962a0315d173927608f8b7663b6be94898baf170c4d3d84b66d5d380825`
