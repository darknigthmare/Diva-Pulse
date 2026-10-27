# DIVA PULSE V25 — Rapport des vérifications

## Traçabilité

Version **25.0.0 — Visages & archives binaires**. Base V24 réellement extraite et vérifiée : 641 fichiers, 640 empreintes internes conformes. L’archive d’origine n’est pas modifiée.

Le HTML autonome et `index.html` sont identiques : **749592 octets**. SHA-256 du HTML effectivement testé :

`32bf29e2cb8428e27ae1a7286e8b16a1122175c5cc881e20f5d9f59d4fe8a06c`

Chaque résultat navigateur ci-dessous porte cette empreinte. Les nouveaux fichiers de tests reprennent les assertions fonctionnelles précédentes et adaptent uniquement la version attendue et leurs dossiers de sortie. Les résultats anciens présents dans le ZIP demeurent historiques. Les fixtures V25 ont été corrigées pour orienter leur face vers la caméra, puis le parcours V25 a été réexécuté avec les fichiers livrés.

## Commandes et résultats

| Suite exécutée | Résultat | Preuve |
|---|---:|---|
| Logique historique + 61 nouveaux contrôles | **664/664** | qa/v25/logic-final.txt |
| Nouveaux parcours V25 | **40/40** | qa/v25/features/browser-final.json |
| Reprise des parcours V24 | **35/35** | qa/v25/regression-v24/browser-final.json |
| Reprise des parcours V23 | **39/39** | qa/v25/regression-v23/browser-final.json |
| Reprise des parcours V22 | **28/28** | qa/v25/regression-v22/browser-final.json |
| Reprise des parcours V21 | **44/44** | qa/v25/regression-v21/browser-final.json |
| Reprise Auto Show V20 | **57/57** | qa/v25/regression-v20/browser-final.json |
| Diagnostic PMX/VMD en WebGL2 | **4/4** | qa/v25/final-v25_native_mmd_browser.py.log |
| Lanceur/serveur local | **10/10** | qa/v25/final-launcher_test.py.log |

Les six suites d’interface totalisent **243 contrôles navigateur**, pas 242 navigateurs ou appareils. Les 603 contrôles historiques ont été rejoués, pas simplement reportés. Aucune exception JavaScript non interceptée ni erreur de frame du renderer n’apparaît dans les parcours finaux. Les erreurs de sauvegarde volontairement injectées sont attendues et conservées dans leurs journaux.

## Bouche et protections réellement vérifiées

Le test importe un PMX original doté d’un morph de bouche et d’un groupe, décode un WAV original de huit secondes, puis lance l’analyse dans un véritable Worker. Le résultat reste un brouillon tant qu’aucune sauvegarde n’est confirmée. L’aperçu au curseur fait varier le poids de bouche transmis au modèle.

Le test lit le tampon de positions du GPU : le bord inférieur de bouche se déplace à l’instant attendu et revient aux positions initiales quand le poids revient à zéro. Il vérifie aussi que le tableau de base n’est jamais modifié et que la mémoire de travail des morphs est réutilisée. Un VMD possédant un groupe facial explicitement à zéro garde sa priorité dans le véritable renderer.

Les tests de logique couvrent les clés, retards, gains et plafonds, la priorité de la motion courante et de la motion sortante, les groupes, les morphs manquants, la sélection du lead/danseur, la stabilité du clignement par retour au même instant, le silence, la composante continue, la stéréo en opposition de phase et les limites de durée. Ils ne démontrent pas une reconnaissance phonétique ou une qualité de synchronisation labiale sur des chansons réelles.

Le formulaire manuel est utilisé via ses vrais boutons : trois clés, export JSON, rechargement du brouillon, sauvegarde et annulation. Une analyse de guide seule ne change pas le spectacle enregistré. Un refus d’écriture laisse l’ancienne scène intacte et le formulaire disponible. La voix guide et le visage sont ensuite validés dans une même transaction.

Après activation volontaire de l’option, l’import d’un nouveau WAV prépare sa bouche et ses cinq difficultés. L’empreinte de l’audio est conservée dans le plan facial. Un ancien morceau avec une piste manuelle reste inchangé. Les notes avant/après l’édition faciale sont strictement identiques.

Les captures à 1440 × 1000 et 390 × 844 sont incluses. La largeur effective du formulaire est mesurée pour éviter la grande zone vide constatée lors d’une première vérification visuelle. Le prototype PMX est un robot plat de contrôle, pas un personnage Vocaloid finalisé.

## Sauvegarde et restauration réellement vérifiées

Le test télécharge un vrai `.pulsebundle`, vérifie sa signature, puis l’importe par le champ du jeu. Après confirmation, les morceaux sont restaurés en copies. L’identifiant de la voix guide change et ses associations sont conservées. Le personnage restauré est rechargé dans le renderer avec son plan facial manuel.

Une copie de l’archive est volontairement altérée sur un octet de média : elle est rejetée avant le bouton de confirmation et sans changer le nombre de morceaux. Les tests de logique vérifient aussi manifeste corrompu, corps tronqué, octets supplémentaires, descriptions mal formées, doublons, limite de métadonnées, média vide et annulation entre les blocs.

Enfin, toutes les nouvelles écritures sont refusées dans le Store du test ; l’export de secours produit malgré tout une archive binaire utilisable. Le chemin de restauration réutilise la validation et la transaction existantes, au lieu de créer une deuxième implémentation divergente. Les anciens parcours `.pulsepack` restent tous réussis sur ce build.

### Banc volumineux séparé

`node tests/v25_bundle_benchmark.cjs` teste **256 Mio (268435456 octets)** de données synthétiques sous Node v22.16.0. Le pack fait **268452904 octets**, soit **17448 octets** de surcoût. Les 256 blocs exportés et 256 blocs relus sont vérifiés. Les octets restaurés sont comparés aux données de départ.

Temps mesurés dans cette exécution : export **993 ms**, lecture/vérification **907 ms**. Pic RSS observé du processus : **331888 Kio**, incluant les données synthétiques. Ce n’est ni un profilage complet de navigateur ni une restauration persistante d’un gros pack. Les 1 Gio du format restent un plafond de contrôle, pas une capacité pratique certifiée sur téléphone. Le gain recherché est d’éviter les chaînes base64 globales ; les Blobs eux-mêmes restent soumis à la mémoire et aux choix du navigateur.

Preuves : `qa/v25/bundle-benchmark.json` et le script reproductible. Aucun fichier artificiel de 256 Mio n’alourdit l’archive du projet.

## Non-régression du rythme, du Director et des modèles

Les suites V20–V24 rejouent import ZIP MMD, sélection/aperçu, résolution des textures, palette, PMD/PMX, morphs UV/matériaux, héritages/IK, SDEF/QDEF avec 36 comparaisons GPU/CPU, tempo des motions, protection du montage manuel, brouillons, panne de stockage et restauration.

Le parcours Auto Show rejoue l’import musical, les cinq difficultés, le PV jusqu’à sa fin avec pause/reprise, ainsi qu’une partie en Autoplay à 100 %. Les scènes automatiques/manuelles restent séparées des notes. Le repli sans WebGL est également contrôlé. Le moteur musical n’a pas reçu un nouveau système de reconnaissance des chansons dans cette passe.

## Limites de l’environnement et tests non exécutés

Chromium est lancé avec un affichage Xvfb et **WebGL2 logiciel SwiftShader**, pas un GPU physique. Les tentatives de navigation vers le serveur loopback et vers le fichier HTML sont bloquées par une politique administrateur. La restriction n’a pas été contournée. Le HTML exact est chargé dans un document en mémoire autorisé, donc avec stockage **TEMPORAIRE**. Le serveur HTTP est contrôlé séparément par le test du lanceur.

Les validations d’export/restauration et d’échec de transactions ne prouvent pas la persistance IndexedDB après fermeture. La coordination native multi-fenêtres/Web Locks, Safari/iPhone, les périphériques manette/MIDI physiques et l’installation PWA complète restent non exécutés ou non certifiés. Aucune mesure du rythme humain ou du ressenti sonore n’est déduite d’Autoplay.

Les itérations initiales du nouveau script de test ont rencontré des attentes trop courtes en rendu logiciel, une commande d’injection de panne retournant une fonction exécutée par le harnais, un panneau manuel encore fermé et une modale d’import non refermée avant le clic suivant. Le harnais a été corrigé sans supprimer les assertions fonctionnelles ; seuls les fichiers `browser-final.json` ci-dessus constituent les résultats finaux. Les anciens logs de développement ne s’ajoutent pas au total.

## Limites fonctionnelles

L’énergie du mix peut ouvrir la bouche sur un instrument. Le signal guide doit être préparé et correctement aligné ; le jeu ne sépare pas la voix. Aucune phonétique, reconnaissance de paroles, adaptation universelle du visage ou animation des lèvres sans morph compatible n’est ajoutée. Le brouillon facial peut être exporté mais n’a pas d’autosave durable à la fermeture du panneau.

Bullet, corps souples, MME, IK/append exhaustifs, adaptation aux proportions/appuis, comparaison 1:1 des scores SEGA, catalogue en ligne et reconnaissance d’audios réencodés restent ouverts. Le registre `AUDIT_V25.md/json` suit 48 constats et distingue avancées et clôtures.

## Livraison

Le ZIP est relu entièrement et chaque fichier interne est comparé à son empreinte. Le jeu autonome et `index.html` restent identiques après reconstruction. Les réponses d’envoi Drive et la relecture du dossier sont consignées séparément dans le reçu de dépôt ; ce rapport ne prétend pas qu’une copie sur Drive synchronise le navigateur ou héberge le jeu.
