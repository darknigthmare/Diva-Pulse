# DIVA PULSE V6 — Rapport de livraison et de tests

Version **6.0.0 — AutoMap & Coherent Difficulties Edition**. Base : archive V5 fournie dans cette conversation. Livraison autonome ; aucun ancien site ni dépôt externe n’a été modifié ou déployé.

## Résultats réellement réexécutés

| Ensemble | Réussis | Échecs | Portée |
|---|---:|---:|---|
| Tests de logique Node | 253 | 0 | 198 tests précédents + 55 tests AutoMap/SHA-256 |
| Navigateur, parcours AutoMap V6 | 67 | 0 | Import réel, Workers, catalogues, variantes, défauts de stockage, lecture, restauration, responsive |
| Navigateur, non-régression V5 | 62 | 0 | Métrique, ralenti WSOLA, MIDI simulé, Académie, sauvegardes et diagnostics |
| Navigateur, complétion et repli 2D | 9 | 0 | Dépôt de File, copies restaurées, cible exacte et commit atomique |
| Lanceur / HTTP local | 10 | 0 | Identité du build, fichiers, en-têtes et conflits de port |

Cela représente **138 contrôles navigateur** sur les suites ci-dessus. Aucun événement JavaScript non intercepté n’a été remonté dans leurs exécutions finales. Les anciens rapports V3/V4/V5 présents dans l’archive sont des historiques : leurs compteurs non réexécutés ne sont pas additionnés à cette livraison.

**Ces résultats ne sont pas une certification sans bug ni une validation musicale humaine de tous les fichiers audio.** Les erreurs volontairement injectées produisent des messages contrôlés ; leur présence dans des logs de développement ne signifie pas un événement JavaScript non intercepté dans le passage final.

## Parcours utilisateur effectivement vérifié

Un vrai fichier WAV original de 36 secondes est sélectionné dans le champ d’import du HTML construit. Le navigateur décode le fichier, prépare ses deux canaux, calcule le SHA-256 dans le repli Worker lorsque nécessaire, analyse les attaques et enregistre la famille. Le test n’injecte pas des notes préfabriquées à la place de cette étape.

L’exemple Neon Steps a produit **41 notes en EASY, 61 en NORMAL, 97 en HARD, 139 en EXTREME et 179 en EX EXTREME**. Les repères faciles conservent leurs timings, touches, positions et types dans les niveaux supérieurs. La pause volontaire de l’audio reste vide. Ce résultat caractérise le fichier d’exemple et la version testée, pas un catalogue de musiques variées jugées à l’écoute.

L’aperçu superpose des clics aux notes de chaque difficulté. Les tests vérifient démarrage, arrêt, fermeture et navigation sans record. Une partie complète en Autoplay, jouée en temps réel sur un fichier de contrôle court, atteint les résultats avec toutes ses notes COOL et aucun MISS/WRONG. Le contrôleur humain n’est pas remplacé par cette mesure : elle vérifie le moteur et les timestamps.

Le chemin sans WebGL a également été lancé dans Chromium headless. Le repli 2D est réellement utilisé ; un événement de dépôt contenant un vrai File déclenche la même génération. Les suites avec Xvfb emploient un vrai contexte WebGL2 et vérifient son absence d’erreur de rendu, sur GPU logiciel.

## Contrôles d’intégrité et d’incidents

Les tests couvrent une partition de catalogue HARD rattachée par SHA-256, conservant son offset et sa signature ; les quatre difficultés absentes sont créées. Réimporter un morceau ne régénère pas ses niveaux complets. Un simple titre ressemblant n’autorise pas une association automatique. Les empreintes courtes historiques sont migrées seulement après comparaison du SHA-256 du média stocké.

L’outil de complétion traite une copie restaurée incomplète même lorsqu’un premier morceau possède le même audio et cinq niveaux. La copie est ciblée par son identifiant ; le premier morceau n’est pas modifié. Un fichier différent ou une cible supprimée provoque un refus.

Un WAV silencieux conserve l’audio avec un statut à compléter, sans faux niveaux. Un fichier invalide est refusé sans média orphelin. Un lot mélangeant fichiers valides, doublons et échec poursuit les éléments suivants et affiche leurs états séparément.

Des refus explicites sont injectés dans `store.atomic` ou `store.put` : aucun nouveau morceau partiel n’est publié, la source reste intacte, un aperçu généré reste disponible pour réessayer et un réglage refusé revient à sa valeur visible initiale. Ces tests utilisent le stockage mémoire de l’origine opaque ; ils ne prouvent pas la durabilité matérielle d’IndexedDB.

L’annulation d’un vrai Worker d’analyse est déclenchée depuis un rappel de progression. Un import annulé avant commit n’ajoute pas de famille partielle. Un autre test injecte explicitement une annulation au deuxième élément du lot pour vérifier les trois états « déjà traité », « annulé », « non traité ». Pendant le commit atomique, le bouton Annuler est désactivé puis réactivé.

## Analyse, génération et limites mesurées

La suite Node teste des impulsions à 72, 100, 120, 156 et 180 BPM, les silences, le faible volume, la stéréo en opposition de phase, les attaques alternées entre canaux, les changements de pulsation, la sérialisation du Worker et la reproductibilité. Sur les cinq signaux de contrôle, l’écart maximal entre l’attaque synthétique et sa détection reste inférieur à 14 ms. **Ce seuil ne s’applique pas universellement à des voix, instruments ou mixages réels.** Les ambiguïtés de tempo moitié/double sont explicitement admises et exposées comme alternatives.

La cohérence de famille vérifie l’inclusion des notes, les limites de cadence, les densités glissantes, les cibles, les accords, les HOLD et les silences. Un test réalise soixante combinaisons de graine, densité, tempo et disposition ; il reste compté comme un seul test Node. Une famille synthétique de dix minutes vérifie le chemin long du générateur ; cela ne certifie pas le coût complet d’un décodage audio de dix minutes sur téléphone.

Les chart families peuvent se ressembler sur un signal très pauvre. Le générateur ne crée pas une fausse complexité dans les silences pour rendre ses compteurs strictement croissants. Les étoiles et l’indice de pulsation sont internes ; aucun étalonnage officiel ou perceptuel exhaustif n’est revendiqué.

## Corrections découvertes pendant les parcours

Les noms de fichiers sans espaces pouvaient dépasser le viewport mobile ; ils se replient maintenant correctement et les séparateurs de nom sont rendus plus lisibles. Le panneau d’informations enrichi pouvait placer « Générer » sous le pied de page fixe ; son contenu est désormais dans le flux de la page. Le rapport de famille utilise une largeur ordinateur adaptée et une disposition compacte sur téléphone.

Les niveaux générés sont désormais protégés comme sources dans le studio : une vraie modification crée un chart `manual-derived`, garde la version initiale et n’affiche pas l’ancien contrôle AutoMap comme validation du contenu corrigé. Le rapport regroupe une seule ligne par difficulté, même après création de variantes identiques à la même graine.

La complétion d’une copie restaurée a été corrigée pour ne pas sélectionner la première entrée du même SHA-256 à sa place. La frontière d’annulation / commit est explicitement protégée.

## Environnement et périmètre non vérifié

Node 22.16.0 ; Python 3.13.5 ; Chromium 144.0.7559.96 sous Linux. Les suites 3D emploient Xvfb et SwiftShader. Les pages chargent le HTML final avec `set_content` dans une page vide à origine opaque : la navigation navigateur vers le serveur local est refusée par la politique de l’environnement. Aucun contournement de politique n’a été effectué. L’outil CLI agent-browser n’était pas installé ; les tests utilisent Python Playwright et le Chromium déjà présents.

Le badge de stockage est donc TEMPORAIRE pendant cette QA. Les exports sont examinés comme données/Blobs et restaurés dans la bibliothèque en mémoire. La persistance après fermeture, une réelle installation PWA, un redémarrage hors ligne, les migrations entre onglets persistants et le gestionnaire de téléchargement propre à chaque système restent non vérifiés. Les tests du lanceur sont de vraies requêtes HTTP Python séparées ; les contrats de cache sont des tests de logique Node, pas une installation de service worker dans le navigateur.

Les adaptateurs de clavier, Gamepad et MIDI utilisent des événements simulés. Aucun contrôleur, clavier MIDI, écran tactile physique, appareil Bluetooth ou iPhone/Safari n’a été validé. Les dimensions 390×844 et 844×390 vérifient le débordement et les parcours, pas les performances d’un téléphone réel. Aucun framerate matériel n’est garanti.

Les modèles, costumes et PV officiels restent absents ; le scoring conserve rules4 et n’est pas une reproduction exhaustive de SEGA. Le catalogue est local, non une recherche Internet automatique. L’analyse ne sépare pas la voix et ne reconstruit pas exactement toutes les cartes de tempo/signature. Voir `AUDIT_MANQUANTS_V6.md` et `LIMITES_ET_COMPATIBILITE.md`.

## Reproduire les contrôles

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
xvfb-run -a python3 tests/automap_browser_test.py
xvfb-run -a python3 tests/precision_browser_test.py
python3 tests/automap_completion_test.py
```

Les tests navigateur exigent Python Playwright et Chromium installés ; Xvfb sert aux tests de rendu logiciel sous Linux sans affichage. Aucun script n’installe une dépendance ou ne modifie les autorisations de sécurité. Les autres suites historiques sont conservées et exécutables, mais seules les suites listées dans ce rapport contribuent aux compteurs courants.

Journaux : `qa/v6/all-unit.tap`, `automap-browser.json`, `completion-browser.json`, `launcher-results.json`, `summary.json` et `qa/v5/precision-browser.json`. Captures actuelles : `qa/v6/01-import-ready.png`, `02-family-report.png`, `03-library.png`, `04-studio-generated.png`, `05-real-autoplay.png`, `06-report-390.png`, `06-report-844.png`, `07-fallback-2d.png`.

## Identité du build testé

HTML autonome : **481,710 octets**. `index.html` et `DIVA_PULSE_JOUER.html` sont identiques.

```text
SHA-256 : ac49b9fb2cbe41cc39d9584fce6bfa077c59b1b20caab64508171ef2257f3593
```

Les SHA-256 du contenu complet sont dans `SHA256SUMS.txt`. L’archive finale est relue et chaque fichier est comparé à son empreinte après compression. Ces vérifications attestent l’intégrité des fichiers livrés, pas une certification logicielle générale.
