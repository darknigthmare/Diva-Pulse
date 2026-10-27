# Rapport de livraison V29 — 27 octobre 2026

## Reprise vérifiable

L’archive `DIVA_PULSE_V28_CONTINUITE_REPRISE_COMPLET.zip` a été récupérée, contrôlée puis restaurée dans le dépôt `darknigthmare/Diva-Pulse`. Les fichiers existants n’ont pas été écrasés par la restauration. Sources, exemples, documentation et historique des tests ont été conservés.

- SHA-256 de l’archive V28 : `8ffcf4816f602c90b4666585d2d38d269e7614ee10dc4d825b21c8b31187ddf0`.
- Commit de restauration : `3ebe790908de5e383364b199c6ec98e714f40e0b`.
- Commit des sources V29 : `8709318ede494f5c7e5355371bf3cd2e0eab5ae9`.
- CI V29 vérifiée : https://github.com/darknigthmare/Diva-Pulse/actions/runs/40498154007.

## Fonctionnalités ajoutées

Le module `src/director-edit.js` définit des opérations immuables de sélection, copie, collage, déplacement et suppression. Les références distinguent clips par danseur, caméra et lumière. Le collage place le premier événement au curseur et préserve les décalages relatifs. Il n’effectue pas encore de transfert de clips entre danseurs.

Les erreurs de sélection, valeurs non finies, collisions et dépassements sont refusés sans mutation du brouillon précédent. Une opération validée reste annulable. Les sélections sont effacées après toute modification structurelle pour ne pas cibler des index devenus obsolètes.

La publication produit deux écritures atomiques : la scène du morceau et le marqueur d’application du brouillon. Le morceau en mémoire n’est remplacé qu’après réussite de la transaction. Ce marqueur empêche une récupération obsolète et n’est pas exporté comme brouillon actif.

L’interface comporte des contrôles groupés, une grille de curseur au BPM courant et un message d’état qui ne recouvre plus les commandes. La migration de sources V28 vers V29 est idempotente ; elle ne modifie pas les données du navigateur.

## Résultats observés

| Test | Succès | Échecs | Environnement / portée |
|---|---:|---:|---|
| Suite logique V29 | 810 | 0 | Node 22 ; inclut les 782 tests V28 |
| Parcours Director | 23 | 0 | Chromium avec SwiftShader ; import PMX/VMD et rendu natif |
| Persistance native | 14 | 0 | Chromium Linux CI, serveur HTTP et profil persistant |
| Lanceur | 10 | 0 | Serveur loopback, collision de port, en-têtes et fichiers |
| Cohérence de livraison | Réussie | 0 | Version, construction déterministe, HTML identiques |

Les tests de persistance ferment entièrement le navigateur puis le rouvrent, comparent les octets d’un média, contrôlent le refus d’écriture dans une seconde fenêtre, le transfert du verrou après fermeture du premier écrivain et le rechargement hors ligne via le service worker. Les parcours Director vérifient aussi un échec de sauvegarde puis une reprise réussie.

La navigation locale était bloquée dans l’environnement de travail. Le contrôle natif a donc été effectué par GitHub Actions, sans contourner ce blocage. Les JSON de résultats distants et leur empreinte de build ont été relus.

La validation à largeur 390 × 844 ne constitue pas une validation Safari ou iPhone. SwiftShader n’est pas une certification GPU matériel. Les anciennes campagnes navigateur V28 n’ont pas été rejouées intégralement dans cette passe.

## Empreintes et reproduction

- Version : `29.0.0`.
- Taille de chaque HTML autonome : **828 724 octets**.
- `index.html` et `DIVA_PULSE_JOUER.html` sont identiques.
- SHA-256 : `6b22f0cab9ab1123d037a618a7339a8de3c855e5c2f8d75992a0531e165eaf01`.

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tools/verify_release.py
python3 -m pip install -r requirements-test.txt
python3 -m playwright install --with-deps chromium
# Définir CHROMIUM_PATH vers l’exécutable Chromium installé.
xvfb-run -a python3 tests/v29_browser_test.py
xvfb-run -a python3 tests/v29_persistence_test.py
```

Les captures et rapports sont sous `qa/v29/`. La CI ne doit publier une version générée qu’après réussite de toutes ses vérifications.

## Plan détaillé

`docs/DIVA_PULSE_SUIVI_COMPLET.xlsx` est le classeur principal. Les 90 lignes sont un inventaire opérationnel des manquants identifiés et validations à reprendre, non une promesse d’exhaustivité absolue. À sa publication : 50 sujets à faire, 14 partiels, 24 à valider, 1 validé sur Chromium et 1 optionnel ; 53 priorités P1 restent ouvertes.

Les 7 onglets sont Synthèse, Plan_détaillé, Livré_V29, Audit_historique, Validation, Compat_MMD et Mode_emploi. Le plan contient travaux, critères d’acceptation, dépendances, preuve, références d’audit, périmètre et responsable. Les JSON/CSV sont des instantanés lisibles en revue de code ; après édition du classeur, leur synchronisation reste à maintenir.

Les prochains axes majeurs sont la validation sur appareils réels, les cas MMD complexes et corpus autorisés, le retargeting et la physique avancée, le lipsync phonétique, la qualité musicale humaine des partitions/spectacles générés et le contenu final. Les fonctions limitées ne sont pas marquées terminées au seul motif qu’un test synthétique passe.
