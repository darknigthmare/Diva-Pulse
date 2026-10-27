# DIVA PULSE V11 — Rapport final de cette passe

## Résultat
- 271/271 tests Node : PASS
- 4/4 contrôles MMD WebGL réel : PASS
- 10/10 contrôles lanceur/serveur : PASS
- build autonome : zéro CDN, code inline

## Ajouts vérifiés
- interpolation Bézier VMD des os, par canal X/Y/Z/rotation ;
- interpolation Bézier VMD caméra : position, rotation, distance et FOV ;
- prise en charge des sphere maps PMX SPH (multiplication) et SPA (addition) quand leur contenu image est décodable par le navigateur ;
- fallback conservé pour les textures non décodables ;
- AutoMap, éditeur, académie et MMD Director V10 conservés sans régression détectée.

## Limites non maquillées
- SDEF exact non implémenté ;
- Bullet / rigid bodies / soft bodies non implémentés ;
- PMD reste inspection-only ;
- TGA n'est pas décodé nativement ;
- le toon shading reste une approximation et non un rendu pixel-perfect MikuMikuDance ;
- les sphere maps ont fait l'objet d'une validation shader/runtime, pas d'une comparaison pixel-perfect contre MMD Desktop.
