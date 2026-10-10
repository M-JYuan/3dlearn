/**
 * 七年级：草履虫 — 两滴水以窄通道相连，棉花纤维挡路。
 * 小盐粒和肉汁只给朝 +X 的反应；盐粒太大或放在中央则不编造结果。
 */
window.Grade7ParameciumScene = class Grade7ParameciumScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.paras = [];
        this.cottons = [];
        this.mode = 'default';
        this.structIndex = 0;
        this.dropL = { x: -2.15, z: 0, r: 1.5 };
        this.dropR = { x: 2.15, z: 0, r: 1.5 };
        this.partMats = null;
        this.structNotes = [
            { key: 'cilia', text: '纤毛拨动使其旋转前进' },
            { key: 'groove', text: '口沟' },
            { key: 'food', text: '食物泡' },
            { key: 'contract', text: '伸缩泡' },
            { key: 'pellicle', text: '表膜' },
            { key: 'none', text: '草履虫没有神经。纤毛拨动身体旋转着前进，前方碰到棉花纤维就后退并转向。' }
        ];
    }

    init() {
        this.camera.position.set(0, 8.2, 6.4);
        this.camera.lookAt(0, 0, 0);
        this.scene.background = new THREE.Color(0x0e1c24);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.setupLights();
        this.buildSlide();
        this.buildCreatures();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.45);
        const key = new THREE.DirectionalLight(0xfff6ea, 0.7);
        key.position.set(-5, 11, 7);
        this.scene.add(ambient, key);
        this.lights.push(ambient, key);
    }

    setupUI() {
        const title = document.getElementById('info-title');
        if (title) title.innerText = '草履虫';
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');
        this.setCaption('两滴水沿 X 连成窄通道。草履虫没有神经。它在自己的液滴里游动；前方若会碰到棉花纤维，就沿 X 反向并转向。');

        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.style.display = 'flex';
        controls.innerHTML = `
            <button class="control-btn" id="g7para-meat">肉汁（右滴边缘）</button>
            <button class="control-btn" id="g7para-salt">食盐（左滴边缘）</button>
            <button class="control-btn" id="g7para-big">大盐粒</button>
            <button class="control-btn" id="g7para-reset">重置</button>
            <button class="control-btn" id="g7para-struct">结构</button>
        `;
        document.getElementById('g7para-meat').onclick = () => this.setMode('meat');
        document.getElementById('g7para-salt').onclick = () => this.setMode('salt');
        document.getElementById('g7para-big').onclick = () => this.setMode('bigsalt');
        document.getElementById('g7para-reset').onclick = () => this.setMode('default');
        document.getElementById('g7para-struct').onclick = () => this.showStruct();
        this.syncButtons();
    }

    setCaption(text) {
        const el = document.getElementById('info-content');
        if (!el) return;
        el.innerHTML = `<p class="text-yellow-200 text-base">${text}</p>`;
    }

    syncButtons() {
        const on = (id, active) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('active', active);
        };
        on('g7para-meat', this.mode === 'meat');
        on('g7para-salt', this.mode === 'salt');
        on('g7para-big', this.mode === 'bigsalt');
    }

    setMode(mode) {
        this.mode = mode;
        if (mode === 'default' || mode === 'bigsalt') this.placeHome();
        this.meatMesh.visible = mode === 'meat';
        this.saltMesh.visible = mode === 'salt';
        this.bigSaltMesh.visible = mode === 'bigsalt';
        this.syncButtons();
        if (mode === 'bigsalt') this.setCaption('盐粒太大或放在中央时，课本没有给出结果');
        else if (mode === 'meat') this.setCaption('肉汁在右滴边缘，草履虫朝右滴游去。它没有神经。');
        else if (mode === 'salt') this.setCaption('小盐粒在左滴边缘，草履虫远离它，朝右滴游去。它没有神经。');
        else this.setCaption('草履虫没有神经。它在自己的液滴里游动；前方若会碰到棉花纤维，就沿 X 反向并转向。');
    }

    showStruct() {
        const note = this.structNotes[this.structIndex % this.structNotes.length];
        this.structIndex += 1;
        Object.keys(this.partMats).forEach((key) => {
            const mat = this.partMats[key];
            const active = key === note.key;
            mat.emissive.setHex(active ? 0xffc56b : 0x000000);
            mat.emissiveIntensity = active ? 0.75 : 0;
        });
        this.setCaption(note.text);
    }

    buildSlide() {
        const slideMat = new THREE.MeshStandardMaterial({ color: 0xd5e2ea, roughness: 0.35 });
        const slide = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.08, 4.2), slideMat);
        slide.position.y = -0.08;
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x7eb8d4, transparent: true, opacity: 0.45,
            roughness: 0.15, depthWrite: false, side: THREE.DoubleSide
        });
        const disc = new THREE.CircleGeometry(this.dropL.r, 36);
        const left = new THREE.Mesh(disc, waterMat);
        const right = new THREE.Mesh(disc, waterMat);
        left.rotation.x = -Math.PI / 2;
        right.rotation.x = -Math.PI / 2;
        left.position.set(this.dropL.x, 0.04, 0);
        right.position.set(this.dropR.x, 0.04, 0);
        const channel = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.03, 1.24), waterMat);
        channel.position.set(0, 0.045, 0);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xb7d7e6, roughness: 0.4 });
        const rimGeo = new THREE.TorusGeometry(this.dropL.r, 0.025, 6, 40);
        const rimL = new THREE.Mesh(rimGeo, rimMat);
        const rimR = new THREE.Mesh(rimGeo, rimMat);
        rimL.rotation.x = Math.PI / 2;
        rimR.rotation.x = Math.PI / 2;
        rimL.position.set(this.dropL.x, 0.07, 0);
        rimR.position.set(this.dropR.x, 0.07, 0);
        this.group.add(slide, left, right, channel, rimL, rimR);

        this.meatMat = new THREE.MeshStandardMaterial({
            color: 0x6e2c16, roughness: 0.55, emissive: 0x2a0c08, emissiveIntensity: 0.35
        });
        this.saltMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.25 });
        this.meatMesh = new THREE.Group();
        const dropGeo = new THREE.SphereGeometry(0.11, 10, 8);
        [[0, 0, 0], [0.14, 0.02, 0.05], [-0.1, 0, 0.07], [0.05, 0.04, -0.09]].forEach(([x, y, z]) => {
            const blob = new THREE.Mesh(dropGeo, this.meatMat);
            blob.position.set(x, y, z);
            this.meatMesh.add(blob);
        });
        this.meatMesh.position.set(this.dropR.x + this.dropR.r - 0.28, 0.18, 0.04);
        this.saltMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), this.saltMat);
        this.saltMesh.position.set(this.dropL.x - this.dropL.r + 0.2, 0.16, -0.04);
        this.bigSaltMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), this.saltMat);
        this.bigSaltMesh.position.set(0, 0.38, 0);
        this.meatMesh.visible = false;
        this.saltMesh.visible = false;
        this.bigSaltMesh.visible = false;
        this.tag(this.meatMesh, '肉汁', '放在右滴边缘');
        this.tag(this.saltMesh, '小盐粒', '放在左滴边缘');
        this.tag(this.bigSaltMesh, '大盐粒', '盐粒太大或放在中央时，课本没有给出结果');
        this.group.add(this.meatMesh, this.saltMesh, this.bigSaltMesh);
        this.addCotton(-2.95, 0.72, -2.25, 1.15);
        this.addCotton(-2.85, -0.7, -2.15, -1.15);
        this.addCotton(2.25, 0.75, 2.95, 1.15);
        this.addCotton(2.15, -0.7, 2.9, -1.15);
    }

    addCotton(x1, z1, x2, z2) {
        const dx = x2 - x1;
        const dz = z2 - z1;
        const len = Math.hypot(dx, dz) || 1;
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.035, 0.035, len, 6),
            new THREE.MeshStandardMaterial({ color: 0xf3f0e6, roughness: 0.9 })
        );
        mesh.position.set((x1 + x2) / 2, 0.12, (z1 + z2) / 2);
        mesh.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(dx / len, 0, dz / len)
        );
        this.tag(mesh, '棉花纤维', '挡住前方时，草履虫沿 X 反向并转向');
        this.group.add(mesh);
        this.cottons.push({ x1, z1, x2, z2 });
    }

    tag(obj, title, desc) {
        obj.userData = {
            hoverTitle: title,
            hoverDesc: desc,
            hoverIcon: 'fa-info-circle',
            name: title,
            onClick: () => this.setCaption(desc)
        };
        this.interactables.push(obj);
    }

    buildCreatures() {
        const std = (color, opacity) => new THREE.MeshStandardMaterial({
            color, roughness: 0.55, metalness: 0.02,
            emissive: 0x000000, emissiveIntensity: 0,
            transparent: opacity < 1, opacity, depthWrite: opacity >= 0.9
        });
        this.bodyMat = std(0xc6d48a, 1);
        this.partMats = {
            cilia: std(0xe4dcc8, 1),
            groove: std(0x4e5a32, 1),
            food: std(0xc47a3a, 1),
            contract: std(0x9fd4e0, 0.9),
            pellicle: std(0xb7c99a, 0.22)
        };
        const specs = [
            { home: 'L', x: -2.7, z: 0.15, vx: 0.28, vz: 0.12, side: 1 },
            { home: 'L', x: -1.85, z: -0.65, vx: -0.2, vz: 0.16, side: -1 },
            { home: 'L', x: -2.45, z: 0.9, vx: 0.12, vz: -0.22, side: 1 },
            { home: 'R', x: 1.75, z: -0.55, vx: 0.22, vz: 0.1, side: -1 },
            { home: 'R', x: 2.6, z: 0.5, vx: -0.18, vz: 0.14, side: 1 }
        ];
        const bodyGeo = new THREE.SphereGeometry(0.24, 16, 12);
        const ciliaGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 5);
        specs.forEach((spec, index) => this.addParamecium(spec, index, bodyGeo, ciliaGeo));
    }

    addParamecium(spec, index, bodyGeo, ciliaGeo) {
        const root = new THREE.Group();
        const inner = new THREE.Group();
        const body = new THREE.Mesh(bodyGeo, this.bodyMat);
        body.scale.set(1, 0.72, 2.2);
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), this.bodyMat);
        nose.position.z = 0.5;
        const pellicle = new THREE.Mesh(bodyGeo, this.partMats.pellicle);
        pellicle.scale.set(1.08, 0.8, 2.35);
        const groove = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.28), this.partMats.groove);
        groove.position.set(0.22, 0, 0.08);
        const food = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), this.partMats.food);
        food.position.set(0.03, 0, -0.04);
        const contract = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), this.partMats.contract);
        contract.position.set(0, 0.04, -0.32);
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            const cil = new THREE.Mesh(ciliaGeo, this.partMats.cilia);
            cil.position.set(Math.cos(ang) * 0.28, Math.sin(ang) * 0.18, i % 2 ? 0.12 : -0.08);
            cil.rotation.z = ang;
            inner.add(cil);
        }
        inner.add(pellicle, body, nose, groove, food, contract);
        root.add(inner);
        root.position.set(spec.x, 0.26, spec.z);
        this.tag(root, '草履虫', '纤毛拨动使其旋转前进');
        this.group.add(root);
        this.paras.push({
            root, inner, food, contract,
            home: spec.home, side: spec.side, seed: index * 1.7,
            x: spec.x, z: spec.z, vx: spec.vx, vz: spec.vz,
            spawnX: spec.x, spawnZ: spec.z, spawnVx: spec.vx, spawnVz: spec.vz,
            phase: index, avoid: 0
        });
    }

    placeHome() {
        this.paras.forEach((p) => {
            p.x = p.spawnX;
            p.z = p.spawnZ;
            p.vx = p.spawnVx;
            p.vz = p.spawnVz;
            p.avoid = 0;
            p.root.position.set(p.x, 0.26, p.z);
        });
    }

    inWater(x, z) {
        const hit = (drop) => {
            const dx = x - drop.x;
            const dz = z - drop.z;
            return dx * dx + dz * dz <= drop.r * drop.r;
        };
        return hit(this.dropL) || hit(this.dropR) || (x >= -1.3 && x <= 1.3 && Math.abs(z) <= 0.58);
    }

    inHome(home, x, z) {
        const drop = home === 'L' ? this.dropL : this.dropR;
        const dx = x - drop.x;
        const dz = z - drop.z;
        const limit = drop.r - 0.22;
        return dx * dx + dz * dz <= limit * limit;
    }

    allowed(p, x, z) {
        if (this.mode === 'meat' || this.mode === 'salt') return this.inWater(x, z);
        return this.inHome(p.home, x, z);
    }

    distToSeg(px, pz, c) {
        const vx = c.x2 - c.x1;
        const vz = c.z2 - c.z1;
        const len2 = vx * vx + vz * vz || 1;
        let t = ((px - c.x1) * vx + (pz - c.z1) * vz) / len2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (c.x1 + vx * t), pz - (c.z1 + vz * t));
    }

    frontHits(p) {
        const sp = Math.hypot(p.vx, p.vz);
        if (sp < 0.04) return false;
        const fx = p.x + (p.vx / sp) * 0.62;
        const fz = p.z + (p.vz / sp) * 0.62;
        for (let i = 0; i < this.cottons.length; i++) {
            if (this.distToSeg(fx, fz, this.cottons[i]) < 0.32) return true;
        }
        return false;
    }

    animate(time, delta) {
        const dt = Math.min(delta, 0.05);
        const taxis = this.mode === 'meat' || this.mode === 'salt';
        this.paras.forEach((p) => {
            if (!this.allowed(p, p.x, p.z)) {
                const goalX = taxis ? 0 : (p.home === 'L' ? this.dropL.x : this.dropR.x);
                p.x += Math.sign(goalX - p.x || 1) * 1.8 * dt;
                p.z += Math.sign(-p.z || 1) * 1.8 * dt;
                p.vx = taxis ? 0.55 : 0;
                p.vz = 0;
                p.root.position.set(p.x, 0.26, p.z);
                return;
            }
            if (p.avoid > 0) {
                p.avoid -= dt;
            } else if (taxis) {
                p.vx += 1.15 * dt;
                p.vz += (-p.z * 5 - p.vz * 4) * dt;
            } else {
                p.phase += dt * 0.75;
                p.vx += Math.cos(p.phase + p.seed) * 0.7 * dt;
                p.vz += Math.sin(p.phase * 1.2 + p.seed) * 0.7 * dt;
            }
            const maxSpeed = taxis ? 1.15 : 0.58;
            let sp = Math.hypot(p.vx, p.vz);
            if (sp > maxSpeed) {
                p.vx = p.vx / sp * maxSpeed;
                p.vz = p.vz / sp * maxSpeed;
            } else if (!taxis && sp < 0.12) {
                p.vx += 0.2 * p.side;
            }
            if (p.avoid <= 0 && this.frontHits(p)) {
                p.vx *= -1;
                p.vz = p.side * 0.45 - p.vz * 0.15;
                p.avoid = 0.4;
            }
            let nx = p.x + p.vx * dt;
            let nz = p.z + p.vz * dt;
            if (!this.allowed(p, nx, nz)) {
                if (!this.allowed(p, nx, p.z)) {
                    nx = p.x;
                    p.vx = taxis ? (p.vx > 0 ? 0.2 : 0.45) : -p.vx * 0.75;
                }
                if (!this.allowed(p, p.x, nz)) {
                    nz = p.z;
                    p.vz = taxis ? -p.z * 2 : -p.vz * 0.75;
                }
                if (!this.allowed(p, nx, nz)) {
                    nx = p.x;
                    nz = p.z;
                }
            }
            p.x = nx;
            p.z = nz;
            p.root.position.set(p.x, 0.26, p.z);
            sp = Math.hypot(p.vx, p.vz);
            if (sp > 0.04) {
                // Local +Z is forward; face travel with rotation.y = atan2(velocity.x, velocity.z) only.
                p.root.rotation.y = Math.atan2(p.vx, p.vz);
            }
            p.inner.rotation.z += dt * 1.15;
            const beat = 1 + Math.sin(time * 2.2 + p.seed) * 0.08;
            p.food.scale.setScalar(beat);
            p.contract.scale.setScalar(0.85 + Math.sin(time * 1.25 + p.seed) * 0.15);
        });
        if (this.bigSaltMesh.visible) this.bigSaltMesh.rotation.y = time * 0.4;
    }

    getInteractables() {
        return this.interactables;
    }

    disposeTree(root) {
        const geos = new Set();
        const mats = new Set();
        root.traverse((obj) => {
            if (obj.geometry) geos.add(obj.geometry);
            if (obj.material) {
                const list = Array.isArray(obj.material) ? obj.material : [obj.material];
                list.forEach((m) => mats.add(m));
            }
        });
        geos.forEach((g) => g.dispose());
        mats.forEach((m) => m.dispose());
    }

    dispose() {
        const controls = document.getElementById('scene-controls');
        if (controls) {
            controls.innerHTML = '';
            controls.style.display = 'none';
        }
        if (this.group) {
            this.disposeTree(this.group);
            this.scene.remove(this.group);
            this.group = null;
        }
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        this.interactables.length = 0;
        this.paras = [];
        this.cottons = [];
        this.partMats = null;
    }
};
