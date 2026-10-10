window.Grade7CampusScene = class Grade7CampusScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-campus';
        this.group = null;
        this.lights = [];
        this.geos = [];
        this.mats = [];
        this.textures = [];
        this.interactables = [];
        this.motions = [];
        this.partMats = { trunk: [], branch: [], leaf: [], flower: [], purple: [], center: [], bush: [], env: [], ui: [] };
        this.poplar = null;
        this.willow = null;
        this.bougain = null;
        this.ringList = [];
        this.sunBeam = null;
        this.habitCard = null;
        this.clipCanvas = null;
        this.clipTex = null;
        this.purpleClusters = [];
        this.focus = 'all';
        this.aim = '';
        this.aimButton = null;
        this.clock = 0;
        this.aimOrder = ['form', 'habitat', 'habit', 'compare'];
        this.aimLabel = { form: '形态', habitat: '生活环境', habit: '生活习性', compare: '对比' };
    }

    init() {
        this.camera.position.set(0.2, 3.1, 8.4);
        this.camera.lookAt(0, 1.2, 0);
        this.scene.background = new THREE.Color(0xcfe3f5);
        this.setupLights();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.g = {
            sphere: new THREE.SphereGeometry(1, 12, 8),
            cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
            box: new THREE.BoxGeometry(1, 1, 1),
            plane: new THREE.PlaneGeometry(1, 1),
            circle: new THREE.CircleGeometry(1, 28),
            cone: new THREE.ConeGeometry(1, 1, 10),
            torus: new THREE.TorusGeometry(0.85, 0.03, 8, 28)
        };
        Object.keys(this.g).forEach((key) => this.geos.push(this.g[key]));
        this.mat = {
            poplarTrunk: this.partMat('trunk', 0xe6dfd2, { roughness: 0.92 }),
            poplarBranch: this.partMat('branch', 0xddd4c6, { roughness: 0.88 }),
            willowTrunk: this.partMat('trunk', 0x7d5a3c, { roughness: 0.9 }),
            willowBranch: this.partMat('branch', 0x6d7344, { roughness: 0.8 }),
            leaf: this.partMat('leaf', 0x3f8f46, { side: THREE.DoubleSide }),
            flower: this.partMat('flower', 0xf4f1e8),
            bushLeaf: this.partMat('bush', 0x2f7a40, { side: THREE.DoubleSide }),
            bushStem: this.partMat('bush', 0x6a8f48),
            purple: this.partMat('purple', 0xa23d8f, { side: THREE.DoubleSide, roughness: 0.45 }),
            center: this.partMat('center', 0xffe7a8),
            pot: this.partMat('bush', 0xb7c4c8),
            grass: this.partMat('env', 0x8fbf6a),
            path: this.partMat('env', 0xe2d2b0),
            soil: this.partMat('env', 0x8b6848),
            sun: this.partMat('env', 0xffe7a0, { transparent: true, opacity: 0.28, depthWrite: false, roughness: 0.4 }),
            ring: this.partMat('ui', 0xf7f4ea),
            board: this.partMat('ui', 0xd8c7a4)
        };
        this.mat.sun.userData.keepTransparent = true;
        this.mat.sun.userData.baseOpacity = 0.28;
        this.buildEnvironment();
        this.poplar = this.buildTree('poplar', -1.7, -0.2);
        this.willow = this.buildTree('willow', 1.75, -0.15);
        this.bougain = this.buildBougainvillea(0.15, 1.35);
        this.buildClipboard();
        this.setupUI();
        this.applyHighlight();
        this.writeInfo();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xfff8ef, 0.62);
        const sun = new THREE.DirectionalLight(0xfff1d2, 1.12);
        sun.position.set(-3.5, 8, 4);
        const fill = new THREE.DirectionalLight(0xc5d8ff, 0.28);
        fill.position.set(4, 3, -3);
        [ambient, sun, fill].forEach((light) => {
            this.scene.add(light);
            this.lights.push(light);
        });
    }

    partMat(part, color, extra) {
        const material = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.7, metalness: 0.02, emissive: 0x000000 }, extra || {}));
        material.userData.part = part;
        this.mats.push(material);
        this.partMats[part].push(material);
        return material;
    }

    mesh(parent, geometry, material, x, y, z, s, name, desc) {
        const obj = new THREE.Mesh(geometry, material);
        obj.position.set(x, y, z);
        if (Array.isArray(s)) obj.scale.set(s[0], s[1], s[2]);
        else if (typeof s === 'number') obj.scale.setScalar(s);
        parent.add(obj);
        if (name) this.tag(obj, name, desc);
        return obj;
    }

    tag(obj, name, description) {
        obj.userData.name = name;
        obj.userData.description = description;
        this.interactables.push(obj);
        return obj;
    }

    flat(parent, geometry, material, x, z, s, name, desc) {
        const obj = this.mesh(parent, geometry, material, x, 0.03, z, s, name, desc);
        obj.rotation.x = -Math.PI / 2;
        return obj;
    }

    buildEnvironment() {
        const grass = this.mesh(this.group, this.g.circle, this.mat.grass, 0, 0, 0, 4.4, '生活环境', '观察可以包括植株周围的地面和空间。先定好目的再看，不要伤害植物。示意图没有给出环境结论。');
        grass.rotation.x = -Math.PI / 2;
        this.mesh(this.group, this.g.box, this.mat.path, 0, 0.02, 1.7, [1.1, 0.04, 2.4], '校园小路', '这只是校园环境的示意图，不说明两棵树各自生活在哪里。');
        this.sunBeam = this.mesh(this.group, this.g.cone, this.mat.sun, -2.2, 2.5, -1.4, [0.7, 1.8, 0.7], '光照', '观察环境时可以注意光照。示意图不提供哪种树更喜光的结论。');
        this.sunBeam.rotation.x = Math.PI;
        this.sunBeam.visible = false;
    }

    buildTree(kind, x, z) {
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);
        this.group.add(tree);
        const poplar = kind === 'poplar';
        const trunkMat = poplar ? this.mat.poplarTrunk : this.mat.willowTrunk;
        const branchMat = poplar ? this.mat.poplarBranch : this.mat.willowBranch;
        const trunkName = poplar ? '毛白杨的树干' : '垂柳的树干';
        const trunkText = poplar
            ? '示意图把毛白杨的树皮画得较浅，只为了提示名称。真实的颜色和质地要到校园里看，不要剥树皮。'
            : '这是垂柳的树干示意图。树皮颜色不是观察答案，请到室外比较，也不要伤害树皮。';
        const height = poplar ? 2.05 : 1.55;
        const radius = poplar ? 0.13 : 0.11;
        this.mesh(tree, this.g.cyl, trunkMat, 0, height / 2, 0, [radius, height, radius], trunkName, trunkText);
        if (poplar) this.buildPoplarCrown(tree, branchMat);
        else this.buildWillowCrown(tree, branchMat);
        this.flat(tree, this.g.circle, this.mat.soil, 0, 0, 0.55, '植株周围的土壤', '生活环境要到实地看。这里不判断毛白杨或垂柳适合什么土壤。');
        const ring = this.flat(tree, this.g.torus, this.mat.ring, 0, 0, 1, '对比观察', '把两棵树对照着看形态和颜色。课本没有给答案，示意图也不能代替。');
        ring.position.y = 0.08;
        ring.visible = false;
        this.ringList.push(ring);
        return tree;
    }

    buildPoplarCrown(tree, branchMat) {
        const branchText = '毛白杨的枝条在示意图里向斜上方伸出。这不是标准答案，不能代替室外观察。';
        const leafText = '这些叶片只是占位，形状和颜色都不要当成毛白杨的结论。请到校园里比较。';
        const flowerText = '浅色小点只标出花的位置，不代表真实颜色和形态。';
        for (let i = 0; i < 6; i += 1) {
            const angle = (i / 6) * Math.PI * 2;
            const branch = this.mesh(tree, this.g.cyl, branchMat, Math.cos(angle) * 0.28, 1.35 + (i % 3) * 0.16, Math.sin(angle) * 0.28, [0.03, 0.72, 0.03], '毛白杨的枝条', branchText);
            branch.rotation.z = Math.cos(angle) * 0.5;
            branch.rotation.x = -Math.sin(angle) * 0.5;
            for (let k = 0; k < 3; k += 1) {
                this.mesh(tree, this.g.sphere, this.mat.leaf, Math.cos(angle) * (0.55 + k * 0.08), 1.65 + (i % 3) * 0.12, Math.sin(angle) * (0.55 + k * 0.08), [0.1, 0.06, 0.045], '毛白杨的叶', leafText);
            }
            if (i % 2 === 0) this.mesh(tree, this.g.sphere, this.mat.flower, Math.cos(angle) * 0.4, 1.9, Math.sin(angle) * 0.4, 0.05, '毛白杨的花', flowerText);
        }
    }

    buildWillowCrown(tree, branchMat) {
        const branchText = '示意图把垂柳的枝条画成下垂，用来提示名称。真实形态要到室外看，不要折枝。';
        const leafText = '垂柳叶片在这里也只是占位，没有给出形状和颜色的答案。';
        const flowerText = '浅色小点只标出花的位置，颜色不是观察结论。';
        for (let i = 0; i < 7; i += 1) {
            const angle = (i / 7) * Math.PI * 2;
            const whip = new THREE.Group();
            whip.position.set(Math.cos(angle) * 0.12, 1.35, Math.sin(angle) * 0.12);
            tree.add(whip);
            for (let s = 0; s < 5; s += 1) {
                const y = -s * 0.26;
                const radius = 0.08 + s * 0.16;
                const seg = this.mesh(whip, this.g.cyl, branchMat, Math.cos(angle) * radius, y, Math.sin(angle) * radius, [0.018, 0.28, 0.018], '垂柳的枝条', branchText);
                seg.rotation.z = Math.cos(angle) * (0.4 + s * 0.18);
                seg.rotation.x = -Math.sin(angle) * (0.4 + s * 0.18);
                if (s > 1) this.mesh(whip, this.g.sphere, this.mat.leaf, Math.cos(angle) * (radius + 0.08), y - 0.08, Math.sin(angle) * (radius + 0.08), [0.09, 0.05, 0.04], '垂柳的叶', leafText);
            }
            this.mesh(whip, this.g.sphere, this.mat.flower, Math.cos(angle) * 0.34, -0.35, Math.sin(angle) * 0.34, 0.045, '垂柳的花', flowerText);
            this.motions.push({ obj: whip, phase: i });
        }
    }

    buildBougainvillea(x, z) {
        const bush = new THREE.Group();
        bush.position.set(x, 0, z);
        this.group.add(bush);
        this.mesh(bush, this.g.cyl, this.mat.pot, 0, 0.16, 0, [0.42, 0.32, 0.42], '光叶子花', '光叶子花又叫三角梅。观察时不要折枝摘叶。');
        for (let i = 0; i < 4; i += 1) {
            const angle = (i / 4) * Math.PI * 2;
            const stem = this.mesh(bush, this.g.cyl, this.mat.bushStem, Math.cos(angle) * 0.12, 0.45, Math.sin(angle) * 0.12, [0.025, 0.55, 0.025], '光叶子花的枝', '先按计划观察。紫色结构是不是花瓣，这一页没有回答。');
            stem.rotation.z = Math.cos(angle) * 0.25;
            for (let k = 0; k < 3; k += 1) {
                this.mesh(bush, this.g.sphere, this.mat.bushLeaf, Math.cos(angle) * 0.22, 0.4 + k * 0.12, Math.sin(angle) * 0.22, [0.1, 0.06, 0.04], '光叶子花的叶', '叶子可以观察，但不要摘下来。示意图不描述它的习性。');
            }
        }
        [[-0.18, 0.72, 0.08], [0.16, 0.84, -0.06], [0.02, 0.62, 0.16]].forEach((pos, index) => {
            const cluster = new THREE.Group();
            cluster.position.set(pos[0], pos[1], pos[2]);
            bush.add(cluster);
            this.purpleClusters.push(cluster);
            for (let k = 0; k < 3; k += 1) {
                const purple = this.mesh(cluster, this.g.plane, this.mat.purple, Math.cos(k * 2.09) * 0.14, Math.sin(k * 2.09) * 0.1, k * 0.01, [0.22, 0.16, 1], '紫色结构', '大片紫色结构围着中心较小的结构。它们是花瓣吗？课本这一页没有回答，先不要下结论。');
                purple.rotation.z = k;
            }
            for (let c = 0; c < 4; c += 1) {
                this.mesh(cluster, this.g.sphere, this.mat.center, (c - 1.5) * 0.03, 0, 0.04, 0.032, '中心较小的结构', '中心这些结构画成浅色，只为了和外围紫色分开，不代表真实颜色。紫色部分是不是花瓣，仍然是问题。');
            }
            cluster.userData.base = 1;
            cluster.userData.phase = index;
        });
        return bush;
    }

    buildClipboard() {
        const board = new THREE.Group();
        board.position.set(-2.55, 0.85, 1.35);
        board.rotation.y = 0.45;
        this.group.add(board);
        this.mesh(board, this.g.box, this.mat.board, 0, 0, -0.03, [0.72, 0.96, 0.04]);
        this.clipCanvas = document.createElement('canvas');
        this.clipCanvas.width = 512;
        this.clipCanvas.height = 640;
        this.clipTex = new THREE.CanvasTexture(this.clipCanvas);
        this.textures.push(this.clipTex);
        const paperMat = new THREE.MeshBasicMaterial({ map: this.clipTex });
        paperMat.userData.part = 'ui';
        this.mats.push(paperMat);
        this.partMats.ui.push(paperMat);
        this.mesh(board, this.g.plane, paperMat, 0, 0, 0, [0.64, 0.86, 1], '观察记录', '先选定一个观察目的：形态、生活环境、生活习性或对比。示意图不填写没有给出的事实。');
        this.redrawClipboard();
        this.habitCard = this.makeCard(['生活习性', '留到校园记录', '这里不编造'], -0.2, 1.35, 2.05, [0.9, 0.56, 1], '待记录的习性', '生活习性要在室外有计划地观察。示意图里不填写笔记没有给出的习性。');
        this.habitCard.visible = false;
        this.makeCard(['示意图', '不能代替室外观察'], 2.35, 0.55, 1.55, [0.8, 0.42, 1], '示意图', '毛白杨只提示树皮较浅，垂柳只提示枝条下垂。形状和颜色的比较要到校园里完成。');
    }

    makeCard(lines, x, y, z, scale, name, desc) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f7f3e8';
        ctx.fillRect(0, 0, 512, 320);
        ctx.fillStyle = '#243024';
        ctx.textAlign = 'center';
        lines.forEach((line, i) => {
            ctx.font = i === 0 ? 'bold 54px sans-serif' : '40px sans-serif';
            ctx.fillText(line, 256, 90 + i * 70);
        });
        const tex = new THREE.CanvasTexture(canvas);
        this.textures.push(tex);
        const material = new THREE.MeshBasicMaterial({ map: tex });
        material.userData.part = 'ui';
        this.mats.push(material);
        this.partMats.ui.push(material);
        return this.mesh(this.group, this.g.plane, material, x, y, z, scale, name, desc);
    }

    redrawClipboard() {
        const ctx = this.clipCanvas.getContext('2d');
        ctx.fillStyle = '#f6f1e6';
        ctx.fillRect(0, 0, 512, 640);
        ctx.fillStyle = '#243024';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('观察目的', 48, 78);
        this.aimOrder.forEach((key, i) => {
            const y = 150 + i * 100;
            ctx.strokeStyle = '#243024';
            ctx.lineWidth = 4;
            ctx.strokeRect(52, y, 42, 42);
            if (this.aim === key) {
                ctx.fillStyle = '#2f7a45';
                ctx.fillRect(60, y + 8, 26, 26);
            }
            ctx.fillStyle = '#243024';
            ctx.font = '40px sans-serif';
            ctx.fillText(this.aimLabel[key], 116, y + 34);
        });
        ctx.font = '28px sans-serif';
        ctx.fillText('有计划地看，不伤害植物', 48, 590);
        this.clipTex.needsUpdate = true;
    }

    setupUI() {
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.innerHTML = '';
        [['trunk', '树干', () => this.focusPart('trunk')], ['branch', '枝条', () => this.focusPart('branch')], ['leaf', '叶', () => this.focusPart('leaf')], ['flower', '花', () => this.focusPart('flower')], ['habitat', '生活环境', () => this.focusPart('env')], ['bougainvillea', '光叶子花', () => this.focusPart('bougain')], ['aim', '记录观察目的', () => this.cycleAim()]].forEach((item) => {
            const button = document.createElement('button');
            button.className = 'control-btn';
            button.id = this.id + '-' + item[0];
            button.type = 'button';
            button.textContent = item[1];
            button.addEventListener('click', item[2]);
            controls.appendChild(button);
            if (item[0] === 'aim') this.aimButton = button;
        });
        this.mark('');
    }

    focusPart(part) {
        this.focus = part;
        this.applyHighlight();
        this.writeInfo();
        this.mark(this.id + '-' + (part === 'env' ? 'habitat' : part === 'bougain' ? 'bougainvillea' : part));
    }

    cycleAim() {
        const index = this.aimOrder.indexOf(this.aim);
        this.aim = this.aimOrder[(index + 1) % this.aimOrder.length];
        if (this.aim === 'habitat') this.focus = 'env';
        else if (this.focus === 'env' && this.aim !== 'habitat') this.focus = 'all';
        this.redrawClipboard();
        if (this.aimButton) this.aimButton.textContent = '目的：' + this.aimLabel[this.aim];
        this.applyHighlight();
        this.writeInfo();
        this.mark(this.id + '-aim');
    }

    applyHighlight() {
        const focus = this.focus;
        Object.keys(this.partMats).forEach((key) => {
            let on = focus === 'all' || key === focus || key === 'ui';
            if (focus === 'bougain') on = key === 'purple' || key === 'center' || key === 'bush' || key === 'ui';
            if (focus === 'flower') on = key === 'flower' || key === 'ui';
            if (focus === 'env') on = key === 'env' || key === 'ui';
            this.partMats[key].forEach((material) => {
                if (material.userData.keepTransparent) {
                    material.transparent = true;
                    material.opacity = on ? material.userData.baseOpacity : 0.05;
                    return;
                }
                const next = !on;
                if (material.transparent !== next) material.needsUpdate = true;
                material.transparent = next;
                material.opacity = on ? 1 : 0.18;
                material.depthWrite = on;
            });
        });
        if (this.sunBeam) this.sunBeam.visible = focus === 'env' || this.aim === 'habitat';
        if (this.habitCard) this.habitCard.visible = this.aim === 'habit';
        this.ringList.forEach((ring) => { ring.visible = this.aim === 'compare'; });
    }

    writeInfo() {
        const caution = '观察要有目的、有计划，不是随便看一眼，也不要伤害植物。示意图不能代替室外观察。';
        let aimLine = '还没有记录观察目的。可以依次记下形态、生活环境、生活习性或对比。';
        if (this.aim === 'form') aimLine = '本次目的记为形态：看树干、枝条、叶和花，先计划再观察。';
        if (this.aim === 'habitat') aimLine = '本次目的记为生活环境：看植株周围，而不是只盯着一个器官。示意图不给环境结论。';
        if (this.aim === 'habit') aimLine = '本次目的记为生活习性。笔记没有写明习性，牌子上留空，请到校园记录。';
        if (this.aim === 'compare') aimLine = '本次目的记为对比。请比较形状和颜色，课本没有提供答案。';
        let partLine = '两棵树可以一起看。毛白杨的树皮画得较浅，垂柳的枝条下垂，只是名称提示。';
        if (this.focus === 'trunk') partLine = '现在突出树干。除了毛白杨较浅的树皮，不要把示意图的颜色当成答案。';
        if (this.focus === 'branch') partLine = '现在突出枝条。垂柳画出了下垂的枝，毛白杨的枝只是斜向上的示意。';
        if (this.focus === 'leaf') partLine = '现在突出叶。两棵树的叶片用了同一种占位形状，避免冒充答案。';
        if (this.focus === 'flower') partLine = '现在突出两棵树上标出的花。浅色不代表真实颜色。光叶子花外围的紫色结构没有一起亮起，因为还不能确定那是不是花瓣。';
        if (this.focus === 'env') partLine = '现在突出小路、土壤和光照。这些只表示可以观察的环境，不是两种树的栖息结论。';
        if (this.focus === 'bougain') partLine = '这是光叶子花，又叫三角梅。大片紫色结构包围着中心较小的结构。紫色的部分是花瓣吗？这一页没有回答。';
        this.setInfo('校园植物观察', aimLine + partLine + caution);
    }

    mark(id) {
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        Array.prototype.forEach.call(controls.children, (button) => {
            button.style.outline = button.id === id ? '2px solid #2d6a4f' : '';
        });
    }

    setInfo(title, text) {
        const titleEl = document.getElementById('info-title');
        const contentEl = document.getElementById('info-content');
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.textContent = text;
    }

    animate(time, delta) {
        if (!this.group) return;
        this.clock += delta;
        const poplarX = this.aim === 'compare' ? -2.25 : -1.7;
        const willowX = this.aim === 'compare' ? 2.3 : 1.75;
        const step = Math.min(1, delta * 2.5);
        this.poplar.position.x += (poplarX - this.poplar.position.x) * step;
        this.willow.position.x += (willowX - this.willow.position.x) * step;
        const bougainZ = this.focus === 'bougain' ? 1.85 : 1.35;
        this.bougain.position.z += (bougainZ - this.bougain.position.z) * step;
        this.motions.forEach((item) => {
            item.obj.rotation.z = Math.sin(this.clock * 0.8 + item.phase) * 0.035;
        });
        const pulse = this.focus === 'bougain' ? 1 + Math.sin(this.clock * 2.2) * 0.06 : 1;
        this.purpleClusters.forEach((cluster) => cluster.scale.setScalar(pulse));
    }

    getInteractables() {
        return this.interactables.filter((mesh) => {
            let node = mesh;
            while (node) {
                if (node.visible === false) return false;
                node = node.parent;
            }
            return true;
        });
    }

    dispose() {
        this.lights.forEach((light) => {
            this.scene.remove(light);
            if (light.target) this.scene.remove(light.target);
            if (typeof light.dispose === 'function') light.dispose();
        });
        this.lights = [];
        this.textures.forEach((tex) => tex.dispose());
        this.geos.forEach((geometry) => geometry.dispose());
        this.mats.forEach((material) => material.dispose());
        this.textures = [];
        this.geos = [];
        this.mats = [];
        if (this.group) this.scene.remove(this.group);
        this.group = null;
        this.interactables = [];
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
    }
};
