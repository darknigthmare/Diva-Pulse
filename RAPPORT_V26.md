# DIVA PULSE V26 — Rapport de vérification

## Traçabilité

Version **26.0.0 — Reprise & reconnaissance acoustique**, 7 octobre 2026. Base : archive V25 complète (737 fichiers), extraite sans modification de l’original. Le moteur de physique Bullet n’a pas été ajouté : sa dépendance n’a pas été obtenue, et aucun binaire factice/CDN n’est fourni.

Le jeu autonome et `index.html` sont identiques : **778398 octets**. Empreinte SHA-256 du HTML effectivement exécuté dans les suites finales :

`7f294962a0315d173927608f8b7663b6be94898baf170c4d3d84b66d5d380825`

Une reconstruction finale avec `python build.py` a reproduit exactement les mêmes octets. Les rapports historiques présents dans l’archive ne sont pas réutilisés comme preuves de cette passe.

## Commandes et résultats

`npm test` : **711/711** tests de logique réussis, dont **47 nouveaux** après les **664** tests de base réellement relancés. Preuves : `qa/v26/baseline.txt`, `qa/v26/logic-final.txt` et `tests/v26.test.cjs`.

| Suite navigateur | Résultat | Résultat lié au HTML |
|---|---:|---|
| features | **51/51** | `qa/v26/features/browser-final.json` |
| regression-v25 | **40/40** | `qa/v26/regression-v25/browser-final.json` |
| regression-v24 | **35/35** | `qa/v26/regression-v24/browser-final.json` |
| regression-v23 | **39/39** | `qa/v26/regression-v23/browser-final.json` |
| regression-v22 | **28/28** | `qa/v26/regression-v22/browser-final.json` |
| regression-v21 | **44/44** | `qa/v26/regression-v21/browser-final.json` |
| regression-v20 | **57/57** | `qa/v26/regression-v20/browser-final.json` |

Total : **294 contrôles navigateur**, pas 294 appareils. Les contrôles PMX/VMD natifs supplémentaires passent **4/4**, et les tests du lanceur **10/10**. Les sorties de chaque commande et leurs codes de retour sont conservés dans `qa/v26/`. `validation-summary.json` est calculé à partir de ces fichiers et vérifie les empreintes, sans recycler les résultats d’un ancien build.

## Comparaison acoustique réellement contrôlée

Un instrumental original de 19 secondes est enregistré en WAV PCM16, puis réellement réencodé en MP3 à 48 kb/s avec ffmpeg/libmp3lame. Le test Node relit le PCM décodé, et le test navigateur importe le véritable fichier MP3. Le son est rééchantillonné localement et un Worker prépare le descripteur.

Le MP3 est proposé comme ressemblant au WAV, sans devenir une identité vérifiée et sans fusion de morceaux. Le diagnostic numérique obtient un score de ressemblance de 0,9999529146 et un offset nul. Une version contenant 5513 échantillons de silence initial supplémentaires propose +0,50 seconde. Le sens inverse est contrôlé en logique. Une autre composition de même durée et même BPM n’est pas proposée malgré une amplitude périodique proche : sa forme spectrale diffère.

Les contrôles couvrent aussi gain, inversion de polarité, opposition des canaux stéréo, silence, audio trop court, durées incompatibles, ordre de phrases différent, descripteurs mal formés et échantillons non finis. Le score n’est pas une probabilité. Cette collection synthétique ne permet pas de chiffrer les faux positifs ou les absences de détection sur une discothèque réelle.

Le parcours ne copie aucune partition automatiquement. Il présente un formulaire sans sélection précochée, demande la confirmation du timing et écoute réellement le nouvel audio avec les clics de la partition source. Une écriture volontairement refusée laisse les deux collections et le panneau intacts. Un nouvel essai réussi ajoute une variante, sans remplacer les cinq niveaux générés ; le contenu des notes et le spectacle source/cible restent identiques.

L’option désactivée à l’import produit un morceau sans descripteur. L’action volontaire « comparer » l’indexe ensuite sans modifier ses notes. Un refus de sauvegarde de cette préférence remet la case dans son état confirmé. Les diagnostics de bibliothèque ne transforment pas les propositions acoustiques en associations exactes.

Les mesures détaillées sont dans `qa/v26/acoustic-fixtures-results.json`. Les WAV, le MP3 et les données décodées sont fournis avec les commandes de reproduction dans `examples/v26/README.md`.

## Brouillons faciaux et voix refusées

Le test importe réellement un PMX original avec morph de bouche, analyse un WAV de voix guide, puis vérifie que la récupération est séparée de `scene.faceTrack`. Le rendu de l’aperçu modifie réellement l’ouverture de bouche du modèle. Fermer et rouvrir le panneau propose une récupération explicite ; la source n’est pas appliquée automatiquement.

Le guide est ensuite remplacé pendant que **toutes les écritures sont refusées**. La dernière courbe et son nouveau média restent en mémoire, avec un message d’échec plutôt qu’un faux succès. L’enregistrement final refusé conserve le visage publié et les réglages éditables.

Un véritable `.pulsebundle` de secours est exporté avec ce guide qui n’a jamais atteint le stockage. Sa restauration crée des copies, remappe le propriétaire du brouillon et le guide, puis charge les octets du média restauré. La récupération peut être reprise et publiée ; le visage et le marqueur de récupération traitée sont enregistrés ensemble. Écarter un autre brouillon ne change pas le visage publié.

Les notes du morceau restent identiques avant et après ces opérations. Un brouillon dont le propriétaire n’existe pas est refusé avant toute confirmation de restauration. Les contrôles de logique vérifient également l’immuabilité, les champs invalides, les guides absents, les marqueurs d’abandon et la priorité à la dernière version en mémoire.

Ces essais prouvent la reprise du panneau dans une session et le transport portable. Ils **ne prouvent pas la persistance après fermeture réelle du navigateur**, car le document de test utilise le stockage TEMPORAIRE.

## Rendu, non-régression et interface

Les parcours V20 à V25 ont été relancés sur le HTML V26 : AutoMap cinq difficultés, Auto Show, priorité du manuel, PV complet avec pause/reprise, partie Autoplay à 100 %, PMD/PMX/VMD, textures, visage, héritages d’os, IK, morphs UV/matériaux, SDEF/QDEF et restauration des modèles. Les comparaisons CPU/GPU présentes dans ces suites restent réellement exécutées, pas reprises depuis les fichiers V25.

La nouvelle modale acoustique a été inspectée à 390×844 pixels. Un débordement horizontal dû aux longues actions a été corrigé dans `src/v26.css`, puis une assertion sur la largeur défilable et une nouvelle capture ont été ajoutées. Les captures finales de comparaison et de récupération faciale sont dans `qa/v26/features/`.

Une première exécution du harnais cliquait derrière le bilan d’import resté ouvert : le script a été corrigé pour refermer cette modale, sans supprimer les contrôles fonctionnels. Une exécution concurrente a également dépassé les quinze secondes pendant un clic de fermeture de l’aperçu MMD. La vérification finale est séquentielle et ce harnais dispose de 45 secondes pour ses interactions ; le parcours complet doit réussir avant livraison. La cause exacte du premier dépassement n’est pas certifiée. Les traces intermédiaires sont historiques, pas ajoutées aux totaux.

## Environnement et limites

Chromium est exécuté avec Xvfb et WebGL2 logiciel SwiftShader. Ce n’est pas un GPU physique. La tentative de navigation sur le serveur local a renvoyé `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Aucun contournement n’a été réalisé. Le HTML exact est chargé dans un document en mémoire autorisé ; les réponses HTTP et fichiers servis sont contrôlés séparément par le lanceur.

La persistance IndexedDB après fermeture, la coordination native multi-fenêtres, l’installation PWA complète, Safari/iPhone et les appareils MIDI/manettes physiques restent non validés. Une réussite Autoplay ne mesure ni le ressenti humain ni la justesse du mapping sur un catalogue commercial.

La comparaison acoustique est locale, avec durées proches, offset ±2 s par pas de 50 ms et aucune adaptation de tempo. Elle n’est pas destinée à réutiliser automatiquement une version live, un remix ou un extrait. Une vérification à l’écoute reste obligatoire. Le moteur ne recherche aucun niveau officiel sur Internet.

Bullet, corps souples, retargeting universel, appuis des pieds, visèmes, MME exhaustifs et règles SEGA 1:1 restent ouverts. `AUDIT_V26.md/json` suit 51 constats et ne transforme pas ces lacunes en fonctionnalités livrées.

## Livraison

Le ZIP final est relu intégralement et chaque fichier interne est comparé à son empreinte avant transfert. Le reçu Google Drive est produit séparément à partir des confirmations et de la relecture du dossier. Les empreintes sont calculées localement ; une égalité de nom et de taille distante n’est pas une relecture intégrale des octets stockés sur Drive. Aucun site n’est déployé et aucun partage public n’est demandé.
