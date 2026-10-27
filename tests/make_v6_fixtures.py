"""Original synthetic music for reproducible AutoMap verification; no external media."""
from pathlib import Path
import wave, json, hashlib
import numpy as np
R=Path(__file__).resolve().parents[1];D=R/'examples/v6';D.mkdir(exist_ok=True)
sr=22050;duration=36;audio=np.zeros((int(sr*duration),2),dtype=np.float64);rng=np.random.default_rng(61)
def add(at,signal,pan=0):
 start=int(at*sr);n=min(len(signal),len(audio)-start)
 if n>0:
  audio[start:start+n,0]+=signal[:n]*(.7-.3*pan);audio[start:start+n,1]+=signal[:n]*(.7+.3*pan)
beat=60/128
melody=[0,7,12,10,7,3,5,7,0,3,7,12,10,7,5,3]
for step in range(136):
 at=1+step*beat/2
 if at>34:break
 if 14<=at<16:continue
 t=np.arange(int(sr*.2))/sr
 if step%2==0:add(at,np.sin(2*np.pi*(60*t+90*.022*(1-np.exp(-t/.022))))*np.exp(-t*25)*.4)
 if step%4==2:add(at,(rng.uniform(-1,1,len(t))*.28+np.sin(2*np.pi*185*t)*.12)*np.exp(-t*30),.2)
 t=np.arange(int(sr*.065))/sr;add(at,rng.uniform(-1,1,len(t))*np.exp(-t*90)*(.12 if step%2 else .065),(-1 if step%2 else 1)*.6)
 t=np.arange(int(sr*.22))/sr;freq=220*2**(melody[step%len(melody)]/12)
 bell=(np.sin(2*np.pi*freq*t)+np.sin(2*np.pi*freq*2*t)*.22)*np.minimum(1,t/.004)*np.exp(-t*16)*(.19 if at>=16 else .13)
 add(at,bell,np.sin(step*.3)*.7)
 if step%4==0:
  t=np.arange(int(sr*beat*1.8))/sr;freq=55*2**([0,3,5,7][step//16%4]/12)
  add(at,np.sin(2*np.pi*freq*t)*np.minimum(1,t/.008)*np.minimum(1,(beat*1.8-t)/.08)*.14)
audio*=.92/max(1,np.max(np.abs(audio)))
def save(name,samples):
 a=np.atleast_2d(samples) if samples.ndim>1 else samples[:,None]
 with wave.open(str(D/name),'wb') as w:w.setnchannels(a.shape[1]);w.setsampwidth(2);w.setframerate(sr);w.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
save('NEON_STEPS_128_ORIGINAL.wav',audio)
# Contrasting short fixtures for source identity, manual mode, and invalid audio.
for name,bpm,phase in [('SOURCE_EXACTE_100.wav',100,.7),('MODE_MANUEL_156.wav',156,.9)]:
 samples=np.zeros(int(sr*8));t=np.arange(int(sr*.075))/sr
 for at in np.arange(phase,7.5,60/bpm):
  j=int(at*sr);samples[j:j+len(t)]+=.5*np.sin(2*np.pi*760*t)*np.exp(-t*40)
 save(name,samples)
save('SILENCE_3_SECONDES.wav',np.zeros(sr*3))
(D/'AUDIO_INVALIDE.wav').write_bytes(b'Not an audio file. QA fixture only.')
(D/'SHA256_AUDIO.json').write_text(json.dumps({p.name:'sha256:'+hashlib.sha256(p.read_bytes()).hexdigest() for p in D.glob('*.wav')},indent=2))
print('Created',len(list(D.glob('*.wav'))),'original/control WAV files')
