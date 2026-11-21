# BIBLE DIVA PULSE — V1

**Document de référence produit.** Version 1.1, base `main` `fc8e453d102c62c75b65d9a2a33dc076d2511330`, build V38.0.0. Statut : proposition à valider par le propriétaire du projet. Ce document décrit une cible ; il ne certifie aucune fonctionnalité non prouvée.

**Révision 1.1** : public, piliers et anti-objectifs explicités ; accessibilité traitée comme chapitre normatif distinct, avec cible WCAG 2.2 AA et règles propres au rythme.

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

## 2. Public, piliers et anti-objectifs

Ce chapitre fixe pour qui le jeu existe, ce qu'il promet et ce qu'il refuse. Il ne remplace ni les règles du chapitre 5, ni les mesures du chapitre 13.

### 2.1 Publics prioritaires

| Public | Besoin principal | Ce qui le retient | Preuve à produire |
|---|---|---|---|
| Débutant en jeu de rythme (public principal) | Comprendre sans guide externe et réussir une première boucle | Onboarding, calibration, leçons, difficulté lisible | Parcours première visite et observation de joueurs neufs (`QA-07`) |
| Pratiquant régulier | Mesurer ses progrès et cibler ses erreurs | Records locaux, replays, entraînement par passage, objectifs | Records et replays liés au build ; pas seulement des compteurs |
| Créateur de partitions | Importer, générer, corriger et exporter | Studio, AutoMap, formats documentés | Corpus réel et contrôle de jouabilité (`MAP-01/02/04`) |
| Monteur MMD / Director | Composer une scène et un clip lisibles | Director, imports MMD, caméra, export | Compatibilité décrite par fonction (`MMD-14`), jamais universelle |
| Joueur hors ligne ou matériel modeste | Jouer sans réseau, sans compte, sans GPU récent | Local-first, PWA, qualité 3D réglable | Matrice navigateurs et appareils (`QA-02/03`, `PER-02`) |
| Joueur avec besoins d'accessibilité | Réduire les barrières de lecture, de motricité et de mouvement | Palette, formes, remappage, vitesse, une main, réduction de mouvement | Chapitre 11 ; audit externe non réalisé à ce jour |

### 2.2 Contextes d'usage

Desktop au clavier, portable, mobile en 390×844, manette standard, tactile, casque filaire ou Bluetooth, session hors ligne, GPU logiciel, mouvement réduit, interface française uniquement en V38. Une session type dure 3 à 12 minutes ; une leçon, 30 secondes. Le jeu doit rester lisible dans ces contextes, pas seulement sur la machine de développement.

### 2.3 Non-publics

- Compétition en ligne, classements mondiaux, anti-triche serveur.
- Jeu mobile à collection, énergie, gacha ou live-ops.
- Console et certification constructeur.
- Catalogue musical officiel, reprise certifiée d'une édition commerciale.
- Réseau social, fil d'actualité, partage public hébergé.

Ces usages ne sont pas des cibles V1. Les servir exigerait un autre modèle économique, juridique et technique ; les mentionner ne crée aucun engagement.

### 2.4 Piliers

1. **Le temps musical fait foi.** Les jugements dépendent des timestamps et du transport audio, jamais des images, des effets ou de la caméra.
2. **La donnée appartient au joueur.** Bibliothèque locale, exports complets, aucune télémétrie silencieuse.
3. **Créer autant que jouer.** Éditeur, AutoMap, Auto Show et Director sont des modes de première classe, pas des annexes.
4. **Honnêteté des limites.** Un import accepté n'est pas une compatibilité universelle ; un compteur n'est pas une note de finition commerciale.
5. **Lisible avant spectaculaire.** Une barrière de lecture, de motricité ou de mouvement n'est pas une difficulté légitime. La difficulté doit rester dans la partition et les fenêtres de jugement, pas dans l'interface.

### 2.5 Anti-objectifs et arbitrages

| Anti-objectif | Raison | Ce que le projet accepte de perdre |
|---|---|---|
| Compte obligatoire, cloud implicite, monétisation, publicité, rétention obscure | Contrat local-first et propriété des données | Revenus récurrents, mesure d'audience centralisée, live-ops |
| Contenu existant verrouillé derrière la progression | Le joueur possède déjà sa bibliothèque | Une partie de la rétention artificielle |
| Remplacement silencieux d'une partition, d'un record ou d'un brouillon | Confiance dans les sauvegardes | Moins de dialogues automatiques, plus de confirmations explicites |
| Télémétrie silencieuse | Vie privée et fonctionnement hors ligne | Moins de données de funnel ; recours aux exports locaux et aux playtests |
| Catalogue officiel ou assets tiers non licenciés | Risque juridique et identité originale | Bibliothèque plus petite, production musicale plus lente |
| Revendication « AAA » sans budget, assets, localisation et certification | Honnêteté des limites | Un discours marketing plus prudent |
| Couleur seule, audio seul ou réflexes seuls comme unique information | Accessibilité | Plus de travail de design et de test |
| Effets, caméra ou hit-stop qui modifient un jugement | Invariant de timing | Moins de spectacle gratuit autour des notes |
| Difficulté utilisée comme verrou de contenu | Respect du joueur | Récompenses cosmétiques seulement |
| Latence masquée ou compensation invisible | Compréhension de la calibration | Plus de réglages exposés, donc plus de pédagogie |

### 2.6 Hypothèses à valider

1. **Compréhension** : un joueur neuf lance une leçon puis un morceau sans aide externe. Si moins de 4 joueurs sur 5 y parviennent, l'onboarding est refait ; `GAME-08` reste Partiel.
2. **Calibration** : des profils nommés (filaire, Bluetooth, haut-parleurs) réduisent les erreurs systématiques sans modifier les records. Si les joueurs ne comprennent pas le profil actif, revenir à un réglage unique mieux expliqué.
3. **Motricité** : une disposition une main permet de terminer une leçon EASY. Si elle dégrade la lecture ou crée des conflits de touches, la limiter à l'entraînement et le documenter.

Tant que ces hypothèses ne sont pas testées, aucun statut « Fait » ne peut être déduit du seul code.

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

Les assets finaux (personnages, costumes, décors) ne sont pas produits. La cible est décrite au chapitre 13.

## 9. Direction audio

Trois signatures de frappe originales, sons synthétisés, aucun échantillon tiers. La musique du jeu est **importée par le joueur** ou synthétisée localement (démos, académie). Le mix respecte les volumes Music/SFX/UI ; les SFX ne retardent jamais un jugement. La calibration manuelle et l'indication avance/retard sont disponibles ; la latence acoustique réelle reste non certifiée (`GAME-04`).

## 10. UX

- Hiérarchie stable : bibliothèque, jeu, résultat, réglages ; aucune impasse sans retour.
- Clavier remappable, manette, tactile, raccourcis d'accords ; pause explicite en jeu.
- Retour immédiat : jugement, combo, jauge HOLD, erreur actionnable, état vide avec action.
- Messages qui disent quoi faire, pas seulement ce qui a échoué ; le diagnostic reste local.
- Cibles visibles jusqu'à la fin de la fenêtre du profil actif.
- Réglages compréhensibles : volumes, deux offsets distincts, vitesse d'approche, qualité 3D, mouvement réduit.

L'accessibilité normative, les critères WCAG 2.2 AA et les règles propres au rythme sont traités au chapitre 11. Les deux chapitres ne se substituent pas : le chapitre 10 décrit l'expérience, le chapitre 11 fixe les exigences vérifiables.

## 11. Accessibilité — cible WCAG 2.2 AA et règles du rythme

### 11.1 Statut et portée

**Cible**, pas certification. DIVA PULSE vise WCAG 2.2 niveau AA pour l'interface web (DOM, réglages, messages, résultats) et applique des règles supplémentaires au gameplay, que WCAG ne couvre pas directement. Aucune revendication de conformité ne peut être publiée avant un audit externe et des tests sur appareils réels.

La portée couvre : interface et navigation, réglages, écrans de résultat, messages d'erreur, onboarding, contenu textuel, commandes clavier/manette/tactile, et information de jeu (couloirs, notes, HOLD, slides). Le canvas de jeu n'a pas d'équivalent ARIA automatique : il exige des équivalents DOM et des règles dédiées.

### 11.2 Cible WCAG 2.2 AA (interface web)

| Critère | Exigence retenue | Portée dans le jeu |
|---|---|---|
| 1.4.1 Usage de la couleur | L'information ne repose jamais sur la couleur seule | Couloirs : glyphe, position et couleur ; états HOLD : forme et texte |
| 1.4.3 Contraste (minimum) | 4,5:1 pour le texte, 3:1 pour le grand texte | Textes, boutons, messages, résultats |
| 1.4.11 Contraste des éléments non textuels | 3:1 pour les composants et états | Bordures de focus, jauges, cibles, icônes |
| 1.4.4 / 1.4.10 Redimensionnement et reflow | Zoom 200 % sans perte ; pas de défilement horizontal à 320 px | Réglages, bibliothèque, résultats ; le canvas peut se réduire, son équivalent textuel reste à livrer |
| 2.1.1 Clavier | Toute action disponible au clavier | Navigation, réglages, jeu, pause, modales |
| 2.2.1 Réglage du temps | Pas de limite de temps sur les menus ; le timing du jeu est essentiel | Aucune modale chronométrée ; pause disponible |
| 2.3.1 Pas plus de trois flashs par seconde | Limite des flashs et animations | Effets, scènes, transitions |
| 2.4.7 Focus visible | Focus toujours visible | Boutons, champs, cartes, modales ; styles `:focus-visible` partiels à généraliser |
| 2.5.8 Taille de cible (minimum) | 24×24 px CSS minimum ; cible interne 44×44 px | Commandes tactiles, boutons de modale, réglages |
| 3.2.1 / 3.2.3 Prévisibilité | Navigation et changements de contexte prévisibles | Vues, modales, réglages |
| 3.3.1 / 3.3.3 Erreurs | Erreur identifiée et suggestion de correction | Import, sauvegarde, calibration, chargement |
| 4.1.2 / 4.1.3 Nom, rôle, valeur et messages de statut | Composants nommés ; erreurs et états annoncés | Boutons, jauges, panneau d'erreur (`role=alert`), toast (`role=status`) ; annonce du résumé de résultat à livrer |

Les critères non applicables au canvas doivent être couverts par des équivalents DOM : réglages, messages d'état, commandes nommées et résumé de résultat. Ce résumé n'est pas encore annoncé (11.3) ; un équivalent DOM ne rend pas le jeu complet utilisable au lecteur d'écran, limite explicite au 11.4.

### 11.3 Règles propres au rythme

| Barrière | Règle | État V38 | Preuve restante |
|---|---|---|---|
| Couleurs de couloirs indiscernables | Glyphe distinct, position fixe, palette alternative à contraste vérifié | Partiel : `drawGlyph` dessine △ □ × ○ et deux flèches, avec une position et une couleur par couloir ; aucune palette alternative | Calcul de contraste et test daltonisme |
| Dépendance à l'audition | Indices visuels pour chaque événement ; aucun mode ne repose sur l'audio seul | Partiel : chaque cible a un glyphe et un cercle d'approche, et le jugement vient des entrées ; aucun test sans audio. Les morceaux importés peuvent contenir des voix ; seules les paroles `.lrc` fournies sont affichées, sans sous-titres générés | Test sans audio ; décider du cas des voix importées |
| Dépendance à la vision | Indices audio optionnels, jamais uniques ; le jeu complet sans vision n'est pas revendiqué | Non | Déclarer la limite ; ne pas promettre un mode aveugle |
| Basse vision | Zoom 200 %, texte redimensionnable, HUD lisible, contraste élevé | Partiel : le viewport n'interdit pas le zoom et le HUD chiffré est en DOM ; zoom, reflow et contraste non testés | Test zoom 200 % et reflow à 320 px |
| Motricité fine | Remappage, manette, tactile, raccourcis d'accords, vitesse réduite, boucle A/B, une main | Partiel : remappage clavier, manette, tactile, raccourcis d'accords, entraînement 25–100 % avec boucle et vitesse d'approche 0,75× ; mode une main absent | Test une main sur leçon EASY ; qualification manette et tactile physiques |
| Charge cognitive | Accueil court, descriptions de difficulté, pause, pas de menu chronométré | Partiel : académie de 8 leçons, aide et pause ; aucun onboarding de première visite | Parcours première visite (`QA-07`) |
| Photosensibilité | Flashs bornés, mouvement réduit, fond assombri | Partiel : réduction de mouvement (réglage et `prefers-reduced-motion`), fond assombri et effets réduits ; fréquence des flashs non mesurée | Test de fréquence et audit |
| HOLD et slides | État lisible sans couleur seule : forme, jauge, texte ; tolérance de relâchement documentée | Partiel : glyphes distincts, étiquette HOLD/CHAIN et jauge avec pourcentage textuel ; règle de relâchement documentée (`REGLES_DIVA_PULSE_V1.md`, §5) | Test daltonisme et lecteur d'écran sur le résumé |
| Latence | Deux offsets distincts (saisie, visuel), profils nommés, explication de la médiane | Partiel : `inputOffset` et `visualOffset` distincts, calibration et explication de la médiane ; profils nommés absents | Compréhension et persistance des profils |
| Difficulté | Profil `accessible`, mode sans échec, entraînement ; les records assistés restent séparés | Oui : profil `accessible` (±45/90/135/180 ms), option « Désactiver l'échec », entraînement, record normal réservé à `mode === 'play'` sans `noFail` et clé de record suffixée `profile-…` | — (preuve logique sur le build V38 : `rules-contract`, `v37-record-replay` ; preuve navigateur V38 non consignée, aucune certification matérielle) |
| Lecteur d'écran | Résumé de résultat, erreurs et états annoncés ; canvas non entièrement navigable | Partiel : panneau d'erreur `role=alert` et `aria-live=assertive`, toast `role=status`, commandes nommées ; aucun `aria-live` sur la vue Résultats et pas de gestion de focus au changement de vue | Audit NVDA/VoiceOver externe ; annonce du résumé de résultat |

**Lecture des statuts.** « Oui » signifie que le comportement est présent dans les sources V38 et couvert par un test du dépôt exécuté sur le build V38 ; « Partiel » signifie qu'une partie est livrée et que le reste figure en « Preuve restante » ; « Non » signifie non livré. Aucune ligne ne vaut certification : une preuve de la mauvaise classe (logique, navigateur, lecteur d'écran, appareil, audit) ne comble pas la case.

**Invariants à ne jamais casser pour l'accessibilité** : un effet, une palette, une réduction de mouvement ou un changement de vitesse d'approche ne modifie jamais l'horloge de jugement, les fenêtres, les signatures de partition ni les records. La compensation reste explicite et réversible.

### 11.4 Limites et preuves

- Preuves automatisables, non exécutées en V38 : contraste calculé, présence des noms et rôles, focus, reflow, taille des cibles, absence de couleur seule dans le DOM. La couleur seule du canvas ne se vérifie pas par le DOM : elle demande un contrôle du rendu et un test daltonisme.
- Preuves V38 disponibles : séparation des records assistés et réduction de mouvement (tests logiques du dépôt) ; panneau d'erreur, état vide actionnable et progression (contrôles navigateur V38). Ces preuves ne valent pas audit d'accessibilité.
- Preuves manuelles : parcours clavier complet, zoom 200 %, lecteur d'écran (NVDA, VoiceOver), mouvement réduit, une main.
- Preuves non réalisées à ce jour : audit WCAG externe, test daltonisme réel, laboratoire photosensibilité, appareils physiques, jeu sans vision, étude cognitive.
- **V38 ne peut pas déclarer « conforme WCAG 2.2 AA »** : elle vise la cible, expose ses limites et documente ses preuves. Le mot « conforme » est réservé à un audit terminé.

### 11.5 Déclaration type (à publier seulement après preuves)

> DIVA PULSE vise WCAG 2.2 niveau AA. Cette version est partiellement vérifiée : [preuves réellement exécutées sur ce build]. [Preuves non réalisées : contraste mesuré, zoom et reflow, lecteur d'écran, daltonisme, appareils physiques.] Les limites connues sont décrites dans le guide de la version. Aucune conformité complète n'est revendiquée.

Cette déclaration est un modèle. Elle ne doit être publiée qu'avec la version, le build et les preuves correspondantes ; les crochets doivent être remplacés, jamais recopiés d'une version antérieure (chapitre 14).

### 11.6 Backlog et statuts

L'accessibilité reste suivie par `UX-01` à `UX-05`, `QA-03`, `QA-07` et `DIR-05`. Aucun de ces points ne passe à « Fait » sur la seule présence d'un réglage : il faut la preuve de la classe correspondante (logique, navigateur, lecteur d'écran, appareil, audit). Le chapitre 14 fixe la définition de « fini ».

## 12. Technique

| Sujet | Contrat |
|---|---|
| Build | `python3 build.py` génère `index.html` et `DIVA_PULSE_JOUER.html`, identiques, sans CDN |
| Sources | `src/`, ordre des scripts dans `src/template.html` ; extensions historiques actives |
| Persistance | IndexedDB, transaction atomique, verrou d'écriture multi-fenêtres, exports versionnés |
| Formats | Bibliothèque 5, conteneur binaire 1, Director 19/20, replay 1 |
| Performance | Budget de frame non certifié (`PER-01/02`) ; mesure avant toute promesse |
| Sécurité | Aucune donnée envoyée ; médias importés locaux ; consentement explicite pour tout futur micro |

## 13. Reste à produire pour un niveau AAA

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
2. **Socle** : progression (`GAME-06`) et états d'erreur (`UX-06`) marqués « Fait » en V38 ; académie « Partiel » (`GAME-08` : deux leçons et un guide de calibration, sans onboarding de première visite, `QA-07` ouvert) ; `UX-01` à `UX-05` non certifiés ; architecture i18n, pipeline de personnages, matrice de test.
3. **Production** : morceaux et partitions, modèles, costumes, scènes, chorégraphies, sound design.
4. **Finition** : accessibilité, localisation, playtests, équilibrage.
5. **Certification** : appareils réels, packaging signé, audit légal, build de sortie.

### Ce que ces chiffres ne couvrent pas

Management, frais juridiques externes, achat de matériel de test, marketing, support, localisation des supports marketing, coûts de licence éventuels.

## 14. Qualité et définition de « fini »

**Classes de preuve** : logique Node, HTTP natif/IndexedDB, document injecté (`set_content` des tests navigateur historiques), Web Audio/WebGL logiciel, appareil physique. Une preuve ne vaut que pour sa classe et pour le build qu'elle a servi à tester. Les statuts se lisent comme au 11.3.

**Sortie V38** : les commandes de sortie ont été exécutées sur le build `3780012…c0648db` (commit `5065f58`) ; leur état réel diffère de la liste complète.

| Affirmation | État V38 | Preuve |
|---|---|---|
| Build déterministe | Oui | `python3 build.py` exécuté deux fois : `index.html` et `DIVA_PULSE_JOUER.html` identiques, 938 571 octets, sha256 `37800126df7d7abdd528ceccfd6c71a69f8f7be7485075cc0b4329739c0648db` ; `tools/verify_release.py` → `deterministicBuild: true`, `standaloneIdentical: true` |
| `npm test` sans échec | Oui | 1 409 tests, 1 409 réussis, 0 échec, 0 ignoré, 0 annulé sur ce build |
| Lanceur 10/10 | Oui | `tests/launcher_test.py` → `TOTAL 10 PASS` |
| Parcours navigateur V38 | Non consigné | `qa/v38/results.json` et `qa/v38/verified.json` sont absents : `tools/verify_pr38.py` s'arrête sur cette preuve. La CI (`.github/workflows/quality.yml`) exécute `tests/v38_browser_test.py` (17 contrôles) et les 13 scénarios antérieurs à chaque PR ; le résultat de ce commit n'est pas encore consigné. Chromium/SwiftShader ne vaut ni appareil physique, ni audit |
| Classeur / JSON / CSV identiques | Oui | `tools/verify_pr38.py` valide l'empreinte du classeur V38 (17 onglets, 16 tableaux, 136 lignes, 52 « Fait » / 30 « Partiel » / 31 « À faire » / 23 « À valider »), l'égalité exacte avec `planning/BACKLOG_V38.json` et `planning/MANQUANTS_V38.csv`, et l'intégrité du classeur V37, avant de s'arrêter sur la preuve navigateur |

Ces preuves ne valent pas certification : elles disent quelles commandes passent sur quel build, pas que le jeu est fini.

**« Fait »** signifie « vérifié dans la portée de la ligne », pas « jeu commercialement terminé ». Les 52 lignes « Fait » du classeur sont héritées de la V37 : leur champ « Fichiers / preuves » cite 39 fois des chemins `tests/`, `qa/` ou `tools/`, 3 fois des exécutions GitHub Actions, seules 2 mentionnent la V38, et aucune ne cite un hash de build. Elles ne sont donc ni ré-auditées sur le build V38, ni rattachées à lui : la règle « aucun statut Fait sans preuve » s'applique aux lignes modifiées par la V38 et aux preuves produites pour son build, pas à une revalidation rétroactive des 52 lignes antérieures. Leur colonne « Portée / limites » est renseignée sur les 52 lignes, ce qui borne chaque statut mais ne le rejoue pas.

La finition AAA exige les lots du chapitre 13 et une validation externe (appareils, acoustique, playtests, juridique), absente à ce jour.

## Décisions soumises à validation

1. **Palier de contenu** : A, B ou C (recommandation : B).
2. **Plateformes** : web/PWA d'abord, desktop signé ensuite, console seulement au palier C.
3. **Langues** : FR source + EN + JA au palier B.
4. **Voix** : instrumentales originales d'abord ; voix optionnelles chiffrées séparément.
5. **Licence du dépôt** : aucune licence déclarée aujourd'hui ; décision requise avant diffusion large.
6. **Contenu tiers** : imports utilisateur uniquement, jamais redistribués ; corpus de test sous autorisation (`MMD-14`).
