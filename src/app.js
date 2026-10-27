(function (root) {
    'use strict';
    const C = PulseCore, S = PulseServices, P = PulseStage, $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])), colors = ['#83f4b9', '#dda7ff', '#86c3ff', '#ff9abc', '#ffdf80', '#ffdf80'];
    const DEFAULTS = { id: 'preferences', musicVolume: .65, sfxVolume: .18, inputOffset: 0, visualOffset: 0, approachSpeed: 1, graphicsQuality: 1.5, reduceMotion: false, showTouch: matchMedia('(pointer:coarse)').matches, useVideo: true, noFail: false, keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyS', 'KeyL'] };
    const sceneDefault = stage => ({ cast: ['miku'], costumes: ['classic', 'classic', 'classic'], stage: stage || 'arena', camera: 'auto', dance: 'idol', events: [], modelAsset: null, blend:.5,lights:true,spacing:1,modelRotation:0,modelScale:1 });
    function cleanScene(raw, fallback = 'arena') { if(raw?.secondaryPhysics27)raw={...raw,secondaryPhysics27:root.PulseSecondaryPhysics.normalize(raw.secondaryPhysics27)}; if(raw?.faceTrack)raw={...raw,faceTrack:root.PulseFace.validate(raw.faceTrack)}; const s = { ...sceneDefault(fallback), ...(raw || {}) }, ids = P.AVATARS.map(x => x.id), stages = P.STAGES.map(x => x.id), cameras = ['auto', 'front', 'close', 'wide', 'orbit', 'high'], dances = ['idol', 'step', 'wave', 'clap', 'reach', 'spin', 'pose']; s.cast = Array.isArray(s.cast) ? s.cast.filter(x => ids.includes(x)).slice(0, 3) : ['miku']; if (!s.cast.length)
        s.cast = ['miku']; s.costumes = [0, 1, 2].map(i => ['classic', 'neon', 'snow', 'noir'].includes(s.costumes?.[i]) ? s.costumes[i] : 'classic'); if (!stages.includes(s.stage))
        s.stage = fallback; if (!cameras.includes(s.camera))
        s.camera = 'auto'; if (!dances.includes(s.dance))
        s.dance = 'idol'; s.events = (Array.isArray(s.events) ? s.events : []).filter(e => Number.isFinite(e.time) && e.time >= 0 && e.time <= 7200 && cameras.includes(e.camera) && dances.includes(e.dance) && stages.includes(e.stage)).slice(0, 2000).map(e => ({ id: e.id || C.uid(), time: e.time, camera: e.camera, dance: e.dance, stage: e.stage })).sort((a, b) => a.time - b.time); s.blend=C.clamp(C.finite(s.blend,.5),0,3);s.spacing=C.clamp(C.finite(s.spacing,1),.7,1.5);s.modelRotation=C.clamp(C.finite(s.modelRotation),-180,180);s.modelScale=C.clamp(C.finite(s.modelScale,1),.3,3);s.lights=s.lights!==false;return s; }
    class App {
        constructor() { this.store = new S.Store(); this.audio = new S.AudioTransport(); this.stage = new P.Stage($('stage')); this.stage.onError = m => this.toast(m, true); this.editor = new PulseEditor(this); this.songs = []; this.scores = []; this.song = null; this.view = 'library'; this.settings = { ...DEFAULTS }; this.difficulty = 'NORMAL'; this.selectedChartId = null; this.buffer = null; this.bufferId = null; this.buffers = new Map(); this.engine = null; this.mode = null; this.paused = false; this.heldSources = new Map(); this.laneSources = Array.from({ length: 6 }, () => new Set()); this.padPrevious = new Set(); this.bursts = []; this.lastFrame = 0; this.lastStageFrame = 0; this.recordHistory = []; this.busy = false; this.videoURL = null; this.modelLoaded = null; this.boot = performance.now(); this.calibration = null; this.bind(); }
        get chart() { if (!this.song)
            return null; return this.song.charts.find(c => c.id === this.selectedChartId && c.difficulty === this.difficulty) || this.song.charts.find(c => c.difficulty === this.difficulty) || null; }
        async init() {
            await this.store.open();
            const prefs = await this.store.get('settings', 'preferences');
            const checked=root.PulseQuality.preferences({...DEFAULTS,...prefs});this.preferenceWarnings=checked.warnings;this.settings=checked.value;
            this.settings.keys = this.settings.keys || [...DEFAULTS.keys];
            this.settings.reduceMotion = !!prefs?.reduceMotion || (!prefs && matchMedia('(prefers-reduced-motion:reduce)').matches);
            const storedSongs = await this.store.all('songs');
            this.quarantinedSongs = []; this.songs = [];
            for (const raw of storedSongs) {
                try {
                    if (!raw || typeof raw.title !== 'string' || !Array.isArray(raw.charts) || raw.charts.length>50) throw Error('Morceau ou liste de partitions invalide.');
                    const charts=raw.charts.map(c=>C.validateChart(c));
                    if (new Set(charts.map(c=>c.id)).size!==charts.length) throw Error('Identifiants de partitions dupliqués.');
                    this.songs.push({...raw,scene:cleanScene(raw.scene),charts});
                } catch(e) { this.quarantinedSongs.push({raw,error:e.message}); }
            }
            for (const demo of C.DEMOS)
                if (!this.songs.some(s => s.id === demo.id)) {
                    this.songs.push({ id: demo.id, title: demo.title, artist: demo.artist, bpm: demo.bpm, duration: 2 + (demo.bars * 4 + 2) * 60 / demo.bpm, builtin: true, demoId: demo.id, accent: demo.accent, charts: C.DIFFICULTIES.map((_, i) => C.demoChart(demo, i)), scene: sceneDefault(demo.stage), favorite: false, lyrics: [] });
                }
            this.songs = this.songs.map(s => ({ ...s, scene: cleanScene(s.scene), charts: (s.charts || []).map(c => C.validateChart(c)) }));
            this.scores = await this.store.all('scores');
            this.song = this.songs[0];
            this.selectedChartId = this.song.charts.find(c => c.difficulty === this.difficulty)?.id || null;
            this.fillStatic();
            this.applySettings();
            await this.applyScene();
            this.renderLibrary();
            this.renderSettings();
            $('saveStatus').textContent = this.store.persistent ? 'LOCAL / SAUVÉ' : 'TEMPORAIRE';
            $('no3d').hidden = this.stage.available;
            if(this.quarantinedSongs.length)this.toast(`${this.quarantinedSongs.length} morceau(x) non chargé(s), sans suppression. Consulter le diagnostic de bibliothèque.`,true,15000);
            if (!this.store.persistent)
                this.toast('Stockage persistant indisponible : exporter un .pulsepack avant de fermer le jeu.', true, 12000);
            requestAnimationFrame(t => this.frame(t));
            root.PulseApp = this;
            document.documentElement.dataset.ready = 'true';
        }
        fillStatic() { for (const id of ['editorDifficulty'])
            for (const d of C.DIFFICULTIES)
                $(id).add(new Option(d, d)); C.LANES.forEach((n, i) => $('noteLane').add(new Option(`${n} · ${i}`, i))); for (const s of P.STAGES)
            $('eventStage').add(new Option(s.name, s.id)); const touch = $('touchControls'); C.LANES.forEach((n, lane) => { let b = document.createElement('button'); b.textContent = n; b.style.color = colors[lane]; b.dataset.lane = lane; b.setAttribute('aria-label', `Touche ${n}`); b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); this.pressSource(`touch-${e.pointerId}`, lane,e.timeStamp); }); const release = e => { e.preventDefault(); this.releaseSource(`touch-${e.pointerId}`,e.timeStamp); }; b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release); touch.append(b); }); }
        bind() {
            const on = (id, event, fn) => $(id).addEventListener(event, e => { try {
                const p = fn(e);
                p?.catch?.(err => this.toast(err.message, true));
            }
            catch (err) {
                this.toast(err.message, true);
            } });
            document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => this.showView(b.dataset.view).catch(e => this.toast(e.message, true))));
            on('fullscreen', 'click', async () => { try {
                if (document.fullscreenElement)
                    await document.exitFullscreen();
                else if (document.documentElement.requestFullscreen)
                    await document.documentElement.requestFullscreen();
                else
                    this.toast('Plein écran non disponible dans ce navigateur.');
            }
            catch (e) {
                this.toast('Le navigateur a refusé le plein écran.');
            } });
            on('searchSongs', 'input', () => this.renderLibrary());
            on('filterFavorite', 'click', () => { this.favoriteFilter = !this.favoriteFilter; $('filterFavorite').setAttribute('aria-pressed', !!this.favoriteFilter); $('filterFavorite').textContent = this.favoriteFilter ? '♥' : '♡'; this.renderLibrary(); });
            on('favoriteSong', 'click', async () => { this.song.favorite = !this.song.favorite; await this.saveSong(); this.renderLibrary(); });
            on('addAudio', 'click', () => $('audioInput').click());
            on('audioInput', 'change', e => { let f = e.target.files[0]; e.target.value = ''; if (f)
                this.run(() => this.importAudio(f), 'Import de la musique…'); });
            on('importChart', 'click', () => $('chartInput').click());
            on('chartInput', 'change', e => { let f = e.target.files[0]; e.target.value = ''; if (f)
                this.run(() => this.importChart(f), 'Lecture de la partition…'); });
            on('playButton', 'click', () => this.run(() => this.startGame('play'), 'Préparation du live…'));
            on('autoButton', 'click', () => this.run(() => this.startGame('autoplay'), 'Préparation de l’Autoplay…'));
            on('pvButton', 'click', () => this.run(() => this.startGame('pv'), 'Préparation du clip…'));
            on('practiceButton', 'click', () => this.practiceDialog());
            on('generateButton', 'click', () => this.generateDialog());
            on('chartVariant', 'change', () => { this.selectedChartId = $('chartVariant').value; this.renderLibrary(); });
            on('castSlot', 'change', () => this.renderWardrobe());
            on('removeCast', 'click', async () => { let i = +$('castSlot').value; if (i === 0)
                return; this.song.scene.cast.splice(i, 1); this.song.scene.costumes.splice(i, 1); $('castSlot').value = '0'; await this.saveSong(); await this.applyScene(); this.renderWardrobe(); });
            for (const id of ['sceneCamera', 'sceneDance'])
                on(id, 'change', async () => { this.song.scene[id === 'sceneCamera' ? 'camera' : 'dance'] = $(id).value; await this.saveSong(); await this.applyScene(); });
            on('importModel', 'click', () => $('modelInput').click());
            on('modelInput', 'change', e => { const f = e.target.files[0]; e.target.value = ''; if (f)
                this.run(() => this.importModel(f), 'Chargement du modèle 3D…'); });
            on('clearModel', 'click', async () => { this.song.scene.modelAsset = null; await this.saveSong(); this.stage.clearCustom(); this.modelLoaded = null; await this.applyScene(); this.renderWardrobe(); });
            on('modelClips', 'change', async () => { if (this.stage.custom) {
                this.song.scene.modelClip = +$('modelClips').value;
                await this.saveSong();
                this.stage.custom.clipIndex = this.song.scene.modelClip;
            } });
            on('captureModel', 'click', () => this.capture());
            on('pvCapture', 'click', () => this.capture());
            on('importVideo', 'click', () => $('videoInput').click());
            on('videoInput', 'change', e => { const f = e.target.files[0]; e.target.value = ''; if (f)
                this.run(() => this.importVideo(f), 'Association du clip…'); });
            on('importLyrics', 'click', () => $('lyricsInput').click());
            on('lyricsInput', 'change', async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f)
                await this.importLyrics(f); });
            for (const id of ['musicVolume', 'sfxVolume', 'inputOffset', 'visualOffset', 'approachSpeed', 'graphicsQuality', 'reduceMotion', 'showTouch', 'useVideo', 'noFail'])
                on(id, id.includes('Volume') ? 'input' : 'change', async () => { const el = $(id); this.settings[id] = el.type === 'checkbox' ? el.checked : Number(el.value); this.applySettings(); await this.store.put('settings', this.settings); });
            on('calibrateButton', 'click', () => this.startCalibration());
            on('resetBindings', 'click', async () => { this.settings.keys = [...DEFAULTS.keys]; await this.store.put('settings', this.settings); this.renderSettings(); });
            for (const id of ['backupButton', 'exportLibrary'])
                on(id, 'click', () => this.run(() => this.exportBackup(), 'Création de la sauvegarde…'));
            on('restoreLibrary', 'click', () => $('backupInput').click());
            on('backupInput', 'change', e => { const f = e.target.files[0]; e.target.value = ''; if (f)
                this.run(() => this.restoreBackup(f), 'Restauration de la bibliothèque…'); });
            on('helpButton', 'click', () => this.help());
            on('cancelAnalysis', 'click', () => this.analysisAbort?.abort());
            on('pauseButton', 'click', () => this.pause());
            on('retryButton', 'click', () => this.run(() => this.startGame(this.lastMode || 'play', this.practice), 'Préparation…'));
            on('resultBack', 'click', () => this.showView('library'));
            on('resultEdit', 'click', () => this.showView('editor'));
            on('closeModal', 'click', () => { if (this.view === 'game' && this.paused)
                this.resume();
            else
                this.closeModal(); });
            $('modal').addEventListener('cancel', e => { e.preventDefault(); if (this.view === 'game' && this.paused)
                this.resume();
            else
                this.closeModal(); });
            document.addEventListener('keydown', e => this.keyDown(e));
            document.addEventListener('keyup', e => this.releaseSource('key-' + e.code,e.timeStamp));
            window.addEventListener('blur', () => { this.clearSources(); if (this.view === 'game' && !this.paused)
                this.pause(); if (this.editor.recording)
                this.editor.stop(); });
            document.addEventListener('visibilitychange', () => { if (document.hidden) {
                if (this.view === 'game' && !this.paused)
                    this.pause();
                if (this.editor.listening)
                    this.editor.stop();
            } });
            window.addEventListener('gamepaddisconnected', () => { for (const key of this.padPrevious)
                this.releaseSource(key); this.padPrevious.clear(); if (this.view === 'game' && !this.paused)
                this.pause(); });
        }
        formatTime(sec, precise = false) { sec = Math.max(0, sec || 0); const m = Math.floor(sec / 60), s = Math.floor(sec % 60); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${precise ? '.' + String(Math.floor((sec % 1) * 1000)).padStart(3, '0') : ''}`; }
        toast(text, error = false, duration = 6500) { clearTimeout(this.toastTimer); $('toast').textContent = text; $('toast').className = error ? 'error' : ''; $('toast').hidden = false; this.toastTimer = setTimeout(() => $('toast').hidden = true, duration); }
        async run(fn, title = 'Préparation…') { if (this.busy)
            return; this.busy = true; $('busyTitle').textContent = title; $('busyText').textContent = 'Traitement local : aucun fichier n’est envoyé.'; $('busy').hidden = false; await new Promise(r => setTimeout(r, 20)); try {
            return await fn();
        }
        catch (e) {
            console.warn('[DIVA PULSE]', e);
            this.toast(e.message || 'Une erreur est survenue.', true, 10000);
        }
        finally {
            this.busy = false;
            $('busy').hidden = true;
            $('cancelAnalysis').hidden = true;
        } }
        openModal(html) { if ($('modal').open)
            $('modal').close(); $('modalContent').innerHTML = `<div class="dialog">${html}</div>`; $('modal').showModal(); }
        closeModal() { if (this.calibration) {
            this.calibration.oscillators.forEach(o => { try {
                o.stop();
            }
            catch (e) { } });
            this.calibration = null;
        } $('modal').close(); }
        async showView(view) { if (this.view === 'editor' && view !== 'editor')
            await this.editor.autosave(); if (this.view === 'game' && view !== 'game') {
            this.audio.stop();
            this.engine = null;
            $('pvVideo').pause();
            $('pvVideo').hidden = true;
            this.clearSources();
        } this.view = view; $('app').className = 'mode-' + view; document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === view)); document.querySelectorAll('.nav').forEach(n => n.classList.toggle('active', n.dataset.view === view)); if (view === 'library') {
            await this.applyScene();
            this.renderLibrary();
        } if (view === 'wardrobe') {
            await this.applyScene();
            this.renderWardrobe();
        } if (view === 'editor') {
            await this.editor.open();
        } if (view === 'settings')
            this.renderSettings(); window.scrollTo(0, 0); }
        async saveSong() { await this.store.put('songs', this.song); }
        async selectSong(id) { if (this.view === 'editor')
            await this.editor.autosave(); const s = this.songs.find(x => x.id === id); if (!s)
            return; this.song = s; this.selectedChartId = s.charts.find(c => c.difficulty === this.difficulty)?.id || null; this.buffer = null; this.bufferId = null; await this.applyScene(); this.renderLibrary(); }
        renderLibrary() { if (!this.song)
            return; let list = $('songList'); list.replaceChildren(); const q = $('searchSongs').value.trim().toLowerCase(), filtered = this.songs.filter(s => (!this.favoriteFilter || s.favorite) && (s.title + ' ' + s.artist).toLowerCase().includes(q)); for (const s of filtered) {
            const index = this.songs.indexOf(s), b = document.createElement('button');
            b.className = 'song-card' + (s.id === this.song.id ? ' active' : ''); b.dataset.songId=s.id;
            b.setAttribute('role', 'listitem');
            b.setAttribute('aria-label', s.title);
            b.innerHTML = `<span class="song-art" style="--art:${/^#[a-f0-9]{6}$/i.test(s.accent || '') ? s.accent : '#70f0dc'}">${['◇', '◎', '✳'][index % 3]}</span><span class="song-card-text"><strong>${esc(s.title)}</strong><small>${s.builtin ? 'ORIGINAL' : s.charts.some(c => c.source === 'dsc') ? 'DSC IMPORTÉ' : 'BIBLIOTHÈQUE LOCALE'} · ${Math.round(s.bpm || 120)} BPM · ${this.formatTime(s.duration)}</small></span><span class="song-number">${s.favorite ? '♥' : String(index + 1).padStart(2, '0')}</span>`;
            b.onclick = () => this.run(() => this.selectSong(s.id), 'Chargement du morceau…');
            list.append(b);
        } if (!filtered.length)
            list.innerHTML = '<div class="empty-list">Aucun morceau ne correspond à cette recherche.</div>'; $('songCount').textContent = String(this.songs.length).padStart(2, '0'); const s = this.song, c = this.chart, stats = c ? C.chartStats(c) : null, best = c ? this.scores.find(r => r.id === this.scoreKey(c)) : null; $('selectedTitle').textContent = s.title; $('selectedArtist').textContent = s.artist || 'Musique importée'; $('songBpm').textContent = Math.round(c?.bpm || s.bpm || 120); $('songDuration').textContent = this.formatTime(s.duration); $('noteCount').textContent = stats?.notes ?? '—'; $('bestAccuracy').textContent = best ? best.accuracy.toFixed(2) + '%' : '—'; $('favoriteSong').textContent = s.favorite ? '♥' : '♡'; $('songSource').textContent = c?.source === 'dsc' ? 'DSC / TIMINGS IMPORTÉS' : c?.source === 'generated' ? 'PARTITION GÉNÉRÉE' : s.builtin ? 'INSTRUMENTAL ORIGINAL' : 'MUSIQUE LOCALE'; const tabs = $('difficultyTabs'); tabs.replaceChildren(); C.DIFFICULTIES.forEach(d => { const b = document.createElement('button'); b.textContent = d; b.className = (d === this.difficulty ? 'active ' : '') + (!s.charts.some(c => c.difficulty === d) ? 'missing' : ''); b.setAttribute('aria-pressed', d === this.difficulty); b.onclick = () => { this.difficulty = d; this.selectedChartId = s.charts.find(c => c.difficulty === d)?.id || null; this.renderLibrary(); }; tabs.append(b); }); const variants = s.charts.filter(c => c.difficulty === this.difficulty), sel = $('chartVariant'); sel.replaceChildren(); variants.forEach((c, i) => sel.add(new Option(`${i + 1}. ${c.source.toUpperCase()} · ${c.notes.length} notes · ${c.title}`, c.id))); sel.value = c?.id || ''; sel.hidden = variants.length <= 1; $('chartInfo').textContent = c ? `${stats.chords} accords · ${stats.holds} HOLD · ${stats.slides} slides${c.source === 'dsc' ? ' · trajectoires et scoring non garantis 1:1' : ''}` : 'Aucune partition à ce niveau. Importe-la, génère-la ou écris-la dans le studio.'; for (const id of ['playButton', 'autoButton', 'practiceButton'])
            $(id).disabled = !c?.notes.length; $('stageName').textContent = P.STAGES.find(x => x.id === s.scene.stage)?.name || 'SCÈNE'; $('castLabel').textContent = this.stage.custom ? this.stage.custom.name : s.scene.cast.map(id => P.AVATARS.find(a => a.id === id)?.name).join(' + ') + ' • SILHOUETTES DE TRAVAIL'; }
        async applyScene() { if (!this.song)
            return; const scene = this.song.scene; this.stage.setStage(scene.stage); this.stage.setCast(scene.cast, scene.costumes); this.stage.cameraMode = scene.camera; this.stage.dance = scene.dance; this.stage.events = scene.events;
            if(root.PulseV10&&await root.PulseV10.applyDirector(this,scene)) return;

            if(scene.mmd?.assetIds?.length){const key='mmd:'+scene.mmd.id+':'+scene.mmd.assetIds.join(',');if(this.modelLoaded!==key){try{const assets=[];for(const id of scene.mmd.assetIds){const a=await this.store.get('assets',id);if(a?.blob)assets.push(a)}const meta=new Map((scene.mmd.files||[]).map(f=>[f.id,f]));const model=assets.find(a=>meta.get(a.id)?.role==='model'),motions=[assets.find(a=>meta.get(a.id)?.role==='motion'),assets.find(a=>meta.get(a.id)?.role==='camera')].filter(Boolean),pose=assets.find(a=>meta.get(a.id)?.role==='pose'),textures=assets.filter(a=>meta.get(a.id)?.role==='texture').map(a=>({name:a.name,blob:a.blob}));if(!model)throw Error('modèle PMX/PMD absent');if(!/\.(pmx|pmd)$/i.test(model.name))throw Error('modèle PMX/PMD attendu');const info=await this.stage.loadMMD(await model.blob.arrayBuffer(),await Promise.all(motions.map(a=>a.blob.arrayBuffer())),pose?root.PulseMMD.decodeVpdBytes(await pose.blob.arrayBuffer()):null,textures,model.name);this.lastMMDDiagnostic=info.warnings||[];this.modelLoaded=key;this.toast(`MMD chargé : ${info.bones} os · ${info.motions} motion(s).`)}catch(e){this.stage.clearCustom();this.modelLoaded=null;this.toast('MMD non chargé : '+e.message,true)}}if(this.stage.custom?.kind==='mmd'){this.stage.custom.offsetMs=scene.mmd.offsetMs||0;this.stage.custom.rate=scene.mmd.rate||1;this.stage.custom.useCamera=scene.mmd.useCamera!==false;this.stage.custom.useIK=scene.mmd.ik!==false;this.stage.custom.loop=!!scene.mmd.loop;}}
            else if (scene.modelAsset) {if (this.modelLoaded !== scene.modelAsset) {let asset = await this.store.get('assets', scene.modelAsset);if (asset?.blob) {try {await this.stage.loadGLB(await asset.blob.arrayBuffer(), asset.name);this.modelLoaded = asset.id;}catch (e) {this.toast('Modèle non chargé : ' + e.message, true);this.modelLoaded = null;}}}if (this.stage.custom&&this.stage.custom.kind!=='mmd')this.stage.custom.clipIndex = C.clamp(scene.modelClip || 0, 0, this.stage.custom.clips.length - 1);}
            else {this.stage.clearCustom();this.modelLoaded = null;} }
        renderWardrobe() { const s = this.song.scene, slot = +$('castSlot').value, grid = $('avatarGrid'); grid.replaceChildren(); for (const a of P.AVATARS) {
            let b = document.createElement('button');
            b.className = 'avatar-choice' + (s.cast[slot] === a.id ? ' active' : '');
            b.innerHTML = `<strong style="color:${a.accent}">${a.name}</strong><small>${esc(a.full)}</small>`;
            b.onclick = () => this.run(async () => { while (s.cast.length < slot)
                s.cast.push('miku'); s.cast[slot] = a.id; s.modelAsset = null; await this.saveSong(); await this.applyScene(); this.renderWardrobe(); }, 'Changement de module…');
            grid.append(b);
        } $('removeCast').hidden = slot === 0 || !s.cast[slot]; const costumes = $('costumeGrid'); costumes.replaceChildren(); for (const [id, name, sub] of [['classic', 'CLASSIQUE', 'Étude de silhouette'], ['neon', 'NEON CIRCUIT', 'Accents lumineux'], ['snow', 'SNOW SIGNAL', 'Blanc, col et jupe'], ['noir', 'NOCTURNE', 'Tenue sombre & chapeau']]) {
            let b = document.createElement('button');
            b.className = s.costumes[slot] === id ? 'active' : '';
            b.innerHTML = `${name}<small>${sub}</small>`;
            b.onclick = () => this.run(async () => { s.costumes[slot] = id; await this.saveSong(); await this.applyScene(); this.renderWardrobe(); }, 'Changement de tenue…');
            costumes.append(b);
        } const stages = $('stageGrid'); stages.replaceChildren(); for (const st of P.STAGES) {
            let b = document.createElement('button');
            b.className = s.stage === st.id ? 'active' : '';
            b.innerHTML = `${st.name}<small>${st.sub}</small>`;
            b.onclick = () => this.run(async () => { s.stage = st.id; await this.saveSong(); this.stage.setStage(st.id); this.renderWardrobe(); }, 'Changement de scène…');
            stages.append(b);
        } $('sceneCamera').value = s.camera; $('sceneDance').value = s.dance; let clips = $('modelClips'); clips.replaceChildren(); this.stage.custom?.clips?.forEach((c, i) => clips.add(new Option(c.name, i))); clips.hidden = !this.stage.custom?.clips?.length; clips.value = this.stage.custom?.clipIndex || 0; $('modelInfo').textContent = this.stage.custom ? `${this.stage.custom.name} · ${this.stage.custom.triangles.toLocaleString('fr-FR')} triangles · ${this.stage.custom.clips.length} animations` : 'Aucun modèle externe associé.'; }
        applySettings() { const s = this.settings; s.musicVolume = C.clamp(C.finite(s.musicVolume, .65), 0, 1); s.sfxVolume = C.clamp(C.finite(s.sfxVolume, .18), 0, .6); s.inputOffset = C.clamp(C.finite(s.inputOffset), -500, 500); s.visualOffset = C.clamp(C.finite(s.visualOffset), -500, 500); this.audio.setVolume(s.musicVolume); this.audio.sfxVolume = s.sfxVolume; s.graphicsQuality = C.clamp(C.finite(s.graphicsQuality, 1.5), 0, 2); s.approachSpeed = C.clamp(C.finite(s.approachSpeed, 1), .5, 2); this.stage.quality = Math.max(1, s.graphicsQuality); this.stage.reduceMotion = s.reduceMotion; $('musicVolumeOut').textContent = Math.round(s.musicVolume * 100) + ' %'; $('touchControls').hidden = !s.showTouch || this.mode === 'pv'; }
        renderSettings() { for (const key of Object.keys(DEFAULTS)) {
            let el = $(key);
            if (!el)
                continue;
            if (el.type === 'checkbox')
                el.checked = !!this.settings[key];
            else
                el.value = this.settings[key];
        } $('musicVolumeOut').textContent = Math.round(this.settings.musicVolume * 100) + ' %'; let el = $('keyBindings'); el.replaceChildren(); C.LANES.forEach((n, i) => { let row = document.createElement('div'); row.className = 'binding'; let label = document.createElement('span'); label.textContent = n; let b = document.createElement('button'); b.textContent = this.settings.keys[i].replace('Key', ''); b.setAttribute('aria-label', 'Réassigner ' + n); b.onclick = () => { this.remapping = i; b.textContent = '…'; this.toast('Appuie sur la nouvelle touche. Échap pour annuler.'); }; row.append(label, b); el.append(row); }); $('storageInfo').textContent = this.store.persistent ? 'Sauvegarde IndexedDB active. Effacer les données du navigateur supprime la bibliothèque : exporter régulièrement un .pulsepack.' : 'Mode temporaire : le navigateur ne permet pas la sauvegarde persistante.'; const clears = this.scores.length, fc = this.scores.filter(s => s.fullCombo).length, mean = clears ? this.scores.reduce((s, r) => s + r.accuracy, 0) / clears : 0; $('globalStats').innerHTML = `<div>${clears}<small>PARTITIONS TERMINÉES</small></div><div>${fc}<small>FULL COMBO</small></div><div>${mean.toFixed(1)}%<small>PRÉCISION MOYENNE</small></div>`; }
        async prepareAudio() { await this.audio.init(); if (this.bufferId === this.song.id && this.buffer)
            return this.buffer; if (this.buffers.has(this.song.id)) {
            this.buffer = this.buffers.get(this.song.id);
        }
        else if (this.song.builtin) {
            const d = C.DEMOS.find(d => d.id === this.song.demoId);
            if (!d)
                throw Error('Démo inconnue.');
            const synth = C.synthDemo(d);
            this.buffer = this.audio.fromSamples(synth.samples, synth.sampleRate);
        }
        else {
            let a = await this.store.get('assets', this.song.audioAsset);
            if (!a?.blob)
                throw Error('Audio absent. Réimporter le fichier ou restaurer la sauvegarde complète.');
            this.buffer = await this.audio.decode(a.blob);
        } this.bufferId = this.song.id; this.buffers.set(this.song.id, this.buffer); if (this.buffers.size > 3) {
            let oldest = this.buffers.keys().next().value;
            this.buffers.delete(oldest);
        } if (!this.song.waveform)
            this.song.waveform = S.wave(this.buffer); this.song.duration = this.buffer.duration; return this.buffer; }
        async importAudio(file) { const fp = await S.fingerprint(file), same = this.songs.find(s => s.audioHash === fp); if (same) {
            await this.selectSong(same.id);
            this.toast('Fichier audio déjà connu : ses partitions existantes sont réutilisées, sans régénération.');
            return;
        } const buffer = await this.audio.decode(file), id = C.uid(), assetId = C.uid(), title = file.name.replace(/\.[^.]+$/, '').slice(0, 180), song = { id, title, artist: 'Audio personnel', bpm: 120, duration: buffer.duration, charts: [], scene: sceneDefault(), audioHash: fp, audioAsset: assetId, waveform: S.wave(buffer), accent: '#70f0dc', lyrics: [], favorite: false }; await this.store.atomic([['assets', { id: assetId, blob: file, name: file.name, kind: 'audio', hash: fp }], ['songs', song]]); this.songs.push(song); this.buffers.set(id, buffer); await this.selectSong(id); this.buffer = buffer; this.bufferId = id; this.toast('Audio importé. Choisis « Générer une partition », importe un DSC/JSON, ou ouvre le studio.'); }
        async importChart(file) { if (!this.song)
            throw Error('Sélectionner d’abord une musique.'); if (file.size > 8 * 1024 * 1024)
            throw Error('Partition trop volumineuse : 8 Mo maximum.'); let c, report = [], ext = file.name.split('.').at(-1).toLowerCase(), raw = null; if (ext === 'dsc') {
            const result = C.parseDSC(await file.arrayBuffer(), this.song.title);
            c = result.chart;
            c.difficulty = this.difficulty;
            report = result.warnings;
        }
        else if (ext === 'csv') {
            c = C.parseCSV(await file.text());
            c.title = this.song.title;
            c.difficulty = this.difficulty;
        }
        else {
            try {
                raw = JSON.parse(await file.text());
            }
            catch (e) {
                throw Error('Fichier JSON invalide.');
            }
            c = C.validateChart(raw.chart || raw, { allowEmpty: false });
            c.source = c.source === 'dsc' ? 'dsc' : 'json';
        } c.id = C.uid(); c.fileHash = await S.fingerprint(file); c.fileName = file.name; c.provenance = { ...(c.provenance || {}), importSignature: C.chartSignature(c) }; if (c.notes.at(-1)?.time + c.offset > this.song.duration + 1)
            report.push('La dernière note dépasse la durée audio. Vérifier la bonne version de la chanson et son décalage.'); if (this.song.charts.length >= 50)
            throw Error('Maximum 50 partitions par morceau.'); const beforeImport=structuredClone(this.song); this.song.charts.push(c); if (raw?.scene)
            this.song.scene = cleanScene(raw.scene); if (Array.isArray(raw?.lyrics))
            this.song.lyrics = raw.lyrics.filter(l => Number.isFinite(l.time) && typeof l.text === 'string').slice(0, 3000); this.difficulty = c.difficulty; this.selectedChartId = c.id; try{await this.saveSong();}catch(e){Object.assign(this.song,beforeImport);this.selectedChartId=this.song.charts[0]?.id||null;throw e;} await this.applyScene(); this.renderLibrary(); if (this.view === 'editor') {
            this.editor.load(c);
            this.editor.ownerId = this.song.id;
        } this.toast(`${c.notes.length} notes importées. Aucune génération n’a été appliquée.\n${report.join('\n')}`, false, 14000); }
        generateDialog() { this.openModal(`<div class="eyebrow">AUDIO → CHART</div><h2>GÉNÉRER LE RYTHME</h2><p>Analyse locale du spectre, des attaques et des silences. Ce résultat est une proposition jouable, pas la partition officielle ni une transcription parfaite des voix.</p><div class="two-col"><label>BPM imposé (vide = estimation)<input id="genBpm" type="number" min="20" max="400" placeholder="Automatique"></label><label>Graine reproductible<input id="genSeed" type="number" value="1" min="1"></label></div><label class="check"><input id="genAll" type="checkbox" checked> Créer les cinq difficultés</label><label class="check"><input id="genQuantize" type="checkbox"> Quantifier les attaques proches d’une grille (±45 ms)</label><p>Les partitions déjà présentes ne sont jamais écrasées.</p><div class="buttons"><button id="genStart" class="primary">ANALYSER & GÉNÉRER</button></div>`); $('genStart').onclick = () => { const bpm = $('genBpm').value ? +$('genBpm').value : undefined, seed = +$('genSeed').value, all = $('genAll').checked, quantize = $('genQuantize').checked; if (bpm !== undefined && (!Number.isFinite(bpm) || bpm < 20 || bpm > 400))
            return this.toast('BPM attendu entre 20 et 400.', true); this.closeModal(); this.run(() => this.generate({ bpm, seed, all, quantize }), 'Analyse musicale…'); }; }
        async generate(options = {}) { await this.prepareAudio(); this.analysisAbort = new AbortController(); $('cancelAnalysis').hidden = false; let analysis = this.song.analysis; if (!analysis) {
            analysis = await this.audio.analyze(this.buffer, { signal: this.analysisAbort.signal, onProgress: p => $('busyText').textContent = p < 1 ? 'Détection spectrale des attaques et estimation du tempo…' : 'Construction des motifs rythmiques…' });
        } if (analysis.silent || !analysis.onsets.length)
            throw Error('Audio silencieux ou aucune attaque détectable : utiliser l’éditeur manuel.'); let diffs = options.all ? C.DIFFICULTIES : [this.difficulty]; if (this.song.charts.length + diffs.length > 50)
            throw Error('Maximum 50 partitions par morceau.'); const charts = diffs.map(d => C.generateChart(analysis, d, { ...options, title: this.song.title })); this.song.analysis = analysis; this.song.bpm = options.bpm || analysis.bpm; this.song.charts.push(...charts); this.selectedChartId = charts.find(c => c.difficulty === this.difficulty)?.id || charts[0].id; this.difficulty = charts.find(c => c.id === this.selectedChartId).difficulty; await this.saveSong(); this.renderLibrary(); this.toast(`${charts.length} partition(s) créée(s) · ${charts.map(c => c.notes.length).join(' / ')} notes. Tempo ${Math.round(this.song.bpm)} BPM, confiance ${Math.round(analysis.confidence * 100)} % : vérifier à l’écoute.`, false, 12000); }
        practiceDialog() { if (!this.chart)
            return; this.openModal(`<div class="eyebrow">PRACTICE / NO RECORD</div><h2>TRAVAILLER UN PASSAGE</h2><div class="two-col"><label>Début (s)<input id="practiceFrom" type="number" min="0" max="${this.song.duration}" value="0" step=".1"></label><label>Fin (s)<input id="practiceTo" type="number" min="1" max="${this.song.duration}" value="${Math.min(this.song.duration, 20).toFixed(1)}" step=".1"></label></div><label>Vitesse audio<select id="practiceRate"><option value=".5">50 %</option><option value=".75">75 %</option><option value="1" selected>100 %</option><option value="1.25">125 %</option></select></label><label class="check"><input id="practiceLoop" type="checkbox" checked> Répéter le passage</label><p>La vitesse modifie aussi la hauteur du son dans cette version. Aucun record n’est enregistré.</p><div class="buttons"><button id="practiceStart" class="primary">COMMENCER</button></div>`); $('practiceStart').onclick = () => { let o = { from: +$('practiceFrom').value, to: +$('practiceTo').value, rate: +$('practiceRate').value, loop: $('practiceLoop').checked }; if (o.from < 0 || o.to > this.song.duration + .1 || o.to - o.from < 1)
            return this.toast('Choisir un passage valide d’au moins une seconde.', true); this.closeModal(); this.run(() => this.startGame('practice', o), 'Préparation de l’entraînement…'); }; }
        async startGame(mode = 'play', practice = null) { if (this.view === 'editor')
            await this.editor.autosave(); if (mode !== 'pv' && !this.chart?.notes.length)
            throw Error('Aucune partition jouable dans cette difficulté.'); await this.prepareAudio(); await this.applyScene(); this.lastMode = mode; this.mode = mode; this.practice = mode === 'practice' ? (practice || { from: 0, to: this.song.duration, rate: 1, loop: false }) : null; this.paused = false; this.finishing = false; this.clearSources(); this.bursts = []; this.lastJudgment = null; this.frozenStageRendered = false; this.gameChart = this.chart ? structuredClone(this.chart) : C.validateChart({ title: this.song.title, notes: [] }); this.engine = mode === 'pv' ? null : new C.JudgeEngine(this.gameChart, { noFail: mode !== 'play' || this.settings.noFail, judgmentProfile:this.settings.judgmentProfile||'standard' }); const from = this.practice?.from || 0; this.engine?.reset(from,this.practice?.to??Infinity); this.audio.play(this.buffer, from - 1.7, this.practice?.rate || 1); this.view = 'game'; $('app').className = 'mode-game'; document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'game')); $('gameTitle').textContent = this.song.title; $('gameDifficulty').textContent = mode === 'pv' ? 'PV VIEWER' : this.difficulty; $('gameModeLabel').textContent = mode === 'pv' ? 'PV / CLIP' : mode === 'autoplay' ? 'AUTOPLAY / RECORDS OFF' : mode === 'practice' ? 'PRACTICE / RECORDS OFF' : this.settings.noFail ? 'NO FAIL / RECORDS OFF' : 'LIVE / NORMAL'; $('gameDuration').textContent = this.formatTime(this.song.duration); $('judgment').textContent = ''; $('combo').textContent = ''; $('lyrics').textContent = ''; $('gameScore').textContent = '00000000'; $('gameAccuracy').textContent = '—'; $('lifeFill').style.width = '50%'; $('pvCapture').hidden = mode !== 'pv'; $('touchControls').hidden = !this.settings.showTouch || mode === 'pv'; $('notesCanvas').hidden = mode === 'pv'; await this.prepareVideo(); this.closeModal(); window.scrollTo(0, 0); }
        async prepareVideo() { let video = $('pvVideo'); video.pause(); video.hidden = true; if (this.videoURL) {
            URL.revokeObjectURL(this.videoURL);
            this.videoURL = null;
        } video.removeAttribute('src'); if (this.settings.useVideo && this.song.videoAsset) {
            const a = await this.store.get('assets', this.song.videoAsset);
            if (a?.blob) {
                this.videoURL = URL.createObjectURL(a.blob);
                video.src = this.videoURL;
                video.load();
                video.hidden = false;
                video.playbackRate = this.practice?.rate || 1;
            }
        } }
        async importVideo(file) { if (file.size > 120 * 1024 * 1024)
            throw Error('Vidéo limitée à 120 Mo.'); if (!/\.(mp4|webm)$/i.test(file.name))
            throw Error('Vidéo MP4 ou WebM attendue.'); const video = document.createElement('video'); video.preload = 'metadata'; const url = URL.createObjectURL(file); try {
            await new Promise((res, rej) => { const timer = setTimeout(() => rej(Error('Métadonnées vidéo non lisibles.')), 12000); video.onloadedmetadata = () => { clearTimeout(timer); res(); }; video.onerror = () => { clearTimeout(timer); rej(Error('Codec vidéo non pris en charge.')); }; video.src = url; });
        }
        finally {
            video.removeAttribute('src');
            video.load();
            URL.revokeObjectURL(url);
        } let id = C.uid(); await this.store.atomic([['assets', { id, blob: file, name: file.name, kind: 'video' }], ['songs', { ...this.song, videoAsset: id }]]); this.song.videoAsset = id; this.toast('Clip associé. Son vidéo désactivé : la musique sélectionnée reste l’horloge du jeu.'); }
        async importModel(file) { const info = await this.stage.loadGLB(await file.arrayBuffer(), file.name); let id = C.uid(); await this.store.atomic([['assets', { id, name: file.name, blob: file, kind: 'model' }], ['songs', { ...this.song, scene: { ...this.song.scene, modelAsset: id, modelClip: 0 } }]]); this.song.scene.modelAsset = id; this.song.scene.modelClip = 0; this.modelLoaded = id; this.renderWardrobe(); this.toast(`${info.name} importé : ${info.triangles} triangles, ${info.clips.length} animation(s).`); }
        async importLyrics(file) { if (file.size > 1024 * 1024)
            throw Error('Fichier LRC trop volumineux.'); let text = await file.text(), offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0) / 1000, lyrics = []; for (const line of text.split(/\r?\n/)) {
            const matches = [...line.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)], body = line.replace(/\[[^\]]*\]/g, '').trim();
            for (const m of matches)
                lyrics.push({ time: Math.max(0, Number(m[1]) * 60 + Number(m[2]) + offset), text: body.slice(0, 400) });
        } if (!lyrics.length)
            throw Error('Aucun horodatage [mm:ss.xx] trouvé.'); this.song.lyrics = lyrics.sort((a, b) => a.time - b.time); await this.saveSong(); this.toast(`${lyrics.length} lignes de paroles associées.`); }
        pause() { if (this.view !== 'game' || this.paused || this.finishing)
            return; this.paused = true; this.audio.pause(); $('pvVideo').pause(); this.clearSources(); this.engine?.clearInputs(); this.openModal(`<div class="eyebrow">LIVE PAUSED</div><h2>ON GARDE LE TEMPO.</h2><p>${esc(this.song.title)} · ${this.formatTime(this.audio.time)}</p><div class="buttons"><button id="resumeGame" class="primary">REPRENDRE</button><button id="restartGame">RECOMMENCER</button><button id="leaveGame">QUITTER</button></div>`); $('resumeGame').onclick = () => this.resume(); $('restartGame').onclick = () => { this.closeModal(); this.run(() => this.startGame(this.mode, this.practice), 'Reprise du morceau…'); }; $('leaveGame').onclick = () => { this.closeModal(); this.showView('library'); }; }
        async resume() { if (!this.paused)
            return; await this.audio.init(); this.audio.resume(); this.paused = false; this.closeModal(); }
        keyDown(e) {
            if (this.remapping !== undefined) {
                e.preventDefault();
                if (e.code !== 'Escape' && !['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code)) {
                    let i = this.remapping, j = this.settings.keys.indexOf(e.code), old = this.settings.keys[i];
                    this.settings.keys[i] = e.code;
                    if (j >= 0 && j !== i)
                        this.settings.keys[j] = old;
                    this.store.put('settings', this.settings).catch(e=>{this.renderSettings();this.toast(e.message,true);});
                }
                this.remapping = undefined;
                this.renderSettings();
                return;
            }
            if (this.calibration && (e.code === 'Space' || e.code === 'Enter')) {
                e.preventDefault();
                if (!e.repeat)
                    this.calibrationTap(e.timeStamp);
                return;
            }
            const editing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);
            if (editing && e.code !== 'Escape')
                return;
            if (e.code === 'Escape') {
                if (this.view === 'game') {
                    e.preventDefault();
                    this.paused ? this.resume() : this.pause();
                }
                return;
            }
            if ($('modal').open || this.busy)
                return;
            if (this.view === 'editor') {
                if (e.ctrlKey || e.metaKey) {
                    if (e.code === 'KeyZ') {
                        e.preventDefault();
                        e.shiftKey ? this.editor.redo() : this.editor.undo();
                        return;
                    }
                    if (e.code === 'KeyY') {
                        e.preventDefault();
                        this.editor.redo();
                        return;
                    }
                    if (e.code === 'KeyD') {
                        e.preventDefault();
                        this.editor.duplicate();
                        return;
                    }
                    if (e.code === 'KeyS') {
                        e.preventDefault();
                        this.editor.save().catch(e => this.toast(e.message, true));
                        return;
                    }
                }
                if (e.code === 'Delete' || e.code === 'Backspace') {
                    e.preventDefault();
                    this.editor.remove();
                    return;
                }
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (!e.repeat)
                        this.run(() => this.editor.togglePlay(false), 'Préparation de l’écoute…');
                    return;
                }
            }
            if (e.code === 'Space' && this.view === 'library') {
                e.preventDefault();
                if (!e.repeat)
                    this.run(() => this.startGame('play'), 'Préparation…');
                return;
            }
            let lane = this.settings.keys.indexOf(e.code);
            if (this.view === 'game' && lane < 0)
                lane = ({ ArrowUp: 0, ArrowLeft: 1, ArrowDown: 2, ArrowRight: 3 })[e.code] ?? -1;
            if (lane >= 0 && (this.view === 'game' || this.editor.recording)) {
                e.preventDefault();
                if (!e.repeat)
                    this.pressSource('key-' + e.code, lane,e.timeStamp);
            }
        }
        pressSource(source, lane) { if (this.heldSources.has(source))
            return; this.heldSources.set(source, lane); const set = this.laneSources[lane], first = set.size === 0; set.add(source); $('touchControls').querySelector(`[data-lane="${lane}"]`)?.classList.add('pressed'); if (!first)
            return; if (this.view === 'editor' && this.editor.recording) {
            this.editor.recordPress(lane, this.audio.time);
            return;
        } if (this.view === 'game' && !this.paused && this.mode !== 'autoplay' && this.mode !== 'pv') {
            this.engine?.press(lane, this.audio.time - this.settings.inputOffset / 1000);
            this.audio.sfx(lane);
        } }
        releaseSource(source) { const lane = this.heldSources.get(source); if (lane === undefined)
            return; this.heldSources.delete(source); this.laneSources[lane].delete(source); if (this.laneSources[lane].size)
            return; $('touchControls').querySelector(`[data-lane="${lane}"]`)?.classList.remove('pressed'); this.engine?.release(lane); if (this.editor.recording)
            this.editor.recordRelease(lane, this.audio.time); }
        clearSources() { for (const key of [...this.heldSources.keys()])
            this.releaseSource(key); this.padPrevious.clear(); }
        gamepads() {
            if (!navigator.getGamepads)
                return;
            const pad = [...navigator.getGamepads()].find(Boolean);
            if (!pad) {
                $('gamepadStatus').textContent = 'Aucune manette détectée';for(const key of [...this.heldSources.keys()])if(key.startsWith('pad-'))this.releaseSource(key);this.padPrevious.clear();
                return;
            }
            $('gamepadStatus').textContent = pad.id.slice(0, 55);
            const active = new Set();
            if ((this.view === 'game' && !this.paused) || (this.view === 'editor' && this.editor.recording)) {
                for (const [button, lane] of [[3, 0], [2, 1], [0, 2], [1, 3], [12, 0], [14, 1], [13, 2], [15, 3], [4, 4], [5, 5]])
                    if (pad.buttons[button]?.pressed) {
                        let key = `pad-${button}`;
                        active.add(key);
                        if (!this.padPrevious.has(key))
                            this.pressSource(key, lane);
                    }
                for (const [dir, lane] of [[-1, 4], [1, 5]])
                    if ((pad.axes[0] || 0) * dir > .6 || (pad.axes[2] || 0) * dir > .6) {
                        let key = `pad-axis-${dir}`;
                        active.add(key);
                        if (!this.padPrevious.has(key))
                            this.pressSource(key, lane);
                    }
            }
            if (pad.buttons[9]?.pressed && !this.padPause) {
                if (this.view === 'game')
                    this.paused ? this.resume() : this.pause();
            }
            this.padPause = !!pad.buttons[9]?.pressed;
            for (const key of this.padPrevious)
                if (!active.has(key))
                    this.releaseSource(key);
            this.padPrevious = active;
        }
        frame(ts) {
            try {
                this.gamepads();
                const isGame = this.view === 'game', time = isGame ? this.audio.time : this.view === 'editor' ? this.editor.cursor : (ts - this.boot) / 1000, activeChart=isGame?this.gameChart:this.chart,bpm=activeChart?C.tempoAt(activeChart,time-activeChart.offset):this.song?.bpm||120;
                if (this.stage.available && (!isGame || this.mode === 'pv' || this.settings.graphicsQuality > 0 || !this.frozenStageRendered) && ['library', 'wardrobe', 'game', 'results'].includes(this.view) && ts - this.lastStageFrame > (isGame ? 15 : 30)) {
                    this.stage.render(time, bpm, { menu: this.view === 'library' || this.view === 'wardrobe', preview: this.view === 'wardrobe', pv: this.mode === 'pv', energy: isGame ? .5 : .2,beat:activeChart?C.timeToBeat(activeChart,time-activeChart.offset):time*bpm/60 });
                    this.lastStageFrame = ts;
                    this.frozenStageRendered = isGame;
                }
                if (isGame && !this.finishing) {
                    if (!this.paused) {
                        const eTime = time - this.settings.inputOffset / 1000 * this.audio.rate;
                        if(this.mode==='replay')this.advanceReplay(time);else this.engine?.update(this.mode === 'autoplay' ? time : eTime, this.mode === 'autoplay');
                        if (this.engine?.events.length) {
                            for (const event of this.engine.events.splice(0)) {
                                this.bursts.push({ ...event, when: ts });
                                this.lastJudgment = { ...event, when: ts };
                                if (this.mode === 'autoplay' && event.rating !== 'MISS')
                                    this.audio.sfx(event.note?.lane || 0);
                            }
                        }
                        if (this.practice && time >= this.practice.to) {
                            if (this.practice.loop) {
                                if(this.restartPracticeLoop)this.restartPracticeLoop();
                                else {this.clearSources();this.engine?.reset(this.practice.from,this.practice.to);this.audio.play(this.buffer,this.practice.from-1,this.practice.rate);this.bursts=[];}
                            }
                            else
                                this.finish();
                        }
                        else if (time >= this.buffer.duration + .15 || this.engine?.failed)
                            this.finish();
                        this.syncVideo(time, ts);
                    }
                    this.drawGame(time, ts);
                }
                if (this.view === 'editor')
                    this.editor.update();
                if (this.calibration)
                    this.updateCalibration();
            }
            catch (e) {
                console.error('[frame]', e);
                if (!this.frameError) {
                    this.frameError = true;
                    this.toast('Erreur de rendu : ' + e.message, true, 14000);
                    if (this.view === 'game')
                        this.pause();
                }
            }
            this.lastFrame = ts;
            requestAnimationFrame(t => this.frame(t));
        }
        syncVideo(time, ts) { const v = $('pvVideo'); if (v.hidden)
            return; if (time < 0) {
            v.pause();
            return;
        } if (Number.isFinite(v.duration) && time >= v.duration - .03) {
            v.pause();
            if (v.currentTime < v.duration - .05)
                v.currentTime = Math.max(0, v.duration - .01);
            return;
        } if (v.readyState >= 2 && v.paused && !this.videoPlayPending) {
            this.videoPlayPending = true;
            v.play().catch(() => { this.toast('Lecture du clip bloquée par le navigateur ; la partie continue en 3D.', true); v.hidden = true; }).finally(() => this.videoPlayPending = false);
        } if (ts - (this.lastVideoSync || 0) > 600 && v.readyState >= 2) {
            const target = C.clamp(time + (this.song.videoOffset || 0), 0, Math.max(0, v.duration - .01));
            if (Math.abs(v.currentTime - target) > .11)
                v.currentTime = target;
            this.lastVideoSync = ts;
        } }
        rect(w, h) { let width = Math.min(w - 30, (h - 130) * 16 / 9), height = width * 9 / 16; return { x: (w - width) / 2, y: (h - height) / 2, width, height }; }
        drawGlyph(ctx, lane, x, y, r, fill, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.lineWidth = Math.max(2, r * .105); ctx.strokeStyle = fill; ctx.fillStyle = '#0b1422cc'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = fill; ctx.lineWidth = Math.max(2.4, r * .12); const s = r * .47; ctx.beginPath(); if (lane === 0) {
            ctx.moveTo(0, -s);
            ctx.lineTo(s, s * .8);
            ctx.lineTo(-s, s * .8);
            ctx.closePath();
        }
        else if (lane === 1) {
            ctx.rect(-s, -s, s * 2, s * 2);
        }
        else if (lane === 2) {
            ctx.moveTo(-s, -s);
            ctx.lineTo(s, s);
            ctx.moveTo(s, -s);
            ctx.lineTo(-s, s);
        }
        else if (lane === 3) {
            ctx.arc(0, 0, s, 0, Math.PI * 2);
        }
        else {
            let d = lane === 4 ? -1 : 1;
            ctx.moveTo(-d * s * .55, -s);
            ctx.lineTo(d * s * .55, 0);
            ctx.lineTo(-d * s * .55, s);
        } ctx.stroke(); ctx.restore(); }
        drawGame(time, ts) {
            const c = $('notesCanvas'), w = c.clientWidth, h = c.clientHeight, ratio = Math.min(devicePixelRatio || 1, 2);
            if (c.width !== Math.round(w * ratio) || c.height !== Math.round(h * ratio)) {
                c.width = Math.round(w * ratio);
                c.height = Math.round(h * ratio);
            }
            const ctx = c.getContext('2d');
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const rect = this.rect(w, h), rad = C.clamp(rect.width * .023, 16, 28) * (this.settings.noteScale||1), visual = time - this.settings.visualOffset / 1000, notes = this.engine?.notes || [];
            let visible = [];
            for (const n of (C.visibleNotes ? C.visibleNotes(notes, visual, this.gameChart?.offset||0, this.settings.approachSpeed) : notes)) {
                let hitTime = n.time + this.gameChart.offset, approach = n.approach / this.settings.approachSpeed;
                if (n.state !== 'pending' || visual < hitTime - approach || visual > hitTime + .15)
                    continue;
                const p = C.clamp(1 - (hitTime - visual) / approach, 0, 1.1), x = rect.x + n.x * rect.width, y = rect.y + n.y * rect.height;
                visible.push({ n, x, y, p });
            }
            ctx.strokeStyle = '#e3d2aa66';
            ctx.lineWidth = 1;
            for (let i = 1; i < visible.length; i++) {
                let a = visible[i - 1], b = visible[i];
                if (a.n.time === b.n.time) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
            for (const { n, x, y, p } of visible) {
                const col = colors[n.lane];
                this.drawGlyph(ctx, n.lane, x, y, rad, col, .5);
                ctx.strokeStyle = col;
                ctx.lineWidth = 2;
                ctx.globalAlpha = .7;
                ctx.beginPath();
                ctx.arc(x, y, rad + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * C.clamp(p, 0, 1));
                ctx.stroke();
                ctx.globalAlpha = 1;
                const angle = (n.angle ?? ((n.lane * 57 + n.time * 19) % 360 - 180)) * Math.PI / 180, distance = (n.distance ?? .65) * rect.width * Math.max(0, 1 - p), nx = x + Math.sin(angle) * distance, ny = y - Math.cos(angle) * distance;
                if (p > 0 && p < 1) {
                    ctx.strokeStyle = col + '44';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(nx, ny);
                    ctx.stroke();
                    this.drawGlyph(ctx, n.lane, nx, ny, rad, col, C.clamp(p * 3, .15, 1));
                }
                if (n.type === 'hold' || n.type === 'chain') {
                    ctx.fillStyle = '#ffe6a6';
                    ctx.font = 'bold 8px system-ui';
                    ctx.textAlign = 'center';
                    ctx.fillText(n.type === 'hold' ? 'HOLD' : 'CHAIN', x, y + rad + 18);
                }
            }
            this.bursts = this.settings.reducedEffects ? [] : this.bursts.filter(b => ts - b.when < 430);
            for (const b of this.bursts) {
                if (!b.note || b.rating === 'MISS')
                    continue;
                const p = (ts - b.when) / 430, x = rect.x + b.note.x * rect.width, y = rect.y + b.note.y * rect.height;
                ctx.strokeStyle = colors[b.note.lane];
                ctx.globalAlpha = 1 - p;
                ctx.lineWidth = 3 * (1 - p);
                ctx.beginPath();
                ctx.arc(x, y, Math.max(0, rad + p * 42), 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
            const e = this.engine;
            if (e) {
                $('gameScore').textContent = String(e.score + e.holdBonus).padStart(8, '0');
                $('lifeFill').style.width = (e.life / 255 * 100) + '%';
                $('lifeFill').style.background = e.life < 60 ? '#ff8ca4' : '#70f0dc';
                $('gameAccuracy').textContent = e.processed ? (e.score / (e.processed * 1000) * 100).toFixed(2) + '%' : '—';
                $('combo').innerHTML = e.combo > 1 ? `${e.combo}<small>COMBO</small>` : '';
            }
            else
                $('combo').textContent = '';
            if (this.lastJudgment && ts - this.lastJudgment.when < 520) {
                $('judgment').textContent = this.lastJudgment.rating + (this.settings.earlyLate&&['COOL','FINE','SAFE','SAD'].includes(this.lastJudgment.rating)&&Math.abs(this.lastJudgment.error)>.005?(this.lastJudgment.error<0?' · AVANCE':' · RETARD'):'');
                $('judgment').style.color = ['COOL', 'FINE'].includes(this.lastJudgment.rating) ? '#91ffed' : '#ffa1b8';
                $('judgment').style.opacity = 1 - (ts - this.lastJudgment.when) / 700;
            }
            else
                $('judgment').textContent = '';
            const from = this.practice?.from || 0;
            $('countdown').textContent = time < from ? String(Math.ceil(from - time)) : time < from + .30 ? 'GO!' : '';
            $('gameClock').textContent = this.formatTime(time);
            $('gameProgress').style.width = (Math.max(0, time) / (this.song.duration || 1) * 100) + '%';
            const line = (this.song.lyrics || []).findLast(l => l.time <= time);
            $('lyrics').textContent = line?.text || '';
        }
        scoreKey(chart) { const p=this.view==='game'?(this.engine?.profile||'standard'):(this.settings.judgmentProfile||'standard');return `${this.song.id}/${chart.id}/${C.chartSignature(chart)}/rules4${p==='standard'?'':'/profile-'+p}`; }
        async finish() {
            if (this.finishing)
                return;
            this.finishing = true;
            this.audio.pause();
            $('pvVideo').pause();
            $('pvVideo').hidden = true;
            this.clearSources();
            if (this.mode === 'pv') {
                await this.showView('library');
                this.finishing = false;
                return;
            }
            const r = this.engine.finish();
            this.lastResult = r;
            const eligible = this.mode === 'play' && !this.settings.noFail;
            let newRecord = false;
            if (eligible && r.cleared) {
                const id = this.scoreKey(this.gameChart), previous = this.scores.find(s => s.id === id);
                if (!previous || r.score > previous.score) {
                    const record = { id, rulesVersion:4, judgmentProfile:this.engine.profile, songId: this.song.id, chartId: this.gameChart.id, ...r, errors: undefined, date: new Date().toISOString() };
                    try {
                        await this.store.put('scores', record);
                        this.scores = this.scores.filter(x => x.id !== id);
                        this.scores.push(record);
                        newRecord = true;
                    }
                    catch (e) {
                        this.toast('La partie est terminée, mais le record n’a pas pu être sauvegardé.', true);
                    }
                }
            }
            this.view = 'results';
            $('app').className = 'mode-results';
            document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'results'));
            $('resultMode').textContent = eligible ? 'LIVE RESULT' : this.mode === 'autoplay' ? 'AUTOPLAY · AUCUN RECORD' : this.mode === 'practice' ? 'ENTRAÎNEMENT · AUCUN RECORD' : 'NO FAIL · AUCUN RECORD';
            $('resultTitle').textContent = r.fullCombo ? 'FULL COMBO' : r.failed ? 'LIVE FAILED' : r.cleared ? 'LIVE CLEAR' : 'LIVE FINISHED';
            $('resultSong').textContent = `${this.song.title} · ${this.gameChart.difficulty}`;
            $('resultRank').textContent = r.rank;
            $('resultAccuracy').textContent = r.accuracy.toFixed(2) + '%';
            $('resultCombo').textContent = `${r.score.toLocaleString('fr-FR')} points · combo maximal ${r.maxCombo} · bonus HOLD ${r.holdBonus}`;
            $('newRecord').textContent = newRecord ? 'NOUVEAU RECORD LOCAL' : eligible ? 'RÉSULTAT LOCAL' : 'SESSION NON CLASSÉE';
            $('resultCounts').innerHTML = Object.entries(r.counts).map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('');
            $('timingSummary').textContent = `Décalage moyen : ${r.meanError > 0 ? '+' : ''}${r.meanError.toFixed(1)} ms. Négatif = en avance ; positif = en retard. Barème DIVA PULSE, non identique à SEGA.`;
            this.drawTiming(r.errors);
            window.scrollTo(0, 0);
        }
        drawTiming(errors) { const cv = $('timingGraph'), ctx = cv.getContext('2d'); cv.width = 640; cv.height = 90; ctx.fillStyle = '#0b1627'; ctx.fillRect(0, 0, 640, 90); ctx.fillStyle = '#284b50'; ctx.fillRect(244, 0, 152, 90); ctx.strokeStyle = '#77ffe2'; ctx.beginPath(); ctx.moveTo(320, 0); ctx.lineTo(320, 90); ctx.stroke(); ctx.fillStyle = '#85eedd'; errors.slice(-500).forEach((e, i) => ctx.fillRect(320 + e / 140 * 290 - 1, 12 + (i % 8) * 7, 3, 3)); ctx.fillStyle = '#a6b8d1'; ctx.font = '10px monospace'; ctx.fillText('-140 ms', 8, 82); ctx.fillText('0', 317, 82); ctx.fillText('+140 ms', 581, 82); }
        capture() { if (!this.stage.available)
            return this.toast('Scène 3D indisponible.', true); const data = this.stage.screenshot(), a = document.createElement('a'); a.href = data; a.download = `DIVA_PULSE_${this.song.id}_${Date.now()}.png`; a.click(); this.toast('Capture de la scène 3D créée (sans la vidéo externe).'); }
        async startCalibration() { await this.audio.init(); this.openModal(`<div class="eyebrow">LATENCY CALIBRATION</div><h2>TAPE SUR LE CLIC.</h2><p>Écoute quelques clics, puis appuie sur Espace ou le bouton en rythme. Utilise la même sortie audio que pour jouer.</p><div id="calibrationPulse"></div><p id="calibrationInfo">Écoute les deux premiers battements.</p><div class="buttons"><button id="calTap" class="secondary">TAPER</button><button id="calSave" class="primary" disabled>APPLIQUER</button></div>`); const ctx = this.audio.ctx, start = ctx.currentTime + .6, oscillators = []; for (let i = 0; i < 40; i++) {
            const o = ctx.createOscillator(), g = ctx.createGain(), at = start + i * .5;
            o.frequency.value = i % 4 === 0 ? 1100 : 800;
            g.gain.setValueAtTime(0, ctx.currentTime);
            g.gain.setValueAtTime(.18, at);
            g.gain.exponentialRampToValueAtTime(.0001, at + .06);
            o.connect(g);
            g.connect(ctx.destination);
            o.start(at);
            o.stop(at + .07);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            oscillators.push(o);
        } this.calibration = { start, oscillators, taps: [], indices: new Set() }; $('calTap').onclick = e => this.calibrationTap(e.timeStamp); $('calSave').onclick = () => this.run(async () => { const taps = [...this.calibration.taps].sort((a, b) => a - b); this.settings.inputOffset = Math.round(taps[Math.floor(taps.length / 2)]); await this.store.put('settings', this.settings); this.closeModal(); this.renderSettings(); this.toast(`Compensation de saisie : ${this.settings.inputOffset} ms.`); }, 'Enregistrement de la calibration…'); }
        calibrationTap(stamp) { const c = this.calibration; if (!c)
            return; const dt = (this.audio.contextAt?this.audio.contextAt(stamp):this.audio.ctx.currentTime) - c.start, index = Math.round(dt / .5); if (index < 2 || index > 39 || c.indices.has(index))
            return; const delta = (dt - index * .5) * 1000; c.indices.add(index); c.taps.push(delta); this.updateCalibration(); }
        updateCalibration() { const c = this.calibration; if (!c || !$('calibrationPulse'))
            return; let t = (this.audio.contextAt?this.audio.contextAt():this.audio.ctx.currentTime) - c.start, phase = ((t % .5) + .5) % .5; $('calibrationPulse').style.opacity = t >= 0 && phase < .12 ? '1' : '.15'; $('calibrationPulse').style.transform = `scale(${t >= 0 && phase < .10 ? 1.08 : 1})`; const taps = [...c.taps].sort((a, b) => a - b), median = taps.length ? taps[Math.floor(taps.length / 2)] : 0; $('calibrationInfo').textContent = `${taps.length} frappes · décalage médian ${median > 0 ? '+' : ''}${median.toFixed(0)} ms${t > 19.5 ? ' · série terminée' : ''}`; $('calSave').disabled = taps.length < 8; }
        async exportBackup() { for (const s of this.songs)
            await this.store.put('songs', s); const assets = await this.store.all('assets'); let total = assets.reduce((sum, a) => sum + (a.blob?.size || 0), 0); if (total > 180 * 1024 * 1024)
            throw Error('Sauvegarde supérieure à 180 Mo. Exporter séparément les partitions ; conserver les médias d’origine.'); const data = { format: 'DIVA-PULSE-LIBRARY', version: 2, created: new Date().toISOString(), songs: this.songs, settings: this.settings, scores: this.scores, assets: [] }; for (const a of assets)
            data.assets.push({ id: a.id, name: a.name, kind: a.kind, type: a.blob.type, data: await S.blobToBase64(a.blob) }); S.download(JSON.stringify(data), 'DIVA_PULSE_BIBLIOTHEQUE.pulsepack'); this.toast('Sauvegarde complète créée : partitions, médias, scènes et records.'); }
        async restoreBackup(file) { if (file.size > 250 * 1024 * 1024)
            throw Error('Sauvegarde trop volumineuse (250 Mo maximum).'); let data; try {
            data = JSON.parse(await file.text());
        }
        catch (e) {
            throw Error('Sauvegarde JSON illisible.');
        } if (data.format !== 'DIVA-PULSE-LIBRARY' || data.version !== 2 || !Array.isArray(data.songs) || !Array.isArray(data.assets))
            throw Error('Sauvegarde DIVA PULSE V2 attendue.'); if (data.songs.length > 200 || data.assets.length > 1000)
            throw Error('Sauvegarde trop volumineuse.'); const rename = new Map(), assets = data.assets.map(a => { const id = C.uid(); rename.set(a.id, id); return { id, name: String(a.name || 'Ressource').slice(0, 180), kind: String(a.kind || 'asset'), blob: S.base64ToBlob(a.data, a.type) }; }); const incoming = data.songs.map(s => { if (!s || typeof s.title !== 'string' || !Array.isArray(s.charts))
            throw Error('Morceau invalide dans la sauvegarde.'); let scene = cleanScene(s.scene); scene.modelAsset = rename.get(scene.modelAsset) || null; if(scene.mmd?.assetIds){ scene.mmd={...scene.mmd,assetIds:scene.mmd.assetIds.map(id=>rename.get(id)).filter(Boolean),files:(scene.mmd.files||[]).map(f=>({...f,id:rename.get(f.id)||f.id}))}; if(scene.mmdDirector?.slots)scene.mmdDirector={...scene.mmdDirector,slots:scene.mmdDirector.slots.map(x=>({...x,modelAssetId:rename.get(x.modelAssetId)||null,motionAssetId:rename.get(x.motionAssetId)||null,clips:(x.clips||[]).map(c=>({...c,motionAssetId:rename.get(c.motionAssetId)||null}))}))}; } return { ...s, id: C.uid(), builtin: !!s.builtin, demoId: s.demoId, title: s.title.slice(0, 180) + ' · restauré', audioAsset: rename.get(s.audioAsset) || null, videoAsset: rename.get(s.videoAsset) || null, scene, charts: s.charts.slice(0, 50).map(c => C.validateChart(c)), duration: C.clamp(C.finite(s.duration, 60), 1, 7200) }; }); if (incoming.some(s => s.builtin && !C.DEMOS.some(d => d.id === s.demoId)))
            throw Error('Référence de démo inconnue.'); await this.store.atomic([...assets.map(a => ['assets', a]), ...incoming.map(s => ['songs', s])]); this.songs.push(...incoming); this.renderLibrary(); this.toast(`${incoming.length} morceau(x) restauré(s) en copies. Aucun élément existant écrasé. Les anciens records/réglages sont inclus dans le fichier mais ne remplacent pas ceux du navigateur.`, false, 12000); }
        help() { this.openModal(`<div class="eyebrow">HOW TO PLAY</div><h2>ATTRAPE LE BON INSTANT.</h2><p>Les symboles se déplacent vers leurs cibles. Appuie lorsque les deux coïncident : <b>D = △, F = □, J = ×, K = ○</b>. Les slides utilisent <b>S = ‹ et L = ›</b>. Une ligne relie les notes à frapper simultanément.</p><p><b>HOLD :</b> garde la touche appuyée pour un bonus, jusqu’à cinq secondes. Relâcher termine le bonus ; ce n’est pas une note longue de Project DIVA F.</p><p><b>Partition existante :</b> importe ton audio, puis son DSC FT/MM+ compatible ou JSON. L’import ne régénère pas les notes. Une autre version audio peut nécessiter un décalage dans le studio.</p><p><b>Sans partition :</b> « Générer » analyse le fichier local. Contrôle le tempo et corrige le résultat dans le studio. Aucune recherche automatique de niveau officiel sur Internet.</p><p><b>Studio :</b> clic sur une ligne = note ; glisser = déplacer ; clic sur la waveform = tête de lecture. Ctrl+Z/Y : annuler/rétablir ; Ctrl+D : dupliquer ; Suppr : enlever ; Espace : écouter. Les plans PV sont associés au morceau.</p><p>Échap met en pause. Le mode PV joue sans notes. Les records sont uniquement locaux et réservés au mode normal. Utilise « Sauvegarder la bibliothèque » pour préserver tes fichiers.</p><div class="buttons"><button id="helpClose" class="primary">C’EST PARTI</button></div>`); $('helpClose').onclick = () => this.closeModal(); }
    }
    root.PulseAppClass=App;
    const app = new App();
    app.cleanSceneV3=cleanScene;
    if(root.PulseV3)root.PulseV3(app);
    if(root.PulseV4)root.PulseV4(app);
    if(root.PulseV5)root.PulseV5(app);
    if(root.PulseAcademy)root.PulseAcademy(app);
    if(root.PulseV6)root.PulseV6(app);

    if(root.PulseV19)root.PulseV19(app);
    if(root.PulseAutoShowApp)root.PulseAutoShowApp(app);
    if(root.PulseMMDImportApp)root.PulseMMDImportApp(app);
    if(root.PulseMotionSyncApp)root.PulseMotionSyncApp(app);
    root.PulseQuality.install(app);
    root.PulseReliability.install(app);
    root.PulseV25.install(app);
    root.PulseV26.install(app);
    root.PulseV27.install(app);
    app.init().catch(e => { console.error(e); document.body.innerHTML = `<div style="padding:40px;font-family:system-ui;color:#eef;background:#102;min-height:100vh"><h1>DIVA PULSE</h1><h2>Le démarrage n’a pas abouti.</h2><p>${esc(e.message)}</p><p>Utiliser le lanceur local fourni, puis un navigateur récent. Les données existantes ne sont pas supprimées.</p></div>`; });
})(globalThis);
