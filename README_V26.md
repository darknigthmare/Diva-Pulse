# DIVA PULSE V26 — Reprise & reconnaissance acoustique

Version **26.0.0**, 7 octobre 2026. La base est l’archive V25 complète, réellement extraite, sans modifier l’original. Cette passe ajoute une comparaison acoustique locale, une réutilisation volontaire de partitions et la récupération séparée des brouillons faciaux. Elle ne remplace pas le moteur AutoMap, les fichiers VMD, les partitions sources ou les spectacles manuels.

## Démarrer et migrer

Exporter la bibliothèque actuelle en `.pulsepack` ou `.pulsebundle`, conserver cette sauvegarde, fermer les anciennes fenêtres puis ouvrir la V26 dans un dossier distinct. Utiliser `DIVA_PULSE_JOUER.html`, ou le lanceur Python 3 (`LANCER_WINDOWS.bat`, `LANCER_MAC_LINUX.command`). Le lanceur conserve l’adresse prévue et signale un conflit de port.

Restaurer avec **Réglages → Importer .pulsepack / .pulsebundle**. Les morceaux sont ajoutés en copies ; le remplacement des préférences reste volontaire. Vérifier les chansons, notes, modèles, textures et spectacles avant d’écarter l’ancienne sauvegarde.

**TEMPORAIRE signifie : exporter avant de fermer.** Le dépôt Drive conserve les fichiers de livraison ; il n’héberge pas le jeu et ne synchronise pas la bibliothèque du navigateur. Utiliser un autre navigateur, une autre adresse ou un autre appareil ne transfère pas automatiquement les données.

Les formats portables existants sont conservés. Les V25 et versions antérieures ne savent pas reprendre les nouveaux brouillons `faceDrafts` : utiliser la V26 pour conserver cette récupération. Le réglage de verrou d’écriture reste compatible avec les versions récentes, mais sa coordination native et la persistance après fermeture ne sont pas certifiées par nos essais temporaires.

## 1. Retrouver ses niveaux après un réencodage

Jusqu’ici, une empreinte SHA-256 reconnaissait uniquement les fichiers strictement identiques. La V26 ajoute un **indice de ressemblance du son décodé**. Il examine la répartition d’énergie entre bandes de fréquences et l’évolution du volume, et compare plusieurs portions du morceau.

Ce n’est pas un service de reconnaissance en ligne, un moteur universel d’identification ni une preuve d’identité. Une valeur proche de 100/100 n’est pas une probabilité que deux titres soient identiques. Un remix, un medley, une piste très répétitive ou une autre musique semblable peuvent déjouer une méthode de ce type. La vérification humaine reste obligatoire avant copie.

### Les nouvelles musiques

Dans **Réglages → RETROUVER SES PARTITIONS**, la comparaison à l’import est activée par défaut. Elle est indépendante des options cinq difficultés et spectacle automatique. Décochez-la pour ne pas calculer le descripteur lors des nouvelles importations.

Importer un WAV, puis un MP3 du même enregistrement peut faire apparaître **« ressemblance(s) · examiner les anciennes partitions »** sous les informations de niveaux. Le nouvel audio reste un morceau distinct. Ses niveaux automatiques ne sont pas remplacés et aucun record n’est fusionné.

L’empreinte binaire exacte et le catalogue local conservent leur parcours prioritaire. Une ressemblance acoustique n’est jamais promue en correspondance SHA vérifiée. Si la comparaison ne trouve rien, le fonctionnement normal d’import et d’AutoMap reste disponible.

### Une bibliothèque provenant d’une ancienne version

Cliquer **Indexer la bibliothèque existante**. L’opération décode les audios locaux disponibles et enregistre leur descripteur. Les partitions et spectacles ne changent pas. La progression et les erreurs sont indiquées par morceau ; une annulation conserve les index déjà enregistrés.

**Comparer le morceau sélectionné** prépare son index s’il manque, puis le compare aux autres morceaux déjà indexés. L’option désactivée à l’import n’empêche pas cette action volontaire. Un morceau ancien non indexé ne peut pas être proposé comme source avant son indexation.

### Écouter et copier

Le panneau affiche le morceau source, l’indice de ressemblance et un décalage proposé. Aucun niveau n’est précoché. Choisir les partitions à reprendre et écouter leurs frappes sur **le nouvel audio**, pas seulement sur la chanson source.

L’écoute dure au maximum douze secondes. Elle utilise la première partition cochée, ou la première de la source si aucune n’est cochée. Régler le début de l’extrait pour examiner plusieurs passages, notamment le début, le milieu et la fin. Le bouton Arrêter interrompt l’audio et les clics.

**Décalage positif = les notes arrivent plus tard dans le nouvel audio.** Si la nouvelle version commence par un demi-seconde de silence supplémentaire, une proposition de +0,50 s est cohérente. Le décalage peut être ajusté dans la limite de ±2 secondes. Le logiciel ajoute ce décalage à l’offset de chaque partition source ; il ne déplace pas ses notes individuelles.

Cocher la confirmation de version/timing, puis **Ajouter les partitions sélectionnées**. Le résultat est un nouveau jeu de copies, avec de nouveaux identifiants, en plus des niveaux existants. Les notes, positions, types, paramètres et origine sont conservés ; la provenance porte explicitement `identityVerified: false` et le décalage accepté. Ni le morceau source ni le spectacle cible ne sont modifiés.

Une note qui sortirait de l’audio, une sélection invalide ou plus de cinquante partitions sur le morceau provoque un refus avant écriture. Une sauvegarde refusée conserve les deux collections originales et laisse le panneau disponible pour réessayer. Dans le studio, les copies peuvent être corrigées comme des variantes, sans rendre l’association acoustique « officielle ».

### Limites actuelles

La comparaison porte sur les morceaux de **8 secondes à 10 minutes**. Des descripteurs peuvent être calculés pour des signaux plus courts, mais ils ne donnent pas de candidat. Recherche de décalage sur ±2 secondes, pas de changement de vitesse ou de tempo ; durées proches exigées, avec au moins 90 % de recouvrement. Une différence d’arrangement, un extrait ou une version live ne doit pas être automatiquement réutilisé.

L’offset proposé est estimé par pas de **50 ms** : ce n’est pas une calibration de précision au milliseconde. Ajuster à l’écoute et dans le studio. Les seuils conservateurs peuvent produire des absences de résultat. Les correspondances présentées ne sont jamais certaines.

Le calcul se fait localement dans des Workers, avec normalisation du signal, canaux séparés et douze bandes fréquentielles. Une stéréo en opposition de phase ne disparaît pas par addition des canaux. Le fichier original n’est pas modifié. Aucune requête réseau n’est utilisée par ce système.

La comparaison est limitée à 250 sources indexées de durée proche, traitées par groupes de huit. Les gros audios décodés peuvent consommer davantage de mémoire que leur fichier compressé. Un index endommagé est ignoré comme candidat et signalé par le diagnostic ; le reconstruire depuis l’audio.

## 2. Reprendre un visage sans publier son brouillon

Ouvrir **Modules → MMD Stage → VISAGE · AUDIO / CLÉS MANUELLES**. Les modifications valides de piste, de clés, de réglages ou de voix guide préparent un brouillon distinct. Les valeurs intermédiaires invalides ne remplacent pas une version valide. Déplacer uniquement le curseur ne provoque pas une écriture à chaque image.

Le panneau indique si le brouillon est en cours d’enregistrement local, disponible en stockage temporaire ou conservé uniquement en mémoire après un refus d’écriture. **La scène enregistrée reste inchangée.** L’aperçu peut montrer le brouillon, mais fermer le panneau rétablit la scène confirmée.

À la prochaine ouverture, **Reprendre le brouillon** est proposé explicitement. La piste n’est pas appliquée sans ce clic. Si la source a changé depuis le brouillon, un avertissement le précise. **Écarter ce brouillon** retire seulement la récupération : ni la scène enregistrée ni ses médias ne sont supprimés.

Cliquer **Enregistrer le visage** publie la piste et marque le brouillon comme traité dans **la même transaction**, avec sa nouvelle voix guide si nécessaire. En cas de refus, l’ancienne scène et le brouillon restent disponibles. Après succès, la récupération n’est plus proposée à l’ouverture.

### Sauvegarde de secours, même en cas de panne d’écriture

Les exports `.pulsepack` et `.pulsebundle` incluent les brouillons faciaux des morceaux exportés. La dernière version en mémoire est prioritaire sur un état plus ancien du stockage. Une voix guide nouvellement importée, dont l’écriture a échoué, est conservée avec le brouillon et peut être transportée par l’export de secours.

La restauration vérifie les propriétaires et les ressources avant confirmation, ajoute les morceaux en copies puis remappe le morceau et l’identifiant de voix guide du brouillon. Le visage publié et la version à reprendre restent séparés. Un propriétaire inconnu, un guide absent ou des métadonnées invalides sont refusés sans restauration partielle.

Le format de piste autonome `.pulseface.json` reste utile pour transporter uniquement une courbe/des clés, sans audio. Les anciens guides abandonnés peuvent rester parmi les ressources inutilisées ; aucune suppression de médias n’est effectuée silencieusement.

**Cette récupération n’est durable après fermeture que si le navigateur autorise et conserve le stockage.** Les essais de cette livraison utilisent un document temporaire : ils prouvent la reprise pendant la session et l’aller-retour portable, pas IndexedDB après fermeture réelle. Exporter reste indispensable lorsque TEMPORAIRE est affiché.

## 3. Ce qui reste présent et ce qui n’a pas changé

AutoMap conserve les cinq difficultés liées, le tempo variable, les silences et les options de génération. Auto Show conserve les scènes existantes, motions, formations, caméra et lumière, avec priorité aux pistes manuelles. Le MMD garde PMX/PMD, VMD/VPD, morphs, SDEF/QDEF, héritages standards et les contraintes IK déjà implémentées. Le visage reste une ouverture par énergie ou clés manuelles, pas une reconnaissance de phonèmes.

Cette passe **n’ajoute pas Bullet**, les corps souples, l’adaptation universelle des pieds, les MME complets, de nouveaux personnages finalisés ou le catalogue en ligne. La dépendance Bullet n’a pas pu être récupérée dans cet environnement ; aucun binaire factice ou lien CDN n’est fourni. Le développement n’a pas été remplacé par une case qui prétend activer une physique inexistante.

Le moteur de score n’est pas certifié identique à SEGA. Les essais sur véritables manettes, appareils MIDI, iPhone/Safari et la persistance native restent ouverts. L’audit actualisé les conserve explicitement.

## Sources et vérifications

`src/audio-match.js` : descripteur original, comparaison et copie non destructive.
`src/face-drafts.js` : données de récupération, validation et remappage.
`src/v26-app.js`, `src/v26.css` : intégration et panneaux.
`src/v25-app.js`, `src/enhancements.js`, `src/quality.js` : branchements vers visage, archives et diagnostic.

`examples/v26/` contient des WAV originaux, un vrai réencodage MP3 et les données décodées du test. Ce corpus réduit ne mesure pas les faux positifs sur une discothèque variée. `RAPPORT_V26.md` détaille les commandes effectivement exécutées, les empreintes et les limites. Les rapports des anciennes versions présents dans l’archive restent historiques.
