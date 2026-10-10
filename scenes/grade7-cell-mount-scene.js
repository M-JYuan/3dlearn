/**
 * 人教版七年级上册：临时装片里能看见的细胞结构。
 * 只画细胞壁、细胞膜、细胞质、细胞核、线粒体、液泡；叶绿体仅黑藻叶片。
 */
window.Grade7CellMountScene = class Grade7CellMountScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.mainGroup = null;
        this.specimenGroup = null;
        this.lights = [];
        this.interactables = [];
        this.movers = [];
        this.rays = [];
        this.onionNucleusMat = null;
        this.coverslip = null;
        this.bubble = null;
        this.mode = 'leaf';
        this.slip = 'none';
        this.iodine = false;
    }
    init() {
        this.camera.position.set(5.2, 6.4, 8.6);
        this.scene.background = new THREE.Color(0x0e1418);
        this.setupLights();
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        this.interactables.push(this.mainGroup);
        this.buildStage();
        this.setupUI();
        this.setMode('leaf');
    }
    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.62);
        const key = new THREE.DirectionalLight(0xfff6e8, 0.95);
        key.position.set(6, 11, 7);
        const fill = new THREE.DirectionalLight(0x9eb6ff, 0.28);
        fill.position.set(-7, 3, -4);
        [ambient, key, fill].forEach((light) => {
            this.scene.add(light);
            this.lights.push(light);
        });
    }
    pm(color, opacity) {
        const transparent = opacity < 0.98;
        return new THREE.MeshStandardMaterial({
            color: color,
            transparent: transparent,
            opacity: opacity,
            roughness: 0.46,
            metalness: 0.03,
            depthWrite: !transparent,
            side: transparent ? THREE.DoubleSide : THREE.FrontSide
        });
    }
    box(w, h, d, color, opacity, wire) {
        const material = wire
            ? new THREE.MeshBasicMaterial({ color: color, wireframe: true })
            : this.pm(color, opacity);
        return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    }
    sphere(r, color, opacity) {
        return new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), this.pm(color, opacity));
    }
    mark(mesh, name, desc) {
        mesh.userData.name = name;
        mesh.userData.description = desc;
        mesh.userData.hoverTitle = name;
        mesh.userData.hoverDesc = desc;
        mesh.userData.onClick = () => {
            const title = document.getElementById('info-title');
            if (title) title.innerText = name;
            this.setCaption(desc);
        };
        return mesh;
    }
    setCaption(text) {
        const el = document.getElementById('grade7-cell-mount-caption');
        const line = '叶绿体只存在于植物的绿色部分。';
        const full = text.indexOf(line) === -1 ? text + line : text;
        if (el) el.textContent = full;
    }
    buildStage() {
        const desk = this.box(9.2, 0.22, 5.6, 0x1b2430, 1);
        desk.position.y = -0.28;
        this.mainGroup.add(desk);
        const slide = this.box(7.4, 0.08, 3.5, 0xd7f1ff, 0.42);
        slide.position.y = 0.08;
        this.mark(slide, '载玻片', '托住材料和水滴的玻璃片。材料要薄，光线才过得去。');
        this.mainGroup.add(slide);
        this.coverslip = this.box(4.9, 0.045, 2.65, 0xf7fcff, 0.32);
        this.mark(this.coverslip, '盖玻片', '应让一侧先碰到液滴，再缓缓放下，避免气泡。');
        this.bubble = this.sphere(0.24, 0xffffff, 0.62);
        this.mark(this.bubble, '气泡', '盖玻片平放时留下的空气圆球，不是细胞。');
        for (let i = -1; i <= 1; i++) {
            const ray = this.box(0.18, 1.15, 0.18, 0xffd56a, 0.7);
            ray.position.set(i * 0.7, -0.85, 0);
            this.mainGroup.add(ray);
            this.rays.push(ray);
        }
    }
    setMode(mode) {
        this.mode = mode;
        this.buildSpecimen();
        this.syncRays();
        this.syncSlip();
        this.syncButtons();
        this.setCaption(this.modeText());
    }
    modeText() {
        if (this.mode === 'leaf') {
            return '整片叶子是一块又厚又暗的材料，光线穿不过去，细胞看不清。';
        }
        if (this.mode === 'onion') {
            return '洋葱内表皮有细胞壁、细胞膜、细胞质、细胞核、线粒体和液泡，没有叶绿体。';
        }
        if (this.mode === 'hydrilla') {
            return '黑藻叶片薄，绿色细胞里能看到叶绿体。洋葱内表皮没有这种结构。';
        }
        return '人口腔上皮细胞有细胞膜、细胞质、细胞核和线粒体，没有细胞壁、叶绿体和液泡。';
    }
    buildSpecimen() {
        if (this.specimenGroup) {
            this.mainGroup.remove(this.specimenGroup);
            this.disposeTree(this.specimenGroup);
        }
        this.movers = [];
        this.onionNucleusMat = null;
        this.specimenGroup = new THREE.Group();
        this.mainGroup.add(this.specimenGroup);
        if (this.mode === 'leaf') this.buildLeaf();
        else if (this.mode === 'cheek') this.buildCheek();
        else this.buildPlant(this.mode === 'hydrilla');
    }
    buildLeaf() {
        const slab = new THREE.Mesh(
            new THREE.BoxGeometry(4.35, 0.68, 2.5),
            new THREE.MeshBasicMaterial({ color: 0x141c12 })
        );
        slab.position.y = 0.5;
        this.mark(slab, '整片叶子', '整片叶子太厚，光线穿不过去，显微镜下几乎是暗的。');
        this.specimenGroup.add(slab);
        const vein = this.box(0.18, 0.08, 2.2, 0x24321c, 1);
        vein.position.y = 0.86;
        this.specimenGroup.add(vein);
    }
    buildPlant(withChloro) {
        if (!withChloro) {
            const on = this.iodine;
            this.onionNucleusMat = new THREE.MeshStandardMaterial({
                color: on ? 0x4c1d6e : 0xf0c4ce,
                transparent: !on,
                opacity: on ? 1 : 0.45,
                roughness: 0.4,
                depthWrite: on
            });
        }
        [-1.42, 0, 1.42].forEach((x) => {
            [-0.54, 0.58].forEach((z) => this.addPlantCell(x, z, withChloro));
        });
        const drop = this.sphere(0.8, 0xb7e4ff, 0.2);
        drop.scale.set(2.3, 0.15, 1.45);
        drop.position.y = 0.2;
        this.mark(drop, '清水', '洋葱内表皮和黑藻叶片滴的是清水。');
        this.specimenGroup.add(drop);
    }
    addPlantCell(x, z, withChloro) {
        const g = new THREE.Group();
        g.position.set(x, 0.34, z);
        this.specimenGroup.add(g);
        const wall = this.box(1.34, 0.28, 1.0, 0xf3e6cc, 0.15);
        const frame = this.box(1.34, 0.28, 1.0, 0xb08948, 1, true);
        wall.add(frame);
        this.mark(wall, '细胞壁', '植物细胞最外层，支持和保护细胞。人口腔上皮没有细胞壁。');
        g.add(wall);
        const membrane = this.box(1.14, 0.18, 0.82, 0xfff4d2, 0.22);
        this.mark(membrane, '细胞膜', '有用的物质可以进来，有些物质进不去，废物和分泌物可以排出。');
        g.add(membrane);
        const cyto = this.box(1.0, 0.1, 0.7, 0xfff6dc, 0.5);
        this.mark(cyto, '细胞质', '细胞膜里面可以缓慢流动的部分，细胞器位于其中。');
        g.add(cyto);
        const vac = this.sphere(0.26, 0xd9f6ff, 0.4);
        vac.scale.set(1.15, 0.6, 0.88);
        this.mark(vac, '液泡', '植物细胞里的大液泡，里面是细胞液。人口腔上皮没有大液泡。');
        g.add(vac);
        const nucMat = withChloro ? this.pm(0xf0d090, 0.92) : this.onionNucleusMat;
        const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), nucMat);
        nuc.position.set(0.32, 0.04, 0.2);
        this.mark(nuc, '细胞核', '遗传物质DNA主要在细胞核里，叶绿体和线粒体里也有很少一点。结构以后再学。');
        g.add(nuc);
        [[-0.28, 0.05, -0.16], [0.04, 0.06, -0.24]].forEach((p) => {
            const mito = this.sphere(0.048, 0xd86a32, 1);
            mito.position.set(p[0], p[1], p[2]);
            mito.scale.set(1.5, 0.7, 0.7);
            this.mark(mito, '线粒体', '把有机物里贮存的化学能释放出来。能量不是凭空产生的。');
            g.add(mito);
        });
        if (!withChloro) return;
        [[-0.2, 0.12], [0.08, 0.16], [-0.02, -0.02], [0.24, -0.1], [-0.28, 0.02]].forEach((p, i) => {
            const chloro = this.sphere(0.062, 0x2fbf45, 1);
            chloro.material.emissive.set(0x146024);
            chloro.position.set(p[0], 0.07, p[1]);
            this.mark(chloro, '叶绿体', '把光能转变成有机物里的化学能。洋葱内表皮没有叶绿体。');
            g.add(chloro);
            this.movers.push({ mesh: chloro, cx: p[0], cz: p[1], ang: i * 1.2, rx: 0.07, rz: 0.045, speed: 0.75 });
        });
    }
    buildCheek() {
        const specs = [
            { p: [-1.15, 0.15], s: [1.25, 0.42, 0.95], n: [0.18, 0.12] },
            { p: [0.95, 0.35], s: [1.05, 0.4, 0.82], n: [-0.12, -0.08] },
            { p: [0.05, -0.72], s: [1.35, 0.36, 1.0], n: [0.22, 0.05] }
        ];
        specs.forEach((spec) => {
            const g = new THREE.Group();
            g.position.set(spec.p[0], 0.4, spec.p[1]);
            g.scale.set(spec.s[0], spec.s[1], spec.s[2]);
            this.specimenGroup.add(g);
            const membrane = this.sphere(0.62, 0xffc8be, 0.32);
            this.mark(membrane, '细胞膜', '人口腔上皮细胞没有细胞壁，最外面就是细胞膜。有用的物质可以进来，废物可以排出。');
            g.add(membrane);
            const cyto = this.sphere(0.46, 0xffe3da, 0.48);
            this.mark(cyto, '细胞质', '细胞膜包裹的胶状部分。这里没有液泡，也没有叶绿体。');
            g.add(cyto);
            const nuc = this.sphere(0.2, 0xc45b86, 0.95);
            nuc.position.set(spec.n[0], 0.05, spec.n[1]);
            this.mark(nuc, '细胞核', '遗传物质DNA主要在这里，线粒体里也有很少一点。碘液不改变这个核的深浅。');
            g.add(nuc);
            [[0.22, -0.16], [-0.24, 0.14]].forEach((p) => {
                const mito = this.sphere(0.07, 0xd86a32, 1);
                mito.position.set(p[0], 0.04, p[1]);
                mito.scale.set(1.4, 0.65, 0.65);
                this.mark(mito, '线粒体', '动物细胞也有线粒体，能释放有机物里贮存的化学能。');
                g.add(mito);
            });
        });
        const drop = this.sphere(0.8, 0xd5ecff, 0.18);
        drop.scale.set(2.2, 0.14, 1.4);
        drop.position.y = 0.2;
        this.mark(drop, '生理盐水', '人口腔上皮细胞的装片用生理盐水。清水和生理盐水的差别，课本留给讨论。');
        this.specimenGroup.add(drop);
    }
    syncRays() {
        const blocked = this.mode === 'leaf';
        this.rays.forEach((ray) => {
            ray.scale.y = blocked ? 0.28 : 1;
            ray.position.y = blocked ? -1.15 : -0.85;
            ray.material.color.set(blocked ? 0x3a2e16 : 0xffd56a);
            ray.material.opacity = blocked ? 0.15 : 0.72;
        });
    }
    syncSlip() {
        const host = this.mainGroup;
        const park = (obj, show) => {
            if (!obj) return;
            const on = obj.parent === host;
            if (show && !on) host.add(obj);
            if (!show && on) host.remove(obj);
        };
        park(this.coverslip, this.slip !== 'none');
        park(this.bubble, this.slip === 'flat');
        if (!this.coverslip || this.slip === 'none') return;
        const leaf = this.mode === 'leaf';
        if (this.slip === 'flat') {
            this.coverslip.rotation.z = 0;
            this.coverslip.position.set(0, leaf ? 1.02 : 0.62, 0);
        } else {
            this.coverslip.rotation.z = -0.62;
            this.coverslip.position.set(0.15, leaf ? 1.16 : 0.74, 0);
        }
        if (this.bubble.parent) {
            this.bubble.userData.baseY = leaf ? 0.92 : 0.48;
            this.bubble.position.set(1.2, this.bubble.userData.baseY, 0.55);
        }
    }
    setSlip(kind) {
        this.slip = kind;
        this.syncSlip();
        this.syncButtons();
        this.setCaption(kind === 'flat'
            ? '盖玻片平着放下，液滴里会留下一个气泡圆球。气泡不是细胞。'
            : '盖玻片一侧先接触液滴再放下，空气被挤走，不会留下气泡。');
    }
    toggleIodine() {
        this.iodine = !this.iodine;
        this.applyIodine();
        this.syncButtons();
        if (this.mode !== 'onion') {
            this.setCaption('碘液只改变洋葱内表皮细胞核的对比度，当前装片看不出染色变化。');
            return;
        }
        this.setCaption(this.iodine
            ? '碘液只把洋葱内表皮的细胞核染深，不会染出叶绿体。'
            : '碘液已去掉，洋葱细胞核又变淡了。');
    }
    applyIodine() {
        const mat = this.onionNucleusMat;
        if (!mat) return;
        const on = this.iodine;
        mat.color.set(on ? 0x4c1d6e : 0xf0c4ce);
        mat.opacity = on ? 1 : 0.45;
        mat.transparent = !on;
        mat.depthWrite = on;
        mat.needsUpdate = true;
    }
    syncButtons() {
        const spec = {
            leaf: 'grade7-cell-mount-btn-leaf',
            onion: 'grade7-cell-mount-btn-onion',
            hydrilla: 'grade7-cell-mount-btn-hydrilla',
            cheek: 'grade7-cell-mount-btn-cheek'
        };
        Object.keys(spec).forEach((key) => {
            const el = document.getElementById(spec[key]);
            if (el) el.classList.toggle('active', key === this.mode);
        });
        const flat = document.getElementById('grade7-cell-mount-btn-flat');
        const edge = document.getElementById('grade7-cell-mount-btn-edge');
        const iodine = document.getElementById('grade7-cell-mount-btn-iodine');
        if (flat) flat.classList.toggle('active', this.slip === 'flat');
        if (edge) edge.classList.toggle('active', this.slip === 'edge');
        if (iodine) iodine.classList.toggle('active', this.iodine);
    }
    setupUI() {
        const title = document.getElementById('info-title');
        if (title) title.innerText = '细胞临时装片';
        const info = document.getElementById('info-content');
        if (info) {
            info.innerHTML = [
                '<p>人教版七年级上册：观察细胞要用薄而透明的材料。整片叶子太厚，光线穿不过去。</p>',
                '<p>植物细胞画细胞壁、细胞膜、细胞质、细胞核、线粒体和液泡。叶绿体只存在于植物的绿色部分。</p>',
                '<p>人口腔上皮细胞只有细胞膜、细胞质、细胞核和线粒体。</p>',
                '<p id="grade7-cell-mount-caption"></p>'
            ].join('');
        }
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.style.display = 'flex';
        controls.innerHTML = [
            '<button class="control-btn" id="grade7-cell-mount-btn-leaf">整片叶子</button>',
            '<button class="control-btn" id="grade7-cell-mount-btn-onion">洋葱内表皮</button>',
            '<button class="control-btn" id="grade7-cell-mount-btn-hydrilla">黑藻叶片</button>',
            '<button class="control-btn" id="grade7-cell-mount-btn-cheek">人口腔上皮</button>',
            '<button class="control-btn" id="grade7-cell-mount-btn-flat">盖玻片平放</button>',
            '<button class="control-btn" id="grade7-cell-mount-btn-edge">一侧先接触</button>',
            '<button class="control-btn" id="grade7-cell-mount-btn-iodine">滴加碘液</button>'
        ].join('');
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        };
        bind('grade7-cell-mount-btn-leaf', () => this.setMode('leaf'));
        bind('grade7-cell-mount-btn-onion', () => this.setMode('onion'));
        bind('grade7-cell-mount-btn-hydrilla', () => this.setMode('hydrilla'));
        bind('grade7-cell-mount-btn-cheek', () => this.setMode('cheek'));
        bind('grade7-cell-mount-btn-flat', () => this.setSlip('flat'));
        bind('grade7-cell-mount-btn-edge', () => this.setSlip('edge'));
        bind('grade7-cell-mount-btn-iodine', () => this.toggleIodine());
    }
    animate(time, delta) {
        this.movers.forEach((item) => {
            item.ang += item.speed * delta;
            item.mesh.position.x = item.cx + Math.cos(item.ang) * item.rx;
            item.mesh.position.z = item.cz + Math.sin(item.ang) * item.rz;
        });
        if (this.bubble && this.bubble.parent) {
            const base = this.bubble.userData.baseY || 0.48;
            this.bubble.position.y = base + Math.sin(time * 2.1) * 0.03;
        }
    }
    getInteractables() {
        return this.interactables;
    }
    disposeTree(root) {
        if (!root) return;
        const geos = new Set();
        const mats = new Set();
        root.traverse((node) => {
            if (node.geometry && !geos.has(node.geometry)) {
                geos.add(node.geometry);
                node.geometry.dispose();
            }
            const bag = node.material;
            const list = Array.isArray(bag) ? bag : (bag ? [bag] : []);
            list.forEach((mat) => {
                if (mat && !mats.has(mat)) {
                    mats.add(mat);
                    mat.dispose();
                }
            });
        });
    }
    dispose() {
        if (this.coverslip && this.coverslip.parent) this.coverslip.parent.remove(this.coverslip);
        if (this.bubble && this.bubble.parent) this.bubble.parent.remove(this.bubble);
        this.disposeTree(this.coverslip);
        this.disposeTree(this.bubble);
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
            this.disposeTree(this.mainGroup);
            this.mainGroup = null;
        }
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
        this.interactables.length = 0;
        this.movers = [];
    }
};
