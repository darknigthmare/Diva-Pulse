# V37 — Prises fiables et brouillons protégés

## Périmètre

Ce lot poursuit l’application de `save-systems` et `game-ui-ux` au moteur web maison. Il traite la fin des prises et les records/replays (`GAME-05`), la récupération des brouillons Director (`SAV-08`) et le refus de versions Director embarquées incompatibles (`ARC-04`).

La version du jeu est 37.0.0. Les formats conservent leurs versions propres : bibliothèque 5 avec lecture des versions 2–5, conteneur binaire 1, Director 19/20 et replay 1. Le contrat `rules4` reste décrit dans [REGLES_DIVA_PULSE_V1.md](REGLES_DIVA_PULSE_V1.md).

## Une fin de prise liée à ses propres données

Le résultat, le mode, les options du moteur, la partition jouée et les entrées doivent appartenir à la prise terminée. L’éligibilité d’un record ne doit pas dépendre d’un réglage modifié ensuite. En particulier, une prise Sans échec ne devient pas une prise normale parce que la case utilisateur a changé avant son enregistrement.

Les données nécessaires sont capturées avant l’attente du stockage. Le résultat peut être sauvegardé lorsque le joueur a déjà quitté son écran, mais sa finalisation ne doit pas rouvrir cet ancien écran, arrêter le nouvel audio ou modifier les informations d’une nouvelle prise. Les enveloppes qui produisent replay, historique, résumé d’entraînement, académie et profil doivent respecter la même identité de prise.

La génération qui identifie une prise est distincte de celle qui annule une préparation audio. Masquer l’onglet ou perdre le focus doit arrêter l’audio sans invalider le résultat de la même prise déjà terminée ; une nouvelle préparation ou une navigation invalide au contraire son affichage tardif. Les résumés d’entraînement affichés appartiennent uniquement à la prise courante.

Les écritures de records sont ordonnées pour qu’un ancien résultat encore en attente ne remplace pas un meilleur résultat plus récent. Un replay prépare sa partition enregistrée sans substitution temporaire dans les partitions de la bibliothèque.

## Un ancien brouillon reste une décision explicite

Un morceau conserve un seul brouillon Director de récupération. L’ouverture du Director doit lire ce brouillon avant d’autoriser les modifications qui pourraient le remplacer. Un brouillon appartenant à un ancien pack demeure visible et protégé.

Le parcours permet de reprendre une récupération compatible, d’exporter la source, de l’écarter explicitement ou de choisir les références nécessaires à une réassociation au pack courant. Les associations de modèles et motions sont choisies par le joueur. Une réassociation conserve les données de montage prises en charge et reste un brouillon ; publier la scène demeure une action distincte.

Un refus d’écriture conserve l’ancien brouillon. Fermer le dialogue ou recevoir une lecture tardive ne doit pas modifier un autre Director ouvert entre-temps. La restauration d’une archive conserve l’origine étrangère d’un brouillon ; elle remappe vers le nouveau pack seulement l’identité qui correspondait au pack du morceau source.

## Versions Director embarquées

L’archive contrôle aussi les documents Director contenus dans les scènes, Auto Show et brouillons. Les documents historiques sans version et sans phase, ainsi que les versions 19 et 20 prises en charge, restent lisibles. Une version explicite inconnue ou une phase de boucle incompatible avec le schéma déclaré doit être refusée avant toute écriture.

Ce contrôle se situe à la frontière d’import. La normalisation utilisée par les éditions légitimes, notamment l’ajout de phases nécessitant le schéma 20, conserve son rôle. Une source refusée doit rester exportable sans conversion silencieuse.

## Preuves et limites

Les suites dédiées sont `tests/director-recovery.test.cjs`, `tests/v37-record-replay.test.cjs`, `tests/v37_recovery_browser.py` et `tests/v37_record_replay_browser.py`. Les rapports natifs sont `qa/v37/recovery/results.json` et `qa/v37/records-replays/results.json`.

`tools/verify_pr37.py` exige des résultats du même build, les treize parcours navigateur, le classeur exact et la concordance des 136 lignes Excel/JSON/CSV. Les nombres définitifs et statuts sont consignés dans le [suivi courant](../planning/README.md) et le reçu `qa/v37/verified.json`.

Les attentes de stockage et certains événements sont différés volontairement pour reproduire les courses. Les contrôles distinguent les opérations IndexedDB natives, les simulations en mémoire et les documents injectés hérités. La matrice réelle complète des anciennes bibliothèques V22–V29, les quotas/évictions, les appareils physiques, la latence acoustique et le corpus MMD restent hors de cette qualification.
