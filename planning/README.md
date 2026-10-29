# Suivi courant : V37

Classeur : [DIVA_PULSE_MANQUANTS_V37.xlsx](DIVA_PULSE_MANQUANTS_V37.xlsx).
136 points, 17 onglets et 16 tables : 50 faits dans leur périmètre, 27 partiels, 36 à faire, 23 à valider, soit 86 ouverts.
Les [JSON](BACKLOG_V37.json) et [CSV](MANQUANTS_V37.csv) portent les mêmes 136 lignes que le classeur. Les versions V30–V36 et leurs rapports committés restent historiques.

`SAV-08` passe de À valider à Partiel. Le Director protège les brouillons avant édition, y compris ceux d’un ancien pack : reprise compatible, export de la source, réassociation explicite des médias ou abandon. Les écritures refusées/annulées conservent la récupération ; les restaurations en copies gardent la provenance du brouillon. La matrice réelle complète des bibliothèques V22–V29 reste à qualifier.

`GAME-05` passe de À valider à Partiel. La fin conserve les données de sa prise avant le stockage, sépare les modes et profils, ordonne les records, protège les nouvelles parties et prépare les replays sans substitution de partition. Un changement d’onglet pendant un commit ne bloque plus les résultats d’une prise inchangée. Les replays chronologiques contrôlés sont reproduits ; les délais de livraison d’entrées et tous les anciens moteurs ne le sont pas. Aucun record historique n’est migré ni recalculé.

`ARC-04` reste Partiel. L’import contrôle désormais les versions Director embarquées dans les scènes, Auto Show et brouillons, en plus des bibliothèques 2–5 et du conteneur binaire 1. Les autres imports restent à harmoniser. Les critères, IDs, dépendances et autres lignes du suivi sont conservés.

La preuve courante est `qa/v37/verified.json`, liée au SHA-256 exact du HTML et du classeur. `tools/verify_pr37.py` exige 1 398 tests Node, 10 contrôles lanceur et 365 contrôles sur treize parcours navigateur, ainsi que la concordance Excel/JSON/CSV. La CI recrée ces preuves à partir du commit examiné et conserve les journaux et captures dans son artefact. Les onze suites héritées ne sont pas additionnées une seconde fois à leurs rapports historiques.

Les validations sur appareils physiques, la latence acoustique, les codecs, les quotas/évictions et le corpus MMD conservent leurs travaux restants. Aucun pourcentage de finition commerciale n’est déduit de ces compteurs. Voir le [guide V37](../docs/V37_PRISES_RECUPERATION.md) pour les comportements, preuves et limites.
