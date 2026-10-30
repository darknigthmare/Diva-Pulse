# Consignes de développement — Diva Pulse

Ces consignes adaptent le catalogue gamedev aux sources de ce dépôt. Les demandes explicites de l'utilisateur définissent le périmètre du travail.

## Lire et sélectionner

1. Lire `README.md`, `package.json`, `build.py` et le suivi courant sous `planning/`. Identifier la branche, le SHA et les changements déjà présents.
2. Lire [le guide du projet](docs/GUIDE_DEVELOPPEMENT_GAMEDEV.md) et [la sélection des fiches](docs/GAMEDEV_SKILLS_SELECTION.json). Choisir seulement les disciplines utiles à la tâche ; consulter leur contenu à la révision indiquée avant de l'appliquer.
3. Relier chaque changement aux fichiers et aux identifiants existants du backlog. Décrire le comportement attendu et la preuve qui permettra de le vérifier.
4. Inspecter une fonction voisine et ses tests avant de reprendre un exemple externe. Si une fiche distante est inaccessible, s'appuyer sur les règles locales et signaler cette limite sans prétendre l'avoir consultée.

## Architecture à respecter

- Diva Pulse V37 est un moteur web maison en JavaScript : Canvas 2D, WebGL 2 direct et Web Audio. `package.json` n'installe aucun moteur de runtime. Le routeur amont prévoit ce cas dans `router/references/custom-engines.md`.
- Modifier les sources sous `src/`, puis générer `index.html` et `DIVA_PULSE_JOUER.html` avec `python3 build.py`. Conserver les deux sorties identiques et l'exécution autonome sans CDN.
- Lire l'ordre des scripts dans `src/template.html` et `build.py` : plusieurs extensions historiques enveloppent des méthodes existantes. Le numéro dans un nom de fichier ne prouve pas qu'il est obsolète.
- Les exemples Godot, Unity, Unreal ou Three.js servent à comprendre un concept. Les API concrètes viennent du code web du projet ; une migration de moteur nécessite une demande spécifique.

## Invariants du jeu musical

- Le temps musical et l'horodatage des entrées déterminent les jugements. Lire `AudioTransport` dans `src/services.js`, ses extensions dans `src/enhancements.js` et le flux réel dans `src/app.js` ; préserver les conversions, offsets et vitesses de lecture.
- Les effets, transitions et caméras restent une couche de présentation. Préserver scores, journaux de replay, signatures de partitions et instants des notes. Ne pas transposer le hit-stop, le coyote time ou un buffer de saut aux jugements rythmiques.
- Maintenir les pauses V34 sur interruption audio et la reprise explicite. Un retour du contexte audio à l'état actif ne relance pas automatiquement le morceau ; une préparation périmée ne démarre pas après la sortie du jeu.
- Conserver les informations utiles lorsque les effets sont réduits ou coupés, notamment les jauges HOLD. Respecter les réglages de mouvement et les limites de ressources existantes avant d'ajouter un effet.
- AutoMap et Auto Show produisent des données reproductibles. Respecter les pistes et clés manuelles verrouillées ; conserver le résultat généré ou les données nécessaires à sa reproduction entre versions.
- La compatibilité MMD se décrit par fonction et par modèle testé. Une fixture technique ou une fiche glTF ne prouve pas que tous les PMX/PMD/VMD sont pris en charge.
- Les versions de l'application et des formats sont distinctes : Director 19/20, Auto Show 20 dans la base V34. Toute évolution de schéma exige une migration explicite et une vérification de reprise.
- Une requête IndexedDB réussie ne garantit pas le commit de la transaction. Préserver le contrôle du droit d'écriture, la relecture des références et la protection des brouillons avant suppression ou remplacement.

## Vérifier selon le changement

Pour une modification de comportement :

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tools/verify_release.py
```

Exécuter en plus le scénario navigateur du sous-système touché, indiqué dans le guide. Pour la récupération Director : `tests/director-recovery.test.cjs` et `tests/v37_recovery_browser.py` ; pour la fin de prise et les replays : `tests/v37-record-replay.test.cjs` et `tests/v37_record_replay_browser.py`. Pour les archives : `tests/archive-integrity.test.cjs` et `tests/v36_archive_browser.py` ; pour le mouvement réduit : `tests/v36-motion.test.cjs` et `tests/v36_motion_browser.py`. Pour le rythme : `tests/rhythm-events.test.cjs` et `tests/rules-contract.test.cjs` ; pour les lancements, boucles et reprises : `tests/v35_playback_browser.py`. Reproduire le problème puis vérifier le résultat attendu ; éviter les tests qui recopient simplement l'implémentation.

Pour la documentation seule, vérifier les chemins, liens, SHA et identifiants du backlog. Ne pas annoncer de nouvelle validation du gameplay sur la base de ces contrôles documentaires.

La CI existante complète la revue. Conserver ses exigences et examiner ses résultats sur le commit de la PR. `tools/verify_pr37.py` vérifie le classeur V37 exact et des preuves fraîches : un changement du suivi exige de mettre ses vérifications en cohérence, sans contourner un échec.

## Livrer et rendre compte

- Utiliser une branche et une PR pour les changements du projet. Identifier les guides appliqués et leur adaptation dans la description.
- Le suivi V37 (`planning/BACKLOG_V37.json`, CSV et Excel associés) est la base des statuts. Un guide ajouté ne termine aucune fonctionnalité ; conserver les critères ouverts tant qu'ils ne sont pas exécutés.
- Associer les résultats au SHA testé et, pour le jeu généré, au hash du build. Séparer observations actuelles et rapports historiques.
- Distinguer tests logiques, navigateur HTTP, document injecté et matériel physique. Un viewport mobile ou SwiftShader ne valide pas un iPhone, un GPU réel ni la latence acoustique.
- Les documents V3–V28 sont historiques. Pour la situation V37, privilégier le README courant, `docs/V37_PRISES_RECUPERATION.md`, `docs/V36_ARCHIVES_SCENE_CALME.md`, `docs/V35_RYTHME_FIABLE.md`, `docs/REGLES_DIVA_PULSE_V1.md`, les guides V32–V34 et le backlog courant.
