# DIVA PULSE V21 — Rapport de vérification

## Livraison vérifiée

Version **21.0.0**, construite à partir du ZIP V20 fourni. Le HTML autonome et `index.html` sont identiques.

SHA-256 du HTML testé et livré :
`efd786930efc9a1661a740939f72338985a6eef46832d4cfbd25c919d5ca423f`

La V21 ajoute le lecteur ZIP local, la prévalidation/aperçu MMD, une troupe par défaut pour les nouveaux morceaux, une palette MMD élargie et des corrections de compatibilité et de chargement. Elle conserve le moteur AutoMap et le spectacle Auto Show de V20.

## Résultats finaux réellement exécutés

| Ensemble | Réussites | Échecs finaux | Preuve |
|---|---:|---:|---|
| Logique Node.js | 433/433 | 0 | `qa/v21/logic-all-output.txt` |
| Parcours navigateur V21 | 44/44 | 0 | `qa/v21/browser-final.json` |
| Parcours Auto Show V20 rejoués sur V21 | 57/57 | 0 | `qa/v21/regression-v20/browser-final.json` |
| Diagnostic PMX/VMD WebGL2 | 4/4 | 0 | `qa/v21/native-mmd-output.txt` |
| Lanceur HTTP local | 10/10 | 0 | `qa/v21/launcher-output.txt` |

Les sorties des cinq commandes, leurs codes de retour et leurs durées sont consignés dans `qa/v21/check-commands.json`. Les anciens rapports contenus dans le pack restent des documents historiques ; leurs résultats ne sont pas comptés ici. Les 41 nouveaux contrats de logique V21 s’ajoutent aux 392 contrats existants.

## Histoire utilisateur vérifiée de bout en bout

Le joueur sélectionne un ZIP de modèles → le lecteur décompresse et vérifie les fichiers → le contrôle énumère les modèles et les textures → un aperçu WebGL indépendant peut être lancé → la confirmation écrit les ressources et le morceau de façon atomique → les deux PMD sont chargés avec leur texture TGA → le spectacle anime leurs os → le joueur choisit la troupe pour les nouvelles musiques → l’import d’un WAV crée cinq partitions et un spectacle avec cette troupe → l’export et la restauration rechargent les personnages et remappent le réglage source.

Tous les fichiers d’essai sont les fixtures originales incluses. Aucun grand échantillon de personnages téléchargés auprès de créateurs n’a été testé. **Cela ne prouve pas qu’un modèle MMD arbitraire fonctionnera.**

## Contrôles V21 principaux

L’import ZIP stocké et DEFLATE est couvert en logique, ainsi que les CRC invalides, en-têtes divergents, noms japonais/UTF-8, chemins dangereux, doublons, références Unicode, tailles et fichiers tronqués. L’archive réelle à deux PMD est également décompressée dans Chromium.

Les chemins `../tex/DIAG.tga` sont résolus depuis le dossier des modèles. Les références qui sortent du pack ou qui sont ambiguës ne sont pas devinées. Les textures manquantes exigent une acceptation explicite ; un modèle invalide est non sélectionnable. Le contrôle et l’aperçu n’écrivent aucun fichier dans le stockage. Annuler conserve scène et ressources.

Le renderer charge réellement les deux PMD et leur TGA, partage le buffer de positions entre les sept matériaux de chaque personnage et modifie leurs rotations d’os. Un PMD binaire de **300 os** et son VMD sont chargés dans l’aperçu ; la palette disponible y est de 1024 entrées. Ce test de palette ne simule pas la complexité artistique d’un personnage à 300 os.

Le choix d’une troupe est explicite. Une nouvelle musique réutilise ses identifiants de ressources sans copier les blobs, mais reçoit des clips et des partitions propres. Les morceaux déjà présents ne sont pas remplacés. Le refus de sauvegarde conserve l’ancien pack, n’insère aucun média et garde les commandes de réessai.

L’export complet contient les fichiers MMD. La restauration crée des copies, remappe le morceau choisi comme troupe par défaut et recharge les deux personnages avec leurs nouvelles textures/références. Désactiver le réglage ne supprime pas le modèle.

Les largeurs et boutons du contrôle ont été vérifiés sur un viewport portrait 390 × 844 et sur un bureau 1440 × 1000. La fenêtre de contrôle utilise désormais toute sa largeur plutôt qu’une demi-colonne. Sans WebGL2, l’aperçu est désactivé et l’avertissement visible ; le pack reste enregistrable avec le fond 2D, sans prétendre afficher des personnages 3D.

## Défauts trouvés puis corrigés pendant cette passe

**Chargement asynchrone des textures.** Un rendu intervenant pendant l’attente de décodage pouvait changer l’unité et la texture WebGL actives. Le code pouvait alors écraser la texture flottante de la palette d’os avec des pixels RGBA. L’échec observé était `GL_INVALID_OPERATION: glTexSubImage2DRobustANGLE: Invalid internal format 0x1908`. Les décodages sont désormais terminés avant la création/liaison/upload de la texture. Un test déclenche volontairement un rendu au milieu du décodage et vérifie que la palette n’est pas corrompue. Le journal de l’échec antérieur est conservé dans `qa/v21/investigation-texture-race.json` ; il concerne un build antérieur au HTML livré, pas un échec final caché.

**Fenêtre d’import.** Le contenu interne gardait la largeur des anciennes petites boîtes de dialogue. La largeur réelle, l’affichage des cartes et les retours à la ligne des boutons ont été corrigés. L’ouverture du panneau MMD après confirmation rend les commandes de troupe visibles.

**Chemins, données et allocations.** Les chemins de texture dans un dossier parent valide ne sont plus rejetés systématiquement. Les limites de géométrie sont vérifiées avant les grosses allocations. Les données non finies des motions et certaines incohérences de poids/joints sont rejetées. Les poses VPD japonaises ne sont plus forcées en UTF-8.

## Régression Auto Show et gameplay

Les 57 contrôles historiques ont été exécutés sur la V21 avec uniquement l’assertion de version et les étapes de confirmation adaptées à la nouvelle interface. Ils vérifient notamment la caméra/lumière réellement appliquée au rendu, la protection des réglages manuels, l’import WAV → cinq difficultés, l’héritage des repères, le PV complet avec pause/reprise, une partie de huit secondes en Autoplay à 100 %, les PMD sans VMD et leurs mouvements procéduraux, les motions mesurées, le Director manuel, la sauvegarde/restauration et le repli sans WebGL.

Les erreurs de sauvegarde provoquées volontairement sont journalisées comme avertissements attendus. Les parcours finaux ne remontent aucune exception JavaScript non interceptée ni dépendance réseau externe du runtime.

## Environnement et limites de la validation

Chromium Linux, **WebGL2 logiciel SwiftShader sous Xvfb**. Les navigations navigateur vers le serveur local sont bloquées dans cet environnement ; les tests navigateur injectent les octets exacts du HTML final dans une page vierge. Les requêtes HTTP et les conflits de port sont contrôlés séparément par les tests du lanceur. Le parcours navigateur ne valide donc pas une installation PWA.

Les opérations de stockage utilisent le mode **TEMPORAIRE** explicite de l’application. L’atomicité, les exports/restaurations et leurs échecs ont été vérifiés dans ce mode, mais pas la persistance IndexedDB après fermeture/rechargement. Aucun test de périphérique physique, d’iPhone/Safari ou de performances GPU matériel n’est revendiqué.

Les fixtures de rendu sont des robots et triangles originaux. La fidélité avec une bibliothèque diversifiée de PMX/PMD réels reste à vérifier. SDEF/QDEF exact, Bullet/corps rigides/soft bodies, contraintes IK et héritages exhaustifs, morphs UV/matériaux, effets MME et retargeting universel ne sont pas ajoutés dans cette version. L’aperçu importe les données mais ne constitue pas une certification d’animation ou de rendu.

## Reproduire les tests

`node --test tests/*.test.cjs` puis `python tests/launcher_test.py`.

Les tests navigateur nécessitent Python, Playwright, Chromium à `/usr/bin/chromium`, et Xvfb/une session graphique pour SwiftShader : `DISPLAY=:91 python tests/v21_browser_test.py`, `DISPLAY=:91 python tests/v21_regression_v20_browser.py`, `DISPLAY=:91 python tests/v21_native_mmd_browser.py`. Adapter uniquement les chemins de l’exécutable et de l’affichage à la machine. Ces dépendances servent aux tests, pas au jeu livré.

## Fichiers de livraison

Le ZIP contient les sources modifiables, le HTML autonome, les exemples, les lanceurs, les guides et les journaux. `SHA256SUMS.txt` recense les empreintes des fichiers. Les vérifications ZIP et SHA sont faites après création ; leur résultat est consigné dans le résumé de livraison extérieur à l’archive pour éviter une empreinte circulaire.

Aucune modification d’un site distant ou de la Library n’a été effectuée pour cette livraison.
