# DIVA PULSE V19 — Studio & Reliability

Jeu de rythme local en développement, construit sur l’archive V16 récupérable. Les annonces V17/V18 sans fichiers vérifiables ne sont pas considérées comme une base livrée : leurs chantiers utiles ont été réimplémentés et testés ici.

## Lancer le jeu

Décompresser tout le ZIP. Ouvrir `DIVA_PULSE_JOUER.html` dans un navigateur de bureau récent, ou lancer `LANCER_WINDOWS.bat` / `LANCER_MAC_LINUX.command` avec Python 3 installé. La commande équivalente est `python3 lancer.py`. Le serveur écoute exclusivement `127.0.0.1:8765` ; garder sa fenêtre ouverte.

Le HTML contient les scripts, styles et instrumentaux procéduraux intégrés. Aucun compte, clé API, CDN ou téléchargement de modèle n’est nécessaire. Le dossier contient aussi les sources, exemples et tests. Les modèles/motions MMD supplémentaires sont fournis par l’utilisateur.

Le badge **TEMPORAIRE** signifie que la bibliothèque se trouve en mémoire : exporter un `.pulsepack` avant de fermer. Le navigateur, son profil, l’adresse et le port déterminent l’espace de stockage ; ne pas présumer qu’ouvrir une autre copie de HTML retrouve les mêmes données.

## Migration sans perte volontaire

1. Dans la version précédente, exporter la bibliothèque en `.pulsepack` et conserver ce fichier intact.
2. Ouvrir V19. Dans Réglages, importer le pack ; la restauration crée des copies et ne remplace pas les morceaux existants.
3. Vérifier l’audio, les niveaux et les fichiers du spectacle MMD. Exporter ensuite une nouvelle sauvegarde.

Un pack ancien qui omettait déjà les modèles ou textures ne peut pas les recréer. La V19 signale les références absentes plutôt que d’enregistrer un spectacle incomplet. Réimporter les fichiers originaux dans ce cas. Les anciennes partitions et leurs identifiants ne sont pas régénérés pendant cette migration.

## Import musical et AutoMap

Dans **Jouer**, laisser « 5 difficultés automatiques » activé et importer l’audio par le bouton + ou glisser-déposer. Une partition exacte du catalogue local est prioritaire ; seules les difficultés absentes sont générées.

La génération repose sur une famille commune EASY → NORMAL → HARD → EXTREME → EX EXTREME. Les repères hérités conservent temps, symbole et position. La carte de tempo variable est utilisée pour la quantification. V19 ajoute une décision locale binaire/ternaire lorsque plusieurs attaques soutiennent la subdivision ternaire. Le recalage automatique reste limité à 25 ms ; sans quantification, les attaques retenues ne sont pas déplacées.

Le mapping reste heuristique. Écouter le résultat, examiner ses avertissements et corriger dans le Studio lorsque nécessaire. Les voix ne sont pas séparées du mixage, la forme couplet/refrain n’est pas garantie, et une version réencodée d’un audio n’est pas identifiée comme le même fichier par son SHA-256. Il n’y a pas de recherche automatique de niveaux officiels sur Internet.

## Importer un spectacle MMD

Dans **Modules → MMD Stage**, choisir « Importer un pack MMD » pour plusieurs fichiers, ou « Importer un dossier » pour conserver une arborescence de textures. Inclure les `.pmx`/`.pmd`, les motions `.vmd`, éventuellement la pose `.vpd` et les textures.

La résolution d’une texture préfère son chemin relatif au modèle, puis un chemin racine correspondant. Un simple nom de fichier n’est utilisé que lorsqu’il est unique. Deux textures homonymes ne sont pas associées arbitrairement.

Le pack est validé avant son enregistrement. Limites actuelles : 200 fichiers, 180 Mo au total et 80 Mo par fichier ; 256 os, 350 000 sommets et 500 000 triangles par modèle. Les grands modèles et quatre danseurs peuvent rester coûteux même sous ces plafonds.

Le décodage TGA local prend en charge les images couleur, niveaux de gris et indexées, non compressées ou RLE, selon les profondeurs reconnues. Les paquets tronqués, indices invalides et images hors budget sont refusés. Le rendu PMD reprend maintenant ses morphs faciaux via la table du morph de base.

## Director : montage et aperçu

Après l’import du pack, ouvrir **DIRECTOR · TIMELINE & PLANS**. Choisir de un à quatre danseurs, leur modèle, leur motion et leur espacement. « Auto-PV » remplace uniquement le brouillon du spectacle, pas les partitions.

La bande générale présente les clips. Ouvrir « réglages détaillés » sous un danseur pour modifier sa motion, le début/fin dans la chanson, sa vitesse, son point de départ à l’intérieur du VMD, le fondu, la boucle et la caméra VMD. Un glisser déplace le clip dans un intervalle libre ; les chevauchements sont refusés. Annuler/Rétablir fonctionne sur les changements du brouillon, sans ajouter une opération vide lorsqu’une valeur n’a pas changé.

Le temps de motion est calculé ainsi : `(temps de chanson − début du clip) × vitesse + départ VMD`. Le départ VMD n’est pas multiplié une seconde fois par la vitesse.

Le **fondu** mélange la dernière pose du clip adjacent précédent avec la pose du nouveau clip. Positions d’os, rotations et poids de morphs sont mélangés. Il s’agit d’une transition depuis une pose de sortie maintenue, pas d’un chevauchement de deux chorégraphies qui continueraient toutes deux à avancer. Une valeur de zéro effectue une coupe. Aucun fondu n’est créé à travers un intervalle vide. Dans un intervalle sans clip, le danseur est masqué ; choisir un clip « Pose VPD / repos » pour le garder en pose.

Dans « Caméra & éclairage », ajouter les clés au curseur puis régler leurs valeurs. Les courbes proposées sont smooth, linear et step. La piste caméra manuelle est prioritaire sur la caméra VMD ; la vider redonne priorité au VMD ou au comportement de scène. L’intensité lumineuse zéro reste une valeur valide.

« Charger l’aperçu » charge le brouillon dans une vue large, puis le curseur examine sa pose au temps choisi. Cet aperçu est silencieux. L’édition ne remplace pas silencieusement le spectacle sauvegardé. **Enregistrer le spectacle** écrit la version validée ; un échec d’écriture conserve le brouillon dans la fenêtre. Fermer sans enregistrer abandonne ce brouillon et rétablit le spectacle sauvegardé. Ce brouillon Director n’est pas un autosave durable après fermeture.

L’export Director JSON ne contient que les associations du spectacle et convient au même pack MMD. Utiliser l’export de morceau complet `.pulsepack` pour transporter les modèles, textures et motions vers une autre bibliothèque.

## Profils de jugement

Dans Réglages, choisir Standard, Accessible ou Précision. Les fenêtres symétriques COOL/FINE/SAFE/SAD sont respectivement :

| Profil | COOL | FINE | SAFE | SAD |
|---|---:|---:|---:|---:|
| Standard | ±33 ms | ±67 ms | ±100 ms | ±140 ms |
| Accessible | ±45 ms | ±90 ms | ±135 ms | ±180 ms |
| Précision | ±25 ms | ±50 ms | ±75 ms | ±100 ms |

Ce sont des profils DIVA PULSE, pas une reproduction certifiée des fenêtres de toutes les éditions SEGA. Les timings des notes restent inchangés. Les records Accessible et Précision sont isolés du Standard. Un replay conserve le profil utilisé ; les anciens replays sans champ explicite utilisent Standard. Autoplay et entraînement ne créent pas de record normal.

## Ce qui n’est pas annoncé comme terminé

Physique Bullet, corps souples, skinning SDEF/QDEF de référence, matériaux/toon et contraintes IK MMD exhaustifs, compatibilité avec toutes les collections de modèles, modèles/costumes/chansons officiels, conformité 1:1 du scoring, test de vrais périphériques et Safari/iPhone.

Le lecteur ne télécharge aucune dépendance et aucun média propriétaire. Les droits sur les fichiers que vous importez restent ceux de leurs auteurs. Les deux petits robots et leurs fichiers de contrôle V19 sont des diagnostics originaux, pas des Vocaloids détaillés.

## Sources, compilation et tests

- `python3 build.py` reconstruit `index.html` et `DIVA_PULSE_JOUER.html` sans installation de paquets.
- `node --test tests/*.test.cjs` exécute les contrats de logique (Node 22 ou ultérieur).
- `python3 tests/launcher_test.py` vérifie le serveur local.
- `python3 tests/v19_browser_test.py` utilise Playwright et Chromium disponibles localement. Sur le Linux de cette livraison, WebGL utilise SwiftShader sous Xvfb (`DISPLAY=:99`).
- `python3 tests/mmd_runtime_browser.py` rejoue le diagnostic PMX/VMD historique.

Le rapport **RAPPORT_V19.md** décrit les résultats effectivement obtenus. Les anciens rapports dans le pack sont historiques et ne constituent pas des validations supplémentaires de V19. Les tests navigateur de cette session injectent le document HTML : la navigation HTTP et file étant bloquée par la politique du navigateur, ils ne prouvent pas la persistance IndexedDB après fermeture ni l’installation PWA.
