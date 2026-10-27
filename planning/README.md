# Suivi des manquants

Classeur courant : [DIVA_PULSE_MANQUANTS_V33.xlsx](DIVA_PULSE_MANQUANTS_V33.xlsx). Versions lisibles : [JSON](BACKLOG_V33.json) et [CSV](MANQUANTS_V33.csv).

132 points, 15 onglets : 44 faits dans leur périmètre, 24 partiels, 39 à faire, 25 à valider, soit 88 ouverts. Les neuf ajouts réalisés V33 sont des travaux ciblés ; les objectifs globaux de performance, lisibilité et qualification matérielle restent ouverts. Ces compteurs ne sont pas un pourcentage de finition du jeu.

Les onglets historiques sont conservés. Les preuves locales V33 sont explicitement distinguées des nouvelles exécutions HTTP. La validation native finale doit être lue dans `qa/v33/verified.json` et rapprochée de l'empreinte du build. La simple présence d'un rapport V32 ne valide pas la V33.

Le classeur a été édité avec artifact_tool, rendu et inspecté. Son emballage ZIP est déterministe, sans modification des cellules lors du transport. Le vérificateur recoupe les statuts, identifiants et totaux calculés avec le JSON. Les classes de statut portent sur les critères écrits dans chaque ligne, pas sur une compatibilité MMD universelle.
