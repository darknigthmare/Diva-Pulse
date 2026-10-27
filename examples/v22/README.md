# Diagnostics PMX originaux V22

Importer SURFACE_TEST.pmx, COLOR.tga et les VMD ensemble. Deux matériaux, six sommets et un os de contrôle. Aucun personnage tiers redistribué.

UV_SHIFT.vmd : déplacement UV0. FADE.vmd : transparence des deux matériaux. GROUP.vmd : combinaison des deux. Durée : deux secondes. Exemple de calage : 120 BPM, premier temps 0, boucle de 4 temps. Un modèle invisible à la fin d’un fondu est un comportement attendu.

Générateur reproductible : `node tests/v22-fixtures.cjs`.
