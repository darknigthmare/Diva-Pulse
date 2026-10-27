# État et limites de cette livraison

Le jeu est une implémentation indépendante jouable, pas une copie commerciale complète ou certifiée de Project DIVA. La V3 modifie les sources de l’archive V2 fournie. La livraison reste autonome et ne met pas à jour l’ancien site annoncé.

## Présent — V3

Moteur de cibles libres, frappes, accords, HOLD bonus, slides/CHAIN, pause, résultats, contrôles clavier/manette/tactile, cinq difficultés, trois instrumentaux originaux et quinze charts de démo. Import natif et DSC partiel, génération locale à partir du mix, studio manuel, enregistrement des touches, PV Director, personnages procéduraux, tenues, quatre scènes 3D, GLB embarqués avec skinning/animations basiques, vidéos locales et paroles LRC. Bibliothèque IndexedDB avec repli mémoire et sauvegarde exportable. V3 : carte de tempo réelle, groupes de notes, contrôle de mapping, MIDI avec aperçu, replays, stats de timing, setlists, public/projecteurs, orientation et taille GLB, sauvegardes V2/V3 avec rattachement des records en copies.

## Pas une fidélité 1:1

Les modèles, matériaux, expressions faciales et chorégraphies intégrés sont des études procédurales. Pas de lip-sync élaboré, physique des cheveux/vêtements, IK de pieds, motion-capture officielle ou catalogue des costumes. Le rendu GLB n’est pas un moteur PBR complet et un personnage détaillé compatible doit être fourni séparément.

Le scoring, les rangs, la jauge et les trajectoires ne reproduisent pas tous les détails de Future Tone. Les long notes de Project DIVA F/F2nd, les modes spécifiques Switch, les règles chance time/success effect, les branches de PV et les fonctionnalités propres aux différentes éditions ne sont pas implémentés intégralement. Les types événement DSC reconnus sont des cibles, pas la logique complète d’événement du jeu d’origine.

Les niveaux officiels ne sont pas inclus, recherchés ou récupérés automatiquement. La reconnaissance d’un audio déjà connu porte sur ses octets identiques, pas sur une empreinte musicale robuste aux conversions. L’analyse automatique est une proposition heuristique de rythme à relire, pas une promesse de transcription exacte ou de difficulté équivalente à une partition humaine officielle.

## Pas encore livré

Pas de compte cloud, classement en ligne, multijoueur, campagne narrative, boutique, progression persistante de modules, application native Android/iOS, exécutable natif Windows, synchronisation entre navigateurs ou catalogue distant. Les sources statiques sont fournies pour permettre un hébergement, mais aucun déploiement de cette V3 n’a été effectué pendant cette livraison.

La V3 ajoute l’éditeur de tempo variable, la sélection multi-notes, l’import/export MIDI, les replays et les setlists. Restent absents : PMX/VMD/MMD, les signatures de mesure autres que 4/4 dans la grille visible, l’enregistrement de données MIDI en direct depuis un instrument, la réharmonisation, la séparation de sources audio et la conversion automatique des anciens packs V1. La modification d’un fichier audio n’effectue pas un recalage structurel de la partition existante.

## Performances et compatibilité

Une scène WebGL affichée dans Chromium sous GPU logiciel valide le rendu, mais pas les performances sur une carte graphique ou un téléphone réels. Des retards ont été observés avec le rendu logiciel animé ; le mode « Rythme prioritaire » fige la scène pendant la partie pour réduire ce coût. Le test des entrées clavier cadencées a été effectué dans ce mode. Le mode PV conserve l’animation.

Le serveur localhost et l’ouverture `file://` étaient bloqués par les politiques de navigation du navigateur de test. Aucune politique n’a été modifiée. Le HTML a donc été injecté comme contenu local dans une page vide pour les contrôles d’interface et de média. Cela permet de tester les scripts, la 3D, les commandes, le décodage et la sérialisation, mais ne certifie pas l’installation réelle ni IndexedDB entre deux rechargements. Les exports ont été capturés en mémoire pour inspection, sans certification de téléchargement par le système d’exploitation.

Les tests des boutons de manette utilisent une simulation de l’API Gamepad ; aucun contrôleur physique, écran tactile réel ou casque Bluetooth n’a été essayé. Safari/iOS, Firefox et Android restent à vérifier. Les latences d’entrée/audio et le mode plein écran varient selon l’environnement ; aucune mesure instrumentale n’est fournie.

## Médias et droits

Le projet n’embarque pas de fichiers de jeu SEGA, de chansons Vocaloid commerciales, de vidéos officielles ou de modèles extraits. Les noms de personnages servent à identifier les silhouettes de travail. Aucune licence d’exploitation de personnages ou d’œuvres tierces n’est fournie par cette archive. Les médias importés restent ceux de l’utilisateur ; aucun mécanisme de contournement ou d’extraction protégée n’est proposé.

## Détails spécifiques V3

L’import MIDI ordinaire préserve les instants de notes et le tempo musical reconnu, mais doit adapter les touches et placements. Les accords trop larges ou les notes hors du mapping choisi sont annoncés avant validation ; ce n’est pas un import officiel Project DIVA. Le mode natif ne restitue exactement la partition que lorsque le MIDI contient les métadonnées DIVA PULSE valides. L’export externe arrondit aux ticks et aux microsecondes par pulsation.

Les replays sont locaux et non certifiés contre la triche. Ils rejouent les entrées avec le moteur V3, pas une vidéo. Ils n’embarquent pas l’audio. La cohérence a été testée avec des entrées synthétiques et des événements clavier DOM, non avec un joueur physique ni toutes les conditions de décrochage matériel. Un replay d’une autre version de moteur peut diverger.

Le réglage d’horloge de présentation est optionnel. Le mode V2 reste sélectionné par défaut pour ne pas changer implicitement la calibration. Une API absente ou une corrélation non initialisée retombe sur l’horloge audio brute. Le métronome, le fond 3D, les lumières et l’animation ne sont pas une preuve de synchronisation instrumentale sur les périphériques de l’utilisateur.

L’analyse automatique reste à tempo global estimé ; la carte de tempo variable se corrige/importe dans le studio. Les repères de mesure et le montage automatique utilisent quatre temps par mesure. Les métadonnées MIDI de signature sont conservées comme provenance, mais ne pilotent pas une grille 3/4 ou 7/8.

Le ralenti modifie la hauteur du son avec la vitesse. La V3 ne prétend pas fournir du time-stretch avec conservation du pitch. Le barème HOLD reste indépendant et limité à cinq secondes, pas la logique complète de toutes les éditions SEGA.
