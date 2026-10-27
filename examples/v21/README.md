# Packs de diagnostic originaux V21

Ces petits fichiers sont des fixtures produites pour DIVA PULSE. Ils ne contiennent pas de modèle Vocaloid officiel.

`TROUPE_ORIGINALE_V21.zip` : deux robots PMD à quatre os, une motion VMD et une texture TGA. Les modèles sont dans `PULSE_PACK/models`, la texture dans `PULSE_PACK/tex` et la motion dans `PULSE_PACK/motions`. Le chemin `../tex/DIAG.tga` teste la résolution des dossiers parents. Importer ce ZIP dans Modules → MMD Stage.

`TEXTURE_MANQUANTE_V21.zip` : même exemple amputé volontairement de sa texture. La confirmation doit exiger l’acceptation explicite du rendu dégradé. Ne pas utiliser ce pack pour remplacer une vraie troupe sans sauvegarde.

`MODEL_INVALIDE_V21.zip` : fichier PMD tronqué volontairement ; l’import doit être bloqué.

`SQUELETTE_300_OS.pmd` + `MOTION_300_OS.vmd` : un triangle contrôlé par l’os 299. Test de la palette supérieure à 256 os, pas un personnage détaillé.

Le script `tests/v21-fixtures.cjs` recrée ces exemples. La suite `tests/v21-import.test.cjs` utilise aussi des archives mémoires pour vérifier les CRC, ZIP stockés/DEFLATE, chemins dangereux, encodages japonais, duplications et limites.
