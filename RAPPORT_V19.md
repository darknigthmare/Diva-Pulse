# DIVA PULSE V19 — rapport de vérification

**Build 19.0.0 · livraison du 6 octobre 2026.** Sources modifiées et exécutées à partir de l’archive V16 récupérée. Aucun résultat V17/V18 annoncé sans fichier vérifiable n’est repris comme preuve.

## Résultats finaux réellement exécutés

| Ensemble | Réussis | Échecs | Portée |
|---|---:|---:|---|
| Contrats de logique Node | 338 | 0 | 281 contrats de la base + 57 nouveaux contrats V19 |
| Parcours Chromium V19 | 57 | 0 | UI, import, montage, WebGL, stockage temporaire, sauvegardes, audio, fallback |
| Diagnostic PMX/VMD WebGL | 4 | 0 | Test graphique historique rejoué sur le HTML final |
| Lanceur HTTP Python | 10 | 0 | Identité du build, octets servis, en-têtes, ressources locales et conflits de port |

Ces nombres sont des **contrôles automatisés**, pas des testeurs humains distincts, ni une certification de compatibilité totale ou une garantie d’absence de bugs. Les cas volontairement refusés sont des tests positifs de validation : ils n’ont pas été supprimés du parcours pour obtenir ce total.

## Exécution navigateur

Les 57 contrôles V19 passent dans Chromium 144.0.7559.96 sur Linux, avec WebGL2 via ANGLE/SwiftShader sous Xvfb. Le rendu est réel mais logiciel ; aucune performance sur GPU matériel n’en est déduite. Node : 22.16.0. Python : 3.13.5.

La navigation locale HTTP et file est bloquée par la politique du navigateur de test. Le document HTML est donc injecté par Playwright. **Le stockage IndexedDB après fermeture/rechargement n’est pas validé** : l’application utilise son adaptateur temporaire et affiche bien TEMPORAIRE. Le serveur local est testé séparément avec Python.

Aucune exception JavaScript non interceptée n’a été relevée dans le parcours final. Aucun appel réseau externe n’a été observé. Les avertissements console conservés incluent les pannes de sauvegarde volontairement injectées, le média manquant volontairement testé et le repli sans WebGL. « Zéro exception non interceptée » ne veut pas dire « aucune erreur simulée ».

## Contrôles fonctionnels importants

**Import MMD et rendu.** Le sélecteur de fichiers charge réellement deux PMD originaux, deux VMD et une texture TGA RLE. Les squelettes sont indépendants, les morphs PMD sont remappés et la texture est chargée sur le GPU. Le test compare les pixels de la scène avec les personnages visibles puis masqués : il ne se contente pas de vérifier l’existence d’un canvas. Un PMX de diagnostic est également rendu dans la suite graphique distincte.

**Transitions et timeline.** Le mélange à 50 % est comparé aux poses calculées des deux motions. Les temps source/vitesse sont testés séparément. Les parcours modifient les clips, testent undo/redo, refusent un chevauchement, déplacent un clip à la souris dans un intervalle libre et restaurent son état. Les pistes caméra/lumière modifiées dans l’UI sont chargées dans le runtime ; une intensité zéro est vérifiée jusqu’à l’uniforme du shader.

**Non-destruction et pannes.** Le brouillon du Director ne modifie pas le spectacle sauvegardé. Une écriture volontairement refusée conserve la fenêtre et l’ancienne scène ; la tentative suivante réussit. Les signatures de toutes les partitions sont comparées avant et après le montage du spectacle.

**Sauvegarde complète.** La méthode d’export réellement utilisée par les boutons de l’application contient toutes les ressources MMD référencées. La restauration crée une copie avec de nouveaux identifiants ; ses deux personnages sont rechargés dans le renderer. Un pack amputé d’un média est refusé sans insérer de morceau partiel. Cette validation concerne l’adaptateur de stockage temporaire de la session, pas une fermeture/reprise d’IndexedDB.

**Audio et rythme.** Le fichier original TRIPLE_PULSE.wav est décodé et analysé dans le navigateur. Les cinq difficultés portent la révision 19, leurs événements hérités correspondent et leurs marges silencieuses restent sans notes. Une partie complète utilisant ce véritable audio se termine à 100 % en Autoplay avec le profil Précision, sans record normal écrit. Ce test ne prouve pas une qualité de mapping parfaite sur toute musique.

**Présentation et repli.** Le Director est contrôlé à 390 × 844 avec les libellés de boutons contenus dans leurs contrôles. Cela reste une simulation de viewport, pas un essai iPhone. Un deuxième contexte avec WebGL désactivé conserve l’édition et la sauvegarde du Director, annonce l’aperçu indisponible et charge le jeu en repli 2D.

## Correctifs trouvés pendant cette reprise

- Le décalage interne d’un clip VMD ne doit pas être multiplié par sa vitesse ; les intervalles ne doivent pas réutiliser silencieusement l’ancienne motion.
- Les morphs PMD utilisent les indices du morph de base, pas directement ceux de la géométrie.
- Le chemin actif d’export/restauration doit inclure les modèles, textures, motions de base et motions de chaque clip.
- Un Auto-PV dont le dernier instant était arrondi au millième pouvait dépasser la durée exacte d’une démo et être refusé. Les trois démos ont désormais un contrat de non-régression sur cette borne.
- Les notifications de changement ne doivent pas ajouter des opérations identiques dans l’historique, au risque d’imposer plusieurs annulations pour une seule édition.
- Le premier oracle graphique inspectait uniquement le carré central, qui pouvait être uniformément coloré. Il a été remplacé par une comparaison de scène avec/sans modèles.
- Les premiers essais de harnais contenaient une affectation de fonction interprétée comme un appel par Playwright et un sélecteur de titre avec underscores. Ce sont des corrections du test, pas des fonctionnalités attribuées au jeu.
- Les libellés mobiles ont été réadaptés pour éviter leur dépassement des boutons.

## Journaux probants

- `qa/v19/logic-final.log`
- `qa/v19/browser-run.log` et `qa/v19/browser-final.json`
- `qa/v19/pmx-webgl-final.log`
- `qa/v19/launcher-final.log` et `qa/v19/launcher-results.json`
- `qa/v19/01-library.png` à `07-pmx-webgl.png`
- `qa/v19/navigation-blocked.log` pour la restriction de navigation

Les journaux de développement et anciens rapports sont conservés à titre historique ; ils ne s’ajoutent pas aux totaux ci-dessus. `BUILD_V19.json` décrit le build, la base et la portée des tests. `SHA256SUMS.txt` contient les empreintes de la livraison.

## Non validé ou non livré

Persistance après fermeture complète du navigateur, installation PWA/hors-ligne après installation, Safari/iPhone, manettes/MIDI physiques, très grandes bibliothèques, vastes collections PMX/PMD complexes, comparaison pixel-perfect avec MMD Desktop, physique Bullet/rigid bodies/joints/soft bodies, SDEF/QDEF exacts, contraintes IK exhaustives, accessoires externes génériques, synchronisation labiale automatique, scoring SEGA complet et déploiement distant.

Le détail fonctionnel se trouve dans `docs/V19_CAPACITES_ET_LIMITES.md`. Les modèles et musiques officiels ne sont pas inclus. Les diagnostics sont originaux et ne représentent pas des personnages Vocaloid finalisés.
