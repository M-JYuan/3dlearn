window.Grade7CellLifeScene = class Grade7CellLifeScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-cell-life';
        this.group = null;
        this.body = null;
        this.lights = [];
        this.interactables = [];
        this.geos = new Set();
        this.mats = new Set();
        this.kind = 'plant';
        this.focus = 'membrane';
        this.particles = [];
        this.packets = [];
        this.markers = [];
        this.chloros = [];
        this.mitos = [];
        this.memPanels = [];
        this.rays = [];
        this.mitoFlash = [];
        this.memFlash = 0;
        this.t = 0;
        this.half = { x: 1.58, y: 1.06, z: 0.64 };
        this.wallR = 1.32;

        this.picked = null;
        this._v1 = new THREE.Vector3();
        this._v2 = new THREE.Vector3(0, 1, 0);
        this._q = new THREE.Quaternion();
    }

    init() {
        this.camera.position.set(0, 0.55, 6.4);
        this.camera.lookAt(0, 0, 0);
        this.scene.background = new THREE.Color(0xe7f2ea);
        const amb = new THREE.AmbientLight(0xfff8ef, 0.68);
        const dir = new THREE.DirectionalLight(0xffffff, 0.82);
        dir.position.set(4, 7, 6);
        const fill = new THREE.PointLight(0xffe2b0, 0.4, 24);
        fill.position.set(-3.2, 1.6, 3);
        [amb, dir, fill].forEach((light) => { this.scene.add(light); this.lights.push(light); });
        this.group = new THREE.Group();
        this.scene.add(this.group);
        const floor = this.add(this.group, new THREE.CircleGeometry(3.6, 40), this.std(0xd5e4d4, 1), 0, -1.85, 0);
        floor.rotation.x = -Math.PI / 2;
        this.buildParticles();
        this.buildPackets();
        this.buildSun();
        this.setKind('plant');
        this.setFocus('membrane');
        this.setupUI();
    }

    std(color, opacity, emissive) {
        const mat = new THREE.MeshStandardMaterial({
            color: color, emissive: emissive == null ? 0x000000 : emissive,
            emissiveIntensity: emissive == null ? 0 : 0.4, roughness: 0.48, metalness: 0,
            transparent: opacity < 0.98, opacity: opacity, side: THREE.DoubleSide, depthWrite: opacity >= 0.85
        });
        this.mats.add(mat);
        return mat;
    }

    add(parent, geo, mat, x, y, z, name, desc) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        this.geos.add(geo);
        this.mats.add(mat);
        if (name) {
            mesh.userData.name = name;
            mesh.userData.description = desc;
            mesh.userData.onClick = () => this.pickMesh(mesh);
            this.interactables.push(mesh);
        }
        return mesh;
    }

    setupUI() {
        const btn = (id, label) => `<button class="control-btn" id="${this.id}-${id}" type="button">${label}</button>`;
        document.getElementById('scene-controls').innerHTML = [btn('plant', '植物绿色细胞'), btn('animal', '动物细胞'), btn('gate', '物质进出'), btn('energy', '能量'), btn('core', '细胞核')].join('');
        [['plant', () => this.setKind('plant')], ['animal', () => this.setKind('animal')], ['gate', () => this.setFocus('membrane')], ['energy', () => this.setFocus('energy')], ['core', () => this.setFocus('core')]].forEach((pair) => {
            document.getElementById(this.id + '-' + pair[0]).addEventListener('click', pair[1]);
        });
    }

    setInfo(title, html) {
        document.getElementById('info-panel')?.classList.add('visible');
        document.getElementById('info-title').textContent = title;
        document.getElementById('info-content').innerHTML = html;
    }

    refreshText() {
        const plant = this.kind === 'plant';
        if (this.focus === 'membrane') {
            this.setInfo('细胞膜控制物质进出', '<p>细胞膜会挑选进出的物质。需要的能进来，有些被挡在外面，废物和分泌物可以离开。</p><p>青色小球正在进入，红色小球撞上就弹回，黄色小球从里面出去。</p>');
        } else if (this.focus === 'energy') {
            this.setInfo(plant ? '绿色植物细胞里的能量' : '动物细胞里的能量', plant
                ? '<p>能量不会凭空出现，它储存在有机物里，比如糖。</p><p>叶绿体吸收光，把能量存进有机物。线粒体再把这些化学能释放出来给细胞用。两种细胞都有线粒体，叶绿体只在绿色植物细胞里。</p>'
                : '<p>动物细胞没有叶绿体，不能把光存进有机物。外面的光到了膜外就停住。</p><p>它使用已经有的有机物，线粒体把其中的化学能释放出来。能量仍然不是凭空产生的。</p>');
        } else {
            this.setInfo('细胞核是控制中心', '<p>细胞核掌管发育，遗传信息可以传下去。蓝色小标记只说明位置，不是真实样子，结构和工作方式以后再学。</p><p>' + (plant ? '标记主要在细胞核里，叶绿体和线粒体里也有一点。' : '动物细胞没有叶绿体。标记主要在细胞核里，线粒体里也有一点。') + '</p>');
        }
    }

    buildParticles() {
        const spec = [['need', 0x1aa6a0, 0x0c4f4c, 7, '需要的物质', '这是细胞需要的物质，可以穿过细胞膜进入。'], ['block', 0xd23b4a, 0x6e1520, 6, '被挡住的物质', '这种物质进不去，碰到细胞膜后被弹开。'], ['leave', 0xe6a23c, 0x6a4010, 6, '废物和分泌物', '这是废物或分泌物，正在离开细胞。']];
        spec.forEach((row) => {
            for (let i = 0; i < row[3]; i += 1) {
                const mesh = this.add(this.group, new THREE.SphereGeometry(0.072, 12, 10), this.std(row[1], 1, row[2]), 0, 0, 0, row[4], row[5]);
                this.particles.push({ mesh: mesh, kind: row[0], vx: 0, vy: 0, vz: 0, life: 1 });
            }
        });
    }

    buildPackets() {
        for (let i = 0; i < 5; i += 1) {
            const mesh = this.add(this.group, new THREE.BoxGeometry(0.1, 0.1, 0.1), this.std(0x9cbf55, 1, 0x3d5a14), 0, 0, 0, '有机物中的能量', '小块代表有机物里储存的能量，不是化学式。能量先被存起来，再由线粒体释放。');
            mesh.visible = false;
            this.packets.push({ mesh: mesh, u: 1, wait: i * 0.35, from: new THREE.Vector3(), to: new THREE.Vector3(), mitoIndex: 0 });
        }
    }

    buildSun() {
        this.sun = this.add(this.group, new THREE.SphereGeometry(0.28, 22, 16), this.std(0xffd15c, 1, 0xffb000), -2.75, 1.55, 0.7, '光', '绿色植物细胞可以吸收光，再把能量储存在有机物里。');
        this.stopRing = this.add(this.sun, new THREE.TorusGeometry(0.42, 0.03, 8, 28), this.std(0xd23b4a, 1, 0x6e1520), 0.55, -0.35, 0.2);
        this.stopRing.rotation.y = 0.8;
        const geo = new THREE.CylinderGeometry(0.025, 0.025, 1, 6);
        const mat = this.std(0xffe08a, 0.45, 0xffc85a);
        for (let i = 0; i < 5; i += 1) this.rays.push(this.add(this.group, geo, mat, 0, 0, 0));
    }

    setKind(kind) {
        this.kind = kind;
        this.clearBody();
        this.markers = [];
        this.chloros = [];
        this.mitos = [];
        this.memPanels = [];
        this.mitoFlash = [];
        const g = new THREE.Group();
        this.group.add(g);
        this.body = g;
        if (kind === 'plant') this.buildPlant(g);
        else this.buildAnimal(g);
        this.resetParticles();
        this.packets.forEach((p) => { p.mesh.visible = false; p.wait = Math.random(); });
        this.applyFocus();
        this.refreshText();
    }

    setFocus(focus) {
        this.focus = focus;
        this.applyFocus();
        this.refreshText();
    }

    buildPlant(g) {
        this.half = { x: 1.58, y: 1.06, z: 0.64 };
        this.add(g, new THREE.BoxGeometry(3.35, 2.28, 1.42), this.std(0xf4e2c0, 0.1), 0, 0, 0);
        this.frame(g, 3.62, 2.55, 0.78, 0.045, this.std(0x6f8f55, 1, 0x2d4a18), '细胞壁', '植物细胞外有一层较硬的壁。动物细胞没有。挑选物质进出的是里面的细胞膜。');
        this.memPanels = this.frame(g, 3.15, 2.12, 0.64, 0.04, this.std(0xe7b169, 1, 0x8a5a20), '细胞膜', '细胞膜让需要的物质进来，把一些物质挡在外面，并让废物和分泌物出去。');
        this.makeNucleus(g, -0.48, 0.08, 0, 0.38);
        [[0.72, 0.38, 0.08], [0.95, -0.32, -0.02], [-0.05, 0.58, 0.1], [0.2, -0.62, 0.02], [1.15, 0.08, -0.08]].forEach((p, i) => this.chloros.push(this.makeOval(g, p[0], p[1], p[2], i, true)));
        [[-1.05, -0.42, 0.08], [-0.9, 0.48, -0.05], [0.42, -0.12, 0.16], [-0.15, -0.38, -0.1]].forEach((p, i) => this.mitos.push(this.makeOval(g, p[0], p[1], p[2], i, false)));
    }

    buildAnimal(g) {
        this.wallR = 1.32;
        this.half = { x: 1.32, y: 1.32, z: 1.32 };
        this.add(g, new THREE.SphereGeometry(1.32, 36, 28), this.std(0xf3c7b4, 0.16), 0, 0, 0);
        const rim = this.add(g, new THREE.TorusGeometry(1.32, 0.038, 8, 42), this.std(0xe7b169, 1, 0x8a5a20), 0, 0, 0, '细胞膜', '动物细胞没有细胞壁。这层膜同样决定什么能进、什么留在外面，也让废物和分泌物出去。');
        this.memPanels = [rim];
        this.makeNucleus(g, 0.08, 0.05, 0, 0.4);
        [[-0.72, 0.28, 0.15], [0.62, -0.48, 0.05], [-0.35, -0.55, -0.1], [0.55, 0.42, -0.12], [-0.15, 0.62, 0.18]].forEach((p, i) => this.mitos.push(this.makeOval(g, p[0], p[1], p[2], i, false)));
    }

    frame(parent, w, h, z, t, mat, name, desc) {
        return [[w, t, t, 0, h / 2, z], [w, t, t, 0, -h / 2, z], [t, h, t, w / 2, 0, z], [t, h, t, -w / 2, 0, z]].map((b) => this.add(parent, new THREE.BoxGeometry(b[0], b[1], b[2]), mat, b[3], b[4], b[5], name, desc));
    }

    makeNucleus(parent, x, y, z, r) {
        const g = new THREE.Group();
        g.position.set(x, y, z);
        parent.add(g);
        this.nucleus = g;
        this.add(g, new THREE.SphereGeometry(r, 28, 20), this.std(0x6d5aa8, 0.94, 0x2a1848), 0, 0, 0, '细胞核', '细胞核是控制中心。遗传信息在这里保存、传递，并指导细胞发育。');
        this.add(g, new THREE.SphereGeometry(r * 0.34, 16, 12), this.std(0x432868, 1, 0x1a1030), r * 0.12, 0, r * 0.08);
        for (let i = 0; i < 6; i += 1) {
            const a = i / 6 * Math.PI * 2;
            const marker = this.add(g, new THREE.OctahedronGeometry(0.045), this.std(0x3d4fd0, 1, 0x2230aa), Math.cos(a) * r * 0.48, Math.sin(i * 1.7) * r * 0.26, Math.sin(a) * r * 0.32, '遗传信息', '小标记只表示遗传信息的位置，不是它的样子。主要在细胞核里。结构和工作方式以后再学。');
            marker.userData.inCore = true;
            this.markers.push(marker);
        }
        this.lock = new THREE.Group();
        g.add(this.lock);
        this.lock.position.set(0, r + 0.18, 0);
        this.add(this.lock, new THREE.BoxGeometry(0.16, 0.13, 0.08), this.std(0xd9b44a, 1, 0x6a5410), 0, 0, 0, '以后再学', '遗传信息的结构和工作方式这次先锁住，留到后面再学。');
        const shackle = this.add(this.lock, new THREE.TorusGeometry(0.055, 0.016, 6, 16, Math.PI), this.std(0xd9b44a, 1, 0x6a5410), 0, 0.07, 0, '以后再学', '遗传信息的结构和工作方式这次先锁住，留到后面再学。');
        shackle.rotation.x = Math.PI;
    }

    makeOval(parent, x, y, z, index, chloro) {
        const mesh = this.add(parent, new THREE.SphereGeometry(chloro ? 0.2 : 0.14, 16, 12), chloro ? this.std(0x2f8a3c, 1, 0x14551c) : this.std(0xe07a3d, 1, 0x6a2c0c), x, y, z, chloro ? '叶绿体' : '线粒体', chloro ? '叶绿体吸收光，把能量储存在有机物里。只有绿色植物细胞有叶绿体。' : '线粒体把有机物里储存的化学能释放出来供细胞使用。植物细胞和动物细胞都有。');
        mesh.scale.set(chloro ? 1.55 : 1.7, 0.72, 0.72);
        mesh.rotation.z = (chloro ? 0.4 : -0.5) * (index + 1);
        mesh.userData.baseY = y;
        const mark = this.add(mesh, new THREE.OctahedronGeometry(0.032), this.std(0x3d4fd0, 1, 0x2230aa), 0.04, 0, 0.05, '遗传信息', (chloro ? '叶绿体' : '线粒体') + '里也有少量遗传信息。小标记不是真实结构，细节以后再学。');
        mark.scale.set(0.62, 1.35, 1.35);
        this.markers.push(mark);
        if (!chloro) this.mitoFlash.push(0);
        return mesh;
    }

    clearBody() {
        if (!this.body) return;
        const doomedG = new Set();
        const doomedM = new Set();
        this.body.traverse((obj) => {
            const index = this.interactables.indexOf(obj);
            if (index >= 0) this.interactables.splice(index, 1);
            if (obj.geometry) doomedG.add(obj.geometry);
            if (obj.material) (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach((mat) => doomedM.add(mat));
        });
        doomedG.forEach((geo) => { geo.dispose(); this.geos.delete(geo); });
        doomedM.forEach((mat) => { mat.dispose(); this.mats.delete(mat); });
        this.group.remove(this.body);
        this.body = null;
    }

    isInside(pos) {
        if (this.kind === 'animal') return pos.length() < this.wallR;
        return Math.abs(pos.x) < this.half.x && Math.abs(pos.y) < this.half.y && Math.abs(pos.z) < this.half.z;
    }

    placeOutside(p, speed) {
        const a = Math.random() * Math.PI * 2;
        const z = (Math.random() - 0.5) * 0.35;
        if (this.kind === 'animal') p.mesh.position.set(Math.cos(a) * (this.wallR + 0.85 + Math.random() * 0.7), Math.sin(a) * this.wallR * 1.15, z);
        else p.mesh.position.set(Math.cos(a) * 2.55, Math.sin(a) * 1.85, z);
        const len = p.mesh.position.length() || 1;
        p.vx = -p.mesh.position.x / len * speed;
        p.vy = -p.mesh.position.y / len * speed;
        p.vz = -z / len * speed * 0.25;
        p.life = 5.5;
    }

    placeLeave(p) {
        if (this.kind === 'animal') {
            const r = this.wallR * 0.45 * Math.cbrt(Math.random());
            const a = Math.random() * Math.PI * 2;
            p.mesh.position.set(Math.cos(a) * r, Math.sin(a) * r, (Math.random() - 0.5) * 0.3);
        } else p.mesh.position.set((Math.random() * 2 - 1) * this.half.x * 0.5, (Math.random() * 2 - 1) * this.half.y * 0.5, (Math.random() - 0.5) * 0.2);
        if (p.mesh.position.length() < 0.2) p.mesh.position.set(0.2, 0.05, 0);
        const d = p.mesh.position.length() || 1;
        p.vx = p.mesh.position.x / d * 0.5;
        p.vy = p.mesh.position.y / d * 0.5;
        p.vz = p.mesh.position.z / d * 0.2;
        p.life = 5;
    }

    resetParticles() {
        this.particles.forEach((p) => {
            if (p.kind === 'leave') this.placeLeave(p);
            else this.placeOutside(p, p.kind === 'need' ? 0.82 : 0.68);
        });
    }

    applyFocus() {
        const gate = this.focus === 'membrane';
        const energy = this.focus === 'energy';
        const plant = this.kind === 'plant';
        this.particles.forEach((p) => { p.mesh.visible = gate; });
        this.sun.visible = energy;
        this.stopRing.visible = energy && !plant;
        this.rays.forEach((ray) => { ray.visible = energy && plant; });
        if (!energy) this.packets.forEach((p) => { p.mesh.visible = false; });
        this.sun.material.color.set(plant ? 0xffd15c : 0xb5b5b5);
        this.sun.material.emissive.set(energy && plant ? 0xffb000 : 0x000000);
        this.sun.userData.description = plant ? '绿色植物细胞可以吸收光，再把能量储存在有机物里。' : '动物细胞没有叶绿体，光不能在这里被存进有机物。';
        this.chloros.forEach((mesh) => { mesh.visible = true; });
        if (this.lock) this.lock.scale.setScalar(this.focus === 'core' ? 1.45 : 0.72);
        if (this.nucleus) this.nucleus.scale.setScalar(this.focus === 'core' ? 1.08 : 1);
    }

    stepParticle(p, delta) {
        p.mesh.scale.setScalar(p.mesh.scale.x + (1 - p.mesh.scale.x) * Math.min(1, delta * 4));
        const px = p.mesh.position.x;
        const py = p.mesh.position.y;
        const pz = p.mesh.position.z;
        const nx = px + p.vx * delta;
        const ny = py + p.vy * delta;
        const nz = pz + p.vz * delta;
        if (p.kind === 'block') {
            let hit = false;
            if (this.kind === 'animal') {
                const d0 = Math.hypot(px, py, pz);
                const d1 = Math.hypot(nx, ny, nz) || 1;
                if (d0 >= this.wallR && d1 < this.wallR) {
                    const ix = nx / d1;
                    const iy = ny / d1;
                    const iz = nz / d1;
                    const dot = p.vx * ix + p.vy * iy + p.vz * iz;
                    p.vx -= 2 * dot * ix;
                    p.vy -= 2 * dot * iy;
                    p.vz -= 2 * dot * iz;
                    p.mesh.position.set(ix * (this.wallR + 0.04), iy * (this.wallR + 0.04), iz * (this.wallR + 0.04));
                    hit = true;
                }
            } else {
                const h = this.half;
                const wasOut = Math.abs(px) >= h.x || Math.abs(py) >= h.y || Math.abs(pz) >= h.z;
                const willIn = Math.abs(nx) < h.x && Math.abs(ny) < h.y && Math.abs(nz) < h.z;
                if (wasOut && willIn) {
                    if (Math.abs(px) >= h.x) p.vx *= -1;
                    if (Math.abs(py) >= h.y) p.vy *= -1;
                    if (Math.abs(pz) >= h.z) p.vz *= -1;
                    hit = true;
                }
            }
            if (hit) { p.mesh.scale.setScalar(1.35); return; }
        }
        p.mesh.position.set(nx, ny, nz);
        p.life -= delta;
        if (p.kind === 'need' && this.isInside(p.mesh.position) && p.mesh.position.length() < 0.4) {
            this.memFlash = 0.28;
            this.placeOutside(p, 0.82);
            return;
        }
        if (p.life < 0 || p.mesh.position.length() > 3.6) {
            if (p.kind === 'leave') this.placeLeave(p);
            else this.placeOutside(p, p.kind === 'need' ? 0.82 : 0.68);
        }
    }

    aimY(mesh, from, to) {
        this._v1.set(to.x - from.x, to.y - from.y, to.z - from.z);
        const len = this._v1.length() || 0.001;
        mesh.position.set((from.x + to.x) * 0.5, (from.y + to.y) * 0.5, (from.z + to.z) * 0.5);
        mesh.scale.set(1, len, 1);
        this._v1.multiplyScalar(1 / len);
        mesh.quaternion.copy(this._q.setFromUnitVectors(this._v2.set(0, 1, 0), this._v1));
    }

    stepPackets(delta) {
        if (this.focus !== 'energy' || !this.mitos.length) return;
        const plant = this.kind === 'plant' && this.chloros.length;
        this.packets.forEach((p) => {
            if (!p.mesh.visible) {
                p.wait -= delta;
                if (p.wait > 0) return;
                const mito = this.mitos[Math.floor(Math.random() * this.mitos.length)];
                p.mitoIndex = this.mitos.indexOf(mito);
                p.to.copy(mito.position);
                if (plant) p.from.copy(this.chloros[Math.floor(Math.random() * this.chloros.length)].position);
                else p.from.set((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.4);
                p.u = 0;
                p.mesh.visible = true;
                p.mesh.material.color.set(plant ? 0x9cbf55 : 0xd2b15c);
                return;
            }
            p.u += delta * 0.42;
            if (p.u >= 1) {
                this.mitoFlash[p.mitoIndex] = 0.35;
                p.mesh.visible = false;
                p.wait = 0.15 + Math.random() * 0.45;
                return;
            }
            p.mesh.position.lerpVectors(p.from, p.to, p.u);
        });
    }

    animate(time, delta) {
        this.t += delta;
        if (this.focus === 'membrane') this.particles.forEach((p) => this.stepParticle(p, delta));
        this.stepPackets(delta);
        if (this.memFlash > 0) this.memFlash -= delta;
        this.memPanels.forEach((panel) => { panel.material.emissiveIntensity = 0.25 + Math.sin(this.t * 2) * 0.08 + (this.memFlash > 0 ? 0.7 : 0); });
        const energy = this.focus === 'energy';
        this.chloros.forEach((mesh, i) => {
            mesh.position.y = mesh.userData.baseY + Math.sin(this.t * 1.4 + i) * 0.04;
            mesh.material.emissiveIntensity = energy ? 0.25 + Math.sin(this.t * 3 + i) * 0.35 : 0.12;
            if (energy && this.rays[i]) this.aimY(this.rays[i], this.sun.position, mesh.position);
        });
        this.mitos.forEach((mesh, i) => {
            const flash = this.mitoFlash[i] || 0;
            mesh.material.emissiveIntensity = (energy ? 0.4 : 0.12) + (flash > 0 ? 0.9 : 0);
            if (flash > 0) this.mitoFlash[i] = flash - delta;
        });
        const pulse = this.focus === 'core' ? 1 + Math.sin(this.t * 3) * 0.14 : 1;
        this.markers.forEach((marker) => { if (marker.userData.inCore) marker.scale.setScalar(pulse); });
        if (this.nucleus) this.nucleus.rotation.y += delta * 0.15;
    }

    pickMesh(mesh) {
        if (!mesh?.userData?.name) return;
        if (this.picked && this.picked.material && this.picked.material.emissive) this.picked.material.emissive.set(this.picked.userData.baseEm || 0x000000);
        this.picked = mesh;
        if (mesh.material && mesh.material.emissive) {
            if (mesh.userData.baseEm == null) mesh.userData.baseEm = mesh.material.emissive.getHex();
            mesh.material.emissive.set(0xfff1c4);
        }
        this.setInfo(mesh.userData.name, '<p>' + mesh.userData.description + '</p>');
    }

    getInteractables() { return this.interactables; }

    dispose() {
        this.clearBody();
        this.geos.forEach((geo) => geo.dispose());
        this.mats.forEach((mat) => mat.dispose());
        if (this.group) this.scene.remove(this.group);
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        this.interactables = [];
        this.group = null;
        const box = document.getElementById('scene-controls');
        if (box) box.innerHTML = '';
    }
};
