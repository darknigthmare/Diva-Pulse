# V38 — Finition jouable

## Périmètre

Ce lot ferme la boucle joueur sans modifier le moteur de rythme, le barème `rules4`, les formats sauvegardés ni les records existants. Il applique `input-systems`, `game-ui-ux`, `procedural-gen` et `save-systems` au moteur web maison.

Version de l'application : **38.0.0**. Formats inchangés : bibliothèque 5, conteneur binaire 1, Director 19/20, replay 1.

## Progression locale (`GAME-06`)

`src/progression.js` calcule un état **dérivé** depuis les records (`scores`), les sessions (`v3-state`) et les médailles d'académie (`v5-state`). Aucun compteur n'est incrémenté ni persisté : rejouer une partition ne crédite pas deux fois le même objectif, et une donnée corrompue est ignorée.

- Huit objectifs : premier concert, premier FULL COMBO, rang A, cinq morceaux, cinq difficultés, trois leçons, 500 points de bonus HOLD, dix partitions distinctes.
- Six niveaux (0 à 1 900 XP), deux modules cosmétiques : `AURORA` (800 XP), `EMBER` (1 300 XP).
- Panneau dans la bibliothèque, dialogue détaillé, verrou visible dans les modules.
- Aucun compte, aucun envoi. Les records assistés restent séparés.

## Académie étendue (`GAME-08`)

Deux leçons originales s'ajoutent aux six existantes : `07 · Rester dans la fenêtre` et `08 · Concert de contrôle`. Un guide « Calibrer & sauvegarder » relie les réglages de compensation et l'export de bibliothèque. Une académie déjà installée reçoit les nouvelles partitions sans duplication.

## Contenu original (`ART-06`, `PUB-05`)

Deux morceaux synthétisés localement : `MIDNIGHT DRIVE` (142 BPM) et `CORAL SIGNAL` (104 BPM). Ils rejoignent les trois démos existantes, avec cinq difficultés générées chacune. Aucun média tiers n'est ajouté. La provenance et les empreintes sont consignées dans [PROVENANCE_CONTENUS.md](PROVENANCE_CONTENUS.md).

## États d'erreur et états vides (`UX-06`)

`src/ui-states.js` ajoute un panneau d'erreur persistant avec **Réessayer**, **Copier le détail** et **Fermer**, sans modifier le texte ni le rôle du toast historique. Les recherches sans résultat proposent une action réelle (effacer la recherche, importer un audio, ouvrir l'académie).

## Preuves

- `tests/v38.test.cjs` : progression, seuils, absence de double crédit, entrées invalides, huit leçons, cinq démos déterministes.
- `tests/v38_browser_test.py` : démarrage HTTP natif, carte et dialogue de progression, académie, états vides, panneau d'erreur, verrous de modules, capture `qa/v38/progression.png`.
- `tests/precision.test.cjs` : le contrôle des leçons attend désormais huit partitions.
- `python3 build.py`, `npm test`, `python3 tests/launcher_test.py`, `python3 tools/verify_release.py`, `python3 tools/verify_pr38.py`.

## Limites

- Le parcours navigateur local n'a pas pu être exécuté dans l'environnement de rédaction (bibliothèques système Chromium absentes) : la CI de la PR l'exécute et produit `qa/v38/results.json`.
- Aucune validation matérielle, acoustique, Safari/Firefox ou lecteur d'écran.
- Les 25 partitions de démonstration ne sont pas évaluées par des joueurs (`QA-07`, `MAP-02`).
- La provenance des icônes PWA et la licence du dépôt restent à confirmer (`PUB-05` partiel).
