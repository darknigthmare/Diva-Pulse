# Provenance des contenus — V38

Registre des contenus **distribués** avec DIVA PULSE et des références **non redistribuées**. Il ne certifie pas la conformité globale du dépôt : les écarts identifiés en fin de document restent ouverts (`PUB-05`, partiel).

**Statuts** : `Documenté` (origine et droits connus), `À confirmer` (présent, chaîne de provenance incomplète), `À produire` (cible non fournie), `Non redistribué` (référence externe citée seulement).

**Empreintes de référence** : build V38 `index.html` = `c2f6039f76218541ca6f78709d20bd405036fe4e27418d40a8d657812118d1da`. Les empreintes ci-dessous sont des SHA-256 des octets distribués ; elles ne constituent pas une preuve de droits.

## 1. Code et moteur

| ID | Élément | Nature | Origine | Droits | Statut |
|---|---|---|---|---|---|
| CODE-01 | `src/*.js`, `src/*.css`, `build.py`, `lancer.py`, `tests/*` | Code source original | Production interne du dépôt | Aucune licence déclarée (voir écarts) | Documenté |
| CODE-02 | Moteur de rendu et audio | Code original | Aucun moteur tiers, aucune dépendance runtime (`package.json` sans `dependencies`) | Interne | Documenté |
| CODE-03 | `index.html`, `DIVA_PULSE_JOUER.html` | Sorties générées | `python3 build.py` depuis `src/` | Interne | Documenté |

## 2. Audio et partitions

| ID | Élément | Nature | Origine | Empreinte / graine | Statut |
|---|---|---|---|---|---|
| AUD-01 | `NEON PROMISE`, `GLASS ORBIT`, `SAKURA VOLTAGE` | Instruments synthétisés | `src/core.js` (`synthDemo`), aucune prise enregistrée | graines `123848481`, `707359274`, `993563735` | Documenté |
| AUD-02 | `MIDNIGHT DRIVE`, `CORAL SIGNAL` | Instruments synthétisés, ajoutés V38 | `src/core.js` | graines `151787692`, `3446745665` | Documenté |
| AUD-03 | Instrumental d'académie | Synthèse 120 BPM, 32 s | `src/academy.js` (`academyAudio`) | généré à la demande | Documenté |
| AUD-04 | `examples/CONTROLE_120_BPM.wav` | Signal de contrôle | Production interne | `417f27b524d3b519866d02136eaf19e2080c75975f3c47059a83bf9a1642329c` | Documenté |
| AUD-05 | `examples/v5/ATELIER_DU_RYTHME_120BPM.wav` | Instrumental d'exemple | Production interne, reproductible par `tests/make_v5_fixtures.cjs` | `533e03db3c5a644cc15ab9d83d5120a70f60e98bcc753c29d6d70b42e13a95e8` | Documenté |
| AUD-06 | `examples/v6/NEON_STEPS_128_ORIGINAL.wav` | Instrumental d'exemple | Production interne, reproductible | `3e102eceff1fa94d3f4b08dbb610a073299d4d74d6ce0b7df456dc4c7d64c7d9` | Documenté |
| AUD-07 | `examples/v6/MODE_MANUEL_156.wav`, `SILENCE_3_SECONDES.wav`, `AUDIO_INVALIDE.wav` | Signaux de QA | Production interne | voir `examples/v6/SHA256_AUDIO.json` | Documenté |
| PART-01 | Partitions de démonstration et d'académie | Données générées | `demoChart`, `academyChart` | déterministes | Documenté |
| PART-02 | `examples/*.json`, `*.pulsecharts`, `*.mid`, `*.lrc` | Partitions et métadonnées de contrôle | Production interne | voir fichiers et `SHA256SUMS.txt` | Documenté |

Aucun échantillon musical tiers, aucune chanson commerciale, aucun enregistrement Vocaloid officiel n'est embarqué.

## 3. Images, vidéo et modèles 3D

| ID | Élément | Nature | Origine | Empreinte | Statut |
|---|---|---|---|---|---|
| IMG-01 | `icons/icon-192.png` | Icône PWA | **Chaîne de provenance non consignée** | `5691aee545505ff7282d0b1721023b696e495e1780f9eca6b246644ec577c96d` | À confirmer |
| IMG-02 | `icons/icon-512.png` | Icône PWA | **Chaîne de provenance non consignée** | `0947ea337f9431a9ef9c202422f717b2fffafea517634f246b64c361ad58b62c` | À confirmer |
| IMG-03 | Favicon embarqué (`src/template.html`, base64) | Image générée | Production interne, incorporée au HTML | incluse dans le build | Documenté |
| VID-01 | `examples/CLIP_CONTROLE.mp4` | Mire animée 4 s | Générée avec `testsrc2` de FFmpeg ; aucune image tierce | `bac90dcb854231e76cfebcc53fdee36da3060929409c6979e447c2e57c6dff59` | Documenté |
| 3D-01 | `examples/MANNEQUIN_QA_ANIME.glb` | Volume technique 12 triangles | Production interne | `bcc7e0dcbf9b7c5d401066b5e74ba41d4d09002111cf498c5c74779f860f6048` | Documenté |
| 3D-02 | `tests/assets/minimal.pmx` | Fixture PMX minimale | Production interne | `2a8e27d78823cf275d74ca755c7cab72ffe0d9351a9b7c0870b36f05ef9269fa` | Documenté |
| 3D-03 | `tests/assets/minimal.vmd` | Fixture VMD minimale | Production interne | `754c2e7ab6103aa71e613cb76ec4cdf44b026b901edac9a0e3b8205fefa3e52e` | Documenté |
| 3D-04 | Silhouettes, décors, costumes | Géométrie procédurale | `src/stage.js` | déterministe | Documenté |
| 3D-05 | Modèles, costumes et décors finaux | Assets de production | Non fournis (voir Bible, chapitre 12) | — | À produire |
| 3D-06 | `examples/v19/`, `v21/`, `v24/` (PMX/VMD de diagnostic) | Fixtures techniques | Production interne ; `examples/v19/LIRE.md` autorise leur réutilisation | voir fichiers | Documenté |

## 4. Références externes non redistribuées

| ID | Référence | Usage | Droits | Statut |
|---|---|---|---|---|
| REF-01 | `awesome-gamedev-agent-skills` (commit `19d93f9`) | Liens et concepts dans `docs/GUIDE_DEVELOPPEMENT_GAMEDEV.md` | Apache-2.0, non redistribué | Non redistribué |
| REF-02 | `yohawing/three-mmd-loader`, `moeru-ai/three-mmd` | Cibles historiques citées dans `README_V8_MMD_RUNTIME.md` | MIT, aucun code incorporé au runtime actuel | Non redistribué |
| REF-03 | Project DIVA / SEGA, noms de personnages | Inspiration et libellés de silhouettes de travail | Marques et droits de leurs propriétaires | Non redistribué |
| REF-04 | Spécifications PMX/PMD/VMD/VPD | Interopérabilité | Spécifications publiques | Non redistribué |
| REF-05 | FFmpeg | Outil de génération de la mire de contrôle | Licence FFmpeg ; aucun binaire distribué | Non redistribué |

## 5. Contenus importés par le joueur

Les audios, vidéos, partitions, modèles et motions importés restent **locaux** (IndexedDB) et ne sont jamais envoyés par le jeu. Leurs droits restent ceux de leurs auteurs. DIVA PULSE ne fournit ni contournement de protection, ni catalogue officiel, ni mécanisme d'extraction.

## 6. Écarts et actions

| Écart | Impact | Action proposée | Statut |
|---|---|---|---|
| Aucun fichier `LICENSE` à la racine | Conditions de réutilisation du code et des assets non explicites | Décision du propriétaire : licence du code, mention des assets | Ouvert |
| Provenance des icônes PWA non consignée | Incertitude sur l'origine des deux PNG | Retrouver la source ou régénérer les icônes depuis le favicon | Ouvert |
| Corpus MMD représentatif absent | La compatibilité ne peut être décrite que par fonction | Constituer un corpus autorisé (`MMD-14`) | Ouvert |
| Aucun asset AAA final (modèles, costumes, scènes, musique produite) | Le jeu reste un socle technique et ludique | Exécuter le palier de production validé (Bible, chapitre 12) | À produire |
| Textes et interface en français uniquement | Diffusion internationale limitée | Architecture i18n puis FR/EN/JA | À produire |
| Aucune certification appareil, acoustique ou accessibilité | Promesses commerciales limitées | Matrice de test et audit externe | Ouvert |

Ce registre doit être mis à jour à chaque ajout de média final. Un asset sans ligne de provenance ne doit pas être publié.
