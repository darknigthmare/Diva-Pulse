# Rapport QA — DIVA PULSE V8 MMD Runtime Edition

## Tests exécutés
- Node : 260/260 réussis.
- Runtime MMD navigateur : 4/4 réussis sous Chromium + WebGL2 logiciel.
- Lanceur local : 10/10 réussis.

## Runtime MMD navigateur vérifié
1. Un PMX diagnostic minimal est réellement rendu par le moteur WebGL.
2. Une motion VMD modifie réellement la transformation d'un os PMX.
3. Le rendu MMD ne produit pas d'erreur WebGL sur le scénario de diagnostic.
4. Les contrôles caméra VMD, IK et boucle de motion sont présents.

Le PMX/VMD de diagnostic est original et inclus uniquement pour QA.

## Non certifié
- Modèles MMD complexes de production provenant de créateurs tiers.
- PMD rendu (inspection seulement).
- Physique Bullet / rigid bodies / soft bodies.
- SDEF exact, courbes Bézier VMD exactes, sphere maps et toon MMD exhaustifs.
- Safari/iPhone et périphériques physiques.

Ces limites sont affichées afin de ne pas présenter une compatibilité MMD complète alors qu'elle ne l'est pas encore.
