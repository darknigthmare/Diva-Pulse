# DIVA PULSE V5 — Rapport de vérification

**Version : 5.0.0 · Precision & Musical Studio Edition · 6 octobre 2026.**

Base utilisée : archive V4 Encore & Library Edition fournie dans cette conversation. Sources modifiées, HTML reconstruit et parcours exécutés sur le jeu. Aucun déploiement d’un site existant.

## Résultats finaux

| Ensemble | Réussis | Échecs |
|---|---:|---:|
| Logique moteur, création, catalogue, audio, MIDI et contrats de cache | 198 | 0 |
| Parcours navigateur, cinq suites successives | 235 | 0 |
| Serveur et lanceur, HTTP Python loopback | 10 | 0 |

Ces chiffres sont des **assertions automatisées**, pas un nombre de joueurs testeurs, de périphériques physiques ou de sessions de qualification commerciale. Il n’y a pas de certification « sans bug ». Les différentes assertions d’un même parcours ne sont pas des tests indépendants de bout en bout.

`qa/v5/FINAL_RESULTS.json` rassemble les comptes. Les résultats V3/V4 archivés ne sont pas ajoutés aux totaux. Les suites de ces noms ont été **réexécutées** pour V5 ; leurs anciens noms désignent leurs scénarios de non-régression.

HTML courant : 415,938 octets. SHA-256 :

```text
d4e516bdce70492be12e89790f91bfc29a85a5f33bfd6869e8cae5d5bc17c6ef
```

`index.html` et `DIVA_PULSE_JOUER.html` sont identiques. Le fichier `qa/v5/build-tested.json` identifie le build. Le manifeste de l’archive couvre ses fichiers séparément.

## Méthode et environnement

Tests purs avec Node 22.16, serveur avec Python 3.13. Automatisation avec Python Playwright et Chromium local, sous Xvfb avec GPU logiciel SwiftShader. Le code, les styles et les scripts du vrai HTML autonome sont injectés avec `set_content`; aucune maquette distincte n’est utilisée.

Le navigateur a refusé la navigation vers le serveur loopback avec `ERR_BLOCKED_BY_ADMINISTRATOR`. Aucune modification de politique, contournement de permission, changement d’endpoint ou accès matériel forcé n’a été tenté. L’origine de la page injectée est opaque ; **le stockage est donc TEMPORAIRE et en mémoire**. Le serveur Python a été vérifié séparément avec des requêtes HTTP Python autorisées.

La CLI agent-browser n’était pas installée ; sa tentative d’installation a échoué sur la résolution DNS du registre. Les contrôles ont utilisé l’outil navigateur Playwright effectivement disponible. Le build et les lanceurs fournis n’ont besoin d’aucune installation de dépendance JavaScript.

## Répartition des suites navigateur

| Suite | Assertions réussies |
|---|---:|
| `tests/regression-v3.py` | 32 |
| `tests/advanced_browser_test.py` | 19 |
| `tests/creator_browser_test.py` | 50 |
| `tests/live_browser_test.py` | 72 |
| `tests/precision_browser_test.py` | 62 |

Les quatre premières couvrent les fonctions conservées : imports natifs/CSV/DSC, génération, éditeur, scènes, GLB animé, vidéo locale, replays, setlists, résultats, contrôles de partitions, catalogue, brouillons, sauvegardes, accords, adaptation de vitesse et scène 2D de secours. Les vérifications de version ont été mises à jour vers le moteur 5.0.0 et le pack 5, sans transformer les attentes fonctionnelles en simples tests de présence de texte.

## V5 : éléments vérifiés

### Audio à hauteur conservée

Le test DSP crée une sinusoïde de 440 Hz et traite réellement ses échantillons à 25 %, 50 %, 75 %, 100 %, 125 % et 150 %. La fréquence centrale mesurée reste à moins de 7 Hz de 440 Hz dans ce contrôle et la taille de sortie correspond à `round(tailleEntrée / vitesse)`. La vitesse unitaire rend une copie sans aliasing. Silence, audio très court, PCM non fini, vitesses invalides et canaux discordants sont couverts. Un couple stéréo en opposition de phase reste distinct et ne s’annule pas en silence.

Dans le navigateur, le passage d’entraînement démarre avec un **vrai Worker** et un tampon traité à 75 %, physiquement joué à `playbackRate = 1`. Le buffer original reste l’axe musical. Pause et reprise réutilisent ce tampon ; une tentative parfaite déterministe fait préparer le tampon à 80 %. L’historique retient la vitesse précédente. Sortie et annulation empêchent l’installation tardive d’un tampon abandonné. Le mode classique 25 % reste disponible sans traitement. Un fichier multicanal est refusé plutôt que réduit silencieusement à deux canaux.

Le décompte utilise de vrais oscillateurs Web Audio programmés. La conversion du décalage de saisie entre millisecondes réelles et temps ralenti est testée. **Il ne s’agit ni d’une écoute matérielle avec casque, ni d’une mesure de latence écran/Bluetooth, ni d’un test perceptuel sur des voix.**

### Mesures, studio et MIDI fichier

Mesures 3/4 et 7/8 via le panneau, conservation exacte des notes, protection de la source, annuler/rétablir et sauvegarde dérivée. Changement au milieu d’une mesure refusé atomiquement avec message. Tests purs supplémentaires pour le 6/8, groupes, origine de grille, BPM variables et lignes de mesure ne coïncidant pas avec la subdivision visible.

Le montage de caméras créé depuis l’interface suit les frontières de mesures. Une écriture volontairement refusée ne modifie pas la scène et affiche une erreur, sans rejet non intercepté. Les signatures MIDI standard et le JSON natif sont exportés puis relus ; le natif garde les groupes exacts. Un MIDI ordinaire utilise une carte compatible sans retimer ses notes ; un changement non représentable est signalé sans perdre les notes.

### Entrées MIDI en direct

Le refus réel de connexion dans l’origine non compatible est géré sans demander d’accès matériel. Les ports, messages et événements suivants sont **simulés explicitement dans l’adaptateur de l’application**, pas présentés comme des appareils physiques : note-on/off, vélocité zéro, filtres de canal, mappings, apprentissage et échange de notes, indépendance des ports, enregistrement d’un HOLD dans l’éditeur, arrêt/nettoyage, débranchement et déconnexion.

L’apprentissage respecte le port et le canal sélectionnés. Une entrée sélectionnée déconnectée reste indiquée comme telle ; elle n’est pas affichée à tort comme « toutes les entrées ». Les tests purs couvrent les messages malformés, les notes répétées, les canaux invalides et les commandes de fin de notes propres au canal.

### Académie

Les six cartes sont accessibles. Leur première utilisation ajoute un seul morceau original et six charts ; les lancements suivants ne le dupliquent pas. Un résultat parfait déterministe à vitesse complète produit une médaille séparée ; un HOLD sans le bonus exigé est refusé. Une simulation temporelle de jeu correct vérifie que **chacune des six médailles est effectivement atteignable**, dont 2 100 points de bonus pour la leçon HOLD face à un objectif de 1 600.

L’export V5 contient le WAV, les partitions et les progrès. La restauration confirmée ajoute des copies et conserve les meilleurs résultats. La validation refuse les progrès malformés avant modification. Ce sont des contrôles du contenu de packs sérialisés, pas une certification du gestionnaire de téléchargement de chaque système.

### Stockage et affichage

Le diagnostic détecte un média inutilisé sans le supprimer et s’exporte en JSON. Une connexion marquée invalidée refuse les cinq opérations get/all/put/del/atomic au lieu de basculer vers des données vides. Un morceau corrompu injecté dans le stockage mémoire n’empêche plus le démarrage de la bibliothèque saine ; son enregistrement brut est conservé, sans correction silencieuse.

Le rendu WebGL 2 est effectivement initialisé avec SwiftShader. Les pages bibliothèque, studio et réglages sont contrôlées à 390×844 et 844×390 pour le débordement horizontal ; l’Académie reste dans le viewport. Le panneau de bureau remplit sa largeur et propose trois colonnes lisibles. Des captures ont été examinées visuellement, pas seulement produites.

## Corrections issues de cette passe

Horodatage des entrées adapté au ralenti ; garde de génération avant et après la préparation audio ; reprise sur le tampon correspondant ; maintien du buffer original ; refus explicite du multicanal ; conservation des sources MIDI indépendantes ; nettoyage lors des changements de vue et des débranchements ; filtrage de l’apprentissage ; état honnête d’une entrée absente ; refus atomique de carte métrique et de sauvegarde PV.

L’inspection visuelle a révélé un panneau d’Académie dont le conteneur externe s’agrandissait sans élargir la carte intérieure. La largeur de la carte a été corrigée et une assertion de lisibilité ajoutée. Un premier défaut du **harnais de test** cherchait une extension de fichier sur une capture sans nom ; le harnais a été corrigé, ce n’était pas une perte de sauvegarde du jeu. Une autre correction du harnais encapsule l’injection d’une panne de stockage afin de ne pas exécuter le callback au moment de son installation. Les preuves de développement sont distinctes des résultats finaux.

## Contrôles du lanceur et du cache

Dix assertions HTTP : identité/version/hash du build servi, octets exacts, en-têtes no-cache/nosniff/no-referrer, réutilisation de la même version, manifest, service worker/icônes présents, refus de collision avec une autre application et refus d’un port invalide. Le lanceur utilise son port explicite sans en choisir un autre silencieusement.

Les contrats de service worker inclus dans les 198 tests de logique sont exécutés avec un environnement de cache simulé. **Le service worker n’a pas été installé dans le navigateur de cette QA.**

## Non vérifié ou non livré

Persistance IndexedDB après fermeture/réouverture, migration persistante inter-origines, bascule réelle entre deux onglets de versions différentes, installation PWA, redémarrage hors ligne, Safari/iOS, Firefox, Android, tactile réel, manette physique, permission et contrôleur MIDI matériel. Aucun framerate garanti sur appareil réel ; les viewports ne sont pas des téléphones.

Pas de reconstruction exhaustive 1:1 de SEGA : modèles, clips et chorégraphies officiels absents, barème propre au jeu, DSC partiel, pas de recherche automatique de niveaux officiels. Le générateur propose une heuristique rythmique à retoucher. Le WSOLA peut altérer le timbre et les attaques. Pas de compte cloud, classement distant, application native, multijoueur ni anti-triche.

## Reproduire

Depuis la racine, avec les outils déjà installés :

```sh
python3 build.py
npm test
python3 tests/launcher_test.py
python3 tests/run_browser_suites.py
node tests/make_v5_fixtures.cjs
```

Logs : `qa/v5/final-unit.tap`, `qa/v5/final-browser.log`, `qa/v5/final-launcher.log`. Résultats JSON des suites : racine `qa/` et `qa/v5/precision-browser.json`. Captures finales : `qa/v5/01-library.png` à `07-academy-*.png`, avec les captures de non-régression à la racine `qa/`. Les dossiers d’archive et de développement ne sont pas des preuves supplémentaires à additionner.

**Conseil de sauvegarde : exporter la V4 avant de la fermer, puis importer le pack dans V5. Badge TEMPORAIRE = exporter avant de quitter.**
