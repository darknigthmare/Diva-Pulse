# Preuves V36

`verified.json` est le reçu du contrôle complet `tools/verify_pr36.py`. Il exige 1 291 tests Node, 10 contrôles du lanceur et 284 contrôles navigateur. Il lie le SHA-256 exact des deux HTML autonomes, le classeur V36 et les 136 lignes identiques Excel/JSON/CSV aux résultats des tests du build.

`archive/results.json` décrit les restaurations et refus d'archives JSON/binaires, les remappages de références et de brouillons, les records historiques, un abandon réel de transaction après écriture, sa reprise puis la fermeture/réouverture du navigateur. Les petits médias synthétiques vérifient les octets et les liens ; ils ne qualifient pas les décodeurs, les quotas réels ni un corpus MMD complet.

`motion/results.json` décrit les préférences persistées et système, le refus de sauvegarde, les matrices effectivement envoyées au rendu WebGL, les pixels Canvas et les informations de jugement/HOLD conservées. Le GPU est logiciel et les préférences système sont émulées ; aucun appareil physique n'est certifié.

La CI recrée les onze parcours navigateur sur le même build : archives, mouvement, lecture V35 et huit régressions héritées. Elle conserve leurs rapports frais, les logs TAP, les captures produites par les suites et `commit.txt`, qui identifie le commit de la PR et le commit testé. Les anciens rapports committés sous `qa/v34` et `qa/v35` restent historiques ; le reçu local ne remplace pas la validation CI du commit publié.

Les contrôles hérités utilisent HTTP/IndexedDB et Web Audio natifs, sauf 23 contrôles Director sur document injecté. Certaines promesses et interruptions sont injectées pour rendre les courses reproductibles ; le worker WSOLA est exécuté. Le matériel, la latence acoustique, les navigateurs mobiles physiques et toutes les animations importées restent hors de cette preuve.
