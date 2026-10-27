# Audit des manques — état à la livraison V6

Cet inventaire n’annonce pas la résolution de tous les écarts avec Project DIVA. Il distingue les changements réellement intégrés de ce qui reste à produire ou valider.

| Besoin / manque V5 | État V6 | Preuve ou limite |
|---|---|---|
| Importer une musique sans devoir lancer ensuite le générateur | Corrigé | Import UI réel → décodage → Worker → cinq niveaux → sauvegarde |
| Difficultés cohérentes entre elles | Corrigé structurellement | Famille imbriquée ; repères faciles conservés, densités/accords bornés ; jugement musical humain non certifié |
| Réutiliser un niveau déjà disponible | Complété localement | Catalogue exact SHA-256 prioritaire ; pas de recherche Internet |
| Compléter les difficultés absentes sans écraser les autres | Corrigé | Réimport ou outil de complétion ; tests de source et signature inchangées |
| Import de plusieurs musiques | Ajouté | Lot séquentiel, erreurs individualisées, annulation, plafond de volume |
| Détection stéréo robuste à l’opposition de phase | Corrigé | Spectres calculés par canal ; tests mono/LR/opposition/alternance |
| Changements de tempo et ambiguïté moitié/double | Partiellement traité | Fenêtres locales et avertissements ; pas de carte musicale exacte automatiquement reconstruite |
| Distinguer les silences d’un mapping prêt | Corrigé | Audio conservé à compléter ; pas de notes aléatoires ajoutées pour remplir |
| Audition des frappes avant une correction | Ajouté | Écoute locale de douze secondes, toutes difficultés, arrêt à la navigation |
| Fiabilité des modifications et sauvegardes | Renforcée | Transactions, versions dérivées, aperçu réessayable ; tests de pannes injectées, pas certification de stockage durable |
| Contrôle musical indépendant / QA | Ajouté pour la structure | Vérification densité, timings, accords, HOLD, cibles et ancres ; pas un modèle de jugement humain |
| Reconnaissance du même enregistrement après réencodage | Non ajoutée | SHA-256 reconnaît les mêmes octets, pas un master sonore équivalent |
| Analyse séparée chant/batterie/basse | Non ajoutée | Profils spectraux, pas séparation de pistes ou reconnaissance de paroles |
| Transcription note pour note d’un niveau officiel depuis l’audio seul | Non ajoutée | Les choix du mapper ne sont pas contenus de façon unique dans le son |
| Fidélité intégrale des règles SEGA / des différentes éditions | Non complétée | Barème propre rules4, DSC compatible partiel ; voir limites |
| Modèles officiels détaillés, costumes complets, chorégraphies, lèvres, cheveux | Non complété | Silhouettes procédurales et sous-ensemble GLB conservés |
| PMX/VMD, Draco, PBR complet | Non ajouté | L’import GLB conserve les contraintes V5 |
| Versions natives, cloud, classement distant / multijoueur | Non ajoutés | Livraison locale autonome |
| Persistance après fermeture, PWA réelle, Safari/iPhone | Non validés | Origine navigateur de QA opaque ; tests serveur/cache séparés, sans contournement de politique |
| Manettes, MIDI, latence Bluetooth et écran tactile physiques | Non validés | Adaptateurs logiciels testés, aucun périphérique matériel connecté |

## Priorité pour un prochain travail réellement 1:1

La famille AutoMap améliore l’utilisation quotidienne d’un audio personnel. Les écarts visuels et éditoriaux ne se corrigent pas en ajoutant des chiffres de difficulté : ils demandent des assets adaptés, des partitions de référence, des mécaniques d’édition précisément comparées et des essais perceptuels. Aucun de ces éléments n’est annoncé comme livré s’il n’est pas présent dans les fichiers.
