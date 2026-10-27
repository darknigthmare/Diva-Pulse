# DIVA PULSE V16 — All Systems Edition

V16 reconstruit les travaux perdus après V14 et durcit les quatre axes actifs : AutoMap, MMD, Director et sauvegardes/QA.

## Principales évolutions
- PMD : parsing complet du socle géométrie/matériaux/squelette/IK pour le runtime, en plus de PMX.
- TGA : décodage local des TGA non compressés 8/24/32 bits dans le chargeur MMD.
- Director : modèles PMX/PMD distincts par slot, formations conservées après normalisation, intervalles sans clip réellement silencieux/masqués, visibilité/lead par section.
- AutoMap : quantification par tempo-map locale et modulation du budget de notes selon l'énergie des phrases, en conservant l'héritage EASY→EX EXTREME.
- Sauvegardes : le remappage des modèles/motions Director de V14 reste actif.

## Limites explicites
- La physique MMD complète Bullet (rigid bodies, joints, soft bodies) n'est pas intégrée.
- SDEF/QDEF ne sont pas revendiqués comme pixel-identiques à MMD Desktop.
- TGA RLE et formats TGA exotiques ne sont pas pris en charge par le nouveau décodeur.
- L'analyse musicale/structurelle reste heuristique et peut demander une correction manuelle.

Voir RAPPORT_V16.md pour les tests réellement exécutés.
