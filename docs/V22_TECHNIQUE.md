# V22 — Contrats techniques

## Référence des matériaux

La documentation primaire de babylon-mmd décrit les facteurs de teinte multiplicatifs et additifs des textures MMD :
https://noname0310.github.io/babylon-mmd/docs/reference/loader/mmd-model-loader/mmd-standard-material/

DIVA PULSE utilise son propre renderer, pas Babylon. Cette référence ne certifie donc pas sa fidélité complète. Les effets de texture suivent les formules de teinte documentées, tandis que les interactions complètes éclairage/toon/contours/spéculaire restent hors périmètre.

## Surfaces

`mmd-core.js` conserve les données des morphs PMX type 3–7 et 8. `mmd-surface.js` valide les index, nombres finis, opérations et cycles de groupes ; il évalue UV0, diffuse RGBA et les teintes diffuse/sphère. Les groupes sont développés par le runtime existant.

Les multiplicateurs s’accumulent sous la forme `1 + (facteur - 1) * poids`, les ajouts sous `ajout * poids`, puis la combinaison est `base * produit + somme`. Les paramètres originaux ne sont jamais modifiés. Le renversement de V est appliqué au déplacement UV comme aux coordonnées initiales.

Les sous-matériaux partagent leur tampon UV. Le renderer utilise `bufferSubData` lorsque l’effet est actif ou doit être remis à zéro. Les autres objets de scène reçoivent des facteurs neutres. Une opacité de zéro n’est plus remplacée par un via le fallback du tri de rendu.

Le shader applique les paramètres de teinte texture/sphère. Il ne reproduit pas tous les effets des morphs specular, ambient, edge et toon. UV1–4, flip et impulse restent non rendus. Des données présentes peuvent donc être conservées sans effet graphique ; les diagnostics font cette distinction.

## Temps source d’un VMD

Le module `motion-sync.js` intègre les conversions de temps et de beats existantes de `PulseCore` :

```
sourceTime = motionStart
           + (beat(songTime) - beat(clip.start)) * rate * 60 / sourceBpm
```

Le delta est borné à zéro avant le début du clip. La fonction beat intègre les segments de BPM successifs. Une boucle en temps utilise un modulo avant la conversion vers les secondes source, puis désactive le modulo historique de durée de fichier pour éviter de l’appliquer deux fois.

Cela rend le calage reproductible au curseur, à la pause/reprise et avec une cadence graphique variable. Cela ne détecte pas le tempo de la motion, ses contacts au sol ou ses changements de tempo internes.

## Données et priorité manuelle

`scene.mmd.files[].info.sync` conserve `{bpm,firstBeat,loopBeats}`. Le BPM absent signifie playback naturel. Le plan automatique conserve sa grille dans `director.rhythm`. Les clips peuvent porter `sourceBpm` et `loopBeats` en plus de leur `motionStart`.

Le plan automatique est invalidé quand la calibration source change, mais ses pistes verrouillées, son mode figé et les montages manuels restent préservés. Remplacer la motion d’un clip efface son ancien calage. La sauvegarde valide un clone avant son écriture ; l’état actif est modifié seulement après confirmation du stockage.

Les fichiers ne changent pas d’octets. Les références existantes sont remappées par les `.pulsepack` et les métadonnées suivent leur fichier. Aucun chart n’est réécrit par le calage. L’aperçu et la sélection de VMD acceptent maintenant les noms de morphs réellement correspondants, sans prétendre qu’un VMD facial constitue une danse complète.

## Portée des tests

Les tests de logique vérifient les structures et transformations. Les nouveaux parcours graphiques utilisent le vrai parseur PMX/VMD, comparent le framebuffer et lisent le tampon UV GPU, puis vérifient l’UI et l’export/restauration. Les reprises V21/V20 utilisent le HTML V22 avec une assertion de version actualisée, sans supprimer leurs contrats fonctionnels.

Le navigateur de cette infrastructure bloque la navigation loopback : les tests injectent les octets exacts du HTML dans Chromium, puis exécutent ses fonctions réelles. Le lanceur HTTP est testé séparément. Le stockage reste explicitement temporaire ; aucune persistance après redémarrage ni validation de périphérique physique ne découle de ces tests.
