# V33 — preuves liées au build

L'intégration native [40537671892](https://github.com/darknigthmare/Diva-Pulse/actions/runs/40537671892) a terminé avec succès et publié le jeu, le classeur et ces rapports au commit `a8982b656bcb4be1f596b423941e5c677bb5f18e`.

Build SHA-256 : `6f9e03d461b62f7263f2131116684bae3891d52f4fd77428fae316550d675ec2`.
Excel SHA-256 : `79aca4e1a1f8835a3b70e82ed40956b12d62f647a3aeafb47f94595f92768565`.

995 tests logiques, 10 contrôles du lanceur, 136 contrôles navigateur. Les 48 nouveaux tests logiques et 22 contrôles de retour de frappe ne sont pas présentés comme 995/136 nouveautés. Le total navigateur comprend 23 contrôles Director par document injecté ; les parcours actuels, l'audio, les transactions et la persistance ont utilisé HTTP et les API du navigateur. Chrome est fourni par le runner et sa version effective est enregistrée ; seul le pilote Playwright est épinglé dans requirements-test.txt.

Le correctif de mouvement réduit a été vérifié après un échec natif initial : la préférence est réconciliée avant chaque frame même si sa notification est retardée. Les anciennes tentatives échouées ne constituent pas les résultats de ce build.

`verified.json` relie les empreintes et compteurs. La CI de revue relance les suites et remplace les résultats dans son artefact, sans écrire dans le dépôt. Lire `commit.txt` de l'artefact pour identifier la révision relue. Les scénarios d'événements synthétiques ne sont pas un benchmark matériel ni une écoute humaine ; pas de qualification iPhone, Safari, Firefox, Bluetooth ou manette physique.
