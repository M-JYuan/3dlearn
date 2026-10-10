window.Grade7FermentScene = class Grade7FermentScene {
    constructor(scene, camera, renderer) {
        Object.assign(this, {
            scene, camera, renderer, id: 'grade7-ferment', group: null, lights: [], interactables: [],
            mode: 'yogurt', warm: true, confirmed: false, tasted: false, warning: false, progress: 0,
            clock: 0, seal: 0, warnShake: 0, spoonShow: 0, btns: {}, caption: null, rods: [], yeasts: [],
            veg: [], bubbles: [], milkWarm: new THREE.Color(0xf4f7fb), yogColor: new THREE.Color(0xffefcc),
            rawGreen: new THREE.Color(0x7fbe63), sourGreen: new THREE.Color(0xc6b84a),
            lidWood: new THREE.Color(0xc7a06a), potWood: new THREE.Color(0xd7d2c8), lidHot: new THREE.Color(0xd26a62)
        });
    }

    init() {
        this.camera.position.set(0.2, 2.7, 7.8);
        this.scene.background = new THREE.Color(0xf7f1e6);
        this.setupLights();
        this.group = new THREE.Group();
        this.group.name = this.id;
        this.scene.add(this.group);
        const floor = this.part(this.group, new THREE.CircleGeometry(4.8, 36), 0xefe4d4, 1, 0, 0, 0);
        floor.rotation.x = -Math.PI / 2;
        this.build();
        this.setupUI();
        this.select('yogurt');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xfff7ee, 0.72);
        this.key = new THREE.DirectionalLight(0xfff1dc, 0.88);
        this.key.position.set(4, 8, 5);
        this.fill = new THREE.DirectionalLight(0xffd2a8, 0.28);
        this.fill.position.set(-5, 3, -3);
        this.lights.push(ambient, this.key, this.fill);
        this.lights.forEach((light) => this.scene.add(light));
    }

    material(color, opacity) {
        const transparent = opacity < 0.98;
        return new THREE.MeshStandardMaterial({
            color,
            roughness: 0.52,
            metalness: 0.03,
            transparent,
            opacity,
            depthWrite: !transparent
        });
    }

    part(parent, geometry, color, opacity, x, y, z) {
        const mesh = new THREE.Mesh(geometry, this.material(color, opacity));
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    tag(mesh, name, description) {
        mesh.userData.name = name;
        mesh.userData.description = description;
        this.interactables.push(mesh);
        return mesh;
    }

    makeSprite(text, sx, sy) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 128;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
        sprite.userData.canvas = canvas;
        sprite.scale.set(sx, sy, 1);
        this.writeSprite(sprite, text);
        return sprite;
    }

    writeSprite(sprite, text) {
        const canvas = sprite.userData.canvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#3a2b22';
        ctx.font = '600 56px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        if (sprite.material.map) sprite.material.map.dispose();
        sprite.material.map = new THREE.CanvasTexture(canvas);
        sprite.material.needsUpdate = true;
    }

    build() {
        this.food = new THREE.Group();
        this.group.add(this.food);
        this.jar = new THREE.Group();
        this.jar.position.y = 1.15;
        this.food.add(this.jar);
        this.part(this.jar, new THREE.CylinderGeometry(1.12, 1.2, 2.25, 28), 0xd5ebe8, 0.18, 0, 0, 0);
        this.milk = this.part(this.jar, new THREE.CylinderGeometry(0.96, 1.02, 1.35, 28), 0xf4f7fb, 0.9, 0, -0.28, 0);
        this.brine = this.part(this.jar, new THREE.CylinderGeometry(0.96, 1.02, 1.35, 28), 0xd7eccf, 0.45, 0, -0.28, 0);
        this.tag(this.milk, '酸奶', '乳酸菌把牛奶变成酸奶。容器一直盖着。');
        this.tag(this.brine, '泡菜', '乳酸菌让蔬菜变酸。这不是打开的培养皿。');
        this.vegGroup = new THREE.Group();
        this.jar.add(this.vegGroup);
        [[0.28, -0.2, 0.12, 0.34], [-0.32, -0.05, 0.08, 0.28], [0.02, 0.12, -0.18, 0.3], [-0.08, -0.42, -0.1, 0.24]].forEach(([x, y, z, s]) => {
            const veg = this.part(this.vegGroup, new THREE.SphereGeometry(s, 14, 12), 0x7fbe63, 1, x, y, z);
            veg.scale.y = 0.72;
            this.veg.push(veg);
        });
        this.tag(this.veg[0], '蔬菜', '泡菜里的蔬菜会在乳酸菌作用下变酸。');
        [[0.22, 0.05, 0.2], [-0.28, -0.12, 0.12], [0.06, 0.18, -0.16], [-0.12, -0.32, -0.14], [0.26, -0.22, -0.08], [-0.2, 0.16, 0.18]].forEach(([x, y, z], index) => {
            const rod = this.part(this.jar, new THREE.CylinderGeometry(0.035, 0.035, 0.24, 8), 0x6ea8c8, 1, x, y, z);
            rod.rotation.z = index * 0.7;
            rod.userData.base = new THREE.Vector3(x, y, z);
            this.rods.push(rod);
        });
        this.tag(this.rods[0], '乳酸菌', '乳酸菌是细菌。做酸奶时它把牛奶变成酸奶，做泡菜时它让蔬菜变酸。');
        this.jarLid = this.part(this.jar, new THREE.CylinderGeometry(1.24, 1.24, 0.2, 28), 0xc7a06a, 1, 0, 1.18, 0);
        this.part(this.jar, new THREE.SphereGeometry(0.16, 12, 10), 0xa8844e, 1, 0, 1.36, 0);
        this.tag(this.jarLid, '盖子', '盖子盖着容器。发酵食品不放在敞口的培养皿里。');

        this.pot = new THREE.Group();
        this.pot.position.y = 0.85;
        this.pot.visible = false;
        this.food.add(this.pot);
        this.part(this.pot, new THREE.CylinderGeometry(1.45, 1.35, 1.55, 28), 0xf7f4ef, 0.2, 0, 0, 0);
        this.dough = this.part(this.pot, new THREE.SphereGeometry(0.72, 24, 16), 0xf3e2c4, 1, 0, -0.15, 0);
        this.tag(this.dough, '面团', '酵母菌把葡萄糖变成酒精和二氧化碳，面团因此鼓起来。');
        [[0.18, 0.05, 0.12], [-0.2, -0.02, 0.08], [0.02, 0.12, -0.16], [-0.1, -0.12, -0.1], [0.16, -0.08, -0.14]].forEach(([x, y, z]) => {
            const yeast = this.part(this.pot, new THREE.SphereGeometry(0.07, 10, 8), 0xe0b15a, 1, x, y, z);
            yeast.scale.y = 1.35;
            yeast.userData.base = new THREE.Vector3(x, y, z);
            this.yeasts.push(yeast);
        });
        this.tag(this.yeasts[0], '酵母菌', '酵母菌是真菌。它把葡萄糖变成酒精和二氧化碳，也可以用来酿酒。');
        [[-0.35, -0.2], [0.2, 0.15], [-0.05, 0.28], [0.32, -0.18], [-0.22, 0.22], [0.08, -0.32]].forEach(([x, z], index) => {
            const bubble = this.part(this.pot, new THREE.SphereGeometry(0.06, 8, 8), 0xffffff, 0.7, x, 0, z);
            bubble.userData.x = x;
            bubble.userData.z = z;
            bubble.userData.offset = index * 0.16;
            bubble.visible = false;
            this.bubbles.push(bubble);
        });
        this.potLid = this.part(this.pot, new THREE.CylinderGeometry(1.52, 1.52, 0.18, 28), 0xd7d2c8, 1, 0, 0.86, 0);
        this.part(this.pot, new THREE.SphereGeometry(0.14, 12, 10), 0xb7b2a8, 1, 0, 1.04, 0);
        this.tag(this.potLid, '盖子', '馒头在盖住的容器里发起来，盖子不打开。');

        this.spoon = new THREE.Group();
        this.part(this.spoon, new THREE.BoxGeometry(0.08, 0.72, 0.08), 0xd9b48a, 1, 0, 0, 0);
        this.part(this.spoon, new THREE.SphereGeometry(0.16, 12, 10), 0xeed7b4, 1, 0, 0.42, 0.06);
        this.spoon.position.set(1.85, 0.85, 0.35);
        this.spoon.rotation.z = -0.55;
        this.spoon.visible = false;
        this.group.add(this.spoon);

        this.badge = this.part(this.group, new THREE.SphereGeometry(0.16, 16, 12), 0x3e9a62, 1, 1.65, 2.15, 0.2);
        this.badge.visible = false;
        this.badgeTag = this.makeSprite('已确认', 1.7, 0.42);
        this.badgeTag.visible = false;
        this.group.add(this.badgeTag);

        this.orb = this.part(this.group, new THREE.SphereGeometry(0.22, 16, 12), 0xf0a45c, 1, -2.45, 2.25, 0);
        this.tag(this.orb, '冷热', '这里只用“更暖和”或“更凉”来区分，不写温度数字。');
        this.tempTag = this.makeSprite('更暖和', 1.8, 0.42);
        this.tempTag.position.set(-2.45, 2.7, 0);
        this.group.add(this.tempTag);

        this.warnGroup = new THREE.Group();
        this.warnGroup.position.set(2.25, 0.55, 0.2);
        this.warnGroup.visible = false;
        this.group.add(this.warnGroup);
        this.dishBase = this.part(this.warnGroup, new THREE.CylinderGeometry(0.72, 0.72, 0.12, 24), 0xd5dee6, 1, -0.15, 0, 0);
        this.dishLid = this.part(this.warnGroup, new THREE.CylinderGeometry(0.76, 0.76, 0.1, 24), 0xc5d0da, 1, -0.15, 0.1, 0);
        this.dishLock = this.part(this.warnGroup, new THREE.BoxGeometry(0.9, 0.06, 0.12), 0x8d99a6, 1, -0.15, 0.16, 0);
        this.tag(this.dishLid, '未知培养皿', '盖子保持盖严。这不是食物，不能打开来品尝。');
        this.orange = this.part(this.warnGroup, new THREE.SphereGeometry(0.4, 20, 16), 0xf09028, 1, 0.95, 0.28, 0);
        this.part(this.warnGroup, new THREE.SphereGeometry(0.18, 12, 10), 0xd36a28, 1, 1.12, 0.36, 0.22);
        [[1.05, 0.48, 0.16], [0.78, 0.4, 0.22], [1.0, 0.22, 0.28], [0.86, 0.55, -0.05], [1.18, 0.3, 0.02]].forEach(([x, y, z]) => {
            this.part(this.warnGroup, new THREE.SphereGeometry(0.07, 8, 8), 0x8ea36a, 1, x, y, z);
        });
        this.tag(this.orange, '发霉的橘子', '裸放并且发霉的橘子不是酸奶、泡菜或馒头，不能当成这三种食物来品尝。');
    }

    setupUI() {
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.innerHTML = '';
        const caption = document.createElement('p');
        caption.id = this.id + '-caption';
        caption.style.cssText = 'margin:0 0 8px;line-height:1.45;';
        controls.appendChild(caption);
        this.caption = caption;
        const defs = [
            ['yogurt', '酸奶', () => this.select('yogurt')],
            ['pickle', '泡菜', () => this.select('pickle')],
            ['mantou', '馒头', () => this.select('mantou')],
            ['temp', '换成更凉', () => this.toggleTemp()],
            ['confirm', '请老师或家长确认', () => this.confirmOk()],
            ['taste', '品尝', () => this.taste()],
            ['unknown', '打开未知培养皿', () => this.showUnknown()]
        ];
        defs.forEach(([suffix, label, fn]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'control-btn';
            btn.id = this.id + '-' + suffix;
            btn.textContent = label;
            btn.style.margin = '4px';
            btn.addEventListener('click', fn);
            controls.appendChild(btn);
            this.btns[suffix] = btn;
        });
    }

    select(mode) {
        this.mode = mode;
        this.warning = false;
        this.progress = 0;
        this.confirmed = false;
        this.tasted = false;
        this.seal = 0;
        this.warnShake = 0;
        this.spoonShow = 0;
        this.apply();
        this.note();
    }

    toggleTemp() {
        this.warm = !this.warm;
        this.key.color.set(this.warm ? 0xfff1dc : 0xd7e6fb);
        this.fill.color.set(this.warm ? 0xffd2a8 : 0xc3d4ea);
        if (this.scene.background && this.scene.background.set) {
            this.scene.background.set(this.warm ? 0xf7f1e6 : 0xe5eef6);
        }
        this.orb.material.color.set(this.warm ? 0xf0a45c : 0x89b4d8);
        this.writeSprite(this.tempTag, this.warm ? '更暖和' : '更凉');
        if (this.btns.temp) this.btns.temp.textContent = this.warm ? '换成更凉' : '换成更暖和';
        this.apply();
        this.note();
    }

    confirmOk() {
        this.confirmed = true;
        this.apply();
        this.note();
    }

    taste() {
        if (!this.confirmed || this.warning) {
            this.seal = 1;
            this.tasted = false;
            this.apply();
            this.note();
            return;
        }
        this.tasted = true;
        this.apply();
        this.note();
    }

    showUnknown() {
        this.warning = true;
        this.tasted = false;
        this.spoonShow = 0;
        this.warnShake = 1;
        this.apply();
        this.note();
    }

    apply() {
        this.jar.visible = this.mode !== 'mantou';
        this.pot.visible = this.mode === 'mantou';
        this.food.position.x = this.warning ? -1.85 : 0;
        this.milk.visible = this.mode === 'yogurt';
        this.brine.visible = this.mode === 'pickle';
        this.vegGroup.visible = this.mode === 'pickle';
        this.rods.forEach((rod) => { rod.visible = this.mode !== 'mantou'; });
        this.yeasts.forEach((yeast) => { yeast.visible = this.mode === 'mantou'; });
        this.warnGroup.visible = this.warning;
        this.dishLid.position.y = 0.1;
        this.dishLock.position.y = 0.16;
        this.badge.visible = this.confirmed;
        this.badgeTag.visible = this.confirmed;
        if (this.confirmed) {
            const x = this.warning ? 2.2 : 1.7;
            this.badge.position.set(x, 2.15, 0.25);
            this.badgeTag.position.set(x, 2.55, 0.25);
            this.badge.material.color.set(this.warning ? 0xc4534a : 0x3e9a62);
            this.writeSprite(this.badgeTag, this.warning ? '不能品尝' : '已确认');
        }
        this.spoon.visible = this.spoonShow > 0.04 && !this.warning;
        this.spoon.position.x = this.mode === 'mantou' ? 2.05 : 1.85;
        Object.keys(this.btns).forEach((key) => {
            const on = key === this.mode || (key === 'unknown' && this.warning) || (key === 'confirm' && this.confirmed) || (key === 'taste' && this.tasted);
            this.btns[key].style.outline = on ? '2px solid #8a5a2a' : '';
        });
    }

    note() {
        const rule = '“只有老师或家长说这份食品可以食用，才可以品尝。”';
        const temp = this.warm
            ? '现在是“更暖和”，变化会快一些。'
            : '现在是“更凉”，变化会慢一些。';
        const limit = '冷热只说更暖和或更凉，不写数字，也不表示哪一个才是最好的温度。';
        let title = '发酵食品';
        let body = '可以用细菌或真菌制作发酵食品。乳酸菌是细菌，酵母菌是真菌。容器始终盖严。';
        if (this.warning) {
            title = '未知培养皿';
            body = '这个未知培养皿保持关闭，它不是可以品尝的食物。裸放、已经发霉的橘子也不属于酸奶、泡菜或馒头。';
        } else if (this.mode === 'yogurt') {
            title = '酸奶';
            body = '乳酸菌利用牛奶，把牛奶变成酸奶。罐子是盖住的。';
        } else if (this.mode === 'pickle') {
            title = '泡菜';
            body = '乳酸菌作用在蔬菜上，蔬菜会变酸。泡菜放在密闭容器里。';
        } else {
            title = '馒头';
            body = '酵母菌把葡萄糖变成酒精和二氧化碳，气体让面团鼓起来。酵母菌也可以用来酿酒。';
        }
        let gate = '品尝还没有进行。';
        if (!this.confirmed) gate = '还没有老师或家长确认，品尝不会发生。';
        else if (this.warning) gate = '即便点过确认，未知培养皿和发霉橘子仍然不能尝。';
        else if (!this.tasted) gate = '已经确认可以食用，这时才可以品尝。';
        else gate = '确认之后，旁边出现了勺子，表示现在可以品尝。盖子仍然盖着。';
        this.setInfo(title, body + temp + limit + gate + rule);
        if (this.caption) this.caption.textContent = rule;
    }

    setInfo(title, text) {
        const titleEl = document.getElementById('info-title');
        const bodyEl = document.getElementById('info-content');
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.textContent = text;
    }

    animate(time, delta) {
        this.clock += delta;
        if (this.seal > 0) this.seal = Math.max(0, this.seal - delta);
        if (this.warnShake > 0) this.warnShake = Math.max(0, this.warnShake - delta);
        if (!this.warning && this.progress < 1) {
            this.progress += delta * (this.warm ? 0.1 : 0.032);
            if (this.progress > 1) this.progress = 1;
        }
        const goal = this.tasted && !this.warning ? 1 : 0;
        this.spoonShow += (goal - this.spoonShow) * Math.min(1, delta * 3);
        if (this.mode === 'yogurt') {
            this.milk.material.color.copy(this.milkWarm).lerp(this.yogColor, this.progress);
            this.milk.material.opacity = 0.78 + this.progress * 0.2;
            this.milk.scale.y = 0.92 + this.progress * 0.12;
        }
        if (this.mode === 'pickle') {
            this.veg.forEach((veg) => {
                veg.material.color.copy(this.rawGreen).lerp(this.sourGreen, this.progress);
            });
            this.brine.material.opacity = 0.35 + this.progress * 0.25;
        }
        if (this.mode === 'mantou') {
            const grow = 0.58 + this.progress * 0.34;
            this.dough.scale.set(grow, grow * (0.78 + this.progress * 0.18), grow);
            this.dough.position.y = -0.3 + this.progress * 0.16;
        }
        const spin = this.warm ? 0.9 : 0.28;
        const bob = this.warm ? 1.3 : 0.4;
        this.rods.forEach((rod, index) => {
            const base = rod.userData.base;
            rod.position.y = base.y + Math.sin(this.clock * bob + index) * 0.04;
            rod.rotation.x += delta * spin;
        });
        this.yeasts.forEach((yeast, index) => {
            const base = yeast.userData.base;
            yeast.position.y = base.y + Math.sin(this.clock * bob + index) * 0.03;
        });
        this.bubbles.forEach((bubble) => {
            const speed = this.warm ? 0.55 : 0.18;
            const u = (this.clock * speed + bubble.userData.offset) % 1;
            bubble.position.set(bubble.userData.x, -0.2 + u * 0.95, bubble.userData.z);
            const on = this.mode === 'mantou' && !this.warning && this.progress > 0.08;
            bubble.visible = on;
            bubble.material.opacity = on ? (1 - u) * 0.7 : 0;
        });
        if (this.warning) {
            this.warnGroup.rotation.z = Math.sin(this.clock * 20) * 0.04 * this.warnShake;
        } else {
            this.warnGroup.rotation.z = 0;
        }
        this.spoon.position.y = 0.55 + this.spoonShow * 0.4;
        this.jarLid.material.color.copy(this.seal > 0 && this.mode !== 'mantou' ? this.lidHot : this.lidWood);
        this.potLid.material.color.copy(this.seal > 0 && this.mode === 'mantou' ? this.lidHot : this.potWood);
        if (this.warning && this.seal > 0) this.dishLid.material.color.set(0xd26a62);
        else this.dishLid.material.color.set(0xc5d0da);
        this.spoon.visible = this.spoonShow > 0.04 && !this.warning;
        this.orb.scale.setScalar(this.warm ? 1 : 0.72);
    }

    getInteractables() { return this.interactables; }

    dispose() {
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        const seen = new Set();
        if (this.group) {
            this.group.traverse((node) => {
                [node.geometry].concat(node.material || []).forEach((item) => {
                    if (!item || seen.has(item)) return;
                    seen.add(item);
                    if (item.map) item.map.dispose();
                    item.dispose();
                });
            });
            this.scene.remove(this.group);
            this.group = null;
        }
        this.interactables = [];
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
    }
};
