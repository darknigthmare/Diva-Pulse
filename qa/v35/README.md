# Preuves V35

`verified.json` est le reçu du contrôle complet `tools/verify_pr35.py` : 1 200 tests Node, 10 contrôles du lanceur et 186 contrôles navigateur sur le même SHA-256 HTML, ainsi que le classeur exact et ses 136 lignes identiques au JSON/CSV.

`playback/results.json` décrit les 22 nouveaux contrôles de démarrage, boucle et reprise. Les huit suites héritées restent exécutées et leurs résultats sont conservés dans l'artefact CI, avec les logs TAP, les captures et le fichier `commit.txt` identifiant le commit de la PR et le commit de checkout. Le workflow recrée les preuves pour chaque révision ; le reçu local commité ne remplace pas sa validation.

Les contrôles utilisent HTTP/IndexedDB et Web Audio natifs, sauf les 23 contrôles Director hérités sur document injecté. Certaines promesses sont différées et la visibilité est injectée pour rendre les courses reproductibles ; le worker WSOLA est réellement exécuté. Le GPU est logiciel. Aucun périphérique physique ni délai acoustique n'est qualifié.
