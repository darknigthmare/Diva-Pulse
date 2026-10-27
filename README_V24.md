# DIVA PULSE V24 — Squelettes, tempo et sauvegardes

Version 24.0.0 — 7 octobre 2026. Suite de l’archive V23, conservée sans modification.

## Démarrer et migrer

Exporter d’abord la bibliothèque de l’ancienne version en `.pulsepack`, puis fermer ses fenêtres. Décompresser le ZIP V24 dans un dossier distinct. Ouvrir `DIVA_PULSE_JOUER.html`, ou lancer `LANCER_WINDOWS.bat` / `LANCER_MAC_LINUX.command` avec Python 3. `python lancer.py --no-browser` démarre le serveur sans ouvrir automatiquement le navigateur. Le lanceur garde une adresse stable et signale les conflits de port.

Restaurer le `.pulsepack` dans les réglages : les morceaux sont copiés, pas écrasés. Conserver l’ancienne sauvegarde jusqu’à vérification des musiques, partitions, modèles, textures et spectacles restaurés. Un téléchargement sur Google Drive conserve les fichiers du projet, pas automatiquement les données du navigateur. Drive n’est pas un hébergement du jeu.

**TEMPORAIRE = exporter avant de fermer.** Un fichier HTML ouvert depuis une autre adresse ou un autre navigateur ne retrouve pas automatiquement sa bibliothèque précédente.

## 1. Squelettes MMD : héritage standard et limites articulaires

L’animation évalue les clés VMD et morphs d’os, applique les héritages standards de rotation/translation, puis le solveur IK. Les dépendances entre héritages sont triées ; un cycle ou une référence invalide est refusé. Les ratios négatifs, nuls et fractionnaires sont acceptés (valeur absolue plafonnée à 100). Les calculs repartent de la pose animée à chaque image : revenir en arrière ne cumule pas une déformation.

Les limites articulaires XYZ sont maintenant appliquées au quaternion du lien après chaque correction CCD. La conversion des limites PMX tient compte du changement de repère, avec échange des bornes nécessaires. Le solveur respecte un budget maximal de 32 itérations par chaîne, pas une convergence illimitée. Cette projection XYZ reste distincte d’un solveur MMD complet.

**Ce qui n’est pas ajouté :** héritages locaux/monde, contraintes d’axes complexes, ordre d’évaluation couplé IK/héritage/physique exhaustif, Bullet, corps souples et MME. Les diagnostics conservent les limites ; un modèle importable peut encore avoir un mouvement non fidèle. Les chemins SDEF/QDEF V23 sont conservés.

### Exemples originaux

`examples/v24/APPEND_STANDARD.pmx` est un petit maillage à deux os dont le second hérite à 50 % de la rotation et de la translation du premier. `CYCLE_1_SECONDE.vmd` le fait bouger selon un cycle d’une seconde. `IK_LIMITS.pmx` sert au contrôle des limites binaires. `POSE_FIXE.vmd` sert au contrôle d’une pose sans cycle. Il ne s’agit ni de personnages Vocaloid finalisés ni d’une collection représentative de modèles téléchargés.

## 2. Proposer le tempo d’une motion VMD

Ouvrir **Modules → MMD Stage → Caler les motions sur la pulsation**, puis **Analyser les cycles de cette motion**. La lecture s’effectue sur le VMD réellement importé, sans modifier son fichier.

L’analyse recherche les répétitions de pose dans au plus 90 secondes, sur des canaux de position et de rotation à 30 échantillons par seconde. Elle vérifie leur présence dans les deux moitiés du passage. Les motions trop courtes, statiques, purement faciales ou sans répétition stable peuvent ne recevoir aucune proposition : aucune valeur n’est inventée pour remplir le formulaire.

Un cycle n’est pas nécessairement un temps musical. Pour un cycle d’environ une seconde, le panneau peut proposer 60, 120 et 240 BPM : ces valeurs représentent respectivement un, deux et quatre temps par cycle. Les BPM affichés sont arrondis au dixième, et non présentés comme une mesure exacte. La « répétitivité » estime la stabilité de la pose, pas la certitude musicale du BPM.

Cliquer sur une proposition remplit uniquement le champ **BPM source**. Vérifier à l’écoute, renseigner le **premier temps dans le VMD**, puis cliquer sur **Enregistrer le calage**. Annuler n’enregistre rien. La phase n’est pas détectée ; le premier temps existant n’est pas remplacé. Les courbes Bézier du lecteur VMD restent inchangées : leur approximation ne concerne que la recherche de période.

Le calage validé alimente les pistes automatiques libres et les futures générations. Les montages manuels ou figés conservent leur propre calage. Une nouvelle analyse musicale ne déplace pas les notes et ne transforme pas une animation arbitraire en chorégraphie officielle.

## 3. Sauvegardes et plusieurs fenêtres

Dans **Réglages**, le nouveau panneau **Une seule fenêtre écrit** indique le mode de stockage, l’état de réservation de l’écriture et, lorsque le navigateur l’expose, son quota estimé.

Lorsque **IndexedDB et Web Locks sont disponibles**, la première fenêtre V24 obtient le droit d’écriture pour cette adresse. Les autres gardent l’accès en lecture et à l’export ; leurs modifications enregistrées sont refusées. Fermer les autres fenêtres et recharger pour reprendre l’écriture. La page libère le verrou à sa sortie et refuse de réutiliser une réservation libérée après suspension.

Cette protection coordonne les pages V24 utilisant ce verrou, pas les anciennes versions. Elle ne fusionne pas les modifications entre fenêtres, ne surveille pas les appareils distants et ne synchronise rien avec Google Drive. Lorsque l’API de verrou est indisponible, le diagnostic le dit : éviter d’ouvrir plusieurs versions qui écrivent simultanément.

**Demander la protection du stockage** déclenche, uniquement après le clic, la demande correspondante au navigateur. Un refus ou une API indisponible est affiché sans prétendre que les données sont protégées. Une autorisation n’empêche pas l’utilisateur d’effacer ses données et ne remplace jamais le `.pulsepack`.

L’export de secours ne dépend pas d’une nouvelle écriture. Les brouillons Director/studio restent transportés séparément des sources enregistrées. Les réglages d’horloge et remappages clavier ont aussi une gestion explicite du refus d’écriture. Une API de diagnostic refusée n’empêche pas le démarrage du jeu.

## 4. Corpus AutoMap reproductible

`examples/v24/audio-corpus/` contient cinq WAV originaux de contrôle et leurs annotations JSON : binaire, ternaire, swing, changement de tempo et pause silencieuse. Les attaques ont été générées à des instants connus pour comparer leur détection au signal.

`node tests/v24-audio-corpus.cjs` régénère ces fichiers et leurs mesures. Les tests vérifient la précision/rappel des attaques détectées, la validité de la famille et la conservation des notes des difficultés inférieures. Le moteur AutoMap V23 n’a pas été remplacé dans cette passe. Ces impulsions synthétiques ne démontrent pas la qualité musicale du mapping de voix, de chansons mixées, de rubato ou de tous les genres.

## 5. Sources et contrôles

Construire : `python build.py`. Tests de logique : `node --test tests/*.test.cjs`. Serveur : `python tests/launcher_test.py`. Parcours V24 : `python tests/v24_browser_test.py` (Playwright, Chromium et environnement graphique compatibles nécessaires). Les tests sont fournis ; aucune installation de dépendance n’est nécessaire pour jouer au HTML autonome.

`RAPPORT_V24.md` décrit les contrôles exécutés, le hash du HTML, les fautes volontairement injectées et les limites de l’environnement. Les rapports V2 à V23 conservés dans l’archive sont historiques, pas des validations supplémentaires de la V24.

**Limites de validation :** les essais graphiques emploient Chromium et SwiftShader logiciel ; l’édition locale est testée en mode TEMPORAIRE. La coordination native de deux fenêtres IndexedDB/Web Locks, la persistance après fermeture, Safari/iPhone, les manettes et contrôleurs MIDI physiques restent à valider. Le service worker conservé n’est pas une certification de l’installation hors ligne complète.

Aucun média officiel, nouvelle physique Bullet, retargeting universel, synchronisation labiale, catalogue en ligne ou équivalence de scoring SEGA ne sont ajoutés par cette version. L’audit actualisé décrit ces chantiers séparément.
