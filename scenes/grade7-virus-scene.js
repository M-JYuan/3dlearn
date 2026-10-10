window.Grade7VirusScene = class Grade7VirusScene {
    constructor(scene, camera, renderer) {
        Object.assign(this, {
            scene, camera, renderer, id: 'grade7-virus', group: null, lights: [], interactables: [],
            kind: 'animal', phase: 'idle', slot: 0, leaveFrom: 0, leaveT: 0, mix: 0, contrast: false,
            nudge: 0, clock: 0, bodies: {}, kidGroups: {}, hostWrap: {}, cellMeshes: [], marks: [],
            btns: {}, caption: null, nameTag: null, vIn: new THREE.Vector3(), vIdle: new THREE.Vector3()
        });
    }

    init() {
        this.camera.position.set(0.35, 2.85, 9.15);
        this.scene.background = new THREE.Color(0xe6eef7);
        this.setupLights();
        this.group = new THREE.Group();
        this.group.name = this.id;
        this.scene.add(this.group);
        const floor = this.part(this.group, new THREE.CircleGeometry(6.2, 40), 0xd5e3ef, 1, 0, 0, 0);
        floor.rotation.x = -Math.PI / 2;
        this.build();
        this.setupUI();
        this.setKind('animal');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xfff8f2, 0.74);
        const key = new THREE.DirectionalLight(0xffffff, 0.86);
        key.position.set(5, 9, 6);
        const fill = new THREE.DirectionalLight(0xd5e4ff, 0.34);
        fill.position.set(-6, 3, -4);
        this.lights.push(ambient, key, fill);
        this.lights.forEach((light) => this.scene.add(light));
    }

    material(color, opacity) {
        const transparent = opacity < 0.98;
        return new THREE.MeshStandardMaterial({
            color, roughness: 0.46, metalness: 0.04, transparent, opacity, depthWrite: !transparent
        });
    }

    part(parent, geometry, color, opacity, x, y, z) {
        const mesh = new THREE.Mesh(geometry, this.material(color, opacity));
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    tag(mesh, name, description) {
        mesh.userData.name = name;
        mesh.userData.description = description;
        this.interactables.push(mesh);
        return mesh;
    }

    makeSprite(text, sx, sy) {
        const canvas = document.createElement('canvas');
        canvas.width = 768;
        canvas.height = 128;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
        sprite.userData.canvas = canvas;
        sprite.scale.set(sx, sy, 1);
        this.writeSprite(sprite, text);
        return sprite;
    }

    writeSprite(sprite, text) {
        const canvas = sprite.userData.canvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#1c3348';
        ctx.font = '600 52px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.map = new THREE.CanvasTexture(canvas);
        sprite.material.needsUpdate = true;
    }

    makeVirus(kind, clickable) {
        const g = new THREE.Group();
        let coat;
        let gene;
        if (kind === 'animal') {
            coat = this.part(g, new THREE.SphereGeometry(0.66, 28, 20), 0x7eafd8, 0.42, 0, 0, 0);
            gene = this.part(g, new THREE.SphereGeometry(0.28, 18, 14), 0xf2c14e, 1, 0, 0, 0);
        } else if (kind === 'plant') {
            coat = this.part(g, new THREE.CylinderGeometry(0.24, 0.24, 1.48, 18), 0x6aaa5e, 0.5, 0, 0, 0);
            gene = this.part(g, new THREE.CylinderGeometry(0.08, 0.08, 1.12, 12), 0xf2c14e, 1, 0, 0, 0);
            g.rotation.z = Math.PI / 2;
        } else {
            coat = this.part(g, new THREE.SphereGeometry(0.46, 20, 16), 0xc56b90, 0.48, 0, 0.34, 0);
            gene = this.part(g, new THREE.SphereGeometry(0.18, 16, 12), 0xf2c14e, 1, 0, 0.34, 0);
            const tail = this.part(g, new THREE.CylinderGeometry(0.09, 0.13, 0.58, 12), 0xe0a8bf, 1, 0, -0.18, 0);
            if (clickable) this.tag(tail, '蛋白质外壳', '尾巴同样属于蛋白质外壳，不是细胞膜，也不是另外一套细胞结构。');
        }
        coat.renderOrder = 2;
        gene.renderOrder = 1;
        if (clickable) {
            this.tag(coat, '蛋白质外壳', '病毒外面只有蛋白质外壳，没有细胞壁、细胞膜、细胞质和细胞核。');
            this.tag(gene, '遗传物质', '遗传物质包在外壳里面。病毒独自停在细胞外时，生活活动并不进行。');
        }
        g.visible = kind === 'animal';
        return g;
    }

    build() {
        ['animal', 'plant', 'phage'].forEach((kind) => {
            const wrap = new THREE.Group();
            wrap.visible = kind === 'animal';
            this.group.add(wrap);
            this.hostWrap[kind] = wrap;
            this.cell(kind, 0);
            this.cell(kind, 1);
            const body = this.makeVirus(kind, true);
            this.group.add(body);
            this.bodies[kind] = body;
            this.kidGroups[kind] = [];
            for (let i = 0; i < 4; i += 1) {
                const kid = this.makeVirus(kind, false);
                kid.visible = false;
                this.group.add(kid);
                this.kidGroups[kind].push(kid);
            }
        });
        const marks = [
            [-2.15, '营养', '病毒不能独自获取营养，得进入活细胞才用得到其中的物质。'],
            [-0.72, '废物', '病毒不能独自排出废物。离开活细胞，这项活动就停着。'],
            [0.72, '反应', '病毒不能独自察觉刺激并作出反应。'],
            [2.15, '繁殖', '病毒不能独自繁殖，新颗粒要靠活细胞里的物质才能形成。']
        ];
        marks.forEach(([x, name, description]) => {
            const g = new THREE.Group();
            g.position.set(x, 2.2, 1.2);
            const a = this.part(g, new THREE.BoxGeometry(0.58, 0.07, 0.07), 0xd15d52, 1, 0, 0, 0);
            const b = this.part(g, new THREE.BoxGeometry(0.58, 0.07, 0.07), 0xd15d52, 1, 0, 0, 0);
            a.rotation.z = 0.75;
            b.rotation.z = -0.75;
            this.tag(a, name, description);
            g.visible = false;
            this.group.add(g);
            this.marks.push(g);
        });
        this.banner = this.makeSprite('蛋白质外壳 + 遗传物质', 4.3, 0.72);
        this.banner.position.set(0.3, 3.15, -0.2);
        this.group.add(this.banner);
        this.nameTag = this.makeSprite('动物病毒', 2.5, 0.52);
        this.group.add(this.nameTag);
    }

    cell(kind, slot) {
        const x = slot === 0 ? -1.7 : 2.55;
        const color = kind === 'plant' ? 0xc6e2b5 : (kind === 'phage' ? 0xf0d0a6 : 0xffc8b4);
        const mesh = this.part(this.hostWrap[kind], new THREE.SphereGeometry(kind === 'phage' ? 0.95 : 1.5, 28, 20), color, 0.24, x, 1.15, 0);
        if (kind === 'phage') mesh.scale.set(1.5, 0.82, 0.82);
        mesh.userData.kind = kind;
        mesh.userData.slot = slot;
        this.tag(mesh, '活细胞', '病毒不能独立生活，必须寄生在活细胞中。');
        this.cellMeshes.push(mesh);
    }

    setupUI() {
        this.setInfo('病毒', '病毒不能独自生活。');
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.innerHTML = '';
        const caption = document.createElement('p');
        caption.id = this.id + '-caption';
        caption.style.cssText = 'margin:0 0 8px;line-height:1.45;';
        controls.appendChild(caption);
        this.caption = caption;
        const defs = [
            ['animal', '动物病毒', () => this.setKind('animal')],
            ['plant', '植物病毒', () => this.setKind('plant')],
            ['phage', '噬菌体', () => this.setKind('phage')],
            ['enter', '侵入活细胞', () => this.enter()],
            ['leave', '离开细胞', () => this.leave()],
            ['contrast', '对照生命特征', () => this.toggleContrast()]
        ];
        defs.forEach(([suffix, label, fn]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'control-btn';
            btn.id = this.id + '-' + suffix;
            btn.textContent = label;
            btn.style.margin = '4px';
            btn.addEventListener('click', fn);
            controls.appendChild(btn);
            this.btns[suffix] = btn;
        });
    }

    setKind(kind) {
        this.kind = kind;
        this.contrast = false;
        this.apply();
        this.note();
    }

    enter() {
        this.contrast = false;
        if (this.phase === 'leaving') this.slot = this.leaveFrom;
        this.phase = 'inside';
        this.leaveT = 0;
        this.apply();
        this.note();
    }

    leave() {
        this.contrast = false;
        if (this.phase !== 'inside') {
            this.nudge = 1;
            this.apply();
            this.note();
            return;
        }
        this.phase = 'leaving';
        this.leaveFrom = this.slot;
        this.leaveT = 0;
        this.apply();
        this.note();
    }

    toggleContrast() {
        this.contrast = !this.contrast;
        if (this.contrast) {
            this.phase = 'idle';
            this.leaveT = 0;
            this.mix = 0;
            this.slot = 0;
        }
        this.apply();
        this.note();
    }

    insideVec(slot) {
        return this.vIn.set(slot === 0 ? -1.7 : 2.55, 1.16, 0);
    }

    idleVec(slot) {
        return this.vIdle.set(slot === 0 ? -4.15 : 4.9, 1.24, 0);
    }

    placeMain(body) {
        let x;
        let y;
        if (this.contrast) {
            x = -3.9;
            y = 1.28;
        } else if (this.phase === 'leaving') {
            const a = this.insideVec(this.leaveFrom);
            const b = this.idleVec(1 - this.leaveFrom);
            x = a.x + (b.x - a.x) * this.leaveT;
            y = a.y + (b.y - a.y) * this.leaveT;
        } else {
            const a = this.idleVec(this.slot);
            const b = this.insideVec(this.slot);
            x = a.x + (b.x - a.x) * this.mix;
            y = a.y + (b.y - a.y) * this.mix;
        }
        const bob = Math.sin(this.clock * 1.6) * (this.phase === 'idle' && !this.contrast ? 0.1 : 0.025);
        const nudge = this.nudge > 0 ? Math.sin(this.clock * 24) * 0.18 * this.nudge : 0;
        body.position.set(x + nudge, y + bob, this.contrast ? 0.55 : 0);
    }

    apply() {
        ['animal', 'plant', 'phage'].forEach((kind) => {
            const on = kind === this.kind;
            this.bodies[kind].visible = on;
            this.hostWrap[kind].visible = on;
        });
        const body = this.bodies[this.kind];
        this.placeMain(body);
        const snug = this.kind === 'phage' ? 0.58 : (this.kind === 'plant' ? 0.7 : 0.76);
        let fit = 1;
        if (!this.contrast && this.phase !== 'idle') {
            const outAmt = this.phase === 'leaving' ? this.leaveT : (1 - this.mix);
            fit = snug + (1 - snug) * outAmt;
        }
        body.scale.setScalar(fit);
        const showKids = !this.contrast && ((this.phase === 'inside' && this.mix > 0.55) || this.phase === 'leaving');
        const pop = this.phase === 'leaving' ? 1 : Math.min(1, (this.mix - 0.55) / 0.4);
        ['animal', 'plant', 'phage'].forEach((kind) => {
            this.kidGroups[kind].forEach((kid, index) => {
                kid.visible = showKids && kind === this.kind;
                if (!kid.visible) return;
                const ang = this.clock * 0.85 + index * (Math.PI / 2);
                let cx;
                let cy;
                let radial = this.kind === 'phage' ? 0.26 : 0.44;
                if (this.phase === 'leaving') {
                    const a = this.insideVec(this.leaveFrom);
                    const b = this.idleVec(1 - this.leaveFrom);
                    cx = a.x + (b.x - a.x) * this.leaveT;
                    cy = a.y + (b.y - a.y) * this.leaveT;
                    radial *= 1 - this.leaveT;
                } else {
                    const c = this.insideVec(this.slot);
                    cx = c.x;
                    cy = c.y;
                }
                kid.position.set(cx + Math.cos(ang) * radial, cy + Math.sin(this.clock * 1.2 + index) * 0.12, Math.sin(ang) * radial);
                kid.scale.setScalar(0.34 * pop);
            });
        });
        this.marks.forEach((mark) => {
            mark.visible = this.contrast;
        });
        if (this.nameTag) this.nameTag.position.set(body.position.x, body.position.y + 1.35, body.position.z);
        this.cellMeshes.forEach((mesh) => {
            if (mesh.userData.kind !== this.kind) return;
            let op = mesh.userData.slot === this.slot ? 0.28 : 0.14;
            if (this.contrast) op = 0.05;
            if (this.phase === 'leaving' && mesh.userData.slot !== this.leaveFrom) op = 0.36;
            mesh.material.opacity = op;
        });
    }

    note() {
        const size = '病毒比细胞小得多，它们的大小用纳米来表示。';
        const parts = '不论外形如何，都只有蛋白质外壳和内部的遗传物质，没有细胞壁、细胞膜、细胞质和细胞核。';
        let title = '病毒';
        let lead = '病毒不能独自生活，必须寄生在活细胞里。';
        if (this.kind === 'animal') {
            title = '动物病毒';
            lead = '腺病毒、流感病毒、HIV 和新冠病毒都是动物病毒。流感、艾滋病、禽流感，以及植物的萝卜花叶病，都由病毒引起。';
        } else if (this.kind === 'plant') {
            title = '植物病毒';
            lead = '烟草花叶病毒是植物病毒，颗粒呈杆状。';
        } else {
            title = '噬菌体';
            lead = '大肠杆菌噬菌体侵染细菌。细菌是活细胞，噬菌体离开活细胞就不能继续这些生活活动。';
        }
        let state;
        if (this.contrast) {
            title = '对照生命特征';
            state = '病毒是生物，但并不是由细胞构成的。获取营养、排出废物、对刺激作出反应和繁殖，它都不能独自完成。';
        } else if (this.phase === 'inside') {
            state = '进入活细胞以后，它使用自己携带的遗传信息，并利用活细胞里的物质，出现新的病毒颗粒。';
        } else if (this.phase === 'leaving') {
            state = '新颗粒可以离开细胞，再去侵染另一个活细胞。一离开，它们就回到不进行生活活动的静止颗粒。';
        } else if (this.slot === 1) {
            state = '它已经离开原来的细胞，停在另一个活细胞外面，重新成为静止颗粒，生活活动没有在进行。';
        } else if (this.nudge > 0) {
            state = '它此刻就在细胞外面，已经是静止颗粒，并没有正在进行的生活活动。';
        } else {
            state = '待在活细胞外面时，病毒只是一颗静止的颗粒，生活活动并没有进行。';
        }
        this.setInfo(title, lead + state + parts + size);
        if (this.caption) this.caption.textContent = size;
        if (this.nameTag) this.writeSprite(this.nameTag, this.contrast ? '是生物，但不是细胞' : title);
        const phage = this.kind === 'phage';
        this.cellMeshes.forEach((mesh) => {
            if (mesh.userData.kind !== this.kind) return;
            const current = mesh.userData.slot === (this.phase === 'leaving' ? this.leaveFrom : this.slot);
            mesh.userData.name = phage ? (current ? '细菌' : '另一个细菌') : (current ? '活细胞' : '另一个活细胞');
            mesh.userData.description = phage
                ? '大肠杆菌噬菌体侵染细菌。细菌是活细胞，噬菌体必须寄生其中，不能独自生活。'
                : '这是供病毒寄生的活细胞。病毒本身没有细胞结构。';
        });
        Object.keys(this.btns).forEach((key) => {
            const on = key === this.kind || (key === 'contrast' && this.contrast) || (key === 'enter' && this.phase === 'inside') || (key === 'leave' && this.phase === 'leaving');
            this.btns[key].style.outline = on ? '2px solid #2c6b4a' : '';
        });
    }

    setInfo(title, text) {
        const titleEl = document.getElementById('info-title');
        const bodyEl = document.getElementById('info-content');
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.textContent = text;
    }

    animate(time, delta) {
        this.clock += delta;
        if (this.nudge > 0) this.nudge = Math.max(0, this.nudge - delta);
        if (this.contrast) this.mix += (0 - this.mix) * Math.min(1, delta * 4);
        else if (this.phase === 'leaving') {
            this.leaveT += delta * 0.52;
            if (this.leaveT >= 1) {
                this.slot = 1 - this.leaveFrom;
                this.phase = 'idle';
                this.leaveT = 0;
                this.mix = 0;
                this.note();
            }
        } else this.mix += ((this.phase === 'inside' ? 1 : 0) - this.mix) * Math.min(1, delta * 3.2);
        this.apply();
        const body = this.bodies[this.kind];
        if (body) body.rotation.y += delta * 0.45;
        (this.kidGroups[this.kind] || []).forEach((kid) => { kid.rotation.y += delta * 0.7; });
    }

    getInteractables() { return this.interactables; }

    dispose() {
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        const seen = new Set();
        if (this.group) {
            this.group.traverse((node) => {
                [node.geometry].concat(node.material || []).forEach((item) => {
                    if (!item || seen.has(item)) return;
                    seen.add(item);
                    if (item.map) item.map.dispose();
                    item.dispose();
                });
            });
            this.scene.remove(this.group);
            this.group = null;
        }
        this.interactables = [];
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
    }
};
