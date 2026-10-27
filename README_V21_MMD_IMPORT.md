# DIVA PULSE V21 — Import MMD & troupe automatique

Version 21.0.0. Cette livraison part de l’archive complète V20 Auto Show. Les sources, exemples et tests V20 sont conservés. Les rapports antérieurs décrivent leurs versions respectives, pas la validation de celle-ci. Consulter `RAPPORT_V21.md` pour les contrôles réellement exécutés.

## Est-ce que n’importe quel modèle téléchargé va fonctionner ?

**Non, pas de garantie universelle.** Le lecteur accepte des modèles PMX/PMD dans les limites décrites ci-dessous. Il faut leurs textures, un squelette compatible avec les animations et des fonctionnalités de rendu effectivement gérées. Un fichier qui se charge peut encore s’animer ou s’éclairer différemment de MMD Desktop. L’aperçu est donc important.

Un PMX/PMD est le modèle ; un VMD est une animation et un VPD une pose. Le projet de bureau PMM, les accessoires DirectX X, les effets MME et les scripts ne sont pas exécutés ici. Un fichier VMD seul ne remplace pas le pack du personnage.

## Démarrer et migrer

Exporter la bibliothèque V20 en `.pulsepack` avant de quitter cette version. Décompresser le ZIP V21 et ouvrir `DIVA_PULSE_JOUER.html`, ou utiliser le lanceur Windows/macOS/Linux fourni avec Python 3. `index.html` est le même jeu. Aucune installation de dépendances n’est nécessaire pour jouer.

Dans les réglages, restaurer la sauvegarde en copies. Garder le fichier original jusqu’à vérification des morceaux et spectacles. Si **TEMPORAIRE** apparaît, exporter avant de fermer. L’absence du badge n’est pas une promesse contre l’effacement du stockage par le navigateur ; conserver des sauvegardes indépendantes.

## Importer le modèle téléchargé

Dans **Modules → MMD Stage → Importer un ZIP MMD**, sélectionner l’archive complète. Le lecteur conserve les sous-dossiers et les chemins des textures. Les ZIP ordinaires non chiffrés, stockés ou DEFLATE, sont gérés. Pour RAR, 7z, ZIP64, mot de passe ou compression différente, décompresser soi-même puis utiliser l’import du dossier complet.

Il est également possible de sélectionner directement le PMX/PMD, ses textures et ses VMD/VPD. Les fichiers répartis dans des sous-dossiers se chargent plus sûrement via le dossier ou le ZIP. Lorsqu’une texture est référencée depuis un dossier parent du modèle, par exemple `../textures/peau.tga`, son chemin est désormais résolu dans le pack. Un chemin qui sort complètement du pack reste refusé.

Les anciens ZIP japonais peuvent avoir des noms de fichiers encodés différemment. Le choix **Auto UTF-8 / japonais**, **UTF-8** ou **Japonais Shift-JIS** permet de refaire l’import avec un autre décodage. Aucun de ces choix n’est une détection universelle de tous les anciens encodages ZIP. Les poses VPD acceptent UTF-8, UTF-16 avec indicateur et le repli Shift-JIS.

### Avant la sauvegarde

Le contrôle préalable affiche chaque modèle, ses sommets, triangles, os, matériaux, les textures introuvables ou illisibles, les os reconnus pour la danse procédurale et la correspondance des noms d’os avec chaque VMD.

**Structure importable** signifie seulement que les contrôles ont accepté les données. **Importable avec limites** précise des approximations ou fonctions non appliquées. **Refusé** empêche la sélection du modèle invalide. Le rapport JSON peut être exporté.

Cocher un seul modèle pour utiliser **Tester un modèle en 3D sans enregistrer**. Cet aperçu technique utilise un renderer séparé, une motion compatible disponible ou des mouvements procéduraux. Il n’écrit ni le pack ni la scène du morceau. Il ne certifie pas tous les mouvements possibles. Cocher ensuite jusqu’à quatre modèles et confirmer.

Des textures absentes ou indécodables bloquent par défaut la confirmation. La case d’acceptation explicite autorise un rendu incomplet avec les matériaux de secours ; elle ne répare ni ne génère les images manquantes. Une motion/pose invalide est exclue et signalée.

**Remplacer le pack et sa timeline** détache le Director manuel précédent : sauvegarder le morceau avant cette opération volontaire. Les anciennes partitions ne sont pas modifiées. Les fichiers de l’ancien pack ne sont pas effacés automatiquement. En cas de refus de sauvegarde, le nouveau pack n’est pas appliqué et le contrôle reste disponible pour réessayer.

L’import charge un pack complet : pour ajouter une motion à un personnage existant, réimporter le modèle, les textures et toutes les motions souhaitées ensemble. Il n’y a pas encore de fusion interactive de packs partiels.

## Utiliser la troupe sur les prochaines musiques

Après un import réussi, cliquer sur **Utiliser cette troupe pour les futures musiques**. Le réglage référence le morceau source, qui doit rester présent avec ses fichiers. Le jeu réutilise les mêmes ressources stockées sans recopier les blobs pour chaque musique, puis crée un spectacle propre au nouveau morceau.

Dans **Jouer**, laisser cochés **5 difficultés automatiques** et **Spectacle automatique**, puis importer la musique. Le nouveau morceau reçoit les difficultés manquantes et la troupe sélectionnée. Auto Show prépare les scènes existantes, formations, clips/mouvements, caméra et lumière selon l’analyse disponible.

Les morceaux déjà présents ne changent pas. Les nouvelles scènes contenant déjà un MMD, un GLB, un Director manuel ou des événements manuels ne sont pas remplacées. Désactiver la réutilisation ne supprime aucun personnage ni spectacle. Si le morceau source ou ses médias deviennent introuvables, le jeu n’invente pas de références de remplacement.

Le réglage est sauvegardé dans les préférences. Une sauvegarde complète `.pulsepack` permet de restaurer la troupe et de remapper son morceau source en cochant la restauration des réglages. Une exportation qui n’inclut pas ce morceau source ne suffit pas à rétablir le réglage ; le choisir à nouveau dans la bibliothèque restaurée.

## Ce que la danse automatique sait réellement faire

Sans VMD, les alias reconnus animent principalement la tête, le buste, les bras et les coudes. Un modèle au squelette inconnu reste en pose ou n’est animé que partiellement. Il n’y a pas de retargeting universel, de placement exact des pieds ou de chorégraphie complète déduite du seul PMX.

Avec VMD, la compatibilité des noms d’os aide à sélectionner les motions. Un ratio de noms communs n’assure ni les bonnes proportions du corps, ni l’absence d’interpénétration, ni un calage parfait des pas. Le tempo original d’un VMD quelconque n’est pas détecté automatiquement. Le montage suit les phrases et sections de la musique, mais n’invente pas les animations absentes.

Les scènes, caméras, formations et éclairages automatiques de V20 restent disponibles. Les pistes manuelles protégées restent prioritaires. Le spectacle ne réécrit pas les partitions ; le générateur de cinq difficultés n’a pas été remplacé par cette passe d’import.

## Limites techniques actuelles

| Élément | Limite ou comportement |
|---|---|
| Modèles MMD simultanés | Jusqu’à quatre, selon les ressources disponibles |
| Squelette PMX/PMD | Jusqu’à 1 024 os, contre 256 auparavant ; 300 os effectivement testés dans le renderer |
| Géométrie par modèle | 350 000 sommets et 500 000 triangles maximum |
| Fichiers utiles par import | Jusqu’à 200 modèles/motions/poses/textures |
| Taille de fichier | 80 Mio maximum par fichier ; 180 Mio pour l’ensemble |
| Archive ZIP | 180 Mio, 1 200 entrées de répertoire au plus ; pas de chiffrement, ZIP64 ou multivolume |
| Images | PNG/JPEG/BMP/WebP décodables par le navigateur, TGA via le décodeur local ; limites de dimensions/pixels |
| SPH/SPA | Les contenus réellement décodables sont utilisés ; ce n’est pas la totalité des matériaux MMD |
| SDEF et QDEF | Toujours approximés par la déformation linéaire ; pas d’implémentation exacte ajoutée ici |
| Physique | Pas de simulation Bullet complète, ni soft bodies |
| Rig | Héritages additionnels et contraintes articulaires IK non reproduits exhaustivement |
| Morphs | Sommets/os/groupes gérés ; morphs UV, matériaux et impulsions non appliqués |
| Effets | Toon simplifié ; MME, scripts et shaders arbitraires non exécutés |
| Sans WebGL2 | Le pack peut être contrôlé et stocké, mais l’aperçu 3D est désactivé ; décor 2D de secours |

Ces plafonds sont des garde-fous, pas des garanties de fluidité. La limite de palette des modèles GLB n’est pas augmentée par cette modification MMD. Les sommets sont désormais partagés entre les matériaux d’un même modèle sur le GPU ; cela évite de recopier tout le maillage pour chaque matériau, sans constituer un benchmark de performance.

## Exemples originaux inclus

`examples/v21/TROUPE_ORIGINALE_V21.zip` contient deux petits robots PMD, un VMD et une texture TGA dans des sous-dossiers. Il permet de tester le chemin complet ZIP → contrôle → aperçu → import → musique → spectacle.

Les packs `TEXTURE_MANQUANTE_V21.zip` et `MODEL_INVALIDE_V21.zip` servent à vérifier les diagnostics. `SQUELETTE_300_OS.pmd` et `MOTION_300_OS.vmd` testent réellement une palette dépassant 256 os. Ce sont des fixtures techniques originales, pas des personnages Vocaloid ou des modèles artistiques finalisés.

## Sources externes consultées

Les ressources suivantes documentent les formats et des moteurs tiers ; DIVA PULSE n’embarque pas ces moteurs et n’hérite pas de leurs fonctions de physique ou de rendu.

- Babylon MMD, « Introduction to PMX and PMD » : https://noname0310.github.io/babylon-mmd/docs/reference/understanding-mmd-behaviour/introduction-to-pmx-and-pmd/
- Babylon MMD, « MMD Model Loader » : https://noname0310.github.io/babylon-mmd/docs/reference/loader/mmd-model-loader/
- three-mmd-loader, tableau de compatibilité : https://github.com/yohawing/three-mmd-loader

Conserver les README des modèles et motions importés pour vérifier les conditions définies par leurs créateurs. Aucun modèle propriétaire n’est ajouté à cette livraison.
