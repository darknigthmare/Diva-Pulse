# V32 — Boucles musicales et sauvegardes indivisibles

## Reprise et publication

Base : PR #1 à `034221662b07d1669fe48ef63c04f65c1f770551`. Cette passe réintègre la V31 précédemment locale, puis ajoute V32. La branche de proposition reste `feat/v30-director-workflow`. Ne pas remplacer `main` ni fusionner automatiquement.

## Utiliser les boucles

Dans le Director, un clip VMD synchronisé peut définir un BPM source et une longueur de boucle en temps. Le champ **Phase (temps)** décrit la phase dans le cycle source, pas un décalage de la musique. Sa plage est `[0, longueur de boucle[`. Une phase exige une boucle active et un BPM source.

Sélectionner un clip, placer le curseur puis **Scinder** conserve désormais l'origine source et calcule la phase du fragment droit. Plusieurs coupes successives, même après des changements de tempo et plusieurs cycles, reproduisent le même temps source. **Fusionner** exige des fragments adjacents, des paramètres compatibles et une continuité de phase ; les incompatibilités ne changent aucune piste. Les fondus intermédiaires ne sont pas effacés silencieusement. Les coupes au milieu d'un fondu actif restent refusées.

La correction ne prétend pas fabriquer une motion artistiquement cyclique ni corriger un déplacement du modèle dans le monde : root motion, raccords visuels entre motions différentes et retargeting général restent au backlog.

## Compatibilité de sauvegarde

L'application est V32 ; ce nombre ne remplace pas arbitrairement la version de tous ses formats. Les projets Director sans phase conservent le schéma 19. Les phases non nulles utilisent explicitement le schéma **20**. L'import accepte 19 et 20, vérifie les médias, refuse les schémas futurs et les phases annoncées comme V19. Une ancienne application ne connaissant pas V20 doit refuser cet export plutôt qu'ignorer la phase. Conserver les sauvegardes sources.

## Sauvegarder le Studio

L'enregistrement construit d'abord une copie candidate. Le morceau et la suppression de son brouillon sont ensuite engagés dans la même transaction. La source et l'état de l'éditeur ne sont promus qu'après réussite. En cas d'échec, l'édition reste sale et son brouillon demeure récupérable ; recommencer l'enregistrement après résolution du problème.

Le contrat interne `Store.atomic(rows, {deletes})` valide et clone tous les éléments avant mutation. Il rejette les clés dupliquées ou une écriture et une suppression de la même clé. Les extensions AutoShow et MMD transmettent maintenant ces options. Les caches et événements de succès suivent uniquement le commit ; un abort ne peut pas publier un instantané incomplet.

## V31 également intégrée

L'écoute indépendante du Director fournit lecture/pause, recherche au curseur, volume, vitesse de 0,25× à 2× et boucle A/B. Le curseur et la scène partagent l'horloge audio sans lancer de partie. Les groupes peuvent déplacer clips, caméra, lumière et formations d'un seul geste annulable ; un geste interrompu ou une collision est refusé entièrement. Les formations disposent de champs numériques et le collage entre danseurs exige le même modèle identifié. Il ne s'agit pas d'un retargeting universel.

## Vérification reproductible

`npm test` : 947 tests, dont 38 nouveaux depuis V31 et 85 depuis V30. `python3 tests/launcher_test.py` : 10 contrôles.

Avec Python, Playwright verrouillé par `requirements-test.txt`, Chromium et un affichage Xvfb, exécuter :

```bash
xvfb-run -a python3 tests/v32_browser_test.py
xvfb-run -a python3 tests/v31_browser_test.py
xvfb-run -a python3 tests/v30_browser_test.py
xvfb-run -a python3 tests/v29_browser_test.py
xvfb-run -a python3 tests/v29_persistence_test.py
xvfb-run -a python3 tests/v32_transactions_test.py
python3 tools/verify_pr32.py
```

Le gate final exige les empreintes du build et de l'Excel courant, 123 identifiants de suivi uniques et concordants, 13 onglets, des compteurs Excel cohérents, aucun test ignoré et aucun rapport périmé. Les rapports V30/V31 sont historiques et ne remplacent pas V32.

La suite de transactions native provoque un `IDBTransaction.abort()` après le succès d'un vrai `IDBRequest`, puis vérifie annulation de la suppression, de l'écriture et des octets médias, caches, nouvelle tentative du Studio et rechargement. Cela ne simule pas une panne disque, une éviction navigateur ni un arrêt brutal du système. Les contrôles visuels utilisent Chromium/SwiftShader ; les 23 contrôles historiques du Director restent une exécution par document injecté. Aucun iPhone, Safari, Firefox, contrôleur physique ou lecteur d'écran n'est certifié ici.
