# DIVA PULSE V12 — Parallel Systems Edition

## Changements validés
- AutoMap produit des sections musicales communes avec rôle estimé: intro, couplet, montée, refrain, pont/calme, solo, final.
- Chaque section conserve énergie, densité et indice de confiance.
- MMD Director réutilise ces mêmes sections et varie la sélection de motions selon leur rôle.
- Le mapping rythmique et le spectacle restent non destructifs et séparés.
- Toute la base V11 est conservée: AutoMap 5 difficultés, MMD Director multi-PMX, VMD clips, Bézier VMD, sphere maps, studio, MIDI, entraînement et sauvegardes.

## QA réellement exécutée
- npm test: 272/272 PASS (inclut le nouveau test V12).
- test structurel V12 isolé: PASS.
- launcher_test.py: 10/10 PASS.
- build.py: PASS.
- Test WebGL MMD automatisé V12: NON EXÉCUTÉ dans cette session. Chromium headless ne fournit pas WebGL2 et le mode headed requiert un XServer absent. La V11 avait validé ce pipeline, mais ce résultat n'est pas réattribué à V12.

## Compatibilité MMD restant à faire
- SDEF exact.
- Bullet rigid bodies / joints / soft bodies.
- PMD rendu complet.
- TGA natif.
- Toon textures MMD exactes et comparaison visuelle de référence.

## Limite de l'analyse structurelle
Les rôles musicaux sont heuristiques (énergie/densité/spectre). Ils ne constituent pas une reconnaissance sémantique garantie des couplets/refrains.
