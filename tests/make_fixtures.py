"""Generate original test media. No SEGA chart, music or model is included."""
from pathlib import Path
import math, json, struct, wave, array
R=Path(__file__).resolve().parents[1]; D=R/'examples'; D.mkdir(exist_ok=True)
rate=22050; seconds=8
samples=array.array('h')
for i in range(rate*seconds):
 t=i/rate; v=0
 for j in range(13):
  onset=1+j*.5; u=t-onset
  if 0<=u<.16:
   freq=[440,554.365,659.255,880][j%4]
   v+=.42*math.sin(2*math.pi*freq*u)*math.exp(-30*u)+.22*math.sin(2*math.pi*(90*u+4*(1-math.exp(-50*u))))*math.exp(-28*u)
 samples.append(int(max(-.99,min(.99,v))*32767))
with wave.open(str(D/'CONTROLE_120_BPM.wav'),'wb') as f:
 f.setnchannels(1); f.setsampwidth(2); f.setframerate(rate); f.writeframes(samples.tobytes())
notes=[dict(time=t,lane=l,type=k,x=.2+(i%6)*.115,y=.36+(i%2)*.15,duration=1 if k=='hold' else .35 if k=='chain' else 0,approach=1.4) for i,(t,l,k) in enumerate([(1,0,'tap'),(1.5,3,'hold'),(2,2,'tap'),(2,1,'tap'),(2.5,4,'slide'),(3,5,'chain'),(3.25,5,'chain'),(3.5,5,'chain'),(4,0,'tap'),(4.5,1,'tap'),(5,2,'tap'),(5.5,3,'tap'),(6,0,'tap'),(6.5,2,'tap'),(7,1,'tap')])]
chart={'format':'DIVA-PULSE','version':2,'id':'original-qa-chart','title':'Contrôle original · 120 BPM','difficulty':'NORMAL','bpm':120,'offset':0,'notes':notes,'scene':{'stage':'arena','cast':['miku'],'costumes':['classic'],'events':[{'time':0,'camera':'front','dance':'idol','stage':'arena'},{'time':3,'camera':'wide','dance':'wave','stage':'sakura'}]}}
(D/'CONTROLE_120_BPM.json').write_text(json.dumps(chart,ensure_ascii=False,indent=2))
(D/'CONTROLE_120_BPM.lrc').write_text('[00:00.00]DIVA PULSE — contrôle original\n[00:01.00]Triangle · maintiens le cercle\n[00:02.00]Accord carré + croix\n[00:03.00]Garde le slide droit\n[00:04.00]À toi de jouer\n',encoding='utf-8')
# DSC synthetic subset, deliberately written from scratch.
w=[0x15122517,1,50000,25,58,1000]
for t,ty,x,y in [(50000,0,96000,90000),(100000,5,180000,90000),(150000,2,240000,110000),(150000,3,290000,110000),(200000,12,200000,90000),(250000,16,230000,110000),(275000,16,280000,110000)]:
 w.extend([1,t,6,ty,x,y,90000,240000,0,0])
w += [0]
(D/'CONTROLE_SYNTHETIQUE_FT.dsc').write_bytes(struct.pack('<'+'I'*len(w),*w))
# Small, animated, skinned GLB. Untextured QA mannequin, not a Vocaloid asset.
p=[[-.3,0,-.22],[.3,0,-.22],[.3,2,-.22],[-.3,2,-.22],[-.3,0,.22],[.3,0,.22],[.3,2,.22],[-.3,2,.22]]
idx=[0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,3,7,6,3,6,2,1,2,6,1,6,5,0,4,7,0,7,3]
raw=bytearray(); views=[]; accessors=[]
def add(values,ctype,typ):
 while len(raw)%4:raw.append(0)
 off=len(raw); fmt={5126:'f',5123:'H'}[ctype]
 raw.extend(struct.pack('<'+fmt*len(values),*values)); views.append({'buffer':0,'byteOffset':off,'byteLength':len(raw)-off})
 dim={'VEC3':3,'VEC4':4,'SCALAR':1,'MAT4':16}[typ]
 accessors.append({'bufferView':len(views)-1,'componentType':ctype,'count':len(values)//dim,'type':typ}); return len(accessors)-1
pos=add([x for v in p for x in v],5126,'VEC3'); ii=add(idx,5123,'SCALAR')
joints=add([x for v in p for x in ([1 if v[1]>1 else 0,0,0,0])],5123,'VEC4'); weights=add([1,0,0,0]*8,5126,'VEC4')
identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]; inv=identity.copy(); inv[13]=-1
ib=add(identity+inv,5126,'MAT4'); times=add([0,1,2,3,4],5126,'SCALAR'); rotations=add([x for a in [0,.42,0,-.42,0] for x in [0,0,math.sin(a/2),math.cos(a/2)]],5126,'VEC4')
gltf={'asset':{'version':'2.0','generator':'DIVA PULSE original QA fixture'},'scene':0,'scenes':[{'nodes':[0,2]}], 'nodes':[{'name':'Hips','children':[1]},{'name':'Upper','translation':[0,1,0]},{'name':'Mannequin','mesh':0,'skin':0}], 'meshes':[{'primitives':[{'attributes':{'POSITION':pos,'JOINTS_0':joints,'WEIGHTS_0':weights},'indices':ii,'material':0}]}], 'materials':[{'pbrMetallicRoughness':{'baseColorFactor':[.2,.95,.75,1],'roughnessFactor':.7,'metallicFactor':0}}], 'skins':[{'joints':[0,1],'inverseBindMatrices':ib}], 'animations':[{'name':'Balance original','channels':[{'sampler':0,'target':{'node':1,'path':'rotation'}}], 'samplers':[{'input':times,'output':rotations,'interpolation':'LINEAR'}]}], 'bufferViews':views,'accessors':accessors,'buffers':[{'byteLength':len(raw)}]}
j=json.dumps(gltf,separators=(',',':')).encode();j+=b' '*((-len(j))%4); raw+=b'\0'*((-len(raw))%4)
body=struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(raw),0x004e4942)+raw
(D/'MANNEQUIN_QA_ANIME.glb').write_bytes(struct.pack('<III',0x46546c67,2,len(body)+12)+body)
print('Original fixtures generated:',len(list(D.iterdir())))
