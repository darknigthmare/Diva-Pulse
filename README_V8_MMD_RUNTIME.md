# DIVA PULSE V8 — MMD Runtime Edition

## Nouveau runtime MMD natif
- PMX 2.0/2.1 : géométrie, matériaux, textures PNG/JPEG, squelette et skinning BDEF1/BDEF2/BDEF4.
- SDEF : chargé avec approximation BDEF2 ; QDEF est traité comme BDEF4.
- VMD : os, morphs de sommets, morphs d'os et caméra, synchronisés à l'horloge musicale.
- VPD : pose initiale.
- IK : solveur CCD borné activable/désactivable.
- Caméra VMD activable/désactivable, offset et vitesse de motion, boucle facultative.
- GLB et silhouettes procédurales restent les fallbacks.

## Limites explicites
- PMD : inspection/bibliothèque seulement dans cette version ; rendu natif PMX prioritaire.
- Physique Bullet / rigid bodies et soft bodies : non rendus.
- SDEF n'utilise pas encore sa formule exacte.
- Interpolation VMD : linéaire/slerp ; courbes Bézier MMD non reproduites exactement.
- Sphere maps .sph/.spa, toon partagé et TGA ne sont pas reproduits exactement.
- 256 os maximum pour le chemin GPU actuel.

## AutoMap
Le workflow V6 reste présent : importer une musique peut produire automatiquement une famille cohérente EASY/NORMAL/HARD/EXTREME/EX EXTREME. Les partitions exactes déjà associées à l'audio restent prioritaires.

## Références open source étudiées
- yohawing/three-mmd-loader — MIT — PMX/PMD/VMD/VPD, IK, toon, caméra/lumière, Bullet.
- moeru-ai/three-mmd — MIT — runtime MMD Three.js et plugins de physique.

DIVA PULSE n'embarque aucun modèle, motion ou musique tiers dans cette livraison. Les droits des assets MMD importés restent ceux de leurs auteurs.
