# DIVA PULSE V23 — Rapport de vérification

## Traçabilité

Base : V22 complète réellement extraite et conservée sans modification. Version testée : **23.0.0 — Audit & Compatibility**.

HTML autonome : **699 498 octets**. SHA-256 :

`0c88113152e6ac4299d35611b44abbd6964e81ec23baa1861a5b9005ed6b7cf0`

Les quatre suites d’intégration et le diagnostic natif portent cette même empreinte. `index.html` et `DIVA_PULSE_JOUER.html` sont identiques. Les guides et audits sont écrits après les essais ; ils n’altèrent pas les octets du programme testé.

## Résultats exécutés sur cette version

| Suite | Résultat | Preuve |
|---|---:|---|
| Logique : historique + contrats V23 | **548/548** | `qa/v23/logic-final.txt` |
| Nouvelles intégrations V23 | **39/39** | `qa/v23/integration/browser-final.json` |
| Parcours surfaces/calage V22 réexécutés | **28/28** | `qa/v23/regression-v22/browser-final.json` |
| Parcours import MMD/troupe V21 réexécutés | **44/44** | `qa/v23/regression-v21/browser-final.json` |
| Parcours Auto Show V20 réexécutés | **57/57** | `qa/v23/regression-v20/browser-final.json` |
| Diagnostic natif PMX/VMD avec WebGL2 | **4/4** | `qa/v23/final-v23_native_mmd_browser.txt` |
| Lanceur/HTTP/port occupé | **10/10** | `qa/v23/launcher-final.txt` |

Les 548 tests de logique comprennent les **474 tests historiques et 74 nouveaux**. Les 168 contrôles navigateur correspondent à 39 + 28 + 44 + 57 vérifications de parcours, pas à 168 appareils différents. Certains noms de tests historiques mentionnent encore leur version d’origine ; ils sont rejoués sur le HTML V23 identifié ci-dessus.

Les journaux finaux ne contiennent aucune exception JavaScript non interceptée. Ils contiennent volontairement les erreurs attendues des scénarios « QA song denied », « QA delete list denied », préférence invalide et quota refusé. Des avertissements de performance liés aux lectures GPU de contrôle apparaissent également : **on ne prétend pas que toute la console est vide**.

## Scénarios nouveaux de bout en bout

La transaction Store est réellement annulée par le pilote de test ; les préférences retournent à leur instantané confirmé. Les boutons de favori, métadonnées et setlist sont ensuite utilisés avec une écriture refusée. Les données sources restent intactes et les champs/file d’attente sont conservés pour réessayer.

L’export est exécuté alors que toutes les nouvelles écritures sont refusées. Une partition non enregistrée du studio apparaît comme brouillon séparé dans le fichier, sans changement de la source. La restauration de préférences invalides refuse l’ensemble avant insertion.

Le Director est ouvert, modifié, fermé, rouvert et récupéré via le véritable bouton. L’action est annulée puis rétablie. Un refus d’écriture du brouillon laisse la version récente disponible en mémoire. L’export, la restauration en copies, le remappage des modèles/motions et l’application explicite du brouillon restauré sont vérifiés. Deux modèles sont rechargés dans le renderer. Les notes ne changent pas.

Une vraie perte du contexte est provoquée avec `WEBGL_lose_context` pendant un PV. La partie et le temps audio s’arrêtent. Après restitution, les deux modèles sont recréés et la scène sauvegardée reste identique. La lecture ne reprend pas automatiquement. Ce contrôle ne simule pas la perte en envoyant seulement un événement DOM.

Le nouveau diagnostic est utilisé dans les réglages et exporté ; les morceaux avant et après sont comparés pour vérifier son caractère non destructif. Le panneau de récupération est contrôlé à 390 × 844 pixels.

## Déformation SDEF/QDEF

Les tests binaires vérifient la conservation des centres, leur inversion Z et le rejet d’un payload non fini. Les calculs CPU sont comparés à des cas analytiques : identité, translation, rotation commune, torsions opposées, franchissement de 180 degrés, poids extrêmes et correction des centres SDEF. Une forme développée indépendante vérifie cette dernière équation.

Le test GPU lit **36 sorties de transform feedback** : 12 transformations pour chacun des chemins BDEF/LBS, SDEF et QDEF. L’écart maximal mesuré avec la référence CPU est **0.0000036079**, inférieur au seuil **0,00002**. Il s’agit d’unités du modèle dans ces fixtures, pas de mètres ni d’une tolérance universelle de personnage.

Un premier essai a mis en évidence une dérive de normalisation quaternion dans la branche GLSL. La formule a été corrigée, puis les essais finaux ont été rejoués. Le journal initial est conservé comme diagnostic de développement et n’est pas une preuve de succès final.

Le renderer importe les petits PMX originaux et transmet les attributs SDEF/QDEF aux vrais buffers. Deux matériaux partagent une palette d’os, envoyée une fois par modèle et par image. Le tableau de palette est réutilisé au frame suivant. Ces contrôles ne certifient ni les héritages d’os, ni la physique, ni un personnage téléchargé quelconque.

## Mesure de génération AutoMap

Fixture d’analyse synthétique : **600 secondes, 7 475 attaques**. Nombre de notes par niveau : **896 / 1 403 / 2 228 / 3 301 / 4 483**.

Oracle V22 : **1842.664 ms** ; générateur V23 : **221.173 ms**. Égalité complète des notes : **oui**. Dix autres variantes de graine/style complètent le contrôle. Le test utilise une copie non modifiée du générateur V22 dans `tests/reference/`.

Ce benchmark mesure seulement la génération à partir des attaques déjà calculées, pas l’import complet, le décodage audio ou la persistance. Il ne garantit pas le même facteur d’accélération sur toute chanson ou tout appareil. Il ne démontre pas une amélioration de qualité musicale.

## Environnement et limites

Python Playwright, Chromium, Xvfb et **WebGL2 logiciel SwiftShader**. Aucun GPU physique. Le HTML exact est injecté avec `set_content` dans un document d’essai car la navigation du navigateur vers l’origine locale est bloquée. Une tentative de page interceptée localement a également reçu `net::ERR_BLOCKED_BY_ADMINISTRATOR` ; aucune tentative de contournement n’a été poursuivie.

Le stockage du document est **TEMPORAIRE**. Les contrats de transactions et pannes sont testés, mais **pas** IndexedDB après fermeture complète d’un navigateur réel, les conflits entre fenêtres de même version, l’installation PWA, Safari/iPhone, une manette physique ou un instrument MIDI réel. Le serveur HTTP et les fichiers du shell hors ligne sont contrôlés séparément, sans en déduire une installation PWA validée.

Le rollback GLB a été renforcé et relu ; son scénario de panne graphique pendant une sauvegarde n’a pas fait l’objet d’un nouveau parcours exhaustif. La sphere map utilise le repère caméra et le shader est exercé ; aucune comparaison pixel-perfect globale avec MMD Desktop n’est annoncée.

Les nouveaux modèles sont des fixtures originales. Bullet, corps souples, MME, héritages d’os complets, retargeting des pieds, synchronisation labiale et règles SEGA exhaustives demeurent ouverts dans `AUDIT_V23.md`.

## Livraison et stockage distant

Le packaging relit le ZIP et vérifie les empreintes de tous les fichiers. Le manifest et le service worker portent la version 23. Les rapports historiques restent historiques.

Le dossier Google Drive a été relu : la V22 reste présente. **Aucune V23 n’a été envoyée sur Drive**, car les actions actuelles du connecteur sont en lecture seule. Le rapport ne transforme pas une simple lecture du dossier en confirmation de dépôt. Les fichiers V23 sont fournis directement en téléchargement.
