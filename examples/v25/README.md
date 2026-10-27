# Diagnostics originaux V25

Les modèles et sons de ce dossier ont été fabriqués pour les tests de DIVA PULSE. Ils ne représentent aucun personnage officiel et ne sont pas des assets Vocaloid finalisés.

Importer `FACE_ROBOT.pmx` dans Modules → MMD Stage, puis ouvrir **VISAGE · AUDIO / CLÉS MANUELLES**. Charger `VOIX_SYNTHETIQUE_TEST.wav` comme voix guide : le signal est actif entre une et sept secondes, par impulsions. Le nom « voix synthétique » désigne ici un signal de contrôle sans phonèmes.

Les VMD à zéro servent à vérifier qu’une expression déjà confiée à la motion reste prioritaire. `Talk` contrôle le groupe du morph `mouthOpen`.

`EXEMPLE_FACE_MANUELLE.pulseface.json` peut être importé dans le panneau du visage pour créer trois ouvertures manuelles. La sauvegarde n’est appliquée qu’après confirmation.

Les fichiers sont reproductibles avec `node tests/v25-fixtures.cjs`. Le modèle dispose ses surfaces faciales vers la caméra frontale après conversion du repère PMX. Sa géométrie reste rudimentaire et ne sert pas de référence esthétique.
