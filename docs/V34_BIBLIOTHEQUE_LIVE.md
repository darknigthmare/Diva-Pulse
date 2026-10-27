# V34 — Bibliothèque protégée et interruptions audio

## Nettoyage des médias
Réglages → Garder l’essentiel → Analyser les médias locaux. L’analyse ne supprime rien.
Le dialogue indique le nombre de médias, leur taille, les références manquantes et les candidats inutilisés.
Cocher explicitement les fichiers à retirer, confirmer la conservation d’une sauvegarde puis supprimer la sélection.
Les noms de fichiers sont affichés comme du texte ; ils ne peuvent pas injecter du HTML dans ce dialogue.

La recherche protège les références des morceaux, scènes GLB/MMD, clips, voix guides, réglages, scores et brouillons en mémoire. Par prudence, tout champ texte contenant exactement un identifiant média existant protège cet élément, même si le champ est inconnu. Cela peut conserver plus de médias que strictement nécessaire.

Toute modification persistante périme la revue. Au dernier moment, les références persistantes et les racines en mémoire sont relues dans la même transaction que les suppressions. Une nouvelle référence, une anomalie, une annulation ou l’absence du droit d’écriture provoque le refus global. Aucun morceau, score ou brouillon n’est supprimé. Une perte d’alimentation ou une éviction du navigateur n’est pas simulée par ce test d’annulation.

Les limites sont explicites : 5 000 médias et 500 000 nœuds parcourus, 80 niveaux d’imbrication ; au-delà, aucun nettoyage. L’interface affiche 200 candidats par lot, sans sélection automatique. Le diagnostic JSON exporté ne contient aucun octet de média. Des métadonnées personnelles telles que les noms et identifiants peuvent y apparaître : ne pas le publier sans vérification.

## Audio et gameplay
Une suspension/interruption audio met la partie en pause et empêche les nouvelles frappes. Un retour à l’état running ne relance pas le morceau : la reprise est explicite. Un contexte fermé est recréé. Une préparation audio devenue périmée après masquage de la page ne doit pas démarrer plus tard.
L’écoute du Director s’arrête lorsque la page est masquée ; son curseur et le brouillon sont conservés.

Des jauges HOLD par piste restent disponibles quand l’intensité décorative vaut zéro. Elles indiquent le maintien actuel sans modifier le bonus, le barème ni le replay. Elles sont désactivables dans le panneau de ressenti. Les mises à jour sont plafonnées et sans animation CSS.
Les sons de la signature choisie sont préparés silencieusement au lancement. Les anciennes voix et buffers sont libérés lors d’un changement de contexte avant de vérifier la limite de polyphonie. Cela ne mesure pas la latence acoustique matérielle.

## Tests et limites
`npm test` ; `python3 tests/launcher_test.py` ; `python3 tools/verify_release.py`.
Le parcours `tests/v34_browser_test.py` exécute 28 contrôles sur HTTP natif, dont un véritable abort après réussite de la requête de suppression. Le mode `PULSE_DOCUMENT_MODE=1` n’en exécute que 27 et déclare expressément que l’abort natif n’a pas été testé.
La CI doit produire `qa/v34/verified.json` sur le build courant. Les formats Director 19/20 et le barème restent inchangés. Root motion, retargeting, formations 3D, corpus MMD et qualification matérielle restent ouverts.

Références API consultées :
- https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction
- https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
- https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
