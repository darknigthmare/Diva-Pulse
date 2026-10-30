/* Dependency-free WebGL2 stage, hierarchical character rigs, embedded GLB 2 loader. */
(function (root) {
    'use strict';
    const C = root.PulseCore;
    root.PulseSkinning ||= typeof require==='function'?require('./skinning.js'):null;
    root.PulseSkeleton ||= typeof require==='function'?require('./skeleton.js'):null;
    const I = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    function mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++)
        for (let r = 0; r < 4; r++)
            o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; }
    function trs(p = [0, 0, 0], q = [0, 0, 0, 1], s = [1, 1, 1]) { let [x, y, z, w] = q, x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2; return new Float32Array([(1 - yy - zz) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0, (xy - wz) * s[1], (1 - xx - zz) * s[1], (yz + wx) * s[1], 0, (xz + wy) * s[2], (yz - wx) * s[2], (1 - xx - yy) * s[2], 0, ...p, 1]); }
    function quatEuler(x = 0, y = 0, z = 0) { let c1 = Math.cos(x / 2), c2 = Math.cos(y / 2), c3 = Math.cos(z / 2), s1 = Math.sin(x / 2), s2 = Math.sin(y / 2), s3 = Math.sin(z / 2); return [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 + s1 * s2 * c3, c1 * c2 * c3 - s1 * s2 * s3]; }
    function inv(a) { const rows = Array.from({ length: 4 }, (_, r) => [a[r], a[4 + r], a[8 + r], a[12 + r], ...Array.from({ length: 4 }, (_, c) => c === r ? 1 : 0)]); for (let c = 0; c < 4; c++) {
        let pivot = c;
        for (let r = c + 1; r < 4; r++)
            if (Math.abs(rows[r][c]) > Math.abs(rows[pivot][c]))
                pivot = r;
        [rows[c], rows[pivot]] = [rows[pivot], rows[c]];
        let d = rows[c][c];
        if (Math.abs(d) < 1e-10)
            return I();
        for (let j = 0; j < 8; j++)
            rows[c][j] /= d;
        for (let r = 0; r < 4; r++)
            if (r !== c) {
                let v = rows[r][c];
                for (let j = 0; j < 8; j++)
                    rows[r][j] -= v * rows[c][j];
            }
    } const out = I(); for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
            out[c * 4 + r] = rows[r][4 + c]; return out; }
    const vsub = (a, b) => a.map((v, i) => v - b[i]), dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = a => { let l = Math.hypot(...a) || 1; return a.map(v => v / l); };
    function lookAt(eye, target) { let z = norm(vsub(eye, target)), x = norm(cross([0, 1, 0], z)), y = cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]); }
    function perspective(fov, aspect, near = .1, far = 150) { let f = 1 / Math.tan(fov / 2); return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]); }
    function point(m, v) { return [m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12], m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13], m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]]; }
    function slerp(a, b, t) { let d = dot(a, b); if (d < 0) {
        b = b.map(v => -v);
        d = -d;
    } if (d > .9995)
        return norm(a.map((v, i) => v + (b[i] - v) * t)); let angle = Math.acos(Math.min(1, d)), s = Math.sin(angle); return a.map((v, i) => (Math.sin((1 - t) * angle) * v + Math.sin(t * angle) * b[i]) / s); }
    const rgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
    function qfrom(a,b,maxAngle=Math.PI){a=norm(a);b=norm(b);let d=Math.max(-1,Math.min(1,dot(a,b)));if(d>.99999)return[0,0,0,1];let axis=cross(a,b),l=Math.hypot(...axis);if(l<1e-6)axis=Math.abs(a[0])<.8?norm(cross(a,[1,0,0])):norm(cross(a,[0,1,0]));else axis=axis.map(x=>x/l);let ang=Math.min(Math.acos(d),maxAngle),s=Math.sin(ang/2);return[axis[0]*s,axis[1]*s,axis[2]*s,Math.cos(ang/2)]}
    function node(name = '', p = [0, 0, 0], s = [1, 1, 1]) { return { name, p: [...p], q: [0, 0, 0, 1], s: [...s], children: [], world: I() }; }
    function add(parent, child) { parent.children.push(child); child.parent = parent; return child; }
    function world(n, parent = I()) { n.world = mul(parent, n.matrix || trs(n.p, n.q, n.s)); for (const ch of n.children)
        world(ch, n.world); }
    function geometry(kind) {
        let p = [], n = [], uv = [], idx = [];
        function vert(x, y, z, nx, ny, nz, u = 0, v = 0) { p.push(x, y, z); n.push(nx, ny, nz); uv.push(u, v); }
        if (kind === 'box') {
            const faces = [[[1, 0, 0], [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]]], [[-1, 0, 0], [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]]], [[0, 1, 0], [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]]], [[0, -1, 0], [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]]], [[0, 0, 1], [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]]], [[0, 0, -1], [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]]]];
            for (const [normal, vs] of faces) {
                let a = p.length / 3;
                vs.forEach((v, i) => vert(...v, ...normal, i % 2, i > 1 ? 1 : 0));
                idx.push(a, a + 1, a + 2, a, a + 2, a + 3);
            }
        }
        else if (kind === 'sphere') {
            let rings = 18, segments = 24;
            for (let y = 0; y <= rings; y++) {
                let a = y / rings * Math.PI;
                for (let x = 0; x <= segments; x++) {
                    let b = x / segments * Math.PI * 2, nx = Math.sin(a) * Math.cos(b), ny = Math.cos(a), nz = Math.sin(a) * Math.sin(b);
                    vert(nx * .5, ny * .5, nz * .5, nx, ny, nz, x / segments, y / rings);
                }
            }
            for (let y = 0; y < rings; y++)
                for (let x = 0; x < segments; x++) {
                    let a = y * (segments + 1) + x, b = a + segments + 1;
                    idx.push(a, b, a + 1, b, b + 1, a + 1);
                }
        }
        else if (kind === 'ring') {
            let seg = 80, tube = 8;
            for (let i = 0; i <= seg; i++) {
                let a = i / seg * 2 * Math.PI;
                for (let j = 0; j <= tube; j++) {
                    let b = j / tube * 2 * Math.PI, r = 1 + Math.cos(b) * .025;
                    vert(Math.cos(a) * r, Math.sin(b) * .025, Math.sin(a) * r, Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b), i / seg, j / tube);
                }
            }
            for (let i = 0; i < seg; i++)
                for (let j = 0; j < tube; j++) {
                    let a = i * (tube + 1) + j, b = a + tube + 1;
                    idx.push(a, b, a + 1, b, b + 1, a + 1);
                }
        }
        else {
            const seg = 24, top = kind === 'cone' ? .06 : .5;
            for (let i = 0; i <= seg; i++) {
                let a = i / seg * 2 * Math.PI;
                for (let y = 0; y < 2; y++) {
                    let radius = y ? top : .5, normal = norm([Math.cos(a), .5 - top, Math.sin(a)]);
                    vert(Math.cos(a) * radius, y - .5, Math.sin(a) * radius, ...normal, i / seg, y);
                }
            }
            for (let i = 0; i < seg; i++) {
                let a = i * 2;
                idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
            }
            for (let y = 0; y < 2; y++) {
                let c = p.length / 3;
                vert(0, y - .5, 0, 0, y ? 1 : -1, 0);
                for (let i = 0; i <= seg; i++) {
                    let a = i / seg * 2 * Math.PI, r = y ? top : .5;
                    vert(Math.cos(a) * r, y - .5, Math.sin(a) * r, 0, y ? 1 : -1, 0);
                }
                for (let i = 0; i < seg; i++)
                    idx.push(c, c + 1 + i + (y ? 1 : 0), c + 1 + i + (y ? 0 : 1));
            }
        }
        return { positions: new Float32Array(p), normals: new Float32Array(n), uv: new Float32Array(uv), indices: new Uint32Array(idx) };
    }
    const AVATARS = [{ id: 'miku', name: 'MIKU', full: 'Hatsune Miku', hair: '#42dbcd', accent: '#29e5d1', style: 'twintails', outfit: 'skirt', skin: '#ffe5d4' }, { id: 'rin', name: 'RIN', full: 'Kagamine Rin', hair: '#ffd76b', accent: '#ffbc40', style: 'bow', outfit: 'shorts', skin: '#ffe7d7' }, { id: 'len', name: 'LEN', full: 'Kagamine Len', hair: '#ffe079', accent: '#ffce50', style: 'spikes', outfit: 'shorts', skin: '#ffe4ce' }, { id: 'luka', name: 'LUKA', full: 'Megurine Luka', hair: '#f2a6cf', accent: '#ed92ca', style: 'long', outfit: 'dress', skin: '#ffe5db' }, { id: 'kaito', name: 'KAITO', full: 'KAITO', hair: '#508ee5', accent: '#51a5ff', style: 'short', outfit: 'coat', skin: '#ffe6d2' }, { id: 'meiko', name: 'MEIKO', full: 'MEIKO', hair: '#874d46', accent: '#f36f80', style: 'bob', outfit: 'skirt', skin: '#ffe1c9' }];
    const STAGES = [{ id: 'arena', name: 'NEON ARENA', sub: 'Scène de concert', a: '#57efe6', b: '#bb7eff' }, { id: 'rooftop', name: 'MIDNIGHT CITY', sub: 'Toits de la ville', a: '#82bdff', b: '#ff84c1' }, { id: 'sakura', name: 'SAKURA GARDEN', sub: 'Jardin suspendu', a: '#ffa8d5', b: '#86edda' }, { id: 'orbital', name: 'GLASS ORBIT', sub: 'Observatoire orbital', a: '#bc9aff', b: '#68d9ff' }];
    const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec3 position; layout(location=1) in vec3 normal; layout(location=2) in vec2 uv; layout(location=3) in vec4 joints; layout(location=4) in vec4 weights;
uniform mat4 uMVP,uModel; uniform bool uSkinned; uniform sampler2D uBones;
layout(location=5) in float skinType; layout(location=6) in vec3 sdefC; layout(location=7) in vec3 sdefR0; layout(location=8) in vec3 sdefR1;
out vec3 vNormal; out vec3 vWorld; out vec2 vUV;
mat4 bone(int j){return mat4(texelFetch(uBones,ivec2(0,j),0),texelFetch(uBones,ivec2(1,j),0),texelFetch(uBones,ivec2(2,j),0),texelFetch(uBones,ivec2(3,j),0));}
${root.PulseSkinning.glsl}
void main(){vec3 p=position,n=normal;if(uSkinned)advancedSkin(p,n);gl_Position=uMVP*vec4(p,1.0);vWorld=(uModel*vec4(p,1.0)).xyz;vNormal=normalize(mat3(transpose(inverse(uModel)))*n);vUV=uv;}`;
    const FRAG = `#version 300 es
precision highp float;
in vec3 vNormal,vWorld; in vec2 vUV; uniform vec4 uColor,uTexMul,uTexAdd,uSphereMul,uSphereAdd; uniform vec3 uEye,uAccent; uniform float uGlow,uLightIntensity; uniform vec3 uLightColor; uniform mat4 uView; uniform bool uTexture,uSphere; uniform int uSphereMode; uniform sampler2D uMap,uSphereMap; out vec4 frag;
vec3 tint(vec3 c,vec4 m,vec4 a){vec3 q=mix(vec3(1.0),c*m.rgb,m.a);return clamp(q+(q-vec3(1.0))*a.a,0.0,1.0)+a.rgb;}
void main(){vec4 base=uColor;if(uTexture){vec4 tex=texture(uMap,vUV);base*=vec4(tint(tex.rgb,uTexMul,uTexAdd),tex.a);}if(base.a<.02)discard;vec3 n=normalize(vNormal);float light=max(dot(n,normalize(vec3(-.5,1.0,1.0))),0.0);light=.35+floor(light*4.0)/4.0*.65;float rim=pow(1.0-abs(dot(n,normalize(uEye-vWorld))),3.0);vec3 color=base.rgb*light*uLightColor*uLightIntensity+uAccent*rim*.20+base.rgb*uGlow;if(uSphere){vec3 viewNormal=normalize(mat3(uView)*n);vec2 suv=viewNormal.xy*.5+.5;vec3 sp=tint(texture(uSphereMap,suv).rgb,uSphereMul,uSphereAdd);if(uSphereMode==1)color*=sp;else if(uSphereMode==2)color+=sp;}float fog=1.0-exp(-length(uEye-vWorld)*.007);color=mix(color,vec3(.025,.03,.065),fog);frag=vec4(color,base.a);}`;
    class Stage {
        constructor(canvas) {
            this.canvas = canvas;
            this.gl = canvas.getContext('webgl2', { alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
            this.available = !!this.gl;
            this.geos = new Map();
            this.custom = null;
            this.cast = ['miku'];
            this.costume = 'classic';
            this.stageId = 'arena';
            this.cameraMode = 'auto';
            this.dance = 'idol';
            this.quality = 1.5;
            this.reduceMotion = false;
            this.events = [];this.blend=.5;this.lights=true;this.spacing=1;this.modelRotation=0;this.modelScale=1;
            this.frame = 0;
            this.eye = [0, 2.7, 7.5];
            this.target = [0, 1.6, 0];
            this.root = node('stage');
            if (!this.gl)
                return;
            try{this.initGL();this.setStage('arena');this.setCast(['miku']);}catch(e){this.available=false;this.initError=e.message;return;}
            canvas.addEventListener('webglcontextlost', e => { e.preventDefault();this.available=false;this.contextGeneration=(this.contextGeneration||0)+1;this.onError?.('Contexte 3D perdu. Le spectacle sera rechargé à son retour ; le rythme est préservé.'); });
            canvas.addEventListener('webglcontextrestored',()=>{try{const stage=this.stageId,cast=[...this.cast],costume=this.costume;this.custom=null;this.director=null;this.geos=new Map();this.root=node('stage');this.available=true;this.initGL();this.setStage(stage);this.setCast(cast,costume);Promise.resolve(this.onRestored?.()).catch(e=>this.onError?.(e.message));}catch(e){this.available=false;this.onError?.('Récupération 3D impossible : '+e.message);}});
        }
        initGL() { const gl = this.gl; function shader(type, code) { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw Error(gl.getShaderInfoLog(s)); return s; } const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG), p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            throw Error(gl.getProgramInfoLog(p)); gl.deleteShader(vs); gl.deleteShader(fs); this.program = p; this.u = {}; for (const k of ['View', 'MVP', 'Model', 'Skinned', 'Bones', 'Color', 'Eye', 'Accent', 'Glow', 'Texture', 'Map', 'Sphere', 'SphereMode', 'SphereMap', 'TexMul', 'TexAdd', 'SphereMul', 'SphereAdd', 'LightColor', 'LightIntensity'])
            this.u[k] = gl.getUniformLocation(p, 'u' + k); gl.useProgram(p); gl.uniform1i(this.u.Map, 0); gl.uniform1i(this.u.Bones, 1); gl.uniform1i(this.u.SphereMap, 2); this.boneCapacity=Math.min(1024,gl.getParameter(gl.MAX_TEXTURE_SIZE)); this.boneTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.boneTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 4, this.boneCapacity, 0, gl.RGBA, gl.FLOAT, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.CULL_FACE); }
        upload(data) { const gl = this.gl, vao = gl.createVertexArray(); gl.bindVertexArray(vao); const buffers = [],attributes=[]; for (const [loc, array, size] of [[0, data.positions, 3], [1, data.normals, 3], [2, data.uv, 2], [3, data.joints, 4], [4, data.weights, 4], [5,data.skinTypes,1], [6,data.sdefC,3], [7,data.sdefR0,3], [8,data.sdefR1,3]]) {
            if (!array) {
                gl.disableVertexAttribArray(loc);
                gl.vertexAttrib4f(loc, 0, 0, 0, loc === 4 ? 1 : 0);
                continue;
            }
            let b = gl.createBuffer();
            buffers.push(b);attributes[loc]={buffer:b,size};
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        } const ib = gl.createBuffer(); buffers.push(ib); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW); gl.bindVertexArray(null); return { ...data, vao, buffers, attributes, positionBuffer:buffers[0]||null, uvBuffer:data.uv?buffers[2]:null, count: data.indices.length }; }
        uploadMMDPart(shared, indices) {
            const gl=this.gl,vao=gl.createVertexArray();gl.bindVertexArray(vao);
            for(let loc=0;loc<9;loc++){const a=shared.attributes[loc];if(a){gl.bindBuffer(gl.ARRAY_BUFFER,a.buffer);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,a.size,gl.FLOAT,false,0,0);}else{gl.disableVertexAttribArray(loc);gl.vertexAttrib4f(loc,0,0,0,loc===4?1:0);}}
            const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);gl.bindVertexArray(null);
            return {...shared,vao,buffers:[ib],indices,count:indices.length,sharedVertexBuffers:true};
        }
        geo(name) { if (!this.geos.has(name))
            this.geos.set(name, this.upload(geometry(name))); return this.geos.get(name); }
        mesh(parent, kind, color, p = [0, 0, 0], s = [1, 1, 1], glow = 0, alpha = 1) { let n = add(parent, node(kind, p, s)); n.geo = typeof kind === 'string' ? this.geo(kind) : kind; n.color = [...rgb(color), alpha]; n.glow = glow; return n; }
        rig(id, costume) {
            let a = AVATARS.find(a => a.id === id) || AVATARS[0], r = node(id), skin = a.skin, hair = a.hair, accent = a.accent, dark = costume === 'snow' ? '#f4f4ff' : costume === 'noir' ? '#17151f' : '#252839', cloth = costume === 'neon' ? '#253247' : costume === 'snow' ? '#f0f3ff' : costume === 'noir' ? '#30263c' : a.id === 'meiko' ? '#bb4259' : a.id === 'kaito' ? '#eff2ff' : '#c8d2e2';
            let body = add(r, node('hip', [0, 1.33, 0])), torso = add(body, node('torso', [0, .39, 0]));
            const m = (par, k, c, p, s, g = 0) => this.mesh(par, k, c, p, s, g);
            m(torso, 'sphere', cloth, [0, .14, 0], [.65, .94, .38]);
            m(body, 'sphere', dark, [0, -.015, 0], [.64, .35, .37]);
            m(torso, 'cylinder', skin, [0, .67, 0], [.16, .25, .16]);
            let head = add(torso, node('head', [0, .91, .01]));
            m(head, 'sphere', skin, [0, 0, .02], [.56, .66, .52]);
            m(head, 'sphere', hair, [0, .105, -.055], [.61, .58, .53]);
            for (const side of [-1, 1]) {
                m(head, 'sphere', skin, [side * .279, -.01, 0], [.08, .14, .07]);
                m(head, 'sphere', '#fffaff', [side * .113, .005, .246], [.155, .135, .045]);
                m(head, 'sphere', a.accent, [side * .108, .004, .271], [.071, .107, .023]);
                m(head, 'sphere', '#142438', [side * .109, .01, .284], [.032, .079, .012]);
                m(head, 'sphere', '#ffffff', [side * .094, .038, .293], [.023, .028, .008]);
                let lash = m(head, 'sphere', '#403142', [side * .115, .067, .261], [.175, .028, .025]);
                lash.q = quatEuler(0, 0, -side * .08);
                m(head, 'sphere', '#f9a2ad', [side * .18, -.097, .236], [.091, .025, .015]);
            }
            m(head, 'sphere', '#ffeede', [0, -.06, .286], [.038, .045, .037]);
            m(head, 'sphere', '#965965', [0, -.14, .259], [.081, .014, .012]);
            for (let i = 0; i < 7; i++) {
                let fringe = m(head, 'cone', hair, [(i - 3) * .068, .139, .22], [.16, .34 + (i % 3) * .04, .115]);
                fringe.q = quatEuler(0, 0, Math.PI + (i - 3) * .06);
            }
            for (const side of [-1, 1]) {
                m(head, 'box', dark, [side * .309, .05, -.005], [.085, .18, .19]);
                m(head, 'box', accent, [side * .354, .051, .015], [.018, .12, .105], .5);
            }
            m(head, 'cylinder', dark, [-.237, -.083, .196], [.026, .22, .026]).q = quatEuler(.6, 0, -.95);
            m(head, 'sphere', dark, [-.13, -.137, .294], [.065, .04, .04]);
            const tails = [];
            if (a.style === 'twintails' || a.style === 'long') {
                for (const side of [-1, 1]) {
                    let t = add(head, node('hair-tail', [side * (a.style === 'long' ? .20 : .30), .16, -.10]));
                    tails.push(t);
                    m(t, 'box', accent, [0, 0, 0], [.13, .13, .16], .2);
                    for (let i = 0; i < 3; i++) {
                        let seg = add(t, node('hair-segment', [side * .065, -.31, -.04]));
                        m(seg, 'sphere', hair, [0, -.21, 0], [.24 - i * .03, .79 - i * .07, .21]);
                        t = seg;
                    }
                }
            }
            if (['bob', 'short', 'spikes', 'bow'].includes(a.style)) {
                for (const side of [-1, 1]) {
                    m(head, 'sphere', hair, [side * .22, -.04, -.1], [.21, a.style === 'bob' ? .53 : .32, .39]);
                }
                if (a.style === 'spikes')
                    for (let i = 0; i < 6; i++) {
                        let n = m(head, 'cone', hair, [(i - 2.5) * .09, .37, -.04], [.17, .4, .16]);
                        n.q = quatEuler(0, 0, (2.5 - i) * .2);
                    }
                if (a.style === 'bow') {
                    for (const side of [-1, 1]) {
                        let n = m(head, 'sphere', '#faf7ef', [side * .14, .42, .04], [.34, .17, .15]);
                        n.q = quatEuler(0, 0, side * .50);
                    }
                    m(head, 'sphere', '#ffffff', [0, .4, .055], [.11, .14, .12]);
                }
            }
            if (a.outfit === 'skirt' || a.outfit === 'dress' || costume === 'snow') {
                let skirt = m(body, 'cone', dark, [0, -.16, 0], [.97, a.outfit === 'dress' ? .65 : .43, .70]);
                skirt.q = quatEuler(0, 0, 0);
                m(body, 'cylinder', accent, [0, -.36, 0], [.97, .035, .70], .25);
            }
            if (a.outfit === 'coat') {
                for (const side of [-1, 1])
                    m(body, 'box', cloth, [side * .23, -.34, -.1], [.27, .9, .22]);
                m(torso, 'box', accent, [0, .58, .215], [.6, .14, .08]);
                m(torso, 'box', accent, [-.25, .16, .237], [.15, .76, .04]);
            }
            if (a.outfit !== 'coat') {
                m(torso, 'cone', accent, [0, .26, .222], [.13, .52, .03], costume === 'neon' ? .5 : 0).q = quatEuler(Math.PI, 0, 0);
                m(torso, 'box', accent, [0, -.27, .02], [.65, .065, .40], .25);
            }
            const arms = [], legs = [];
            for (const side of [-1, 1]) {
                let shoulder = add(torso, node('arm', [side * .36, .43, 0]));
                arms.push(shoulder);
                m(shoulder, 'sphere', cloth, [0, -.06, 0], [.25, .29, .29]);
                m(shoulder, 'cylinder', skin, [0, -.25, 0], [.15, .45, .15]);
                let elbow = add(shoulder, node('elbow', [0, -.45, 0]));
                shoulder.elbow = elbow;
                m(elbow, 'sphere', skin, [0, 0, 0], [.16, .16, .16]);
                m(elbow, 'cylinder', a.id === 'miku' || costume === 'noir' ? dark : skin, [0, -.2, 0], [.17, .40, .17]);
                m(elbow, 'box', accent, [0, -.35, .025], [.19, .075, .20], .3);
                m(elbow, 'sphere', skin, [0, -.45, .01], [.15, .20, .10]);
                let hip = add(body, node('leg', [side * .185, -.10, 0]));
                legs.push(hip);
                if (a.outfit === 'shorts')
                    m(hip, 'cylinder', dark, [0, -.15, 0], [.29, .39, .30]);
                m(hip, 'cylinder', skin, [0, -.32, 0], [.215, .65, .215]);
                let knee = add(hip, node('knee', [0, -.60, 0]));
                hip.knee = knee;
                m(knee, 'sphere', skin, [0, 0, 0], [.21, .20, .21]);
                m(knee, 'cylinder', a.id === 'luka' ? skin : dark, [0, -.29, 0], [.20, .58, .22]);
                m(knee, 'sphere', dark, [0, -.57, .08], [.245, .15, .40]);
                m(knee, 'box', accent, [0, -.49, .184], [.16, .04, .045], .25);
            }
            if (costume === 'neon')
                for (const side of [-1, 1])
                    m(torso, 'box', accent, [side * .28, .27, .20], [.047, .47, .027], .8);
            if (costume === 'snow')
                m(torso, 'sphere', '#ffffff', [0, .61, .02], [.73, .20, .47]);
            if (costume === 'noir') {
                m(head, 'cylinder', dark, [0, .35, 0], [.85, .075, .65]);
                m(head, 'cylinder', dark, [0, .46, 0], [.48, .23, .40]);
                m(head, 'cylinder', accent, [0, .385, 0], [.49, .04, .41], .2);
            }
            r.parts = { body, torso, head, arms, legs, tails };r.baseX=r.p[0];
            r.avatar = a;
            return r;
        }
        setCast(ids, costume = this.costume) { this.cast = ids.slice(0, 3); this.costume = costume; if (!this.available)
            return; this.performers = node('performers'); this.rigs = []; this.cast.forEach((id, i) => { let r = this.rig(id, Array.isArray(costume) ? costume[i] || 'classic' : costume); r.p = [this.cast.length === 1 ? 0 : this.cast.length === 2 ? (i === 0 ? -.75 : .75) : [0, -1.65, 1.65][i], 0, this.cast.length === 3 && i > 0 ? -.35 : 0]; if (this.cast.length === 3)
            r.s = [.91, .91, .91]; r.baseX=r.p[0];r.baseZ=r.p[2];add(this.performers, r); this.rigs.push(r); }); }
        setStage(id) {
            this.stageId = STAGES.some(x => x.id === id) ? id : 'arena';
            if (!this.available)
                return;
            const preset = STAGES.find(x => x.id === this.stageId), r = node('environment'), m = (k, c, p, s, g = 0) => this.mesh(r, k, c, p, s, g);
            this.environment = r;
            this.bars = [];
            this.particles = [];
            this.concertFX=add(r,node('concert-fx'));this.beams=[];this.lightsticks=[];
            if(id==='arena'||id==='rooftop'){
              for(let i=0;i<6;i++){const pivot=add(this.concertFX,node('spotlight',[(i-2.5)*1.25,4.6,-3.3]));
                this.mesh(pivot,'box','#283347',[0,0,0],[.3,.25,.35]);
                const beam=this.mesh(pivot,'cone',i%2?preset.a:preset.b,[0,-2.5,0],[2.0,5,2.0],.8,.05);
                this.beams.push({pivot,beam,index:i});
              }
              for(let i=0;i<34;i++){const x=(i%17-8)*.5,z=3.8+Math.floor(i/17)*.7;
                this.mesh(this.concertFX,'sphere','#131c30',[x,.22,z],[.35,.4,.32]);
                const stick=this.mesh(this.concertFX,'cylinder',i%3?preset.a:preset.b,[x+.15,.55,z],[.045,.45,.045],1.1);
                this.lightsticks.push(stick);
              }
            }

            m('box', '#101425', [0, -.2, 0], [15, .25, 13]);
            m('cylinder', '#151e31', [0, -.06, 0], [7, .2, 6]);
            m('ring', preset.a, [0, .046, 0], [3.1, 1, 2.5], .45);
            m('ring', preset.b, [0, .05, 0], [3.6, 1, 2.9], .25);
            for (let i = -4; i <= 4; i++) {
                m('box', '#223449', [i * 1.4, -.065, 0], [.018, .01, 12], .2);
                m('box', '#223449', [0, -.063, i * 1.2], [13, .01, .015], .2);
            }
            if (id === 'arena') {
                m('box', '#0a1022', [0, 3, -4], [10, 5, .3]);
                m('ring', preset.a, [0, 3.1, -3.75], [2.4, 2.4, 2.4], .5).q = quatEuler(Math.PI / 2, 0, 0);
                m('ring', preset.b, [0, 3.1, -3.70], [1.85, 1.85, 1.85], .4).q = quatEuler(Math.PI / 2, 0, 0);
                for (let i = 0; i < 19; i++) {
                    let b = m('box', i % 2 ? preset.a : preset.b, [(i - 9) * .45, 1.4, -3.5], [.19, 1, .12], .4);
                    this.bars.push(b);
                }
                for (const side of [-1, 1]) {
                    m('box', '#292f41', [side * 4.25, 1.2, -1], [.8, 2.5, .65]);
                    for (let i = 0; i < 3; i++)
                        m('sphere', '#0b101e', [side * 4.25, .45 + i * .75, -.65], [.60, .6, .10]);
                    m('box', preset.a, [side * 4.1, 4, -3], [.12, 3, .1], .8);
                }
            }
            if (id === 'rooftop' || id === 'orbital') {
                const random = C.rng(514);
                for (let i = 0; i < 40; i++) {
                    let h = 1 + random() * 7, x = (i - 20) * .65, z = -8 - random() * 9;
                    m('box', i % 2 ? '#172238' : '#202b49', [x, h / 2 - 1, z], [.6, h, .8]);
                    if (i % 2 === 0)
                        for (let j = 0; j < 3; j++)
                            m('box', preset.a, [x, j + h / 3 - 1, z + .42], [.05, .10, .02], .7);
                }
                m('box', '#37465f', [0, .4, -4.7], [11, .10, .12]);
                for (let i = -5; i <= 5; i++)
                    m('box', '#29394d', [i, .15, -4.7], [.06, .5, .06]);
            }
            if (id === 'sakura') {
                for (const side of [-1, 1]) {
                    m('cylinder', '#805562', [side * 3.8, 1.4, -1.5], [.28, 3, .30]);
                    for (let i = 0; i < 6; i++) {
                        let a = i / 6 * Math.PI * 2;
                        m('sphere', i % 2 ? '#d776af' : '#f4aecf', [side * 3.8 + Math.cos(a) * .8, 2.9 + Math.sin(a) * .4, -1.5 + Math.sin(i * 2) * .6], [1.7, 1, 1.4]);
                    }
                    m('cylinder', '#334951', [side * 2.65, .22, 1.3], [.32, .5, .32]);
                    m('sphere', '#f1c3b1', [side * 2.65, .60, 1.3], [.30, .4, .3], .6);
                }
                for (let i = 0; i < 24; i++) {
                    let p = m('sphere', i % 2 ? preset.a : '#e8d6ef', [0, 0, 0], [.055, .025, .025], .3);
                    p.particle = i;
                    this.particles.push(p);
                }
            }
            if (id === 'orbital') {
                m('sphere', '#6c83bc', [4, 6, -12], [6, 6, 6], .1);
                let n = m('ring', preset.a, [4, 6, -12], [4.7, 4.7, 4.7], .4);
                n.q = quatEuler(.35, 0, .5);
                for (let i = 0; i < 30; i++)
                    m('sphere', '#bacdfb', [Math.sin(i * 23) * 15, 2 + (i % 7), -9 - (i % 5)], [.05, .05, .05], .8);
            }
            for (const side of [-1, 1])
                for (let i = 0; i < 3; i++) {
                    let beam = m('cylinder', i % 2 ? preset.a : preset.b, [side * (3 + i * .7), 3, -3], [.025, 6, .025], .8);
                    beam.q = quatEuler(0, 0, side * (.20 + i * .08));
                }
        }
        eventAt(time) { let event = null; for (const e of this.events || [])
            if (e.time <= time && (!event || e.time >= event.time))
                event = e; return event; }
        animateRig(r, time, bpm, index, dance, strength=1) {
            const beat = time * bpm / 60, phase = beat * Math.PI, parts = r.parts, { body, torso, head, arms, legs, tails } = parts, amount = (this.reduceMotion ? .18 : 1)*strength, style = dance || 'idol';
            body.p[1] = 1.33 + Math.abs(Math.sin(phase)) * .026 * amount;
            torso.q = quatEuler(Math.sin(phase) * .02, Math.sin(phase / 4 + index) * .12 * amount, Math.sin(phase / 2) * .04 * amount);
            head.q = quatEuler(-.03, Math.sin(phase / 3) * .12 * amount, -Math.sin(phase / 2) * .05 * amount);
            for (let i = 0; i < 2; i++) {
                let side = i === 0 ? -1 : 1, s = Math.sin(phase + (i * Math.PI)), rot = .18 + Math.max(0, s) * .5;
                let x = -.1, z = side * (.2 + rot);
                if (style === 'wave') {
                    z = side * (1.5 + .25 * Math.sin(phase));
                    x = -.2;
                }
                if (style === 'clap') {
                    z = side * .5;
                    x = -1.1;
                }
                if (style === 'reach') {
                    z = side * (1.5 + Math.sin(phase / 2) * .6);
                    x = -.55;
                }
                if (style === 'pose') {
                    z = side * .35;
                    x = i ? -.85 : -.15;
                }
                if (style === 'step') {
                    z = side * .2;
                    x = s * .55;
                }
                arms[i].q = quatEuler(x * amount, 0, z * amount);
                arms[i].elbow.q = quatEuler((-.35 - Math.max(0, -s) * .8) * amount, 0, side * .12);
                legs[i].q = quatEuler(s * .045 * amount, 0, -side * .022);
                legs[i].knee.q = quatEuler(Math.max(0, -s) * .07 * amount, 0, 0);
            }
            tails.forEach((n, i) => n.q = quatEuler(Math.sin(phase / 2 + i) * .12 * amount, 0, Math.sin(phase / 2 + i) * .08 * amount));
            r.q = quatEuler(0, style === 'spin' && !this.reduceMotion ? beat * Math.PI / 8 : Math.sin(phase / 8) * .08, 0);
        }
        reducedCamera(aspect) {
            // A presentation-only, time-independent view of every declared formation.
            // Cache by the layout objects replaced by applyScene; never sample a moving
            // performer or edit the authored camera/formation tracks to calm the view.
            const plan=this.directorPreview===undefined&&this.autoShowPlan?.mode!=='off'?this.autoShowPlan:null,config=this.director?.config;
            const key=[aspect,plan,config,this.rigs,this.cast,this.custom,this.spacing,this.modelScale];
            if(this.reducedCameraCache?.key.every((v,i)=>v===key[i]))return this.reducedCameraCache.pose;
            const min=[0,0,0],max=[0,0,0],include=p=>{if(!p)return;for(let i=0;i<3;i++)if(Number.isFinite(p[i])){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}};
            for(const r of this.rigs||[])include([r.baseX*(this.spacing||1),0,r.baseZ]);
            if(config)for(const p of root.PulseV10Core.positions(config.count,config.spacing))include(p);
            for(const f of config?.formations||[])for(const p of f.positions||[])include(p);
            for(const f of plan?.formations||[])for(const p of f.positions||[])include(p);
            const scale=Math.max(1,this.modelScale||1,...(config?.slots||[]).map(s=>s.scale||1)),fov=.64,margin=1.5*scale;
            const target=[(min[0]+max[0])/2,(min[1]+max[1]+3.2*scale)/2,(min[2]+max[2])/2];
            const depth=(max[2]-min[2])/2+margin;
            const distance=Math.max(9,((max[0]-min[0])/2+margin)/(Math.tan(fov/2)*Math.max(.1,aspect)),((max[1]-min[1]+3.2*scale)/2+.5*scale)/Math.tan(fov/2))+depth;
            const pose={eye:[target[0],target[1],target[2]+distance],target,fov,far:Math.max(150,distance+depth+10)};
            this.reducedCameraCache={key,pose};return pose;
        }
        render(time = 0, bpm = 120, { menu = false, preview = false, pv = false, energy = .4,beat=time*bpm/60 } = {}) {
            if (!this.available)
                return;
            // V31: sample the audition clock at render time, not from an older UI timer.
            const directorClock=this.directorClock?.();
            if(directorClock){this.directorPreview=directorClock.time;bpm=directorClock.bpm;beat=directorClock.beat;}
            if(this.directorPreview!==undefined){time=this.directorPreview;menu=false;preview=true;if(!directorClock)beat=time*bpm/60;}
            else if(menu&&this.autoShowPlan&&this.autoShowPlan.mode!=='off'){const duration=this.autoShowPlan.duration;time=((time%duration)+duration)%duration;beat=root.PulseAutoShow.beatAt(this.autoShowPlan,time);}
            const plan=this.directorPreview!==undefined?null:this.autoShowPlan, A=root.PulseAutoShow;
            const show=plan&&(!menu||preview)?A.sample(plan,time,{reduceMotion:this.reduceMotion,aspect:(this.canvas.clientWidth||960)/(this.canvas.clientHeight||540)}):null;
            this.lastAutoShowSample=show;
            if(show){energy=show.section?.energy??energy;if(!this.reduceMotion&&!plan.overrides.stage&&show.stage&&show.stage!==this.stageId)this.setStage(show.stage);}
            const gl = this.gl, w = this.directorPreview!==undefined?960:this.canvas.clientWidth, h = this.directorPreview!==undefined?432:this.canvas.clientHeight;
            if (!w || !h)
                return;
            const ratio = Math.min(root.devicePixelRatio || 1, this.quality);
            if (this.canvas.width !== Math.round(w * ratio) || this.canvas.height !== Math.round(h * ratio)) {
                this.canvas.width = Math.round(w * ratio);
                this.canvas.height = Math.round(h * ratio);
            }
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clearColor(.017, .026, .05, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram(this.program);
            let event = menu ? null : this.eventAt(time), mode = event?.camera || this.cameraMode, dance = event?.dance || this.dance;
            if (!this.reduceMotion && event?.stage && event.stage !== this.stageId && (!show||plan.overrides.stage))
                this.setStage(event.stage);
            if(this.director?.models?.length)this.animateDirector(Math.max(0,time));
            if(this.custom?.kind==='mmd'){this.animateMMD(this.custom,Math.max(0,time));const m=this.custom,rot=quatEuler(0,(this.modelRotation||0)*Math.PI/180,0),f=this.modelScale||1;m.root.s=m.baseScale.map(v=>v*f);m.root.q=rot;m.root.p=point(trs([0,0,0],rot,[f,f,f]),m.basePosition);world(m.root);}
            if(this.director&&!menu&&!this.director.activeCamera){const cut=[...(this.director.config.cuts||[])].reverse().find(c=>c.time<=time);if(cut)mode=cut.camera;}
            const pose=(shot,t)=>{
              if(shot==='auto')shot=this.reduceMotion?'front':['front','orbit','wide','close'][Math.floor(Math.max(0,beat)/16)%4];
              if(this.reduceMotion&&shot==='orbit')shot='front';
              let eye=[0,2.55,7.6],target=[0,1.6,0];
              if(shot==='close'){eye=[.3,2.75,4.4];target=[0,2.03,0];}
              if(shot==='wide')eye=[.6,3.7,10];
              if(shot==='high'){eye=[0,7,6];target=[0,1,0];}
              if(shot==='orbit'){const a=Math.sin(t*.15)*.46;eye=[Math.sin(a)*8,2.8,Math.cos(a)*8];}
              return {eye,target};
            };
            if(menu)mode=this.cameraMode==='auto'?'front':this.cameraMode;
            let current=pose(mode,time);
            if(this.director?.activeCamera&&!menu){current={eye:this.director.activeCamera.eye,target:this.director.activeCamera.target};}
            else if(this.custom?.kind==='mmd'&&this.custom.activeCamera&&!menu){current={eye:this.custom.activeCamera.eye,target:this.custom.activeCamera.target};}
            if(event&&!this.reduceMotion&&this.blend>0&&!(this.custom?.kind==='mmd'&&this.custom.activeCamera)&&!this.director?.activeCamera){
              const index=this.events.indexOf(event),previous=index>0?this.events[index-1].camera:this.cameraMode;
              let mix=C.clamp((time-event.time)/this.blend,0,1);mix=mix*mix*(3-2*mix);
              const old=pose(previous,time);current={eye:current.eye.map((v,i)=>old.eye[i]+(v-old.eye[i])*mix),target:current.target.map((v,i)=>old.target[i]+(v-old.target[i])*mix)};
            }
            if(show&&!plan.overrides.camera&&show.camera)current={eye:show.camera.eye,target:show.camera.target};
            const calmCamera=this.reduceMotion?this.reducedCamera(w/h):null;
            if(calmCamera)current=calmCamera;
            this.eye=current.eye;this.target=current.target;this.frame++;
            const activeMmdCam=calmCamera||(show&&!plan.overrides.camera?show.camera:null)||this.director?.activeCamera||((this.custom?.kind==='mmd')?this.custom.activeCamera:null);
            const viewMatrix=lookAt(this.eye,this.target),vp=mul(perspective(activeMmdCam?activeMmdCam.fov:.64,w/h,.1,calmCamera?.far??150),viewMatrix);gl.uniformMatrix4fv(this.u.View,false,viewMatrix);
            let preset = STAGES.find(x => x.id === this.stageId);
            const light=(show&&!plan.overrides.lighting?show.light:null)||(this.reduceMotion&&this.director?root.PulseDirector.sampleTrack(this.director.config.lightTrack,0,'light'):this.director?.activeLight);gl.uniform3fv(this.u.LightColor,light?.color||[1,1,1]);gl.uniform1f(this.u.LightIntensity,light?.intensity??1);
            gl.uniform3fv(this.u.Eye, this.eye);
            gl.uniform3fv(this.u.Accent, rgb(preset.a));
            const decorTime=this.reduceMotion?0:time,decorEnergy=this.reduceMotion?.4:energy;
            this.bars.forEach((b, i) => { let height = .15 + Math.abs(Math.sin(decorTime * 2.7 + i * .43)) * (.8 + decorEnergy * .8); b.s[1] = height; b.p[1] = .55 + height / 2; });
            if(this.concertFX)this.concertFX.hidden=!this.lights;
            this.beams?.forEach(({pivot,index})=>{pivot.q=quatEuler(.1+Math.sin((this.reduceMotion?0:time)*.42+index)*.18,0,Math.sin((this.reduceMotion?0:time)*.65+index*1.2)*.5);});
            this.lightsticks?.forEach((n,i)=>{n.q=quatEuler(0,0,this.reduceMotion?0:Math.sin(beat*Math.PI+i*.4)*.35);});
            this.particles.forEach((p, i) => p.p = [Math.sin(i * 12.3 + decorTime * .15) * 4, 3.7 - ((decorTime * .22 + i * .31) % 3.4), Math.cos(i * 2.7 + decorTime * .13) * 3]);
            if (this.custom) {
                if(this.custom.kind!=='mmd'){this.animateGLB(this.custom, Math.max(0, time));const m=this.custom,rot=quatEuler(0,(this.modelRotation||0)*Math.PI/180,0),f=this.modelScale||1;m.root.s=m.baseScale.map(v=>v*f);m.root.q=rot;m.root.p=point(trs([0,0,0],rot,[f,f,f]),m.basePosition);world(this.custom.root);}
            }
            else {
                this.rigs.forEach((r,i)=>{
                  const autoDance=show&&!plan.overrides.choreography?show.dances[i]:null;
                  const form=show&&!plan.overrides.formations?show.form:null,pos=form?show.positions[i]:null;
                  r.hidden=form?.visible?.[i]===false;r.p[0]=pos?pos[0]:r.baseX*(this.spacing||1);r.p[2]=pos?pos[2]:r.baseZ;
                  const musicBeat=autoDance?show.beat+autoDance.phase:beat,style=autoDance?.style||(menu&&!preview?'pose':dance),strength=autoDance?.style==='pose'?.35:autoDance?.energy!==undefined?.4+.6*autoDance.energy:1;
                  const track=autoDance?plan.danceTracks[i]:[],idx=track.indexOf(autoDance),prev=track[idx-1],elapsed=show?show.time-autoDance?.start:99;
                  const nodes=[r,r.parts.body,r.parts.torso,r.parts.head,...r.parts.arms.flatMap(n=>[n,n.elbow]),...r.parts.legs.flatMap(n=>[n,n.knee]),...r.parts.tails];
                  let oldPose=null;
                  if(prev&&elapsed<autoDance.transition){this.animateRig(r,musicBeat*60/bpm,bpm,i,prev.style,.4+.6*prev.energy);oldPose=nodes.map(n=>({p:[...n.p],q:[...n.q]}));}
                  this.animateRig(r,musicBeat*60/bpm,bpm,i,style,strength);
                  if(oldPose){let a=C.clamp(elapsed/autoDance.transition,0,1);a=a*a*(3-2*a);nodes.forEach((n,j)=>{n.p=n.p.map((v,k)=>oldPose[j].p[k]+(v-oldPose[j].p[k])*a);n.q=slerp(oldPose[j].q,n.q,a);});}
                });
                world(this.performers);
            }
            world(this.environment);
            let list = [];
            function collect(n) {if(n.hidden)return; if (n.geo)
                list.push(n); n.children.forEach(collect); }
            collect(this.environment);
            if(this.director?.models?.length)this.director.models.forEach(m=>collect(m.root)); else collect(this.custom ? this.custom.root : this.performers);
            list.sort((a, b) => (b.color?.[3] ?? 1) - (a.color?.[3] ?? 1));
            this.paletteUploads=0;const palettes=new Map();let lastPalette=null;
            for (const n of list) {
                gl.bindVertexArray(n.geo.vao);
                gl.uniformMatrix4fv(this.u.Model, false, n.world);
                gl.uniformMatrix4fv(this.u.MVP, false, mul(vp, n.world));
                gl.uniform4fv(this.u.Color, n.color || [1, 1, 1, 1]);
                gl.uniform4fv(this.u.TexMul,n.surface?.textureMul||[1,1,1,1]);gl.uniform4fv(this.u.TexAdd,n.surface?.textureAdd||[0,0,0,0]);gl.uniform4fv(this.u.SphereMul,n.surface?.sphereMul||[1,1,1,1]);gl.uniform4fv(this.u.SphereAdd,n.surface?.sphereAdd||[0,0,0,0]);gl.uniform1f(this.u.Glow, n.glow || 0);
                gl.uniform1i(this.u.Texture, !!n.texture);
                if (n.texture) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, n.texture); }
                gl.uniform1i(this.u.Sphere, !!n.sphereTexture);
                gl.uniform1i(this.u.SphereMode, n.sphereMode||0);
                if(n.sphereTexture){gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,n.sphereTexture);}
                gl.uniform1i(this.u.Skinned, !!n.skin);
                if (n.skin) {
                    let matrices=palettes.get(n.skin);
                    if(!matrices){matrices=n.skin._palette||=new Float32Array(n.skin.joints.length*16);const inverse=inv(n.world);for(let i=0;i<n.skin.joints.length;i++)matrices.set(mul(mul(inverse,n.skin.joints[i].world),n.skin.inverse[i]),i*16);palettes.set(n.skin,matrices);}
                    gl.activeTexture(gl.TEXTURE1);
                    gl.bindTexture(gl.TEXTURE_2D, this.boneTex);
                    if(lastPalette!==n.skin){gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 4, n.skin.joints.length, gl.RGBA, gl.FLOAT, matrices);lastPalette=n.skin;this.paletteUploads++;}
                }
                gl.depthMask((n.color?.[3] ?? 1) >= .98);
                gl.drawElements(gl.TRIANGLES, n.geo.count, gl.UNSIGNED_INT, 0);
            }
            gl.depthMask(true);
            gl.bindVertexArray(null);
            this.drawCalls = list.length;
        }

        async loadMMD(modelBuffer, motionBuffers = [], poseText = null, textureFiles = [], name = 'MMD', preserve = false) {
            if (!this.available) throw Error('WebGL 2 indisponible pour MMD.');
            if (!root.PulseMMD) throw Error('Runtime MMD absent.');
            const generation=this.contextGeneration||0;
            const sig=String.fromCharCode(...new Uint8Array(modelBuffer).slice(0,4)),pmx=sig.startsWith('PMX ')?root.PulseMMD.parsePmx(modelBuffer,{full:true}):root.PulseMMD.parsePmd(modelBuffer,{full:true});
            const compatibilityWarnings=root.PulseMMDCompat.validateModel(pmx);
            if (pmx.bones.length > this.boneCapacity) throw Error(`Ce modèle MMD contient ${pmx.bones.length} os ; limite du renderer : ${this.boneCapacity}.`);
            if (pmx.vertexCount > 350000 || pmx.indices.length/3 > 500000) throw Error('Modèle MMD trop complexe pour le runtime temps réel.');
            const modelRoot=node(name), boneRoot=add(modelRoot,node('mmd-skeleton'));
            const bones=pmx.bones.map((b,i)=>{const parent=b.parent>=0?pmx.bones[b.parent]:null;const base=parent?b.pos.map((x,k)=>x-parent.pos[k]):b.pos;const n=node(b.name,base);n.baseP=[...base];n.baseQ=[0,0,0,1];n.mmdIndex=i;return n});
            for(let i=0;i<bones.length;i++){const pi=pmx.bones[i].parent;if(pi>=0&&pi<bones.length)add(bones[pi],bones[i]);else add(boneRoot,bones[i]);}
            world(modelRoot);const inverse=bones.map(b=>inv(b.world));
            const normalizePath=x=>String(x||'').replace(/\\/g,'/').replace(/^\.\//,'').toLowerCase();
            const texMap=new Map(textureFiles.map(f=>[normalizePath(f.name),f]));
            async function bitmapOf(blob){if(root.createImageBitmap)return createImageBitmap(blob);return new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(blob);im.onload=()=>{URL.revokeObjectURL(u);res(im)};im.onerror=()=>{URL.revokeObjectURL(u);rej(Error('Texture MMD illisible.'))};im.src=u})}
            async function tgaOf(blob){return root.PulseMMDCompat.parseTGA(await blob.arrayBuffer());}
            const gl=this.gl, textures=[], warnings=[...compatibilityWarnings];
            for(const path of pmx.textures){const resolved=root.PulseMMDCompat.resolveTexture(textureFiles,name,path);if(resolved.warning)warnings.push(resolved.warning);const file=resolved.file;if(!file){textures.push(null);continue}let tex=null;try{const blob=file.blob||file,isTGA=/\.tga$/i.test(path),image=isTGA?await tgaOf(blob):await bitmapOf(blob);/* No texture binding may span an await: live rendering can change the active unit and bind the float bone palette. */tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);if(isTGA){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,image.width,image.height,0,gl.RGBA,gl.UNSIGNED_BYTE,image.data)}else{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);image.close?.()}gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);gl.generateMipmap(gl.TEXTURE_2D);textures.push(tex)}catch(e){if(tex)gl.deleteTexture(tex);textures.push(null);warnings.push('Texture non chargée : '+path+' ('+e.message+')')}}
            if(!this.available||generation!==(this.contextGeneration||0)){textures.filter(Boolean).forEach(t=>gl.deleteTexture(t));throw Error('Chargement MMD annulé : contexte graphique renouvelé.');}
            const shared=this.upload({positions:pmx.positions,normals:pmx.normals,uv:pmx.uv,joints:pmx.joints,weights:pmx.weights,skinTypes:Float32Array.from(pmx.weightTypes||Array(pmx.vertexCount).fill(0)),sdefC:pmx.sdefC,sdefR0:pmx.sdefR0,sdefR1:pmx.sdefR1,indices:new Uint32Array(0)});const geos=[shared],parts=[],skin={joints:bones,inverse};for(const mat of pmx.materials){const sub=pmx.indices.slice(mat.indexStart,mat.indexStart+mat.indexCount),data=this.uploadMMDPart(shared,sub);data.basePositions=pmx.positions;geos.push(data);const part=add(modelRoot,node('mmd-material'));part.geo=data;part.color=[...mat.diffuse];part.surface=root.PulseMMDSurface.baseMaterial(mat);part.texture=textures[mat.texture]||null;part.sphereTexture=(mat.sphereMode===1||mat.sphereMode===2)?(textures[mat.sphere]||null):null;part.sphereMode=part.sphereTexture?mat.sphereMode:0;part.glow=0;part.skin=skin;parts.push(part)}
            const motions=motionBuffers.map((b,i)=>root.PulseMMD.parseVmd(b,{full:true}));
            const boneTracks=new Map(),morphTracks=new Map(),cameraTracks=[];for(const m of motions){for(const k of m.bones){if(!boneTracks.has(k.name))boneTracks.set(k.name,[]);boneTracks.get(k.name).push(k)}for(const k of m.morphs){if(!morphTracks.has(k.name))morphTracks.set(k.name,[]);morphTracks.get(k.name).push(k)}cameraTracks.push(...m.cameras)}for(const arr of [...boneTracks.values(),...morphTracks.values()])arr.sort((a,b)=>a.frame-b.frame);cameraTracks.sort((a,b)=>a.frame-b.frame);
            const pose=poseText?root.PulseMMD.parseVpd(poseText,{full:true}):null;
            const morphByName=new Map(pmx.morphs.map(m=>[m.name,m]));
            let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<pmx.positions.length;i+=3)for(let k=0;k<3;k++){min[k]=Math.min(min[k],pmx.positions[i+k]);max[k]=Math.max(max[k],pmx.positions[i+k])}const scale=3/(max[1]-min[1]||1);modelRoot.s=[scale,scale,scale];modelRoot.p=[-(min[0]+max[0])/2*scale,-min[1]*scale,-(min[2]+max[2])/2*scale];
            const loaded={kind:'mmd',root:modelRoot,baseScale:[...modelRoot.s],basePosition:[...modelRoot.p],bones,pmx,geos,textures:textures.filter(Boolean),parts,boneTracks,morphTracks,cameraTracks,pose,morphByName,name,triangles:pmx.indices.length/3,warnings,offsetMs:0,rate:1,useCamera:true};
            if(!preserve){this.clearCustom();this.custom=loaded;}this.applyMMDPose(loaded);return {name:pmx.name||name,triangles:loaded.triangles,bones:bones.length,morphs:pmx.morphs.length,motions:motions.length,warnings,model:loaded};
        }
        applyMMDPose(m){if(!m?.pose?.entries)return;const map=new Map(m.bones.map(b=>[b.name,b]));for(const e of m.pose.entries){const b=map.get(e.name);if(!b)continue;b.p=b.baseP.map((x,i)=>x+e.pos[i]);b.q=e.rot}}
        _mmdBezier(x1,y1,x2,y2,t){x1=C.clamp(x1,0,1);y1=C.clamp(y1,0,1);x2=C.clamp(x2,0,1);y2=C.clamp(y2,0,1);let u=t;for(let i=0;i<8;i++){const om=1-u,x=3*om*om*u*x1+3*om*u*u*x2+u*u*u,dx=3*om*om*x1+6*om*u*(x2-x1)+3*u*u*(1-x2);if(Math.abs(dx)<1e-5)break;u=C.clamp(u-(x-t)/dx,0,1)}const om=1-u;return 3*om*om*u*y1+3*om*u*u*y2+u*u*u}
        _mmdCurve(bytes,channel,t,kind='bone'){if(!bytes?.length)return t;let a;if(kind==='camera'){const o=channel*4;a=[bytes[o],bytes[o+1],bytes[o+2],bytes[o+3]]}else{a=[bytes[channel],bytes[channel+4],bytes[channel+8],bytes[channel+12]]}if(a.some(v=>!Number.isFinite(v)))return t;return this._mmdBezier(a[0]/127,a[1]/127,a[2]/127,a[3]/127,t)}
        _mmdSample(arr,frame,kind='bone'){if(!arr?.length)return null;if(frame<=arr[0].frame)return arr[0];if(frame>=arr[arr.length-1].frame)return arr[arr.length-1];let lo=0,hi=arr.length-1;while(lo+1<hi){let mid=(lo+hi)>>1;if(arr[mid].frame<=frame)lo=mid;else hi=mid}const a=arr[lo],b=arr[hi],t=C.clamp((frame-a.frame)/(b.frame-a.frame||1),0,1);if(kind==='morph')return {weight:a.weight+(b.weight-a.weight)*t};if(kind==='camera'){const tx=this._mmdCurve(b.interp,0,t,'camera'),ty=this._mmdCurve(b.interp,1,t,'camera'),tz=this._mmdCurve(b.interp,2,t,'camera'),tr=this._mmdCurve(b.interp,3,t,'camera'),td=this._mmdCurve(b.interp,4,t,'camera'),tf=this._mmdCurve(b.interp,5,t,'camera');return {pos:a.pos.map((x,i)=>x+(b.pos[i]-x)*[tx,ty,tz][i]),rot:a.rot.map((x,i)=>x+(b.rot[i]-x)*tr),distance:a.distance+(b.distance-a.distance)*td,fov:a.fov+(b.fov-a.fov)*tf,perspective:a.perspective};}const tx=this._mmdCurve(b.interp,0,t),ty=this._mmdCurve(b.interp,1,t),tz=this._mmdCurve(b.interp,2,t),tr=this._mmdCurve(b.interp,3,t);return {pos:a.pos.map((x,i)=>x+(b.pos[i]-x)*[tx,ty,tz][i]),rot:slerp(a.rot,b.rot,tr)}}
        _mmdPose(m,motion,frame){
            const pose={transforms:m.bones.map(b=>({p:[...b.baseP],q:[...b.baseQ]})),morphs:new Map()};
            const indexes=m.boneIndexes||(m.boneIndexes=new Map(m.bones.map((b,i)=>[b.name,i])));
            for(const e of m.pose?.entries||[]){const i=indexes.get(e.name);if(i!==undefined)pose.transforms[i]={p:m.bones[i].baseP.map((v,j)=>v+e.pos[j]),q:[...e.rot]};}
            for(const [name,track] of motion.boneTracks){const i=indexes.get(name);if(i===undefined)continue;const k=this._mmdSample(track,frame,'bone');if(k)pose.transforms[i]={p:m.bones[i].baseP.map((v,j)=>v+k.pos[j]),q:[...k.rot]};}
            for(const [name,track] of motion.morphTracks){const k=this._mmdSample(track,frame,'morph');if(k)pose.morphs.set(name,C.clamp(k.weight,0,1));}
            return pose;
        }
        animateMMD(m,time,samples=null){
            const D=root.PulseDirector;
            const motion=samples?.current?.motion||m;
            const local=samples?.current?.local??Math.max(0,(time-(m.offsetMs||0)/1000)*(m.rate||1));
            const loop=samples?.current?.loop??m.loop,frame=D.motionFrame(motion,local,loop);
            const pose=this._mmdPose(m,motion,frame);
            if(samples?.previous&&samples.alpha<1){
                const prev=samples.previous,old=this._mmdPose(m,prev.motion,D.motionFrame(prev.motion,prev.local,prev.loop)),a=samples.alpha;
                for(let i=0;i<pose.transforms.length;i++){const p=pose.transforms[i],o=old.transforms[i];p.p=p.p.map((v,k)=>o.p[k]+(v-o.p[k])*a);p.q=slerp(o.q,p.q,a);}
                for(const name of new Set([...pose.morphs.keys(),...old.morphs.keys()]))pose.morphs.set(name,(old.morphs.get(name)||0)*(1-a)+(pose.morphs.get(name)||0)*a);
            }
            root.PulseFace?.apply(m,pose,this.faceTrack,time,{current:motion,previous:samples?.previous?.motion,slot:m.directorSlot??0,lead:this.faceLead??0});
            for(let i=0;i<m.bones.length;i++){m.bones[i].p=pose.transforms[i].p;m.bones[i].q=pose.transforms[i].q;}
            // Expand group morphs into leaf weights without recursive cycles.
            const weights=new Map();const visit=(morph,weight,seen=new Set())=>{
                if(!morph||Math.abs(weight)<.00001||seen.has(morph)||seen.size>16)return;
                if(morph.type===0){const next=new Set(seen);next.add(morph);for(const it of morph.items)visit(m.pmx.morphs[it.index],weight*it.weight,next);}
                else weights.set(morph,(weights.get(morph)||0)+weight);
            };
            for(const [name,weight] of pose.morphs)visit(m.morphByName.get(name),weight);
            let work=null;
            for(const [morph,weight] of weights){
                if(morph.type===1){if(!work){work=m.vertexScratch||=new Float32Array(m.pmx.positions.length);work.set(m.pmx.positions);}for(const it of morph.items){const k=it.index*3;if(k+2>=work.length)continue;for(let j=0;j<3;j++)work[k+j]+=it.offset[j]*weight;}}
                if(morph.type===2)for(const it of morph.items){const b=m.bones[it.index];if(!b)continue;b.p=b.p.map((v,i)=>v+it.translation[i]*weight);b.q=norm(qmul(b.q,slerp([0,0,0,1],it.rotation,weight)));}
            }
            if(work||m.vertexMorphed)for(const buffer of new Set(m.geos.map(g=>g.positionBuffer))){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,buffer);this.gl.bufferSubData(this.gl.ARRAY_BUFFER,0,work||m.pmx.positions);}
            m.vertexMorphed=!!work;
            const surface=root.PulseMMDSurface.evaluate(m.pmx,weights);
            if(surface.uv||m.uvMorphed)for(const buffer of new Set(m.geos.map(g=>g.uvBuffer).filter(Boolean))){this.gl.bindBuffer(this.gl.ARRAY_BUFFER,buffer);this.gl.bufferSubData(this.gl.ARRAY_BUFFER,0,surface.uv||m.pmx.uv);}
            m.uvMorphed=!!surface.uv;
            if(surface.materials||m.materialMorphed)m.parts.forEach((p,i)=>{p.surface=surface.materials?.[i]||root.PulseMMDSurface.baseMaterial(m.pmx.materials[i]);p.color=[...p.surface.diffuse];});
            m.materialMorphed=!!surface.materials;
            m.appendPlan||=root.PulseSkeleton.compile(m.pmx.bones);root.PulseSkeleton.apply(m.pmx.bones,m.bones,m.appendPlan);world(m.root);
            if(m.useIK!==false)for(let bi=0;bi<m.pmx.bones.length;bi++){
                const ik=m.pmx.bones[bi].ik;if(!ik||!m.bones[ik.target])continue;
                const goal=m.bones[bi],eff=m.bones[ik.target];
                for(let pass=0;pass<Math.min(ik.loops,32);pass++)for(const link of ik.links){
                    const ln=m.bones[link.bone];if(!ln)continue;world(m.root);
                    const invL=inv(ln.world),ep=point(invL,[eff.world[12],eff.world[13],eff.world[14]]),gp=point(invL,[goal.world[12],goal.world[13],goal.world[14]]);
                    if(Math.hypot(...vsub(ep,gp))<1e-4)break;
                    ln.q=norm(qmul(ln.q,qfrom(ep,gp,Math.min(ik.limit,Math.PI))));
                    if(link.limited)ln.q=root.PulseSkeleton.constrain(ln.q,link.min,link.max);
                }
            }
            world(m.root);
            const settings=this.secondarySettings;
            if(settings?.enabled&&!m.root.hidden&&root.PulseSecondaryPhysics){
                const key=JSON.stringify(settings);if(m.secondaryKey!==key){m.secondaryWorld?.dispose();m.secondaryWorld=null;m.secondaryError=null;m.secondaryKey=key;}
                if(!m.secondaryError)try{
                    if(!m.secondaryWorld&&root.PulseSecondaryPhysics.inspect(m.pmx.physics).canSimulate)m.secondaryWorld=new root.PulseSecondaryPhysics.World(m.pmx.physics,m.pmx.bones,settings);
                    if(m.secondaryWorld){const result=m.secondaryWorld.update(time,m.bones.map(b=>({p:b.p,q:b.q})));for(let i=0;i<m.bones.length;i++){m.bones[i].p=result[i].p;m.bones[i].q=result[i].q;}world(m.root);}
                }catch(e){m.secondaryWorld?.dispose();m.secondaryWorld=null;m.secondaryError=e.message;}
            }else if(m.secondaryWorld){m.secondaryWorld.dispose();m.secondaryWorld=null;m.secondaryKey=null;}
            m.activeCamera=null;
            if(m.useCamera&&motion.cameraTracks.length){const c=this._mmdSample(motion.cameraTracks,frame,'camera');if(c){
                const cx=Math.cos(c.rot[0]),sx=Math.sin(c.rot[0]),cy=Math.cos(c.rot[1]),sy=Math.sin(c.rot[1]),dir=[-sy*cx,sx,-cy*cx];
                const target=point(m.root.world,c.pos),eye=point(m.root.world,c.pos.map((v,i)=>v-dir[i]*c.distance));
                m.activeCamera={eye,target,fov:C.clamp(c.fov||45,15,100)*Math.PI/180};
            }}
        }

        setMMDDirector(models=[], config={}) { this.clearDirector(); this.director={models,config,activeCamera:null}; }
        clearDirector(){if(!this.director)return;for(const m of this.director.models||[])this._disposeCustom(m);this.director=null;}
        _disposeCustom(m){if(!m)return;m.secondaryWorld?.dispose();m.secondaryWorld=null;for(const g of m.geos||[]){this.gl.deleteVertexArray(g.vao);(g.buffers||[]).forEach(b=>this.gl.deleteBuffer(b));}(m.textures||[]).forEach(t=>this.gl.deleteTexture(t));}
        animateDirector(time){
            if(!this.director)return;const {models,config}=this.director,D=root.PulseDirector;let cam=null;
            const forms=config.formations||[],active=[...forms].reverse().find(f=>f.time<=time)||forms[0];
            const positions=root.PulseV10Core.formationAt(forms,time,config.count,config.spacing);
            this.faceLead=active?.lead??0;
            for(let i=0;i<models.length;i++){
                const m=models[i],state=D.clipState(m.directorClips||[],time),t=m.directorTransform||{},f=t.scale||1,rot=quatEuler(0,(t.rotationY||0)*Math.PI/180,0),p=positions[i]||[t.x||0,t.y||0,t.z||0];
                m.directorSlot=i;
                m.root.s=m.baseScale.map(v=>v*f);m.root.q=rot;
                const base=point(trs([0,0,0],rot,[f,f,f]),m.basePosition);m.root.p=base.map((v,k)=>v+p[k]);world(m.root);
                m.root.hidden=!state||active?.visible?.[i]===false;m.activeCamera=null;if(m.root.hidden&&m.secondaryWorld){m.secondaryWorld.dispose();m.secondaryWorld=null;}
                if(state){const c=state.current,previous=state.previous;m.useCamera=config.useCamera!==false&&c.camera;
                    const musical=(clip,t,regular)=>clip.musicalClock&&clip.motion?.procedural&&this.autoShowPlan?Math.max(0,(root.PulseAutoShow.beatAt(this.autoShowPlan,t)-Math.floor(root.PulseAutoShow.beatAt(this.autoShowPlan,clip.start)+1e-7))*.5)+clip.motionStart:regular;
                    const sync=(clip,at,regular)=>clip.sourceBpm&&config.rhythm?root.PulseMotionSync.sourceTime(clip,at,config.rhythm):{local:musical(clip,at,regular),loop:clip.loop};this.animateMMD(m,time,{current:{motion:c.motion,...sync(c,time,state.local)},previous:previous?{motion:previous.motion,...sync(previous,previous.end,state.previousLocal)}:null,alpha:state.alpha});
                    if(m.activeCamera&&!m.root.hidden)cam=m.activeCamera;
                }
            }
            this.director.activeCamera=D.cameraPose(D.sampleTrack(config.cameraTrack,time))||cam;
            this.director.activeLight=D.sampleTrack(config.lightTrack,time,'light');
        }

        async loadGLB(buffer, name = 'Modèle importé') {
            if (!this.available)
                throw Error('WebGL 2 indisponible pour importer un modèle.');
            if (buffer.byteLength > 80 * 1024 * 1024)
                throw Error('GLB trop volumineux : limite 80 Mo.');
            const d = new DataView(buffer);
            if (buffer.byteLength < 20 || d.getUint32(0, true) !== 0x46546c67 || d.getUint32(4, true) !== 2)
                throw Error('Fichier GLB 2.0 attendu.');
            if (d.getUint32(8, true) !== buffer.byteLength)
                throw Error('Longueur GLB invalide.');
            let json = null, bin = null;
            for (let p = 12; p + 8 <= buffer.byteLength;) {
                let size = d.getUint32(p, true), type = d.getUint32(p + 4, true);
                if (p + 8 + size > buffer.byteLength)
                    throw Error('Bloc GLB tronqué.');
                if (type === 0x4e4f534a)
                    json = JSON.parse(new TextDecoder().decode(buffer.slice(p + 8, p + 8 + size)).trim());
                if (type === 0x004e4942)
                    bin = buffer.slice(p + 8, p + 8 + size);
                p += 8 + size;
            }
            if (!json || !bin)
                throw Error('GLB autonome avec géométrie embarquée requis.');
            if (json.extensionsRequired?.some(x => !['KHR_materials_unlit'].includes(x)))
                throw Error('Extension GLB requise non prise en charge. Exporter sans Draco, Meshopt ou textures KTX2.');
            if ((json.buffers || []).some(b => b.uri))
                throw Error('Ressources externes interdites : exporter un GLB entièrement embarqué.');
            if ((json.nodes || []).length > 4000)
                throw Error('Modèle trop complexe.');
            const dims = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }, sizes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }, get = { 5120: 'getInt8', 5121: 'getUint8', 5122: 'getInt16', 5123: 'getUint16', 5125: 'getUint32', 5126: 'getFloat32' };
            function acc(index) { const a = json.accessors?.[index]; if (!a || a.sparse || a.bufferView === undefined)
                throw Error('Accesseur GLB absent ou sparse non pris en charge.'); const view = json.bufferViews[a.bufferView], dim = dims[a.type], size = sizes[a.componentType]; if (!view || !dim || !size || a.count * dim > 20000000)
                throw Error('Accesseur GLB invalide.'); const dv = new DataView(bin), stride = view.byteStride || dim * size, start = (view.byteOffset || 0) + (a.byteOffset || 0), out = new Float32Array(a.count * dim); if (start + (a.count - 1) * stride + dim * size > bin.byteLength)
                throw Error('Accesseur hors du buffer GLB.'); for (let i = 0; i < a.count; i++)
                for (let k = 0; k < dim; k++) {
                    let v = dv[get[a.componentType]](start + i * stride + k * size, true);
                    if (a.normalized) {
                        const den = { 5120: 127, 5121: 255, 5122: 32767, 5123: 65535 }[a.componentType];
                        if (den)
                            v = Math.max(-1, v / den);
                    }
                    out[i * dim + k] = v;
                } return out; }
            const textures = [];
            for (const t of json.textures || []) {
                let image = json.images[t.source];
                if (!image || image.bufferView === undefined)
                    throw Error('Les textures doivent être embarquées dans le GLB.');
                if (!['image/png', 'image/jpeg'].includes(image.mimeType))
                    throw Error('Textures PNG ou JPEG embarquées uniquement.');
                let bv = json.bufferViews[image.bufferView], bytes = bin.slice(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength), blob = new Blob([bytes], { type: image.mimeType || 'image/png' }), bitmap;
                if (root.createImageBitmap)
                    bitmap = await createImageBitmap(blob);
                else
                    bitmap = await new Promise((resolve, reject) => { let im = new Image(), url = URL.createObjectURL(blob); im.onload = () => { URL.revokeObjectURL(url); resolve(im); }; im.onerror = () => { URL.revokeObjectURL(url); reject(Error('Texture illisible.')); }; im.src = url; });
                const gl = this.gl, tex = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                bitmap.close?.();
                textures.push(tex);
            }
            const nodes = (json.nodes || []).map(n => { let o = node(n.name, n.translation || [0, 0, 0], n.scale || [1, 1, 1]); o.q = n.rotation || [0, 0, 0, 1]; if (n.matrix)
                o.matrix = new Float32Array(n.matrix); return o; });
            for (let i = 0; i < nodes.length; i++)
                for (const ch of json.nodes[i].children || []) {
                    if (!nodes[ch] || ch === i || nodes[ch].parent)
                        throw Error('Hiérarchie GLB invalide.');
                    add(nodes[i], nodes[ch]);
                }
            // Detect malformed cycles before recursive traversal.
            const visiting = new Set(), visited = new Set();
            function visit(i) { if (visiting.has(i))
                throw Error('Cycle dans la hiérarchie GLB.'); if (visited.has(i))
                return; visiting.add(i); for (const ch of json.nodes[i].children || [])
                visit(ch); visiting.delete(i); visited.add(i); }
            nodes.forEach((_, i) => visit(i));
            const rootNode = node(name);
            let roots = json.scenes?.[json.scene || 0]?.nodes || nodes.map((_, i) => i).filter(i => !nodes[i].parent);
            for (const i of roots) {
                if (!nodes[i])
                    throw Error('Scène GLB invalide.');
                add(rootNode, nodes[i]);
            }
            const skins = (json.skins || []).map(s => { if (s.joints.length > 256)
                throw Error('Limite : 256 articulations par squelette.'); let ib = s.inverseBindMatrices === undefined ? null : acc(s.inverseBindMatrices); return { joints: s.joints.map(i => { if (!nodes[i])
                    throw Error('Articulation GLB absente.'); return nodes[i]; }), inverse: s.joints.map((_, i) => ib ? ib.slice(i * 16, i * 16 + 16) : I()) }; });
            const geos = [];
            let triangles = 0;
            for (let i = 0; i < nodes.length; i++) {
                let source = json.nodes[i];
                if (source.mesh === undefined)
                    continue;
                for (const pr of json.meshes[source.mesh].primitives) {
                    if (pr.mode !== undefined && pr.mode !== 4)
                        throw Error('Seules les surfaces triangulées sont prises en charge.');
                    if (pr.targets?.length)
                        throw Error('Morph targets non pris en charge dans cette version ; exporter sans blendshapes.');
                    let p = acc(pr.attributes.POSITION), indices = pr.indices === undefined ? Uint32Array.from({ length: p.length / 3 }, (_, i) => i) : new Uint32Array(acc(pr.indices));
                    if (indices.length % 3 || indices.some(i => i >= p.length / 3))
                        throw Error('Indices GLB invalides.');
                    triangles += indices.length / 3;
                    if (triangles > 500000)
                        throw Error('Limite : 500 000 triangles.');
                    let normals = pr.attributes.NORMAL === undefined ? new Float32Array(p.length) : acc(pr.attributes.NORMAL);
                    if (pr.attributes.NORMAL === undefined) {
                        for (let k = 0; k < indices.length; k += 3) {
                            let a = indices[k], b = indices[k + 1], c = indices[k + 2], n = cross(vsub(Array.from(p.slice(b * 3, b * 3 + 3)), Array.from(p.slice(a * 3, a * 3 + 3))), vsub(Array.from(p.slice(c * 3, c * 3 + 3)), Array.from(p.slice(a * 3, a * 3 + 3))));
                            for (const v of [a, b, c])
                                for (let j = 0; j < 3; j++)
                                    normals[v * 3 + j] += n[j];
                        }
                        for (let k = 0; k < normals.length; k += 3)
                            normals.set(norm(Array.from(normals.slice(k, k + 3))), k);
                    }
                    let joints = pr.attributes.JOINTS_0 === undefined ? null : acc(pr.attributes.JOINTS_0), weights = pr.attributes.WEIGHTS_0 === undefined ? null : acc(pr.attributes.WEIGHTS_0);
                    if (source.skin !== undefined && (!joints || !weights))
                        throw Error('Poids de squelette manquants.');
                    if (joints && joints.some(j => j >= skins[source.skin]?.joints.length))
                        throw Error('Index de squelette invalide.');
                    let data = this.upload({ positions: p, normals, uv: pr.attributes.TEXCOORD_0 === undefined ? null : acc(pr.attributes.TEXCOORD_0), joints, weights, indices });
                    geos.push(data);
                    let part = add(nodes[i], node('primitive'));
                    part.geo = data;
                    let material = json.materials?.[pr.material] || {}, pbr = material.pbrMetallicRoughness || {};
                    part.color = pbr.baseColorFactor || [.8, .8, .8, 1];
                    part.texture = textures[pbr.baseColorTexture?.index];
                    part.glow = material.extensions?.KHR_materials_unlit ? .5 : 0;
                    if (source.skin !== undefined)
                        part.skin = skins[source.skin];
                }
            }
            world(rootNode);
            let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
            function bounds(n) { if (n.geo)
                for (let k = 0; k < n.geo.positions.length; k += 3) {
                    let p = point(n.world, n.geo.positions.slice(k, k + 3));
                    for (let j = 0; j < 3; j++) {
                        min[j] = Math.min(min[j], p[j]);
                        max[j] = Math.max(max[j], p[j]);
                    }
                } n.children.forEach(bounds); }
            bounds(rootNode);
            if (!Number.isFinite(min[1]))
                throw Error('Aucun maillage visible dans ce GLB.');
            let scale = 3 / (max[1] - min[1] || 1);
            rootNode.s = [scale, scale, scale];
            rootNode.p = [-(min[0] + max[0]) / 2 * scale, -min[1] * scale, -(min[2] + max[2]) / 2 * scale];
            const clips = (json.animations || []).map((a, i) => { const channels = a.channels.map(ch => { let s = a.samplers[ch.sampler]; if (s.interpolation && !['LINEAR', 'STEP'].includes(s.interpolation))
                throw Error('Animations LINEAR ou STEP uniquement : convertir les clés CUBICSPLINE.'); if (!['translation', 'rotation', 'scale'].includes(ch.target.path))
                throw Error('Piste d’animation GLB non prise en charge.'); const times = acc(s.input), values = acc(s.output), dim = ch.target.path === 'rotation' ? 4 : 3; if (!nodes[ch.target.node] || !times.length || values.length !== times.length * dim || times.some((t, i) => !Number.isFinite(t) || t < 0 || (i > 0 && t <= times[i - 1])) || values.some(v => !Number.isFinite(v)))
                throw Error('Clés d’animation GLB invalides.'); return { node: nodes[ch.target.node], path: ch.target.path, times, values, interpolation: s.interpolation || 'LINEAR' }; }); return { name: a.name || `Animation ${i + 1}`, duration: Math.max(0, ...channels.map(c => c.times.at(-1))), channels }; });
            const loaded = { root: rootNode,baseScale:[...rootNode.s],basePosition:[...rootNode.p], nodes, clips, clipIndex: 0, textures, geos, name, triangles };
            this.clearCustom();
            this.custom = loaded;
            return { name, triangles, clips: clips.map(c => c.name), skinned: skins.length > 0 };
        }
        animateGLB(model, time) { let clip = model.clips[model.clipIndex]; if (!clip)
            return; let t = clip.duration ? time % clip.duration : 0; for (const c of clip.channels) {
            const size = c.path === 'rotation' ? 4 : 3;
            let i = 0;
            while (i < c.times.length - 2 && c.times[i + 1] < t)
                i++;
            let j = Math.min(i + 1, c.times.length - 1), a = Array.from(c.values.slice(i * size, (i + 1) * size)), b = Array.from(c.values.slice(j * size, (j + 1) * size)), f = c.interpolation === 'STEP' || i === j ? 0 : C.clamp((t - c.times[i]) / (c.times[j] - c.times[i] || 1), 0, 1);
            let v = c.path === 'rotation' ? slerp(a, b, f) : a.map((x, k) => x + (b[k] - x) * f);
            delete c.node.matrix;
            c.node[c.path === 'translation' ? 'p' : c.path === 'rotation' ? 'q' : 's'] = v;
        } }
        clearCustom() { this.custom?.secondaryWorld?.dispose(); if (!this.custom)
            return; for (const g of this.custom.geos) {
            this.gl.deleteVertexArray(g.vao);
            g.buffers.forEach(b => this.gl.deleteBuffer(b));
        } this.custom.textures.forEach(t => this.gl.deleteTexture(t)); this.custom = null; }
        screenshot() { return this.canvas.toDataURL('image/png'); }
    }
    root.PulseStage = { Stage, AVATARS, STAGES, math: { I, mul, trs, inv, lookAt, perspective, quatEuler, point, slerp }, geometry };
    if (typeof module !== 'undefined')
        module.exports = root.PulseStage;
})(typeof globalThis !== 'undefined' ? globalThis : this);
