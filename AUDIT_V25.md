# DIVA PULSE V25 — Suivi de l’audit



Version **25.0.0**, base **V24** vérifiée. **48 constats suivis** : 40 initiaux, 3 V24 et 5 nouveaux. Les ajouts ci-dessous ne ferment pas artificiellement les grands chantiers.



HTML testé : `32bf29e2cb8428e27ae1a7286e8b16a1122175c5cc881e20f5d9f59d4fe8a06c`.



Bouche par enveloppe audio et clés manuelles protégées, contrôle de priorité VMD, voix guide portable, sauvegarde binaire par blocs, réemploi du tampon de morphs. Reprise fonctionnelle V20–V24 sur le HTML V25. Aucun phonème, séparation vocale, physique Bullet ou persistance native certifiée.



## Avancées de cette passe



### A12 — Palette d’os répétée par matériau

**Corrigé et testé; allocations de morphs améliorées.** La palette partagée V24 est conservée. La V25 réutilise également le tableau complet des positions de morphs ; remise à zéro et identité du tampon vérifiées dans le vrai renderer.

Preuves : `src/stage.js ; tests/v25_browser_test.py ; qa/v25/features/browser-final.json`.



### A27 — Visèmes et synchronisation labiale depuis la chanson

**Avancé, enveloppe audio et édition manuelle; visèmes ouverts.** Piste scene.faceTrack : audio mono/stéréo local, voix guide distincte, morph reconnu, curseur, clés manuelles, protection des VMD et export JSON. Analyse volontaire à l’import. Ce n’est ni la reconnaissance de phonèmes ni la séparation du chant.

Preuves : `src/face-core.js ; src/v25-app.js ; tests/v25.test.cjs ; qa/v25/features/browser-final.json`.



### A31 — Très gros médias et sauvegardes volumineuses

**Avancé, format binaire et banc synthétique; plafond réel à valider.** Export/lecture .pulsebundle avec manifeste et SHA-256 par bloc de 1 Mio, sans base64 des médias. 256 Mio synthétiques testés sous Node ; restauration réelle de petite bibliothèque dans le navigateur. Le plafond de 1 Gio n’est pas certifié sur tous appareils.

Preuves : `src/bundle-core.js ; src/enhancements.js ; qa/v25/bundle-benchmark.json ; qa/v25/features/browser-final.json`.



### A33 — Outils de montage avancés

**Avancé, piste faciale éditable; montage complet ouvert.** Panneau de clés manuelles d’ouverture, aperçu réel au curseur, import/export JSON et sélection du morph/danseur. Pas encore une timeline multipiste complète avec courbes universelles.

Preuves : `src/v25-app.js ; qa/v25/features/02-face-preview.png`.



### A35 — Persistance après fermeture et installation hors ligne

**Toujours non validé après fermeture.** Les tentatives de navigation locale HTTP et fichier sont refusées par la politique du navigateur de test. Pas de contournement : HTML exact injecté dans un document temporaire ; aucun résultat de durabilité ou d’installation PWA native.

Preuves : `qa/v25/http.log ; RAPPORT_V25.md`.



### A40 — Dépôts Google Drive et absence de synchronisation du jeu

**Dépôt V25 à confirmer séparément.** Dossier dédié V25 créé sous le dossier projet existant. L’état des envois et leur relecture figurent dans le reçu extérieur après transfert, pas dans une promesse d’upload. Ni hébergement du jeu ni synchronisation des données du navigateur.

Preuves : `Reçu DIVA_PULSE_V25_DEPOT_DRIVE.json après envois confirmés`.



## Registre complet des constats initiaux



### A01 — L’export dépendait des écritures

**P0 · Sauvegarde · Corrigé et testé**

Le chemin exportBackup enregistrait de nouveau les morceaux avant de lire la bibliothèque. Une écriture refusée pouvait donc empêcher une sauvegarde de secours.

Export en lecture seule. La partition sale du studio est incluse comme brouillon distinct, pas publiée sur la source. Le test refuse toutes les nouvelles écritures et obtient quand même le fichier de sauvegarde.

Preuves : `src/enhancements.js: exportBackup ; tests/v23_browser_test.py ; qa/v23/integration/browser-final.json`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A02 — Transactions mémoire partiellement validées

**P0 · Sauvegarde · Corrigé et testé**

Le mode temporaire devait valider et cloner toutes les lignes avant la première modification, comme une transaction complète.

Prévalidation des collections, identifiants et objets clonables. Échec sur la deuxième ligne : aucune première ligne ajoutée. Les valeurs sont des instantanés indépendants.

Preuves : `src/services.js: Store.atomic ; tests/v23.test.cjs`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A03 — Stockage fermé pris pour un stockage vide

**P0 · Sauvegarde · Corrigé et testé**

Une connexion invalidée ne doit pas provoquer un retour silencieux à une nouvelle mémoire vide, ni afficher une réussite de sauvegarde.

État invalidated explicite ; toutes les lectures et mutations le refusent. Badge STOCKAGE FERMÉ, message de rechargement et pause de la partie. Gestion des événements de fermeture et de changement de version.

Preuves : `src/services.js: Store.invalidate/guard/open ; src/quality.js: install ; tests/v23.test.cjs`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A04 — Réglages affichés avant confirmation du stockage

**P1 · Sauvegarde · Corrigé et testé**

L’objet de préférences pouvait conserver un changement alors que la transaction avait été annulée.

Instantané de la dernière écriture confirmée et remise en état sur abort. Une réussite n’est publiée qu’à la fin de la transaction. Une exception d’observateur ne transforme pas un commit réussi en échec.

Preuves : `src/services.js: Store.atomic/committed ; src/quality.js ; test navigateur avec transaction annulée`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A05 — Métadonnées et favoris non conservés après échec

**P1 · Bibliothèque · Corrigé et testé**

Modifier un titre ou un favori pouvait laisser l’interface en désaccord avec les données réellement enregistrées.

Candidat enregistré avant publication ; rollback du favori. Une sauvegarde de métadonnées refusée conserve la source et le champ saisi pour réessayer.

Preuves : `src/quality.js: saveSong ; src/enhancements.js: songManager ; qa/v23/integration/browser-final.json`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A06 — Setlist fantôme après refus de sauvegarde

**P1 · Bibliothèque · Corrigé et testé**

Le tableau des concerts pouvait être modifié avant la validation de son enregistrement ou de sa suppression.

Copie candidate puis publication après succès. La file de morceaux reste disponible après un échec. Tests d’ajout, de nouvelle tentative et de suppression refusée.

Preuves : `src/enhancements.js: setlistDialog ; tests/v23_browser_test.py`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A07 — Propriétaire d’une sauvegarde et remplacement GLB

**P1 · Sauvegarde · Avancé, validation partielle**

Un changement de morceau pendant une écriture ne doit pas restaurer le mauvais objet. Un GLB prévisualisé mais non enregistré ne doit pas rester à la place de la scène sauvegardée.

Sauvegarde attachée au propriétaire et à un numéro de requête ; retour à la scène enregistrée en cas d’import GLB échoué. Revue et non-régression effectuées ; le scénario GLB de panne graphique pendant l’écriture n’a pas son propre test navigateur exhaustif dans cette passe.

Preuves : `src/quality.js: saveSong/importModel ; src/app.js: clearModel/modelClip`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A08 — Brouillon perdu en fermant le panneau

**P1 · Director · Corrigé et testé**

Les modifications non appliquées du Director dépendaient de la seule session du panneau.

Brouillon séparé par morceau, file d’écriture et récupération explicite à la réouverture. La récupération reste annulable. Source manuelle inchangée avant Enregistrer.

Preuves : `src/director-app.js: directorRecoveries/directorDraftWrite ; navigateur : fermeture, réouverture, undo/redo`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A09 — Brouillon refusé absent de la sauvegarde portable

**P1 · Director · Corrigé et testé**

Une dernière modification pouvait ne subsister qu’en mémoire après un quota refusé ; les anciens exports ne transportaient pas cet état Director.

Conservation en mémoire avec statut d’échec, fusion de l’état le plus récent dans directorDrafts du pulsepack, références médias et propriétaire remappés à la restauration. Rechargement des deux personnages restaurés.

Preuves : `src/enhancements.js: exportBackup/restoreBackup ; qa/v23/integration/browser-final.json`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A10 — Perte du contexte graphique pendant un PV

**P1 · Rendu · Corrigé et testé**

Les ressources GPU étaient invalides après une perte de contexte ; une simple nouvelle image ne suffisait pas à rétablir le spectacle.

Détection de la perte, arrêt de l’horloge audio, reconstruction des programmes et buffers, rechargement des personnages. La partie reste en pause jusqu’à l’action du joueur. Test réel WEBGL_lose_context, pas seulement un événement DOM fabriqué.

Preuves : `src/stage.js ; src/quality.js: onRestored/onError ; qa/v23/integration/browser-final.json`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A11 — Échec de création du shader bloquant le démarrage

**P1 · Rendu · Corrigé et testé**

Une compilation de shader refusée pouvait remonter hors du chemin de repli 2D.

Initialisation capturée, diagnostic initError, renderer indisponible et repli annoncé. Test de compilation volontairement refusée.

Preuves : `src/stage.js: constructor ; tests/v23.test.cjs`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A12 — Palette d’os répétée par matériau

**P1 · Performances · Corrigé et testé; allocations de morphs améliorées**

Les données du squelette étaient préparées et envoyées pour chaque matériau, malgré un modèle et une pose identiques.

La palette partagée V24 est conservée. La V25 réutilise également le tableau complet des positions de morphs ; remise à zéro et identité du tampon vérifiées dans le vrai renderer.

Preuves : `src/stage.js ; tests/v25_browser_test.py ; qa/v25/features/browser-final.json`.

Voir preuves V25 indiquées; limites conservées explicitement.



### A13 — SDEF lu puis remplacé par une déformation linéaire

**P1 · MMD · Avancé et testé**

Les centres C/R0/R1 étaient sautés par le parseur. Le rendu ne pouvait donc pas calculer le SDEF prévu par le fichier.

Conservation, conversion de coordonnées et validation des centres ; calcul sphérique spécifique CPU/GLSL. Équation vérifiée contre une forme développée indépendante et sortie GPU comparée. Support de transformations rigides, pas certification de tout squelette complexe.

Preuves : `src/mmd-core.js ; src/mmd-compat.js ; src/skinning.js ; tests/v23_gpu_probe.js`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A14 — QDEF traité comme BDEF

**P1 · MMD · Avancé et testé**

Le type QDEF n’avait pas son chemin de déformation par quaternions duaux normalisés.

Chemin QDEF à quatre influences, correction du signe des quaternions, normalisation, translation et normales. Tests des torsions, des poids extrêmes et du résultat GPU. Les héritages d’os, échelles non rigides et la physique restent distincts.

Preuves : `src/skinning.js ; tests/v23.test.cjs ; qa/v23/integration/gpu-feedback.json`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A15 — Sphere map calculée dans le mauvais repère

**P2 · MMD · Corrigé, contrôle structurel**

La normale utilisée pour la sphere map devait suivre le repère de la caméra, pas uniquement le repère du monde.

Normale transformée par la vue. Shader compilé et parcours MMD rejoués. La comparaison pixel à pixel de matériaux complexes avec MMD Desktop n’est pas faite.

Preuves : `src/stage.js: uView et normale sphere map ; test natif WebGL`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A16 — Génération ralentie par des rescans globaux

**P1 · AutoMap · Corrigé et testé**

À chaque candidat d’accord, l’algorithme reconstruisait et triait les notes de toute la difficulté pour vérifier une densité locale.

Listes par difficulté maintenues en ordre et contrôle limité aux fenêtres de quatre secondes que le candidat peut modifier. Comparaison stricte des notes avec le moteur V22 conservé comme oracle.

Preuves : `src/automap-core.js ; tests/reference/automap-v22-baseline.js ; tests/v23-automap.test.cjs`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A17 — Préférences restaurées hors limites

**P1 · Validation · Corrigé et testé**

Des valeurs nulles, booléennes, infinies, hors plage, ou des mappings de touches en doublon pouvaient produire des réglages incohérents.

Contrats numériques et de types, mappings uniques, profils de jugement connus. Récupération avec avertissement au démarrage ; restauration explicitement refusée et atomique pour les préférences invalides.

Preuves : `src/quality.js: preferences ; src/enhancements.js: restoreBackup ; tests/v23.test.cjs`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A18 — Director mal formé accepté partiellement

**P1 · Validation · Corrigé et testé**

Des structures inattendues de slots/clips ou des clés de formation dupliquées pouvaient être normalisées de façon ambiguë.

Limites et types contrôlés, invalides refusés avant remplacement. Les sources ne sont pas modifiées lors du refus.

Preuves : `src/director-core.js: normalizeDirector ; tests/v23.test.cjs`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A19 — Réglages devenus trop longs à parcourir

**P2 · Interface · Amélioré et testé**

L’empilement des systèmes rendait l’accès à Audio, AutoMap ou aux sauvegardes peu direct.

Six raccourcis vers les rubriques réelles, panneaux homogènes et lignes de diagnostic repliables. Capture mobile du Director et contrôle des dimensions.

Preuves : `src/quality.js ; src/style.css ; qa/v23/integration/03-mobile-recovery.png`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A20 — Aucun état global exploitable de la bibliothèque

**P2 · Diagnostic · Ajouté et testé**

Les contrôles MMD à l’import ne signalaient pas ensemble les niveaux manquants, médias absents et spectacles invalides de la bibliothèque courante.

Audit non destructif par morceau dans Réglages, avec export JSON et limites explicitement indiquées. Aucune réparation ou suppression silencieuse.

Preuves : `src/quality.js: songAudit/auditLibraryQuality ; qa/v23/integration/04-quality-report.png`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A21 — Physique Bullet, articulations et corps souples

**P1 · MMD · Ouvert**

Le pipeline V23 ne simule pas exhaustivement les corps rigides, contraintes et tissus d’un pack PMX. Les options anciennes ne sont pas une preuve d’intégration Bullet.

À faire : importer toutes les propriétés, solveur à pas fixe, remise en état après seek/pause, collisions et limites d’articulations, puis tests cheveux/vêtements sur corpus autorisé. Ne pas activer une case sans solveur fonctionnel.

Preuves : `src/mmd-core.js ; src/stage.js ; diagnostic PulseQuality.limitations`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A22 — Héritages de transformations et contraintes IK complètes

**P1 · MMD · Avancé, compatibilité partielle**

Le solveur présent ne couvre pas tous les grants/append transforms, axes locaux et limites IK attendus par les modèles avancés.

Héritages standards non locaux de rotation et translation, ratios et chaînes, cycles refusés, projection XYZ des limites IK dans le bon repère, plafond de 32 itérations. Les héritages locaux/monde, axes, interactions après IK et physique restent ouverts.

Preuves : `src/skeleton.js ; src/stage.js ; src/mmd-core.js ; tests/v24.test.cjs ; tests/v24_browser_test.py`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A23 — Matériaux et effets MME exhaustifs

**P2 · MMD · Ouvert**

Les morphs UV0/couleur/opacité et sphere maps existent, mais le rendu complet des UV additionnels, contours, toon, spéculaire et effets MME n’est pas équivalent à MMD Desktop.

À faire : matrice de compatibilité des matériaux, images de référence par fonction, règles de transparence, rendu des contours et effets explicitement supportés. Garder un avertissement sur les fonctions ignorées.

Preuves : `src/mmd-surface.js ; src/stage.js ; src/mmd-audit.js`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A24 — Collection représentative de modèles téléchargés

**P1 · Compatibilité · Non validé**

Les tests présents utilisent surtout des diagnostics originaux. Leur passage ne certifie pas un personnage quelconque avec des centaines de textures et contraintes.

À faire : corpus avec autorisation de test, provenance et licences consignées ; PMD/PMX, morphs, textures japonaises, os complexes et plusieurs tailles ; grille rendu/animation/physique indépendante.

Preuves : `examples/v19, v21, v22, v23 ; rapports navigateur`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A25 — BPM d’un VMD automatiquement détecté

**P2 · Animation · Avancé, proposition à valider**

Le calage musical demande toujours un BPM source et un premier temps fournis. La durée d’un VMD ne suffit pas à déterminer sa pulsation.

Recherche bornée de cycles de pose VMD, stabilité sur deux moitiés, plusieurs interprétations BPM. Sélection explicite puis sauvegarde ; aucune phase certaine ni application automatique. VMD statiques et sans cycle refusés comme source de BPM.

Preuves : `src/motion-analysis.js ; src/reliability.js ; tests/v24_browser_test.py`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A26 — Retargeting universel et appuis des pieds

**P1 · Animation · Ouvert**

La correspondance de noms d’os ne corrige ni les proportions, ni les poses de repos, ni les pénétrations. La danse procédurale MMD reste surtout sur le haut du corps reconnu.

À faire : mapping éditable, pose de repos, correction des axes/proportions, contacts des pieds, root motion et limites articulaires ; conserver la pose plutôt qu’un retargeting aveugle.

Preuves : `src/stage.js: mouvements procéduraux et VMD ; diagnostic MMD`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A27 — Visèmes et synchronisation labiale depuis la chanson

**P2 · Animation · Avancé, enveloppe audio et édition manuelle; visèmes ouverts**

Les morphs faciaux VMD sont lus ; le moteur ne déduit pas des paroles et visèmes fiables depuis un mix musical.

Piste scene.faceTrack : audio mono/stéréo local, voix guide distincte, morph reconnu, curseur, clés manuelles, protection des VMD et export JSON. Analyse volontaire à l’import. Ce n’est ni la reconnaissance de phonèmes ni la séparation du chant.

Preuves : `src/face-core.js ; src/v25-app.js ; tests/v25.test.cjs ; qa/v25/features/browser-final.json`.

Voir preuves V25 indiquées; limites conservées explicitement.



### A28 — Qualité des patterns sur de vraies chansons

**P1 · AutoMap · Avancé, corpus synthétique seulement**

Les contraintes d’héritage, de cadence et de quantification sont testées. Les sections et attaques restent des heuristiques ; elles ne garantissent pas une partition agréable sur chaque genre.

Cinq WAV originaux annotés (binaire, ternaire, swing, changement de tempo, silence), analyse PCM réelle et contrôle des cinq difficultés. Rappel/précision mesurés. Pas de corpus de chansons mixées ni d’évaluation humaine ; moteur générateur V23 conservé.

Preuves : `tests/v24-audio-corpus.cjs ; examples/v24/audio-corpus ; qa/v24/audio-corpus.json`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A29 — Reconnaissance d’un audio réencodé

**P2 · AutoMap · Ouvert**

L’empreinte exacte identifie un même fichier, pas deux encodages d’un enregistrement ni une version concert/remix.

À faire : empreinte acoustique, estimation du décalage et confiance. Ne jamais appliquer automatiquement une chart exacte à un enregistrement seulement ressemblant.

Preuves : `src/hash-core.js ; catalogue local`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A30 — Recherche de partitions existantes en ligne

**P2 · Catalogue · Ouvert**

Le catalogue de charts demeure local, alimenté par les imports. L’absence de niveau local déclenche AutoMap, pas une recherche mondiale.

À faire : connecteur de catalogue autorisé, provenance/version de chaque niveau, association de l’audio vérifiable, cache et décision de l’utilisateur avant une source incertaine.

Preuves : `src/automap-app.js ; catalogue .pulsecharts`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A31 — Très gros médias et sauvegardes volumineuses

**P2 · Performances · Avancé, format binaire et banc synthétique; plafond réel à valider**

Le décodage audio, certains tableaux et les sauvegardes JSON/base64 occupent la mémoire. L’optimisation V23 concerne la génération, pas un décodage audio ou un export totalement en streaming.

Export/lecture .pulsebundle avec manifeste et SHA-256 par bloc de 1 Mio, sans base64 des médias. 256 Mio synthétiques testés sous Node ; restauration réelle de petite bibliothèque dans le navigateur. Le plafond de 1 Gio n’est pas certifié sur tous appareils.

Preuves : `src/bundle-core.js ; src/enhancements.js ; qa/v25/bundle-benchmark.json ; qa/v25/features/browser-final.json`.

Voir preuves V25 indiquées; limites conservées explicitement.



### A32 — Fidélité 1:1 aux règles Project DIVA

**P1 · Gameplay · Non certifié**

Les profils de jugement, trajectoires et bonus actuels sont ceux de DIVA PULSE. Aucun banc de comparaison exhaustive par édition SEGA n’a été exécuté.

À faire : choisir une édition de référence, spécifier chaque type de note/bonus, fixtures d’entrée et score attendu, tests simultanés/maintien/chaînes ; séparer les records par règleset.

Preuves : `src/core.js ; src/app.js ; profils Standard/Accessible/Précision`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A33 — Outils de montage avancés

**P2 · Director · Avancé, piste faciale éditable; montage complet ouvert**

Les clips, fondus, formations, caméras et lumières sont éditables ; l’éditeur ne dispose pas encore d’une ergonomie complète de logiciel de montage avec toutes les courbes, multi-sélections et raccourcis.

Panneau de clés manuelles d’ouverture, aperçu réel au curseur, import/export JSON et sélection du morph/danseur. Pas encore une timeline multipiste complète avec courbes universelles.

Preuves : `src/v25-app.js ; qa/v25/features/02-face-preview.png`.

Voir preuves V25 indiquées; limites conservées explicitement.



### A34 — Accessoires et nouvelles scènes générées

**P2 · Director · Ouvert**

Auto Show assemble les scènes présentes ; il ne crée pas de nouveaux maillages. Les accessoires complexes et leurs interactions ne sont pas un système complet validé.

À faire : bibliothèque de props, rattachements aux os, clés d’activation, collisions de mise en scène, génération de placement contrainte et mesure des coûts graphiques.

Preuves : `src/stage.js ; src/autoshow-core.js ; Director`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A35 — Persistance après fermeture et installation hors ligne

**P1 · Production · Toujours non validé après fermeture**

Les essais graphiques utilisent un document d’origine opaque : stockage TEMPORAIRE. La navigation du navigateur vers le serveur est bloquée par l’infrastructure de cette session.

Les tentatives de navigation locale HTTP et fichier sont refusées par la politique du navigateur de test. Pas de contournement : HTML exact injecté dans un document temporaire ; aucun résultat de durabilité ou d’installation PWA native.

Preuves : `qa/v25/http.log ; RAPPORT_V25.md`.

Voir preuves V25 indiquées; limites conservées explicitement.



### A36 — Safari/iPhone et contrôleurs physiques

**P1 · Production · Non exécuté**

Les contrôles clavier/manette/MIDI automatisés ne mesurent pas un contrôleur physique, la latence réelle Bluetooth ni Safari/iOS.

À faire : matrice d’appareils, latence audio/entrée/affichage, multitouch, déconnexion/reconnexion, suspension de l’onglet et reprise, clavier international.

Preuves : `Rapports Playwright et limitations de cette livraison`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A37 — Conflits entre plusieurs fenêtres

**P1 · Sauvegarde · Avancé, coordination native à valider**

Le changement de version IndexedDB est géré, mais aucun protocole général de résolution des éditions concurrentes par deux fenêtres de même version n’est présent.

Réservation exclusive Web Locks lorsqu’IndexedDB est actif, seconde fenêtre en lecture/export uniquement, refus des mutations, libération à la sortie. Test de deux contextes JS à gestionnaire de verrous simulé et test UI du refus. Anciennes versions exclues. Navigation navigateur de test bloquée : vraie coordination IndexedDB de plusieurs fenêtres non exécutée.

Preuves : `src/services.js ; src/reliability.js ; tests/v24.test.cjs ; tests/v24_browser_test.py`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A38 — Accumulation des extensions historiques

**P2 · Architecture · Ouvert**

Le build fonctionne sans dépendance, mais plusieurs extensions remplacent ou enveloppent les méthodes de l’application. Certaines sources sont très compactes et difficiles à relire.

À faire progressivement : API de services explicites, modules métier, formatage des sources, tests d’intégration contractuels. Garder le HTML autonome comme sortie, pas comme source de développement.

Preuves : `build.py ; src/enhancements.js ; src/v7-app.js ; src/v9-app.js ; src/v10-app.js`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A39 — Personnages et PV finalisés

**P2 · Direction artistique · Ouvert**

Les silhouettes procédurales et modèles de diagnostic ne constituent pas des personnages Vocaloid détaillés. Les chansons, costumes et chorégraphies officiels ne sont pas inclus.

À faire : pipeline d’assets finaux fournis avec leur provenance, galerie et contrôle de compatibilité, presets artistiques et cohérence de scène ; ne pas assimiler une fixture technique à un personnage final.

Preuves : `examples/ ; personnages procéduraux de src/stage.js`.

Preuves historiques conservées. Les suites V20–V24 effectivement rejouées sur V25 sont précisées dans RAPPORT_V25.md.



### A40 — Dépôts Google Drive et absence de synchronisation du jeu

**P2 · Livraison et cloud · Dépôt V25 à confirmer séparément**

Le dossier dédié a été relu ; le connecteur expose maintenant uniquement des actions de lecture. Aucune création de dossier ou téléversement V23 n’a pu être exécuté. Le jeu ne synchronise pas automatiquement sa bibliothèque avec Drive.

Dossier dédié V25 créé sous le dossier projet existant. L’état des envois et leur relecture figurent dans le reçu extérieur après transfert, pas dans une promesse d’upload. Ni hébergement du jeu ni synchronisation des données du navigateur.

Preuves : `Reçu DIVA_PULSE_V25_DEPOT_DRIVE.json après envois confirmés`.

Voir preuves V25 indiquées; limites conservées explicitement.



## Constats additionnels V24 et V25



### V24-01 — Rejets non interceptés sur certains réglages et remappages clavier

**Sauvegarde · Corrigé, tests de refus**

Gestion explicite des promesses rejetées, formulaire disponible et retour à la valeur confirmée lorsque le stockage refuse une écriture.

Preuves : `src/app.js ; src/enhancements.js ; tests/v24_browser_test.py`.



### V24-02 — Le diagnostic quota/protection ne doit pas bloquer le jeu

**Démarrage · Corrigé, diagnostic dégradé**

API estimate()/persisted() capturées séparément ; informations partielles et erreur lisible si le navigateur refuse.

Preuves : `src/reliability.js ; tests/v24_browser_test.py`.



### V24-03 — Étiquette de version du lanceur restée à V23

**Livraison · Corrigé et testé**

Lire VERSION.txt au démarrage plutôt que dupliquer une constante. Reprise des dix contrôles HTTP après correction.

Preuves : `lancer.py ; qa/v24/launcher-results.json`.



### V25-01 — Priorité des expressions VMD même à zéro

**Animation · Ajouté et testé**

La présence d’une piste faciale, d’un groupe de morphs ou d’une motion sortante protège la bouche. Le remplacement demande de décocher volontairement la protection.

Preuves : `tests/v25.test.cjs ; qa/v25/features/browser-final.json`.



### V25-02 — Voix guide et expression enregistrées ensemble

**Sauvegarde · Ajouté et testé**

Validation avant transaction, scène source préservée si écriture refusée, ressource incluse dans les deux formats portables et remappée en restauration.

Preuves : `src/director-core.js ; src/v25-app.js ; qa/v25/features/browser-final.json`.



### V25-03 — Archive binaire vérifiée avant confirmation

**Intégrité · Ajouté et testé**

Empreintes de manifeste et blocs, tailles exactes, refus de corruption, troncature, données finales supplémentaires et descripteurs mal formés. Aucun contenu exécuté.

Preuves : `src/bundle-core.js ; tests/v25.test.cjs ; qa/v25/features/browser-final.json`.



### V25-04 — Le mix instrumental peut ouvrir la bouche

**Animation · Ajouté, portée limitée**

Option d’import désactivée par défaut, avertissement explicite et voix isolée optionnelle. Ne pas présenter l’énergie comme reconnaissance du chant. Signal DC/silence à zéro et canaux séparés.

Preuves : `src/face-core.js ; README_V25.md`.



### V25-05 — Clés manuelles non enregistrées à la fermeture du panneau

**Interface · Ajouté, brouillon temporaire**

Le panneau affiche Brouillon NON enregistré et permet un export JSON. Sa fermeture rétablit la scène confirmée. L’autosave durable de cette nouvelle piste reste un chantier ouvert.

Preuves : `src/v25-app.js ; qa/v25/features/browser-final.json`.



## Priorités toujours ouvertes



Physique et corps souples; ordre complet des contraintes et héritages; MME/toon exhaustifs; retargeting, proportions et pieds; vrais visèmes et séparation vocale; appréciation musicale des patterns sur des chansons mixtes; reconnaissance des réencodages; catalogue en ligne; comparaison systématique aux règles SEGA; persistance/native multi-fenêtres/PWA; périphériques et Safari/iPhone; nouvelle direction artistique et scènes; simplification des extensions historiques.



Les anciens résultats sont des preuves historiques, pas des validations automatiquement acquises à la V25. Le rapport courant distingue les contrôles réellement exécutés, les défauts injectés et les limites de l’environnement.
