# Preuves V37

`verified.json` est le reçu du contrôle complet `tools/verify_pr37.py`. Il lie le build autonome et le classeur exact aux résultats du commit examiné. Le workflow recrée les treize parcours navigateur et compare les 136 lignes Excel/JSON/CSV.

`recovery/results.json` décrit la protection et les choix explicites de récupération Director, la réassociation, le refus de versions embarquées incompatibles et les écritures interrompues. `records-replays/results.json` décrit la séparation des modes et profils, la conservation de la prise pendant une attente du stockage et la protection d’une nouvelle partie.

Les attentes de lecture/écriture sont volontairement différées pour rendre les courses reproductibles. Les rapports précisent leurs contrôles HTTP/IndexedDB natifs et l’empreinte du build chargé. Les onze suites héritées sont relancées ; leurs rapports frais, journaux et captures sont conservés dans l’artefact CI. Les rapports déjà committés sous les répertoires V34–V36 restent historiques.

`commit.txt` relie le head de la PR au commit effectivement testé par GitHub. Le reçu local ne remplace pas la validation CI de la révision publiée. Les tests n’apportent pas de certification des appareils physiques, de latence acoustique, des quotas/évictions ou du corpus MMD et des anciennes archives complet.

## Contrôles exigés

| Ensemble | Nombre |
| --- | ---: |
| Tests Node | 1 398 |
| Lanceur | 10 |
| Récupération Director | 45 |
| Records et replays | 36 |
| Archives | 76 |
| Mouvement réduit | 22 |
| Autres parcours hérités | 186 |
| Total navigateur, sans double comptage | 365 |

La V37 ajoute 107 tests Node et 81 contrôles navigateur. Le reçu `verified.json` n’est produit que lorsque tous les ensembles exigés réussissent sur le même build et que le classeur correspond à son empreinte attendue.

## Correction du chargement de l’icône

Le premier passage CI de V37 a signalé une erreur console HTTP 404. Une seconde exécution, avec les mêmes assertions et un diagnostic enrichi, a identifié la requête implicite `/favicon.ico` au démarrage sous Chrome 156 : [journal de diagnostic](https://github.com/darknigthmare/Diva-Pulse/actions/runs/40931179457).

L’icône PNG existante est désormais embarquée en `data:` dans le template et les deux HTML autonomes. Le test conserve le refus des erreurs console ; il enregistre aussi leur emplacement, le dernier contrôle effectué et les réponses HTTP en erreur. Les preuves courantes sont régénérées sur le build corrigé, sans modifier les compteurs ni les statuts du suivi.
