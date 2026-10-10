window.Grade7AmphibianScene = class Grade7AmphibianScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-amphibian';
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.made = [];
        this.anim = {};
        this.mode = 'frog';
        this.view = 'frog';
        this.t = 0;
        this.text = {
            tadpole: ['蝌蚪', '蝌蚪还带着尾巴，头侧有鳃，只能生活在水里，这一点和鱼一样离不开水。发育成成体以后，尾巴和鳃都会消失。'],
            frog: ['青蛙', '成蛙失去尾巴和鳃，长出四肢和肺，可以到陆地上生活。稻田、池塘和小溪边都能见到它。眼睛又大又圆，眼后各有一块鼓膜，前端有一对鼻孔。前肢短，用来支撑身体；后肢长，趾间有蹼，便于跳跃和游泳。皮肤裸露，表面有黏液。'],
            skin: ['皮肤也能换气', '青蛙的皮肤裸露、湿润，能分泌黏液。皮肤里的毛细血管也可以交换气体，用来补比较简单的肺。'],
            lung: ['简单的肺', '青蛙用肺呼吸，肺的结构比较简单，所以还要靠湿润皮肤帮忙交换气体。'],
            traits: ['两栖动物的共同特点', '幼体在水中生活，用鳃呼吸。成体大多在陆地上生活，也能游泳，用肺呼吸，皮肤可以辅助呼吸。'],
            toad: ['蟾蜍', '蟾蜍眼睛后方有一对较大的毒腺，分泌物可以制成药材蟾酥。'],
            giant: ['大鲵', '大鲵终生保留着尾巴，是受保护的两栖动物。'],
            newt: ['蝾螈', '蝾螈也终生有尾。它生活在清凉的静水里，有时会到陆地上。'],
            lizard: ['蜥蜴', '蜥蜴是真正适于陆地生活的爬行动物。皮肤干燥，身体贴着地面爬行。肺比青蛙更发达，气体交换只靠肺完成。'],
            egg: ['陆地上的卵', '多数爬行动物把卵产在陆地上，卵壳比较坚韧。'],
            turtle: ['龟', '龟也是爬行动物，和蜥蜴同在这一类里。'],
            gator: ['扬子鳄', '扬子鳄也是爬行动物。'],
            snake: ['蛇为什么仍是爬行动物？', '蛇没有四肢。课本提出这个问题，是因为有没有四肢并不是划分标准。请回到蜥蜴：皮肤干燥、用肺呼吸，卵产在陆地而且卵壳坚韧。']
        };
    }

    init() {
        this.camera.position.set(0.35, 2.2, 6.3);
        this.camera.lookAt(0, 0.6, 0);
        this.scene.background = new THREE.Color(0xd7ebc8);
        this.addLight(new THREE.AmbientLight(0xffffff, 0.62));
        const sun = new THREE.DirectionalLight(0xfff3dd, 1.08);
        sun.position.set(5, 8, 4);
        this.addLight(sun);
        const fill = new THREE.DirectionalLight(0xb9d2ff, 0.38);
        fill.position.set(-5, 3, -2);
        this.addLight(fill);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.setupUI();
        this.show('frog');
    }

    addLight(light) {
        this.scene.add(light);
        this.lights.push(light);
    }

    part(parent, geo, color, x, y, z, o) {
        o = o || {};
        const op = o.op == null ? 1 : o.op;
        const mat = new THREE.MeshStandardMaterial({
            color: color, roughness: o.rough == null ? 0.55 : o.rough, metalness: 0.03,
            transparent: op < 1, opacity: op, depthWrite: op > 0.85, side: o.side || THREE.FrontSide,
            emissive: new THREE.Color(o.glow || 0x000000), emissiveIntensity: o.glow ? 0.35 : 0
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.userData.base = o.scale ? o.scale.slice() : [1, 1, 1];
        mesh.scale.set(mesh.userData.base[0], mesh.userData.base[1], mesh.userData.base[2]);
        if (o.rot) mesh.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
        parent.add(mesh);
        this.made.push(mesh);
        if (o.name) {
            mesh.userData.name = o.name;
            mesh.userData.description = o.desc || o.name;
            this.interactables.push(mesh);
        }
        return mesh;
    }

    note(text, x, y, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 160;
        const pen = canvas.getContext('2d');
        pen.fillStyle = 'rgba(255,252,246,0.94)';
        pen.fillRect(0, 0, 1024, 160);
        pen.strokeStyle = '#1f6b4a';
        pen.lineWidth = 10;
        pen.strokeRect(8, 8, 1008, 144);
        pen.fillStyle = '#1c3328';
        pen.font = '54px sans-serif';
        pen.fillText(text, 36, 100);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.15, 0.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        mesh.position.set(x, y, z);
        this.group.add(mesh);
        this.made.push(mesh);
        this.anim.labels = this.anim.labels || [];
        this.anim.labels.push(mesh);
    }

    wipe() {
        this.made.forEach((mesh) => {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (mesh.material.map) mesh.material.map.dispose();
                mesh.material.dispose();
            }
        });
        this.made = [];
        this.interactables.splice(0);
        this.anim = {};
        if (!this.group) return;
        while (this.group.children.length) this.group.remove(this.group.children[0]);
    }

    setInfo(title, text) {
        const titleNode = document.getElementById('info-title');
        const body = document.getElementById('info-content');
        if (titleNode) titleNode.textContent = title;
        if (body) body.textContent = text;
    }

    setupUI() {
        const box = document.getElementById('scene-controls');
        if (!box) return;
        box.innerHTML = '';
        const items = [
            ['mode-frog', '青蛙', () => this.setMode('frog')], ['mode-lizard', '蜥蜴', () => this.setMode('lizard')],
            ['tadpole', '蝌蚪', () => this.show('tadpole')], ['frog', '成蛙', () => this.show('frog')],
            ['skin', '皮肤呼吸', () => this.show('skin')], ['lung', '简单的肺', () => this.show('lung')],
            ['traits', '两栖类特征', () => this.show('traits')], ['toad', '蟾蜍', () => this.show('toad')],
            ['giant', '大鲵', () => this.show('giant')], ['newt', '蝾螈', () => this.show('newt')],
            ['lizard', '蜥蜴', () => this.show('lizard')], ['egg', '陆地的卵', () => this.show('egg')],
            ['turtle', '龟', () => this.show('turtle')], ['gator', '扬子鳄', () => this.show('gator')],
            ['snake', '蛇', () => this.show('snake')]
        ];
        items.forEach((item) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.id = this.id + '-' + item[0];
            button.className = 'control-btn';
            button.textContent = item[1];
            button.addEventListener('click', item[2]);
            box.appendChild(button);
        });
    }

    setMode(mode) { this.show(mode === 'lizard' ? 'lizard' : 'frog'); }

    applyMode() {
        ['tadpole', 'frog', 'skin', 'lung', 'traits', 'toad', 'giant', 'newt'].forEach((id) => {
            const button = document.getElementById(this.id + '-' + id);
            if (button) button.style.display = this.mode === 'frog' ? '' : 'none';
        });
        ['lizard', 'egg', 'turtle', 'gator', 'snake'].forEach((id) => {
            const button = document.getElementById(this.id + '-' + id);
            if (button) button.style.display = this.mode === 'lizard' ? '' : 'none';
        });
    }
    mark(view) {
        const box = document.getElementById('scene-controls');
        if (!box) return;
        Array.prototype.forEach.call(box.children, (button) => {
            const on = button.id === this.id + '-' + view || button.id === this.id + '-mode-' + this.mode;
            button.style.boxShadow = on ? 'inset 0 0 0 2px #1f6b4a' : '';
        });
    }
    show(view) {
        this.view = view;
        this.mode = { lizard: 1, egg: 1, turtle: 1, gator: 1, snake: 1 }[view] ? 'lizard' : 'frog';
        this.applyMode();
        this.wipe();
        this.mark(view);
        this.setInfo(this.text[view][0], this.text[view][1]);
        if (view === 'tadpole') this.buildTadpole(0, 0.35, 1);
        else if (view === 'frog') this.buildFrog({ hop: true });
        else if (view === 'skin') this.buildFrog({ skin: true, hop: true });
        else if (view === 'lung') this.buildFrog({ lungs: true });
        else if (view === 'traits') this.buildTraits();
        else if (view === 'toad') this.buildFrog({ toad: true });
        else if (view === 'giant') this.buildTailed({ color: 0x6d5346, name: '大鲵', desc: '大鲵终生保留尾巴，是受保护的两栖动物。', tail: '尾巴终生不消失。', scale: 1.15, stage: 'moist' });
        else if (view === 'newt') this.buildNewt();
        else if (view === 'lizard') this.buildLizard();
        else if (view === 'egg') this.buildEgg();
        else if (view === 'turtle') this.buildTurtle();
        else if (view === 'gator') this.buildGator();
        else this.buildSnake();
    }

    stage(type) {
        const bg = { water: 0xb7d6ec, home: 0xd7ebc8, dry: 0xf0e4cc, pool: 0xd4e6ea, moist: 0xe4eee0 };
        const ground = { water: 0x7eaf86, home: 0xc6d7a2, dry: 0xd9c4a0, pool: 0xc9d8b4, moist: 0xc5d4ae };
        this.scene.background = new THREE.Color(bg[type]);
        this.part(this.group, new THREE.CircleGeometry(4.5, 40), ground[type], 0, 0, 0, { rot: [-Math.PI / 2, 0, 0] });
        if (type === 'water') this.part(this.group, new THREE.CircleGeometry(2.5, 32), 0x3e94c8, 0, 0.04, 0, { rot: [-Math.PI / 2, 0, 0], op: 0.7, rough: 0.06, name: '水', desc: '蝌蚪只能生活在水中。' });
        if (type === 'home') {
            this.part(this.group, new THREE.CircleGeometry(1.25, 28), 0x3f90c6, -1.35, 0.04, 0.35, { rot: [-Math.PI / 2, 0, 0], op: 0.75, name: '池塘', desc: '成蛙也生活在稻田、池塘和小溪一带。' });
            this.part(this.group, new THREE.BoxGeometry(0.38, 0.03, 2.3), 0x49a6d6, 1.75, 0.04, 0, { name: '小溪', desc: '稻田、池塘和小溪边都能见到成蛙。' });
            for (let i = 0; i < 6; i++) this.part(this.group, new THREE.ConeGeometry(0.05, 0.26, 5), 0x2f8a3a, 0.45 + (i % 3) * 0.28, 0.13, -1.05 - Math.floor(i / 3) * 0.3);
        }
        if (type === 'pool') {
            this.part(this.group, new THREE.CircleGeometry(1.15, 28), 0x67b4cc, -0.7, 0.04, 0.1, { rot: [-Math.PI / 2, 0, 0], op: 0.72, name: '静水', desc: '蝾螈生活在清凉的静水中。' });
            this.part(this.group, new THREE.DodecahedronGeometry(0.32), 0x9a9084, 1.15, 0.24, 0.1, { name: '岸上', desc: '蝾螈有时会离开静水，到陆地上。' });
        }
    }

    lungsAt(parent, radius, x, y, name, desc) {
        this.anim.lungs = this.anim.lungs || [];
        [-1, 1].forEach((side) => {
            this.anim.lungs.push(this.part(parent, new THREE.SphereGeometry(radius, 12, 10), 0xf0a3b4, x + side * radius * 1.35, y, 0, { name: name, desc: desc }));
        });
    }

    frogOn(parent, o) {
        const color = o.toad ? 0x8d7042 : 0x3d9846;
        const rough = o.toad ? 0.62 : 0.22;
        const bodyDesc = o.lungs ? '身体画成半透明，方便看见里面比较简单的肺。' : (o.toad ? '蟾蜍眼后有大的毒腺，分泌物可制成蟾酥。' : '成蛙没有尾巴和鳃，皮肤裸露，还能分泌黏液。');
        this.part(parent, new THREE.SphereGeometry(0.48, 20, 16), color, 0, 0.5, 0, { scale: [1.2, 0.78, 1.4], rough: rough, op: o.lungs ? 0.28 : 1, name: o.toad ? '蟾蜍' : '青蛙', desc: bodyDesc });
        this.part(parent, new THREE.SphereGeometry(0.32, 16, 12), color, 0, 0.7, 0.42, { scale: [1.15, 0.82, 0.95], rough: rough });
        [-1, 1].forEach((side) => {
            const eye = this.part(parent, new THREE.SphereGeometry(0.15, 14, 12), 0xf7f4ea, 0.18 * side, 0.96, 0.52, { name: '眼睛', desc: '眼睛又大又圆。' });
            this.part(eye, new THREE.SphereGeometry(0.06, 10, 8), 0x1a1a1a, 0, 0.02, 0.11);
            if (o.toad) this.part(parent, new THREE.SphereGeometry(0.13, 12, 10), 0xd2a64a, 0.38 * side, 0.78, 0.28, { scale: [1, 0.72, 1.35], name: '毒腺', desc: '眼后方的毒腺较大，分泌物是药材蟾酥的来源。' });
            else this.part(parent, new THREE.CircleGeometry(0.09, 14), 0x8d5a34, 0.36 * side, 0.74, 0.36, { rot: [0, side * -1.15, 0], name: '鼓膜', desc: '每只眼睛的后方都有一块鼓膜。' });
            this.part(parent, new THREE.SphereGeometry(0.03, 8, 8), 0x243024, 0.07 * side, 0.74, 0.7, { name: '鼻孔', desc: '头部前端有一对鼻孔。' });
            const arm = new THREE.Group();
            arm.position.set(0.36 * side, 0.44, 0.28);
            arm.rotation.set(0.65, 0, side * -0.35);
            parent.add(arm);
            this.part(arm, new THREE.CylinderGeometry(0.045, 0.038, 0.3, 8), color, 0, -0.15, 0, { rough: rough, name: '前肢', desc: '前肢短，主要用来支撑身体。' });
            const hip = new THREE.Group();
            hip.position.set(0.28 * side, 0.4, -0.22);
            hip.rotation.set(-0.35, 0, side * -0.85);
            parent.add(hip);
            this.anim.legs = this.anim.legs || [];
            this.anim.legs.push(hip);
            this.part(hip, new THREE.CylinderGeometry(0.075, 0.055, 0.62, 8), color, 0, -0.31, 0, { rough: rough, name: '后肢', desc: '后肢长，趾间有蹼，既能跳跃，也能游泳。' });
            this.part(hip, new THREE.BoxGeometry(0.2, 0.025, 0.18), 0x2f7a38, 0, -0.62, 0.06, { name: '蹼', desc: '后肢趾间的蹼便于划水。' });
        });
        if (o.skin) {
            for (let i = 0; i < 6; i++) this.part(parent, new THREE.TorusGeometry(0.1, 0.012, 6, 12), 0xd64555, -0.18 + (i % 3) * 0.16, 0.78, -0.08 + Math.floor(i / 3) * 0.18, { rot: [0.7, i * 0.5, 0.3], name: '毛细血管', desc: '湿润皮肤里的毛细血管也能交换气体。皮肤本身裸露，并有黏液。' });
        }
        if (o.lungs) this.lungsAt(parent, 0.14, 0, 0.58, '肺', '青蛙的肺结构比较简单，皮肤也会参加气体交换。');
        if (o.toad) for (let i = 0; i < 7; i++) this.part(parent, new THREE.SphereGeometry(0.045, 6, 6), 0x6e582f, -0.22 + (i % 4) * 0.14, 0.74, -0.16 + Math.floor(i / 4) * 0.18);
        if (o.hop) this.anim.hop = parent;
    }

    buildFrog(o) {
        this.stage(o.toad ? 'moist' : 'home');
        const root = new THREE.Group();
        this.group.add(root);
        this.frogOn(root, o);
        if (o.skin) this.note('湿皮肤帮助呼吸', 0, 1.7, 0);
        if (o.lungs) this.note('肺比较简单', 0, 1.7, 0);
        if (o.toad) this.note('眼后毒腺可入药', 0, 1.7, 0);
    }

    buildTadpole(x, z, s) {
        this.stage('water');
        const root = new THREE.Group();
        root.position.set(x, 0.08, z);
        root.scale.setScalar(s);
        this.group.add(root);
        this.anim.bob = root;
        this.part(root, new THREE.SphereGeometry(0.3, 16, 12), 0x73b15a, 0, 0.32, 0.15, { scale: [0.8, 0.72, 1.25], name: '蝌蚪', desc: '蝌蚪有尾、有鳃，只能生活在水中，和鱼一样离不开水。' });
        const tail = new THREE.Group();
        tail.position.set(0, 0.3, -0.12);
        root.add(tail);
        this.anim.tail = tail;
        this.part(tail, new THREE.SphereGeometry(0.26, 12, 10), 0x8bc46e, 0, 0, -0.42, { scale: [0.28, 0.85, 1.55], name: '尾', desc: '蝌蚪的尾巴以后会消失。' });
        this.anim.gills = [-1, 1].map((side) => this.part(root, new THREE.SphereGeometry(0.07, 10, 8), 0xd36b6b, 0.2 * side, 0.36, 0.28, { scale: [0.65, 1.25, 0.75], name: '鳃', desc: '蝌蚪用鳃呼吸，还不能离开水。成体后鳃会消失。' }));
        this.note('有尾有鳃，只在水里', x, 1.35, z);
    }

    buildTraits() {
        this.stage('home');
        const young = new THREE.Group();
        young.position.set(-1.35, 0.08, 0.35);
        this.group.add(young);
        this.anim.bob = young;
        this.part(young, new THREE.SphereGeometry(0.24, 14, 12), 0x73b15a, 0, 0.28, 0, { scale: [0.75, 0.7, 1.2], name: '幼体', desc: '两栖动物的幼体在水中生活，用鳃呼吸。' });
        const tail = new THREE.Group();
        tail.position.set(0, 0.26, -0.18);
        young.add(tail);
        this.anim.tail = tail;
        this.part(tail, new THREE.SphereGeometry(0.2, 10, 8), 0x8bc46e, 0, 0, -0.28, { scale: [0.3, 0.7, 1.3], name: '尾', desc: '幼体带着尾巴，在水里生活。' });
        [-1, 1].forEach((side) => this.part(young, new THREE.SphereGeometry(0.05, 8, 8), 0xd36b6b, 0.14 * side, 0.3, 0.12, { name: '鳃', desc: '幼体用鳃呼吸。' }));
        const adult = new THREE.Group();
        adult.position.set(1.15, 0, 0);
        adult.scale.setScalar(0.82);
        this.group.add(adult);
        this.frogOn(adult, { hop: true });
        this.note('幼体在水中用鳃', -1.35, 1.25, 0.2);
        this.note('成体陆地主，能游泳', 1.15, 1.7, 0);
    }

    buildTailed(o) {
        this.stage(o.stage);
        const root = new THREE.Group();
        root.scale.setScalar(o.scale || 1);
        this.group.add(root);
        this.part(root, new THREE.SphereGeometry(0.5, 16, 12), o.color, 0, 0.32, 0.05, { scale: [0.58, 0.36, 1.4], rough: 0.74, name: o.name, desc: o.desc });
        this.part(root, new THREE.SphereGeometry(0.24, 14, 10), o.color, 0, 0.36, 0.7, { scale: [1.2, 0.55, 0.8], rough: 0.74 });
        const tail = new THREE.Group();
        tail.position.set(0, 0.3, -0.6);
        root.add(tail);
        this.anim.tail = tail;
        this.part(tail, new THREE.SphereGeometry(0.38, 12, 10), o.color, 0, 0, -0.42, { scale: [0.26, 0.5, 1.35], rough: 0.74, name: '尾', desc: o.tail });
        [[-1, 0.28], [1, 0.28], [-1, -0.2], [1, -0.2]].forEach((spot) => this.part(root, new THREE.CylinderGeometry(0.04, 0.032, 0.2, 6), o.color, 0.24 * spot[0], 0.16, spot[1], { rot: [0, 0, spot[0] * Math.PI / 2], rough: 0.74 }));
        [-1, 1].forEach((side) => this.part(root, new THREE.SphereGeometry(0.035, 8, 8), 0x221c18, 0.1 * side, 0.44, 0.86));
        this.note(o.name + '终生有尾', 0, 1.25, 0);
        return root;
    }

    buildNewt() {
        this.anim.newt = this.buildTailed({ color: 0xc47a32, name: '蝾螈', desc: '蝾螈终生有尾，生活在清凉的静水里，有时也会上岸。', tail: '蝾螈的尾巴会一直留着。', scale: 0.62, stage: 'pool' });
    }

    hips(root, spots, color, len) {
        this.anim.legs = [];
        spots.forEach((spot) => {
            const hip = new THREE.Group();
            hip.position.set(spot[0], spot[1], spot[2]);
            root.add(hip);
            this.anim.legs.push(hip);
            this.part(hip, new THREE.CylinderGeometry(0.04, 0.032, len, 6), color, spot[0] > 0 ? 0.1 : -0.1, -len / 2, 0, { rot: [0.45, 0, spot[0] > 0 ? 0.8 : -0.8], rough: 0.9 });
        });
    }

    buildLizard() {
        this.stage('dry');
        const root = new THREE.Group();
        this.group.add(root);
        this.anim.crawl = root;
        const color = 0x8d9a46;
        this.part(root, new THREE.SphereGeometry(0.38, 16, 12), color, 0, 0.28, 0, { scale: [0.72, 0.42, 1.65], rough: 0.96, name: '皮肤', desc: '蜥蜴皮肤干燥，身体贴着地面爬。气体交换只靠肺，不靠皮肤。' });
        this.part(root, new THREE.SphereGeometry(0.18, 12, 10), color, 0, 0.32, 0.58, { scale: [0.8, 0.65, 1.05], rough: 0.96 });
        const tail = new THREE.Group();
        tail.position.set(0, 0.26, -0.62);
        root.add(tail);
        this.anim.tail = tail;
        this.part(tail, new THREE.CylinderGeometry(0.055, 0.018, 1.05, 8), color, 0, 0, -0.5, { rot: [Math.PI / 2, 0, 0], rough: 0.96 });
        this.hips(root, [[-0.2, 0.22, 0.32], [0.2, 0.22, 0.32], [-0.2, 0.22, -0.28], [0.2, 0.22, -0.28]], color, 0.24);
        this.lungsAt(this.group, 0.11, -1.65, 1.2, '青蛙的肺', '对照：青蛙的肺较小、较简单，皮肤还要帮忙。');
        this.lungsAt(this.group, 0.22, 1.6, 1.28, '蜥蜴的肺', '蜥蜴的肺比青蛙更发达，气体交换只靠肺完成。');
        this.note('干燥皮肤，只靠肺', 0, 1.15, 0.4);
    }

    buildEgg() {
        this.stage('dry');
        [-0.25, 0.28].forEach((x, index) => this.part(this.group, new THREE.SphereGeometry(0.24, 16, 12), index ? 0xf7f1e6 : 0xe7d7bf, x, 0.28, 0, { scale: [0.78, 1.12, 0.78], rough: 0.8, name: '卵', desc: '多数爬行动物把卵产在陆地上，卵壳比较坚韧。' }));
        this.note('陆地产卵，卵壳坚韧', 0, 1.2, 0);
    }

    buildTurtle() {
        this.stage('dry');
        const root = new THREE.Group();
        this.group.add(root);
        this.anim.crawl = root;
        this.part(root, new THREE.SphereGeometry(0.5, 16, 12), 0x3f7a45, 0, 0.48, 0, { scale: [1.15, 0.62, 1.35], name: '龟', desc: '龟是爬行动物。' });
        this.part(root, new THREE.SphereGeometry(0.42, 14, 12), 0xe7d7a8, 0, 0.36, 0, { scale: [1, 0.4, 1.15] });
        this.part(root, new THREE.SphereGeometry(0.14, 12, 10), 0x6a8f4e, 0, 0.4, 0.62);
        this.hips(root, [[-0.42, 0.28, 0.2], [0.42, 0.28, 0.2], [-0.42, 0.28, -0.25], [0.42, 0.28, -0.25]], 0x6a8f4e, 0.2);
        this.note('龟也是爬行动物', 0, 1.45, 0);
    }

    buildGator() {
        this.stage('dry');
        const root = new THREE.Group();
        this.group.add(root);
        this.anim.crawl = root;
        const color = 0x3e5c3a;
        this.part(root, new THREE.SphereGeometry(0.42, 16, 12), color, 0, 0.32, 0, { scale: [0.85, 0.48, 1.8], rough: 0.82, name: '扬子鳄', desc: '扬子鳄是爬行动物。' });
        this.part(root, new THREE.SphereGeometry(0.2, 12, 10), color, 0, 0.36, 0.78, { scale: [0.7, 0.55, 1.4], rough: 0.82 });
        const tail = new THREE.Group();
        tail.position.set(0, 0.3, -0.75);
        root.add(tail);
        this.anim.tail = tail;
        this.part(tail, new THREE.CylinderGeometry(0.1, 0.03, 1.1, 8), color, 0, 0, -0.5, { rot: [Math.PI / 2, 0, 0], rough: 0.82 });
        this.hips(root, [[-0.28, 0.24, 0.35], [0.28, 0.24, 0.35], [-0.28, 0.24, -0.3], [0.28, 0.24, -0.3]], color, 0.26);
        this.note('扬子鳄也属爬行类', 0, 1.25, 0);
    }

    buildSnake() {
        this.stage('dry');
        this.anim.snake = [];
        for (let i = 0; i < 16; i++) {
            const mesh = this.part(this.group, new THREE.SphereGeometry(Math.max(0.18 - i * 0.006, 0.07), 12, 10), 0xc4a56e, 0, 0.22, 1.55 - i * 0.22, {
                scale: [1, 0.8, 1], name: i === 0 ? '蛇' : null,
                desc: '蛇没有四肢。判断它是不是爬行动物，并不看有没有四肢，而要回到蜥蜴的干燥皮肤、肺和陆地卵。'
            });
            this.anim.snake.push(mesh);
            if (i === 0) {
                this.part(mesh, new THREE.SphereGeometry(0.035, 8, 8), 0x222222, 0.08, 0.08, 0.1);
                this.part(mesh, new THREE.SphereGeometry(0.035, 8, 8), 0x222222, -0.08, 0.08, 0.1);
            }
        }
        this.note('没有四肢，仍要追问', 0, 1.15, 0);
    }

    animate(time, delta) {
        this.t += delta;
        const t = this.t;
        const anim = this.anim;
        if (anim.tail) anim.tail.rotation.y = Math.sin(t * 4.5) * 0.45;
        if (anim.bob) anim.bob.position.y = 0.08 + Math.sin(t * 2) * 0.05;
        (anim.gills || []).forEach((gill, index) => {
            const base = gill.userData.base;
            gill.scale.set(base[0], base[1] * (1 + Math.sin(t * 6 + index) * 0.16), base[2]);
        });
        if (anim.hop) {
            const hop = Math.pow(Math.max(0, Math.sin(t * 2.3)), 2);
            anim.hop.position.y = hop * 0.42;
            (anim.legs || []).forEach((leg) => { leg.rotation.x = -0.35 + hop * 0.9; });
        }
        (anim.lungs || []).forEach((lung, index) => {
            const base = lung.userData.base;
            const k = 1 + Math.sin(t * 2.2 + index) * 0.06;
            lung.scale.set(base[0] * k, base[1] * k, base[2] * k);
        });
        if (anim.crawl) {
            anim.crawl.position.z = Math.sin(t * 0.8) * 0.12;
            (anim.legs || []).forEach((leg, index) => { leg.rotation.x = Math.sin(t * 4 + index * Math.PI / 2) * 0.45; });
        }
        (anim.snake || []).forEach((seg, index) => { seg.position.x = Math.sin(t * 3 + index * 0.48) * 0.36; });
        if (anim.newt) {
            const u = (Math.sin(t * 0.55) + 1) / 2;
            anim.newt.position.x = -0.7 + u * 1.7;
            anim.newt.position.z = u > 0.62 ? 0.15 : 0.05;
        }
        (anim.labels || []).forEach((label) => label.lookAt(this.camera.position));
    }

    getInteractables() { return this.interactables; }

    dispose() {
        this.wipe();
        this.lights.forEach((light) => {
            this.scene.remove(light);
            if (light.dispose) light.dispose();
        });
        this.lights = [];
        if (this.group) {
            this.scene.remove(this.group);
            this.group = null;
        }
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
        this.interactables.splice(0);
    }
};
