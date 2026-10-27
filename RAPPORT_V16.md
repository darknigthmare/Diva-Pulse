# Rapport QA — DIVA PULSE V16

## Tests exécutés
- Suite Node historique + V16 : 281/281 PASS.
- Tests spécifiques V16 : 4/4 PASS (inclus dans les 281).
- Lanceur/serveur : 10/10 PASS.
- Smoke navigateur Playwright headless : application READY, 3 démos, 5 difficultés, aucune erreur JavaScript ; WebGL2 indisponible dans ce mode, fallback 2D utilisé.
- Suite automap_browser_test.py : non comptabilisée, car elle contient encore une assertion d'interface figée sur « AUTOMAP EDITION 6.0 » et n'est donc plus un oracle valide pour V16. Elle a été lancée sous Xvfb mais arrêtée sur cette assertion historique.

## Couverture V16
- parseur PMD complet minimal : géométrie, indices, matériaux, textures, os et IK ;
- normalisation Director conservant les formations ;
- timeline Director respectant les intervalles sans clip ;
- quantification sur segment tardif d'une tempo-map variable ;
- build autonome sans CDN.

## Limites
Aucune validation sur matériel physique (manette/MIDI), Safari/iPhone ou vrais packs MMD complexes n'est revendiquée dans cette passe. Le runtime PMD/TGA doit encore être confronté à une collection variée de modèles réels.
