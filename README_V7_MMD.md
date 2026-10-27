# DIVA PULSE V7 — MMD Stage Edition

## MMD Stage
Le projet accepte des packs locaux contenant PMX/PMD, VMD, VPD et textures MMD. Les fichiers sont inspectés, classés et stockés avec le morceau. Offset, vitesse, caméra et physique sont configurables. Les sauvegardes `.pulsepack` incluent ces assets et remappent leurs identifiants lors d'une restauration.

### Formats
- PMX / PMD : modèle et métadonnées
- VMD : motion os/morph et détection des pistes caméra
- VPD : pose
- PNG/JPG/BMP/TGA/SPH/SPA : ressources de texture associées
- GLB : pipeline 3D existant conservé

### Limite importante de cette livraison
Le **gestionnaire de projets MMD est intégré**, mais le rendu complet PMX/VMD avec toon shader, IK et Bullet n'est pas encore embarqué dans le HTML autonome. Le jeu conserve donc son moteur GLB/procédural comme rendu de secours. Cette distinction est volontaire : aucun faux support de physique MMD n'est annoncé.

La cible technique retenue pour le runtime complet est `@yohawing/three-mmd-loader` (MIT), qui prend en charge PMX/PMD/VMD/VPD, caméra/lumière, IK et physique Bullet. Le projet MMD_modoki (MIT) sert de référence fonctionnelle pour le studio/timeline.

## Droits des assets
DIVA PULSE ne fournit pas de modèle, motion ou chanson MMD tiers. Chaque pack importé reste local. Respecter les licences et crédits imposés par les auteurs des modèles, textures, motions et personnages.
