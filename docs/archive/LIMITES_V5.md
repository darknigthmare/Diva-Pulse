# V5 — État, fidélité et compatibilité

## Livraison réelle

Le jeu autonome, ses sources et ses exemples sont issus de la V4 fournie. Les ajouts V5 sont décrits dans `CHANGELOG_V5.md`. Les noms de modules V3/V4 restants indiquent leur provenance et leurs règles compatibles ; le runtime courant est 5.0.0. Aucun ancien site n’a été modifié ou déployé.

## Fidélité à Project DIVA

Le scoring, les rangs, bonus HOLD, jauge, trajectoires et différences entre éditions ne sont pas des reproductions exhaustives de SEGA. Le moteur normal conserve rules4 ; la V5 ne remplace pas ces règles par un barème officiel. Une partition compatible garde ses données représentables, mais cela ne garantit pas que toutes les mécaniques de son édition d’origine deviennent identiques. Les commandes DSC inconnues sont refusées. F/F2nd, Chance Time, Success Effect, branches de PV et contrôles spécifiques ne sont pas implémentés intégralement.

Les six personnages sont toujours des silhouettes procédurales. Pas de modèles officiels détaillés, costumes complets, chorégraphies originales intégrales, lip-sync avancé ou physique réaliste des cheveux/vêtements. Le GLB reste un sous-ensemble autonome : pas de PMX/VMD/MMD, Draco, morph targets, ressources externes ou PBR exhaustif. Le repli 2D n’affiche pas les GLB ni toutes les caméras de la scène 3D.

Aucun média officiel ni téléchargement de chanson n’est fourni. Le catalogue est local et importé ; pas de connecteur cherchant automatiquement les niveaux officiels sur Internet. SHA-256 compare les octets et n’est ni une reconnaissance robuste au réencodage ni une preuve d’authenticité éditoriale du niveau.

## Génération et édition

La génération analyse des attaques/énergies et propose un tempo global. Elle ne transcrit pas parfaitement la mélodie ou la voix, ne sépare pas les instruments et n’identifie pas sémantiquement les refrains. Les variations de tempo/signature ne sont pas automatiquement déduites. Les nouvelles mesures pilotent le studio, le métronome et le montage, pas une nouvelle transcription automatique de toutes les anciennes partitions.

Les mesures commencent sur des frontières complètes. Les changements au milieu d’une mesure sont refusés ; pas d’éditeur d’anacrouses complexes ou de notation musicale gravée. Les groupes d’accents servent au métronome. Les notes restent définies en secondes : changer un BPM ou une signature ne les déplace pas.

Un MIDI ordinaire exige un mapping et peut écarter/réaffecter des notes non représentables, annoncé dans l’aperçu. Les signatures compatibles sont appliquées ; une carte non représentable reste en métadonnées avec avertissement et grille 4/4. Les métadonnées natives DIVA PULSE permettent le retour exact de la partition ; les événements standard seuls sont arrondis aux ticks et ne portent pas les coordonnées de cibles ni tous les groupes d’accents.

## Audio et contrôles

La hauteur conservée est un traitement WSOLA local, limité au mono/stéréo, aux sections de 120 secondes et à une sortie PCM de 24 millions d’échantillons cumulés. Des buffers de travail prennent de la mémoire supplémentaire. La préparation peut être refusée ou dépasser son délai sur une machine lente. Un Worker bloqué doit être autorisé dans le contexte ou l’option doit être désactivée ; aucun repli silencieux modifiant la hauteur ne masque l’échec. Le mode classique reste disponible volontairement.

Une conservation satisfaisante d’une sinusoïde ne certifie pas l’absence d’artefacts sur une voix, un mix dense ou des percussions. L’algorithme peut étaler les attaques ou modifier le timbre. Le décalage d’entrée et l’horloge audio sont des aides logicielles, pas une mesure matérielle de l’écran, du Bluetooth ou des contrôleurs.

Web MIDI dépend du navigateur, du contexte sécurisé et de son autorisation. L’application ne demande que l’entrée, sans SysEx et sans envoyer de messages à des instruments. La permission et le transport matériel n’ont pas été validés ; les paquets MIDI et événements de branchement des tests sont simulés dans l’adaptateur. Un refus dans une origine non compatible a été testé réellement. Aucun accès n’est demandé au démarrage.

Les événements clavier/Gamepad des tests sont simulés. Pas de manette, clavier MIDI, appareil Bluetooth ou écran tactile physique testé. Pas de Safari/iPhone, Firefox, téléphone Android ou application native validé. Les capacités réelles de décodage audio/vidéo dépendent du navigateur.

## Stockage et installation

Les contrôles navigateur utilisent le HTML final injecté dans une page vide à origine opaque, car le navigateur refuse la navigation vers le serveur local de test avec `ERR_BLOCKED_BY_ADMINISTRATOR`. Aucune politique de sécurité n’a été modifiée. Cette origine utilise TEMPORAIRE : les tests vérifient interfaces, moteur, Web Audio/Worker/WebGL, exports sérialisés et restauration en mémoire, pas la durabilité IndexedDB après fermeture.

Le lanceur est testé séparément par de vraies requêtes HTTP Python en loopback, y compris identité, hash du build et conflits de port. Le service worker est testé dans une VM Node pour ses contrats de routage/cache ; il n’a pas été installé dans ce navigateur. Installation PWA, actualisation, redémarrage hors ligne et persistance des médias restent à valider sur le poste réel.

Le diagnostic ne répare ni ne supprime les fichiers inutilisés. Un morceau invalide isolé garde son enregistrement brut dans le stockage et peut être exporté séparément. La bibliothèque valide exportée n’inclut pas automatiquement cet enregistrement ni tous les médias sans référence ; exporter aussi les données isolées avant toute intervention sur le stockage.

Les brouillons suivent le stockage de la bibliothèque et leur délai d’écriture laisse une fenêtre avant sauvegarde. Une fermeture immédiate, un crash ou un nettoyage du navigateur peut perdre du travail. Le traitement des invalidations de base est vérifié par simulation, pas par une migration réelle entre deux onglets persistants. La restitution des packs est confirmée puis transactionnelle, en copies ; les historiques de sessions/replays ne sont pas fusionnés automatiquement. L’Académie conserve les meilleurs résultats et le maximum de tentatives, pas une somme exacte de parties jouées sur plusieurs appareils.

Les exports navigateur ont été inspectés comme données/Blobs. Le gestionnaire de téléchargement de chaque système d’exploitation n’est pas certifié par ces tests. Les fichiers finaux liés dans la réponse ont, eux, été créés et leur archive vérifiée.

## Performances et distribution

Chromium + Xvfb + SwiftShader fournissent le rendu logiciel utilisé pour la QA. Aucun framerate ou budget mémoire réel sur téléphone n’est garanti. Les viewports portrait/paysage testent le débordement et les interactions, pas le matériel mobile. Rythme prioritaire permet de figer le décor.

Pas d’application native PC/mobile, cloud, classement distant, multijoueur ou système anti-triche. Les leçons sont originales et leurs objectifs sont testés, mais les médailles locales peuvent être modifiées comme les autres fichiers locaux. Cette archive n’accorde pas de droit d’exploitation sur des œuvres tierces.
