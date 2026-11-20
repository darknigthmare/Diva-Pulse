# Suivi courant : V38

Classeur : [DIVA_PULSE_MANQUANTS_V38.xlsx](DIVA_PULSE_MANQUANTS_V38.xlsx). 136 points, 17 onglets et 16 tables : **52 faits dans leur périmètre, 30 partiels, 31 à faire, 23 à valider, soit 84 ouverts**. Les [JSON](BACKLOG_V38.json) et [CSV](MANQUANTS_V38.csv) portent les mêmes 136 lignes que le classeur. Les versions V30–V37 et leurs rapports committés restent historiques.

`GAME-06` passe à Fait : progression locale dérivée, six niveaux, huit objectifs, modules AURORA et EMBER, sans compte ni double crédit. `UX-06` passe à Fait : erreurs actionnables et états vides uniformes.

`GAME-08`, `ART-06` et `PUB-05` restent Partiel. L’académie couvre désormais huit leçons et la calibration/sauvegarde, mais la compréhension par un nouveau joueur (`QA-07`) n’est pas testée. Les cinq démos originales ne sont pas évaluées par des joueurs (`MAP-02`). L’inventaire de provenance est publié, mais la provenance des icônes PWA et la licence du dépôt restent à confirmer.

La preuve courante est `qa/v38/verified.json`, liée au SHA-256 exact du HTML et du classeur. `tools/verify_pr38.py` exige 1 409 tests Node, 10 contrôles lanceur et 17 contrôles du parcours navigateur V38, ainsi que la concordance Excel/JSON/CSV. Le parcours navigateur est produit par la CI de la PR ; l’environnement de rédaction ne disposait pas des bibliothèques système Chromium. Les preuves V37 restent conservées telles quelles pour leur build.

Les validations sur appareils physiques, la latence acoustique, les codecs, les quotas/évictions, la localisation, le corpus MMD et la matrice réelle des anciennes bibliothèques conservent leurs travaux restants. Aucun pourcentage de finition commerciale n’est déduit de ces compteurs. Voir la [bible V1](../docs/BIBLE_DIVA_PULSE_V1.md) et le [guide V38](../docs/V38_FINITION_JOYABLE.md).
