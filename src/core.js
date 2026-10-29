/* DIVA PULSE 3 — independent rhythm engine. No official game code or assets. */
(function (root) {
    'use strict';
    const VERSION = '35.0.0';
    const LANES = ['△', '□', '×', '○', '‹', '›'];
    const DIFFICULTIES = ['EASY', 'NORMAL', 'HARD', 'EXTREME', 'EX EXTREME'];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const finite = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
    const uid = () => globalThis.crypto?.randomUUID?.() || ('p' + Date.now().toString(36) + Math.random().toString(36).slice(2));
    function rng(seed = 1) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
    function hashText(text) { let h = 2166136261; for (let i = 0; i < text.length; i++)
        h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; }
    function validateChart(input, { allowEmpty = true } = {}) {
        if (!input || typeof input !== 'object' || Array.isArray(input))
            throw Error('La partition doit être un objet JSON.');
        if (!Array.isArray(input.notes))
            throw Error('Le champ notes est absent.');
        if (input.notes.length > 50000)
            throw Error('Limite : 50 000 notes par partition.');
        if (!allowEmpty && !input.notes.length)
            throw Error('La partition ne contient aucune note.');
        const errors = [], ids = new Set();
        const notes = input.notes.map((n, i) => {
            if (!n || typeof n !== 'object') {
                errors.push(`Note ${i + 1} invalide`);
                return null;
            }
            const t = Number(n.time ?? n.t), lane = Number(n.lane), type = n.type || ((lane > 3) ? 'slide' : 'tap');
            if (!Number.isFinite(t) || t < 0 || t > 7200)
                errors.push(`Note ${i + 1} : temps invalide`);
            if (!Number.isInteger(lane) || lane < 0 || lane > 5)
                errors.push(`Note ${i + 1} : touche inconnue`);
            if (!['tap', 'hold', 'slide', 'chain'].includes(type))
                errors.push(`Note ${i + 1} : type inconnu`);
            const x = n.x === undefined ? .5 : Number(n.x), y = n.y === undefined ? .5 : Number(n.y);
            if (!Number.isFinite(x) || !Number.isFinite(y) || x < -4 || x > 5 || y < -4 || y > 5)
                errors.push(`Note ${i + 1} : position invalide`);
            if(n.angle!==undefined&&!Number.isFinite(Number(n.angle))||n.distance!==undefined&&!Number.isFinite(Number(n.distance)))errors.push(`Note ${i+1} : trajectoire invalide`);
            if(n.duration!==undefined&&(!Number.isFinite(Number(n.duration))||Number(n.duration)<0||Number(n.duration)>30))errors.push(`Note ${i+1} : durée hors plage (0–30 s)`);
            if(n.approach!==undefined&&(!Number.isFinite(Number(n.approach))||Number(n.approach)<.08||Number(n.approach)>15))errors.push(`Note ${i+1} : temps d’approche hors plage (0,08–15 s)`);
            let id = String(n.id || `note-${i}`);
            if (ids.has(id))
                id = `${id}-${i}`;
            while(ids.has(id))id+='-copy';
            ids.add(id);
            return { ...n, id, time: t, lane, type, x, y, duration: clamp(finite(n.duration, type === 'hold' ? 5 : 0), 0, 30), approach: clamp(finite(n.approach, 1.6), .08, 15) };
        });
        if (errors.length)
            throw Error(errors.slice(0, 5).join('\n'));
        notes.sort((a, b) => a.time - b.time || a.lane - b.lane);
        const duplicate = notes.find((n, i) => i > 0 && n.time === notes[i - 1].time && n.lane === notes[i - 1].lane);
        if (duplicate)
            throw Error(`Deux notes utilisent la même touche au même instant (${duplicate.time.toFixed(3)} s).`);
        if(input.bpm!==undefined&&!Number.isFinite(Number(input.bpm)))throw Error('BPM invalide.');
        for(const key of ['offset','gridOffset'])if(input[key]!==undefined&&(!Number.isFinite(Number(input[key]))||Math.abs(Number(input[key]))>30))throw Error('Décalage hors plage (±30 s).');
        const bpm = finite(input.bpm, 120);
        if (bpm < 20 || bpm > 400)
            throw Error('BPM attendu entre 20 et 400.');
        const map = (Array.isArray(input.tempoMap) && input.tempoMap.length ? input.tempoMap : [{time:0,bpm}]).map(m => ({time:Number(m.time),bpm:Number(m.bpm)})).sort((a,b)=>a.time-b.time);
        if(map.length>4096 || map.some(m=>!Number.isFinite(m.time)||m.time<0||m.time>7200||!Number.isFinite(m.bpm)||m.bpm<20||m.bpm>400))throw Error('Carte de tempo invalide.');
        if(map[0].time>0)map.unshift({time:0,bpm});
        for(let i=1;i<map.length;i++)if(Math.abs(map[i].time-map[i-1].time)<1e-7)throw Error('Deux tempos occupent le même instant.');
        const sections=(input.sections||[]);
        if(!Array.isArray(sections)||sections.length>200||sections.some(s=>!s||!Number.isFinite(s.from)||!Number.isFinite(s.to)||s.from<0||s.to<=s.from||s.to>7200||typeof s.label!=='string'))throw Error('Sections de partition invalides.');
        return {...input,format:'DIVA-PULSE',version:4,id:String(input.id||uid()),title:String(input.title||'Sans titre').slice(0,180),difficulty:DIFFICULTIES.includes(input.difficulty)?input.difficulty:'NORMAL',bpm,offset:clamp(finite(input.offset),-30,30),gridOffset:clamp(finite(input.gridOffset),-30,30),notes,tempoMap:map,source:input.source||'manual'};
    }

    function chartSignature(c) { return hashText(JSON.stringify([finite(c.offset), c.notes.map(n => [n.time, n.lane, n.type, n.x, n.y, n.duration, n.approach, n.angle, n.distance])])).toString(16); }
    function chartStats(c) {
        const notes = c.notes || [], times = new Map();
        let holds = 0, slides = 0, peak = 0;
        for (const n of notes) {
            times.set(n.time, (times.get(n.time) || 0) + 1);
            holds += n.type === 'hold';
            slides += n.lane > 3;
        }
        let j = 0;
        for (let i = 0; i < notes.length; i++) {
            while (notes[i].time - notes[j].time > 1)
                j++;
            peak = Math.max(peak, i - j + 1);
        }
        return { notes: notes.length, holds, slides, chords: [...times.values()].filter(x => x > 1).length, peakNps: peak, duration: notes.length ? notes.at(-1).time : 0 };
    }
    const JUDGMENT_PROFILES=Object.freeze({standard:Object.freeze([.033,.067,.1,.14]),accessible:Object.freeze([.045,.09,.135,.18]),precision:Object.freeze([.025,.05,.075,.1])});
    function judgmentProfile(value='standard'){if(!Object.hasOwn(JUDGMENT_PROFILES,value))throw Error('Profil de jugement inconnu.');return value;}
    function judge(delta,profile='standard') {const w=JUDGMENT_PROFILES[judgmentProfile(profile)],d=Math.abs(delta);return d<=w[0]?'COOL':d<=w[1]?'FINE':d<=w[2]?'SAFE':d<=w[3]?'SAD':'MISS';} 
    const POINTS = { COOL: 1000, FINE: 750, SAFE: 400, SAD: 100, MISS: 0, WRONG: 0 };
    const LIFE = { COOL: 2, FINE: 1, SAFE: 0, SAD: -8, MISS: -14, WRONG: -6 };
    class JudgeEngine {
        constructor(chart, options = {}) { this.chart = validateChart(chart); this.options = options; this.profile=judgmentProfile(options.judgmentProfile);this.windows=JUDGMENT_PROFILES[this.profile]; this.reset(); }
        reset(from=0,to=Infinity) {
          this.from=from;this.to=to;
          this.notes=this.chart.notes.map(n=>({...n,state:n.time+this.chart.offset<from-1e-7||n.time+this.chart.offset>=to?'skipped':'pending'}));
          this.total=this.notes.filter(n=>n.state!=='skipped').length;this.combo=0;this.maxCombo=0;this.score=0;this.holdBonus=0;this.life=127;
          this.counts={COOL:0,FINE:0,SAFE:0,SAD:0,MISS:0,WRONG:0};this.errors=[];this.log=[];this.activeHolds=new Map();this.held=new Set();this.heldSince=new Map();this.chainArmed=new Set();this.events=[];this.lastTime=from;this.cursor=0;this.failed=false;this.processed=0;this._updating=false;
        }
        accrueHolds(time,autoplay=false){
          for(const [lane,h] of this.activeHolds){
            const accrued=Math.floor(Math.max(0,Math.min(time,h.end,this.to)-h.start)*200+1e-6);
            this.holdBonus+=Math.max(0,accrued-h.awarded);h.awarded=Math.max(h.awarded,accrued);
            if(time>=h.end||time>=this.to){this.activeHolds.delete(lane);if(autoplay)this.held.delete(lane);}
          }
        }
        event(note, rating, error = 0) { if (note && note.state !== 'pending')
            return; this.counts[rating]++; if(note?.lane>3 && ['slide','chain'].includes(note.type) && ['COOL','FINE'].includes(rating))this.chainArmed.add(note.lane); if (note) {
            note.state = rating;
            this.processed++;
            this.score += POINTS[rating];
        } if (rating === 'COOL' || rating === 'FINE')
            this.maxCombo = Math.max(this.maxCombo, ++this.combo);
        else
            this.combo = 0; this.life = clamp(this.life + LIFE[rating], 0, 255); if (note && rating !== 'MISS')
            this.errors.push(error * 1000); this.events.push({ note, rating, error, time: this.lastTime }); this.log.push({noteId:note?.id||null,lane:note?.lane,rating,error:error*1000,time:this.lastTime}); if (this.life <= 0 && !this.options.noFail)
            this.failed = true; }
        press(lane, time) {
            if (!Number.isInteger(lane)||lane<0||lane>5||!Number.isFinite(time)) return null;
            // Input timestamps, not the last rendered frame, close held chains.
            // Autoplay calls this method from update and must not advance twice.
            // Delayed input cannot roll back events or HOLD points already settled.
            // Only advance chronologically; a new press keeps its explicit timestamp.
            if (!this._updating && time >= this.lastTime) this.update(time);
            this.accrueHolds(time);
            if (this.held.has(lane))
                return null;
            this.lastTime = time;
            this.held.add(lane);this.heldSince.set(lane,time);
            this.activeHolds.delete(lane);
            const search = time - this.chart.offset;
            let best = null, dist = this.windows[3]+.000001;
            for (let i = this.cursor; i < this.notes.length; i++) {
                const n = this.notes[i];
                if (n.time > search + this.windows[3]+.001)
                    break;
                if (n.lane !== lane || n.state !== 'pending')
                    continue;
                const d = Math.abs(search - n.time);
                if (d < dist) {
                    dist = d;
                    best = n;
                }
            }
            if (!best) {
                for(let i=this.cursor;i<this.notes.length;i++){const n=this.notes[i];if(n.time>search+this.windows[3])break;if(n.state==='pending'&&Math.abs(n.time-search)<=this.windows[3]){this.event(null,'WRONG');break;}}
                return null;
            }
            const delta = search - best.time, rating = judge(delta,this.profile);
            this.event(best, rating, delta);
            if ((best.type === 'hold' || best.type === 'chain') && (rating === 'COOL' || rating === 'FINE'))
                this.activeHolds.set(lane, { start: time, end: time + Math.min(best.duration || 5, 5), awarded: 0, note: best });
            return { note: best, rating, delta };
        }
        release(lane,time=this.lastTime) {
            if(!Number.isInteger(lane)||lane<0||lane>5||!Number.isFinite(time))return;
            if (!this._updating && time >= this.lastTime) this.update(time);
            this.accrueHolds(time);this.held.delete(lane);this.heldSince.delete(lane);this.chainArmed.delete(lane);this.activeHolds.delete(lane);
        }
        clearInputs() { this.held.clear();this.heldSince.clear();this.chainArmed.clear(); this.activeHolds.clear(); }
        update(time, autoplay = false) {
            if (!Number.isFinite(time) || this._updating)
                return;
            this._updating = true;
            try {
                this.lastTime = time;
                let expiry = this.cursor;
                // MISS deadlines and held chains share one chronological order.
                // Keep the late boundary inclusive and scan expirations only once,
                // even when a stalled frame crosses many notes.
                const expireBefore = until => {
                    while (expiry < this.notes.length) {
                        const n = this.notes[expiry], t = n.time + this.chart.offset;
                        if (t >= until - this.windows[3]) break;
                        expiry++;
                        if (n.state === 'pending') {
                            const deadline = t + this.windows[3];
                            this.accrueHolds(deadline);
                            this.lastTime = deadline;
                            this.event(n, 'MISS');
                        }
                    }
                };
                if (autoplay) {
                    for (let i = this.cursor; i < this.notes.length; i++) {
                        const n = this.notes[i], t = n.time + this.chart.offset;
                        if (t > time)
                            break;
                        if (n.state === 'pending') {
                            this.release(n.lane,t);
                            this.press(n.lane, t);
                            if (n.type !== 'hold' && n.type !== 'chain')
                                this.release(n.lane,t);
                        }
                    }
                }
                else {
                    for (let i = this.cursor; i < this.notes.length; i++) {
                        const n = this.notes[i], t = n.time + this.chart.offset;
                        if (t > time)
                            break;
                        if (n.state === 'pending' && n.type === 'chain' && n.lane > 3 && (this.options.legacyChains || this.chainArmed.has(n.lane)) && this.held.has(n.lane) && (this.heldSince.get(n.lane)??Infinity)<=t) {
                            expireBefore(t);
                            this.accrueHolds(t);this.lastTime=t;this.event(n, 'COOL', 0);
                            this.activeHolds.set(n.lane, { start: t, end: t + Math.min(n.duration || .3, 5), awarded: 0, note: n });
                        }
                    }
                }
                expireBefore(time);
                while (this.cursor < this.notes.length && this.notes[this.cursor].state !== 'pending')
                    this.cursor++;
                this.lastTime = time;
                this.accrueHolds(time,autoplay);
            }
            finally {
                this._updating = false;
            }
        }
        finish() { for (const n of this.notes)
            if (n.state === 'pending')
                this.event(n, 'MISS'); this.clearInputs(); return this.result(); }
        result() { const accuracy = this.total ? 100 * this.score / (this.total * 1000) : 0, cleared = !this.failed && accuracy >= 60; return { judgmentProfile:this.profile, counts: { ...this.counts }, total: this.total, processed: this.processed, score: this.score + this.holdBonus, baseScore: this.score, holdBonus: this.holdBonus, maxCombo: this.maxCombo, accuracy, life: this.life, failed: this.failed, cleared, fullCombo: this.total > 0 && this.counts.COOL + this.counts.FINE === this.total && this.counts.WRONG === 0, rank: accuracy >= 99 ? 'S+' : accuracy >= 95 ? 'S' : accuracy >= 90 ? 'A' : accuracy >= 80 ? 'B' : accuracy >= 70 ? 'C' : accuracy >= 60 ? 'D' : 'E', log:[...this.log], errors: [...this.errors], meanError: this.errors.length ? this.errors.reduce((a, b) => a + b, 0) / this.errors.length : 0 }; }
    }
    // FT/MM+ opcode arities and units: Hydr8gon/Project-DS, notes.txt (primary implementation notes).
    const DSC_ARITIES = [0, 1, 4, 2, 2, 2, 7, 4, 2, 6, 2, 1, 6, 2, 1, 1, 3, 2, 3, 5, 5, 4, 4, 5, 2, 0, 2, 4, 2, 2, 1, 21, 0, 3, 2, 5, 1, 1, 7, 1, 1, 2, 1, 2, 1, 2, 3, 3, 1, 2, 2, 3, 6, 6, 1, 1, 2, 3, 1, 2, 2, 4, 4, 1, 2, 1, 2, 1, 1, 3, 3, 3, 2, 1, 9, 3, 2, 4, 2, 3, 2, 24, 1, 2, 1, 3, 1, 3, 4, 1, 2, 6, 3, 2, 3, 3, 4, 1, 1, 3, 3, 4, 2, 3, 3, 8, 2];
    function parseDSC(buffer, title = 'Partition DSC') {
        if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 12 || buffer.byteLength % 4)
            throw Error('DSC invalide : mots de 32 bits attendus. Les archives FARC ne sont pas prises en charge.');
        if (buffer.byteLength > 8 * 1024 * 1024)
            throw Error('DSC trop volumineux.');
        const d = new DataView(buffer), notes = [], commands = [], warnings = new Set();
        let pos = 4, time = 0, musicStart = null, approach = 1.6, bpm = 120, ended = false, branch = 0;
        const mapping = { 0: 0, 1: 3, 2: 2, 3: 1, 4: 0, 5: 3, 6: 2, 7: 1, 12: 4, 13: 5, 15: 4, 16: 5, 18: 0, 19: 3, 20: 2, 21: 1 };
        while (pos < d.byteLength) {
            const op = d.getUint32(pos, true);
            pos += 4;
            const count = DSC_ARITIES[op];
            if (count === undefined)
                throw Error(`Commande DSC 0x${op.toString(16)} non prise en charge, octet ${pos - 4}. Import annulé pour éviter une partition fausse.`);
            if (pos + count * 4 > d.byteLength)
                throw Error('Commande DSC tronquée.');
            const a = [];
            for (let k = 0; k < count; k++, pos += 4)
                a.push(d.getInt32(pos, true));
            commands.push({ op, args: a, time });
            if (op === 0) {
                ended = true;
                break;
            }
            if (op === 1)
                time = a[0] / 100000;
            if (op === 25 && musicStart === null)
                musicStart = time;
            if (op === 28) {
                if (a[0] <= 0)
                    throw Error('BPM DSC nul.');
                bpm = a[0];
                approach = 60 / bpm * (a[1] + 1);
                if (approach < .08 || approach > 15)
                    throw Error('Temps de vol DSC hors de la plage prise en charge.');
            }
            if (op === 58) {
                approach = a[0] / 1000;
                if (approach < .08 || approach > 15)
                    throw Error('Temps de vol DSC hors de la plage prise en charge.');
            }
            if (op === 65) {
                branch = a[0];
                warnings.add('Branches de PV ignorées ; les notes situées dans une branche sont refusées.');
            }
            if (op === 6) {
                if (branch !== 0)
                    throw Error('Ce DSC contient des notes dans une branche de PV. Isoler la partition globale avant import.');
                const type = a[0], lane = mapping[type];
                if (lane === undefined)
                    throw Error(`Type de cible DSC ${type} non pris en charge. Aucun remplacement automatique.`);
                notes.push({ id: `dsc-${notes.length}`, time: time + approach, lane, type: type >= 4 && type <= 7 ? 'hold' : type === 15 || type === 16 ? 'chain' : lane > 3 ? 'slide' : 'tap', duration: type >= 4 && type <= 7 ? 5 : type === 15 || type === 16 ? .3 : 0, x: a[1] / 480000, y: a[2] / 270000, angle: a[3] / 1000, distance: a[4] / 480000, approach, sourceArgs: a, sourceTime: time, event: type >= 18 });
            }
        }
        if (!ended)
            throw Error('Fin de DSC manquante.');
        if (musicStart === null) {
            musicStart = 0;
            warnings.add('MUSIC_PLAY absent : origine audio supposée à 0 s, à vérifier.');
        }
        for (const n of notes) {
            n.time -= musicStart;
            if (n.time < 0)
                throw Error('Cible avant le départ audio : synchronisation incompatible.');
        }
        warnings.add('Timings, types pris en charge, positions et angles conservés. Ondulation de trajectoire et scoring SEGA non reproduits à l’identique.');
        return { chart: validateChart({ title, bpm: clamp(bpm, 20, 400), source: 'dsc', notes, provenance: { format: 'DSC FT/MM+', musicStart, header: d.getUint32(0, true), commands, warnings: [...warnings] } }), warnings: [...warnings] };
    }
    function parseCSV(text) { let rows = text.trim().split(/\r?\n/); if (!/^time[,;]lane/.test(rows[0]))
        throw Error('En-tête attendu : time,lane,type,x,y,duration'); return validateChart({ title: 'Import CSV', source: 'csv', notes: rows.slice(1).filter(Boolean).map((l, i) => { let a = l.split(/[,;]/); return { id: `csv-${i}`, time: Number(a[0]), lane: Number(a[1]), type: a[2] || 'tap', x: a[3] === undefined || a[3] === '' ? .5 : Number(a[3]), y: a[4] === undefined || a[4] === '' ? .5 : Number(a[4]), duration: Number(a[5] || 0) }; }) }); }
    function toCSV(c) { return 'time,lane,type,x,y,duration\n' + c.notes.map(n => [n.time, n.lane, n.type, n.x, n.y, n.duration || 0].join(',')).join('\n'); }
    function snapTime(time, bpm, division = 8, offset = 0) { const step = 60 / bpm * 4 / division; return Math.max(0, Math.round((time - offset) / step) * step + offset); }
    function tempoAt(chart, time) { let bpm = chart.bpm; for (const m of chart.tempoMap || []) {
        if (m.time > time)
            break;
        bpm = m.bpm;
    } return bpm; }
    class History {
        constructor(value, limit = 80) { this.limit = limit; this.items = [JSON.stringify(value)]; this.index = 0; }
        push(value) { const s = JSON.stringify(value); if (s === this.items[this.index])
            return; this.items.splice(this.index + 1); this.items.push(s); if (this.items.length > this.limit)
            this.items.shift(); this.index = this.items.length - 1; }
        undo() { if (this.index > 0)
            this.index--; return JSON.parse(this.items[this.index]); }
        redo() { if (this.index < this.items.length - 1)
            this.index++; return JSON.parse(this.items[this.index]); }
    }
    // Standalone worker-safe analysis: spectral flux + energy gate + tempo/phase estimate.
    function analyzePCM(samples, sampleRate) {
        const size = 1024, hop = 256, frames = Math.max(0, Math.floor((samples.length - size) / hop) + 1), re = new Float64Array(size), im = new Float64Array(size), prev = new Float64Array(size / 2), window = new Float64Array(size), flux = new Float32Array(frames), rms = new Float32Array(frames), centroid = new Float32Array(frames);
        for (let i = 0; i < size; i++)
            window[i] = .5 - .5 * Math.cos(2 * Math.PI * i / (size - 1));
        function fft() { for (let i = 1, j = 0; i < size; i++) {
            let bit = size >> 1;
            for (; j & bit; bit >>= 1)
                j ^= bit;
            j ^= bit;
            if (i < j) {
                let t = re[i];
                re[i] = re[j];
                re[j] = t;
                t = im[i];
                im[i] = im[j];
                im[j] = t;
            }
        } for (let len = 2; len <= size; len <<= 1) {
            let ang = -2 * Math.PI / len, wr0 = Math.cos(ang), wi0 = Math.sin(ang);
            for (let i = 0; i < size; i += len) {
                let wr = 1, wi = 0;
                for (let j = 0; j < len / 2; j++) {
                    let a = i + j, b = a + len / 2, tr = wr * re[b] - wi * im[b], ti = wr * im[b] + wi * re[b];
                    re[b] = re[a] - tr;
                    im[b] = im[a] - ti;
                    re[a] += tr;
                    im[a] += ti;
                    let nw = wr * wr0 - wi * wi0;
                    wi = wr * wi0 + wi * wr0;
                    wr = nw;
                }
            }
        } }
        let maxRms = 0, maxFlux = 0;
        for (let f = 0; f < frames; f++) {
            let energy = 0;
            for (let i = 0; i < size; i++) {
                let v = samples[f * hop + i] || 0;
                energy += v * v;
                re[i] = v * window[i];
                im[i] = 0;
            }
            rms[f] = Math.sqrt(energy / size);
            maxRms = Math.max(maxRms, rms[f]);
            fft();
            let sf = 0, sum = 0, weighted = 0;
            for (let k = 1; k < size / 2; k++) {
                let mag = Math.log1p(Math.hypot(re[k], im[k]) * 4);
                sf += Math.max(0, mag - prev[k]);
                prev[k] = mag;
                sum += mag;
                weighted += mag * k;
            }
            flux[f] = sf;
            centroid[f] = sum ? weighted / sum / (size / 2) : 0;
            maxFlux = Math.max(maxFlux, sf);
        }
        const onsets = [];
        const gate = Math.max(.00012, maxRms * .025), fps = sampleRate / hop;
        let last = -1;
        for (let f = 2; f < frames - 2; f++) {
            let avg = 0, n = 0;
            for (let j = Math.max(0, f - 15); j < Math.min(frames, f + 16); j++) {
                avg += flux[j];
                n++;
            }
            avg /= n;
            if (rms[f] > gate && flux[f] > avg * 1.35 && flux[f] > maxFlux * .025 && flux[f] >= flux[f - 1] && flux[f] > flux[f + 1]) {
                const t = Math.max(0, (f * hop + size / 4) / sampleRate);
                if (t - last > .065) {
                    onsets.push({ time: t, strength: flux[f] / Math.max(maxFlux, 1e-9), centroid: centroid[f], energy: rms[f] / Math.max(maxRms, 1e-9) });
                    last = t;
                }
            }
        }
        const scores = [];
        for (let bpm = 60; bpm <= 210; bpm++) {
            let lag = fps * 60 / bpm, score = 0, n = 0;
            for (let f = Math.ceil(lag); f < frames; f++) {
                const idx = f - lag, j = Math.floor(idx), w = idx - j;
                score += flux[f] * ((flux[j] || 0) * (1 - w) + (flux[j + 1] || 0) * w);
                n++;
            }
            score /= Math.max(1, n);
            score *= .85 + .15 * Math.exp(-Math.pow((bpm - 125) / 65, 2));
            scores.push({ bpm, score });
        }
        scores.sort((a, b) => b.score - a.score);
        const bpm = scores[0]?.score > 0 ? scores[0].bpm : 120, beat = 60 / bpm;
        let bestPhase = 0, bestAlign = -1;
        for (let j = 0; j < 100; j++) {
            let phase = j / 100 * beat, align = 0;
            for (const o of onsets) {
                let r = ((o.time - phase) % beat + beat) % beat;
                let d = Math.min(r, beat - r);
                align += o.strength * Math.exp(-d * d / (.028 * .028));
            }
            if (align > bestAlign) {
                bestAlign = align;
                bestPhase = phase;
            }
        }
        const confidence = onsets.length < 4 ? 0 : Math.min(.95, Math.max(.05, bestAlign / (onsets.reduce((s, o) => s + o.strength, 0) || 1)));
        const waveform = [];
        const bins = 1600, span = Math.max(1, Math.floor(samples.length / bins));
        for (let i = 0; i < bins; i++) {
            let max = 0;
            for (let j = i * span; j < Math.min(samples.length, (i + 1) * span); j += 4)
                max = Math.max(max, Math.abs(samples[j]));
            waveform.push(max);
        }
        const energy = [];
        for (let f = 0; f < frames; f += 8)
            energy.push({ time: f * hop / sampleRate, value: rms[f] / Math.max(maxRms, 1e-9) });
        return { bpm, phase: bestPhase, confidence, onsets, waveform, energy, duration: samples.length / sampleRate, candidates: scores.slice(0, 5).map(x => x.bpm), silent: maxRms < .00012 };
    }
    function generateChart(analysis, difficulty = 'NORMAL', opts = {}) {
        if (!analysis?.onsets?.length)
            throw Error('Aucune attaque musicale exploitable détectée. Utiliser le mode manuel ou un autre audio.');
        const level = Math.max(0, DIFFICULTIES.indexOf(difficulty)), bpm = clamp(finite(opts.bpm, analysis.bpm || 120), 20, 400), random = rng(finite(opts.seed, hashText(difficulty + analysis.duration))), minGap = [.45, .28, .2, .13, .095][level], notes = [];
        let last = -10, lane = 0;
        let onset = analysis.onsets.filter(o => o.strength >= [.16, .095, .055, .025, 0][level]);
        if (onset.length < 4)
            onset = analysis.onsets;
        for (let i = 0; i < onset.length; i++) {
            const o = onset[i];
            let t = o.time;
            if (opts.quantize) {
                const snap = snapTime(t, bpm, level < 2 ? 8 : 16, analysis.phase || 0);
                if (Math.abs(t - snap) < .045)
                    t = snap;
            }
            if (t - last < minGap || t < .3 || t > analysis.duration - .2)
                continue;
            last = t;
            lane = (lane + ([1, 1, 2, 3][Math.floor(random() * 4)])) % 4;
            let type = 'tap';
            if (level >= 2 && i % 19 === 17) {
                lane = 4 + (i % 2);
                type = 'slide';
            }
            let nx = .18 + (i % 7) * .105, ny = .33 + Math.sin(Math.floor(i / 7) * 1.4 + i * .4) * .18;
            const gap = (onset[i + 1]?.time || analysis.duration) - o.time;
            const audible = (analysis.energy || []).some(e => e.time > o.time + .3 && e.time < o.time + .7 && e.value > .08);
            if (lane < 4 && level >= 1 && gap > .75 && audible && i % 3 === 0)
                type = 'hold';
            notes.push({ id: `auto-${notes.length}`, time: t, lane, type, x: nx, y: ny, duration: type === 'hold' ? Math.min(5, gap) : 0, approach: [2.1, 1.9, 1.65, 1.4, 1.2][level] });
            if (level >= 2 && o.strength > .23 && i % (level >= 4 ? 5 : 9) === 0 && lane < 4) {
                const other = (lane + 2) % 4;
                notes.push({ id: `auto-${notes.length}`, time: t, lane: other, type: 'tap', x: nx + .065, y: ny + .13, duration: 0, approach: notes.at(-1).approach });
            }
        }
        return validateChart({ title: opts.title || 'Partition générée', difficulty, bpm, offset: 0, source: 'generated', generator: { algorithm: 'spectral-flux-v2', confidence: analysis.confidence, seed: opts.seed, quantized: !!opts.quantize }, notes });
    }
    const DEMOS = [{ id: 'neon-promise', title: 'NEON PROMISE', subtitle: 'A signal in the night', artist: 'DIVA PULSE · instrumental original', bpm: 128, bars: 32, key: 57, style: 0, accent: '#73fff0', stage: 'arena' }, { id: 'glass-orbit', title: 'GLASS ORBIT', subtitle: 'Weightless / endless', artist: 'DIVA PULSE · instrumental original', bpm: 110, bars: 28, key: 62, style: 1, accent: '#b99aff', stage: 'orbital' }, { id: 'sakura-voltage', title: 'SAKURA VOLTAGE', subtitle: 'Bloom beyond the skyline', artist: 'DIVA PULSE · instrumental original', bpm: 156, bars: 40, key: 60, style: 2, accent: '#ffa3cd', stage: 'sakura' }];
    function demoChart(d, level = 1) {
        const random = rng(hashText(d.id)), beat = 60 / d.bpm, notes = [];
        let i = 0;
        for (let bar = 1; bar < d.bars; bar++) {
            if (bar % 16 === 15)
                continue;
            const steps = [2, 4, 8, 8, 16][level];
            for (let s = 0; s < steps; s++) {
                if (level > 1 && s % 2 && random() > .50 + level * .08)
                    continue;
                let t = 2 + (bar * 4 + s * 4 / steps) * beat, lane = Math.floor(random() * 4);
                let type = 'tap';
                if (level >= 2 && i % 23 === 21) {
                    lane = 4 + i % 2;
                    type = 'slide';
                }
                if (level >= 1 && s === steps - 1 && bar % 4 === 3 && lane < 4)
                    type = 'hold';
                let x = .18 + (i % 7) * .103, y = .33 + .17 * Math.sin(i * .51);
                notes.push({ id: `demo-${i++}`, time: t, lane, type, duration: type === 'hold' ? Math.min(5, beat * 2) : 0, x, y, approach: [2.2, 1.9, 1.65, 1.4, 1.15][level] });
                if (level >= 3 && s === 0 && bar % 3 === 0) {
                    notes.push({ id: `demo-${i++}`, time: t, lane: (lane + 2) % 4, type: 'tap', x: x + .075, y: y + .15, approach: 1.4 });
                }
            }
        }
        return validateChart({ id: `${d.id}-${level}`, title: d.title, difficulty: DIFFICULTIES[level], bpm: d.bpm, source: 'demo', notes });
    }
    function synthDemo(d, sampleRate = 22050) {
        const beat = 60 / d.bpm, duration = 2 + (d.bars * 4 + 2) * beat, n = Math.ceil(duration * sampleRate), out = new Float32Array(n), random = rng(hashText(d.id));
        const scale = [0, 2, 3, 7, 10, 12, 15, 14], chords = [0, 5, 3, 7];
        function add(t, dur, fn, gain) { let start = Math.round(t * sampleRate), end = Math.min(n, start + Math.floor(dur * sampleRate)); for (let i = Math.max(0, start); i < end; i++) {
            let tt = (i - start) / sampleRate;
            out[i] += fn(tt, dur) * gain;
        } }
        const hz = m => 440 * Math.pow(2, (m - 69) / 12);
        for (let bar = 0; bar < d.bars; bar++) {
            let root = d.key + chords[Math.floor(bar / 4) % 4], breakBar = bar % 16 === 15;
            for (let b = 0; b < 4; b++) {
                const t = 2 + (bar * 4 + b) * beat;
                if (!breakBar) {
                    add(t, .28, (u) => Math.sin(2 * Math.PI * (45 * u + 7 * (1 - Math.exp(-u * 30)))) * Math.exp(-u * 16), .62);
                    if (b % 2)
                        add(t, .18, u => (random() * 2 - 1) * Math.exp(-u * 24), .20);
                }
                add(t, beat * .88, u => Math.sin(2 * Math.PI * hz(root - 24) * u) * Math.min(1, u * 100) * Math.exp(-u * 5), .19);
                for (let j = 0; j < 2; j++)
                    if (!breakBar)
                        add(t + j * beat / 2, .065, u => (random() * 2 - 1) * Math.exp(-u * 75), j ? .055 : .035);
                if (bar > 0)
                    for (let j = 0; j < (d.style === 2 ? 4 : 2); j++) {
                        let a = t + j * beat / (d.style === 2 ? 4 : 2), note = d.key + 12 + scale[(bar * 3 + b * 2 + j) % scale.length];
                        if (breakBar && b > 1)
                            continue;
                        add(a, beat * .65, (u) => { let phase = 2 * Math.PI * hz(note) * u; return (Math.sin(phase) + .23 * Math.sin(phase * 2) + .12 * Math.sin(phase * 3)) * Math.min(1, u * 140) * Math.exp(-u * (d.style === 1 ? 6 : 10)); }, .095);
                    }
            }
            for (const interval of [0, 3, 7])
                add(2 + bar * 4 * beat, 4 * beat, u => Math.sin(2 * Math.PI * hz(root + interval) * u) * Math.min(1, u * 3) * Math.min(1, (4 * beat - u) * 2), .045);
        }
        // Deterministic short feedback delay, then soft limiting/fade out.
        const delay = Math.round(beat * .75 * sampleRate);
        for (let i = delay; i < n; i++)
            out[i] += out[i - delay] * .20;
        let peak = .001;
        for (let i = 0; i < n; i++) {
            out[i] = Math.tanh(out[i]) * Math.min(1, (n - i) / sampleRate);
            peak = Math.max(peak, Math.abs(out[i]));
        }
        for (let i = 0; i < n; i++)
            out[i] = out[i] / peak * .85;
        return { samples: out, sampleRate, duration };
    }
    const api = { VERSION, JUDGMENT_PROFILES, judgmentProfile, LANES, DIFFICULTIES, clamp, finite, uid, rng, hashText, validateChart, chartSignature, chartStats, judge, JudgeEngine, DSC_ARITIES, parseDSC, parseCSV, toCSV, snapTime, tempoAt, History, analyzePCM, generateChart, DEMOS, demoChart, synthDemo };
    root.PulseCore = api;
    if (typeof module !== 'undefined')
        module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
