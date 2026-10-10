/**
 * 七年级：菜豆种子、玉米粒和孢子
 * 菜豆无胚乳；玉米粒是果实。碘液检测淀粉，菜豆子叶和玉米胚乳可呈蓝黑色。
 */
window.Grade7SeedScene = class Grade7SeedScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.innerLabels = [];
        this.mode = 'bean';
        this.opened = false;
        this.iodine = false;
        this.compareSpore = false;
        this.env = { warm: false, wet: false, dry: false, cold: false };
        this.seedWaited = false;
        this.hasSprouted = false;
        this.peel = 0;
        this.sprout = 0;
        this.sporeGrow = 0;
        this.blue = 0;
    }

    init() {
        this.camera.position.set(0, 1.7, 7.4);
        this.camera.lookAt(0, 0, 0);
        this.scene.background = new THREE.Color(0x122033);
        this.addLight(new THREE.HemisphereLight(0xfff6e8, 0x334155, 0.55));
        const sun = new THREE.DirectionalLight(0xffffff, 0.75);
        sun.position.set(4, 7, 6);
        this.addLight(sun);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.ball = new THREE.SphereGeometry(0.75, 22, 16);
        this.buildBean();
        this.buildCorn();
        this.buildSpore();
        this.setupUI();
    }

    addLight(light) {
        this.lights.push(light);
        this.scene.add(light);
    }

    mat(color, extra) {
        return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.55 }, extra || {}));
    }

    mesh(geo, material, x, y, z, parent) {
        const obj = new THREE.Mesh(geo, material);
        obj.position.set(x || 0, y || 0, z || 0);
        (parent || this.group).add(obj);
        return obj;
    }

    sprite(text) {
        const canvas = document.createElement('canvas');
        const fontSize = 40;
        canvas.width = Math.ceil(text.length * fontSize + 36);
        canvas.height = 72;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 ' + fontSize + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, 36);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        spr.scale.set(canvas.width / 190, 72 / 190, 1);
        return spr;
    }

    tag(parent, text, x, y, z, hidden) {
        const spr = this.sprite(text);
        spr.position.set(x, y, z);
        parent.add(spr);
        if (hidden) {
            spr.visible = false;
            this.innerLabels.push(spr);
        }
        return spr;
    }

    hook(obj, name, desc) {
        obj.userData = {
            name: name,
            hoverTitle: name,
            hoverDesc: desc,
            onClick: () => {
                const el = document.getElementById('g7seed-detail');
                if (el) el.textContent = name + '：' + desc;
            }
        };
        this.interactables.push(obj);
    }

    buildBean() {
        const g = new THREE.Group();
        this.bean = g;
        this.group.add(g);
        const skin = this.mat(0x8a4b2f);
        const flesh = this.mat(0xf3ddb0);
        const fleshR = this.mat(0xf6e4bc);
        this.cotLBase = flesh.color.clone();
        this.cotRBase = fleshR.color.clone();
        this.coatPivot = new THREE.Group();
        this.cotLPivot = new THREE.Group();
        this.cotRPivot = new THREE.Group();
        g.add(this.coatPivot);
        g.add(this.cotLPivot);
        g.add(this.cotRPivot);
        this.coat = this.mesh(this.ball, skin, 0, 0, 0, this.coatPivot);
        this.coat.scale.set(0.9, 1.2, 0.62);
        this.cotL = this.mesh(this.ball, flesh, 0, 0, -0.02, this.cotLPivot);
        this.cotL.scale.set(0.58, 0.92, 0.26);
        this.cotR = this.mesh(this.ball, fleshR, 0, 0, 0.02, this.cotRPivot);
        this.cotR.scale.set(0.58, 0.92, 0.26);
        const emb = new THREE.Group();
        this.embryo = emb;
        g.add(emb);
        const tip = this.mat(0xf7e7a1);
        this.radicle = this.mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.34, 8), tip, 0, -0.28, 0, emb);
        this.axis = this.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), this.mat(0xfff6d2), 0, -0.02, 0, emb);
        this.plumule = this.mesh(new THREE.SphereGeometry(0.09, 10, 8), this.mat(0xb5d88a), 0, 0.16, 0, emb);
        this.beanSprout = this.mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.9, 8), this.mat(0x3d9d45), 0, 0.2, 0, this.plumule);
        this.beanSprout.scale.y = 0.02;
        this.tag(this.coatPivot, '种皮', 0, 1.15, 0.55, false);
        this.tag(this.cotLPivot, '子叶', -0.2, 0.55, 0.55, true);
        this.tag(this.cotRPivot, '子叶', 0.2, 0.35, 0.55, true);
        this.tag(emb, '胚根', 0.62, -0.28, 0.15, true);
        this.tag(emb, '胚轴', 0.62, -0.02, 0.15, true);
        this.tag(emb, '胚芽', 0.58, 0.28, 0.15, true);
        const embryo = '胚芽、胚轴、胚根和子叶合在一起才是胚。菜豆没有胚乳。';
        this.hook(this.coat, '种皮', '种皮包在种子外面。剥开后才能看到里面的胚。');
        this.hook(this.cotL, '子叶', '菜豆有两片子叶，营养存在这里；其中的淀粉遇碘液呈蓝黑色。' + embryo);
        this.hook(this.cotR, '子叶', '另一片子叶，也贮存营养，其中的淀粉可用碘液检测。' + embryo);
        this.hook(this.radicle, '胚根', '胚根将来长成根。' + embryo);
        this.hook(this.axis, '胚轴', '胚轴连接胚芽和胚根。' + embryo);
        this.hook(this.plumule, '胚芽', '胚芽将来长成茎和叶。' + embryo);
    }

    buildCorn() {
        const g = new THREE.Group();
        this.corn = g;
        g.visible = false;
        this.group.add(g);
        this.cornWhole = this.mesh(this.ball, this.mat(0xe0a43a), 0, 0.05, 0, g);
        this.cornWhole.scale.set(0.78, 1.18, 0.5);
        this.wholeLabel = this.tag(g, '果皮和种皮', 0, 1.4, 0.6, false);
        this.cornCut = new THREE.Group();
        g.add(this.cornCut);
        this.cornCut.visible = false;
        const shell = this.mat(0xc9842a);
        this.pericarp = this.mesh(this.ball, shell, 0, 0.05, -0.02, this.cornCut);
        this.pericarp.scale.set(0.9, 1.22, 0.2);
        this.endoBase = new THREE.Color(0xf6e7b2);
        this.endoBlue = new THREE.Color(0x18234f);
        this.endospermMat = this.mat(0xf6e7b2);
        this.endosperm = this.mesh(this.ball, this.endospermMat, 0.08, 0.16, 0.08, this.cornCut);
        this.endosperm.scale.set(0.62, 0.82, 0.16);
        this.scutellum = this.mesh(new THREE.BoxGeometry(0.14, 0.72, 0.08), this.mat(0xf0c36a), -0.28, -0.02, 0.14, this.cornCut);
        const pale = this.mat(0xfff4cc);
        this.cPlum = this.mesh(new THREE.SphereGeometry(0.09, 10, 8), this.mat(0xc6e39a), -0.46, 0.16, 0.18, this.cornCut);
        this.cAxis = this.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), pale, -0.46, -0.02, 0.18, this.cornCut);
        this.cRad = this.mesh(new THREE.ConeGeometry(0.07, 0.26, 8), pale, -0.46, -0.28, 0.18, this.cornCut);
        this.cornSprout = this.mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.9, 8), this.mat(0x3d9d45), -0.46, 0.2, 0.42, g);
        this.cornSprout.scale.y = 0.02;
        this.tag(this.cornCut, '果皮和种皮', 0.15, 1.4, 0.45, false);
        this.tag(this.cornCut, '胚乳', 0.85, 0.4, 0.45, false);
        this.tag(this.scutellum, '一片子叶', 0.15, 0.45, 0.2, false);
        this.tag(this.cRad, '胚根', -0.55, -0.05, 0.2, false);
        this.tag(this.cAxis, '胚轴', -0.55, 0, 0.2, false);
        this.tag(this.cPlum, '胚芽', -0.5, 0.12, 0.2, false);
        this.hook(this.cornWhole, '果皮和种皮', '玉米粒外层是果皮和种皮长在一起，所以一粒玉米其实是果实。');
        this.hook(this.pericarp, '果皮和种皮', '纵切后外圈仍是果皮和种皮。玉米粒不是单独的种子。');
        this.hook(this.endosperm, '胚乳', '胚乳贮存淀粉。遇碘变蓝说明有淀粉。胚乳不是胚。');
        this.hook(this.scutellum, '一片子叶', '玉米的胚只有一片子叶，不把大部分淀粉存在子叶里。');
        this.hook(this.cPlum, '胚芽', '胚芽、胚轴、胚根和这一片子叶组成胚。');
        this.hook(this.cAxis, '胚轴', '胚轴在胚芽和胚根之间。');
        this.hook(this.cRad, '胚根', '胚根在胚的下端。');
    }

    buildSpore() {
        const g = new THREE.Group();
        this.sporeGrp = g;
        g.visible = false;
        g.position.set(2.15, -0.95, 0);
        this.group.add(g);
        this.spore = this.mesh(new THREE.SphereGeometry(0.22, 16, 12), this.mat(0xc4b5fd), 0, 0, 0, g);
        this.sporeThread = this.mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.8, 8), this.mat(0xa3e635), 0, 0.2, 0, g);
        this.sporeThread.scale.y = 0.02;
        this.tag(this.spore, '孢子', 0, 0.55, 0.2, false);
        this.hook(this.spore, '孢子', '孢子是一个细胞。本演示在条件不适时暂不显示萌发。孢子的休眠和耐受性因类群而异，不能一概认为遇到干燥或寒冷就会死亡。');
        this.mesh(new THREE.CylinderGeometry(3.1, 3.2, 0.16, 28), this.mat(0x1e293b), 0, -1.25, 0, this.group);
    }

    setupUI() {
        const title = document.getElementById('info-title');
        if (title) title.textContent = '种子和孢子';
        const info = document.getElementById('info-content');
        const btn = (id, text) => '<button class="control-btn" id="' + id + '">' + text + '</button>';
        if (info) {
            info.innerHTML = [
                '<p id="g7seed-caption" style="line-height:1.6;margin:0 0 8px;white-space:pre-wrap;"></p>',
                '<p id="g7seed-detail" style="line-height:1.5;margin:0 0 8px;"></p>',
                '<div style="display:flex;flex-wrap:wrap;gap:6px;">',
                btn('g7seed-warm', '温暖'),
                btn('g7seed-wet', '潮湿'),
                btn('g7seed-dry', '干燥'),
                btn('g7seed-cold', '寒冷'),
                '</div>'
            ].join('');
        }
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');
        const controls = document.getElementById('scene-controls');
        if (controls) {
            controls.style.display = 'flex';
            controls.innerHTML = [
                btn('g7seed-bean', '菜豆'),
                btn('g7seed-corn', '玉米'),
                btn('g7seed-cut', '剥开/纵切'),
                btn('g7seed-iodine', '滴碘液'),
                btn('g7seed-spore', '对比孢子')
            ].join('');
        }
        const click = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        };
        click('g7seed-bean', () => this.choose('bean'));
        click('g7seed-corn', () => this.choose('corn'));
        click('g7seed-cut', () => this.toggleCut());
        click('g7seed-iodine', () => this.toggleIodine());
        click('g7seed-spore', () => this.toggleSpore());
        click('g7seed-warm', () => this.toggleEnv('warm'));
        click('g7seed-wet', () => this.toggleEnv('wet'));
        click('g7seed-dry', () => this.toggleEnv('dry'));
        click('g7seed-cold', () => this.toggleEnv('cold'));
        this.syncButtons();
        this.refreshCaption();
    }

    mark(id, on) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', !!on);
    }

    syncButtons() {
        this.mark('g7seed-bean', this.mode === 'bean');
        this.mark('g7seed-corn', this.mode === 'corn');
        this.mark('g7seed-cut', this.opened);
        this.mark('g7seed-iodine', this.iodine);
        this.mark('g7seed-spore', this.compareSpore);
        this.mark('g7seed-warm', this.env.warm);
        this.mark('g7seed-wet', this.env.wet);
        this.mark('g7seed-dry', this.env.dry);
        this.mark('g7seed-cold', this.env.cold);
    }

    choose(mode) {
        this.mode = mode;
        if (this.iodine) this.opened = true;
        this.syncButtons();
        this.refreshCaption();
    }

    toggleCut() {
        this.opened = !this.opened;
        this.syncButtons();
        this.refreshCaption();
    }

    toggleIodine() {
        this.iodine = !this.iodine;
        if (this.iodine) this.opened = true;
        this.syncButtons();
        this.refreshCaption();
    }

    toggleSpore() {
        this.compareSpore = !this.compareSpore;
        this.syncButtons();
        this.refreshCaption();
    }

    toggleEnv(key) {
        const ban = { warm: 'cold', cold: 'warm', wet: 'dry', dry: 'wet' };
        this.env[key] = !this.env[key];
        if (this.env[key]) this.env[ban[key]] = false;
        if (this.env.dry || this.env.cold) this.seedWaited = true;
        this.syncButtons();
        this.refreshCaption();
    }

    refreshCaption() {
        const good = this.env.warm && this.env.wet && !this.env.dry && !this.env.cold;
        const harsh = this.env.dry || this.env.cold;
        const bits = [];
        if (this.compareSpore) bits.push('孢子是一个细胞；种子有种皮和胚，还能贮存营养。');
        if (this.mode === 'corn' && this.iodine) bits.push('玉米胚乳富含淀粉，遇碘液呈蓝黑色。人们常说的玉米粒其实是果实。');
        if (harsh) bits.push('干燥或寒冷时，本演示暂停萌发；种子和孢子对不良条件的耐受性因种类而异，并非一定死亡。');
        else if (good && this.seedWaited) bits.push('条件恢复适宜后，本演示继续显示萌发；这不表示所有种子和孢子都能耐受此前的不良条件。');
        else if (good) bits.push('本演示中温度和水分适宜时，显示种子和孢子萌发。不同种类的萌发条件有所不同。');
        else if (this.compareSpore) bits.push('先同时打开温暖和潮湿。也可以让种子先经历干燥或寒冷。');
        if (!bits.length && this.mode === 'bean') {
            bits.push(this.opened
                ? '种皮剥开了。两片子叶分开后，能看到胚芽、胚轴和胚根。胚包括它们和子叶，菜豆没有胚乳。'
                : '这是菜豆种子，外面是种皮。点「剥开/纵切」看里面。');
        }
        if (!bits.length && this.mode === 'corn') {
            bits.push(this.opened
                ? '纵切面上：外圈是果皮和种皮，大块是胚乳，胚只有一片子叶，还有胚芽、胚轴、胚根。'
                : '这是玉米粒。点「剥开/纵切」看纵切面，再滴碘液。');
        }
        if (this.mode === 'bean' && this.iodine) bits.push('碘液检测的是淀粉，不是胚乳这种组织。菜豆虽无胚乳，子叶贮存的淀粉也会遇碘液呈蓝黑色。');
        bits.push('萌发演示默认种子有活力、空气充足，温度和水分适宜；碘染与萌发是独立示意。');
        const el = document.getElementById('g7seed-caption');
        if (el) el.textContent = bits.join('\n');
    }

    animate(time, delta) {
        if (!this.group) return;
        const glide = Math.min(1, delta * 3.2);
        this.peel += ((this.opened ? 1 : 0) - this.peel) * glide;
        const blueTarget = this.iodine && this.opened && this.peel > 0.48 ? 1 : 0;
        this.blue += (blueTarget - this.blue) * Math.min(1, delta * 2.2);
        this.endospermMat.color.copy(this.endoBase).lerp(this.endoBlue, this.mode === 'corn' ? this.blue : 0);
        const beanBlue = this.mode === 'bean' ? this.blue : 0;
        this.cotL.material.color.copy(this.cotLBase).lerp(this.endoBlue, beanBlue);
        this.cotR.material.color.copy(this.cotRBase).lerp(this.endoBlue, beanBlue);
        const good = this.env.warm && this.env.wet && !this.env.dry && !this.env.cold;
        if (good) this.sprout += (1 - this.sprout) * Math.min(1, delta * 0.85);
        else if (!this.hasSprouted) this.sprout += (0 - this.sprout) * Math.min(1, delta * 1.2);
        if (this.sprout > 0.92) this.hasSprouted = true;
        this.sporeGrow += ((good ? 1 : 0) - this.sporeGrow) * Math.min(1, delta * 0.85);
        const x = this.compareSpore ? -1.55 : 0;
        this.bean.position.x = x;
        this.corn.position.x = x;
        this.bean.visible = this.mode === 'bean';
        this.corn.visible = this.mode === 'corn';
        this.sporeGrp.visible = this.compareSpore;
        const p = this.peel;
        this.coatPivot.position.set(1.7 * p, 0.35 * p, 0);
        this.coatPivot.rotation.z = -0.65 * p;
        this.cotLPivot.position.x = -0.66 * p;
        this.cotRPivot.position.x = 0.66 * p;
        this.embryo.position.set(0.5 * p, -0.02, 0.1 + 0.32 * p);
        this.innerLabels.forEach((spr) => { spr.visible = p > 0.48; });
        this.cornWhole.visible = p < 0.5;
        this.cornCut.visible = p >= 0.5;
        this.wholeLabel.visible = p < 0.5;
        const sy = 0.02 + this.sprout * 1.45;
        this.beanSprout.scale.y = sy;
        this.beanSprout.position.y = 0.45 * sy;
        this.beanSprout.rotation.z = Math.sin(time * 1.6) * 0.1 * this.sprout;
        this.cornSprout.scale.y = sy;
        this.cornSprout.position.y = 0.16 + 0.45 * sy;
        this.cornSprout.rotation.z = Math.sin(time * 1.6) * 0.1 * this.sprout;
        const gy = 0.02 + this.sporeGrow * 1.6;
        this.sporeThread.scale.y = gy;
        this.sporeThread.position.y = 0.18 + 0.4 * gy;
        this.sporeThread.visible = this.sporeGrow > 0.05;

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
        }
        const info = document.getElementById('info-content');
        if (info) info.innerHTML = '';
    }
};
