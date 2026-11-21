# V39 — Première visite et accessibilité mesurable

## Périmètre

Ce lot ouvre une entrée de première visite (`GAME-12`) et rend l'accessibilité mesurable sur le build publié (`UX-08`, `UX-09`). Il ne touche ni au moteur de rythme, ni au barème `rules4`, ni aux formats sauvegardés. Version de l'application : **39.0.0**. Formats inchangés : bibliothèque 5, conteneur binaire 1, Director 19/20, replay 1.

## Première visite (`GAME-12`)

`src/first-visit.js` ajoute une carte **non bloquante** dans la bibliothèque :

- quatre glyphes expliqués en toutes lettres (△, □, ×, ○) avec les touches `D F J K` ;
- `HOLD` et `CHAIN` décrits en texte, sans dépendre d'une couleur ;
- un bouton principal qui sélectionne le premier morceau disponible et lance le live : **un clic** mène à la première note (`CLICKS_TO_FIRST_NOTE = 1`, plafond du critère : trois) ;
- `PASSER` masque la carte et conserve le choix ; `Comment jouer ?` propose `REVOIR LA PREMIÈRE VISITE` ;
- aucun minuteur, aucun envoi réseau, aucun compte.

Comportement sans stockage local : `readState` et `writeState` encapsulent `localStorage` dans un `try/catch`. Si le stockage est absent ou refuse l'accès, la carte revient à l'ouverture suivante, aucune exception n'est levée et la bibliothèque reste utilisable. Un contenu stocké illisible est ignoré.

La carte ne recouvre jamais la bibliothèque : les cartes de morceaux et `LANCER LE LIVE` restent actifs quand elle est visible.

## Mesures d'accessibilité (`UX-08`)

`tests/v39_a11y.test.cjs` vérifie statiquement les jetons de thème, le focus, les tailles de cible et les règles de reflow. `tests/v39_a11y_browser.py` mesure le DOM construit des vues **bibliothèque, réglages et résultats** et écrit `qa/v39/accessibility/browser.json`. L'écran de résultats est rempli avec des valeurs représentatives dans le même DOM, pas par une partie complète jouée.

| ID | Contrôle | Seuil |
| --- | --- | --- |
| C1 | Contraste du texte, trois vues | 4,5:1 |
| C2 | Focus clavier visible | contour 2 px |
| C3 | Cibles interactives, trois vues | 24 px ; 44 px pour les actions principales |
| C4 | Reflow | aucun défilement horizontal à 320 px (bibliothèque, réglages, résultats) |
| C5 | Zoom | 200 % sans défilement horizontal |
| C6 | États actifs | attribut DOM (`aria-current`, `aria-pressed`, `role=progressbar`), pas la couleur seule |
| C7 | Surfaces non textuelles | 3:1 |
| C8 | Ordre de focus | aucun piège détecté sur 30 tabulations |

Les règles `@media (max-width:720px)` réorganisent la bibliothèque, les réglages, l'éditeur et les résultats. Aucun `overflow-x:hidden` n'est utilisé pour masquer un débordement.

## Rapport par build (`UX-09`)

`python3 tools/a11y_report.py` écrit `qa/v39/accessibility/report.json` avec la version, le `buildSha256` de `index.html` et le commit. Les contrôles statiques sont toujours évalués ; C1–C8 passent en `browser` quand la mesure navigateur du même build est présente, sinon C4, C5 et C8 restent `pending`.

`python3 tools/verify_pr39.py` refuse un rapport absent, produit sur un autre build, ou contenant une mesure en échec. Il exige aussi la preuve navigateur `qa/v39/results.json` et la triple cohérence classeur/JSON/CSV.

## Preuves

- `python3 build.py` : deux sorties identiques, sans CDN.
- `npm test` : 1 423 tests logiques, dont 7 pour la première visite et 7 pour les contrôles statiques d'accessibilité.
- `python3 tests/launcher_test.py` : 10 contrôles.
- `python3 tools/verify_release.py` : build déterministe et empreinte.
- `tests/v39_browser_test.py` : première visite, un clic, saut, rejeu, stockage hostile.
- `tests/v39_a11y_browser.py` : mesures C1–C8.

Les résultats navigateur ont été exécutés localement le 21 novembre 2026 avec Chromium headless 159 (Playwright), sur le build `2d03838…` : 16 contrôles de première visite et 9 mesures C1–C8, toutes réussies, avec les journaux et captures sous `qa/v39/`. La CI de la PR les rejoue sur le commit publié ; les preuves locales ne remplacent ni un appareil physique ni une session humaine.

## Limites

- Aucune conformité WCAG n'est revendiquée : le rapport est un relevé technique, pas un audit.
- Le canvas de jeu, les lecteurs d'écran, le daltonisme réel et les appareils physiques restent hors preuve (`UX-04` partiel).
- `GAME-12` reste **Partiel** : cinq sessions humaines `QA-07` doivent mesurer la compréhension et le temps `ready` → première note ; un test navigateur ne mesure pas la compréhension.
- `QA-13` reste **Partiel** : le protocole, le formulaire et la grille sont écrits, leur relecture indépendante reste à faire avant la première session ; aucune session n'est tenue.
- La latence acoustique, les codecs et la matrice réelle des anciennes bibliothèques conservent leurs travaux restants.
