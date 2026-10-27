"""One-time source fix verified locally before CI: do not depend exclusively
on media-query change-event delivery for reduced stage movement."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
changes={}
def patch(name,old,new):
 p=R/name;s=p.read_text();assert s.count(old)==1,(name,s.count(old));changes[p]=s.replace(old,new)
patch('src/feedback33.js'," motion.addEventListener?.('change',()=>{effects.clear();app.stage.reduceMotion=reduced();sync();});", """ // Some browsers defer media-query change events while a surface is busy.
 // Reconcile before the existing frame as well, never after stage rendering.
 const syncMotion=()=>{const value=reduced();if(app.stage.reduceMotion!==value){effects.clear();app.stage.reduceMotion=value;sync();}};
 motion.addEventListener?.('change',syncMotion);
 wrap('frame',(prev,ts)=>{syncMotion();return prev(ts);});""")
patch('tests/v33_browser_test.py',"p.emulate_media(reduced_motion='reduce');p.wait_for_timeout(100)","p.emulate_media(reduced_motion='reduce');p.wait_for_function('matchMedia(\"(prefers-reduced-motion: reduce)\").matches && PulseApp.stage.reduceMotion===true',timeout=5000)")
patch('tools/verify_pr33.py','0b5962898eb04806a6f9fbf5917809f9631b1b1115803929b59434832cdc4d3d','6f9e03d461b62f7263f2131116684bae3891d52f4fd77428fae316550d675ec2')
for p,s in changes.items():p.write_text(s)
