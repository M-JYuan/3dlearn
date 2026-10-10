/**
 * 七年级：洋葱根尖 — 一排细胞，休息的有一个细胞核，分裂的有深色染色体。
 * 播放顺序只有四步：复制，分成两组，变成两个细胞核，细胞质再分开。
 */
window.Grade7DivisionScene = class Grade7DivisionScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.kind = 'plant';
        this.playing = false;
        this.finished = false;
        this.stage = 0;
        this.stageT = 0;
        this.demo = null;
        this.mat = null;
    }

    init() {
        this.camera.position.set(0, 7.2, 13.2);
        this.camera.lookAt(0, 0, 0);
        this.scene.background = new THREE.Color(0x101610);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.setupLights();
        this.rebuild();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        const key = new THREE.DirectionalLight(0xfff8ee, 0.75);
        key.position.set(6, 12, 8);
        this.scene.add(ambient, key);
        this.lights.push(ambient, key);
    }

    setupUI() {
        const title = document.getElementById('info-title');
        if (title) title.innerText = '洋葱根尖细胞分裂';
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');
        this.renderInfo();

        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.style.display = 'flex';
        controls.innerHTML = `
            <button class="control-btn" id="g7div-plant">植物细胞</button>
            <button class="control-btn" id="g7div-animal">动物细胞</button>
            <button class="control-btn" id="g7div-play">播放分裂</button>
        `;
        document.getElementById('g7div-plant').onclick = () => this.setKind('plant');
        document.getElementById('g7div-animal').onclick = () => this.setKind('animal');
        document.getElementById('g7div-play').onclick = () => this.play();
        this.syncButtons();
    }

    syncButtons() {
        const plant = document.getElementById('g7div-plant');
        const animal = document.getElementById('g7div-animal');
        if (plant) plant.classList.toggle('active', this.kind === 'plant');
        if (animal) animal.classList.toggle('active', this.kind === 'animal');
    }

    setKind(kind) {
        if (this.kind === kind) return;
        this.kind = kind;
        this.rebuild();
        this.syncButtons();
        this.renderInfo();
    }

    play() {
        this.playing = true;
        this.finished = false;
        this.stage = 1;
        this.stageT = 0;
        this.applyPose();
        this.renderInfo();
    }

    stageCaption() {
        const plant = this.kind === 'plant';
        const lines = [
            '休息中的细胞有一个细胞核。',
            '染色体先复制，每一条旁边长出相同的一条。',
            '复制后的染色体分成两份相同的组，分别移向两侧。',
            '每一侧形成一个新的细胞核。',
            plant
                ? '细胞中部长出新的细胞壁，细胞质跟着分开。'
                : '细胞膜从中部向内缢缩，细胞质跟着分开。'
        ];
        return lines[this.stage] || lines[0];
    }

    renderInfo(extra) {
        const content = document.getElementById('info-content');
        if (!content) return;
        const tone = this.finished ? 'text-yellow-300 font-bold' : 'text-yellow-200';
        content.innerHTML = `
            <p class="text-gray-300 mb-2">${extra || this.stageCaption()}</p>
            <p class="${tone}">新细胞的染色体形态和数目与亲代细胞相同。</p>
            <p class="text-gray-500 text-sm mt-2">一排是根尖细胞。点「播放分裂」看中间那个细胞。</p>
        `;
    }

    rebuild() {
        this.clearBuilt();
        this.makeMaterials();
        this.buildSlide();
        this.addStaticCell(-4.1, 'rest');
        this.addStaticCell(-2.05, 'pairs');
        this.buildDemo();
        this.addStaticCell(2.05, 'sets');
        this.addStaticCell(4.1, 'rest');
        this.applyPose();
    }

    makeMaterials() {
        const solid = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({
            color, roughness: 0.55, metalness: 0.02
        }, extra || {}));
        const glass = (color, opacity) => new THREE.MeshStandardMaterial({
            color, roughness: 0.4, metalness: 0.02,
            transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide
        });
        this.mat = {
            wall: glass(0x9aaf55, 0.28),
            edge: new THREE.LineBasicMaterial({ color: 0x31420f }),
            cyto: glass(0xc6de78, 0.42),
            nuc: solid(0x7340b0, { emissive: 0x2c1050, emissiveIntensity: 0.4 }),
            bar: solid(0x140814, { roughness: 0.4 }),
            septum: solid(0x5d7a28),
            mem: glass(0xf0b0c0, 0.45),
            slide: solid(0xd5e2ea, { roughness: 0.32 }),
            mark: new THREE.MeshBasicMaterial({
                color: 0xf5d76e, transparent: true, opacity: 0.4, side: THREE.DoubleSide
            })
        };
    }

    buildSlide() {
        const slide = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.1, 4.4), this.mat.slide);
        slide.position.y = -1.28;
        const mark = new THREE.Mesh(new THREE.CircleGeometry(0.95, 24), this.mat.mark);
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(0, -1.22, 0);
        this.group.add(slide, mark);
    }

    addShell(parent, plant) {
        if (plant) {
            const geo = new THREE.BoxGeometry(1.55, 2.15, 1.15);
            parent.add(new THREE.Mesh(geo, this.mat.wall));
            parent.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), this.mat.edge));
            const cyto = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.95, 0.95), this.mat.cyto);
            parent.add(cyto);
            return;
        }
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 14), this.mat.mem);
        body.scale.set(1.05, 0.95, 0.82);
        parent.add(body);
    }

    addNucleus(parent, x, radius) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), this.mat.nuc);
        mesh.position.set(x, 0, 0.05);
        parent.add(mesh);
        return mesh;
    }

    addStaticBars(parent, separated) {
        const geo = new THREE.BoxGeometry(0.07, 0.32, 0.07);
        const slots = [[-0.16, 0.2], [0.12, 0.05], [-0.05, -0.1], [0.16, -0.22]];
        slots.forEach(([x, y]) => {
            const a = new THREE.Mesh(geo, this.mat.bar);
            const b = new THREE.Mesh(geo, this.mat.bar);
            a.position.set(separated ? -0.46 : x, y, 0.18);
            b.position.set(separated ? 0.46 : x + 0.12, y, 0.18);
            parent.add(a, b);
        });
    }

    tagCell(group, resting) {
        const title = resting ? '休息中的细胞' : '正在分裂的细胞';
        const desc = resting ? '里面有一个细胞核。' : '能看到深色的染色体。';
        group.userData = {
            hoverTitle: title,
            hoverDesc: desc,
            hoverIcon: 'fa-microscope',
            name: title,
            onClick: () => this.renderInfo(title + '：' + desc)
        };
        this.interactables.push(group);
    }

    addStaticCell(x, mode) {
        const group = new THREE.Group();
        group.position.set(x, 0, 0);
        this.addShell(group, this.kind === 'plant');
        if (mode === 'rest') this.addNucleus(group, 0, 0.32);
        else this.addStaticBars(group, mode === 'sets');
        this.tagCell(group, mode === 'rest');
        this.group.add(group);
    }

    buildDemo() {
        const root = new THREE.Group();
        const plantWall = new THREE.BoxGeometry(1.55, 2.15, 1.15);
        const wall = new THREE.Mesh(plantWall, this.mat.wall);
        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(plantWall), this.mat.edge);
        const cyto = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.95, 0.95), this.mat.cyto);
        const halfGeo = new THREE.SphereGeometry(0.5, 18, 14);
        const halfL = new THREE.Mesh(halfGeo, this.mat.mem);
        const halfR = new THREE.Mesh(halfGeo, this.mat.mem);
        halfL.scale.set(1, 0.92, 0.8);
        halfR.scale.set(1, 0.92, 0.8);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.85, 16), this.mat.mem);
        // Length is local Y; a Z rotation lays that axis on X so the waist can thin.
        neck.rotation.z = Math.PI / 2;
        const septum = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.0, 1.05), this.mat.septum);
        const nucleus = this.addNucleus(root, 0, 0.34);
        const nucL = this.addNucleus(root, -0.48, 0.3);
        const nucR = this.addNucleus(root, 0.48, 0.3);
        const bars = [];
        const barGeo = new THREE.BoxGeometry(0.07, 0.3, 0.07);
        [[-0.16, 0.2], [0.12, 0.05], [-0.05, -0.1], [0.16, -0.22]].forEach(([x, y]) => {
            const a = new THREE.Mesh(barGeo, this.mat.bar);
            const b = new THREE.Mesh(barGeo, this.mat.bar);
            root.add(a, b);
            bars.push({ a, b, x, y });
        });
        root.add(wall, edges, cyto, halfL, halfR, neck, septum);
        root.userData = {
            hoverTitle: '中间的细胞',
            hoverDesc: '点播放分裂看它的变化',
            hoverIcon: 'fa-microscope',
            name: '中间的细胞',
            onClick: () => this.renderInfo()
        };
        this.interactables.push(root);
        this.group.add(root);
        this.demo = { root, wall, edges, cyto, halfL, halfR, neck, septum, nucleus, nucL, nucR, bars };
    }

    applyPose() {
        const d = this.demo;
        if (!d) return;
        const plant = this.kind === 'plant';
        const stage = this.stage;
        const t = this.stageT;
        d.wall.visible = plant;
        d.edges.visible = plant;
        d.cyto.visible = plant;
        d.halfL.visible = !plant;
        d.halfR.visible = !plant;

        const copy = stage === 1 ? t : (stage > 1 ? 1 : 0);
        const split = stage === 2 ? t : (stage > 2 ? 1 : 0);
        d.bars.forEach((bar) => {
            const on = stage >= 1;
            bar.a.visible = on;
            bar.b.visible = on && copy > 0.04;
            bar.a.scale.set(1, on ? 1 : 0.02, 1);
            bar.b.scale.set(1, stage > 1 ? 1 : Math.max(copy, 0.02), 1);
            const ax = bar.x * (1 - split) - 0.48 * split;
            const bx = (bar.x + 0.13 * copy) * (1 - split) + 0.48 * split;
            bar.a.position.set(ax, bar.y, 0.2);
            bar.b.position.set(bx, bar.y, 0.2);
        });

        let nScale = 1;
        if (stage === 1) nScale = 1 - 0.2 * t;
        else if (stage === 2) nScale = 0.8;
        else if (stage === 3) nScale = 0.8 * (1 - t);
        else if (stage >= 4) nScale = 0;
        d.nucleus.visible = nScale > 0.05;
        d.nucleus.scale.setScalar(Math.max(nScale, 0.02));

        const grown = stage === 3 ? t : (stage > 3 ? 1 : 0);
        d.nucL.visible = grown > 0.05;
        d.nucR.visible = grown > 0.05;
        d.nucL.scale.setScalar(Math.max(grown, 0.02));
        d.nucR.scale.setScalar(Math.max(grown, 0.02));

        const follow = stage === 4 ? t : 0;
        d.septum.visible = plant && follow > 0.03;
        d.septum.scale.set(1, Math.max(follow, 0.02), Math.max(follow, 0.02));
        const sep = 0.08 + follow * 0.5;
        d.halfL.position.x = -sep;
        d.halfR.position.x = sep;
        const pinch = Math.max(0.04, 1 - follow);
        d.neck.visible = !plant && follow < 0.97;
        d.neck.scale.set(pinch, 1, pinch);
    }

    animate(time, delta) {
        if (!this.demo) return;
        if (!this.playing) {
            if (this.stage === 0) {
                const s = 1 + Math.sin(time * 1.5) * 0.05;
                this.demo.nucleus.scale.setScalar(s);
            }
            return;
        }
        const dur = [1, 1.8, 2, 1.6, 2.2][this.stage] || 1;
        this.stageT += Math.min(delta, 0.05) / dur;
        if (this.stageT >= 1) {
            if (this.stage >= 4) {
                this.stageT = 1;
                this.playing = false;
                this.finished = true;
                this.applyPose();
                this.renderInfo();
                return;
            }
            this.stage += 1;
            this.stageT = 0;
            this.renderInfo();
        }
        this.applyPose();
    }

    getInteractables() {
        return this.interactables;
    }

    clearBuilt() {
        if (!this.group) return;
        this.disposeTree(this.group);
        while (this.group.children.length) this.group.remove(this.group.children[0]);
        this.interactables.length = 0;
        this.demo = null;
        this.mat = null;
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
        this.demo = null;
        this.mat = null;
    }
};
