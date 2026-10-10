window.Grade7AnimalLevelsScene = class Grade7AnimalLevelsScene {
    constructor(scene, camera, renderer) {
        this.scene = scene; this.camera = camera; this.renderer = renderer;
        this.id = 'grade7-animal-levels';
        this.lights = []; this.interactables = []; this.geos = new Set(); this.mats = new Set();
        this.parts = {}; this.shells = []; this.sets = {}; this.flex = []; this.layers = []; this.piv = {};
        this.epiDrops = []; this.blood = []; this.originCells = [];
        this.level = 0; this.view = 'level'; this.tissueKey = 'epi'; this.systemKey = 'digest';
        this.scrambled = false; this.cut = 0; this.cutTarget = 0; this.origin = 0; this.originPlay = false;
        this.bolusU = 0; this.t = 0; this.selectedKey = '';
        this._v = new THREE.Vector3();
    }
    init() {
        this.camera.position.set(0, 1.05, 8.6);
        this.camera.lookAt(0, 0.55, 0);
        this.scene.background = new THREE.Color(0xe7eef6);
        const amb = new THREE.AmbientLight(0xfff8ef, 0.7);
        const dir = new THREE.DirectionalLight(0xffffff, 0.85);
        dir.position.set(3.5, 8, 6);
        const fill = new THREE.PointLight(0xd9e6ff, 0.35, 24);
        fill.position.set(-4, 2, 3);
        [amb, dir, fill].forEach((light) => { this.scene.add(light); this.lights.push(light); });
        this.S = new THREE.SphereGeometry(1, 18, 14); this.B = new THREE.BoxGeometry(1, 1, 1);
        this.C = new THREE.CylinderGeometry(1, 1, 1, 12); this.K = new THREE.ConeGeometry(1, 1, 8);
        this.T = new THREE.TorusGeometry(1, 0.28, 8, 18);
        [this.S, this.B, this.C, this.K, this.T].forEach((geo) => this.geos.add(geo));
        this.root = new THREE.Group(); this.scene.add(this.root);
        const floor = this.P(this.root, new THREE.CircleGeometry(4.2, 36), 0xdbe6f2, 1, 0, -1.35, 0, 1, 1, 1, null);
        floor.rotation.x = -Math.PI / 2;
        this.buildCell(); this.buildTissues(); this.buildPerson(); this.buildStomach();
        this.buildSkin(); this.buildOrigin(); this.buildCompare(); this.setupUI(); this.apply(); this.sayLevel();
    }
    mat(color, op) {
        const m = new THREE.MeshStandardMaterial({ color: color, roughness: 0.52, metalness: 0, emissive: 0x000000, transparent: op < 0.98, opacity: op, side: THREE.DoubleSide, depthWrite: op >= 0.9 });
        this.mats.add(m);
        return m;
    }
    P(parent, geo, color, op, x, y, z, sx, sy, sz, info) {
        const mesh = new THREE.Mesh(geo, this.mat(color, op));
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        parent.add(mesh);
        this.geos.add(geo);
        mesh.userData.base = [sx, sy, sz];
        if (info) {
            mesh.userData.name = info[0]; mesh.userData.description = info[1];
            mesh.userData.key = info[2] || ''; mesh.userData.systems = info[3] || [];
            mesh.userData.onClick = () => this.pickMesh(mesh);
            this.interactables.push(mesh); if (info[2]) this.parts[info[2]] = mesh;
        } else this.shells.push(mesh);
        return mesh;
    }
    say(title, html) {
        document.getElementById('info-panel')?.classList.add('visible');
        document.getElementById('info-title').textContent = title;
        document.getElementById('info-content').innerHTML = html;
    }
    setupUI() {
        const b = (id, label) => `<button class="control-btn" id="${this.id}-${id}" type="button">${label}</button>`;
        document.getElementById('scene-controls').innerHTML = [
            b('up', '上到组织'), b('epi', '上皮组织'), b('muscle', '肌肉组织'), b('conn', '结缔组织'), b('nerve', '神经组织'),
            b('pile', '打乱看看'), b('digest', '消化系统'), b('motion', '运动系统'), b('breath', '呼吸系统'), b('circ', '循环系统'),
            b('urinary', '泌尿系统'), b('nerveSys', '神经系统'), b('endo', '内分泌系统'), b('repro', '生殖系统'),
            b('skin', '划破皮肤'), b('origin', '受精卵分化'), b('plant', '开花植物没有系统')
        ].join('');
        const go = (id, fn) => document.getElementById(this.id + '-' + id).addEventListener('click', fn);
        go('up', () => this.goUp()); go('pile', () => this.togglePile()); go('skin', () => this.showSkin());
        go('origin', () => this.showOrigin()); go('plant', () => this.showPlant());
        ['epi', 'muscle', 'conn', 'nerve'].forEach((key) => go(key, () => this.showTissue(key)));
        ['digest', 'motion', 'breath', 'circ', 'urinary', 'nerveSys', 'endo', 'repro'].forEach((key) => go(key, () => this.showSystem(key)));
    }
    buildCell() {
        this.cellG = new THREE.Group();
        this.root.add(this.cellG);
        this.P(this.cellG, this.S, 0xf6d2c4, 0.42, 0, 0.35, 0, 0.78, 0.78, 0.78, ['细胞', '人体的结构从细胞开始。细胞是身体的基本单位。', 'unit', []]);
        this.P(this.cellG, this.S, 0x7a62b0, 1, 0.05, 0.4, 0.05, 0.24, 0.24, 0.24, ['细胞核', '这个细胞里也能看到细胞核。更细的分工要到组织和器官里才看得到。', 'unitCore', []]);
    }
    buildTissues() {
        this.tissueG = new THREE.Group(); this.root.add(this.tissueG);
        ['epi', 'muscle', 'conn', 'nerve'].forEach((key) => { const g = new THREE.Group(); this.tissueG.add(g); this.sets[key] = g; });
        const epi = this.sets.epi; const muscle = this.sets.muscle; const conn = this.sets.conn; const nerve = this.sets.nerve;
        const epiText = '上皮组织细胞排得很紧。皮肤表面的上皮保护身体，肠腺上皮分泌消化液。';
        for (let c = 0; c < 6; c += 1) for (let r = 0; r < 3; r += 1) this.P(epi, this.B, 0xf3b6c4, 1, (c - 2.5) * 0.2, 0.72, (r - 1) * 0.2, 0.18, 0.1, 0.18, ['上皮组织', epiText, 'epiSheet', []]);
        for (let i = 0; i < 8; i += 1) {
            const a = Math.PI + i / 7 * Math.PI;
            this.P(epi, this.B, 0xf7c2d0, 1, Math.cos(a) * 0.34, -0.15 + Math.sin(a) * 0.28, 0, 0.11, 0.11, 0.11, ['肠腺上皮', '杯状的这一圈是肠腺上皮，会分泌消化液。', 'gland', []]);
        }
        for (let i = 0; i < 3; i += 1) {
            const drop = this.P(epi, this.S, 0xf2d36b, 1, -0.12 + i * 0.12, -0.12, 0.12, 0.05, 0.05, 0.05, ['消化液', '黄色小球表示肠腺分泌出来的消化液。', 'juice', []]);
            this.epiDrops.push(drop);
        }
        this.addMuscle(muscle, -0.55, false, 0xd07070, '平滑肌', '平滑肌能收缩和舒张。图里没有画更细的丝状结构。');
        const skeletal = this.addMuscle(muscle, 0, true, 0xc84848, '骨骼肌', '骨骼肌收缩时整条变短，外形有明暗相间的纹路。');
        for (let i = 0; i < 8; i += 1) this.P(skeletal, this.C, i % 2 ? 0xf3d2d2 : 0xc84848, 1, 0, -0.28 + i * 0.08, 0, 0.16, 0.07, 0.16, ['骨骼肌', '明暗条纹只表示骨骼肌的外形，不是更细的收缩结构。', 'skel', []]);
        const cardiac = this.addMuscle(muscle, 0.6, false, 0x8e2430, '心肌', '心肌有分支，也能收缩和舒张，让心脏产生跳动。');
        const branch = this.P(cardiac, this.C, 0x8e2430, 1, 0.12, 0.02, 0, 0.07, 0.28, 0.07, ['心肌', '旁边分出的一支表示心肌细胞彼此连成网，这里不展开更细的结构。', 'cardiac', []]);
        branch.rotation.z = 0.9;
        this.P(conn, this.C, 0xf0e2c8, 1, -0.35, 0.28, 0, 0.12, 0.38, 0.12, ['骨', '骨是结缔组织，能支持和保护身体。', 'boneDemo', []]);
        this.P(conn, this.C, 0xe7d3b0, 1, -0.35, -0.28, 0, 0.12, 0.32, 0.12, ['骨', '两块骨被中间的软骨连在一起。', 'boneDemo2', []]);
        this.P(conn, this.C, 0x9ec4e0, 1, -0.35, 0, 0, 0.16, 0.1, 0.16, ['软骨', '软骨也是结缔组织，能连接，也有缓冲和保护作用。', 'cart', []]);
        this.P(conn, this.S, 0xf8e7c8, 0.45, 0.5, 0.05, 0, 0.34, 0.34, 0.34, ['血液', '血液属于结缔组织，能把养料送到各处。', 'bloodDemo', []]);
        for (let i = 0; i < 5; i += 1) {
            const cell = this.P(conn, this.S, 0xd64545, 1, 0.38 + (i % 3) * 0.1, -0.02 + Math.floor(i / 3) * 0.12, 0.05, 0.06, 0.025, 0.06, ['血细胞', '这些扁圆形细胞在血液里。血液是结缔组织。', 'rbc', []]);
            cell.rotation.x = 0.4;
        }
        this.P(nerve, this.S, 0xd7cdf0, 1, -0.72, 0.05, 0, 0.22, 0.22, 0.22, ['神经细胞', '神经细胞能接受刺激，并把冲动沿突起传出去。', 'soma', []]);
        for (let i = 0; i < 4; i += 1) this.P(nerve, this.K, 0xc7b6e8, 1, -0.92 + (i % 2) * 0.12, 0.16 - i * 0.08, 0.08, 0.05, 0.2, 0.05, ['突起', '这些短突起用来接受刺激。这里不画细胞之间的连接点。', 'dend', []]).rotation.z = -1.1 + i * 0.55;
        this.P(nerve, this.C, 0xb7a6e0, 1, 0.15, 0.05, 0, 0.045, 1.35, 0.045, ['突起', '长突起把冲动传到远处。', 'axon', []]).rotation.z = Math.PI / 2;
        this.impulse = this.P(nerve, this.S, 0xfff2a8, 1, -0.2, 0.05, 0.06, 0.07, 0.07, 0.07, ['传导', '亮点沿突起移动，表示神经冲动正在传导。', 'impulse', []]);
    }
    addMuscle(parent, x, empty, color, name, desc) {
        const g = new THREE.Group(); g.position.x = x; parent.add(g); this.flex.push(g);
        if (!empty) this.P(g, this.S, color, 1, 0, 0, 0, 0.16, 0.48, 0.14, [name, desc, name, []]);
        return g;
    }
    buildPerson() {
        this.person = new THREE.Group();
        this.root.add(this.person);
        const skin = 0xf0c7a8;
        this.P(this.person, this.S, skin, 0.22, 0, 1.72, 0, 0.34, 0.38, 0.32, null);
        this.P(this.person, this.C, skin, 0.22, 0, 1.4, 0, 0.07, 0.18, 0.07, null);
        this.P(this.person, this.B, skin, 0.2, 0, 0.78, 0, 0.78, 1.02, 0.42, null);
        this.P(this.person, this.B, skin, 0.2, 0, 0.2, 0, 0.7, 0.28, 0.4, null);
        this.limb(-0.52, 1.18, 0, 0.08, 0.62, 'armL', 0);
        this.limb(0.52, 1.18, 0, 0.08, 0.62, 'armR', 0);
        this.limb(-0.18, 0.08, 0, 0.09, 0.78, 'legL', 1);
        this.limb(0.18, 0.08, 0, 0.09, 0.78, 'legR', 1);
        const org = [
            ['brain', '脑', '脑是神经系统的重要器官。', 0xf0c0d0, this.S, 0, 1.76, 0, 0.2, 0.16, 0.2, ['nerveSys']],
            ['eyeL', '眼', '眼能感受光，把信息交给神经系统。', 0xf7f7f7, this.S, -0.1, 1.76, 0.28, 0.055, 0.055, 0.05, ['nerveSys']],
            ['eyeR', '眼', '眼能感受光，把信息交给神经系统。', 0xf7f7f7, this.S, 0.1, 1.76, 0.28, 0.055, 0.055, 0.05, ['nerveSys']],
            ['earL', '耳', '耳能感受声音，和神经系统一起工作。', 0xe7b397, this.S, -0.36, 1.7, 0, 0.06, 0.09, 0.04, ['nerveSys']],
            ['earR', '耳', '耳能感受声音，和神经系统一起工作。', 0xe7b397, this.S, 0.36, 1.7, 0, 0.06, 0.09, 0.04, ['nerveSys']],
            ['salivary', '唾液腺', '唾液腺分泌唾液，是消化系统的器官。', 0xf3c9c4, this.S, 0.2, 1.5, 0.24, 0.06, 0.05, 0.05, ['digest']],
            ['thyroid', '甲状腺', '甲状腺是内分泌系统中的腺体。', 0xd98a62, this.S, 0, 1.32, 0.22, 0.12, 0.045, 0.05, ['endo']],
            ['trachea', '气管', '气管把气体送到肺，属于呼吸系统。', 0xf2d8c8, this.C, 0, 1.16, 0.16, 0.035, 0.28, 0.035, ['breath']],
            ['esophagus', '食管', '食管把食物送进胃，属于消化系统。', 0xe7b7a4, this.C, 0, 1.02, 0.06, 0.04, 0.36, 0.04, ['digest']],
            ['lungL', '肺', '肺是呼吸系统的主要器官。', 0xf4c2cc, this.S, -0.24, 0.9, 0.06, 0.18, 0.26, 0.14, ['breath']],
            ['lungR', '肺', '肺是呼吸系统的主要器官。', 0xf4c2cc, this.S, 0.24, 0.9, 0.06, 0.18, 0.26, 0.14, ['breath']],
            ['heart', '心脏', '心脏推动血液在循环系统里流动。', 0xc0392b, this.S, 0.08, 0.8, 0.16, 0.12, 0.14, 0.1, ['circ']],
            ['liver', '肝', '肝是消化系统的器官，参与处理养料。', 0x8d4a3a, this.S, -0.22, 0.52, 0.1, 0.22, 0.14, 0.14, ['digest']],
            ['stomach', '胃', '胃是消化器官，由多种组织按次序构成。', 0xe8a0b0, this.S, 0.2, 0.5, 0.14, 0.13, 0.15, 0.11, ['digest']],
            ['intestine', '肠', '肠属于消化系统，食物在这里继续被消化、吸收。', 0xe07a90, this.T, 0, 0.26, 0.12, 0.16, 0.16, 0.1, ['digest']],
            ['kidneyL', '肾', '肾是泌尿系统的主要器官。', 0xc45a5a, this.S, -0.24, 0.4, -0.08, 0.07, 0.11, 0.05, ['urinary']],
            ['kidneyR', '肾', '肾是泌尿系统的主要器官。', 0xc45a5a, this.S, 0.24, 0.4, -0.08, 0.07, 0.11, 0.05, ['urinary']],
            ['spine', '脊柱', '脊柱属于运动系统，起支持作用。', 0xf3ead8, this.C, 0, 0.75, -0.16, 0.05, 1.15, 0.05, ['motion']],
            ['cord', '神经', '脊髓位于脊柱中，能把冲动在脑和身体之间传递。', 0xf2e39a, this.C, 0, 0.85, -0.08, 0.02, 0.9, 0.02, ['nerveSys']],
            ['reproL', '生殖器官', '生殖系统与繁殖后代有关。图里只标出大致位置，不展开结构。', 0xc7b6d8, this.S, -0.08, 0.08, 0.08, 0.05, 0.06, 0.05, ['repro']],
            ['reproR', '生殖器官', '生殖系统与繁殖后代有关。图里只标出大致位置，不展开结构。', 0xc7b6d8, this.S, 0.08, 0.08, 0.08, 0.05, 0.06, 0.05, ['repro']]
        ];
        org.forEach((row) => this.P(this.person, row[4], row[3], 1, row[5], row[6], row[7], row[8], row[9], row[10], [row[1], row[2], row[0], row[11]]));
        this.vessel = this.P(this.person, this.T, 0xcc4455, 1, 0.1, 0.8, 0.22, 0.18, 0.18, 0.08, ['血管', '血管属于循环系统，负责运输物质。', 'vessel', ['circ']]);
        this.vessel.rotation.x = 1.1;
        this.bolus = this.P(this.person, this.S, 0xc9843a, 1, 0, 1.5, 0.3, 0.05, 0.05, 0.05, ['食物', '小球沿消化道移动，表示消化系统在工作。', 'bolus', ['digest']]);
        this.linkDot = this.P(this.person, this.S, 0xd64545, 1, 0, 0.3, 0.2, 0.045, 0.045, 0.045, ['配合', '养料被吸收后，还要靠循环系统运走。', 'link', ['digest', 'circ']]);
        this.urine = this.P(this.person, this.S, 0xf2e27a, 1, 0.24, 0.28, -0.02, 0.035, 0.035, 0.035, ['尿液', '肾产生的尿液向下送出，这是泌尿系统在工作。', 'urine', ['urinary']]);
        this.cordDot = this.P(this.person, this.S, 0xfff2a8, 1, 0, 1.2, -0.02, 0.04, 0.04, 0.04, ['冲动', '亮点沿神经向下移动，表示冲动在传导。', 'cordDot', ['nerveSys']]);
        this.path = [new THREE.Vector3(0, 1.52, 0.3), new THREE.Vector3(0, 1.05, 0.12), new THREE.Vector3(0.18, 0.55, 0.18), new THREE.Vector3(0.05, 0.28, 0.2), new THREE.Vector3(-0.1, 0.12, 0.16)];
    }
    limb(x, y, z, r, len, key, leg) {
        const pivot = new THREE.Group(); pivot.position.set(x, y, z); this.person.add(pivot); this.piv[key] = pivot;
        this.P(pivot, this.C, 0xf0c7a8, 0.22, 0, -len * 0.5, 0, r, len, r, null);
        this.P(pivot, this.C, 0xf3ead8, 1, 0, -len * 0.5, 0, r * 0.38, len * 0.82, r * 0.38, ['骨', '骨属于结缔组织，也是运动系统的支持部分。', 'bone' + key, ['motion']]);
        if (!leg) this.P(pivot, this.S, 0xd06060, 1, r + 0.02, -len * 0.35, 0.04, 0.06, len * 0.35, 0.05, ['骨骼肌', '手臂上的骨骼肌收缩时，会牵动骨产生运动。', 'muscle' + key, ['motion']]);
    }
    buildStomach() {
        this.stomachG = new THREE.Group(); this.root.add(this.stomachG);
        const rows = [['黏膜', '黏膜在最里面，主要是上皮组织，能保护和分泌。', 0xf2a3b5, 0.42], ['肌肉层', '肌肉层能够收缩和舒张，带动胃壁运动。', 0xd4534c, 0.56], ['结缔组织', '结缔组织把胃壁连成整体，并起支持作用。', 0xe6c36a, 0.7], ['外层浆膜', '最外面是浆膜。四层按次序排列，不是随便堆在一起。', 0xf4e2c8, 0.84]];
        rows.forEach((row, i) => this.remember(this.P(this.stomachG, this.S, row[2], 0.92, (i - 1.5) * 0.82, 0.15, 0, row[3], row[3] * 0.78, row[3] * 0.7, [row[0], row[1], 'layer' + i, []])));
        for (let i = 0; i < 2; i += 1) {
            const nerve = this.remember(this.P(this.stomachG, this.C, 0xc7b6e8, 1, 0, 0.15 + i * 0.18, 0.05, 0.03, 2.5, 0.03, ['神经组织', '神经组织穿在胃壁各层之间，接受刺激并传递信息。', 'stomachNerve' + i, []]));
            nerve.rotation.z = Math.PI / 2; nerve.userData.stub = true;
        }
    }
    remember(mesh) {
        mesh.userData.home = mesh.position.clone();
        mesh.userData.scatter = new THREE.Vector3((Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.8);
        mesh.userData.homeScale = mesh.scale.clone();
        this.layers.push(mesh);
        return mesh;
    }
    buildSkin() {
        this.skinG = new THREE.Group(); this.root.add(this.skinG);
        this.P(this.skinG, this.B, 0xe7c98a, 1, 0, -0.05, 0, 2.1, 0.55, 1.15, ['结缔组织', '皮肤深层有结缔组织。出血，是因为血液也属于结缔组织。', 'skinConn', []]);
        this.epiL = new THREE.Group(); this.epiR = new THREE.Group();
        this.skinG.add(this.epiL); this.skinG.add(this.epiR);
        for (let c = 0; c < 4; c += 1) for (let r = 0; r < 3; r += 1) {
            const parent = c < 2 ? this.epiL : this.epiR;
            const x = c < 2 ? -0.72 + c * 0.34 : 0.22 + (c - 2) * 0.34;
            this.P(parent, this.B, 0xf3b6c4, 1, x, 0.32, (r - 1) * 0.34, 0.32, 0.1, 0.32, ['上皮组织', '表面这层细胞排得很紧，能把异物挡在外面。', 'skinEpi', []]);
        }
        this.skinNerve = this.P(this.skinG, this.C, 0xc7b6e8, 1, 0, 0.02, 0.15, 0.04, 1.7, 0.04, ['神经组织', '觉得疼，说明皮肤里有神经组织，它能接受刺激。', 'skinNerve', []]);
        this.skinNerve.rotation.z = Math.PI / 2;
        for (let i = 0; i < 5; i += 1) {
            const mesh = this.P(this.skinG, this.S, 0xd64545, 1, -0.3 + i * 0.15, -0.02, 0.1, 0.06, 0.03, 0.06, ['血液', '流出的是血液。血液属于结缔组织。', 'bleed', []]);
            this.blood.push({ mesh: mesh, home: mesh.position.clone(), vx: (i - 2) * 0.08 });
        }
        this.speck = this.P(this.skinG, this.S, 0x3d342c, 1, 0, 1.15, 0.2, 0.07, 0.07, 0.07, ['异物', '完整的上皮能把它挡在表面。划开以后它就会进入缺口。', 'speck', []]);
    }
    buildOrigin() {
        this.originG = new THREE.Group(); this.root.add(this.originG);
        const colors = [0xf3b6c4, 0xd4534c, 0xe6c36a, 0xc7b6e8];
        for (let i = 0; i < 8; i += 1) {
            const mesh = this.P(this.originG, this.S, 0xf6e4d8, 1, 0, 0.2, 0, 0.16, 0.16, 0.16, ['受精卵分化', '四种组织都来自受精卵。先分裂使细胞变多，再分化成不同组织。', 'egg' + i, []]);
            mesh.userData.home = new THREE.Vector3((i % 2 ? 0.28 : -0.28) + (i > 3 ? 0.18 : -0.18), 0.05 + Math.floor(i / 2) * 0.32, i > 5 ? 0.2 : 0);
            mesh.userData.tint = colors[i % 4];
            this.originCells.push(mesh);
        }
    }
    buildCompare() {
        this.compareG = new THREE.Group(); this.root.add(this.compareG);
        for (let i = 0; i < 5; i += 1) this.P(this.compareG, this.B, 0x8eb4d4, 1, -1.35, -0.7 + i * 0.42, 0, 0.78, 0.26, 0.26, null);
        for (let i = 0; i < 5; i += 1) {
            if (i !== 3) { this.P(this.compareG, this.B, 0x8fbf73, 1, 1.35, -0.7 + i * 0.42, 0, 0.78, 0.26, 0.26, null); continue; }
            const a = this.P(this.compareG, this.B, 0xd23b4a, 1, 1.35, -0.7 + i * 0.42, 0, 0.72, 0.06, 0.06, ['没有系统', '红色叉的位置是“系统”。开花植物没有这一层，人体才有。', 'gap', []]);
            const b = this.P(this.compareG, this.B, 0xd23b4a, 1, 1.35, -0.7 + i * 0.42, 0, 0.72, 0.06, 0.06, ['没有系统', '红色叉的位置是“系统”。开花植物没有这一层，人体才有。', 'gap2', []]);
            a.rotation.z = 0.75; b.rotation.z = -0.75;
        }
        this.P(this.compareG, this.S, 0xf0c7a8, 1, -1.35, -1.25, 0, 0.16, 0.16, 0.16, null);
        this.P(this.compareG, this.B, 0xf0c7a8, 1, -1.35, -1.55, 0, 0.28, 0.32, 0.12, null);
        this.P(this.compareG, this.C, 0x3f8f4a, 1, 1.35, -1.45, 0, 0.04, 0.4, 0.04, null);
        this.P(this.compareG, this.S, 0xf2d34a, 1, 1.35, -1.15, 0, 0.1, 0.1, 0.1, null);
    }
    goUp() {
        this.view = 'level';
        this.level = this.level >= 4 ? 0 : this.level + 1;
        if (this.level === 3) this.systemKey = 'digest';
        this.apply(); this.sayLevel();
    }
    showTissue(key) {
        this.view = 'tissue';
        this.tissueKey = key;
        this.apply();
        const copy = {
            epi: ['上皮组织', '<p>细胞排得很紧。上面的一片像皮肤表面，用来保护；下面的杯状结构是肠腺，会分泌消化液。</p>'],
            muscle: ['肌肉组织', '<p>肌肉细胞能收缩和舒张，所以能产生运动。从左到右是平滑肌、骨骼肌和心肌。</p><p>骨骼肌有明暗条纹，只表示外形。收缩时整条变短变粗。</p>'],
            conn: ['结缔组织', '<p>结缔组织种类很多。骨能支持和保护，软骨能连接，血液能运送养料。</p>'],
            nerve: ['神经组织', '<p>神经细胞接受刺激，亮点再沿长突起传走。这里只表示传导，不画细胞之间的接点。</p>']
        };
        this.say(copy[key][0], copy[key][1]);
    }
    showSystem(key) {
        this.view = 'level';
        this.level = 3;
        this.systemKey = key;
        this.apply();
        const copy = {
            digest: ['消化系统', '<p>消化系统是分工的例子：口、食管、胃、肠、肝和唾液腺一起处理食物。</p><p>橙色小球沿消化道移动。红色小球再走向心脏，表示养料要靠循环系统运走，系统之间会配合。</p>'],
            motion: ['运动系统', '<p>骨支持身体，骨骼肌收缩牵动骨，手臂和腿就动起来。</p>'],
            breath: ['呼吸系统', '<p>气管把气体送进肺。肺是呼吸系统的主要器官，会一起一伏。</p>'],
            circ: ['循环系统', '<p>心脏收缩推动血液，血管把物质运到全身。</p>'],
            urinary: ['泌尿系统', '<p>肾是泌尿系统的主要器官。黄色小球表示形成的尿液向下送出。</p>'],
            nerveSys: ['神经系统', '<p>脑和脊髓负责接收、传递信息。眼感受光，耳感受声音。</p><p>亮点沿神经移动，表示冲动在传导。</p>'],
            endo: ['内分泌系统', '<p>甲状腺是内分泌系统中的一个腺体，会发出柔和的亮光。</p>'],
            repro: ['生殖系统', '<p>生殖系统与繁殖后代有关。图里只标出大致位置，不展开结构。</p>']
        };
        this.say(copy[key][0], copy[key][1]);
    }
    togglePile() {
        this.view = 'level';
        this.level = 2;
        this.scrambled = !this.scrambled;
        document.getElementById(this.id + '-pile').textContent = this.scrambled ? '按层次恢复' : '打乱看看';
        this.layoutStomach();
        this.apply();
        this.say(this.scrambled ? '这样只是一堆' : '器官要按次序', this.scrambled ? '<p>现在四种组织被打散了，胃没法正常工作。</p>' : '<p>从左到右是黏膜、肌肉层、结缔组织和外层浆膜。紫色细条是穿在各层里的神经组织。</p>');
    }
    showSkin() {
        this.view = 'skin';
        this.cut = 0;
        this.cutTarget = 1;
        this.speck.position.y = 1.2;
        this.blood.forEach((drop) => drop.mesh.position.copy(drop.home));
        this.apply();
        this.say('皮肤里有哪些组织', '<p>完整时，脏点停在表面，说明上皮组织在保护。</p><p>划开以后会觉得疼，是因为有神经组织；伤口出血，是因为有结缔组织。血液就属于结缔组织。</p>');
    }
    showOrigin() {
        this.view = 'origin';
        this.origin = 0;
        this.originPlay = true;
        this.apply();
        this.say('四种组织从哪来', '<p>从一个受精卵开始。细胞数目变多，是分裂的结果；接着分成四种颜色，是分化成了上皮、肌肉、结缔和神经组织。</p>');
    }
    showPlant() {
        this.view = 'plant';
        this.apply();
        this.say('开花植物没有系统', '<p>左边从下到上是人：细胞、组织、器官、系统、个体。</p><p>右边是开花植物：细胞、组织、器官之后直接到个体。红叉那一层是系统，植物没有这一层。</p>');
    }
    sayLevel() {
        const btn = document.getElementById(this.id + '-up');
        const next = ['组织', '器官', '系统', '个体'];
        if (btn) btn.textContent = this.level >= 4 ? '从细胞再看' : ('上到' + next[this.level]);
        const copy = [
            ['结构层次：细胞', '<p>先看一个细胞。后面每按一次，模型会升到更高一层。</p>'],
            ['结构层次：组织', '<p>许多相似的细胞形成组织。场景里同时摆出上皮、肌肉、结缔和神经四种。</p>'],
            ['结构层次：器官', '<p>右侧的胃由上皮、肌肉、结缔和神经组织按次序组成。左侧还能点到脑、心脏、胃、肝、肺、肾、眼、耳、甲状腺和唾液腺。</p>'],
            ['结构层次：系统', '<p>多个器官组成系统，彼此分工也互相配合。当前例子是消化系统。</p>'],
            ['结构层次：个体', '<p>八个系统进一步组成一个完整的人。心脏、肺和四肢会一起活动，表示它们在同一个个体里配合。</p>']
        ];
        this.say(copy[this.level][0], copy[this.level][1]);
    }
    layoutStomach() {
        this.layers.forEach((mesh) => {
            mesh.position.copy(this.scrambled ? mesh.userData.scatter : mesh.userData.home);
            if (mesh.userData.stub) mesh.scale.copy(this.scrambled ? new THREE.Vector3(0.18, 0.18, 0.18) : mesh.userData.homeScale);
        });
    }
    apply() {
        const levelView = this.view === 'level';
        this.cellG.visible = levelView && this.level === 0;
        this.tissueG.visible = (levelView && this.level === 1) || this.view === 'tissue';
        this.stomachG.visible = levelView && this.level === 2;
        this.person.visible = levelView && this.level >= 2;
        this.skinG.visible = this.view === 'skin';
        this.originG.visible = this.view === 'origin';
        this.compareG.visible = this.view === 'plant';
        if (levelView && this.level === 2) { this.person.position.set(-1.85, -0.2, 0); this.person.scale.setScalar(0.68); }
        else { this.person.position.set(0, -0.35, 0); this.person.scale.setScalar(1); }
        const focus = this.view === 'tissue';
        ['epi', 'muscle', 'conn', 'nerve'].forEach((key, i) => {
            const g = this.sets[key];
            g.visible = !focus || this.tissueKey === key;
            g.position.set(focus ? 0 : (i - 1.5) * 1.7, 0, 0);
            g.scale.setScalar(focus ? 1.35 : 1);
        });
        this.paintBody();
    }
    paintBody() {
        const sysMode = this.view === 'level' && this.level === 3;
        const solid = this.view === 'level' && this.level === 4;
        this.shells.forEach((mesh) => {
            const skin = mesh.parent === this.person || (mesh.parent && mesh.parent.parent === this.person);
            if (!skin) return;
            mesh.material.opacity = solid ? 0.62 : 0.2;
            mesh.material.transparent = true; mesh.material.depthWrite = false;
        });
        Object.keys(this.parts).forEach((key) => {
            const mesh = this.parts[key];
            if (!mesh.userData.systems.length) return;
            const on = !sysMode || mesh.userData.systems.indexOf(this.systemKey) >= 0;
            const selected = mesh.userData.key === this.selectedKey;
            mesh.material.opacity = on ? 1 : 0.14; mesh.material.transparent = !on; mesh.material.depthWrite = on;
            mesh.material.emissive.set(selected ? 0xfff1c4 : (on ? 0x442211 : 0x000000));
            mesh.material.emissiveIntensity = selected ? 0.65 : (on ? 0.18 : 0);
        });
        const digest = sysMode && this.systemKey === 'digest';
        this.bolus.visible = digest; this.linkDot.visible = digest;
        this.urine.visible = sysMode && this.systemKey === 'urinary';
        this.cordDot.visible = sysMode && this.systemKey === 'nerveSys';
    }
    pulse(key, k) {
        const b = this.parts[key].userData.base;
        this.parts[key].scale.set(b[0] * k, b[1] * k, b[2] * k);
    }
    animate(time, delta) {
        this.t += delta;
        this.flex.forEach((g, i) => {
            const k = 0.8 + (0.5 + 0.5 * Math.sin(this.t * 2.6 + i)) * 0.28;
            g.scale.set(1.15 - k * 0.15, k, 1);
        });
        this.epiDrops.forEach((drop, i) => { drop.position.y += delta * 0.18; if (drop.position.y > 0.15) drop.position.y = -0.2 - i * 0.05; });
        const u = (this.t * 0.35) % 1;
        this.impulse.position.x = -0.45 + u * 1.15;
        this.impulse.material.emissive.set(0xfff2a8);
        this.impulse.material.emissiveIntensity = u < 0.15 ? 0.2 : 0.9;
        this.cut += (this.cutTarget - this.cut) * Math.min(1, delta * 1.8);
        this.epiL.position.x = -this.cut * 0.28; this.epiR.position.x = this.cut * 0.28;
        this.skinNerve.material.emissive.set(0xfff2a8);
        this.skinNerve.material.emissiveIntensity = this.cut > 0.25 ? 0.35 + Math.sin(this.t * 9) * 0.45 : 0.05;
        this.blood.forEach((drop) => {
            if (this.cut < 0.4) drop.mesh.position.copy(drop.home);
            else { drop.mesh.position.y += delta * 0.28; drop.mesh.position.x += drop.vx * delta; if (drop.mesh.position.y > 0.85) drop.mesh.position.copy(drop.home); }
        });
        if (this.view === 'skin') this.speck.position.y += ((this.cut > 0.62 ? 0.08 : 0.48) - this.speck.position.y) * Math.min(1, delta * 2);
        if (this.originPlay) this.origin = Math.min(1, this.origin + delta * 0.16);
        const shown = this.origin < 0.2 ? 1 : this.origin < 0.4 ? 2 : this.origin < 0.58 ? 4 : 8;
        const spread = Math.min(1, Math.max(0, (this.origin - 0.15) / 0.7));
        this.originCells.forEach((mesh, i) => {
            mesh.visible = i < shown;
            mesh.position.lerpVectors(this._v.set(0, 0.2, 0), mesh.userData.home, spread);
            mesh.material.color.setHex(this.origin > 0.72 ? mesh.userData.tint : 0xf6e4d8);
        });
        const sys = this.view === 'level' && this.level === 3;
        const alive = this.view === 'level' && this.level === 4;
        const swing = ((sys && this.systemKey === 'motion') || alive) ? Math.sin(this.t * 2) * (alive ? 0.22 : 0.48) : 0;
        this.piv.armL.rotation.z = swing; this.piv.armR.rotation.z = -swing;
        this.piv.legL.rotation.x = -swing * 0.7; this.piv.legR.rotation.x = swing * 0.7;
        const beat = (sys && (this.systemKey === 'circ' || this.systemKey === 'digest')) || alive;
        this.pulse('heart', 1 + (beat ? Math.abs(Math.sin(this.t * 5)) * 0.16 : 0));
        const breathe = (sys && this.systemKey === 'breath') || alive;
        ['lungL', 'lungR'].forEach((key, i) => this.pulse(key, 1 + (breathe ? (0.5 + 0.5 * Math.sin(this.t * 2 + i)) * 0.12 : 0)));
        const endo = sys && this.systemKey === 'endo';
        this.parts.thyroid.material.emissive.set(endo ? 0xffb070 : 0x000000);
        this.parts.thyroid.material.emissiveIntensity = endo ? 0.35 + Math.sin(this.t * 3) * 0.35 : (this.selectedKey === 'thyroid' ? 0.65 : 0.12);
        ['reproL', 'reproR'].forEach((key) => this.pulse(key, 1 + (sys && this.systemKey === 'repro' ? (0.5 + 0.5 * Math.sin(this.t * 2)) * 0.12 : 0)));
        if (this.bolus.visible) {
            this.bolusU = (this.bolusU + delta * 0.16) % 1;
            const n = this.path.length - 1; const f = this.bolusU * n; const i = Math.min(n - 1, Math.floor(f));
            this.bolus.position.lerpVectors(this.path[i], this.path[i + 1], f - i);
            this.linkDot.position.lerpVectors(this.path[3], this.parts.heart.position, (this.bolusU + 0.35) % 1);
        }
        if (this.urine.visible) this.urine.position.set(0.24, 0.36 - ((this.t * 0.4) % 1) * 0.45, -0.02);
        if (this.cordDot.visible) this.cordDot.position.set(0, 1.25 - ((this.t * 0.33) % 1) * 0.85, -0.02);
    }
    pickMesh(mesh) {
        if (!mesh?.userData?.name) return;
        this.selectedKey = mesh.userData.key || '';
        this.paintBody();
        mesh.material.emissive.set(0xfff1c4); mesh.material.emissiveIntensity = 0.7;
        this.say(mesh.userData.name, '<p>' + mesh.userData.description + '</p>');
    }
    getInteractables() { return this.interactables; }
    dispose() {
        this.geos.forEach((geo) => geo.dispose());
        this.mats.forEach((m) => m.dispose());
        if (this.root) this.scene.remove(this.root);
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        this.interactables = [];
        const box = document.getElementById('scene-controls');
        if (box) box.innerHTML = '';
    }
};
