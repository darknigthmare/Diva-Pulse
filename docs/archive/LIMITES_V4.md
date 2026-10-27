# V4 — État, fidélité et compatibilité

## Ce qui est effectivement livré

Sources et HTML jouable construits à partir de la V3, avec les trois modes de partition (import, génération, édition), les quinze démos existantes, l’interface de bibliothèque, la scène 3D, GLB, vidéo, MIDI, PV, replays, setlists et résultats. La V4 ajoute catalogue local, aperçu de génération, brouillons, sections, entraînement progressif, accords configurables, rendu borné et repli 2D. Le changelog détaille les changements. Aucun ancien site n’a été mis à jour.

## Fidélité à Project DIVA

Le scoring, les rangs, le bonus HOLD, la jauge, les trajectoires et les variantes d’édition ne sont pas des reproductions exhaustives de SEGA. Une partition importée compatible conserve ses données représentables ; cela ne rend pas automatiquement identiques toutes les mécaniques de son édition d’origine. Les commandes DSC inconnues sont refusées. Les variantes F/F2nd, Chance Time, Success Effect, branches de PV et contrôles propres à chaque version ne sont pas implémentés intégralement.

Les personnages sont des silhouettes procédurales, pas les modèles officiels détaillés. Pas de catalogue complet de costumes, de chorégraphies originales complètes, de lip-sync avancé, de physique réaliste des vêtements/cheveux ou de mouvement capturé des clips. Le moteur GLB prend en charge un sous-ensemble autonome : pas de PMX/VMD/MMD, Draco, morph targets, réseau de ressources externes ni rendu PBR exhaustif. Le repli 2D ne rend pas les modèles GLB ou toutes les caméras de la scène 3D.

Le catalogue V4 est local et rempli par import. Aucun connecteur de recherche automatique de niveaux officiels ni téléchargement des chansons. Le SHA-256 compare les octets d’un fichier, sans reconnaissance robuste au réencodage. Un titre identique ne suffit pas à valider une association et une empreinte ne prouve pas l’authenticité éditoriale du niveau.

## Générateur et création

Le générateur traite les attaques/énergies d’un canal du mix. Il estime un tempo global, pas une carte exacte de toutes les variations. Les motifs récurrents sont des signatures rythmiques, pas une analyse sémantique des couplets et refrains. Il peut manquer des notes vocales douces, choisir des transitoires non pertinents ou proposer des densités identiques sur un signal simple. Il faut écouter et retoucher. La grille et le montage par mesures restent en 4/4 ; 3/4 et 7/8 ne pilotent pas encore ces affichages.

Un MIDI ordinaire exige un mapping adapté et peut écarter/réaffecter des notes non représentables, annoncées dans l’aperçu. Les métadonnées natives DIVA PULSE permettent un aller-retour de la partition originale, mais le MIDI externe seul est arrondi aux ticks. Pas d’enregistrement MIDI matériel en direct ni séparation automatique des instruments.

## Audio, contrôles et performances

Le ralenti modifie la hauteur du son. Pas de time-stretch à hauteur constante. Calibration et horloge de sortie sont des aides logicielles, non une mesure matérielle des latences Bluetooth, écran ou contrôleur.

Les tests visuels utilisent Chromium avec GPU logiciel SwiftShader. Ils ne fournissent pas de taux d’images garanti sur une machine réelle. Des retards du rendu logiciel ont été observés lors des versions précédentes ; Rythme prioritaire fige le décor en partie. La recherche binaire des notes réduit un coût spécifique sans garantir à elle seule un framerate.

Les événements clavier et API Gamepad testés sont simulés. Pas de contrôleur physique, écran tactile réel, Safari/iOS, Firefox ou téléphone Android vérifiés. Les formats audio/vidéo réellement décodables dépendent du navigateur.

## Sauvegardes et installation

Les contrôles navigateur ont utilisé le HTML autonome injecté dans une page vide (origine opaque), car la navigation vers le serveur de test est bloquée par la politique du navigateur. Aucune politique n’a été modifiée. Ce contexte utilise le repli mémoire ; il permet de contrôler la sérialisation, l’interface, les codecs et la logique, **pas la persistance IndexedDB après fermeture**.

Le lanceur a été contrôlé séparément par des requêtes HTTP Python sur loopback, y compris conflit de port et identité de build. Le service worker a été testé dans une VM Node pour son routage/cache, pas installé dans un navigateur. Le mode hors ligne, le manifest installé, le rechargement hors réseau et la migration inter-origines restent donc à valider sur le poste réel.

Les exports ont été inspectés sous forme de Blobs sérialisés en mémoire. Les tests ne certifient pas le téléchargement via le gestionnaire de fichiers de chaque système. Les liens de livraison pointent, eux, vers les fichiers réellement créés dans cette conversation.

Un brouillon suit le même stockage que la bibliothèque. TEMPORAIRE signifie qu’il peut disparaître à la fermeture. Le délai d’écriture de 650 ms laisse une fenêtre avant sauvegarde ; la fermeture immédiate, le crash matériel ou une suppression des données peuvent perdre des modifications. Exporter régulièrement. Une restauration V4 ajoute les brouillons et le catalogue en copies/remappages ; les historiques de sessions, replays et tentatives exportés ne sont pas fusionnés automatiquement.

## Distribution

Pas d’application native mobile/PC, de compte cloud, de classement en ligne, de multijoueur, de téléchargement de niveaux distants ou de publication Vercel dans cette livraison. Les replays sont locaux et non certifiés anti-triche. Les noms de personnages servent à identifier les études procédurales ; aucun droit d’exploitation d’œuvres tierces n’est accordé par cette archive. Pas de média officiel ou extrait protégé fourni.
