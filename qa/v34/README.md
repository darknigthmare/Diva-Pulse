# V34 — Portée des preuves

Le vérificateur `tools/verify_pr34.py` lie les empreintes exactes de `index.html` et du classeur aux résultats exécutés sur la révision courante. La CI supprime les rapports de résultats avant de rejouer les tests. Les anciens rapports V30–V33 restent historiques et ne sont pas additionnés aux résultats présents.

Le parcours natif V34 comporte 28 contrôles, dont un véritable abort IndexedDB après la réussite d’une requête de suppression. Les 23 contrôles de régression Director utilisent un document injecté et un stockage temporaire ; les autres parcours navigateur sont exécutés sur HTTP et les API natives. Le contexte audio est réel, le rendu graphique logiciel. Une annulation de transaction n’est ni une panne disque ni une coupure d’alimentation.

La première exécution V34 a détecté un double déclenchement de l’abort volontaire dans l’instrumentation du test. Le test corrigé n’annule qu’une fois la transaction même si le navigateur réutilise le même objet IDBObjectStore. Les assertions de conservation des octets, d’absence d’événement de succès et de réessai restent exigées.

Aucune certification d’iPhone physique, de latence acoustique, de lecteur d’écran ou de compatibilité MMD universelle n’est annoncée. La simple présence de ce document n’est pas une preuve de réussite : consulter `verified.json` et l’exécution associée.
