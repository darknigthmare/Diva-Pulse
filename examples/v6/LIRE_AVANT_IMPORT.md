# Exemples V6 — audio original et partitions de contrôle

## Import automatique sans catalogue

Importer seulement `NEON_STEPS_128_ORIGINAL.wav` avec la case « 5 difficultés automatiques » cochée. Cet instrumental original dure 36 secondes et contient une pause volontaire. Les réglages par défaut produisent une famille de cinq niveaux ; la QA de cette version a obtenu 41 / 61 / 97 / 139 / 179 notes sur le PCM de référence.

Les JSON EASY, NORMAL, HARD, EXTREME et EX_EXTREME sont les résultats du même générateur sur le PCM d’exemple. `NEON_STEPS_RAPPORT_MAPPING.json` donne le contrôle structurel et les alternatives de tempo. Des différences de décodage ou rééchantillonnage entre navigateurs peuvent changer une détection près d’un seuil ; ne pas présenter les compteurs comme une garantie universelle d’analyse.

## Priorité à des niveaux déjà préparés

Importer `NEON_STEPS_128_AUTOMAP.pulsecharts` dans « Partitions disponibles », puis le WAV. Les cinq niveaux sont associés par l’empreinte exacte, sans régénération. Le catalogue n’inclut pas la musique ; il se partage séparément. Ce sont des niveaux AutoMap d’exemple, pas des niveaux officiels.

Importer `SOURCE_EXACTE_100_HARD.pulsecharts`, puis `SOURCE_EXACTE_100.wav`. Le niveau HARD manuel de douze frappes est conservé ; les quatre autres difficultés sont générées. Elles ne sont pas annoncées comme imbriquées dans ce HARD de référence : la cohérence de famille ne concerne que les niveaux générés ensemble.

## Cas de QA, volontairement non musicaux

`MODE_MANUEL_156.wav` est un signal court de contrôle. `SILENCE_3_SECONDES.wav` doit donner un audio à compléter et aucun faux niveau prêt. `AUDIO_INVALIDE.wav` n’est délibérément pas un fichier audio : le décodeur doit le refuser. `SHA256_AUDIO.json` contient les empreintes attendues.

Les scripts `tests/make_v6_fixtures.py` et `tests/build_v6_examples.cjs` reproduisent ces sources et les partitions. Aucun média tiers n’a été téléchargé.
