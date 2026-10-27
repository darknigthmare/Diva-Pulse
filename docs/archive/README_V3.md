# DIVA PULSE — Performance & Creator Edition 3.0

Jeu de rythme indépendant inspiré de Project DIVA, développé à partir de la **V2 Stage Edition fournie**. Cette V3 est une mise à jour réelle des sources V2, pas une maquette séparée. Les trois instrumentaux originaux et leurs quinze partitions restent inclus.

## Démarrer

Décompresser toute l’archive. Ouvrir `DIVA_PULSE_JOUER.html` dans un navigateur de bureau disposant de Web Audio et, pour les scènes, de WebGL 2. Le jeu n’utilise ni CDN, ni clé API, ni téléchargement de dépendances à l’exécution.

La voie conseillée pour une bibliothèque régulière est le serveur local fourni : installer Python 3 si nécessaire, puis lancer `LANCER_WINDOWS.bat` ou `LANCER_MAC_LINUX.command`. Autre possibilité : `python3 lancer.py`. Le serveur est limité à `127.0.0.1`, ouvre le navigateur et s’arrête avec Ctrl+C. Il ne téléverse pas les médias. Garder sa fenêtre ouverte pendant la partie.

Les tests de cette livraison ont exécuté le HTML comme contenu local injecté dans Chromium : ils ne certifient pas l’installation `file://`, Safari/iOS ou la persistance entre deux ouvertures. Le lanceur et les instructions sont fournis, mais ces limites restent décrites dans `docs/RAPPORT_TESTS.md`.

**Si le badge indique TEMPORAIRE, exporter la bibliothèque avant de fermer l’onglet.** La fermeture d’un onglet en mode temporaire détruit ses médias non exportés.

## Retrouver les données V2

Dans la V2 encore ouverte : Réglages → Exporter la bibliothèque. Conserver le fichier `.pulsepack`, puis l’importer dans les réglages de la V3. La V3 présente une confirmation, crée des **copies**, et ne supprime pas les morceaux existants. Les records compatibles peuvent être rattachés aux copies ; le remplacement des réglages est une option décochée par défaut.

Le nom et la version de la base IndexedDB restent ceux de la V2 pour les installations servies sur une même origine. Changer de nom de fichier, de port, de navigateur ou d’origine peut conduire à une autre bibliothèque : utiliser le pack exporté, pas une hypothèse de migration automatique.

## Jouer

D / ↑ : △ ; F / ← : □ ; J / ↓ : × ; K / → : ○ ; S : slide gauche ; L : slide droite. Les symboles voyagent vers leurs cibles : appuyer à leur coïncidence. Les lignes relient les accords. Les HOLD et CHAIN utilisent le maintien de la touche ; un HOLD donne un bonus pendant au plus cinq secondes. Échap ouvre la pause.

Les touches se remappent dans les réglages. Le clavier, les boutons tactiles affichés et l’adaptateur Gamepad sont présents. Un appui provenant de plusieurs sources n’est libéré que lorsque la dernière source est relâchée. La déconnexion d’une manette libère ses entrées et met la partie en pause.

Le mode normal peut écrire un record local. Autoplay, PV, entraînement, replay et No Fail ne créent pas de record normal. `Rythme prioritaire` fige le fond 3D pendant le gameplay ; le mode PV garde son animation.

## Les trois parcours de partition

**Partition existante.** Importer d’abord le bon fichier audio, puis un JSON DIVA PULSE, un CSV, un DSC FT/MM+ compatible ou un MIDI. Les instants reconnus ne sont pas régénérés. Une partition source modifiée est enregistrée en version dérivée. Le contrôle de partition signale des risques sans déplacer les notes. Les valeurs invalides ou hors capacité du moteur sont refusées plutôt que silencieusement ramenées à une limite.

**Génération audio.** Le générateur local analyse attaques, énergie et silences, propose un tempo global et génère cinq niveaux. Graine reproductible et quantification facultative. Il ne réalise pas de séparation des voix/instruments, de transcription mélodique exacte ou de détection garantie de tous les changements de tempo. Une relecture humaine reste nécessaire.

**Création manuelle.** Le studio propose waveform, placement des notes, inspector des cibles, enregistrement pendant l’écoute et historique annuler/rétablir. La V3 ajoute sélection multiple, copier/coller, opérations de groupe, carte de tempo, subdivisions ternaires et métronome.

## Nouveautés V3

### Studio musical

La carte de tempo utilise des temps en secondes et une intégration cumulative des pulsations : ajouter un événement ne déplace pas les notes déjà écrites. La grille et le métronome suivent les variations. `Origine grille` décale sa phase sans modifier l’offset audio. Des subdivisions 1/12, 1/24 et 1/48 complètent la grille binaire. Les repères de mesure du studio restent en **4/4**.

Maj+clic : ajouter/retirer une note de la sélection. Alt+glisser dans les pistes : sélection rectangulaire. Ctrl+A/C/V : sélectionner/copier/coller lorsque le focus n’est pas dans un champ de texte. Des boutons donnent les mêmes opérations. Le collage commence à la tête de lecture. La sélection peut être déplacée en temps, quantifiée, inversée visuellement, remappée gauche/droite, disposée en ligne/arc/zigzag/cercle ou supprimée. Une collision impossible ou un temps négatif refuse toute la transformation.

### MIDI

Import Standard MIDI File 0/1 : pistes, PPQN ou SMPTE, tempo, notes, running status. L’aperçu permet de choisir la piste, d’exclure les percussions, d’activer les maintiens et de choisir le mapping. Le nombre de notes réaffectées/écartées est indiqué avant validation.

Un MIDI musical ordinaire ne définit pas les boutons et trajectoires Project DIVA : son mapping est une **adaptation**, pas le niveau officiel retrouvé. L’export V3 écrit des notes MIDI standard et des métadonnées natives : la réimportation de ces métadonnées conserve les positions et les décimales exactes. Les événements MIDI seuls sont arrondis aux ticks du fichier.

### Performance, replays et entraînement

Les résultats présentent médiane, dispersion et répartition avance/retard. À partir d’au moins douze frappes suffisamment stables, le jeu peut proposer une correction de calibration : elle est facultative, explicitement confirmée, et n’est pas une mesure matérielle de la latence.

Le replay contient les entrées horodatées et la partition native ; l’audio n’y est pas embarqué. Un fichier audio identique ou un identifiant de démo aide au rapprochement. En l’absence de correspondance, le choix du morceau est signalé avant lecture. Une relecture n’écrit pas de record.

Les passages comportant des erreurs peuvent être relancés en entraînement. Le dénominateur et le score d’une section excluent désormais les notes hors de l’intervalle sélectionné. Le ralenti agit sur le taux de lecture audio, **sans correction de hauteur**.

### Concert et scène

Les setlists sauvegardent l’ordre exact des morceaux et l’identité des partitions. Ajouter la partition choisie dans la bibliothèque, revenir pour ajouter les suivantes, puis lancer le concert. Le morceau suivant démarre sur action explicite depuis les résultats.

Le studio peut créer un montage de caméras toutes les quatre mesures, en suivant le tempo. Les transitions de caméra sont déterministes à la recherche temporelle. Sont ajoutés : projecteurs/public stylisés dans Neon Arena et Midnight City, désactivation de ces effets, écartement des partenaires, rotation/taille du GLB importé, durée de transition et offset vidéo par morceau. Ces ajouts ne transforment pas les mannequins procéduraux en modèles officiels détaillés.

### Sauvegarde

Export de bibliothèque complète ou d’un seul morceau avec ses médias référencés. Import des sauvegardes V2/V3 en copies, validation avant écriture, rattachement des records, copies des setlists avec nouveaux identifiants. Les réglages ne sont remplacés que sur demande. Les sessions/replays ne sont pas fusionnés automatiquement lors d’une restauration.

## Ce qui n’est pas livré

Pas de catalogue de chansons/niveaux officiels, recherche automatique de niveaux sur Internet, modèles ou chorégraphies SEGA, modules exacts complets, PMX/VMD/MMD, voix chantées, compte cloud, classement en ligne, multijoueur, application native ou nouveau déploiement. Scoring, rangs, jauge et trajectoires ne reproduisent pas toutes les règles de chaque édition de Project DIVA.

## Exemples et vérification

Dans `examples/`, associer `CONTROLE_120_BPM.wav` avec `CONTROLE_TEMPO_VARIABLE_V3.mid` pour examiner les variations 120 → 180 → 90. Le WAV est un signal de contrôle : sa pulsation ne change pas pour suivre les événements MIDI, volontairement, afin de vérifier les deux axes séparément. `CONTROLE_TEMPO_VARIABLE_V3.json` contient les mêmes notes. Le replay de contrôle peut être associé explicitement à ce WAV. Les exemples originaux V2 et le mannequin GLB animé restent présents.

Reconstruire : `python3 build.py`. Tests sans dépendance JavaScript : `npm test`, ou `node --test tests/core.test.cjs tests/creator.test.cjs`. Tests navigateur : `python3 tests/run_browser_suites.py` (Playwright, Chromium et éventuellement Xvfb doivent être présents). Voir `docs/RAPPORT_TESTS.md` pour les résultats réellement obtenus et ce qu’ils ne prouvent pas.
