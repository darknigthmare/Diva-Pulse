# Rapport V7

- 257/257 tests Node réussis (253 hérités + 4 MMD).
- Build autonome réussi, sans CDN requis pour le jeu de base.
- Smoke navigateur réussi : application chargée, bibliothèque et scène de secours fonctionnelles, aucune erreur JS capturée.
- Nouveau parseur/inspecteur : PMX, PMD, VMD, VPD.
- Import multi-fichiers MMD par morceau, classement model/motion/camera/pose/texture.
- Contrôle de durée motion vs chanson, offset, vitesse, caméra et physique préparés.
- Assets MMD inclus dans les sauvegardes et IDs remappés à la restauration.

## Non validé / non implémenté
- rendu PMX/PMD complet dans la scène ;
- application VMD aux os/morphs ;
- IK/physics Bullet ;
- caméra VMD réellement rendue ;
- tests avec modèles MMD tiers réels et leurs textures.

Ces points nécessitent l'intégration du runtime MMD tiers retenu et restent explicitement signalés dans l'interface/documentation.
