window.Grade7DollyScene = class Grade7DollyScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-dolly';
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.bWool = 0x8d4e2f;
        this.bMark = 0xf3ddb0;
        this.cLooks = [
            [0x394047, 0xe2b43c],
            [0x6d5a8a, 0xf7f7f7],
            [0xd9d3c7, 0x1f2937]
        ];
        this.cIndex = 0;
        this.fusing = false;
        this.lockTimer = null;
        this.disposed = false;
        this.fusionT = 0;
        this.eggHome = new THREE.Vector3(-2.15, 2.35, 0.85);
        this.cellHome = new THREE.Vector3(-0.15, 2.35, 0.85);
        this.meet = new THREE.Vector3(-1.15, 2.15, 1.35);
        this.roles = {
            A: 'A羊提供的是已经去掉细胞核的卵细胞。',
            B: 'B羊提供的是一整个乳腺细胞，细胞核还在这个细胞里面。',
            C: 'C羊只负责代孕，不决定多莉长什么样。'
        };
        this.captionText = '多莉长得像B羊。并进去的是完整乳腺细胞，不是把细胞核单独注射进去。细胞核里的遗传信息指导发育。';
    }

    init() {
        this.camera.position.set(0, 3.3, 9);
        this.scene.background = new THREE.Color(0xd7e7cf);
        this.setupLights();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        const ground = this.mesh(this.group, new THREE.CircleGeometry(6.2, 40), 0x8fbf78, 0, 0, 0);
        ground.rotation.x = -Math.PI / 2;
        ground.material.roughness = 1;
        this.rings = {
            A: this.ring(-3.25),
            B: this.ring(0),
            C: this.ring(3.25)
        };
        this.sheepA = this.makeSheep(0xf6f1ea, null, 'A', 'none');
        this.sheepB = this.makeSheep(this.bWool, this.bMark, 'B', 'flank');
        this.sheepC = this.makeSheep(this.cLooks[0][0], this.cLooks[0][1], 'C', 'tag');
        this.lamb = this.makeSheep(this.bWool, this.bMark, '多莉', 'flank');
        this.place(this.sheepA, -3.25, 'A');
        this.place(this.sheepB, 0, 'B');
        this.place(this.sheepC, 3.25, 'C');
        this.lamb.position.set(2.15, 0, 1.45);
        this.lamb.scale.setScalar(0.02);
        this.lamb.visible = false;
        this.group.add(this.lamb);
        this.lamb.userData.onClick = () => this.showCaption(this.captionText);
        this.interactables.push(this.lamb);
        this.buildCells();
        this.buildReadout();
        this.setupUI();
        this.showRole('B');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xfff8ee, 0.75);
        const sun = new THREE.DirectionalLight(0xffffff, 0.85);
        sun.position.set(5, 11, 6);
        const fill = new THREE.DirectionalLight(0xd5e2c4, 0.3);
        fill.position.set(-5, 3, -2);
        [ambient, sun, fill].forEach(light => {
            this.lights.push(light);
            this.scene.add(light);
        });
    }

    mesh(parent, geo, color, x, y, z) {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.02 });
        const obj = new THREE.Mesh(geo, mat);
        obj.position.set(x, y, z);
        parent.add(obj);
        return obj;
    }

    ring(x) {
        const mark = new THREE.Mesh(
            new THREE.RingGeometry(0.72, 0.86, 28),
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
        );
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(x, 0.02, 0);
        this.group.add(mark);
        return mark;
    }

    tagSprite(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(20,32,24,0.82)';
        ctx.fillRect(8, 28, 240, 72);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 56px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(canvas),
            transparent: true,
            depthTest: false
        }));
        sprite.scale.set(0.78, 0.39, 1);
        return sprite;
    }

    makeSheep(woolHex, markHex, label, markStyle) {
        const g = new THREE.Group();
        const wool = new THREE.MeshStandardMaterial({ color: woolHex, roughness: 0.95 });
        const skin = new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.8 });
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 14, 10), wool);
        body.scale.set(1.08, 0.78, 0.84);
        body.position.y = 0.98;
        g.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), skin);
        head.position.set(0, 1.16, 0.74);
        g.add(head);
        const earGeo = new THREE.SphereGeometry(0.12, 8, 6);
        [-0.2, 0.2].forEach(x => {
            const ear = new THREE.Mesh(earGeo, skin);
            ear.scale.set(0.7, 1.15, 0.45);
            ear.position.set(x, 1.32, 0.62);
            g.add(ear);
        });
        const legGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.55, 6);
        [[-0.28, 0.28], [0.28, 0.28], [-0.28, -0.18], [0.28, -0.18]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeo, skin);
            leg.position.set(x, 0.32, z);
            g.add(leg);
        });
        const markMat = new THREE.MeshStandardMaterial({ color: markHex == null ? woolHex : markHex, roughness: 0.6 });
        if (markStyle !== 'flank' && markStyle !== 'tag') markMat.dispose();
        if (markStyle === 'flank') {
            const patch = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), markMat);
            patch.scale.set(1.15, 0.65, 0.4);
            patch.position.set(-0.38, 1.08, 0.42);
            g.add(patch);
        } else if (markStyle === 'tag') {
            const tag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.04), markMat);
            tag.position.set(0.24, 1.2, 0.86);
            g.add(tag);
        }
        const name = this.tagSprite(label);
        name.position.set(0, 1.9, 0);
        if (label === '多莉') name.scale.set(1.7, 1.7, 1);
        g.add(name);
        g.userData.wool = wool;
        g.userData.mark = markMat;
        return g;
    }

    place(sheep, x, role) {
        sheep.position.set(x, 0, 0);
        sheep.userData.hoverTitle = role + '羊';
        sheep.userData.onClick = () => this.showRole(role);
        this.group.add(sheep);
        this.interactables.push(sheep);
    }

    buildCells() {
        this.egg = new THREE.Group();
        const shell = this.mesh(this.egg, new THREE.SphereGeometry(0.4, 18, 14), 0xf6e7a1, 0, 0, 0);
        shell.material.transparent = true;
        shell.material.opacity = 0.62;
        shell.material.depthWrite = false;
        const gap = new THREE.Mesh(
            new THREE.TorusGeometry(0.12, 0.02, 8, 18),
            new THREE.MeshStandardMaterial({ color: 0xc4b06a, roughness: 0.5 })
        );
        this.egg.add(gap);
        this.egg.position.copy(this.eggHome);
        this.group.add(this.egg);
        this.egg.add(this.tagSprite('去核卵'));
        this.egg.children[this.egg.children.length - 1].position.set(0, 0.62, 0);

        this.mammary = new THREE.Group();
        this.mammaryBody = this.mesh(this.mammary, new THREE.SphereGeometry(0.34, 16, 12), 0xf0a0b4, 0, 0, 0);
        this.mammaryBody.material.transparent = true;
        this.mammaryBody.material.opacity = 0.48;
        this.nucleus = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 14, 12),
            new THREE.MeshStandardMaterial({ color: 0x7eb6ff, roughness: 0.35, transparent: true, opacity: 0.9 })
        );
        this.mammary.add(this.nucleus);
        this.dna = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.045, 0),
            new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xc9a227, emissiveIntensity: 0.4, roughness: 0.4 })
        );
        this.nucleus.add(this.dna);
        this.dna.userData.hoverTitle = '遗传信息标记';
        this.dna.userData.onClick = () => this.flashLock();
        this.interactables.push(this.dna);
        this.mammary.position.copy(this.cellHome);
        this.group.add(this.mammary);
        const cellTag = this.tagSprite('完整细胞');
        cellTag.position.set(0, 0.58, 0);
        this.mammary.add(cellTag);
    }

    buildReadout() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 256;
        this.ctx = canvas.getContext('2d');
        this.tex = new THREE.CanvasTexture(canvas);
        this.captionSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, transparent: true, depthTest: false }));
        this.captionSprite.position.set(0, 3.15, 0.4);
        this.captionSprite.scale.set(7.8, 0.98, 1);
        this.group.add(this.captionSprite);
        this.paint(this.roles.B);
    }

    paint(text) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 2048, 256);
        ctx.fillStyle = '#102018';
        ctx.fillRect(24, 48, 2000, 160);
        ctx.fillStyle = '#f8f5ec';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let size = 60;
        ctx.font = '700 ' + size + 'px sans-serif';
        while (size > 32 && ctx.measureText(text).width > 1880) {
            size -= 4;
            ctx.font = '700 ' + size + 'px sans-serif';
        }
        ctx.fillText(text, 1024, 128);
        this.tex.needsUpdate = true;
    }

    setupUI() {
        const title = document.getElementById('info-title');
        const info = document.getElementById('info-content');
        const panel = document.getElementById('info-panel');
        if (title) title.textContent = '多莉为什么像B羊';
        if (panel) panel.classList.add('visible');
        if (info) {
            info.innerHTML = `
                <p id="${this.id}-role" style="margin:0 0 8px;">${this.roles.B}</p>
                <div id="${this.id}-caption" style="padding:8px 10px;border-radius:8px;background:#1f3d2e;color:#ecfdf3;font-weight:700;"></div>
                <div id="${this.id}-lock" style="margin-top:8px;padding:8px 10px;border-radius:8px;background:#3a3428;color:#f3e6c4;">结构怎样、怎样起作用，以后再学</div>
            `;
        }
        const bar = document.getElementById('scene-controls');
        if (!bar) return;
        bar.style.display = 'flex';
        bar.innerHTML = [
            ['role-a', 'A 去核卵细胞'],
            ['role-b', 'B 完整乳腺细胞'],
            ['role-c', 'C 只当代孕'],
            ['swap-c', '更换C羊'],
            ['fusion', '融合']
        ].map(([key, name]) =>
            `<button class="control-btn" id="${this.id}-btn-${key}" type="button">${name}</button>`
        ).join('');
        this.bind('role-a', () => this.showRole('A'));
        this.bind('role-b', () => this.showRole('B'));
        this.bind('role-c', () => this.showRole('C'));
        this.bind('swap-c', () => this.swapC());
        this.bind('fusion', () => this.startFusion());
        this.markBtn('role-b');
    }

    bind(key, fn) {
        const btn = document.getElementById(this.id + '-btn-' + key);
        if (btn) btn.onclick = fn;
    }

    markBtn(key) {
        ['role-a', 'role-b', 'role-c', 'swap-c', 'fusion'].forEach(name => {
            const btn = document.getElementById(this.id + '-btn-' + name);
            if (btn) btn.classList.toggle('active', name === key);
        });
    }

    showRole(role) {
        this.markBtn('role-' + role.toLowerCase());
        Object.keys(this.rings).forEach(name => {
            this.rings[name].material.color.setHex(name === role ? 0x2563eb : 0xffffff);
        });
        const el = document.getElementById(this.id + '-role');
        if (el) el.textContent = this.roles[role];
        if (!this.lamb.visible) this.paint(this.roles[role]);
    }

    showCaption(text) {
        const el = document.getElementById(this.id + '-caption');
        if (el) el.textContent = text;
        this.paint(text);
    }

    flashLock() {
        if (this.disposed) return;
        const lock = document.getElementById(this.id + '-lock');
        if (!lock) return;
        clearTimeout(this.lockTimer);
        lock.style.outline = '2px solid #f3e6c4';
        this.lockTimer = setTimeout(() => {
            this.lockTimer = null;
            if (!this.disposed) lock.style.outline = 'none';
        }, 700);
    }

    swapC() {
        this.cIndex = (this.cIndex + 1) % this.cLooks.length;
        const look = this.cLooks[this.cIndex];
        this.sheepC.userData.wool.color.setHex(look[0]);
        this.sheepC.userData.mark.color.setHex(look[1]);
        this.markBtn('swap-c');
        const el = document.getElementById(this.id + '-role');
        if (el) el.textContent = 'C羊的外形换过了。多莉仍然像B羊，C羊只负责代孕。';
        if (this.lamb.visible) this.showCaption(this.captionText);
    }

    prepareCells() {
        this.egg.position.copy(this.eggHome);
        this.egg.scale.setScalar(1);
        this.mammary.position.copy(this.cellHome);
        this.mammary.visible = true;
        this.mammaryBody.scale.setScalar(1);
        this.mammaryBody.material.opacity = 0.48;
        this.lamb.visible = false;
        this.lamb.scale.setScalar(0.02);
        if (this.nucleus.parent !== this.mammary) this.mammary.attach(this.nucleus);
        this.nucleus.position.set(0, 0, 0);
        this.nucleus.scale.setScalar(1);
    }

    startFusion() {
        this.prepareCells();
        this.fusing = true;
        this.fusionT = 0;
        this.markBtn('fusion');
        this.showCaption('去核的卵细胞正在和B羊的完整乳腺细胞并到一起。');
    }

    ease(t) {
        const x = Math.min(1, Math.max(0, t));
        return x * x * (3 - 2 * x);
    }

    animate(time, delta) {
        if (!this.group) return;
        if (this.dna) this.dna.rotation.y += delta * 0.8;
        [this.sheepA, this.sheepB, this.sheepC].forEach((sheep, i) => {
            sheep.position.y = Math.sin(time * 1.4 + i) * 0.02;
        });
        if (this.fusing) {
            this.fusionT += delta / 2.6;
            const t = Math.min(this.fusionT, 1);
            const meet = this.ease(t / 0.42);
            this.egg.position.lerpVectors(this.eggHome, this.meet, meet);
            this.mammary.position.lerpVectors(this.cellHome, this.meet, meet);
            if (t > 0.42) {
                if (this.nucleus.parent !== this.egg) {
                    this.egg.attach(this.nucleus);
                    this.nucleus.position.set(0, 0, 0);
                }
                const join = this.ease((t - 0.42) / 0.28);
                this.mammaryBody.scale.setScalar(1 - 0.82 * join);
                this.mammaryBody.material.opacity = 0.48 * (1 - join);
                this.egg.scale.setScalar(1 + 0.08 * join);
            }
            if (t > 0.72) {
                const born = this.ease((t - 0.72) / 0.28);
                this.lamb.visible = true;
                this.lamb.scale.setScalar(0.5 * born);
            }
            if (t >= 1) {
                this.fusing = false;
                this.mammary.visible = false;
                this.showCaption(this.captionText);
            }
        } else if (this.fusionT === 0) {
            this.egg.position.y = this.eggHome.y + Math.sin(time * 1.6) * 0.06;
            this.mammary.position.y = this.cellHome.y + Math.sin(time * 1.6 + 1) * 0.06;
        } else if (this.lamb.visible) {
            this.lamb.position.y = Math.sin(time * 1.8) * 0.03;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.disposed) return;
        this.disposed = true;
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
        this.fusing = false;
        const geos = new Set();
        const mats = new Set();
        if (this.group) {
            this.group.traverse(obj => {
                if (obj.geometry) geos.add(obj.geometry);
                const list = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
                list.forEach(mat => mats.add(mat));
            });
            geos.forEach(geo => geo.dispose());
            mats.forEach(mat => {
                if (mat.map) mat.map.dispose();
                mat.dispose();
            });
            this.scene.remove(this.group);
            this.group = null;
        }
        this.lights.forEach(light => this.scene.remove(light));
        this.lights = [];
        this.interactables = [];
        const bar = document.getElementById('scene-controls');
        if (bar) bar.innerHTML = '';
        const info = document.getElementById('info-content');
        if (info) info.innerHTML = '';
    }
};
