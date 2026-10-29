# Suivi courant : V35

Classeur : [DIVA_PULSE_MANQUANTS_V35.xlsx](DIVA_PULSE_MANQUANTS_V35.xlsx).
136 points, 17 onglets : 49 faits dans leur périmètre, 26 partiels, 36 à faire, 25 à valider, soit 87 ouverts.
Les [JSON](BACKLOG_V35.json) et [CSV](MANQUANTS_V35.csv) V35 portent les mêmes lignes que le classeur. Les versions V30–V34 et leurs rapports de test restent historiques.

`GAME-01` passe de À faire à Partiel : le contrat des règles maison est écrit et vérifié, sans certification d'une édition officielle. Les constats `GAME-03`, `GAME-04` et `UX-03` précisent les chaînes indépendantes de la cadence, les annulations audio et la visibilité des cibles. Leurs statuts restent respectivement À valider, Partiel et Partiel ; les qualifications matérielles ne sont pas déclarées terminées.

La preuve courante est `qa/v35/verified.json`, liée au SHA-256 exact du HTML et du classeur. La CI la recrée à partir des neuf parcours navigateur et des tests du commit examiné. Aucun pourcentage de finition commerciale n'est déduit de ces compteurs.
