window.Grade7CellModelScene = class Grade7CellModelScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-cell-model';
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.made = [];
        this.anim = {};
        this.kind = 'animal';
        this.flow = false;
        this.t = 0;
        this.on = { wall: false, membrane: false, cytoplasm: false, nucleus: false, mitochondrion: false, vacuole: false, chloroplast: false };
        this.names = { wall: '细胞壁', membrane: '细胞膜', cytoplasm: '细胞质', nucleus: '细胞核', mitochondrion: '线粒体', vacuole: '大液泡', chloroplast: '叶绿体' };
    }

    init() {
        this.camera.position.set(2.5, 2.15, 4.5);
        this.camera.lookAt(0, 1.15, 0);
        this.scene.background = new THREE.Color(0xf3f6fb);
        this.addLight(new THREE.AmbientLight(0xffffff, 0.7));
        const sun = new THREE.DirectionalLight(0xfff8ee, 0.95);
        sun.position.set(4, 7, 4);
        this.addLight(sun);
        const fill = new THREE.DirectionalLight(0xd5e4ff, 0.4);
        fill.position.set(-4, 3, -2);
        this.addLight(fill);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.setupUI();
        this.rebuild();
    }

    addLight(light) { this.scene.add(light); this.lights.push(light); }

    part(parent, geo, color, x, y, z, o) {
        o = o || {};
        const op = o.op == null ? 1 : o.op;
        const mat = new THREE.MeshStandardMaterial({
            color: color, roughness: o.rough == null ? 0.45 : o.rough, metalness: 0.02,
            transparent: op < 1, opacity: op, depthWrite: op > 0.85, side: o.side || THREE.DoubleSide,
            emissive: new THREE.Color(o.glow || 0x000000), emissiveIntensity: o.glow ? 0.45 : 0
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.userData.base = o.scale ? o.scale.slice() : [1, 1, 1];
        mesh.scale.set(mesh.userData.base[0], mesh.userData.base[1], mesh.userData.base[2]);
        if (o.rot) mesh.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
        mesh.renderOrder = o.order || 0;
        parent.add(mesh);
        this.made.push(mesh);
        if (o.name) {
            mesh.userData.name = o.name;
            mesh.userData.description = o.desc || o.name;
            this.interactables.push(mesh);
        }
        return mesh;
    }

    note(text, x, y, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024; canvas.height = 160;
        const pen = canvas.getContext('2d');
        pen.fillStyle = 'rgba(255,248,246,0.95)'; pen.fillRect(0, 0, 1024, 160);
        pen.strokeStyle = '#a12626'; pen.lineWidth = 10; pen.strokeRect(8, 8, 1008, 144);
        pen.fillStyle = '#6d1d1d'; pen.font = '52px sans-serif'; pen.fillText(text, 36, 100);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.52), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        mesh.position.set(x, y, z);
        this.group.add(mesh); this.made.push(mesh);
        this.anim.labels = this.anim.labels || []; this.anim.labels.push(mesh);
    }

    wipe() {
        this.made.forEach((mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (mesh.material.map) mesh.material.map.dispose();
                mesh.material.dispose();
            }
        });
        this.made = [];
        this.interactables.splice(0);
        this.anim = { mito: [], chloro: [], bits: [], labels: [] };
        if (!this.group) return;
        while (this.group.children.length) this.group.remove(this.group.children[0]);
    }

    spec() {
        if (this.kind === 'animal') return { title: '动物细胞', need: ['membrane', 'cytoplasm', 'nucleus', 'mitochondrion'], ban: ['wall', 'vacuole', 'chloroplast'], blurb: '动物细胞要有细胞膜、细胞质、细胞核和线粒体，不要细胞壁、大液泡和叶绿体。' };
        if (this.kind === 'nongreen') return { title: '植物非绿色细胞', need: ['wall', 'membrane', 'cytoplasm', 'nucleus', 'mitochondrion', 'vacuole'], ban: ['chloroplast'], blurb: '例如洋葱表皮：有细胞壁、细胞膜、细胞质、细胞核、线粒体和大液泡，没有叶绿体。' };
        return { title: '植物绿色细胞', need: ['wall', 'membrane', 'cytoplasm', 'nucleus', 'mitochondrion', 'vacuole', 'chloroplast'], ban: [], blurb: '绿色植物细胞在细胞壁、细胞膜、细胞质、细胞核、线粒体和大液泡之外，还要有叶绿体。' };
    }

    explain() {
        const spec = this.spec();
        const missing = spec.need.filter((key) => !this.on[key]).map((key) => this.names[key]);
        const extra = spec.ban.filter((key) => this.on[key]).map((key) => this.names[key]);
        const ok = missing.length === 0 && extra.length === 0;
        const lines = [
            spec.blurb,
            ok ? '科学性：完整。该有的结构都在，不该出现的结构也没有。' : '科学性：还没有完整。',
            missing.length ? '还缺少：' + missing.join('、') + '。' : '需要的结构没有缺少。',
            extra.length ? '多放了：' + extra.join('、') + '。' : '没有多放不该出现的结构。',
            '内质网、高尔基体和核糖体：本书不要求，模型里不应出现。',
            '艺术性和创新性由课堂评价，这里只检查科学性。',
            '制作时可以用橡皮泥、立体贺卡、计算机模型或3D打印。现在这个是计算机模型。'
        ];
        const title = document.getElementById('info-title');
        const body = document.getElementById('info-content');
        if (title) title.textContent = ok ? spec.title + ' · 科学性完整' : spec.title;
        if (body) {
            body.innerHTML = '';
            lines.forEach((line) => {
                const p = document.createElement('p');
                p.textContent = line;
                body.appendChild(p);
            });
        }
        return ok;
    }

    paint() {
        const spec = this.spec();
        Object.keys(this.on).forEach((key) => {
            const button = document.getElementById(this.id + '-' + key);
            if (!button) return;
            button.textContent = this.names[key] + (this.on[key] ? '：已放入' : '：未放入');
            const wrong = (spec.ban.indexOf(key) !== -1 && this.on[key]) || (spec.need.indexOf(key) !== -1 && !this.on[key]);
            button.style.boxShadow = this.on[key] ? 'inset 0 0 0 2px #1f6b4a' : '';
            button.style.color = wrong ? '#a12626' : '';
        });
        ['animal', 'nongreen', 'green'].forEach((kind) => {
            const button = document.getElementById(this.id + '-' + kind);
            if (button) button.style.boxShadow = this.kind === kind ? 'inset 0 0 0 2px #1f6b4a' : '';
        });
        const flow = document.getElementById(this.id + '-flow');
        if (flow) flow.style.boxShadow = this.flow ? 'inset 0 0 0 2px #1f6b4a' : '';
    }

    setupUI() {
        const box = document.getElementById('scene-controls');
        if (!box) return;
        box.innerHTML = '';
        const items = [
            ['animal', '动物细胞', () => this.setKind('animal')],
            ['nongreen', '植物非绿色细胞', () => this.setKind('nongreen')],
            ['green', '植物绿色细胞', () => this.setKind('green')],
            ['wall', '细胞壁', () => this.toggle('wall')],
            ['membrane', '细胞膜', () => this.toggle('membrane')],
            ['cytoplasm', '细胞质', () => this.toggle('cytoplasm')],
            ['nucleus', '细胞核', () => this.toggle('nucleus')],
            ['mitochondrion', '线粒体', () => this.toggle('mitochondrion')],
            ['vacuole', '大液泡', () => this.toggle('vacuole')],
            ['chloroplast', '叶绿体', () => this.toggle('chloroplast')],
            ['er', '内质网', () => this.reject('er', '内质网')],
            ['golgi', '高尔基体', () => this.reject('golgi', '高尔基体')],
            ['ribosome', '核糖体', () => this.reject('ribosome', '核糖体')],
            ['flow', '物质进出', () => this.toggleFlow()],
            ['clear', '清空', () => this.clearAll()]
        ];
        items.forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.id = this.id + '-' + item[0];
            button.className = 'control-btn';
            button.textContent = item[1];
            button.addEventListener('click', item[2]);
            box.appendChild(button);
        });
    }

    setKind(kind) { this.kind = kind; this.rebuild(); }

    toggle(key) {
        this.on[key] = !this.on[key];
        if (!this.on.membrane) this.flow = false;
        this.rebuild();
    }

    clearAll() {
        Object.keys(this.on).forEach((key) => { this.on[key] = false; });
        this.flow = false;
        this.rebuild();
    }

    toggleFlow() {
        if (!this.on.membrane) {
            this.flow = false;
            this.rebuild();
            this.note('先放上细胞膜', 0, 2.55, 0);
            const body = document.getElementById('info-content');
            if (body) {
                const p = document.createElement('p');
                p.style.color = '#a12626';
                p.textContent = '要看物质怎样进出，需要先放入细胞膜。';
                body.insertBefore(p, body.firstChild);
            }
            return;
        }
        this.flow = !this.flow;
        this.rebuild();
    }

    reject(id, label) {
        this.rebuild();
        this.note('本书不要求' + label, 0, 2.55, 0);
        this.part(this.group, new THREE.RingGeometry(0.28, 0.36, 18), 0xc43737, 0, 2.15, 0.2);
        this.part(this.group, new THREE.BoxGeometry(0.62, 0.06, 0.04), 0xc43737, 0, 2.15, 0.24, { rot: [0, 0, 0.8] });
        const body = document.getElementById('info-content');
        if (body) {
            const p = document.createElement('p');
            p.style.color = '#a12626';
            p.textContent = '没有加入' + label + '。内质网、高尔基体和核糖体都不在本书这个制作活动里。';
            body.insertBefore(p, body.firstChild);
        }
        const title = document.getElementById('info-title');
        if (title) title.textContent = '本书不要求这个结构';
        const button = document.getElementById(this.id + '-' + id);
        if (button) button.style.boxShadow = 'inset 0 0 0 2px #a12626';
    }

    shell(scale, color, op, order, name, desc) {
        const geo = this.kind === 'animal'
            ? new THREE.SphereGeometry(1.15 * scale, 28, 20)
            : new THREE.BoxGeometry(2.3 * scale, 1.7 * scale, 2.3 * scale);
        return this.part(this.cell, geo, color, 0, 1.2, 0, { op: op, order: order, rough: 0.28, name: name, desc: desc });
    }

    rebuild() {
        this.wipe();
        this.part(this.group, new THREE.CylinderGeometry(1.85, 2.0, 0.18, 28), 0xd9d3c7, 0, 0.09, 0, { name: '模型台', desc: '这是计算机里的细胞模型。也可以用橡皮泥、立体贺卡或3D打印来做。' });
        this.cell = new THREE.Group();
        this.group.add(this.cell);
        if (this.on.wall) this.shell(1.06, 0xc8b48a, 0.28, 1, '细胞壁', '细胞壁用在植物细胞模型里。动物细胞不要放细胞壁。');
        if (this.on.membrane) this.shell(0.96, 0x7eb6e0, 0.38, 2, '细胞膜', '细胞需要的物质可以进来，有些物质被挡在外面，废物和分泌物可以排出去。');
        if (this.on.cytoplasm) this.shell(0.9, 0xf3e7a1, 0.16, 3, '细胞质', '细胞质填在细胞膜里面。');
        if (this.on.vacuole) this.part(this.cell, new THREE.SphereGeometry(0.58, 18, 14), 0x8fd4e8, 0.05, 1.18, 0, { op: 0.42, order: 4, name: '大液泡', desc: '大液泡用在植物细胞模型里。动物细胞不要放大液泡。' });
        if (this.on.nucleus) {
            const spot = this.on.vacuole ? [-0.58, 1.22, 0.12] : [0.12, 1.28, 0.08];
            const nucleus = this.part(this.cell, new THREE.SphereGeometry(0.3, 16, 14), 0x7a4db5, spot[0], spot[1], spot[2], { op: 0.4, order: 5, name: '细胞核', desc: '细胞核里的小点表示 DNA，DNA 主要标在细胞核中。' });
            [[0.2, 0.12, 0.05], [-0.16, 0.1, 0.14], [0.05, -0.2, 0.04], [-0.14, -0.08, -0.16], [0.16, 0.02, -0.16]].forEach((p) => {
                this.part(nucleus, new THREE.SphereGeometry(0.045, 8, 8), 0xffe38a, p[0], p[1], p[2], { order: 7, glow: 0xffd56a, name: 'DNA', desc: '这些小点表示 DNA，主要画在细胞核里。' });
            });
        }
        if (this.on.mitochondrion) {
            const spots = this.kind === 'animal' ? [[0.55, 1.15, 0.32], [-0.48, 0.9, 0.38], [0.1, 1.5, -0.38]] : [[0.78, 1.4, 0.5], [-0.82, 0.95, 0.32], [0.55, 0.85, -0.55]];
            spots.forEach((p) => {
                const mito = this.part(this.cell, new THREE.SphereGeometry(0.16, 12, 10), 0xd45d3a, p[0], p[1], p[2], { scale: [1.45, 0.72, 0.72], order: 6, name: '线粒体', desc: '线粒体把储存在有机物里的化学能释放出来。' });
                this.anim.mito.push(mito);
            });
        }
        if (this.on.chloroplast) {
            [[0.82, 1.5, 0.15], [-0.78, 1.42, -0.2], [0.35, 0.82, 0.72], [-0.3, 1.58, -0.5]].forEach((p, index) => {
                const leaf = this.part(this.cell, new THREE.SphereGeometry(0.14, 12, 10), 0x2f9e4a, p[0], p[1], p[2], { scale: [1.7, 0.75, 0.7], order: 6, name: '叶绿体', desc: '叶绿体把光能储存在有机物中。' });
                leaf.userData.baseY = p[1];
                leaf.rotation.y = index;
                this.anim.chloro.push(leaf);
            });
            this.part(this.group, new THREE.SphereGeometry(0.16, 12, 10), 0xffd35a, 2.15, 2.55, 0.8, { glow: 0xffc14a, name: '光', desc: '叶绿体把光能储存在有机物中。' });
            this.part(this.group, new THREE.CylinderGeometry(0.02, 0.12, 1.2, 8), 0xffe08a, 1.45, 2.05, 0.45, { op: 0.4, rot: [0.5, 0.2, 0.5] });
        }
        const ok = this.explain();
        if (ok) this.part(this.group, new THREE.TorusGeometry(1.72, 0.045, 8, 28), 0x2e9a57, 0, 0.24, 0, { rot: [Math.PI / 2, 0, 0], glow: 0x1f7a40, name: '科学性', desc: '需要的结构都在，不该有的结构没有放进去。艺术性和创新性留到课堂上评价。' });
        if (this.flow && this.on.membrane) this.addFlow();
        this.paint();
    }

    addFlow() {
        const specs = [
            { kind: 'in', color: 0x3cba6a, phase: 0.05, name: '需要的物质', desc: '细胞需要的物质可以通过细胞膜进入。' },
            { kind: 'in', color: 0x3cba6a, phase: 0.48, name: '需要的物质', desc: '细胞需要的物质可以通过细胞膜进入。' },
            { kind: 'block', color: 0x8d93a0, phase: 0.12, name: '被挡住的物质', desc: '有些物质不能进入，会被细胞膜挡住。' },
            { kind: 'block', color: 0x8d93a0, phase: 0.6, name: '被挡住的物质', desc: '有些物质不能进入，会被细胞膜挡住。' },
            { kind: 'out', color: 0xc47b3a, phase: 0.18, name: '排出的物质', desc: '废物和分泌物可以通过细胞膜排出去。' },
            { kind: 'out', color: 0xc47b3a, phase: 0.66, name: '排出的物质', desc: '废物和分泌物可以通过细胞膜排出去。' }
        ];
        specs.forEach((spec) => {
            const mesh = this.part(this.group, new THREE.SphereGeometry(0.07, 10, 8), spec.color, 2, 1.3, 0, { op: 0.95, order: 8, name: spec.name, desc: spec.desc });
            mesh.userData.flow = spec;
            this.anim.bits.push(mesh);
        });
    }

    animate(time, delta) {
        this.t += delta;
        if (!this.anim.mito) return;
        this.anim.mito.forEach((mito, index) => { mito.rotation.y = this.t * 0.8 + index; });
        this.anim.chloro.forEach((leaf, index) => { leaf.position.y = leaf.userData.baseY + Math.sin(this.t * 1.5 + index) * 0.04; });
        this.anim.bits.forEach((bit) => {
            const flow = bit.userData.flow;
            const u = (this.t * 0.22 + flow.phase) % 1;
            const fade = u < 0.06 || u > 0.94;
            bit.material.opacity = fade ? 0.05 : 0.95;
            if (flow.kind === 'in') bit.position.set(2.35 - Math.min(1, u / 0.7) * 2.2, 1.38, 0.2);
            else if (flow.kind === 'block') bit.position.set(-2.45 + Math.min(1, u / 0.45) * 1.15, 1.58, -0.15);
            else bit.position.set(0.1 + Math.min(1, u / 0.72) * 2.25, 0.88, -0.1);
        });
        (this.anim.labels || []).forEach((label) => label.lookAt(this.camera.position));
    }

    getInteractables() { return this.interactables; }

    dispose() {
        this.wipe();
        this.lights.forEach((light) => { this.scene.remove(light); if (light.dispose) light.dispose(); });
        this.lights = [];
        if (this.group) { this.scene.remove(this.group); this.group = null; }
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
        this.interactables.splice(0);
    }
};
