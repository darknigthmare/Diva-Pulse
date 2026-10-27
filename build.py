#!/usr/bin/env python3
"""Build the zero-dependency standalone game. No network request or package install."""
from pathlib import Path
ROOT = Path(__file__).resolve().parent
html = (ROOT / 'src/template.html').read_text(encoding='utf-8')
for token, file in {'DIRECTOREDIT29':'director-edit.js','PHYSICSDRAFT28':'physics-drafts.js','PHYSICSDATA27':'physics-data.js','SECONDARY27':'secondary-physics.js','APP27':'v27-app.js','CSS27':'v27.css','MATCH26':'audio-match.js','FACEDRAFT26':'face-drafts.js','APP26':'v26-app.js','CSS26':'v26.css','FACE25':'face-core.js','BUNDLE25':'bundle-core.js','APP25':'v25-app.js','CSS25':'v25.css','SKELETON24':'skeleton.js','MOTION24':'motion-analysis.js','RELIABILITY24':'reliability.js','QUALITY23':'quality.js','SKIN23':'skinning.js','CSS':'style.css','CORE':'core.js','STAGE':'stage.js','SERVICES':'services.js','EDITOR':'editor.js','APP':'app.js','CREATOR':'creator.js','EDITORV3':'editor-v3.js','ENHANCEMENTS':'enhancements.js','V3CSS':'v3.css','V4CORE':'live-core.js','V4APP':'live-app.js','V4CSS':'v4.css','V5CORE':'precision-core.js','V5APP':'precision-app.js','V5CSS':'v5.css','ACADEMY':'academy.js','V6CORE':'automap-core.js','V6APP':'automap-app.js','V6CSS':'v6.css','HASH':'hash-core.js','MMDCORE':'mmd-core.js','V7APP':'v7-app.js','V7CSS':'v7.css','V9CORE':'v9-core.js','V9APP':'v9-app.js','V9CSS':'v9.css','V10CORE':'v10-core.js','V10APP':'v10-app.js','V10CSS':'v10.css','MMD19':'mmd-compat.js','DIRECTOR19':'director-core.js','APP19':'director-app.js','CSS19':'director.css','AUTOSHOWCORE':'autoshow-core.js','AUTOSHOWAPP':'autoshow-app.js','AUTOSHOWCSS':'autoshow.css','MMDPACKAGE21':'mmd-package.js','MMDAUDIT21':'mmd-audit.js','MMDAPP21':'mmd-import-app.js','CSS21':'mmd-import.css','SURFACE22':'mmd-surface.js','MOTIONSYNC22':'motion-sync.js','MOTIONAPP22':'motion-sync-app.js'}.items():
    value = (ROOT / 'src' / file).read_text(encoding='utf-8')
    if file.endswith('.js'):
        value = value.replace('</script', r'<\/script')
    html = html.replace(f'/*__{token}__*/', value)
assert '/*__' not in html
(ROOT / 'DIVA_PULSE_JOUER.html').write_text(html, encoding='utf-8')
(ROOT / 'index.html').write_text(html, encoding='utf-8')
print(f'Build OK: {len(html.encode()) :,} bytes — all code inline, zero CDN dependency')
