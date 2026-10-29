# Suivi courant : V36

Classeur : [DIVA_PULSE_MANQUANTS_V36.xlsx](DIVA_PULSE_MANQUANTS_V36.xlsx).
136 points, 17 onglets : 50 faits dans leur périmètre, 25 partiels, 36 à faire, 25 à valider, soit 86 ouverts.
Les [JSON](BACKLOG_V36.json) et [CSV](MANQUANTS_V36.csv) V36 portent les mêmes lignes que le classeur. Les versions V30–V35 et leurs rapports de test restent historiques.

`SAV-10` passe de Partiel à Fait pour les références explicites des archives de bibliothèque V2–5 : versions, identifiants, destinations, propriétaires, liens médias et disponibilité dans les packs Director/Auto Show. Les refus avant décodage/écriture, les copies valides, les anciens brouillons conservés séparément et le rollback natif sont vérifiés dans les deux formats `.pulsepack` et `.pulsebundle`.

`ARC-04` reste Partiel, car les autres formats d'import restent à harmoniser. `GAME-05` reste À valider : la conservation des signatures de records est vérifiée, mais la matrice complète des modes assistés/replays ne l'est pas. `UX-05` reste Partiel : caméra finale, décor et préférences sont contrôlés ; les animations MMD/GLB et vidéos importées, le cadrage avancé et les appareils physiques restent ouverts. `SAV-08` conserve sa portée sur les migrations et récupérations entre versions.

La preuve courante est `qa/v36/verified.json`, liée au SHA-256 exact du HTML et du classeur. La CI la recrée à partir des onze parcours navigateur et des tests du commit examiné. Les petits médias synthétiques ne qualifient pas les codecs, les quotas ou évictions réels, les volumes de 1 Gio, Safari ou un corpus MMD. Aucun pourcentage de finition commerciale n'est déduit de ces compteurs.
