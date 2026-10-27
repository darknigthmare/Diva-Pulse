# DIVA PULSE — Precision & Musical Studio Edition 5.0

Jeu de rythme indépendant construit à partir de l’archive **V4 Encore & Library Edition fournie dans cette conversation**. Les sources, trois instrumentaux et quinze partitions précédentes sont conservés. La V5 ajoute le ralenti à hauteur conservée, les mesures composées, les entrées MIDI en direct, six leçons originales et un diagnostic non destructif du stockage. Le rendu, les assets et le barème ne sont pas une reproduction complète 1:1 de Project DIVA.

## Démarrer

Décompresser l’archive. `DIVA_PULSE_JOUER.html` contient le jeu, ses styles et son code, sans CDN, compte ou clé API. `index.html` contient exactement les mêmes octets. Ouvrir le HTML dans un navigateur compatible JavaScript et Web Audio ; le lancement direct peut avoir des limitations de stockage, de Worker et d’API selon le navigateur.

Pour une adresse locale stable, utiliser `LANCER_WINDOWS.bat` ou `LANCER_MAC_LINUX.command` avec **Python 3 déjà installé**, ou exécuter :

```sh
python3 lancer.py
```

Le serveur écoute seulement `127.0.0.1:8765`. Garder sa fenêtre ouverte ; Ctrl+C l’arrête. Il ne reçoit ni n’envoie les médias et n’installe rien. Il ne change pas de port silencieusement : une autre version encore ouverte doit être arrêtée. `--port` est une option volontaire, qui change aussi l’origine du stockage visible.

**Avant de fermer la V4, exporter sa bibliothèque en `.pulsepack`.** Importer ce pack dans les réglages V5. La restauration crée des copies, sans écraser les morceaux existants. Le remplacement des réglages est facultatif et décoché par défaut. V2 et V3 restent importables. La base IndexedDB garde le nom `diva-pulse-stage-v2` et son schéma 2 ; cela évite une migration destructive imposée sur la même origine, sans garantir qu’un autre navigateur ou fichier local présente les mêmes données.

**TEMPORAIRE signifie : exporter avant de fermer.** La bibliothèque et les brouillons sont alors en mémoire. Même avec un stockage local actif, conserver régulièrement des exports externes. La persistance réelle après fermeture n’a pas pu être validée dans l’environnement de cette livraison. Voir le rapport, plutôt que supposer qu’un badge est une garantie de sauvegarde matérielle.

## Nouveautés V5

### Ralenti à hauteur conservée

Dans **Entraînement**, cocher **Conserver la hauteur du son**. Le moteur prépare localement le passage dans un Worker avec un traitement WSOLA. Le fichier audio original et les instants de toutes les notes restent intacts ; la lecture utilise un tampon dérivé temporaire, avec sa propre conversion entre temps audio et temps de la partition.

Le traitement est prévu pour le mono/stéréo, un passage de **120 secondes maximum** et les vitesses d’entraînement compatibles. La sortie est limitée à 24 millions d’échantillons cumulés, soit environ 96 Mo de PCM final ; les buffers de travail et l’original prennent de la mémoire en plus. Un passage trop long, multicanal, ou un Worker bloqué produit une erreur expliquée. Aucun canal n’est supprimé silencieusement et le mode classique reste disponible en décochant l’option.

Il ne s’agit pas d’un traitement studio transparent : certaines voix, attaques ou textures sonores peuvent être altérées. Aucun moteur de séparation vocale ni analyse des paroles n’est ajouté. Les tests mesurent une tonalité synthétique, les durées et la phase stéréo ; ils ne certifient pas la qualité perceptuelle de tous les morceaux.

L’option **Décompte sonore** émet des clics avant les tentatives sans modifier l’audio. Avec la progression V4, une boucle réussie avance de cinq points de vitesse ; la V5 prépare le tampon correspondant avant de reprendre. Pause, reprise, sortie et annulation libèrent les entrées et évitent qu’une préparation abandonnée installe un ancien tampon. La compensation des touches, exprimée en millisecondes réelles, est convertie selon la vitesse de la musique.

### Signatures et accents dans le studio

Le panneau **Signatures & accents** accepte les numérateurs de 1 à 16 et les dénominateurs 2, 4, 8 ou 16. Exemples : 3/4, 6/8, 7/8. Les groupes d’accents sont personnalisables : 2+2+3 pour le 7/8, 3+3 pour le 6/8. La somme doit correspondre au numérateur.

Les positions sont comptées en **noires depuis l’origine de grille**, quelle que soit la signature. La première signature commence à 0 ; chaque changement débute sur une mesure complète de la signature précédente. Un changement au milieu d’une mesure est refusé, sans transformation partielle. Ajouter ou modifier une signature ne recale pas les notes.

Grille, numéros de mesure, métronome et montage automatique de caméras utilisent cette carte et les BPM variables. Les opérations suivent annuler/rétablir et les brouillons. Modifier une source importée, une démo ou une leçon crée une version dérivée.

Le MIDI exporte maintenant les véritables signatures standard, en plus des métadonnées natives. L’import d’un MIDI musical ordinaire utilise ses signatures compatibles sans déplacer ses notes. Une carte non représentable est conservée comme métadonnées et signalée dans l’aperçu ; la grille revient alors à 4/4. Les groupes personnalisés et l’origine exacte sont conservés dans le JSON natif, pas dans les seuls événements MIDI standard. Voir `docs/FORMAT_METRIQUE_ET_MIDI_V5.md`.

### Contrôleurs MIDI en direct

**Réglages → Clavier / pads MIDI → Connecter un contrôleur MIDI.** Le jeu demande une autorisation uniquement après cette action, sans SysEx et sans envoyer de message aux instruments. L’API nécessite un navigateur et une origine compatibles ; elle n’est pas disponible partout. Les ports physiques n’ont pas été testés dans cette livraison.

Choisir l’entrée et le canal, puis associer six notes MIDI aux quatre symboles et aux deux directions de slide. Par défaut : 60, 62, 64, 65, 67 et 69. Le bouton d’apprentissage attend la prochaine note ; réutiliser une note déjà assignée échange les deux attributions pour éviter les doublons. On peut aussi saisir les numéros de 0 à 127 directement.

La même entrée sert à jouer ou à enregistrer des taps et maintiens dans le studio. Note-off et note-on de vélocité zéro relâchent la touche. Les canaux et ports possèdent leurs propres sources de maintien. Pause, arrêt de l’enregistrement, perte de focus, déconnexion et messages de fin de notes nettoient ces sources. Il ne s’agit pas d’un synthétiseur : le contrôleur déclenche les touches du jeu, pas les sons de son instrument.

### Académie : six leçons originales

Dans **Jouer → Académie · 6 leçons**, choisir librement une leçon : pulsation, alternance des quatre symboles, accords, HOLD, slides/chaînes ou premier concert. Toutes sont accessibles immédiatement, sans achats ni verrouillage.

Au premier lancement, le jeu crée **L’ATELIER DU RYTHME**, un instrumental original de 32 secondes à 120 BPM, et ajoute ses six partitions. Les trois démos / quinze niveaux précédents restent en place. Le morceau n’est pas installé une deuxième fois lors du lancement d’une autre leçon.

Une médaille exige au moins 90 % de précision, aucun MISS ni WRONG, et la vitesse complète. La leçon HOLD exige en plus 1 600 points de bonus de maintien. Les résultats de l’Académie sont séparés des records normaux ; ils indiquent explicitement si la progression n’est que temporaire. Les exports `.pulsepack` V5 incluent cette progression. À la restauration, les meilleures médailles/précisions sont conservées ; le nombre de tentatives est fusionné par maximum, pas additionné comme s’il représentait de nouvelles parties.

### Diagnostic et démarrage plus robuste

**Réglages → Contrôler la bibliothèque** affiche les médias manquants, fichiers sans référence, incohérences de partitions et volume de médias. Le diagnostic ne supprime rien. Il peut être exporté en JSON, puis complété par une sauvegarde.

Au démarrage, un morceau invalide peut être isolé afin de laisser charger les autres. Son enregistrement brut reste inchangé et peut être exporté depuis le diagnostic ; il n’est pas inclus automatiquement dans un pack des morceaux valides. Il ne s’agit pas d’une réparation automatique de fichiers corrompus.

Lorsque la connexion à la base est explicitement invalidée, les accès sont refusés et le jeu demande un rechargement, plutôt que d’annoncer une sauvegarde dans une bibliothèque vide. Les scénarios d’invalidation ont été simulés ; le cycle IndexedDB réel après fermeture reste à vérifier sur le poste utilisateur.

## Les trois parcours de partitions sont conservés

**Partition existante** : importer le bon audio, puis JSON DIVA PULSE, CSV, DSC FT/MM+ compatible ou MIDI. Le catalogue **Partitions disponibles** utilise des `.pulsecharts` sans musique. SHA-256 identique ou identifiant de démo intégré permet une correspondance vérifiée ; un titre ressemblant exige une confirmation. Le catalogue reste local, alimenté par import. Il ne recherche ni ne télécharge automatiquement les niveaux officiels. Les commandes DSC inconnues sont refusées ; les placements et timings reconnus ne sont pas régénérés.

**Génération** : analyse des attaques/énergie/silences, tempo global proposé, graine, densité, disposition et types de notes. L’aperçu précède la sauvegarde. Annuler ne change rien ; confirmer ajoute exactement les partitions prévisualisées. La quantification facultative n’agit qu’à moins de 35 ms de la grille ; désactivée, elle conserve les attaques retenues. Les motifs sont rythmiques, pas une identification sémantique des refrains. Le générateur ne détecte pas automatiquement les changements de signature V5 : les éditer ensuite.

**Studio manuel** : waveform, grille simple/ternaire, tempos variables, cibles libres, trajectoires, accords, HOLD/CHAIN, sections, enregistrement des touches, multi-sélection, transformations, copier/coller et annuler/rétablir. Les brouillons utilisent le même stockage que la bibliothèque ; le délai d’écriture ne garantit pas une récupération après fermeture immédiate ou crash. Les partitions source restent séparées des versions dérivées.

## Commandes et autres modes conservés

D / ↑ : △ ; F / ← : □ ; J / ↓ : × ; K / → : ○ ; S : slide gauche ; L : slide droite. Échap : pause. Remappage dans les réglages. Les raccourcis d’accords sont désactivés par défaut ; les activer volontairement pour associer une touche à plusieurs symboles. L’adaptateur manette utilise le mapping standard de l’API Gamepad ; tactile et manettes physiques n’ont pas été certifiés ici.

Les règles normales V4 sont conservées, dont l’obligation de frapper la tête d’une chaîne et le bonus HOLD plafonné. La V5 ne crée pas un nouveau barème SEGA. Les anciens résultats restent distingués par version de règles. Autoplay, entraînement et replay ne créent pas de record normal. Replays, statistiques de timing, propositions de passages difficiles, setlists et montage PV restent disponibles.

Les six silhouettes procédurales, variantes de tenue, scènes 3D, partenaires, import GLB compatible, vidéo locale et paroles LRC sont conservés. Ils ne remplacent pas les modèles, animations ou clips officiels. **Rythme prioritaire** fige le décor en partie. Une scène 2D annoncée prend le relais si WebGL 2 est indisponible ; elle n’affiche pas les GLB.

## Hors ligne, exemples et reconstruction

Le HTML autonome embarque son code. Les fichiers `manifest.webmanifest`, `sw.js` et `icons/` permettent une préparation hors ligne facultative depuis une origine compatible ; la logique de cache est testée, mais l’installation réelle, la réouverture hors connexion et la persistance n’ont pas été validées dans ce navigateur de test.

`examples/v5/` fournit les six leçons, leur WAV, un exercice sonore original en mesures mixtes avec JSON/MIDI et un catalogue associé par SHA-256. Consulter son `LIRE_EN_PREMIER.md`. Les anciens exemples restent disponibles. Aucun média officiel n’est embarqué.

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tests/run_browser_suites.py
node tests/make_v5_fixtures.cjs
```

Le build utilise Python uniquement ; les tests de logique utilisent Node 22 ou supérieur. Les tests navigateur demandent Python Playwright, Chromium et éventuellement Xvfb déjà installés. Aucun paquet n’est installé automatiquement, aucune politique de sécurité n’est modifiée.

Les preuves, comptes et limites sont dans `docs/RAPPORT_TESTS.md`. La livraison est autonome : **aucun ancien site n’a été modifié ou redéployé**.
