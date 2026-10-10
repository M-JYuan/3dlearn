window.Grade7BacteriaScene = class Grade7BacteriaScene {
    constructor(scene, camera, renderer) {
        this.scene = scene; this.camera = camera; this.renderer = renderer; this.id = 'grade7-bacteria';
        this.group = null; this.lights = []; this.interactables = []; this.btns = {}; this.modes = {};
        this.mode = 'coccus'; this.shape = 'coccus'; this.t = 0; this.sporeT = 0; this.fissT = 0;
        this.showCapsule = false; this.showFlag = true; this.showPili = true; this.bits = []; this.flagSegs = []; this.wind = [];
    }
    init() {
        this.camera.position.set(0, 2.55, 7.1); this.camera.lookAt(0, 1.05, 0); this.scene.background = new THREE.Color(0xe4ebf2);
        const hemi = new THREE.HemisphereLight(0xf8fbff, 0xd5d0c4, 0.7); const key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(3, 6, 4);
        const rim = new THREE.DirectionalLight(0xd5e4f5, 0.35); rim.position.set(-3, 2, -2);
        [hemi, key, rim].forEach((light) => { this.scene.add(light); this.lights.push(light); });
        this.group = new THREE.Group(); this.scene.add(this.group);
        const floor = this.add(this.group, new THREE.CircleGeometry(3.4, 40), this.mat(0xe7eef3), 0, 0, 0); floor.rotation.x = -Math.PI / 2;
        this.buildShapes(); this.buildStructure(); this.buildSpore(); this.buildFission(); this.buildDecay(); this.buildUses(); this.buildNotes();
        this.iconRing = this.add(this.group, new THREE.TorusGeometry(0.28, 0.02, 8, 18), this.mat(0x1f6a4d), -1.6, 0.02, 1.85); this.iconRing.rotation.x = Math.PI / 2;
        this.show('coccus'); this.setupUI();
    }
    mat(color, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.55, metalness: 0.03 }, extra || {})); }
    add(parent, geo, material, x, y, z) { const mesh = new THREE.Mesh(geo, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
    clickable(mesh, name, desc) { mesh.userData.name = name; mesh.userData.description = desc; this.interactables.push(mesh); return mesh; }
    tag(parent, text, x, y, z, w) {
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 128;
        const pen = canvas.getContext('2d'); pen.fillStyle = '#f4f7fb'; pen.fillRect(0, 16, 640, 96);
        pen.fillStyle = '#1b3142'; pen.font = '40px sans-serif'; pen.textAlign = 'center'; pen.textBaseline = 'middle'; pen.fillText(text, 320, 64);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        sprite.position.set(x, y, z); sprite.scale.set(w, w * 0.2, 1); parent.add(sprite); return sprite;
    }
    show(name) {
        this.mode = name; Object.keys(this.modes).forEach((key) => { this.modes[key].visible = key === name; });
        if (name === 'coccus' || name === 'bacillus' || name === 'spiral') this.shape = name;
        if (this.iconRing) this.iconRing.position.x = { coccus: -1.6, bacillus: 0, spiral: 1.6 }[this.shape];
    }
    rod(parent, x, y, z, len, color, name, desc) {
        const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); const body = this.mat(color);
        this.clickable(this.add(g, new THREE.CylinderGeometry(0.16, 0.16, len, 12), body, 0, 0, 0), name, desc);
        this.clickable(this.add(g, new THREE.SphereGeometry(0.16, 12, 8), body, 0, len / 2, 0), name, desc);
        this.clickable(this.add(g, new THREE.SphereGeometry(0.16, 12, 8), body, 0, -len / 2, 0), name, desc); return g;
    }
    buildShapes() {
        const coccusDesc = '球菌是球形的单细胞细菌。有的聚成一堆，有的连成一串，每一粒仍然是一个细胞。';
        const bacDesc = '杆菌是杆状的单细胞细菌。有的可以连成链，链上的每一段仍是一个细胞。';
        const spiDesc = '螺旋菌的细胞弯成螺旋状。它仍然是单细胞，基本结构和球菌、杆菌相同。';
        const coccus = new THREE.Group(); const bacillus = new THREE.Group(); const spiral = new THREE.Group();
        [[0, 1.35, 0], [0.36, 1.45, 0.04], [-0.3, 1.48, -0.05], [0.08, 1.72, -0.08], [0.2, 1.08, 0.1], [-0.14, 1.12, 0.16]].forEach((p) => this.clickable(this.add(coccus, new THREE.SphereGeometry(0.2, 16, 12), this.mat(0x7eb8ae), p[0], p[1], p[2]), '球菌', coccusDesc));
        for (let i = 0; i < 4; i++) this.clickable(this.add(coccus, new THREE.SphereGeometry(0.16, 12, 10), this.mat(0x9fcfc4), -0.7 + i * 0.36, 0.55, 0), '球菌', coccusDesc);
        this.tag(coccus, '球菌', 0, 2.25, 0, 1.2);
        for (let i = 0; i < 3; i++) this.rod(bacillus, -0.9 + i * 0.9, 1.2, 0, 0.55, 0x7eb8ae, '杆菌', bacDesc);
        this.tag(bacillus, '杆菌', 0, 2.15, 0, 1.2);
        const pts = []; for (let i = 0; i <= 48; i++) { const u = i / 48; const a = u * Math.PI * 4.3; pts.push(new THREE.Vector3(Math.cos(a) * 0.28, (u - 0.5) * 2.05 + 1.15, Math.sin(a) * 0.28)); }
        this.clickable(this.add(spiral, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 70, 0.14, 8, false), this.mat(0x6aa89c), 0, 0, 0), '螺旋菌', spiDesc);
        this.tag(spiral, '螺旋菌', 0, 2.35, 0, 1.3);
        this.modes.coccus = coccus; this.modes.bacillus = bacillus; this.modes.spiral = spiral; this.group.add(coccus, bacillus, spiral);
        this.clickable(this.add(this.group, new THREE.SphereGeometry(0.16, 12, 10), this.mat(0x7eb8ae), -1.6, 0.2, 1.85), '球菌', coccusDesc);
        const iconB = this.rod(this.group, 0, 0.28, 1.85, 0.28, 0x7eb8ae, '杆菌', bacDesc); iconB.scale.setScalar(0.7);
        const iconS = this.clickable(this.add(this.group, new THREE.TorusGeometry(0.12, 0.045, 8, 14), this.mat(0x6aa89c), 1.6, 0.22, 1.85), '螺旋菌', spiDesc); iconS.rotation.x = Math.PI / 2;
    }
    buildStructure() {
        const g = new THREE.Group(); this.modes.structure = g; this.group.add(g);
        const shell = { transparent: true, side: THREE.DoubleSide, depthWrite: false };
        this.capsule = this.clickable(this.add(g, new THREE.SphereGeometry(1.15, 24, 16, 0, Math.PI * 1.65), this.mat(0xf2d48a, Object.assign({ opacity: 0.38 }, shell)), 0, 1.2, 0), '荚膜', '有的细菌在细胞壁外还有一层荚膜。不是每种细菌都有。');
        this.wall = this.clickable(this.add(g, new THREE.SphereGeometry(0.98, 24, 16, 0, Math.PI * 1.7), this.mat(0xc9856a, { transparent: true, opacity: 0.55, side: THREE.DoubleSide }), 0, 1.2, 0), '细胞壁', '细菌都有细胞壁，包在细胞膜外面。');
        this.membrane = this.clickable(this.add(g, new THREE.SphereGeometry(0.86, 24, 16, 0, Math.PI * 1.55), this.mat(0xe7c1a4, { transparent: true, opacity: 0.7, side: THREE.DoubleSide }), 0, 1.2, 0), '细胞膜', '细胞膜紧贴在细胞壁内侧。');
        this.cytoplasm = this.clickable(this.add(g, new THREE.SphereGeometry(0.72, 20, 14, 0, Math.PI * 1.45), this.mat(0xf3e6c2, { transparent: true, opacity: 0.88 }), 0, 1.2, 0), '细胞质', '细胞质在细胞膜里面。大多数细菌不能进行光合作用，要利用现成的有机物。');
        const dna = this.mat(0x3e6fd8); const dnaDesc = '细菌没有成形的细胞核。DNA集中在细胞里的一个区域。这样的细胞属于原核生物。';
        for (let i = 0; i < 3; i++) { const knot = this.clickable(this.add(g, new THREE.TorusGeometry(0.16 + i * 0.03, 0.045, 6, 12), dna, 0.05, 1.2, 0.05), 'DNA集中的区域', dnaDesc); knot.rotation.set(i * 0.7, i * 1.2, i * 0.5); }
        this.tag(g, 'DNA区域', 1.35, 1.7, 0, 1.2);
        this.pili = new THREE.Group(); g.add(this.pili); const hairMat = this.mat(0xefe8dc);
        for (let i = 0; i < 10; i++) { const hair = this.clickable(this.add(this.pili, new THREE.CylinderGeometry(0.012, 0.012, 0.28, 4), hairMat, Math.cos(i) * 1.02, 1.2, Math.sin(i) * 1.02), '菌毛', '图上可以画出菌毛，但不是每个细菌细胞都有菌毛。'); hair.lookAt(hair.position.x * 2, hair.position.y, hair.position.z * 2); }
        this.flagellum = new THREE.Group(); g.add(this.flagellum); const flagMat = this.mat(0xe4ddcf);
        for (let i = 0; i < 8; i++) { const seg = this.clickable(this.add(this.flagellum, new THREE.CylinderGeometry(0.025, 0.02, 0.18, 6), flagMat, 1.15 + i * 0.16, 1.15, 0), '鞭毛', '有的细菌长有鞭毛。图里只画摆动的细丝，不展开基部构造。不是每种细菌都有鞭毛。'); seg.rotation.z = Math.PI / 2; this.flagSegs.push(seg); }
        this.capsule.visible = false;
    }
    buildSpore() {
        const g = new THREE.Group(); this.modes.spore = g; this.group.add(g);
        const desc = '有的细菌在某些条件下形成一个休眠的芽孢。图中始终只有一个细菌。芽孢不是生殖，数目没有增加。';
        this.sporeCell = this.rod(g, 0, 1.15, 0, 0.7, 0x7eb8ae, '形成芽孢的细菌', desc);
        this.sporeBody = this.clickable(this.add(g, new THREE.SphereGeometry(0.22, 14, 10), this.mat(0xf7f1e4), 0, 1.15, 0), '芽孢', '芽孢壁厚、含水少，能抵抗高温和干旱，还可以随风飘走。环境适宜时，它再变成一个普通细菌。一个变回一个，不是生殖。');
        this.sporeShell = this.add(g, new THREE.SphereGeometry(0.3, 14, 10), this.mat(0xb9a48a, { transparent: true, opacity: 0.45 }), 0, 1.15, 0);
        this.sporeBody.scale.setScalar(0.15); this.sporeShell.scale.setScalar(0.15);
        this.harsh = new THREE.Group(); g.add(this.harsh); this.harsh.visible = false;
        this.add(this.harsh, new THREE.SphereGeometry(0.22, 12, 10), this.mat(0xf0c14a, { emissive: 0xc98920 }), -1.5, 1.8, 0);
        this.add(this.harsh, new THREE.BoxGeometry(1.4, 0.06, 0.7), this.mat(0xc4a27a), 1.5, 0.45, 0);
        this.tag(g, '仍是1个', 0, 2.25, 0, 1.4); this.tag(g, '不是生殖', 0, 0.4, 1.1, 1.5);
        for (let i = 0; i < 4; i++) { const line = this.add(g, new THREE.BoxGeometry(0.5, 0.015, 0.015), this.mat(0xffffff, { transparent: true, opacity: 0.7 }), -1 + i * 0.3, 1.5, 0.4); line.userData.phase = i; line.visible = false; this.wind.push(line); }
    }
    buildFission() {
        const g = new THREE.Group(); this.modes.fission = g; this.group.add(g);
        const desc = '分裂生殖时，一个细菌分成两个，两个长大后还可以再分裂。图中没有芽孢。条件适宜时，有的细菌不到半小时就分裂一次。';
        this.cellA = this.rod(g, 0, 1.2, 0, 0.62, 0x7eb8ae, '分裂中的细菌', desc);
        this.cellB = this.rod(g, 0.8, 1.2, 0, 0.62, 0x7eb8ae, '新分裂出的细菌', desc); this.cellB.visible = false;
        this.waist = this.add(g, new THREE.TorusGeometry(0.18, 0.03, 6, 12), this.mat(0xf2d27a), 0, 1.2, 0); this.waist.rotation.x = Math.PI / 2;
        this.oneTag = this.tag(g, '1个细胞', 0, 2.2, 0, 1.3); this.twoTag = this.tag(g, '2个细胞', 0, 2.2, 0, 1.3); this.twoTag.visible = false;
    }
    buildDecay() {
        const g = new THREE.Group(); this.modes.decay = g; this.group.add(g);
        this.lump = this.clickable(this.add(g, new THREE.DodecahedronGeometry(0.55, 0), this.mat(0x8d6a43, { roughness: 0.9 }), 0, 1.05, 0), '有机物', '大多数细菌不能进行光合作用。它们利用现成的有机物，并把有机物分解成简单的无机物。');
        for (let i = 0; i < 4; i++) this.rod(g, Math.cos(i) * 0.45, 0.85, Math.sin(i) * 0.35, 0.22, 0x7eb8ae, '分解有机物的细菌', '这些细菌靠现成的有机物生活，同时把有机物分解成简单的无机物。');
        this.add(g, new THREE.SphereGeometry(0.24, 12, 10), this.mat(0xf0c14a), -1.7, 1.9, 0);
        const bar = this.add(g, new THREE.BoxGeometry(0.62, 0.06, 0.06), this.mat(0xb33b3b), -1.7, 1.9, 0); bar.rotation.z = 0.7;
        this.tag(g, '大多数不能光合', -1.7, 1.45, 0, 1.8);
        for (let i = 0; i < 6; i++) { const bit = this.clickable(this.add(g, new THREE.BoxGeometry(0.08, 0.08, 0.08), this.mat(i % 2 ? 0xd9dde2 : 0xf7f7f7, { transparent: true, opacity: 0.9 }), (i - 2.5) * 0.18, 1.2, 0.2), '简单的无机物', '细菌把有机物分解后，会留下更简单的无机物。'); bit.userData.u = i / 6; bit.userData.x = bit.position.x; this.bits.push(bit); }
    }
    buildUses() {
        const g = new THREE.Group(); this.modes.uses = g; this.group.add(g);
        const note = '这是人们利用细菌制成的封好的食品成品，不是打开的培养物。不要把细菌模型当成可以品尝的东西。';
        [['醋', 0xc9a15a], ['酸奶', 0xf3f0ea], ['泡菜', 0x8fa86a], ['味精', 0xf7f1d8]].forEach((item, i) => {
            const x = -1.35 + i * 0.9;
            this.clickable(this.add(g, new THREE.CylinderGeometry(0.22, 0.24, 0.7, 14), this.mat(0xd5e4e2, { transparent: true, opacity: 0.45 }), x, 0.85, 0), item[0], note);
            this.clickable(this.add(g, new THREE.CylinderGeometry(0.16, 0.16, 0.42, 12), this.mat(item[1]), x, 0.78, 0), item[0], note);
            this.add(g, new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), this.mat(0x356b86), x, 1.24, 0); this.tag(g, item[0], x, 1.55, 0, 0.8);
        });
        this.tag(g, '封好的成品', 0, 0.35, 0.6, 1.6);
    }
    buildNotes() {
        const insulin = new THREE.Group(); this.modes.insulin = insulin; this.group.add(insulin);
        this.clickable(this.add(insulin, new THREE.CylinderGeometry(0.2, 0.2, 0.7, 12), this.mat(0xf7f7f7), -0.6, 1.05, 0), '胰岛素药品', '人的胰岛素基因可以放进大肠杆菌，用来生产治疗用的胰岛素。具体做法这里不展开。');
        this.add(insulin, new THREE.CylinderGeometry(0.1, 0.1, 0.16, 10), this.mat(0x356b86), -0.6, 1.46, 0);
        this.rod(insulin, 0.7, 1.1, 0, 0.7, 0x7eb8ae, '大肠杆菌', '这里只说明大肠杆菌可以被用来生产胰岛素药品，不演示操作步骤。');
        this.tag(insulin, '胰岛素药品', -0.6, 1.8, 0, 1.5);
        const harm = new THREE.Group(); this.modes.harm = harm; this.group.add(harm);
        this.clickable(this.add(harm, new THREE.BoxGeometry(2.6, 1.5, 0.08), this.mat(0x2c3338), 0, 1.2, 0), '有害细菌举例', '有的细菌会危害健康，例如结核分枝杆菌、鼠疫耶尔森菌和链球菌。这里只记名字，不描述、也不模仿任何表现。');
        this.tag(harm, '结核分枝杆菌', 0, 1.55, 0.08, 2.2); this.tag(harm, '鼠疫耶尔森菌', 0, 1.15, 0.08, 2.2); this.tag(harm, '链球菌', 0, 0.75, 0.08, 1.4);
    }
    setupUI() {
        const title = document.getElementById('info-title'); if (title) title.textContent = '细菌';
        const controls = document.getElementById('scene-controls'); controls.innerHTML = '';
        const items = [['coccus', '球菌', () => this.pickShape('coccus')], ['bacillus', '杆菌', () => this.pickShape('bacillus')], ['spiral', '螺旋菌', () => this.pickShape('spiral')], ['structure', '看结构', () => this.structure()], ['capsule', '荚膜', () => this.togglePart('capsule')], ['flag', '鞭毛', () => this.togglePart('flag')], ['pili', '菌毛', () => this.togglePart('pili')], ['spore', '芽孢', () => this.spore()], ['fission', '分裂生殖', () => this.fission()], ['decay', '分解有机物', () => this.decay()], ['uses', '食品成品', () => this.uses()], ['insulin', '胰岛素药品', () => this.insulin()], ['harm', '有害例子', () => this.harm()]];
        items.forEach((item) => { const btn = document.createElement('button'); btn.type = 'button'; btn.id = this.id + '-' + item[0]; btn.className = 'control-btn'; btn.textContent = item[1]; btn.addEventListener('click', item[2]); controls.appendChild(btn); this.btns[item[0]] = btn; });
        this.pickShape('coccus');
    }
    say(text) {
        const el = document.getElementById('info-content'); if (el) el.textContent = text;
        Object.keys(this.btns).forEach((key) => {
            const shapeOn = key === this.shape && (this.mode === 'coccus' || this.mode === 'bacillus' || this.mode === 'spiral');
            const extra = this.mode === 'structure' && ((key === 'capsule' && this.showCapsule) || (key === 'flag' && this.showFlag) || (key === 'pili' && this.showPili));
            this.btns[key].style.outline = key === this.mode || shapeOn || extra ? '2px solid #1f6a4d' : '';
        });
    }
    pickShape(kind) {
        this.show(kind);
        const text = { coccus: '球菌的细胞是球形的。细菌是单细胞生物，有的会聚成一团或连成链，但每一粒都是一个独立的细胞。', bacillus: '杆菌的细胞是杆状的。有的杆菌连成链。不同外形的细菌，基本结构是一样的。', spiral: '螺旋菌的细胞呈螺旋形。它和球菌、杆菌一样，都是没有成形细胞核的原核生物。' };
        this.say(text[kind]);
    }
    structure() { this.show('structure'); this.say('细菌都有细胞壁、细胞膜、细胞质，以及DNA集中的区域。没有成形的细胞核，因此属于原核生物。有的还有荚膜或鞭毛。图中的菌毛不是每个细胞都有。大多数细菌不能进行光合作用。'); }
    togglePart(part) {
        this.show('structure');
        if (part === 'capsule') this.showCapsule = !this.showCapsule;
        if (part === 'flag') this.showFlag = !this.showFlag;
        if (part === 'pili') this.showPili = !this.showPili;
        this.say((this.showCapsule ? '现在能看到荚膜：只有一部分细菌有。' : '荚膜已隐藏。有的细菌有，不是都有。') + (this.showFlag ? '鞭毛只画出摆动的细丝，不画基部构造。有的细菌有鞭毛。' : '鞭毛已隐藏。不是每种细菌都有。') + (this.showPili ? '菌毛出现在图上，只是示意，不是每个细胞都有。' : '菌毛已隐藏，用来强调它并非每个细菌都有。'));
    }
    spore() { this.sporeT = 0; this.show('spore'); this.say('在某些条件下，细菌形成一个休眠的芽孢。芽孢壁厚、含水少，能抗高温和干旱，也能被风带走。条件变好后，它再变成一个普通细菌。芽孢不是生殖方式，细菌数目没有因此增加。'); }
    fission() { this.fissT = 0; this.show('fission'); this.say('细菌的生殖方式是分裂：一个细胞分成两个，两个长大以后还可以各自再分裂。条件适宜时，有的细菌不到半小时就分裂一次。动画里是一个细胞变成两个，不是芽孢变成两个。'); }
    decay() { this.show('decay'); this.say('大多数细菌不能进行光合作用，不能自己制造有机物。它们利用环境中现成的有机物，并把这些有机物分解成简单的无机物。'); }
    uses() { this.show('uses'); this.say('人们可以利用一些细菌：醋酸菌酿醋，乳酸菌制作酸奶和泡菜，棒状杆菌生产味精。图中是封好的食品成品，不是培养皿，不要把细菌当成可以品尝的对象。'); }
    insulin() { this.show('insulin'); this.say('还有一种利用方式：把人的胰岛素基因放进大肠杆菌，让它生产治疗用的胰岛素。这里只说明这件事，不展开具体做法。'); }
    harm() { this.show('harm'); this.say('也有细菌会危害健康，例如结核分枝杆菌、鼠疫耶尔森菌和链球菌。这里只列出名字，不描述表现，也不提供任何模仿或处理的做法。'); }
    animate(time, delta) {
        const dt = Math.min(Math.max(delta, 0), 0.05); this.t += dt;
        this.capsule.visible = this.showCapsule; this.flagellum.visible = this.showFlag; this.pili.visible = this.showPili;
        if (this.mode === 'structure') this.flagSegs.forEach((seg, i) => { const wave = Math.sin(this.t * 5 - i * 0.65) * 0.14; seg.position.y = 1.15 + wave; seg.rotation.z = Math.PI / 2 + wave; });
        if (this.mode === 'spore') this.tickSpore(dt);
        if (this.mode === 'fission') this.tickFission(dt);
        if (this.mode === 'decay') this.tickDecay(dt);
    }
    tickSpore(dt) {
        this.sporeT += dt; const u = (this.sporeT % 12) / 12; let cellScale = 1; let sporeScale = 0.2; let x = 0;
        if (u < 0.2) sporeScale = 0.15 + u / 0.2 * 0.2;
        else if (u < 0.4) { const k = (u - 0.2) / 0.2; sporeScale = 0.35 + k * 0.65; cellScale = 1 - k; }
        else if (u < 0.78) { cellScale = 0; sporeScale = 1; x = u < 0.62 ? ((u - 0.4) / 0.22) * 1.6 : 1.6; }
        else { const k = (u - 0.78) / 0.22; cellScale = k; sporeScale = 1 - k; x = 1.6; }
        this.sporeCell.visible = cellScale > 0.05; this.sporeCell.scale.setScalar(Math.max(0.001, cellScale)); this.sporeCell.position.x = x;
        this.sporeBody.position.set(x, 1.15, 0); this.sporeShell.position.set(x, 1.15, 0);
        this.sporeBody.scale.setScalar(Math.max(0.001, sporeScale)); this.sporeShell.scale.setScalar(Math.max(0.001, sporeScale));
        this.harsh.visible = u >= 0.45 && u < 0.8;
        this.wind.forEach((line) => { line.visible = u >= 0.4 && u < 0.66; line.position.x = -1.4 + ((this.t * 0.7 + line.userData.phase * 0.2) % 1.8); });
    }
    tickFission(dt) {
        this.fissT += dt; if (this.fissT > 9) this.fissT = 0; const u = this.fissT / 9; let sep = 0; let stretch = 1; let child = 0;
        if (u < 0.34) stretch = 1 + u / 0.34 * 0.4;
        else if (u < 0.62) { const k = (u - 0.34) / 0.28; sep = k * 0.7; child = Math.min(1, k * 1.4); }
        else { sep = 0.7; child = 1; }
        this.cellA.position.x = -sep; this.cellA.scale.set(1, stretch, 1);
        this.cellB.visible = child > 0.05; this.cellB.position.x = sep; this.cellB.scale.setScalar(Math.max(0.001, child));
        this.waist.visible = u > 0.2 && u < 0.5; this.waist.scale.setScalar(u < 0.36 ? 1 : Math.max(0.001, 1 - (u - 0.36) / 0.14));
        this.oneTag.visible = u < 0.5; this.twoTag.visible = u >= 0.5;
    }
    tickDecay(dt) {
        this.lump.scale.setScalar(1 - ((this.t % 6) / 6) * 0.22);
        this.bits.forEach((bit) => { bit.userData.u = (bit.userData.u + dt * 0.12) % 1; bit.position.y = 1.15 + bit.userData.u * 1.15; bit.position.x = bit.userData.x + Math.sin(bit.userData.u * 6) * 0.08; bit.material.opacity = 1 - bit.userData.u * 0.75; });
    }
    getInteractables() { return this.interactables; }
    dispose() {
        const controls = document.getElementById('scene-controls'); if (controls) controls.innerHTML = '';
        this.lights.forEach((light) => { this.scene.remove(light); if (light.dispose) light.dispose(); }); this.lights = [];
        if (!this.group) { this.interactables = []; return; }
        const geos = new Set(); const mats = new Set();
        this.group.traverse((obj) => { if (obj.geometry) geos.add(obj.geometry); const list = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : []; list.forEach((m) => mats.add(m)); });
        geos.forEach((geo) => geo.dispose()); mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        this.scene.remove(this.group); this.group = null; this.interactables = [];
    }
};
