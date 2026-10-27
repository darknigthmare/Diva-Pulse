# DIVA PULSE V11 — MMD Fidelity Edition

V11 conserve AutoMap et MMD Director V10 et améliore le runtime MMD natif.

## Ajouts
- interpolation Bézier VMD par canal pour translation/rotation des os ;
- interpolation Bézier VMD caméra (position, rotation, distance, FOV) ;
- sphere maps PMX `.sph` (multiplicatif) et `.spa` (additif) lorsque le navigateur peut décoder leur contenu image ;
- fallback explicite pour textures TGA non décodables ;
- trois tests de fidélité MMD supplémentaires.

## Limites maintenues explicitement
- SDEF reste approximé par le skinning linéaire existant ;
- Bullet / rigid bodies / soft bodies ne sont pas encore simulés ;
- PMD reste inspection-only ;
- le toon MMD n’est pas encore une reproduction pixel-perfect de MikuMikuDance.
