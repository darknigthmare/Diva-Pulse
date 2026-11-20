# BIBLE DIVA PULSE — V1

**Document de référence produit.** Version 1, base `main` `fc8e453d102c62c75b65d9a2a33dc076d2511330`, build V38.0.0. Statut : proposition à valider par le propriétaire du projet. Ce document décrit une cible ; il ne certifie aucune fonctionnalité non prouvée.

Sources normatives à conserver : [règles du jeu](REGLES_DIVA_PULSE_V1.md), [guide V38](V38_FINITION_JOYABLE.md), [provenance des contenus](PROVENANCE_CONTENUS.md), [suivi V38](../planning/BACKLOG_V38.json). En cas de contradiction, le contrat des règles et les tests priment sur ce document.

## 1. Fiche du jeu

| Élément | Valeur |
|---|---|
| Titre | DIVA PULSE |
| Genre | Jeu de rythme solo, création de partitions et montage de spectacle |
| Moteur | Moteur web maison (Canvas 2D, WebGL 2 direct, Web Audio), aucun moteur tiers |
| Diffusion | Deux HTML autonomes, PWA hors ligne optionnelle, lanceurs Windows/macOS/Linux |
| Compte | Aucun. Bibliothèque locale IndexedDB, export `.pulsepack` / `.pulsebundle` |
| Session type | 3 à 12 minutes par morceau ; 30 secondes pour une leçon |
| Public | Joueurs de jeux de rythme, créateurs de partitions, monteurs de clips MMD |
| Promesse | « Ta musique, ta partition, ton spectacle — chez toi, sans réseau. » |

Le jeu ne fournit **aucun catalogue musical officiel**, aucun modèle MMD tiers et aucune reproduction certifiée d'une édition commerciale de Project DIVA. Les noms de personnages identifient des silhouettes de travail.

## 2. Piliers et anti-objectifs

**Piliers**

1. **Le temps musical fait foi.** Les jugements dépendent des timestamps et du transport audio, jamais des images, des effets ou de la caméra.
2. **La donnée appartient au joueur.** Bibliothèque locale, exports complets, aucune télémétrie silencieuse.
3. **Créer autant que jouer.** Éditeur, AutoMap, Auto Show et Director sont des modes de première classe, pas des annexes.
4. **Honnêteté des limites.** Un import accepté n'est pas une compatibilité universelle ; un compteur n'est pas une note de finition commerciale.

**Anti-objectifs**

- Compte obligatoire, cloud implicite, monétisation, publicité, mécaniques de rétention obscures.
- Verrouillage du contenu existant derrière la progression.
- Remplacement silencieux d'une partition, d'un record ou d'un brouillon.
- Revendication « AAA » sans budget, assets, localisation et certification correspondants.

## 3. Boucles de jeu

| Horizon | Boucle | État V38 |
|---|---|---|
| 30 s | Choisir une leçon ou un morceau, jouer un passage | Académie 8 leçons, entraînement avec boucle A/B |
| 10 min | Jouer, lire le résultat, rejouer ou corriger un passage | Résultats, suggestions de pratique, replay |
| Session longue | Progresser, éditer, monter, exporter, revenir | Progression locale, studio, Director, archives |
| Création | Importer un audio, générer ou écrire, jouer, partager le pack | Fonctionnel, corpus réel limité (`MAP-01`) |

La boucle `jouer → résultat → progresser → rejouer` est fermée en V38 par les objectifs, les niveaux et deux modules à débloquer. Elle n'est pas encore reliée à une carrière scénarisée.

## 4. Modes et contenu

| Mode | Rôle | Limite assumée |
|---|---|---|
| Live | Jeu normal, records et replays | Records locaux, séparés par profil de jugement |
| Entraînement | Boucle, ralenti, passage ciblé | Pas de record |
| Autoplay / PV | Écoute et clip | Pas de record |
| Académie | Apprentissage guidé | Compréhension humaine non testée (`QA-07`) |
| Studio | Écriture et correction de partitions | Pas de garantie 1:1 DSC |
| AutoMap | Cinq difficultés reproductibles | Heuristique locale, pas une transcription |
| Auto Show | Chorégraphie, caméra, lumière | Pas une chorégraphie officielle |
| Director / MMD | Montage de scènes et clips | Compatibilité décrite par fonction, pas universelle |

## 5. Règles

Le contrat versionné est [REGLES_DIVA_PULSE_V1.md](REGLES_DIVA_PULSE_V1.md) : profils `standard`, `accessible`, `precision`, fenêtres, barème, HOLD, chaînes, accords, offsets, modes, records et replay (`rules4`). La bible n'en duplique pas les valeurs : toute évolution exige une nouvelle version du contrat, des fixtures et des tests associés. Aucun record existant n'est recalculé ou migré sans décision explicite.

## 6. Difficulté et courbe

Cinq niveaux (`EASY` à `EX EXTREME`) partagent les mêmes repères musicaux ; les niveaux supérieurs ajoutent densité, accords et slides sans changer le tempo. La difficulté doit rester **lisible** avant d'être dense. Le contrôleur de jouabilité (`MAP-04`) reste à industrialiser : croisements de mains, simultanéité sur une même main, temps de réaction et pics de densité.

## 7. Progression et économie locale

- XP **dérivé** des records, sessions et médailles d'académie, recalculé à chaque affichage : aucun double crédit, aucune écriture implicite.
- Six niveaux, huit objectifs, deux modules cosmétiques (`AURORA` à 800 XP, `EMBER` à 1300 XP).
- Aucun contenu existant n'est verrouillé. Les records des modes assistés restent séparés.
- Aucune monnaie, aucune boutique, aucun compte. Un futur mode carrière devra rester local et exportable.

## 8. Direction artistique

Silhouettes procédurales stylisées, palettes par scène, accents lumineux, HUD sobre. Priorité absolue : lisibilité des notes et des cibles sur les scènes claires. Les effets restent décoratifs et bornés (48 impacts, 12 voix, 96 buffers) ; la réduction de mouvement est appliquée à WebGL, Canvas et CSS.

Les assets finaux (personnages, costumes, décors) ne sont pas produits. La cible est décrite au chapitre 12.

## 9. Direction audio

Trois signatures de frappe originales, sons synthétisés, aucun échantillon tiers. La musique du jeu est **importée par le joueur** ou synthétisée localement (démos, académie). Le mix respecte les volumes Music/SFX/UI ; les SFX ne retardent jamais un jugement. La calibration manuelle et l'indication avance/retard sont disponibles ; la latence acoustique réelle reste non certifiée (`GAME-04`).

## 10. UX et accessibilité

- Clavier remappable, manette, tactile, raccourcis d'accords.
- Mouvement réduit (système et utilisateur), intensité des effets, contraste des notes, jauges HOLD indépendantes.
- Cibles visibles jusqu'à la fin de la fenêtre du profil actif.
- États d'erreur actionnables (réessayer, copier le détail, fermer) et états vides avec action.
- Restent ouverts : audit lecteur d'écran complet (`UX-04`), matrice 390×844 sur tous les écrans (`UX-01`), appareils physiques (`QA-03`), noteskins et disposition une main.

## 11. Technique

| Sujet | Contrat |
|---|---|
| Build | `python3 build.py` génère `index.html` et `DIVA_PULSE_JOUER.html`, identiques, sans CDN |
| Sources | `src/`, ordre des scripts dans `src/template.html` ; extensions historiques actives |
| Persistance | IndexedDB, transaction atomique, verrou d'écriture multi-fenêtres, exports versionnés |
| Formats | Bibliothèque 5, conteneur binaire 1, Director 19/20, replay 1 |
| Performance | Budget de frame non certifié (`PER-01/02`) ; mesure avant toute promesse |
| Sécurité | Aucune donnée envoyée ; médias importés locaux ; consentement explicite pour tout futur micro |

## 12. Reste à produire pour un niveau AAA

**Méthode.** Effort en semaines-personne (sp), fourchettes, confiance ±30 %, hors gestion de projet (+15 %). Hypothèses : contenu original, moteur conservé, sous-traitance partielle possible, cible web-first. Ces chiffres dimensionnent une décision ; ils ne constituent pas un devis.

**Base mesurée V38** : 5 morceaux, 6 silhouettes, 6 modules, 4 scènes, 7 chorégraphies, interface française uniquement.

### Palier B — « AAA indépendant » (cible recommandée)

| Prio | Lot | Existant → cible | Effort | Dépendances | Risque |
|---|---|---|---|---|---|
| P1 | Morceaux originaux | 5 → 24 | 115–158 sp | `PUB-05`, `MAP-01/02/04`, `QA-07` | qualité des partitions |
| P1 | Modèles de personnages | 0 → 6 | 40–55 sp | `ART-01`, `MMD-14`, `ANI-01/02`, `PER-02` | rigs, budget GPU |
| P1 | Costumes / modules | 6 → 24 | 20–30 sp | modèles, `ART-01` | variété sans casser les silhouettes |
| P1 | Scènes et props | 4 → 8 | 26–38 sp | `ART-02/03/04/05`, `ANI-11` | lisibilité, occlusion |
| P1 | Chorégraphies dédiées | 7 → 24 | 31–42 sp | `ANI-01..04`, `ANI-10/12` | raccords, contacts de pieds |
| P1 | Sound design / mix final | procédural → banque finale | 12–18 sp | `SFX-01/02`, `PER-01` | latence, loudness |
| P0 | Localisation | FR seul → FR/EN/JA | 12–18 sp | gel des chaînes (`GAME-06/08`, `UX-06`), police CJK | extraction tardive |
| P0 | Accessibilité | partielle → audit + remédiation | 12–19 sp | `UX-01..05`, `DIR-05` | lecteur d'écran |
| P0 | Certification / appareils | Chromium logiciel → matrice réelle | 20–30 sp | `QA-02/03`, `GAME-07`, `PER-02/04`, `PUB-09` | matériel, Safari |
| P0 | Campagne QA & playtests | tests techniques → 3 vagues | 13–18 sp | contenu jouable, `QA-07` | disponibilité des testeurs |
| P0 | Progression + tutoriel + UX | V38 → finition | 8–12 sp | `GAME-06`, `GAME-08`, `UX-06` | périmètre |
| P0 | Légal / provenance / licences | inventaire → cadre complet | 3–5 sp | `PUB-05`, `MMD-14`, `LICENSE` | décision propriétaire |

**Total palier B : ≈ 310–440 sp, soit 70–100 mois-personne**, 12–18 mois calendaires à 8–12 personnes. Chemin critique : direction artistique → modèles → costumes → scènes ; morceaux → partitions → playtests ; gel des chaînes → localisation ; certification en dernier.

### Trois paliers

| Palier | Contenu | Effort | Calendrier indicatif |
|---|---|---|---|
| A — Pro complet (web) | 12 morceaux, 4 modèles, 16 modules, 6 scènes, FR+EN, certification navigateurs | 170–250 sp (40–60 mois-pers.) | 8–12 mois à 6–8 personnes |
| B — AAA indépendant | 24 morceaux, 6 modèles, 24 modules, 8 scènes, FR+EN+JA, accessibilité auditée | 310–440 sp (70–100 mois-pers.) | 12–18 mois à 8–12 personnes |
| C — AAA étendu (console) | 36 morceaux, 8 modèles, 40 modules, 12 scènes, 5 langues, certification console | 470–650 sp (110–150 mois-pers.) | 18–30 mois |

### Ordre de production

1. **Décisions** : plateformes, langues, nombre de personnages, vocal ou instrumental, budget de sous-traitance.
2. **Socle** : progression/tutoriel/UX (fait en V38), architecture i18n, pipeline de personnages, matrice de test.
3. **Production** : morceaux et partitions, modèles, costumes, scènes, chorégraphies, sound design.
4. **Finition** : accessibilité, localisation, playtests, équilibrage.
5. **Certification** : appareils réels, packaging signé, audit légal, build de sortie.

### Ce que ces chiffres ne couvrent pas

Management, frais juridiques externes, achat de matériel de test, marketing, support, localisation des supports marketing, coûts de licence éventuels.

## 13. Qualité et définition de « fini »

**Classes de preuve** : logique Node, HTTP natif/IndexedDB, document injecté, Web Audio/WebGL logiciel, appareil physique. Une preuve ne vaut que pour sa classe.

**Sortie V38** : build déterministe, `npm test` sans échec, lanceur 10/10, parcours navigateur V38, classeur/JSON/CSV identiques. Aucun statut « Fait » sans preuve liée au build testé.

**« Fait »** signifie « vérifié dans la portée de la ligne », pas « jeu commercialement terminé ». La finition AAA exige les lots du chapitre 12 et une validation externe (appareils, acoustique, playtests, juridique).

## Décisions soumises à validation

1. **Palier de contenu** : A, B ou C (recommandation : B).
2. **Plateformes** : web/PWA d'abord, desktop signé ensuite, console seulement au palier C.
3. **Langues** : FR source + EN + JA au palier B.
4. **Voix** : instrumentales originales d'abord ; voix optionnelles chiffrées séparément.
5. **Licence du dépôt** : aucune licence déclarée aujourd'hui ; décision requise avant diffusion large.
6. **Contenu tiers** : imports utilisateur uniquement, jamais redistribués ; corpus de test sous autorisation (`MMD-14`).
