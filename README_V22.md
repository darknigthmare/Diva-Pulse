# DIVA PULSE V22 — MMD Surfaces & Motion Sync

## Démarrer et migrer

Décompresser le ZIP, puis ouvrir `DIVA_PULSE_JOUER.html` dans un navigateur récent. `index.html` contient le même jeu. Les lanceurs Windows/macOS/Linux utilisent Python 3 pour le serveur local. Aucun compte, clé API ou CDN n’est nécessaire au jeu.

Exporter d’abord sa bibliothèque précédente en `.pulsepack`, puis l’importer en copies dans la V22. Garder l’ancienne sauvegarde jusqu’à vérification de quelques morceaux et spectacles. Si le badge **TEMPORAIRE** apparaît, exporter avant de fermer : les données de la session ne sont alors pas durablement conservées.

**Google Drive conserve les fichiers de livraison, pas une version hébergée du jeu.** Télécharger le HTML ou le ZIP pour jouer. Le dépôt n’ajoute pas de connexion Google au jeu et ne synchronise pas automatiquement les sauvegardes du navigateur.

## Import MMD et troupe réutilisable

Dans **Modules → MMD Stage**, importer le ZIP ou le dossier complet contenant les PMX/PMD, textures et sous-dossiers, ainsi que les VMD/VPD facultatifs. Un VMD est une animation, pas le personnage. Examiner le diagnostic puis le test 3D indépendant avant d’appliquer le pack. Le rendu incomplet accepté explicitement ne reconstitue pas les images manquantes.

Après l’import, **Utiliser cette troupe pour les futures musiques** réutilise les modèles. À l’import d’une chanson, les options **5 difficultés automatiques** et **Spectacle automatique** restent distinctes. Les morceaux déjà préparés manuellement ne sont pas remplacés par le choix d’une troupe par défaut.

La compatibilité MMD n’est pas universelle : un modèle peut se charger tout en dépendant d’une physique ou d’effets qui ne sont pas exécutés par ce runtime.

## Calage musical des VMD

Ouvrir **Modules → MMD Stage → Caler les motions sur la pulsation**.

| Champ | Utilisation |
|---|---|
| BPM source | Tempo connu de la chorégraphie, 20 à 400 BPM. Vide : lecture originale du VMD. |
| Premier temps dans le VMD | Instant de départ musical dans l’animation, en secondes, avant la fin du fichier. |
| Boucle en temps | Facultative, entière de 1 à 256 temps. La portion doit tenir dans le VMD. |

Exemple : à 120 BPM, quatre temps représentent deux secondes de motion. Sur une chanson à 150 BPM, ces quatre temps seront lus en 1,6 seconde. Le moteur suit également les changements de BPM de la chanson, sans dépendre du nombre d’images affichées.

**Le BPM source du VMD n’est pas détecté automatiquement : il faut le connaître et le renseigner.** Sans longueur de boucle, le fichier boucle sur sa durée totale, qui peut ne pas correspondre à un nombre entier de temps. Un mauvais BPM ou premier temps produit un mauvais calage. Le système ne répare pas les appuis, les proportions, les noms d’os ni le glissement des pieds. Il suppose un tempo source stable sur la portion utilisée.

**Enregistrer le calage** met à jour les pistes automatiques libres et les futures musiques qui réutilisent cette troupe. Les spectacles figés et les clips manuels restent prioritaires. Le Director expose également le BPM source et la boucle dans les réglages détaillés d’un clip ; les montages issus d’Auto Show conservent leur propre grille musicale.

Changer le VMD d’un clip efface son ancien calage pour éviter d’appliquer le tempo d’une autre motion. La sauvegarde `.pulsepack` conserve les métadonnées et remappe les références de médias à la restauration. Aucun timing de note n’est modifié par ces réglages.

## Morphs de surface PMX

Les variations suivantes sont maintenant appliquées dans le renderer :

| Fonction | Périmètre |
|---|---|
| Morph UV0, type 3 | Déplacement des coordonnées de texture, transmis au tampon GPU. |
| Diffuse RGBA, type 8 | Multiplication et addition, y compris l’opacité. |
| Teintes de texture et sphere map | Facteurs et ajouts séparés dans le shader. |
| Matériau -1 | Application à tous les matériaux du modèle. |
| Groupe de morphs | Combinaison des effets pris en charge. |
| Poids revenant à zéro | Retour à la base sans accumuler les déformations. |

UV supplémentaires, paramètres de contour, ambiance, spéculaire et toon ne sont pas rendus exhaustivement. Le diagnostic le signale. Il ne s’agit pas d’un rendu pixel-perfect de MMD Desktop.

Les VMD contenant seulement des morphs sont proposés si leurs noms correspondent aux morphs du modèle. Cela peut être une animation du visage ou d’un matériau, pas nécessairement une danse du corps. La correspondance de nom ne garantit pas à elle seule une chorégraphie appropriée.

## Exemples V22

`examples/v22/` contient `SURFACE_TEST.pmx`, `COLOR.tga` et trois VMD : `UV_SHIFT`, `FADE`, `GROUP`. Ces petits diagnostics originaux utilisent deux triangles et deux matériaux. Ils ne représentent pas les personnages finaux. Lors du fondu d’opacité, le modèle devient volontairement invisible.

Les exemples V19/V21, les morceaux originaux, les sources et les anciennes fonctionnalités restent fournis : AutoMap, éditeur, MMD Director, Auto Show, entraînement, replays, MIDI et sauvegardes.

## Limites et vérification

Bullet complet, soft bodies, effets MME, SDEF/QDEF exacts, contraintes IK exhaustives et certains matériaux restent à compléter. Les médias propriétaires ne sont pas ajoutés. Les licences des modèles et animations importés restent celles de leurs auteurs.

Le rapport courant est `RAPPORT_V22.md`, accompagné des logs `qa/v22/`. Les anciens rapports restent historiques. Les tests graphiques utilisent Chromium et WebGL2 logiciel SwiftShader. Ils ne certifient pas Safari/iPhone, un GPU réel, une manette/MIDI physique, l’installation PWA ou la persistance IndexedDB après fermeture.

Reconstruction : `python3 build.py`. Logique : `node --test tests/*.test.cjs`. Serveur : `python3 tests/launcher_test.py`. Tests navigateur : scripts `tests/v22_*browser.py` sous Chromium/Playwright, avec affichage graphique ou Xvfb. Les dépendances de test ne sont pas nécessaires pour jouer.
