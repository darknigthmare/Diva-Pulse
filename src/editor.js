(function (root) {
    'use strict';
    const C = root.PulseCore, $ = id => document.getElementById(id), colors = ['#7be7ad', '#d997fa', '#88bbff', '#ff97bb', '#ffd879', '#ffd879'];
    class Editor {
        constructor(app) { this.app = app; this.chart = null; this.selected = null; this.history = null; this.dirty = false; this.recording = false; this.listening = false; this.start = 0; this.zoom = 8; this.grid = 8; this.cursor = 0; this.drag = null; this.recordStarts = new Map(); this.bind(); }
        bind() {
            const app = this.app, on = (id, event, fn) => $(id).addEventListener(event, fn);
            on('editorNew', 'click', () => this.newChart());
            on('editorSave', 'click', () => app.run(() => this.save(), 'Enregistrement…'));
            on('editorExport', 'click', () => { if (this.chart)
                this.export(); });
            on('editorCSV', 'click', () => this.chart && root.PulseServices.download(C.toCSV(this.chart), `${this.chart.title}.csv`, 'text/csv'));
            on('editorImport', 'click', () => $('chartInput').click());
            on('editorChart', 'change', async () => { await this.autosave(); let c = app.song.charts.find(c => c.id === $('editorChart').value); if (c)
                this.load(c); });
            for (const id of ['editorTitle', 'editorDifficulty', 'editorBpm', 'editorOffset'])
                on(id, 'change', () => { if (!this.chart)
                    return; let before = structuredClone(this.chart); this.chart.title = $('editorTitle').value; this.chart.difficulty = $('editorDifficulty').value; this.chart.bpm = Number($('editorBpm').value); this.chart.offset = Number($('editorOffset').value); if (id === 'editorBpm')
                    this.chart.tempoMap = [{ time: 0, bpm: this.chart.bpm }]; this.commit(before); });
            on('editorPlay', 'click', () => app.run(() => this.togglePlay(false), 'Préparation audio…'));
            on('editorRecord', 'click', () => app.run(() => this.togglePlay(true), 'Préparation de la prise…'));
            on('editorStop', 'click', () => this.stop());
            on('undoButton', 'click', () => this.undo());
            on('redoButton', 'click', () => this.redo());
            on('editorGrid', 'change', () => { this.grid = +$('editorGrid').value; });
            on('editorZoom', 'change', () => { this.zoom = +$('editorZoom').value; this.draw(); });
            on('timelineScroll', 'input', () => { this.start = +$('timelineScroll').value; this.cursor = this.start; if (this.listening)
                app.audio.seek(this.cursor); this.draw(); });
            on('timeline', 'pointerdown', e => this.pointerDown(e));
            on('timeline', 'pointermove', e => this.pointerMove(e));
            on('timeline', 'pointerup', e => this.pointerUp(e));
            on('timeline', 'pointercancel', e => this.pointerUp(e));
            on('placement', 'pointerdown', e => { const n = this.note; if (!n)
                return; let rect = e.target.getBoundingClientRect(), before = structuredClone(this.chart); n.x = C.clamp((e.clientX - rect.left) / rect.width, .04, .96); n.y = C.clamp((e.clientY - rect.top) / rect.height, .08, .88); this.commit(before); });
            for (const id of ['noteLane', 'noteType', 'noteTime', 'noteDuration', 'noteX', 'noteY', 'noteApproach'])
                on(id, 'change', () => this.readFields());
            on('deleteNoteButton', 'click', () => this.remove());
            on('duplicateButton', 'click', () => this.duplicate());
            on('mirrorButton', 'click', () => { const n = this.note; if (!n)
                return; let before = structuredClone(this.chart); n.x = 1 - n.x; this.commit(before); });
            on('quantizeButton', 'click', () => { const n = this.note; if (!n)
                return; let before = structuredClone(this.chart); n.time = this.snap(n.time); this.commit(before); });
            on('testChartButton', 'click', () => app.run(async () => { await this.save(); await app.startGame('practice', { from: 0, to: app.song.duration, rate: 1, loop: false }); }, 'Préparation du test…'));
            on('addEventButton', 'click', () => { let time = Number($('eventTime').value); if (!Number.isFinite(time) || time < 0 || time > (app.song.duration || 600))
                return app.toast('Temps de plan invalide.', true); const event = { id: C.uid(), time, camera: $('eventCamera').value, dance: $('eventDance').value, stage: $('eventStage').value }; app.song.scene.events.push(event); app.song.scene.events.sort((a, b) => a.time - b.time); app.saveSong().catch(e => app.toast(e.message, true)); app.stage.events = app.song.scene.events; this.renderEvents(); });
        }
        get note() { return this.chart?.notes.find(n => n.id === this.selected); }
        async open() { if (this.chart && this.ownerId === this.app.song.id) {
            this.fill();
            return;
        } this.ownerId = this.app.song.id; this.start = 0; this.cursor = 0; this.load(this.app.chart || C.validateChart({ title: this.app.song.title, bpm: this.app.song.bpm || 120, notes: [] })); }
        load(chart) { this.stop(); this.chart = structuredClone(chart); this.originalId = chart.id; this.selected = null; this.history = new C.History(this.chart); this.dirty = false; this.fill(); }
        fill() { if (!this.chart)
            return; const select = $('editorChart'); select.replaceChildren(); for (const c of this.app.song.charts) {
            const o = new Option(`${c.difficulty} · ${c.source === 'demo' ? 'DÉMO' : c.source === 'dsc' ? 'DSC' : c.source === 'generated' ? 'AUTO' : c.source==='midi-native'?'MIDI NATIF':c.source==='midi'?'MIDI ADAPTÉ':c.source==='json'?'JSON SOURCE':c.source==='csv'?'CSV SOURCE':c.source==='manual-derived'?'VERSION DÉRIVÉE':'MANUEL'} · ${c.notes.length} notes`, c.id);
            select.add(o);
        } if (!this.app.song.charts.some(c => c.id === this.chart.id))
            select.add(new Option('Nouvelle partition · non enregistrée', this.chart.id)); select.value = this.chart.id; $('editorTitle').value = this.chart.title; $('editorDifficulty').value = this.chart.difficulty; $('editorBpm').value = this.chart.bpm; $('editorOffset').value = this.chart.offset; $('timelineScroll').max = Math.max(1, this.app.song.duration || 60); $('timelineScroll').value = this.start; this.renderFields(); this.renderEvents(); this.draw(); this.status(); }
        status() { if (!this.chart)
            return; $('editorSave').textContent = this.dirty ? 'Enregistrer •' : 'Enregistrer'; $('editorStats').textContent = `${this.chart.notes.length} notes · ${C.chartStats(this.chart).chords} accords`; $('undoButton').disabled = !this.history || this.history.index === 0; $('redoButton').disabled = !this.history || this.history.index === this.history.items.length - 1; }
        snap(t) { if (!this.grid)
            return Math.max(0, t); return C.snapTime(t, this.chart.bpm, this.grid, 0); }
        commit(before) { try {
            this.chart = C.validateChart(this.chart);
            this.history.push(this.chart);
            this.dirty = true;
        }
        catch (e) {
            if (before)
                this.chart = before;
            this.app.toast(e.message, true);
        } this.renderFields(); this.draw(); this.status(); }
        renderFields() { let n = this.note; $('noteEmpty').hidden = !!n; $('noteFields').hidden = !n; if (!n)
            return; $('noteLane').value = n.lane; $('noteType').value = n.type; $('noteTime').value = n.time.toFixed(4); $('noteDuration').value = n.duration || 0; $('noteX').value = n.x.toFixed(4); $('noteY').value = n.y.toFixed(4); $('noteApproach').value = n.approach; this.drawPlacement(); }
        readFields() { let n = this.note; if (!n)
            return; let before = structuredClone(this.chart); Object.assign(n, { lane: +$('noteLane').value, type: $('noteType').value, time: +$('noteTime').value, duration: +$('noteDuration').value, x: +$('noteX').value, y: +$('noteY').value, approach: +$('noteApproach').value }); if (n.type === 'hold' && !n.duration)
            n.duration = 5; if (n.type === 'chain' && !n.duration)
            n.duration = .5; this.commit(before); }
        drawPlacement() { const cv = $('placement'), ctx = cv.getContext('2d'); cv.width = 320; cv.height = 180; ctx.fillStyle = '#0a1424'; ctx.fillRect(0, 0, 320, 180); ctx.strokeStyle = '#233e52'; for (let x = 0; x < 320; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 180);
            ctx.stroke();
        } for (let y = 0; y < 180; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(320, y);
            ctx.stroke();
        } let n = this.note; if (n) {
            ctx.strokeStyle = colors[n.lane];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(n.x * 320, n.y * 180, 14, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = colors[n.lane];
            ctx.font = '19px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(C.LANES[n.lane], n.x * 320, n.y * 180);
        } }
        async newChart() { await this.autosave(); this.load(C.validateChart({ title: this.app.song.title, difficulty: this.app.difficulty, bpm: this.app.song.bpm || 120, source: 'manual', notes: [] })); this.dirty = true; this.fill(); }
        async save({draftKey=null}={}) {
            if (!this.chart) return;
            const chart=C.validateChart(this.chart),source=chart.source,song=this.app.song;
            if(song.id!==this.ownerId)throw Error('La partition appartient à un autre morceau.');
            if(this.dirty&&['demo','dsc','json','csv','midi','midi-native','catalogue','academy','generated'].includes(source)){
                chart.id=C.uid();
                chart.parent={id:this.originalId,signature:C.chartSignature(song.charts.find(c=>c.id===this.originalId)||chart),source};
                chart.source='manual-derived';
            }
            const candidate=structuredClone(song),index=candidate.charts.findIndex(c=>c.id===chart.id);
            if(index<0)candidate.charts.push(structuredClone(chart));else candidate.charts[index]=structuredClone(chart);
            // The chart and removal of its recovery copy commit together. An abort
            // leaves both the source song and the in-memory edit available to retry.
            await this.app.store.atomic([['songs',candidate]],{deletes:draftKey?[['settings',draftKey]]:[]});
            Object.assign(song,candidate);this.chart=chart;this.originalId=chart.id;this.dirty=false;
            this.app.selectedChartId=chart.id;this.app.difficulty=chart.difficulty;
            this.fill();this.app.toast('Partition enregistrée. Les versions source sont conservées.');
        }
        async autosave() { this.stop(); if (this.dirty)
            await this.save(); }
        export() { const chart = C.validateChart(this.chart); root.PulseServices.download(JSON.stringify({ ...chart, scene: this.app.song.scene, lyrics: this.app.song.lyrics || [] }, null, 2), `${chart.title}_${chart.difficulty.replaceAll(' ', '_')}.pulse.json`); }
        undo() { if (!this.history)
            return; this.chart = this.history.undo(); this.dirty = true; this.fill(); }
        redo() { if (!this.history)
            return; this.chart = this.history.redo(); this.dirty = true; this.fill(); }
        remove() { if (!this.note)
            return; let before = structuredClone(this.chart); this.chart.notes = this.chart.notes.filter(n => n.id !== this.selected); this.selected = null; this.commit(before); }
        duplicate() { let n = this.note; if (!n)
            return; let before = structuredClone(this.chart), copy = { ...structuredClone(n), id: C.uid(), time: n.time + 60 / this.chart.bpm * (this.grid ? 4 / this.grid : .5) }; this.chart.notes.push(copy); this.selected = copy.id; this.commit(before); }
        canvasPoint(e) { const r = $('timeline').getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height }; }
        pointerDown(e) {
            if (!this.chart || this.recording)
                return;
            const p = this.canvasPoint(e), time = this.start + (p.x - 43) / (p.w - 43) * this.zoom;
            if (p.x < 43)
                return;
            if (p.y < 72) {
                this.cursor = C.clamp(time, 0, this.app.song.duration || 600);
                if (this.listening)
                    this.app.audio.seek(this.cursor);
                $('eventTime').value = this.cursor.toFixed(2);
                this.draw();
                return;
            }
            const lane = C.clamp(Math.floor((p.y - 75) / ((p.h - 75) / 6)), 0, 5), existing = this.chart.notes.find(n => n.lane === lane && Math.abs(n.time - time) * ((p.w - 43) / this.zoom) < 12), before = structuredClone(this.chart);
            if (existing) {
                this.selected = existing.id;
            }
            else {
                let note = { id: C.uid(), time: this.snap(time), lane, type: lane > 3 ? 'slide' : 'tap', duration: 0, x: .20 + ((this.chart.notes.length % 7) / 7) * .60, y: .38 + .1 * Math.sin(this.chart.notes.length), approach: 1.6 };
                this.chart.notes.push(note);
                this.selected = note.id;
            }
            this.drag = { before, downX: p.x, downY: p.y, originalTime: this.note.time };
            e.target.setPointerCapture(e.pointerId);
            this.renderFields();
            this.draw();
        }
        pointerMove(e) { if (!this.drag || !this.note)
            return; const p = this.canvasPoint(e); if (Math.hypot(p.x - this.drag.downX, p.y - this.drag.downY) > 3) {
            this.note.time = this.snap(this.start + (p.x - 43) / (p.w - 43) * this.zoom);
            this.note.lane = C.clamp(Math.floor((p.y - 75) / ((p.h - 75) / 6)), 0, 5);
            this.renderFields();
            this.draw();
        } }
        pointerUp() { if (!this.drag)
            return; this.commit(this.drag.before); this.drag = null; }
        async togglePlay(record) { if (this.listening) {
            this.stop();
            return;
        } await this.app.prepareAudio(); this.recording = record; this.listening = true; this.recordBefore = structuredClone(this.chart); this.recordStarts.clear(); this.app.audio.play(this.app.buffer, this.cursor, 1); $('editorRecord').classList.toggle('recording', record); $('editorPlay').textContent = 'Ⅱ Pause'; $('editorRecord').textContent = record ? '● Prise en cours…' : '● Enregistrer les touches'; }
        stop() { if (this.recording) {
            const now = this.app.audio.time;
            for (const lane of this.recordStarts.keys())
                this.recordRelease(lane, now);
            this.commit(this.recordBefore);
        } if (this.listening) {
            this.cursor = Math.max(0, this.app.audio.time);
            this.app.audio.stop();
        } this.listening = false; this.recording = false; this.recordStarts.clear(); $('editorPlay').textContent = '▶ Écouter'; $('editorRecord').textContent = '● Enregistrer les touches'; $('editorRecord').classList.remove('recording'); }
        recordPress(lane, time) { if (!this.recording || time < 0 || this.recordStarts.has(lane))
            return; let t = this.snap(Math.max(0, time - this.chart.offset - this.app.settings.inputOffset / 1000)); if (this.chart.notes.some(n => n.lane === lane && Math.abs(n.time - t) < .001))
            return; let n = { id: C.uid(), time: t, lane, type: lane > 3 ? 'slide' : 'tap', duration: 0, x: .15 + (this.chart.notes.length % 8) * .09, y: .37 + .16 * Math.sin(this.chart.notes.length * .7), approach: 1.6 }; this.chart.notes.push(n); this.recordStarts.set(lane, { note: n, start: time }); this.selected = n.id; this.app.audio.sfx(lane); }
        recordRelease(lane, time) { const r = this.recordStarts.get(lane); if (!r)
            return; let duration = time - r.start; if (duration > .35) {
            r.note.type = lane > 3 ? 'chain' : 'hold';
            r.note.duration = Math.min(5, duration);
        } this.recordStarts.delete(lane); }
        renderEvents() { if (!this.app.song)
            return; let el = $('eventList'); el.replaceChildren(); for (const e of this.app.song.scene.events) {
            let row = document.createElement('div');
            row.className = 'event-row';
            let label = document.createElement('span');
            label.textContent = `${e.time.toFixed(2)} s · ${e.camera} · ${e.dance} · ${e.stage}`;
            let seek = document.createElement('button');
            seek.textContent = 'Voir';
            seek.onclick = () => { this.cursor = e.time; this.start = Math.max(0, e.time - 1); if (this.listening)
                this.app.audio.seek(e.time); this.draw(); };
            let del = document.createElement('button');
            del.textContent = '×';
            del.setAttribute('aria-label', 'Supprimer le plan');
            del.onclick = async () => { this.app.song.scene.events = this.app.song.scene.events.filter(x => x.id !== e.id); await this.app.saveSong(); this.app.stage.events = this.app.song.scene.events; this.renderEvents(); };
            row.append(label, seek, del);
            el.append(row);
        } if (!el.childElementCount) {
            let p = document.createElement('p');
            p.className = 'muted';
            p.textContent = 'Aucun plan personnalisé : la caméra et la danse du module sont utilisées.';
            el.append(p);
        } }
        update() { if (this.listening) {
            this.cursor = this.app.audio.time;
            if (this.cursor > this.start + this.zoom - .5) {
                this.start = Math.max(0, this.cursor - 1);
                $('timelineScroll').value = this.start;
            }
            if (this.cursor >= (this.app.buffer?.duration || Infinity))
                this.stop();
        } this.draw(); }
        draw() {
            if (!this.chart || this.app.view !== 'editor')
                return;
            const cv = $('timeline'), rect = cv.getBoundingClientRect();
            if (!rect.width)
                return;
            const ratio = Math.min(root.devicePixelRatio || 1, 2), width = rect.width, height = rect.height;
            if (cv.width !== Math.round(width * ratio) || cv.height !== Math.round(height * ratio)) {
                cv.width = Math.round(width * ratio);
                cv.height = Math.round(height * ratio);
            }
            const ctx = cv.getContext('2d');
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            ctx.fillStyle = '#0a1425';
            ctx.fillRect(0, 0, width, height);
            const left = 43, unit = (width - left) / this.zoom, laneH = (height - 75) / 6, duration = this.app.song.duration || 60, wave = this.app.song.waveform || [];
            ctx.fillStyle = '#5ea69e80';
            for (let x = left; x < width; x += 2) {
                let t = this.start + (x - left) / unit, index = Math.floor(t / duration * wave.length), amp = wave[index] || 0;
                ctx.fillRect(x, 42 - amp * 22, 1, amp * 44);
            }
            ctx.strokeStyle = '#2e4358';
            ctx.lineWidth = 1;
            const step = 60 / this.chart.bpm, first = Math.ceil(this.start / step);
            for (let b = first; b * step < this.start + this.zoom; b++) {
                let x = left + (b * step - this.start) * unit;
                ctx.strokeStyle = b % 4 === 0 ? '#34576b' : '#1b3044';
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
                if (b % 4 === 0) {
                    ctx.fillStyle = '#829aae';
                    ctx.font = '9px monospace';
                    ctx.fillText(`${Math.floor(b / 4) + 1}`, x + 4, 13);
                }
            }
            for (let l = 0; l < 6; l++) {
                let y = 75 + l * laneH;
                ctx.fillStyle = l % 2 ? '#13203860' : '#0d192a50';
                ctx.fillRect(left, y, width - left, laneH);
                ctx.strokeStyle = '#23364b';
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
                ctx.fillStyle = colors[l];
                ctx.font = '19px system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(C.LANES[l], 20, y + laneH / 2);
            }
            for (const n of this.chart.notes) {
                let x = left + (n.time - this.start) * unit, y = 75 + n.lane * laneH + laneH / 2;
                if (x < left - 10 || x > width + 10)
                    continue;
                ctx.fillStyle = colors[n.lane];
                if (n.duration && n.type !== 'tap') {
                    ctx.globalAlpha = .26;
                    ctx.fillRect(x, y - 5, Math.min(n.duration * unit, width - x), 10);
                    ctx.globalAlpha = 1;
                }
                ctx.beginPath();
                ctx.arc(x, y, n.id === this.selected ? 10 : 7, 0, Math.PI * 2);
                ctx.fill();
                if (n.id === this.selected) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                ctx.fillStyle = '#132037';
                ctx.font = '11px system-ui';
                ctx.fillText(C.LANES[n.lane], x, y + 1);
            }
            const cursorX = left + (this.cursor - this.start) * unit;
            if (cursorX >= left && cursorX <= width) {
                ctx.strokeStyle = this.recording ? '#ff809d' : '#8ffff0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(cursorX, 16);
                ctx.lineTo(cursorX, height);
                ctx.stroke();
            }
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            $('editorTime').textContent = this.app.formatTime(this.cursor, true);
            this.status();
        }
    }
    root.PulseEditor = Editor;
})(globalThis);
