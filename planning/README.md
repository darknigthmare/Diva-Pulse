# Suivi V30 — PR #1

Le classeur `DIVA_PULSE_MANQUANTS_V30.xlsx`, le JSON et le CSV décrivent les mêmes 114 points. Les 22 lignes « Fait » portent sur des périmètres vérifiés, pas sur une certification du jeu entier. Les 92 autres restent partielles, à faire ou à qualifier.

Le manifeste `V30_DELIVERY_MANIFEST.json` est le reçu du **premier transfert**, avant la correction visuelle mobile et l'activation finale de la CI. Ce n'est pas le manifeste d'intégrité de la dernière révision.

Le build final prévu par cette passe a l'empreinte SHA-256 `797cf9923ddf47b6e8a9c08ffd895951fae4d9e7ec0f16c9f43ddcecee2ac36b`. Le classeur a l'empreinte `23a96415144c05b32d80c4cbc921bc164983e89ff68fbaeab5f4d0bca07c84b0`.

La preuve de validation native de chaque révision est son exécution **Pull request quality** : l'artefact contient `verified.json`, les trois rapports navigateur et les traces logiques. La vérification refuse les preuves périmées ou injectées pour le scénario HTTP natif. Les rapports `qa/v30/local-before-mobile` sont historiques et explicitement séparés. Aucun résultat historique n'est additionné au nouveau passage.

PR : https://github.com/darknigthmare/Diva-Pulse/pull/1
