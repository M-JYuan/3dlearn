window.Grade7PlantLevelsScene = class Grade7PlantLevelsScene {
    constructor(scene, camera, renderer) {
        this.scene = scene; this.camera = camera; this.renderer = renderer;
        this.id = 'grade7-plant-levels';
        this.lights = []; this.interactables = []; this.geos = new Set(); this.mats = new Set();
        this.organMeshes = []; this.layers = []; this.riders = []; this.flows = []; this.markers = [];
        this.mode = 'whole'; this.grow = 0.35; this.wilt = 0; this.barkFall = 0; this.girdled = false; this.pinched = false;
        this.divideT = 0; this.t = 0; this.pickedOrgan = '';
        this.hiMap = {
            whole: [],
            veg: ['root', 'stem', 'leaf'], rep: ['flower', 'fruit', 'seed'],
            meristem: ['root', 'bud', 'roottip'], protect: ['root', 'stem', 'leaf'],
            support: ['stem', 'leaf', 'flower', 'fruit', 'seed'],
            transport: ['root', 'stem', 'leaf', 'flower', 'fruit'],
            paren: ['root', 'stem', 'leaf', 'flower', 'fruit', 'seed'],
            system: [], lotus: [], girdle: ['stem'], pinch: ['bud', 'roottip']
        };
        this.copy = {
            whole: ['油菜的结构层次', '<p>这株油菜有六种器官。根、茎、叶是营养器官，花、果实、种子是生殖器官。</p><p>植物没有系统这一层。点器官可以单独看，下面的按钮会换成不同的组织和生活现象。</p>'],
            veg: ['营养器官', '<p>发亮的是根、茎、叶。它们负责吸收、支持和制造养料，合称营养器官。</p>'],
            rep: ['生殖器官', '<p>发亮的是花、果实和种子。它们负责繁殖后代，合称生殖器官。</p>'],
            meristem: ['分生组织', '<p>根尖和顶芽里的细胞小、壁薄、细胞核大、细胞质浓，而且终生都能分裂。</p><p>旁边的细胞会不断变多。其他组织都是由这里产生的新细胞变化来的。</p>'],
            protect: ['保护组织', '<p>根、茎、叶外面多了一层半透明的表皮。这就是保护组织，包在这些器官的表面。</p>'],
            support: ['机械组织', '<p>机械组织的细胞壁很厚，能支持和保护。</p><p>茎、叶柄、叶、花柄、果皮和种皮里都有。左边的芦苇茎很坚韧，主要就是这种组织。</p>'],
            transport: ['输导组织', '<p>蓝色导管把水和无机盐向上送，橙色筛管运送有机物。它们出现在根、茎、叶、花和果实里，把器官连起来。</p>'],
            paren: ['薄壁组织', '<p>薄壁组织壁薄、液泡较大，六个器官里都很多。</p><p>叶里带绿色小点的细胞能利用光制造有机物。果实和种子里的细胞则把养料存起来。</p>'],
            system: ['没有系统', '<p>左边五级是人体：细胞、组织、器官、系统、个体。</p><p>右边是油菜：细胞、组织、器官之后直接到个体。红叉表示没有系统。人体有系统，这株植物没有。</p>'],
            lotus: ['藕是茎', '<p>藕有节，节上还能长芽，所以是茎，不是根。拉断时抽出的丝是输导组织。</p><p>旁边那条越往下越细、没有节的，才是根。</p>'],
            girdle: ['环剥树皮', '<p>一圈树皮被剥掉后，皮里的筛管断了，橙色颗粒过不了剥口。</p><p>茎里面的导管还通着，水仍能向上。有机物送不到下面，植株就会死亡。</p>'],
            pinch: ['摘去顶芽', '<p>顶芽尖端的分生组织被去掉了。这个尖端不再添加新细胞，茎就不再由此长高。</p><p>根尖的分生组织还在。</p>']
        };
    }

    init() {
        this.camera.position.set(1.35, 1.45, 6.8);
        this.camera.lookAt(0.15, 0.7, 0);
        this.scene.background = new THREE.Color(0xeef6e6);
        const amb = new THREE.AmbientLight(0xfff8ef, 0.72);
        const dir = new THREE.DirectionalLight(0xffffff, 0.82); dir.position.set(4, 8, 5);
        const fill = new THREE.PointLight(0xfff0c8, 0.35, 20); fill.position.set(-3, 2, 3);
        [amb, dir, fill].forEach((light) => { this.scene.add(light); this.lights.push(light); });
        this.S = new THREE.SphereGeometry(1, 16, 12); this.B = new THREE.BoxGeometry(1, 1, 1);
        this.C = new THREE.CylinderGeometry(1, 1, 1, 12); this.K = new THREE.ConeGeometry(1, 1, 8);
        this.T = new THREE.TorusGeometry(1, 0.18, 6, 14);
        [this.S, this.B, this.C, this.K, this.T].forEach((geo) => this.geos.add(geo));
        this.group = new THREE.Group(); this.scene.add(this.group);
        const floor = this.M(this.group, new THREE.CircleGeometry(3.8, 36), 0xd7e8c8, 1, 0, -1.35, 0, 1, 1, 1);
        floor.rotation.x = -Math.PI / 2;
        this.buildPlant(); this.buildMicro(); this.buildLotus(); this.buildLadders(); this.buildReed();
        this.setupUI(); this.setMode('whole');
    }

    mat(color, op, wire) {
        const m = wire
            ? new THREE.MeshBasicMaterial({ color: color, wireframe: true })
            : new THREE.MeshStandardMaterial({ color: color, roughness: 0.55, metalness: 0, emissive: 0x000000, transparent: op < 0.98, opacity: op, side: THREE.DoubleSide, depthWrite: op >= 0.9 });
        this.mats.add(m); return m;
    }

    M(parent, geo, color, op, x, y, z, sx, sy, sz, organ, name, desc, layer) {
        const mesh = new THREE.Mesh(geo, this.mat(color, op));
        mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); this.geos.add(geo);
        if (organ) { mesh.userData.organ = organ; this.organMeshes.push(mesh); }
        if (name) { mesh.userData.name = name; mesh.userData.description = desc; mesh.userData.onClick = () => this.pickMesh(mesh); this.interactables.push(mesh); }
        if (layer) { mesh.userData.layer = layer; this.layers.push(mesh); }
        return mesh;
    }

    say(title, html) {
        document.getElementById('info-panel')?.classList.add('visible');
        document.getElementById('info-title').textContent = title;
        document.getElementById('info-content').innerHTML = html;
    }

    setupUI() {
        const b = (id, label) => `<button class="control-btn" id="${this.id}-${id}" type="button">${label}</button>`;
        document.getElementById('scene-controls').innerHTML = [b('whole', '整株油菜'), b('veg', '营养器官'), b('rep', '生殖器官'), b('meristem', '分生组织'), b('protect', '保护组织'), b('support', '机械组织'), b('transport', '输导组织'), b('paren', '薄壁组织'), b('system', '没有系统'), b('lotus', '藕是茎'), b('girdle', '环剥树皮'), b('pinch', '摘去顶芽'), b('reset', '恢复植株')].join('');
        const go = (id, fn) => document.getElementById(this.id + '-' + id).addEventListener('click', fn);
        ['whole', 'veg', 'rep', 'meristem', 'protect', 'support', 'transport', 'paren', 'system', 'lotus'].forEach((id) => go(id, () => this.setMode(id)));
        go('girdle', () => { this.girdled = true; this.setMode('girdle'); });
        go('pinch', () => { this.pinched = true; this.setMode('pinch'); });
        go('reset', () => { this.girdled = false; this.pinched = false; this.wilt = 0; this.barkFall = 0; this.grow = 0.35; this.setMode('whole'); });
    }

    setMode(mode) {
        this.mode = mode; this.pickedOrgan = ''; this.applyMode();
        const row = this.copy[mode]; this.say(row[0], row[1]);
    }

    buildPlant() {
        this.plant = new THREE.Group(); this.group.add(this.plant);
        const rootGeo = new THREE.CylinderGeometry(0.035, 0.14, 1.2, 10); this.geos.add(rootGeo);
        this.M(this.plant, rootGeo, 0x8d6246, 1, 0, -0.62, 0, 1, 1, 1, 'root', '根', '根是营养器官，能固定植株，并吸收水和无机盐。');
        for (let i = 0; i < 3; i += 1) {
            const side = this.M(this.plant, this.C, 0x7a5538, 1, 0, -0.45 - i * 0.22, 0, 0.035, 0.42, 0.035, 'root', '根', '侧根也属于根，同样是营养器官。');
            side.rotation.z = (i % 2 ? 0.8 : -0.8); side.rotation.x = i * 0.3;
        }
        for (let i = 0; i < 4; i += 1) this.M(this.plant, this.K, 0xc4a07a, 1, Math.cos(i) * 0.12, -0.9 - (i % 2) * 0.15, Math.sin(i) * 0.12, 0.025, 0.12, 0.025, 'root', '根毛', '细小的根毛增大了根的吸收面积。');
        this.tip = new THREE.Group(); this.tip.position.set(0, -1.28, 0); this.plant.add(this.tip);
        for (let i = 0; i < 5; i += 1) this.M(this.tip, this.S, 0xc6ef9a, 1, (i - 2) * 0.05, (i % 2) * 0.05, 0, 0.045, 0.045, 0.045, 'roottip', '根尖', '根尖有分生组织，细胞小、核大，能不断分裂产生新细胞。');
        this.stem = this.M(this.plant, this.C, 0x3f8f4a, 1, 0, 0.8, 0, 0.1, 1.6, 0.1, 'stem', '茎', '茎是营养器官，支撑叶和花，里面有输导组织。');
        this.bark = this.M(this.plant, this.C, 0x8a5a32, 0.96, 0, 0.7, 0, 0.16, 0.26, 0.16, 'stem', '树皮', '这一圈是树皮。筛管就分布在树皮里。');
        this.blue = this.M(this.plant, this.C, 0x3d7edb, 1, 0.035, 0.7, 0, 0.02, 1, 0.02, null, '导管', '导管运送水和无机盐，方向是向上。', 'transport');
        this.orangeUp = this.M(this.plant, this.C, 0xe39a3a, 1, -0.035, 0.9, 0, 0.018, 1, 0.018, null, '筛管', '筛管运送有机物。环剥以后，树皮里的筛管会断开。', 'transport');
        this.orangeLow = this.M(this.plant, this.C, 0xe39a3a, 1, -0.035, 0.2, 0, 0.018, 0.4, 0.018, null, '筛管', '剥口下面的筛管接不上来自叶的有机物。', 'transport');
        for (let i = 0; i < 3; i += 1) this.addLeaf(0.32 + i * 0.2, i * 2.15, i % 2 ? 1 : -1);
        for (let i = 0; i < 3; i += 1) this.addFlower(0.92 + i * 0.06, -0.5 + i * 0.7);
        this.addPod(0.7, 0.9, false); this.addPod(0.78, 2.4, true);
        this.bud = new THREE.Group(); this.plant.add(this.bud); this.riders.push(this.bud); this.bud.userData.frac = 1.05;
        this.M(this.bud, this.S, 0x8fd18a, 1, 0, 0.12, 0, 0.1, 0.14, 0.1, 'bud', '顶芽', '顶芽尖端是分生组织，能继续添加细胞，让茎长高。');
        for (let i = 0; i < 4; i += 1) this.M(this.bud, this.S, 0xd7efb0, 1, Math.cos(i) * 0.06, 0.05, Math.sin(i) * 0.06, 0.035, 0.035, 0.035, 'bud', '顶芽', '这些小细胞代表顶芽里的分生组织。');
        this.scar = this.M(this.plant, this.C, 0xc4d2a4, 1, 0, 0, 0, 0.08, 0.03, 0.08, 'bud', '摘口', '顶芽被摘掉后，这里不再有分生组织，茎不再由此长高。');
        this.riders.push(this.scar); this.scar.userData.frac = 1.02;
        for (let i = 0; i < 8; i += 1) {
            const water = this.M(this.plant, this.S, 0x3d7edb, 1, 0.035, 0, 0.06, 0.035, 0.035, 0.035, null, i ? null : '水和无机盐', i ? null : '蓝色颗粒沿导管向上，表示水和无机盐被送到上面的器官。');
            const sugar = this.M(this.plant, this.S, 0xe39a3a, 1, -0.035, 0, 0.06, 0.035, 0.035, 0.035, null, i ? null : '有机物', i ? null : '橙色颗粒沿筛管运送有机物。筛管断了，它们就过不去。');
            this.flows.push({ mesh: water, frac: i / 8, dir: 1 });
            this.flows.push({ mesh: sugar, frac: i / 8, dir: -1 });
        }
    }

    addLeaf(frac, ang, droop) {
        const g = new THREE.Group(); g.rotation.y = ang; g.userData.frac = frac; g.userData.droop = droop; g.userData.baseZ = 0;
        this.plant.add(g); this.riders.push(g);
        const pet = this.M(g, this.C, 0x3f8f4a, 1, 0.26, 0, 0, 0.02, 0.46, 0.02, 'leaf', '叶', '叶是营养器官。叶柄把叶片和茎连起来。');
        pet.rotation.z = Math.PI / 2;
        this.M(g, this.S, 0x4ea24d, 1, 0.7, 0.02, 0, 0.36, 0.045, 0.18, 'leaf', '叶', '叶片里有保护组织、薄壁组织和叶脉中的输导、机械组织。');
        const skin = this.M(g, this.S, 0xdff5c8, 0.28, 0.7, 0.02, 0, 0.4, 0.07, 0.21, 'leaf', '表皮', '叶的表面有一层保护组织，叫做表皮。', 'epi');
        const rib = this.M(g, this.C, 0xc2a15a, 1, 0.55, 0.03, 0, 0.018, 0.5, 0.018, 'leaf', '叶脉', '叶和叶柄里较硬的部分有机械组织，也有输导组织。', 'support');
        rib.rotation.z = Math.PI / 2;
        this.M(g, this.C, 0x3d7edb, 1, 0.28, 0.02, 0.02, 0.01, 0.4, 0.01, null, '导管', '叶脉里的导管把水送进叶。', 'transport').rotation.z = Math.PI / 2;
        this.M(g, this.C, 0xe39a3a, 1, 0.28, 0.02, -0.02, 0.01, 0.4, 0.01, null, '筛管', '叶制造的有机物经筛管运走。', 'transport').rotation.z = Math.PI / 2;
        for (let i = 0; i < 4; i += 1) this.M(g, this.S, 0x1f8f3a, 1, 0.52 + i * 0.1, 0.07, 0.07, 0.04, 0.04, 0.04, null, '叶绿体', '这些绿色小点表示叶绿体。这样的薄壁细胞能利用光制造有机物。', 'paren');
        skin.visible = false; rib.visible = false;
    }

    addFlower(frac, ang) {
        const g = new THREE.Group(); g.rotation.y = ang; g.userData.frac = frac; g.userData.droop = 0.35; this.plant.add(g); this.riders.push(g);
        const stalk = this.M(g, this.C, 0x4f9a52, 1, 0.18, 0.08, 0, 0.015, 0.28, 0.015, 'flower', '花', '花是生殖器官。这根花柄里也有机械组织和输导组织。');
        stalk.rotation.z = Math.PI / 3;
        this.M(g, this.C, 0xc2a15a, 1, 0.18, 0.1, 0, 0.02, 0.28, 0.02, null, '花柄', '花柄需要机械组织支撑花朵。', 'support').rotation.z = Math.PI / 3;
        this.M(g, this.C, 0x3d7edb, 1, 0.18, 0.08, 0.03, 0.008, 0.24, 0.008, null, '导管', '花柄里的导管把水送到花。', 'transport').rotation.z = Math.PI / 3;
        this.M(g, this.C, 0xe39a3a, 1, 0.18, 0.08, -0.03, 0.008, 0.24, 0.008, null, '筛管', '筛管把有机物送到花。', 'transport').rotation.z = Math.PI / 3;
        for (let i = 0; i < 4; i += 1) this.M(g, this.S, 0xf2d34a, 1, 0.34 + Math.cos(i * Math.PI / 2) * 0.1, 0.2 + Math.sin(i * Math.PI / 2) * 0.06, 0, 0.09, 0.035, 0.06, 'flower', '花瓣', '油菜的花是黄色的，属于生殖器官。');
        this.M(g, this.S, 0x8fbf55, 1, 0.34, 0.2, 0, 0.04, 0.04, 0.04, 'flower', '花', '花的中心将来能发育出果实和种子。');
    }

    addPod(frac, ang, open) {
        const g = new THREE.Group(); g.rotation.y = ang; g.userData.frac = frac; g.userData.droop = 0.55; this.plant.add(g); this.riders.push(g);
        const stalk = this.M(g, this.C, 0x4f9a52, 1, 0.16, -0.02, 0, 0.012, 0.24, 0.012, 'fruit', '果实', '油菜的果实是长角果，属于生殖器官。果皮里有机械组织。');
        stalk.rotation.z = 1.1;
        this.M(g, this.C, 0x3d7edb, 1, 0.16, -0.02, 0.02, 0.007, 0.2, 0.007, null, '导管', '果柄里也有导管，果实因此和茎相连。', 'transport').rotation.z = 1.1;
        this.M(g, this.C, 0xe39a3a, 1, 0.16, -0.02, -0.02, 0.007, 0.2, 0.007, null, '筛管', '有机物经筛管进入果实。', 'transport').rotation.z = 1.1;
        if (!open) {
            this.M(g, this.C, 0x7fbf63, 1, 0.34, -0.16, 0, 0.045, 0.42, 0.045, 'fruit', '果皮', '闭合的长角果。果皮较韧，含有机械组织。');
            return;
        }
        this.M(g, this.C, 0x7fbf63, 1, 0.34, -0.16, 0.06, 0.04, 0.4, 0.02, 'fruit', '果皮', '剥开的果皮仍是果实的一部分，里面有机械组织。');
        this.M(g, this.C, 0x6eae58, 1, 0.34, -0.16, -0.06, 0.04, 0.4, 0.02, 'fruit', '果皮', '另一半果皮。果实里的薄壁细胞会贮存养料。');
        for (let i = 0; i < 4; i += 1) {
            this.M(g, this.S, 0xc4a15a, 1, 0.28 + i * 0.07, -0.16, 0, 0.035, 0.028, 0.035, 'seed', '种子', '种子是生殖器官。种皮有机械组织保护，内部的薄壁细胞贮存养料。');
            this.M(g, this.B, 0xe6c36a, 1, 0.28 + i * 0.07, -0.1, 0.05, 0.02, 0.02, 0.02, null, '贮存的养料', '果实和种子里的薄壁细胞会把养料存起来。', 'paren');
        }
    }

    buildMicro() {
        this.micro = new THREE.Group(); this.micro.position.set(2.15, 0.9, 0); this.group.add(this.micro);
        this.micros = { meristem: new THREE.Group(), protect: new THREE.Group(), support: new THREE.Group(), transport: new THREE.Group(), paren: new THREE.Group() };
        Object.keys(this.micros).forEach((key) => this.micro.add(this.micros[key]));
        this.divideCells = [];
        for (let i = 0; i < 9; i += 1) {
            const box = this.M(this.micros.meristem, this.B, 0x7da86a, 1, (i % 3 - 1) * 0.22, 0.15 - Math.floor(i / 3) * 0.22, 0, 0.2, 0.2, 0.16, null, '分生细胞', '细胞小，细胞壁薄，细胞核大，细胞质浓，能不断分裂。');
            box.material.wireframe = true;
            this.M(box, this.S, 0x6a4cb5, 1, 0, 0, 0, 0.45, 0.45, 0.45, null, '细胞核', '分生组织的细胞核相对很大。');
            this.divideCells.push(box);
        }
        for (let i = 0; i < 5; i += 1) this.M(this.micros.protect, this.B, 0xf3d2b0, 1, (i - 2) * 0.28, 0, 0, 0.26, 0.08, 0.22, null, '表皮细胞', '保护组织排列成一层，覆盖在根、茎、叶的表面。');
        for (let i = 0; i < 3; i += 1) {
            const wall = this.M(this.micros.support, this.B, 0xc48a4a, 1, (i - 1) * 0.42, 0, 0, 0.34, 0.34, 0.34, null, '厚壁细胞', '细胞壁很厚，所以机械组织坚韧，能支持和保护。');
            this.M(wall, this.B, 0x6b4a2a, 1, 0, 0, 0, 0.42, 0.42, 0.42);
        }
        this.M(this.micros.transport, this.C, 0x3d7edb, 1, -0.2, 0, 0, 0.08, 0.7, 0.08, null, '导管', '放大后的导管。蓝色颗粒向上，运的是水和无机盐。');
        this.M(this.micros.transport, this.C, 0xe39a3a, 1, 0.2, 0, 0, 0.08, 0.7, 0.08, null, '筛管', '放大后的筛管。橙色颗粒运送有机物。');
        this.microWater = this.M(this.micros.transport, this.S, 0x9fd0ff, 1, -0.2, -0.2, 0.1, 0.05, 0.05, 0.05);
        this.microSugar = this.M(this.micros.transport, this.S, 0xffd27a, 1, 0.2, 0.2, 0.1, 0.05, 0.05, 0.05);
        const left = this.M(this.micros.paren, this.B, 0x8fbf73, 1, -0.38, 0, 0, 0.42, 0.42, 0.36, null, '薄壁细胞', '壁薄、液泡大。这个细胞里有叶绿体，能利用光制造有机物。');
        left.material.wireframe = true;
        this.M(left, this.S, 0xe8f6ff, 0.45, 0, 0, 0, 0.45, 0.45, 0.45, null, '液泡', '薄壁细胞的液泡比较大。');
        for (let i = 0; i < 3; i += 1) this.M(left, this.S, 0x2f9d45, 1, -0.2 + i * 0.2, 0.3, 0.4, 0.12, 0.12, 0.12);
        const right = this.M(this.micros.paren, this.B, 0xd2c48a, 1, 0.38, 0, 0, 0.42, 0.42, 0.36, null, '贮存细胞', '果实和种子里的薄壁细胞把养料存起来。');
        right.material.wireframe = true;
        this.M(right, this.S, 0xe8f6ff, 0.35, 0, 0, 0, 0.4, 0.4, 0.4);
        for (let i = 0; i < 3; i += 1) this.M(right, this.B, 0xe6b84a, 1, -0.15 + i * 0.15, -0.1, 0.45, 0.12, 0.12, 0.12, null, '养料', '黄色小块表示细胞里贮存的养料。');
    }

    buildLotus() {
        this.lotus = new THREE.Group(); this.lotus.position.set(1.7, 0.15, 0); this.group.add(this.lotus);
        for (let i = 0; i < 3; i += 1) {
            const seg = this.M(this.lotus, this.C, 0xf3e2c0, 1, -0.85 + i * 0.7, 0, 0, 0.2, 0.48, 0.2, null, '藕', '藕有明显的节，节上可以长芽，所以是茎，不是根。');
            seg.rotation.z = Math.PI / 2;
            this.M(this.lotus, this.T, 0xe7d3a8, 1, -0.55 + i * 0.7, 0, 0, 0.22, 0.22, 0.22, null, '节', '节是茎的特征。根没有这样的节。').rotation.y = Math.PI / 2;
        }
        this.M(this.lotus, this.K, 0x8fd18a, 1, -0.15, 0.28, 0, 0.08, 0.2, 0.08, null, '芽', '节上的芽说明藕是茎。');
        for (let i = 0; i < 6; i += 1) {
            const a = i / 6 * Math.PI * 2;
            this.M(this.lotus, this.C, 0x5c4030, 1, 0.55, Math.sin(a) * 0.1, Math.cos(a) * 0.1, 0.03, 0.04, 0.03, null, '切面', '切开后能看到一些小孔。课本要看的是节和拉出来的丝，丝是输导组织。').rotation.z = Math.PI / 2;
        }
        for (let i = 0; i < 7; i += 1) {
            const thread = this.M(this.lotus, this.C, 0xe39a3a, 1, 0.15, (i - 3) * 0.035, 0, 0.006, 0.34, 0.006, null, '输导组织', '藕断丝连时拉出的丝，是输导组织。');
            thread.rotation.z = Math.PI / 2 + (i - 3) * 0.08;
        }
        const realRoot = new THREE.CylinderGeometry(0.02, 0.1, 0.8, 8); this.geos.add(realRoot);
        this.M(this.lotus, realRoot, 0x8d6246, 1, 1.15, -0.15, 0, 1, 1, 1, null, '根', '这条越往下越细，没有节，也没有芽，才是根。');
    }

    buildLadders() {
        this.ladders = new THREE.Group(); this.ladders.position.set(1.85, 0.15, 0); this.group.add(this.ladders);
        for (let i = 0; i < 5; i += 1) this.M(this.ladders, this.B, 0x8eb4d4, 1, -0.55, -0.7 + i * 0.38, 0, 0.7, 0.22, 0.22);
        for (let i = 0; i < 5; i += 1) {
            if (i !== 3) { this.M(this.ladders, this.B, 0x8fbf73, 1, 0.55, -0.7 + i * 0.38, 0, 0.7, 0.22, 0.22); continue; }
            const a = this.M(this.ladders, this.B, 0xd23b4a, 1, 0.55, -0.7 + i * 0.38, 0, 0.62, 0.05, 0.05, null, '没有系统', '红叉的位置是系统。油菜没有这一层，人体才有。');
            const b = this.M(this.ladders, this.B, 0xd23b4a, 1, 0.55, -0.7 + i * 0.38, 0, 0.62, 0.05, 0.05, null, '没有系统', '人体有系统，这株油菜没有。');
            a.rotation.z = 0.75; b.rotation.z = -0.75;
        }
        this.M(this.ladders, this.S, 0xf0c7a8, 1, -0.55, -1.15, 0, 0.12, 0.12, 0.12);
        this.M(this.ladders, this.B, 0xf0c7a8, 1, -0.55, -1.38, 0, 0.22, 0.24, 0.1);
        this.M(this.ladders, this.C, 0x3f8f4a, 1, 0.55, -1.28, 0, 0.03, 0.32, 0.03);
        this.M(this.ladders, this.S, 0xf2d34a, 1, 0.55, -1.05, 0, 0.08, 0.08, 0.08);
    }

    buildReed() {
        this.reed = new THREE.Group(); this.reed.position.set(-1.7, 0.15, 0); this.group.add(this.reed);
        this.M(this.reed, this.C, 0xd7c39a, 1, 0, 0.55, 0, 0.08, 1.5, 0.08, null, '芦苇茎', '芦苇的茎又直又韧，主要是机械组织。');
        this.M(this.reed, this.C, 0xf6efd8, 1, 0, 0.55, 0, 0.045, 1.5, 0.045);
    }

    applyMode() {
        const mode = this.mode;
        const tubes = mode === 'transport' || mode === 'girdle';
        this.layers.forEach((mesh) => {
            const layer = mesh.userData.layer;
            mesh.visible = (layer === 'epi' && mode === 'protect') || (layer === 'support' && mode === 'support') || (layer === 'paren' && mode === 'paren') || (layer === 'transport' && tubes);
        });
        this.micro.visible = ['meristem', 'protect', 'support', 'transport', 'paren', 'pinch'].indexOf(mode) >= 0;
        Object.keys(this.micros).forEach((key) => { this.micros[key].visible = key === mode || (key === 'meristem' && mode === 'pinch'); });
        this.reed.visible = mode === 'support';
        this.lotus.visible = mode === 'lotus';
        this.ladders.visible = mode === 'system';
        this.plant.position.x = mode === 'lotus' ? -1.35 : (mode === 'system' ? -0.4 : 0);
        this.bud.visible = !this.pinched; this.scar.visible = this.pinched;
        this.highlight();
    }

    highlight() {
        const hot = this.hiMap[this.mode] || [];
        this.organMeshes.forEach((mesh) => {
            const on = hot.indexOf(mesh.userData.organ) >= 0 || mesh.userData.organ === this.pickedOrgan;
            mesh.material.emissive.set(on ? 0xfff3c4 : 0x000000);
            mesh.material.emissiveIntensity = on ? 0.5 : 0.04;
        });
    }

    animate(time, delta) {
        this.t += delta; this.divideT += delta;
        if (!this.pinched) this.grow = Math.min(1, this.grow + delta * 0.07);
        if (this.girdled) this.wilt = Math.min(1, this.wilt + delta * 0.12);
        else this.wilt = Math.max(0, this.wilt - delta * 0.35);
        if (this.girdled) this.barkFall = Math.min(1, this.barkFall + delta * 0.4);
        else this.barkFall = Math.max(0, this.barkFall - delta * 0.6);
        const h = 1.25 + this.grow * 0.95;
        this.stem.scale.y = h; this.stem.position.y = h / 2;
        this.riders.forEach((obj) => {
            obj.position.y = h * obj.userData.frac;
            if (obj.userData.droop) obj.rotation.z = obj.userData.droop * this.wilt * 0.7;
        });
        const cut = h * 0.48;
        this.bark.position.set(0, cut - this.barkFall * 1.15, this.barkFall * 0.75);
        this.bark.rotation.z = this.barkFall * 1.1;
        this.bark.material.opacity = 0.96 - this.barkFall * 0.8;
        const tubes = this.mode === 'transport' || this.mode === 'girdle';
        this.blue.visible = tubes; this.orangeUp.visible = tubes; this.orangeLow.visible = tubes && this.girdled;
        this.blue.scale.y = h + 0.45; this.blue.position.y = (h - 0.45) / 2;
        if (this.girdled) {
            const upper = Math.max(0.18, h - cut);
            this.orangeUp.scale.y = upper; this.orangeUp.position.y = cut + upper / 2 + 0.04;
            this.orangeLow.scale.y = cut + 0.35; this.orangeLow.position.y = (cut - 0.45) / 2;
        } else {
            this.orangeUp.scale.y = h + 0.45; this.orangeUp.position.y = (h - 0.45) / 2;
        }
        this.flows.forEach((p) => {
            p.mesh.visible = tubes;
            p.frac += p.dir * delta * 0.18;
            if (p.dir > 0 && p.frac > 1.05) p.frac = -0.25;
            if (p.dir < 0 && this.girdled && p.frac < 0.5) p.frac = 1.02;
            if (p.dir < 0 && p.frac < -0.2) p.frac = 1.02;
            p.mesh.position.y = p.frac * h;
        });
        const shown = 4 + Math.floor(this.divideT % 5);
        this.divideCells.forEach((cell, i) => { cell.visible = i < shown; });
        if (this.tip && (this.mode === 'meristem' || this.mode === 'pinch')) this.tip.scale.setScalar(1 + Math.sin(this.t * 3) * 0.08);
        else if (this.tip) this.tip.scale.setScalar(1);
        if (this.microWater) {
            this.microWater.position.y = -0.25 + ((this.t * 0.25) % 1) * 0.5;
            this.microSugar.position.y = 0.25 - ((this.t * 0.25) % 1) * 0.5;
        }
    }

    pickMesh(mesh) {
        if (!mesh?.userData?.name) return;
        this.pickedOrgan = mesh.userData.organ || '';
        this.highlight();
        mesh.material.emissive.set(0xfff3c4); mesh.material.emissiveIntensity = 0.75;
        this.say(mesh.userData.name, '<p>' + mesh.userData.description + '</p>');
    }

    getInteractables() { return this.interactables; }

    dispose() {
        this.geos.forEach((geo) => geo.dispose());
        this.mats.forEach((m) => m.dispose());
        if (this.group) this.scene.remove(this.group);
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = []; this.interactables = []; this.group = null;
        const box = document.getElementById('scene-controls');
        if (box) box.innerHTML = '';
    }
};
