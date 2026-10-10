/** 七年级：植物、动物怎么分，以及狼的分类等级。 */
window.Grade7ClassifyScene = class Grade7ClassifyScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.current = '';
        this.wolf = false;
        this.stackShown = 0;
        this.stackTarget = 0;
        this.binMesh = {};
        this.binAnchor = {};
        this.tokens = {};
        this.ranks = ['种 狼', '犬属', '犬科', '食肉目', '哺乳纲', '脊索动物门', '动物界'];
        this.organisms = {
            pine: { g: 'plant', n: '油松', seed: 'seed-yes', flower: 'flower-no', leaf: '', organ: false },
            rice: { g: 'plant', n: '水稻', seed: 'seed-yes', flower: 'flower-yes', leaf: 'mono', organ: false },
            sun: { g: 'plant', n: '向日葵', seed: 'seed-yes', flower: 'flower-yes', leaf: 'di', organ: false },
            fern: { g: 'plant', n: '蕨', seed: 'seed-no', flower: 'flower-no', leaf: '', organ: false },
            moss: { g: 'plant', n: '葫芦藓', seed: 'seed-no', flower: 'flower-no', leaf: '', organ: true },
            fish: { g: 'animal', n: '鲫鱼', spine: 'spine-yes' },
            frog: { g: 'animal', n: '青蛙', spine: 'spine-yes' },
            gecko: { g: 'animal', n: '壁虎', spine: 'spine-yes' },
            sparrow: { g: 'animal', n: '麻雀', spine: 'spine-yes' },
            tiger: { g: 'animal', n: '老虎', spine: 'spine-yes' },
            locust: { g: 'animal', n: '蝗虫', spine: 'spine-no' },
            worm: { g: 'animal', n: '蚯蚓', spine: 'spine-no' }
        };
    }

    init() {
        this.camera.position.set(0.4, 5.6, 9.2);
        this.camera.lookAt(0.2, 0.2, 0);
        this.scene.background = new THREE.Color(0x0f172a);
        this.addLight(new THREE.HemisphereLight(0xf8fafc, 0x334155, 0.7));
        const sun = new THREE.DirectionalLight(0xffffff, 0.55);
        sun.position.set(4, 8, 6);
        this.addLight(sun);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.tokenHome = new THREE.Vector3(0.3, 1.05, 2.7);
        this.tokenGoal = this.tokenHome.clone();
        this.buildBins();
        this.buildTokens();
        this.buildRanks();
        this.token.position.copy(this.tokenHome);
        this.setupUI();
    }

    addLight(light) {
        this.lights.push(light);
        this.scene.add(light);
    }

    sprite(text, unit) {
        const canvas = document.createElement('canvas');
        const fontSize = 38;
        canvas.width = Math.ceil(Math.max(180, text.length * fontSize + 28));
        canvas.height = 68;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 ' + fontSize + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, 34);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        const scale = unit || 210;
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        spr.scale.set(canvas.width / scale, 68 / scale, 1);
        spr.userData.baseW = canvas.width / scale;
        spr.userData.baseH = 68 / scale;
        return spr;
    }

    buildBins() {
        this.binsGroup = new THREE.Group();
        this.group.add(this.binsGroup);
        const defs = [
            ['seed-yes', '有种子', -2.55, 1.15, 0x334155],
            ['seed-no', '无种子', -2.55, -0.45, 0x334155],
            ['flower-yes', '有花和果实', -0.35, 1.15, 0x334155],
            ['flower-no', '没有花和果实', -0.35, -0.45, 0x334155],
            ['mono', '平行叶脉一片子叶', 1.85, 1.15, 0x334155],
            ['di', '网状叶脉两片子叶', 1.85, -0.45, 0x334155],
            ['spine-yes', '有脊柱', 3.9, 1.15, 0x3f3f46],
            ['spine-no', '无脊柱', 3.9, -0.45, 0x3f3f46],
            ['no-organ', '无真正根茎叶', -2.55, -2.05, 0x3f3f46]
        ];
        defs.forEach((row) => {
            const material = new THREE.MeshStandardMaterial({ color: row[4], roughness: 0.7, emissive: 0x000000 });
            const bin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.22, 1.05), material);
            bin.position.set(row[2], 0.1, row[3]);
            bin.userData.base = row[4];
            bin.userData.onClick = () => this.say('这一格是「' + row[1] + '」。选出生物后，再点性状按钮。');
            bin.userData.hoverTitle = row[1];
            bin.userData.hoverDesc = '分类格子';
            bin.userData.name = row[1];
            const label = this.sprite(row[1], 250);
            label.position.set(0, 0.42, 0);
            bin.add(label);
            this.binsGroup.add(bin);
            this.binMesh[row[0]] = bin;
            this.binAnchor[row[0]] = new THREE.Vector3(row[2], 0.78, row[3]);
            this.interactables.push(bin);
        });
        this.meshFloor();
    }

    meshFloor() {
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(10.5, 0.08, 6.2),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
        );
        floor.position.set(0.6, -0.08, 0.1);
        this.group.add(floor);
    }

    buildTokens() {
        this.token = new THREE.Group();
        this.group.add(this.token);
        const specs = [
            ['pine', 'cone', 0x166534],
            ['rice', 'grain', 0xeab308],
            ['sun', 'disk', 0xf59e0b],
            ['fern', 'frond', 0x22c55e],
            ['moss', 'clump', 0x4d7c0f],
            ['fish', 'fish', 0x38bdf8],
            ['frog', 'blob', 0x84cc16],
            ['gecko', 'lizard', 0x65a30d],
            ['sparrow', 'bird', 0xd6d3d1],
            ['tiger', 'beast', 0xf97316],
            ['locust', 'bug', 0xca8a04],
            ['worm', 'worm', 0xc084fc]
        ];
        specs.forEach((spec) => {
            const org = this.organisms[spec[0]];
            const holder = new THREE.Group();
            holder.visible = false;
            const material = new THREE.MeshStandardMaterial({ color: spec[2], roughness: 0.42 });
            this.addShape(holder, spec[1], material);
            const label = this.sprite(org.n, 200);
            label.position.set(0, 1.05, 0);
            holder.add(label);
            holder.userData = {
                name: org.n,
                hoverTitle: org.n,
                hoverDesc: '当前选出的生物',
                onClick: () => this.select(spec[0])
            };
            this.token.add(holder);
            this.tokens[spec[0]] = holder;
            this.interactables.push(holder);
        });
    }

    addShape(holder, kind, material) {
        const put = (geo, x, y, z, sx, sy, sz) => {
            const mesh = new THREE.Mesh(geo, material);
            mesh.position.set(x, y, z);
            if (sx) mesh.scale.set(sx, sy, sz);
            holder.add(mesh);
            return mesh;
        };
        if (kind === 'cone') put(new THREE.ConeGeometry(0.34, 0.95, 8), 0, 0.5, 0);
        else if (kind === 'grain') put(new THREE.SphereGeometry(0.26, 12, 10), 0, 0.32, 0, 1.5, 0.7, 0.55);
        else if (kind === 'disk') put(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 16), 0, 0.4, 0);
        else if (kind === 'frond') put(new THREE.BoxGeometry(0.12, 0.85, 0.42), 0, 0.5, 0);
        else if (kind === 'clump') put(new THREE.SphereGeometry(0.28, 10, 8), 0, 0.26, 0, 1.35, 0.55, 1.1);
        else if (kind === 'fish') put(new THREE.SphereGeometry(0.28, 12, 8), 0, 0.32, 0, 1.7, 0.65, 0.48);
        else if (kind === 'blob') put(new THREE.SphereGeometry(0.3, 12, 8), 0, 0.3, 0, 1.15, 0.72, 1);
        else if (kind === 'lizard') put(new THREE.BoxGeometry(0.72, 0.14, 0.2), 0, 0.2, 0);
        else if (kind === 'bird') put(new THREE.ConeGeometry(0.2, 0.48, 4), 0, 0.4, 0);
        else if (kind === 'beast') put(new THREE.BoxGeometry(0.68, 0.3, 0.26), 0, 0.26, 0);
        else if (kind === 'bug') put(new THREE.SphereGeometry(0.2, 10, 8), 0, 0.26, 0, 1.7, 0.65, 0.7);
        else put(new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8), 0, 0.2, 0).rotation.z = 0.7;
    }

    buildRanks() {
        this.rankSprites = this.ranks.map((text, index) => {
            const spr = this.sprite(text, 160);
            spr.visible = false;
            spr.position.set(0.2, 0.25 + index * 0.62, 0.4);
            this.group.add(spr);
            return spr;
        });
    }

    setupUI() {
        const title = document.getElementById('info-title');
        if (title) title.textContent = '给生物分类';
        const info = document.getElementById('info-content');
        const btn = (id, text) => '<button class="control-btn" id="' + id + '">' + text + '</button>';
        const plants = [['pine', '油松'], ['rice', '水稻'], ['sun', '向日葵'], ['fern', '蕨'], ['moss', '葫芦藓']];
        const animals = [['fish', '鲫鱼'], ['frog', '青蛙'], ['gecko', '壁虎'], ['sparrow', '麻雀'], ['tiger', '老虎'], ['locust', '蝗虫'], ['worm', '蚯蚓']];
        if (info) {
            info.innerHTML = [
                '<p id="g7cls-caption" style="line-height:1.6;margin:0 0 8px;white-space:pre-wrap;"></p>',
                '<div style="margin-bottom:6px;">植物</div>',
                '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">',
                plants.map((row) => btn('g7cls-org-' + row[0], row[1])).join(''),
                '</div>',
                '<div style="margin-bottom:6px;">动物</div>',
                '<div style="display:flex;flex-wrap:wrap;gap:6px;">',
                animals.map((row) => btn('g7cls-org-' + row[0], row[1])).join(''),
                '</div>'
            ].join('');
        }
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');
        const controls = document.getElementById('scene-controls');
        if (controls) {
            controls.style.display = 'flex';
            controls.style.flexWrap = 'wrap';
            controls.style.maxWidth = '92vw';
            controls.style.justifyContent = 'center';
            controls.innerHTML = [
                btn('g7cls-seed', '有种子/无种子'),
                btn('g7cls-flower', '有花和果实/没有'),
                btn('g7cls-leaf', '平行叶脉一片子叶/网状叶脉两片子叶'),
                btn('g7cls-spine', '有脊柱/无脊柱'),
                btn('g7cls-wolf', '狼的分类')
            ].join('');
        }
        const click = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        };
        Object.keys(this.organisms).forEach((key) => click('g7cls-org-' + key, () => this.select(key)));
        click('g7cls-seed', () => this.applyTrait('seed'));
        click('g7cls-flower', () => this.applyTrait('flower'));
        click('g7cls-leaf', () => this.applyTrait('leaf'));
        click('g7cls-spine', () => this.applyTrait('spine'));
        click('g7cls-wolf', () => this.setWolf(!this.wolf));
        this.say('先点一种植物或动物，再点性状，看模型该进哪一格。');
    }

    say(text) {
        const el = document.getElementById('g7cls-caption');
        if (el) el.textContent = text;
    }

    markOrgs(key) {
        Object.keys(this.organisms).forEach((name) => {
            const el = document.getElementById('g7cls-org-' + name);
            if (el) el.classList.toggle('active', name === key);
        });
    }

    markTraits(kind) {
        ['seed', 'flower', 'leaf', 'spine'].forEach((name) => {
            const el = document.getElementById('g7cls-' + name);
            if (el) el.classList.toggle('active', name === kind);
        });
    }

    select(key) {
        if (this.wolf) this.setWolf(false, true);
        this.current = key;
        const org = this.organisms[key];
        Object.keys(this.tokens).forEach((name) => {
            this.tokens[name].visible = name === key;
        });
        this.tokenGoal.copy(this.tokenHome);
        this.highlight([]);
        this.markOrgs(key);
        this.markTraits('');
        if (org.g === 'plant') this.say('已选出' + org.n + '。用种子、花果或叶脉子叶按钮，看它进哪一格。');
        else this.say('已选出' + org.n + '。点「有脊柱/无脊柱」。');
    }

    highlight(keys) {
        Object.keys(this.binMesh).forEach((id) => {
            const mesh = this.binMesh[id];
            const on = keys.indexOf(id) !== -1;
            mesh.material.color.setHex(on ? 0x15803d : mesh.userData.base);
            mesh.material.emissive.setHex(on ? 0x14532d : 0x000000);
        });
    }

    plantNote(org, kind) {
        if (org.n === '油松' && kind === 'seed') return '油松有种子，而且种子是裸露的，外面没有果皮。';
        if (org.n === '油松' && kind === 'flower') return '油松没有花，也没有果实。';
        if (org.n === '油松') return '油松的种子裸露，不按一片子叶或两片子叶放进这两格。';
        if (org.n === '水稻' && kind === 'seed') return '水稻有种子。';
        if (org.n === '水稻' && kind === 'flower') return '水稻有花，也有果实。';
        if (org.n === '水稻') return '水稻是有种子的植物：一片子叶，叶脉平行。';
        if (org.n === '向日葵' && kind === 'seed') return '向日葵有种子。';
        if (org.n === '向日葵' && kind === 'flower') return '向日葵有花，也有果实。';
        if (org.n === '向日葵') return '向日葵是有种子的植物：两片子叶，网状叶脉。';
        if (org.n === '蕨' && kind === 'leaf') return '蕨没有种子，不能按子叶和叶脉来放。';
        if (org.n === '蕨') return '蕨没有种子，也没有花和果实。';
        if (kind === 'leaf') return '葫芦藓没有真正的叶，也没有子叶。它没有种子，更没有真正的根、茎、叶。';
        if (kind === 'flower') return '葫芦藓没有花和果实，也没有种子。';
        return '葫芦藓没有种子，也没有真正的根、茎、叶。';
    }

    applyTrait(kind) {
        const org = this.organisms[this.current];
        if (this.wolf) this.setWolf(false, true);
        this.markTraits(kind);
        if (!org) {
            this.say('先点一种植物或动物。');
            this.highlight([]);
            return;
        }
        if (kind === 'spine') {
            if (org.g !== 'animal') {
                this.say('有脊柱、无脊柱用来给动物分格。');
                this.highlight([]);
                return;
            }
            this.highlight([org.spine]);
            this.tokenGoal.copy(this.binAnchor[org.spine]);
            const own = org.spine === 'spine-yes' ? '有脊柱。' : '没有脊柱。';
            this.say(org.n + own + '鲫鱼、青蛙、壁虎、麻雀、老虎有脊柱；蝗虫和蚯蚓没有。');
            return;
        }
        if (org.g !== 'plant') {
            this.say('这个按钮用来给植物分格。');
            this.highlight([]);
            return;
        }
        if (kind === 'seed') {
            const keys = [org.seed];
            if (org.organ) keys.push('no-organ');
            this.highlight(keys);
            this.tokenGoal.copy(this.binAnchor[org.seed]);
        } else if (kind === 'flower') {
            this.highlight([org.flower]);
            this.tokenGoal.copy(this.binAnchor[org.flower]);
        } else if (!org.leaf) {
            this.highlight([]);
            this.tokenGoal.copy(this.tokenHome);
        } else {
            this.highlight([org.leaf]);
            this.tokenGoal.copy(this.binAnchor[org.leaf]);
        }
        this.say(this.plantNote(org, kind));
    }
    setWolf(on, silent) {
        this.wolf = on;
        this.stackTarget = on ? this.ranks.length : 0;
        const btn = document.getElementById('g7cls-wolf');
        if (btn) btn.classList.toggle('active', on);
        if (silent) return;
        if (on) this.say('种是分类的基本单位。');
        else this.say('选一种植物或动物，再看它该进哪一格。');
    }

    animate(time, delta) {
        if (!this.group) return;
        const step = delta * 3.2;
        if (this.stackShown < this.stackTarget) this.stackShown = Math.min(this.stackTarget, this.stackShown + step);
        else if (this.stackShown > this.stackTarget) this.stackShown = Math.max(this.stackTarget, this.stackShown - step);
        const stacking = this.wolf || this.stackShown > 0.04;
        this.binsGroup.visible = !stacking;
        this.token.visible = !stacking;
        this.rankSprites.forEach((spr, index) => {
            const appear = Math.max(0, Math.min(1, this.stackShown - index));
            spr.visible = appear > 0.02;
            spr.scale.set(spr.userData.baseW * appear, spr.userData.baseH * appear, 1);
        });
        if (this.token) {
            this.token.position.lerp(this.tokenGoal, Math.min(1, delta * 3));
            this.token.rotation.y = time * 0.35;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    disposeTree(root) {
        const geos = new Set();
        const mats = new Set();
        root.traverse((obj) => {
            if (obj.geometry && !geos.has(obj.geometry)) {
                geos.add(obj.geometry);
                obj.geometry.dispose();
            }
            const list = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
            list.forEach((m) => {
                if (!m || mats.has(m)) return;
                mats.add(m);
                if (m.map) m.map.dispose();
                m.dispose();
            });
        });
    }

    dispose() {
        if (this.group) {
            this.disposeTree(this.group);
            this.scene.remove(this.group);
            this.group = null;
        }
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        this.interactables = [];
        const controls = document.getElementById('scene-controls');
        if (controls) {
            controls.innerHTML = '';
            controls.style.display = 'none';
            controls.style.flexWrap = '';
            controls.style.maxWidth = '';
            controls.style.justifyContent = '';
        }
        const info = document.getElementById('info-content');
        if (info) info.innerHTML = '';
    }
};
