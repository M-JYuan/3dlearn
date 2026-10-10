/**
 * 七年级：鱼在水中用鳃呼吸
 * 口与鳃盖交替；离水后鳃丝粘成一团，游动停止。
 */
window.Grade7FishGillScene = class Grade7FishGillScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.inWater = true;
        this.lidOpen = false;
        this.inkOn = false;
        this.swim = 1;
        this.clump = 0;
        this.lift = 0;
        this.breath = 0;
        this.swimPhase = 0;
        this.tailPhase = 0;
        this.filaments = [];
        this.drops = [];
    }

    init() {
        this.camera.position.set(1.4, 1.35, 7.2);
        this.camera.lookAt(0, 0.2, 0);
        this.scene.background = new THREE.Color(0xc5e7f8);
        this.addLight(new THREE.HemisphereLight(0xffffff, 0x7dd3fc, 0.7));
        const sun = new THREE.DirectionalLight(0xffffff, 0.55);
        sun.position.set(5, 8, 4);
        this.addLight(sun);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.buildTank();
        this.buildFish();
        this.setupUI();
    }

    addLight(light) {
        this.lights.push(light);
        this.scene.add(light);
    }

    mat(color, extra) {
        return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.48 }, extra || {}));
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
        canvas.width = Math.ceil(text.length * fontSize + 32);
        canvas.height = 70;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 ' + fontSize + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, 35);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        spr.scale.set(canvas.width / 210, 70 / 210, 1);
        return spr;
    }

    tag(parent, text, x, y, z) {
        const spr = this.sprite(text);
        spr.position.set(x, y, z);
        parent.add(spr);
        return spr;
    }

    hook(obj, name, desc) {
        obj.userData = {
            name: name,
            hoverTitle: name,
            hoverDesc: desc,
            onClick: () => this.detail(name + '：' + desc)
        };
        this.interactables.push(obj);
    }

    buildTank() {
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x1d4ed8,
            transparent: true,
            opacity: 0.28,
            roughness: 0.15,
            depthWrite: false
        });
        const water = this.mesh(new THREE.BoxGeometry(11, 2.8, 6.2), waterMat, 0, -0.85, 0);
        water.renderOrder = 2;
        const skinMat = new THREE.MeshBasicMaterial({
            color: 0xbfdbfe,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.surface = this.mesh(new THREE.PlaneGeometry(11, 6.2), skinMat, 0, 0.56, 0);
        this.surface.rotation.x = -Math.PI / 2;
        this.surface.renderOrder = 3;
        this.mesh(new THREE.BoxGeometry(11, 0.12, 6.2), this.mat(0xd6b48a), 0, -2.2, 0);
    }

    buildFish() {
        const fish = new THREE.Group();
        this.fish = fish;
        this.group.add(fish);
        const bodyMat = this.mat(0x7dd3fc, { metalness: 0.04 });
        const finMat = this.mat(0x3b82b8);
        const body = this.mesh(new THREE.SphereGeometry(0.7, 24, 16), bodyMat, 0, 0, 0, fish);
        body.scale.set(1.85, 0.78, 0.58);
        this.hook(body, '身体', '鱼的身体侧扁。看清各鳍和鳃盖时，不用管繁殖。');
        this.mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf8fafc }), 1.05, 0.16, 0.28, fish);
        this.mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0f172a }), 1.08, 0.16, 0.35, fish);
        this.mouthHole = this.mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0x111827 }), 1.28, -0.02, 0.02, fish);
        this.jaw = new THREE.Group();
        this.jaw.position.set(1.18, -0.1, 0);
        fish.add(this.jaw);
        this.mesh(new THREE.BoxGeometry(0.36, 0.07, 0.2), bodyMat, 0.16, 0, 0, this.jaw);
        this.hinge = new THREE.Group();
        this.hinge.position.set(0.98, 0.02, 0.28);
        fish.add(this.hinge);
        this.operculum = this.mesh(new THREE.BoxGeometry(0.5, 0.58, 0.06), this.mat(0xe0f2fe), -0.24, 0, 0.02, this.hinge);
        this.tag(this.operculum, '鳃盖', 0, 0.48, 0.12);
        this.hook(this.operculum, '鳃盖', '鳃盖盖住鳃丝。水从它的后缘流出去。');
        const threadGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.4, 6);
        const threadMat = this.mat(0xfb7185);
        for (let i = 0; i < 6; i++) {
            const thread = new THREE.Mesh(threadGeo, threadMat);
            const hy = (i - 2.5) * 0.07;
            thread.position.set(0.58, hy, 0.2);
            thread.rotation.z = (i - 2.5) * 0.16;
            thread.userData.hx = 0.58;
            thread.userData.hy = hy;
            thread.userData.hz = 0.2 + (i % 2) * 0.03;
            thread.userData.rz = thread.rotation.z;
            fish.add(thread);
            this.filaments.push(thread);
        }
        this.tag(fish, '鳃丝', 0.95, 0.42, 0.55);
        this.hook(this.filaments[2], '鳃丝', '鳃丝在水中是分开的。离开水面后会粘成一团。');
        this.clumpBall = this.mesh(new THREE.SphereGeometry(0.16, 12, 10), this.mat(0xbe123c), 0.58, 0, 0.24, fish);
        this.clumpBall.visible = false;
        this.dorsal = this.plate(fish, finMat, -0.05, 0.62, 0, 0.55, 0.42, 0.05, '背鳍', '背鳍长在背上。');
        this.pectoral = this.plate(fish, finMat, 0.42, -0.2, 0.36, 0.28, 0.22, 0.05, '胸鳍', '胸鳍成对，靠近鳃盖后面。');
        this.plate(fish, finMat, 0.42, -0.2, -0.36, 0.28, 0.22, 0.05, '', '');
        this.pelvic = this.plate(fish, finMat, 0.05, -0.5, 0.12, 0.22, 0.2, 0.04, '腹鳍', '腹鳍长在腹面。');
        this.anal = this.plate(fish, finMat, -0.55, -0.46, 0, 0.28, 0.24, 0.04, '臀鳍', '臀鳍长在身体后下方。');
        this.tail = new THREE.Group();
        this.tail.position.set(-1.15, 0, 0);
        fish.add(this.tail);
        const caudal = this.mesh(new THREE.ConeGeometry(0.38, 0.72, 4), finMat, -0.28, 0, 0, this.tail);
        caudal.rotation.z = Math.PI / 2;
        this.tag(caudal, '尾鳍', 0, 0.48, 0.2);
        this.hook(caudal, '尾鳍', '尾鳍左右摆动，鱼才能游。离开水面后摆动停止。');
        const line = this.mesh(new THREE.BoxGeometry(1.35, 0.035, 0.035), this.mat(0x1e3a4c), -0.05, 0.02, 0.42, fish);
        this.tag(line, '侧线', 0, 0.28, 0.15);
        this.hook(line, '侧线', '侧线是身体两侧的一条感觉线，用来察觉水流。');
        const inkMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
        for (let i = 0; i < 8; i++) {
            const drop = this.mesh(new THREE.SphereGeometry(0.045, 8, 8), inkMat, 0, 0, 0, fish);
            drop.visible = false;
            drop.userData.t = i / 8;
            this.drops.push(drop);
        }
    }

    plate(parent, material, x, y, z, sx, sy, sz, name, desc) {
        const fin = this.mesh(new THREE.BoxGeometry(sx, sy, sz), material, x, y, z, parent);
        if (name) {
            this.tag(fin, name, 0, sy * 0.8, 0.12);
            this.hook(fin, name, desc);
        }
        return fin;
    }

    setupUI() {
        const title = document.getElementById('info-title');
        if (title) title.textContent = '鱼的鳃';
        const info = document.getElementById('info-content');
        if (info) {
            info.innerHTML = [
                '<p id="g7gill-caption" style="line-height:1.6;margin:0 0 8px;"></p>',
                '<p id="g7gill-detail" style="line-height:1.5;margin:0;"></p>'
            ].join('');
        }
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');
        const controls = document.getElementById('scene-controls');
        const btn = (id, text) => '<button class="control-btn" id="' + id + '">' + text + '</button>';
        if (controls) {
            controls.style.display = 'flex';
            controls.innerHTML = [
                btn('g7gill-lid', '掀开鳃盖'),
                btn('g7gill-ink', '滴墨水'),
                btn('g7gill-out', '离开水面'),
                btn('g7gill-back', '放回水中')
            ].join('');
        }
        const click = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        };
        click('g7gill-lid', () => this.toggleLid());
        click('g7gill-ink', () => this.toggleInk());
        click('g7gill-out', () => this.leaveWater());
        click('g7gill-back', () => this.returnWater());
        this.sync();
        this.caption('水中的氧进入血液，二氧化碳随水排出。');
        this.detail('口和鳃盖交替开合。水从口进，从鳃盖后面出。');
    }

    mark(id, on) {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', !!on);
    }

    sync() {
        this.mark('g7gill-lid', this.lidOpen);
        this.mark('g7gill-ink', this.inkOn);
        this.mark('g7gill-out', !this.inWater);
        this.mark('g7gill-back', this.inWater);
    }

    caption(text) {
        const el = document.getElementById('g7gill-caption');
        if (el) el.textContent = text;
    }

    detail(text) {
        const el = document.getElementById('g7gill-detail');
        if (el) el.textContent = text;
    }

    toggleLid() {
        this.lidOpen = !this.lidOpen;
        this.sync();
        this.detail(this.lidOpen ? '鳃盖掀开，能看到下面的鳃丝。' : '鳃盖合上，鳃丝又被盖住。');
    }

    toggleInk() {
        this.inkOn = !this.inkOn;
        this.sync();
        this.detail(this.inkOn ? '墨水从口进入，从鳃盖后缘流出，表示水经过鳃。' : '');
    }

    leaveWater() {
        this.inWater = false;
        this.sync();
        this.caption('鳃丝在空气中粘成一团，鱼无法像在水里那样呼吸。');
        this.detail('游动已经停下。鳃丝不再分开。');
    }

    returnWater() {
        this.inWater = true;
        this.sync();
        this.caption('水中的氧进入血液，二氧化碳随水排出。');
        this.detail('回到水里后，口和鳃盖重新交替开合。');
    }

    animate(time, delta) {
        if (!this.fish) return;
        const damp = Math.min(1, delta * 2.2);
        if (this.inWater) {
            this.breath += delta * 2.7;
            this.swimPhase += delta * 0.75;
            this.tailPhase += delta * 5.2;
        }
        this.swim += ((this.inWater ? 1 : 0) - this.swim) * damp;
        this.clump += ((this.inWater ? 0 : 1) - this.clump) * damp;
        this.lift += ((this.inWater ? 0 : 2.05) - this.lift) * Math.min(1, delta * 1.5);
        this.fish.position.x = Math.sin(this.swimPhase) * 0.85 * this.swim;
        this.fish.position.y = this.lift;
        this.tail.rotation.y = Math.sin(this.tailPhase) * 0.5 * this.swim;
        this.fish.rotation.z = Math.sin(this.tailPhase * 0.5) * 0.04 * this.swim;
        const wave = Math.sin(this.breath);
        const mouth = this.inWater ? Math.max(0, wave) : 0;
        let gill = this.inWater ? Math.max(0, -wave) : 0.9;
        if (this.lidOpen) gill = this.inWater ? Math.max(gill, 0.45) : 1;
        this.jaw.rotation.z = -0.75 * mouth;
        this.hinge.rotation.y = 1.05 * gill;
        this.filaments.forEach((thread) => {
            const c = this.clump;
            thread.position.set(
                thread.userData.hx,
                thread.userData.hy * (1 - c),
                thread.userData.hz * (1 - c) + 0.24 * c
            );
            thread.rotation.z = thread.userData.rz * (1 - c);
            thread.scale.y = 1 - c * 0.88;
        });
        this.clumpBall.visible = this.clump > 0.12;
        this.clumpBall.scale.setScalar(0.04 + this.clump * 1.05);
        const flow = this.inkOn && this.inWater;
        this.drops.forEach((drop) => {
            drop.visible = flow;
            if (!flow) return;
            drop.userData.t = (drop.userData.t + delta * 0.32) % 1;
            const t = drop.userData.t;
            drop.position.set(
                1.4 + (0.28 - 1.4) * t,
                -0.02 + Math.sin(t * Math.PI) * 0.08,
                0.05 + (t < 0.5 ? t * 0.35 : 0.18 + (t - 0.5) * 1.25)
            );
        });
        if (this.surface) this.surface.material.opacity = 0.16 + Math.sin(time * 1.4) * 0.04;
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
