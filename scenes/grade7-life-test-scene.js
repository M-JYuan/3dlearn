window.Grade7LifeTestScene = class Grade7LifeTestScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-life-test';
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.models = {};
        this.leafPivots = [];
        this.limbs = [];
        this.subject = 'lithops';
        this.test = null;
        this.fold = 0;
        this.whaleRise = 0;
        this.mineralScale = 1;
        this.subjects = [['lithops', '生石花'], ['stalactite', '钟乳石'], ['robot', '机器人'], ['mimosa', '含羞草'], ['whale', '鲸'], ['virus', '病毒']];
        this.tests = [['cell', '由细胞构成'], ['nutrition', '需要营养'], ['waste', '排出废物'], ['response', '对外界刺激作出反应'], ['growth', '生长和繁殖']];
        this.copy = {
            lithops: {
                cell: ['pass', '生石花的身体是由细胞构成的。'],
                nutrition: ['pass', '它要吸收水、无机盐，并自己制造养料。'],
                waste: ['pass', '它会把体内用不掉的物质排出去。'],
                response: ['pass', '缺水或光照变化时，它会跟着调整生活状态。'],
                growth: ['pass', '它能由小长大，也能结籽长出新的植株。']
            },
            stalactite: {
                cell: ['fail', '钟乳石是石头，身体里没有细胞。'],
                nutrition: ['fail', '它不吃也不吸收养料，只是矿物在附着。'],
                waste: ['fail', '它没有代谢，不会排出废物。'],
                response: ['fail', '它自己不会动，也不会对刺激作出反应。'],
                growth: ['fail', '变长只是矿物不断加上去，不是生长和繁殖。']
            },
            robot: {
                cell: ['fail', '机器人由零件拼成，不是由细胞构成的。'],
                nutrition: ['fail', '它用电，并不需要生物那样的营养。'],
                waste: ['fail', '它没有代谢活动，也不排出体内废物。'],
                response: ['pass', '它能移动，也会按外来信号作出反应。'],
                growth: ['fail', '它不能自己长大，也不能产生下一代。']
            },
            mimosa: {
                cell: ['pass', '含羞草的根、茎和叶都由细胞构成。'],
                nutrition: ['pass', '它需要水和养料，才能维持生活。'],
                waste: ['pass', '它会排出生活过程中产生的废物。'],
                response: ['pass', '叶子被碰后会折拢，这是对外界刺激的反应。'],
                growth: ['pass', '它能长大开花，并长出新的植株。']
            },
            whale: {
                cell: ['pass', '鲸的身体是由细胞构成的。'],
                nutrition: ['pass', '鲸要捕食，还得游到水面换气，才能活下去。'],
                waste: ['pass', '鲸会把身体里产生的废物排出去。'],
                response: ['pass', '鲸能察觉周围情况，并改变游动方向。'],
                growth: ['pass', '鲸会从小长大，也能繁殖后代。']
            },
            virus: {
                cell: ['fail', '病毒是生物，但并不是由细胞构成的。'],
                nutrition: ['solo', '不能独立完成，它要进入活细胞才用得到营养。'],
                waste: ['solo', '不能独立完成，离开活细胞就没有废物可排。'],
                response: ['solo', '不能独立完成，它无法独自对刺激作出反应。'],
                growth: ['solo', '不能独立完成，它得依靠活细胞才能繁殖。']
            }
        };
    }

    init() {
        this.camera.position.set(0, 3.2, 8.2);
        this.scene.background = new THREE.Color(0xdfe8e2);
        this.setupLights();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        const floor = this.mesh(this.group, new THREE.CircleGeometry(4.4, 36), 0xe7efe4, 0, 0, 0);
        floor.rotation.x = -Math.PI / 2;
        this.buildSubjects();
        this.buildReadout();
        this.setupUI();
        this.pickSubject('lithops');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xfff6ea, 0.72);
        const sun = new THREE.DirectionalLight(0xffffff, 0.85);
        sun.position.set(6, 10, 6);
        const fill = new THREE.DirectionalLight(0xc5d4c8, 0.35);
        fill.position.set(-6, 4, -3);
        [ambient, sun, fill].forEach(light => {
            this.lights.push(light);
            this.scene.add(light);
        });
    }

    mesh(parent, geo, color, x, y, z) {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.05 });
        const obj = new THREE.Mesh(geo, mat);
        obj.position.set(x, y, z);
        parent.add(obj);
        return obj;
    }

    buildSubjects() {
        const builders = {
            lithops: () => this.buildLithops(),
            stalactite: () => this.buildStalactite(),
            robot: () => this.buildRobot(),
            mimosa: () => this.buildMimosa(),
            whale: () => this.buildWhale(),
            virus: () => this.buildVirus()
        };
        this.subjects.forEach(([key, name]) => {
            const model = builders[key]();
            model.visible = false;
            model.userData.hoverTitle = name;
            model.userData.onClick = () => this.pickSubject(key);
            this.group.add(model);
            this.models[key] = model;
            this.interactables.push(model);
        });
    }

    buildLithops() {
        const g = new THREE.Group();
        const sand = this.mesh(g, new THREE.CylinderGeometry(1.35, 1.45, 0.16, 20), 0xc6a36d, 0, 0.08, 0);
        sand.material.roughness = 1;
        const left = this.mesh(g, new THREE.SphereGeometry(0.62, 16, 12), 0x9b9468, -0.42, 0.52, 0);
        left.scale.set(1.05, 0.72, 0.92);
        const right = this.mesh(g, new THREE.SphereGeometry(0.58, 16, 12), 0x8d865c, 0.42, 0.48, 0);
        right.scale.set(1.02, 0.7, 0.9);
        this.mesh(g, new THREE.BoxGeometry(0.07, 0.32, 0.72), 0x5e5642, 0, 0.58, 0);
        [ [-0.42, 0.9], [0.42, 0.84] ].forEach(([x, y]) => {
            const win = this.mesh(g, new THREE.CircleGeometry(0.26, 16), 0xe2d2a4, x, y, 0);
            win.rotation.x = -Math.PI / 2;
        });
        return g;
    }

    buildStalactite() {
        const g = new THREE.Group();
        this.mesh(g, new THREE.BoxGeometry(4.2, 0.36, 1.8), 0x6d5b4a, 0, 2.45, 0);
        const hang = this.mesh(g, new THREE.ConeGeometry(0.42, 1.7, 10), 0xd2be9e, -0.55, 1.5, 0);
        hang.rotation.z = Math.PI;
        this.mineral = this.mesh(g, new THREE.ConeGeometry(0.26, 1.2, 8), 0xead9b4, 0.5, 1.65, 0);
        this.mineral.rotation.z = Math.PI;
        this.mineralHeight = 1.2;
        this.mesh(g, new THREE.ConeGeometry(0.34, 0.85, 8), 0xb08968, 0.45, 0.42, 0);
        return g;
    }

    buildRobot() {
        const g = new THREE.Group();
        this.mesh(g, new THREE.BoxGeometry(0.92, 1.02, 0.56), 0x9aa3ad, 0, 1.2, 0);
        this.mesh(g, new THREE.BoxGeometry(0.64, 0.46, 0.5), 0xe5e7eb, 0, 1.95, 0);
        [-0.15, 0.15].forEach(x => {
            const eye = this.mesh(g, new THREE.SphereGeometry(0.07, 8, 8), 0x67e8f9, x, 1.98, 0.24);
            eye.material.emissive.setHex(0x22d3ee);
        });
        this.mesh(g, new THREE.CylinderGeometry(0.03, 0.03, 0.28, 6), 0x64748b, 0.18, 2.28, 0);
        [[-0.64, 1.55], [0.64, 1.55]].forEach(([x, y]) => {
            const arm = new THREE.Group();
            arm.position.set(x, y, 0);
            this.mesh(arm, new THREE.BoxGeometry(0.16, 0.72, 0.16), 0x6b7280, 0, -0.32, 0);
            g.add(arm);
            this.limbs.push(arm);
        });
        [[-0.22, 0.72], [0.22, 0.72]].forEach(([x, y]) => {
            const leg = new THREE.Group();
            leg.position.set(x, y, 0);
            this.mesh(leg, new THREE.BoxGeometry(0.2, 0.68, 0.22), 0x4b5563, 0, -0.34, 0);
            g.add(leg);
            this.limbs.push(leg);
        });
        this.robot = g;
        return g;
    }

    buildMimosa() {
        const g = new THREE.Group();
        this.mesh(g, new THREE.CylinderGeometry(0.05, 0.09, 1.7, 8), 0x2f6b32, 0, 0.85, 0);
        const leafGeo = new THREE.BoxGeometry(0.22, 0.025, 0.12);
        for (let i = 0; i < 4; i++) {
            [-1, 1].forEach(side => {
                const pivot = new THREE.Group();
                pivot.position.set(0, 0.5 + i * 0.3, 0);
                pivot.userData.side = side;
                this.mesh(pivot, new THREE.BoxGeometry(1.05, 0.03, 0.06), 0x3d8c40, side * 0.52, 0, 0);
                for (let k = 0; k < 4; k++) {
                    this.mesh(pivot, leafGeo, 0x4caf50, side * (0.28 + k * 0.22), 0.02, 0);
                }
                g.add(pivot);
                this.leafPivots.push(pivot);
            });
        }
        return g;
    }

    buildWhale() {
        const root = new THREE.Group();
        const g = new THREE.Group();
        const body = this.mesh(g, new THREE.SphereGeometry(0.7, 16, 12), 0x4d7394, 0, 0.35, 0);
        body.scale.set(2.15, 0.7, 0.82);
        this.mesh(g, new THREE.SphereGeometry(0.32, 10, 8), 0x5c84a6, 1.35, 0.42, 0);
        this.mesh(g, new THREE.SphereGeometry(0.05, 8, 8), 0x111827, 1.5, 0.52, 0.18);
        this.mesh(g, new THREE.BoxGeometry(0.18, 0.08, 0.95), 0x3e5c78, -1.7, 0.28, 0);
        this.mesh(g, new THREE.BoxGeometry(0.5, 0.05, 0.28), 0x3a556f, 0.25, 0.02, 0.62);
        this.mesh(g, new THREE.BoxGeometry(0.5, 0.05, 0.28), 0x3a556f, 0.25, 0.02, -0.62);
        this.spout = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const puff = this.mesh(this.spout, new THREE.SphereGeometry(0.06 + i * 0.025, 8, 8), 0xf8fbff, 0.2, 0.9 + i * 0.16, 0);
            puff.material.transparent = true;
            puff.material.opacity = 0.8;
        }
        this.spout.visible = false;
        g.add(this.spout);
        root.add(g);
        const water = this.mesh(root, new THREE.PlaneGeometry(7, 3.4), 0x7ec8e3, 0, 0.95, 0);
        water.rotation.x = -Math.PI / 2;
        water.material.transparent = true;
        water.material.opacity = 0.38;
        water.material.depthWrite = false;
        this.whale = g;
        return root;
    }

    buildVirus() {
        const g = new THREE.Group();
        this.mesh(g, new THREE.IcosahedronGeometry(0.58, 0), 0x7c3aed, 0, 1.05, 0);
        const dirs = [[1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1], [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]];
        const up = new THREE.Vector3(0, 1, 0);
        dirs.forEach(d => {
            const dir = new THREE.Vector3(d[0], d[1], d[2]).normalize();
            const spike = this.mesh(g, new THREE.CylinderGeometry(0.035, 0.08, 0.36, 6), 0xddd6fe, 0, 0, 0);
            spike.quaternion.setFromUnitVectors(up, dir);
            spike.position.copy(dir).multiplyScalar(0.8).add(new THREE.Vector3(0, 1.05, 0));
        });
        this.virus = g;
        return g;
    }

    buildReadout() {
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 256;
        this.ctx = canvas.getContext('2d');
        this.tex = new THREE.CanvasTexture(canvas);
        this.captionSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, transparent: true, depthTest: false }));
        this.captionSprite.position.set(0, 3.15, 0);
        this.captionSprite.scale.set(7.6, 0.95, 1);
        this.group.add(this.captionSprite);
        this.badge = new THREE.Mesh(
            new THREE.RingGeometry(1.2, 1.42, 40),
            new THREE.MeshBasicMaterial({ color: 0x94a3b8, side: THREE.DoubleSide })
        );
        this.badge.rotation.x = -Math.PI / 2;
        this.badge.position.y = 0.03;
        this.badge.visible = false;
        this.group.add(this.badge);
    }

    paint(text, bg) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 2048, 256);
        ctx.fillStyle = bg;
        ctx.fillRect(40, 40, 1968, 176);
        ctx.fillStyle = '#102018';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let size = 68;
        ctx.font = '700 ' + size + 'px sans-serif';
        while (size > 36 && ctx.measureText(text).width > 1840) {
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
        if (title) title.textContent = '生物有哪些特征';
        if (panel) panel.classList.add('visible');
        if (info) {
            const buttons = this.subjects.map(([key, name]) =>
                `<button class="control-btn" id="${this.id}-subject-${key}" type="button">${name}</button>`
            ).join('');
            info.innerHTML = `
                <p style="margin:0 0 8px;">一次只测一项。绿圈表示符合，红圈表示不符合，黄圈表示不能独立完成。</p>
                <div id="${this.id}-caption" style="padding:8px 10px;border-radius:8px;font-weight:700;background:#cbd5e1;color:#102018;">先选定对象，再点一项特征。</div>
                <div id="${this.id}-subjects" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">${buttons}</div>
            `;
            this.subjects.forEach(([key]) => {
                const btn = document.getElementById(this.id + '-subject-' + key);
                if (btn) btn.onclick = () => this.pickSubject(key);
            });
        }
        const bar = document.getElementById('scene-controls');
        if (!bar) return;
        bar.style.display = 'flex';
        bar.innerHTML = this.tests.map(([key, name]) =>
            `<button class="control-btn" id="${this.id}-test-${key}" type="button">${name}</button>`
        ).join('');
        this.tests.forEach(([key]) => {
            const btn = document.getElementById(this.id + '-test-' + key);
            if (btn) btn.onclick = () => this.pickTest(key);
        });
    }

    pickSubject(key) {
        this.subject = key;
        Object.keys(this.models).forEach(name => {
            this.models[name].visible = name === key;
        });
        this.subjects.forEach(([name]) => {
            const btn = document.getElementById(this.id + '-subject-' + name);
            if (btn) btn.classList.toggle('active', name === key);
        });
        if (this.test) this.apply();
        else this.paint('先选定对象，再点一项特征。', '#cbd5e1');
    }

    pickTest(key) {
        this.test = key;
        this.tests.forEach(([name]) => {
            const btn = document.getElementById(this.id + '-test-' + name);
            if (btn) btn.classList.toggle('active', name === key);
        });
        this.apply();
    }

    apply() {
        const row = this.copy[this.subject][this.test];
        const hex = row[0] === 'pass' ? 0x22c55e : row[0] === 'fail' ? 0xef4444 : 0xf59e0b;
        const css = row[0] === 'pass' ? '#22c55e' : row[0] === 'fail' ? '#ef4444' : '#f59e0b';
        this.badge.visible = true;
        this.badge.material.color.setHex(hex);
        this.paint(row[1], css);
        const el = document.getElementById(this.id + '-caption');
        if (el) {
            el.textContent = row[1];
            el.style.background = css;
            el.style.color = '#102018';
        }
    }

    animate(time, delta) {
        if (!this.group) return;
        const step = Math.min(1, delta * 3);
        const foldTarget = this.subject === 'mimosa' && this.test === 'response' ? 1 : 0;
        this.fold += (foldTarget - this.fold) * step;
        const angle = -0.7 + this.fold * 1.85;
        this.leafPivots.forEach(pivot => {
            pivot.rotation.z = pivot.userData.side * angle;
        });
        const riseTarget = this.subject === 'whale' && this.test === 'nutrition' ? 1 : 0;
        this.whaleRise += (riseTarget - this.whaleRise) * Math.min(1, delta * 1.2);
        if (this.whale) {
            this.whale.position.y = -0.4 + this.whaleRise * 1.05;
            this.whale.rotation.z = this.whaleRise * 0.22 + Math.sin(time * 0.8) * 0.04;
        }
        if (this.spout) {
            this.spout.visible = this.subject === 'whale' && this.test === 'nutrition' && this.whaleRise > 0.72;
            this.spout.position.y = Math.sin(time * 5) * 0.06;
        }
        const mineralTarget = this.subject === 'stalactite' && this.test === 'growth' ? 1.85 : 1;
        this.mineralScale += (mineralTarget - this.mineralScale) * step;
        if (this.mineral) {
            this.mineral.scale.y = this.mineralScale;
            this.mineral.position.y = 2.28 - (this.mineralHeight * this.mineralScale) / 2;
        }
        if (this.robot) {
            const moving = this.subject === 'robot';
            const fast = moving && this.test === 'response';
            this.robot.position.x = Math.sin(time * (fast ? 2.4 : 0.7)) * (fast ? 0.5 : 0.08);
            this.limbs.forEach((limb, i) => {
                limb.rotation.x = Math.sin(time * (fast ? 6 : 1.5) + i) * (fast ? 0.65 : 0.1);
            });
        }
        if (this.virus && this.subject === 'virus') this.virus.rotation.y += delta * 0.45;
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
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
