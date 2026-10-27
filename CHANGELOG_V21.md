# V21 / 21.0.0

Base : archive V20 Auto Show fournie dans la conversation.

- Lecteur ZIP local borné : store/DEFLATE, CRC, chemins, noms japonais/UTF-8 et champ Unicode Path.
- Prévalidation du pack et aperçu 3D sans sauvegarde ; jusqu’à quatre modèles sélectionnés.
- Diagnostics d’os/motions, textures, morphs, SDEF/QDEF approximés, contraintes non appliquées.
- Validation PMX/PMD/VMD renforcée avant les allocations coûteuses.
- Chemins relatifs aux dossiers parents réparés sans autoriser de sortie du pack.
- Décodage des poses VPD japonaises ; WebP dans la sélection des textures.
- Palette MMD portée à 1024 os ; fixture binaire 300 os testée dans WebGL2.
- Maillage GPU partagé entre les matériaux ; mise à jour de morphs non dupliquée par matériau.
- Troupe par défaut opt-in pour les nouvelles musiques, pas de réécriture des scènes existantes.
- Remappage de la préférence de troupe lors d’une restauration complète.
- Correction du chargement asynchrone des textures : aucune liaison WebGL ne traverse une attente de décodage, évitant d’écraser la palette d’os pendant le rendu.
- Confirmation explicite de remplacement et de textures manquantes ; import atomique.
- Interface responsive de diagnostic et preview ; repli sans WebGL2 annoncé.

AutoMap, Auto Show, scène manuelle, Director, catalogues, éditeur et sauvegardes V20 conservés. Pas d’ajout de Bullet, d’effets MME ni de retargeting universel.
