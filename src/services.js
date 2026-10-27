(function (root) {
    'use strict';
    const C = root.PulseCore;
    // One writer per origin among V24 pages. This does not coordinate older versions.
    let writerLease;
    function acquireWriter(){
        if(!root.document||!root.navigator?.locks?.request)return Promise.resolve({writable:true,supported:false});
        if(writerLease)return writerLease;
        writerLease=new Promise(resolve=>{
            let settled=false;
            root.navigator.locks.request('DIVA-PULSE-V24-WRITER',{ifAvailable:true},async lock=>{
                const state={writable:!!lock,supported:true,released:false};settled=true;resolve(state);
                if(lock)await new Promise(release=>{root.addEventListener('pagehide',()=>{state.writable=false;state.released=true;release();},{once:true});});
            }).catch(()=>{if(!settled)resolve({writable:true,supported:false});});
        });return writerLease;
    }
    class Store {
        constructor() {
            this.db=null;this.memory={songs:new Map(),assets:new Map(),settings:new Map(),scores:new Map()};
            this.persistent=false;this.invalidated=false;this.listeners=new Set();this.lastCommitted=new Map();
        }
        watch(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn);}
        emit(event){for(const fn of this.listeners)try{fn(event);}catch{/* UI listeners must never cancel a committed transaction. */}}
        guard(store){if(this.invalidated)throw Error(this.reason||'Stockage fermé : recharger le jeu.');if(store&&!Object.hasOwn(this.memory,store))throw Error('Collection de sauvegarde inconnue.');}
        invalidate(message){if(this.invalidated)return;this.reason=message;this.invalidated=true;this.persistent=false;const db=this.db;this.db=null;try{db?.close();}catch{}this.emit({type:'unavailable',reason:message});}
        async open(){
            if(this.db)return this;this.invalidated=false;
            try{
                this.db=await new Promise((resolve,reject)=>{
                    let settled=false;const request=root.indexedDB.open('diva-pulse-stage-v2',2);
                    request.onupgradeneeded=()=>{for(const n of Object.keys(this.memory))if(!request.result.objectStoreNames.contains(n))request.result.createObjectStore(n,{keyPath:'id'});};
                    request.onsuccess=()=>{if(settled){request.result.close();return;}settled=true;resolve(request.result);};
                    request.onerror=()=>{if(!settled){settled=true;reject(request.error);}};
                    request.onblocked=()=>{if(!settled){settled=true;reject(Error('Fermer les autres onglets DIVA PULSE puis recharger.'));}};
                });
                this.db.onversionchange=()=>this.invalidate('La base a été ouverte par une autre version. Recharger avant de continuer.');
                this.db.onclose=()=>this.invalidate('Le navigateur a fermé le stockage. Recharger avant de continuer.');
                this.persistent=true;this.reason=null;const lease=await acquireWriter();this.lease=lease;this.readOnly=!lease.writable;this.writerGuard=lease.supported?(this.readOnly?'read-only':'locked'):'unavailable';
            }catch(e){this.db=null;this.reason=e.message;this.persistent=false;}
            return this;
        }
        remember(store,value){if(['songs','settings'].includes(store))this.lastCommitted.set(store+':'+value.id,structuredClone(value));}
        committed(store,id){const v=this.lastCommitted.get(store+':'+id);return v===undefined?undefined:structuredClone(v);}
        async get(store,id){this.guard(store);let value;if(!this.db)value=structuredClone(this.memory[store].get(id));else value=await new Promise((resolve,reject)=>{const tx=this.db.transaction(store),req=tx.objectStore(store).get(id);let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('Lecture impossible.'));tx.onabort=()=>reject(tx.error||Error('Lecture interrompue.'));});if(value)this.remember(store,value);return value;}
        async all(store){this.guard(store);let values;if(!this.db)values=structuredClone([...this.memory[store].values()]);else values=await new Promise((resolve,reject)=>{const tx=this.db.transaction(store),req=tx.objectStore(store).getAll();let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error||Error('Lecture impossible.'));tx.onabort=()=>reject(tx.error||Error('Lecture interrompue.'));});for(const value of values)this.remember(store,value);return values;}
        assertWritable(){
            if(this.persistent&&(this.readOnly||this.lease?.released)){
                const e=Error('Lecture seule : une autre fenêtre utilise cette bibliothèque, ou cette page a été suspendue. Exporter les brouillons, fermer les autres fenêtres puis recharger.');e.code='PULSE_READ_ONLY';throw e;
            }
        }
        async put(store,value){return this.atomic([[store,value]]);}
        async atomic(rows,options={}){
            this.guard();if(this.reason?.startsWith('La base a été ouverte'))throw Error(this.reason);
            if(!Array.isArray(rows)||!options||typeof options!=='object'||!Array.isArray(options.deletes??[]))throw Error('Transaction invalide.');
            // Freeze requested state before any async boundary; callers may keep editing.
            const staged=rows.map(row=>{if(!Array.isArray(row)||row.length!==2)throw Error('Ligne de transaction invalide.');const [store,value]=row;this.guard(store);if(!value||typeof value.id!=='string'||!value.id)throw Error('Identifiant de sauvegarde manquant.');return [store,structuredClone(value)];});
            const seen=new Set(),writes=new Set(staged.map(([store,value])=>JSON.stringify([store,value.id])));
            const deletes=(options.deletes??[]).map(row=>{if(!Array.isArray(row)||row.length!==2)throw Error('Suppression de transaction invalide.');const [store,id]=row;this.guard(store);if(typeof id!=='string'||!id)throw Error('Identifiant de suppression manquant.');const key=JSON.stringify([store,id]);if(seen.has(key)||writes.has(key))throw Error('Suppression dupliquée ou en conflit avec une écriture.');seen.add(key);return [store,id];});
            if(!staged.length&&!deletes.length)return;
            try{
                this.assertWritable();
                if(!this.db){for(const [store,id]of deletes)this.memory[store].delete(id);for(const [store,value]of staged)this.memory[store].set(value.id,value);}
                else await new Promise((resolve,reject)=>{
                    const tx=this.db.transaction([...new Set([...staged,...deletes].map(r=>r[0]))],'readwrite');
                    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Sauvegarde impossible.'));tx.onabort=()=>reject(tx.error||Error('Sauvegarde annulée.'));
                    try{for(const [store,id]of deletes)tx.objectStore(store).delete(id);for(const [store,value]of staged)tx.objectStore(store).put(value);}
                    catch(e){try{tx.abort();}catch{}reject(e);}
                });
                // Only the complete event may promote snapshots or signal success.
                for(const [store,id]of deletes)this.lastCommitted.delete(store+':'+id);
                for(const [store,value]of staged)this.remember(store,value);
                this.emit({type:'commit',rows:staged,deletes});
                for(const [store,id]of deletes)this.emit({type:'delete',store,id});
            }catch(e){this.emit({type:'write-error',error:e,rows:staged,deletes});throw e;}
        }
        async del(store,id){return this.atomic([],{deletes:[[store,id]]});}
    }
    class AudioTransport {
        constructor() { this.ctx = null; this.buffer = null; this.source = null; this.playing = false; this.anchor = 0; this.offset = 0; this.rate = 1; this.volume = .65; this.sfxVolume = .18; this.pausedAt = 0; }
        async init() { if (!this.ctx) {
            const AC = root.AudioContext || root.webkitAudioContext;
            if (!AC)
                throw Error('Web Audio indisponible.');
            this.ctx = new AC();
            this.gain = this.ctx.createGain();
            this.gain.gain.value = this.volume;
            this.gain.connect(this.ctx.destination);
            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.ctx.destination);
        } await this.ctx.resume(); return this.ctx; }
        async decode(blob) { await this.init(); if (blob.size > 100 * 1024 * 1024)
            throw Error('Audio trop volumineux : maximum 100 Mo.'); let b; try {
            b = await this.ctx.decodeAudioData(await blob.arrayBuffer());
        }
        catch (e) {
            throw Error('Audio non décodable. Essayer un fichier WAV ou MP3 valide.');
        } if (b.duration > 600)
            throw Error('Cette version accepte des morceaux de 10 minutes maximum.'); return b; }
        fromSamples(samples, sampleRate) { let b = this.ctx.createBuffer(1, samples.length, sampleRate); b.copyToChannel(samples, 0); return b; }
        play(buffer = this.buffer, position = 0, rate = 1) { if (!this.ctx || !buffer)
            throw Error('Audio non préparé.'); this.stop(); this.buffer = buffer; this.rate = rate; this.source = this.ctx.createBufferSource(); this.source.buffer = buffer; this.source.playbackRate.value = rate; this.source.connect(this.gain); this.offset = Math.max(0, position); this.anchor = this.ctx.currentTime + Math.max(0, -position / rate); this.source.start(this.anchor, Math.min(this.offset, Math.max(0, buffer.duration - .001))); this.playing = true; this.pausedAt = position; }
        get time() { return this.playing ? this.offset + (this.ctx.currentTime - this.anchor) * this.rate : this.pausedAt; }
        pause() { if (!this.playing)
            return; const t = this.time; this.stop(); this.pausedAt = t; }
        resume() { this.play(this.buffer, this.pausedAt, this.rate); }
        seek(time) { const t = Math.max(0, Math.min(this.buffer?.duration || Infinity, time)); if (this.playing)
            this.play(this.buffer, t, this.rate);
        else
            this.pausedAt = t; }
        stop() { if (this.source) {
            try {
                this.source.stop();
            }
            catch (e) { }
            this.source.disconnect();
            this.source = null;
        } this.playing = false; }
        setVolume(v) { this.volume = C.clamp(v, 0, 1); if (this.gain)
            this.gain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, .025); }
        sfx(lane = 0, strong = false) { if (!this.ctx || this.sfxVolume <= 0)
            return; let o = this.ctx.createOscillator(), g = this.ctx.createGain(), t = this.ctx.currentTime; this.sfxGain.gain.value = this.sfxVolume; o.type = 'sine'; o.frequency.setValueAtTime(strong ? 1200 : 640 + lane * 130, t); o.frequency.exponentialRampToValueAtTime(300, t + .055); g.gain.setValueAtTime(strong ? .23 : .14, t); g.gain.exponentialRampToValueAtTime(.001, t + .065); o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + .075); o.onended = () => { o.disconnect(); g.disconnect(); }; }
        async analyze(buffer, { onProgress = () => { }, signal } = {}) {
            if(signal?.aborted)throw Error('Analyse annulée.');
            onProgress(.05);
            const targetRate = 22050, length = Math.ceil(buffer.duration * targetRate), mono = new Float32Array(length), ratio = buffer.sampleRate / targetRate, channels = Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));
            for (let i = 0; i < length; i++) {
                if(i%65536===0){if(signal?.aborted)throw Error('Analyse annulée.');await new Promise(r=>setTimeout(r,0));}
                let p = i * ratio, j = Math.floor(p), f = p - j, sum = 0;
                for (const ch of channels)
                    sum += (ch[j] || 0) * (1 - f) + (ch[j + 1] || 0) * f;
                mono[i] = sum / channels.length;
            }
            const code = `onmessage=e=>{try{postMessage({result:(${C.analyzePCM.toString()})(e.data.samples,e.data.sampleRate)})}catch(error){postMessage({error:error.message})}};`, url = URL.createObjectURL(new Blob([code], { type: 'application/javascript' }));
            return new Promise((res, rej) => { let worker; const cleanup = () => { worker?.terminate(); URL.revokeObjectURL(url); signal?.removeEventListener('abort', abort); }; const abort = () => { cleanup(); rej(Error('Analyse annulée.')); }; try {
                worker = new Worker(url);
                worker.onmessage = e => { cleanup(); onProgress(1); e.data.error ? rej(Error(e.data.error)) : res(e.data.result); };
                worker.onerror = e => { cleanup(); rej(Error('Échec du worker audio : ' + e.message)); };
                if (signal?.aborted)
                    return abort();
                signal?.addEventListener('abort', abort, { once: true });
                worker.postMessage({ samples: mono, sampleRate: targetRate }, [mono.buffer]);
                onProgress(.25);
            }
            catch (e) {
                cleanup();
                rej(Error('Le navigateur bloque l’analyse locale. Lancer le jeu avec le serveur fourni.'));
            } });
        }
    }
    async function fingerprint(file) { const bytes = await file.arrayBuffer(); if (root.crypto?.subtle) {
        let b = await crypto.subtle.digest('SHA-256', bytes);
        return 'sha256:' + Array.from(new Uint8Array(b), v => v.toString(16).padStart(2, '0')).join('');
    } let a = new Uint8Array(bytes), h = 2166136261; for (const v of a)
        h = Math.imul(h ^ v, 16777619); return `fnv32:${a.length}:${(h >>> 0).toString(16)}`; }
    function blobToBase64(blob) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = () => rej(r.error); r.readAsDataURL(blob); }); }
    function base64ToBlob(text, type) { if (typeof text !== 'string' || text.length > 160 * 1024 * 1024)
        throw Error('Ressource de sauvegarde trop volumineuse.'); const bin = atob(text), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++)
        out[i] = bin.charCodeAt(i); return new Blob([out], { type: type || 'application/octet-stream' }); }
    function download(data, name, type = 'application/json') { let blob = data instanceof Blob ? data : new Blob([data], { type }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }
    function wave(buffer, bins = 1600) { const a = buffer.getChannelData(0), span = Math.max(1, Math.floor(a.length / bins)), out = []; for (let b = 0; b < bins; b++) {
        let peak = 0;
        for (let i = b * span; i < Math.min(a.length, (b + 1) * span); i += 4)
            peak = Math.max(peak, Math.abs(a[i]));
        out.push(peak);
    } return out; }
    root.PulseServices = { Store, AudioTransport, fingerprint, blobToBase64, base64ToBlob, download, wave };
})(globalThis);
