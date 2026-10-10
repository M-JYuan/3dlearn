window.Grade7BirdMammalScene = class Grade7BirdMammalScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-bird-mammal';
        this.group = null;
        this.lights = [];
        this.interactables = [];
        this.made = [];
        this.anim = {};
        this.mode = 'bird';
        this.view = 'bird';
        this.t = 0;
        this.text = {
            bird: ['流线型的身体', '鸟的身体呈流线型。翅膀上有成排的大型羽毛，嘴是喙，口中没有牙齿，体温保持恒定。'],
            feather: ['翅膀上的羽毛', '翅膀上有一排排大型羽毛。这些羽毛彼此重叠，但并没有密合死，中间留着缝隙。'],
            beak: ['喙', '鸟有喙，口里没有牙齿。'],
            air: ['气囊与肺', '气囊和肺是相通的。吸气时，一小部分空气在肺里交换气体，大部分进入气囊。呼气时，气囊里的空气再经过肺，所以吸气和呼气时肺都能得到新鲜空气。'],
            btemp: ['恒温与变温', '鱼、两栖动物和爬行动物的体温会随环境改变，是变温动物。鸟的体温保持稳定，是恒温动物。鱼用鳃呼吸。'],
            egg: ['鸟卵', '鸟类会产卵。'],
            btraits: ['鸟的主要特点', '身体呈流线型，翅膀有成排大型羽毛，有喙而无齿，体温恒定。气囊与肺相通，吸气和呼气时肺都能得到新鲜空气。鸟会产卵。'],
            mammal: ['哺乳动物', '哺乳动物体表有毛，体温恒定。多数胚胎在母体内发育，出生后由母体喂奶。牙齿有分化，神经系统和感觉器官发达。'],
            hair: ['体表的毛', '哺乳动物体表有毛。少数水生种类例外，例如鲸，毛已经退化，但鲸仍然是哺乳动物。'],
            mtemp: ['恒定的体温', '哺乳动物体温恒定。这一点和鸟相同，也和鱼、两栖动物、爬行动物这些变温动物不同。'],
            milk: ['在母体内发育并吃母乳', '多数哺乳动物的胚胎在母体内发育，生下来就是幼体。母体用乳汁喂养，幼体更有机会活下来。'],
            rabbit: ['兔的牙齿', '兔有门齿和臼齿。这样的分化和吃植物相适应。'],
            wolf: ['狼的牙齿', '狼有门齿、犬齿和臼齿。较长的犬齿和捕捉猎物相适应。'],
            nerve: ['神经系统和感觉器官', '哺乳动物的神经系统很发达，感觉器官也很发达。'],
            mtraits: ['哺乳动物的主要特征', '体表被毛，体温恒定，多数在母体内发育后生下幼体，并用乳汁喂养。牙齿有门齿、犬齿、臼齿这样的分化。'],
            whale: ['鲸', '鲸的毛退化了，但它仍然是哺乳动物，体温恒定，幼体在母体内发育后出生，并吃母乳。'],
            leopard: ['雪豹', '雪豹是哺乳动物。'],
            elephant: ['亚洲象', '亚洲象是哺乳动物。'],
            monkey: ['猕猴', '猕猴是哺乳动物。'],
            porpoise: ['长江江豚', '长江江豚是哺乳动物。'],
            bat: ['蝙蝠', '蝙蝠是哺乳动物，体表有毛。']
        };
    }

    init() {
        this.camera.position.set(0.4, 2.05, 6.6);
        this.camera.lookAt(0, 0.9, 0);
        this.scene.background = new THREE.Color(0xe7eef6);
        this.addLight(new THREE.AmbientLight(0xffffff, 0.64));
        const sun = new THREE.DirectionalLight(0xfff6e8, 1.05);
        sun.position.set(4, 8, 5);
        this.addLight(sun);
        const fill = new THREE.DirectionalLight(0xc5d7ff, 0.36);
        fill.position.set(-5, 3, -3);
        this.addLight(fill);
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.setupUI();
        this.show('bird');
    }

    addLight(light) { this.scene.add(light); this.lights.push(light); }

    part(parent, geo, color, x, y, z, o) {
        o = o || {};
        const op = o.op == null ? 1 : o.op;
        const mat = new THREE.MeshStandardMaterial({
            color: color, roughness: o.rough == null ? 0.55 : o.rough, metalness: 0.03,
            transparent: op < 1, opacity: op, depthWrite: op > 0.85, side: o.side || THREE.FrontSide,
            emissive: new THREE.Color(o.glow || 0x000000), emissiveIntensity: o.glow ? 0.4 : 0
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
        canvas.width = 1024; canvas.height = 160;
        const pen = canvas.getContext('2d');
        pen.fillStyle = 'rgba(255,252,246,0.94)'; pen.fillRect(0, 0, 1024, 160);
        pen.strokeStyle = '#24537a'; pen.lineWidth = 10; pen.strokeRect(8, 8, 1008, 144);
        pen.fillStyle = '#1b2c3a'; pen.font = '52px sans-serif'; pen.fillText(text, 36, 100);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        mesh.position.set(x, y, z);
        this.group.add(mesh); this.made.push(mesh);
        this.anim.labels = this.anim.labels || []; this.anim.labels.push(mesh);
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
            ['mode-bird', '鸟类', () => this.setMode('bird')], ['mode-mammal', '哺乳类', () => this.setMode('mammal')],
            ['bird', '流线型', () => this.show('bird')], ['feather', '羽毛', () => this.show('feather')],
            ['beak', '喙', () => this.show('beak')], ['air', '气囊', () => this.show('air')],
            ['btemp', '恒温', () => this.show('btemp')], ['egg', '鸟卵', () => this.show('egg')],
            ['btraits', '鸟类特征', () => this.show('btraits')],
            ['mammal', '哺乳动物', () => this.show('mammal')], ['hair', '体毛', () => this.show('hair')],
            ['mtemp', '恒温', () => this.show('mtemp')], ['milk', '胎生哺乳', () => this.show('milk')],
            ['rabbit', '兔的牙齿', () => this.show('rabbit')], ['wolf', '狼的牙齿', () => this.show('wolf')],
            ['nerve', '神经感觉', () => this.show('nerve')], ['mtraits', '主要特征', () => this.show('mtraits')],
            ['whale', '鲸', () => this.show('whale')], ['leopard', '雪豹', () => this.show('leopard')],
            ['elephant', '亚洲象', () => this.show('elephant')], ['monkey', '猕猴', () => this.show('monkey')],
            ['porpoise', '长江江豚', () => this.show('porpoise')], ['bat', '蝙蝠', () => this.show('bat')]
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

    setMode(mode) { this.show(mode === 'mammal' ? 'mammal' : 'bird'); }

    applyMode() {
        ['bird', 'feather', 'beak', 'air', 'btemp', 'egg', 'btraits'].forEach((id) => {
            const button = document.getElementById(this.id + '-' + id);
            if (button) button.style.display = this.mode === 'bird' ? '' : 'none';
        });
        ['mammal', 'hair', 'mtemp', 'milk', 'rabbit', 'wolf', 'nerve', 'mtraits', 'whale', 'leopard', 'elephant', 'monkey', 'porpoise', 'bat'].forEach((id) => {
            const button = document.getElementById(this.id + '-' + id);
            if (button) button.style.display = this.mode === 'mammal' ? '' : 'none';
        });
    }

    mark(view) {
        const box = document.getElementById('scene-controls');
        if (!box) return;
        Array.prototype.forEach.call(box.children, (button) => {
            const on = button.id === this.id + '-' + view || button.id === this.id + '-mode-' + this.mode;
            button.style.boxShadow = on ? 'inset 0 0 0 2px #24537a' : '';
        });
    }

    show(view) {
        const mammal = { mammal: 1, hair: 1, mtemp: 1, milk: 1, rabbit: 1, wolf: 1, nerve: 1, mtraits: 1, whale: 1, leopard: 1, elephant: 1, monkey: 1, porpoise: 1, bat: 1 };
        this.view = view;
        this.mode = mammal[view] ? 'mammal' : 'bird';
        this.applyMode();
        this.wipe();
        this.mark(view);
        this.setInfo(this.text[view][0], this.text[view][1]);
        if (view === 'bird') { this.ground(0xe7eef6); this.bird({}); this.note('身体呈流线型', 0, 1.85, 0); }
        else if (view === 'feather') { this.ground(0xe7eef6); this.bird({ span: 1.45, desc: '翅膀上的大型羽毛互相重叠，中间留有缝隙。' }); this.note('重叠，但仍有缝', 0, 1.95, 0); }
        else if (view === 'beak') { this.ground(0xe7eef6); this.bird({ headOnly: true, open: true, scale: 1.55 }); this.note('有喙，没有牙齿', 0, 1.95, 0); }
        else if (view === 'air') this.buildAir();
        else if (view === 'btemp') this.buildBTemp();
        else if (view === 'egg') { this.ground(0xf3ecdf); this.part(this.group, new THREE.SphereGeometry(0.22, 14, 12), 0xf7f1e4, 0, 0.3, 0, { scale: [0.75, 1.08, 0.75], name: '鸟卵', desc: '鸟类会产卵。' }); this.note('鸟会产卵', 0, 1.2, 0); }
        else if (view === 'btraits') { this.ground(0xe7eef6); this.bird({ desc: '身体呈流线型，翼上有成排羽毛，有喙无齿，体温恒定，会产卵。' }); this.needle(2.25, false, '体温', '鸟的体温保持稳定，是恒温动物。'); this.note('流线、羽毛、喙、恒温', 0, 1.9, 0); }
        else if (view === 'mammal') { this.ground(0xf7f3ec); this.beast({ color: 0xc4a574, hair: 16, ear: 'round', tail: 0.45, name: '哺乳动物', desc: '体表有毛，体温恒定，牙齿有分化，神经系统和感觉器官发达。' }); this.needle(1.9, false, '体温', '哺乳动物体温恒定。'); }
        else if (view === 'hair') this.buildHair();
        else if (view === 'mtemp') this.buildMTemp();
        else if (view === 'milk') this.buildMilk();
        else if (view === 'rabbit' || view === 'wolf') this.buildTeeth(view);
        else if (view === 'nerve') { this.ground(0xf7f3ec); this.beast({ color: 0xc4a574, hair: 10, ear: 'none', brain: true, name: '哺乳动物', desc: '神经系统和感觉器官都很发达。' }); this.note('神经和感觉很发达', 0, 1.75, 0); }
        else if (view === 'mtraits') this.buildMTraits();
        else if (view === 'whale') this.buildWhale();
        else this.showExample(view);
    }

    ground(color) {
        this.scene.background = new THREE.Color(color);
        this.part(this.group, new THREE.CircleGeometry(4.4, 36), color === 0xd9e7f2 ? 0xc5d5c4 : 0xe7dcc8, 0, 0, 0, { rot: [-Math.PI / 2, 0, 0] });
    }

    needle(x, variable, name, desc) {
        this.part(this.group, new THREE.CylinderGeometry(0.045, 0.045, 0.85, 8), 0xf7f7f7, x, 1, 0);
        const mark = this.part(this.group, new THREE.BoxGeometry(0.22, 0.05, 0.05), variable ? 0x3b82c4 : 0xd64545, x + 0.14, variable ? 1 : 1.24, 0.06, { name: name, desc: desc });
        mark.userData.variable = variable;
        mark.userData.home = variable ? 1 : 1.24;
        this.anim.needles = this.anim.needles || [];
        this.anim.needles.push(mark);
    }

    wings(root, span) {
        this.anim.wings = this.anim.wings || [];
        [-1, 1].forEach((side) => {
            const wing = new THREE.Group();
            wing.position.set(0.22 * side, 1.0, 0.05);
            wing.userData.sign = side;
            root.add(wing);
            this.anim.wings.push(wing);
            this.part(wing, new THREE.CylinderGeometry(0.03, 0.02, 0.9 * span, 6), 0x5c6f86, 0.42 * span * side, 0, 0, { rot: [0, 0, side * Math.PI / 2], name: '翼', desc: '翅膀上生着一排排大型羽毛。' });
            for (let row = 0; row < 2; row++) {
                for (let i = 0; i < 4; i++) {
                    this.part(wing, new THREE.PlaneGeometry(0.7 * span, 0.11), row ? 0xd5dee8 : 0xf7f9fc, (0.3 + i * 0.16) * side, 0.02 * row, row ? 0.14 : -0.14, {
                        rot: [-1.2, side * 0.12, 0], side: THREE.DoubleSide, name: '羽毛',
                        desc: '大型羽毛沿翅膀重叠排列，上下两排之间仍留着缝隙。'
                    });
                }
            }
        });
    }

    bird(o) {
        o = o || {};
        const root = new THREE.Group();
        root.position.set(o.x || 0, o.y || 0, 0);
        root.scale.setScalar(o.scale || 1);
        this.group.add(root);
        const hy = o.headOnly ? 1.0 : 1.12;
        const hz = o.headOnly ? 0.2 : 0.72;
        if (!o.headOnly) {
            this.part(root, new THREE.SphereGeometry(0.42, 16, 12), 0x5c6f86, 0, 0.9, 0, { scale: [0.72, 0.58, 1.42], name: o.name || '躯干', desc: o.desc || '鸟的身体呈流线型。' });
            [-0.12, 0.12].forEach((x) => this.part(root, new THREE.CylinderGeometry(0.028, 0.024, 0.36, 6), 0xe7b15a, x, 0.42, 0.12));
            this.part(root, new THREE.PlaneGeometry(0.42, 0.2), 0xe8eef5, 0, 0.98, -0.75, { rot: [0.45, 0, 0], side: THREE.DoubleSide });
            this.wings(root, o.span || 1);
        }
        this.part(root, new THREE.SphereGeometry(0.2, 14, 12), 0x73869b, 0, hy, o.headOnly ? 0 : 0.46);
        this.part(root, new THREE.SphereGeometry(0.045, 8, 8), 0x111111, 0.1, hy + 0.08, hz - 0.08);
        const open = o.open ? 0.08 : 0.01;
        this.part(root, new THREE.ConeGeometry(0.07, 0.32, 8), 0xe0a03a, 0, hy + open, hz, { rot: [1.25, 0, 0], name: '喙', desc: '鸟有喙，口中没有牙齿。' });
        this.part(root, new THREE.ConeGeometry(0.05, 0.24, 8), 0xc98a32, 0, hy - 0.07 - open, hz - 0.02, { rot: [1.8, 0, 0] });
        if (o.open) this.part(root, new THREE.SphereGeometry(0.055, 8, 8), 0x4a3030, 0, hy, hz - 0.04, { name: '口', desc: '喙张开以后，里面没有牙齿。' });
    }

    buildAir() {
        this.ground(0xd9e7f2);
        const root = new THREE.Group();
        this.group.add(root);
        this.part(root, new THREE.SphereGeometry(0.62, 18, 14), 0xd5dde8, 0, 1, 0, { scale: [0.72, 0.58, 1.35], op: 0.2, name: '身体', desc: '身体呈流线型。气囊和肺在体内，并且彼此相通。' });
        this.part(root, new THREE.ConeGeometry(0.08, 0.28, 8), 0xe0a03a, 0, 1.05, 0.95, { rot: [Math.PI / 2, 0, 0], name: '喙', desc: '空气从这一端进出。鸟有喙，没有牙齿。' });
        this.anim.sacs = [];
        [-1, 1].forEach((side) => this.part(root, new THREE.SphereGeometry(0.13, 12, 10), 0xf0a8b8, 0.14 * side, 1, 0.05, { name: '肺', desc: '吸气时只有一小部分空气在肺里交换；呼气时气囊中的空气再经过肺，肺再次得到新鲜空气。' }));
        [[0.32, 1.16, 0.4], [-0.32, 1.16, 0.4], [0.34, 0.82, -0.4], [-0.34, 0.82, -0.4]].forEach((p) => {
            this.anim.sacs.push(this.part(root, new THREE.SphereGeometry(0.17, 12, 10), 0x8fd0f2, p[0], p[1], p[2], { op: 0.62, name: '气囊', desc: '气囊和肺相通。吸气时大部分空气进入气囊，呼气时这些空气再流过肺。' }));
        });
        this.anim.bits = [];
        for (let i = 0; i < 6; i++) this.anim.bits.push(this.part(root, new THREE.SphereGeometry(0.038, 8, 8), 0x3db7ef, 0, 1, 1.15, { name: '气流', desc: '小球代表空气。变成暖色，表示正在肺里交换气体。吸气时只有少量空气这样，大部分进入气囊。' }));
        this.note('吸呼时肺都进新鲜空气', 0, 1.9, 0);
    }

    buildBTemp() {
        this.ground(0xe7eef2);
        this.fish(-1.9, 1.25);
        this.part(this.group, new THREE.SphereGeometry(0.16, 10, 8), 0x3d9846, -1.9, 0.7, 0, { scale: [0.85, 0.7, 1.2], name: '两栖动物', desc: '两栖动物的体温会随环境变化，属于变温动物。' });
        this.part(this.group, new THREE.SphereGeometry(0.16, 10, 8), 0x8d9a46, -1.9, 0.25, 0, { scale: [1.3, 0.55, 0.7], name: '爬行动物', desc: '爬行动物的体温会随环境变化，属于变温动物。' });
        this.needle(-0.75, true, '环境', '环境温度在变化。鱼、两栖动物和爬行动物的体温会跟着改变。');
        this.bird({ x: 1.25, scale: 0.62, name: '鸟', desc: '鸟的体温能够保持稳定，属于恒温动物。' });
        this.needle(2.45, false, '体温', '鸟是恒温动物。鱼用鳃呼吸，鱼和两栖动物、爬行动物都是变温动物。');
        this.note('左变温，右恒温', 0.2, 1.95, 0);
    }

    fish(x, y) {
        const fish = new THREE.Group();
        fish.position.set(x, y, 0);
        this.group.add(fish);
        this.part(fish, new THREE.SphereGeometry(0.2, 12, 10), 0x4aa3c7, 0, 0, 0, { scale: [0.55, 0.85, 1.35], name: '鱼', desc: '鱼用鳃呼吸，属于变温动物。' });
        this.part(fish, new THREE.ConeGeometry(0.1, 0.18, 8), 0x4aa3c7, 0, 0, -0.28, { rot: [Math.PI / 2, 0, 0] });
        this.part(fish, new THREE.SphereGeometry(0.03, 8, 8), 0x172028, 0.06, 0.06, 0.12);
    }

    beast(o) {
        const root = new THREE.Group();
        root.position.set(o.x || 0, o.y || 0, 0);
        root.scale.setScalar(o.scale || 1);
        this.group.add(root);
        const color = o.color;
        this.part(root, new THREE.SphereGeometry(0.42, 16, 12), color, 0, 0.55, 0, { scale: [0.8, 0.68, o.long || 1.3], rough: 0.78, name: o.name, desc: o.desc });
        this.part(root, new THREE.SphereGeometry(0.22, 12, 10), o.face || color, 0, 0.72, 0.46 * ((o.long || 1.3) / 1.3));
        if (o.ear === 'long') [-1, 1].forEach((s) => this.part(root, new THREE.SphereGeometry(0.07, 8, 8), color, 0.1 * s, 1.18, 0.4, { scale: [0.65, 2.8, 0.4] }));
        else if (o.ear === 'big') [-1, 1].forEach((s) => this.part(root, new THREE.CircleGeometry(0.4, 14), 0xb7b7b4, 0.5 * s, 0.8, 0.1, { rot: [0, s * 0.4, s * 0.25], side: THREE.DoubleSide }));
        else if (o.ear === 'bat') [-1, 1].forEach((s) => this.part(root, new THREE.CircleGeometry(0.14, 10), color, 0.16 * s, 1.02, 0.4, { side: THREE.DoubleSide }));
        else if (o.ear !== 'none') [-1, 1].forEach((s) => this.part(root, new THREE.ConeGeometry(0.06, 0.16, 6), color, 0.14 * s, 0.98, 0.38));
        const leg = o.leg || 0.38;
        if (o.aquatic) [-1, 1].forEach((s) => this.part(root, new THREE.SphereGeometry(0.12, 8, 8), color, 0.38 * s, 0.45, 0.1, { scale: [0.35, 1.15, 0.65], rot: [0, 0, s * 0.8] }));
        else [[-0.22, 0.25], [0.22, 0.25], [-0.22, -0.28], [0.22, -0.28]].forEach((p) => this.part(root, new THREE.CylinderGeometry(0.055, 0.045, leg, 6), color, p[0], leg / 2, p[1]));
        if (o.tail) this.part(root, new THREE.CylinderGeometry(0.045, 0.018, o.tail, 6), color, 0, 0.55, -0.45 - o.tail / 2, { rot: [Math.PI / 2, 0, 0] });
        if (o.trunk) this.part(root, new THREE.CylinderGeometry(0.06, 0.04, 0.55, 8), color, 0, 0.42, 0.82, { rot: [0.8, 0, 0] });
        if (o.fluke) this.part(root, new THREE.BoxGeometry(0.72, 0.05, 0.22), color, 0, 0.5, -0.42 * (o.long || 1.3) - 0.08);
        if (o.hair) for (let i = 0; i < o.hair; i++) this.part(root, new THREE.ConeGeometry(0.02, o.hairH || 0.14, 4), o.hairColor || 0xf6f1e6, Math.cos(i * 2.4) * 0.3, 0.88, Math.sin(i * 2.4) * 0.36);
        if (o.spots) for (let i = 0; i < 8; i++) this.part(root, new THREE.CircleGeometry(0.045, 8), 0x2a2a2a, Math.cos(i) * 0.2, 0.72 + (i % 3) * 0.08, 0.1 + (i % 4) * 0.08, { rot: [0.4, i, 0] });
        if (o.wing) [-1, 1].forEach((s) => this.part(root, new THREE.PlaneGeometry(0.9, 0.42), 0x6e5346, 0.58 * s, 0.62, 0, { rot: [0.2, 0, s * -0.45], side: THREE.DoubleSide }));
        if (o.brain) {
            this.part(root, new THREE.SphereGeometry(0.18, 12, 10), 0xf2c9b0, 0, 0.98, 0.28, { op: 0.28 });
            this.part(root, new THREE.SphereGeometry(0.11, 12, 10), 0xf0a0b8, 0, 1.0, 0.26, { name: '神经系统', desc: '哺乳动物的神经系统很发达，眼和耳等感觉器官也很发达。' });
            [-1, 1].forEach((s) => {
                this.part(root, new THREE.SphereGeometry(0.055, 8, 8), 0x222222, 0.09 * s, 0.78, 0.64, { name: '眼', desc: '眼是发达的感觉器官。' });
                this.part(root, new THREE.ConeGeometry(0.05, 0.2, 6), color, 0.18 * s, 1.08, 0.36, { name: '耳', desc: '耳是发达的感觉器官。' });
            });
        }
    }

    buildHair() {
        this.ground(0xf4efe6);
        this.beast({ x: -1.25, color: 0xc4a574, hair: 18, ear: 'round', tail: 0.4, name: '体毛', desc: '哺乳动物体表一般有毛。' });
        this.beast({ x: 1.35, scale: 0.85, color: 0x6d8494, aquatic: true, ear: 'none', long: 1.7, fluke: true, hair: 2, hairH: 0.05, name: '鲸', desc: '少数水生种类的毛会退化，鲸就是这样，但它仍然是哺乳动物。' });
        this.note('一般有毛', -1.25, 1.55, 0);
        this.note('鲸的毛退化', 1.35, 1.55, 0);
    }

    buildMTemp() {
        this.ground(0xf7f3ec);
        this.beast({ x: -0.35, color: 0xc4a574, hair: 12, ear: 'round', name: '体温', desc: '哺乳动物体温恒定，不像鱼、两栖动物和爬行动物那样随环境改变。' });
        this.needle(1.55, false, '体温', '哺乳动物的体温保持稳定。');
        this.needle(2.25, true, '环境', '环境温度会变化，哺乳动物的体温不跟着一起变。');
    }

    buildMilk() {
        this.ground(0xf6f1e6);
        this.beast({ x: -0.45, color: 0xc4a574, hair: 14, ear: 'round', tail: 0.4, name: '母体', desc: '多数哺乳动物的胚胎在母体内发育，生下来已是幼体。' });
        this.beast({ x: 0.9, color: 0xe0c89a, hair: 8, ear: 'round', scale: 0.55, name: '幼体', desc: '母体用乳汁喂养幼体，幼体活下来的机会更高。' });
        this.note('出生后吃母乳', 0.2, 1.6, 0);
    }

    buildMTraits() {
        this.ground(0xf7f3ec);
        this.beast({ x: -0.7, color: 0xc4a574, hair: 14, ear: 'round', tail: 0.4, name: '哺乳动物', desc: '主要特征是体表被毛、体温恒定、胎生哺乳，牙齿有分化。' });
        this.beast({ x: 0.85, color: 0xe0c89a, hair: 6, ear: 'round', scale: 0.5, name: '幼体', desc: '多数种类在母体内发育，出生后由母体喂奶，成活机会更高。' });
        this.needle(2.15, false, '体温', '体温恒定。');
        this.note('毛、恒温、母乳', 0, 1.7, 0);
    }

    buildWhale() {
        this.ground(0xd5e4ee);
        this.beast({ color: 0x6d8494, aquatic: true, ear: 'none', long: 1.85, fluke: true, hair: 2, hairH: 0.05, name: '鲸', desc: '鲸体表的毛已经退化，但它仍是哺乳动物：体温恒定，幼体在母体内发育后出生，并吃母乳。' });
        this.note('毛退化，仍是哺乳类', 0, 1.55, 0);
    }

    buildTeeth(kind) {
        this.ground(0xf7f4ee);
        if (kind === 'rabbit') this.beast({ x: -1.55, scale: 0.68, color: 0xf4f4f4, ear: 'long', tail: 0.3, hair: 8, name: '兔', desc: '兔有门齿和臼齿，和吃植物相适应。' });
        else this.beast({ x: -1.55, scale: 0.68, color: 0x7d807f, ear: 'round', tail: 0.5, hair: 10, name: '狼', desc: '狼有门齿、犬齿和臼齿，和捕捉猎物相适应。' });
        const root = new THREE.Group();
        root.position.set(0.7, 0, 0);
        this.group.add(root);
        this.part(root, new THREE.BoxGeometry(1.5, 0.12, 0.48), 0xf3f0ea, 0, 1.16, 0);
        this.part(root, new THREE.BoxGeometry(1.5, 0.12, 0.48), 0xf3f0ea, 0, 0.56, 0);
        const plant = '这和吃植物相适应。';
        const tooth = (x, y, z, h, sx, name, desc) => this.part(root, new THREE.BoxGeometry(0.07 * sx, h, 0.08), 0xfffaf2, x, y, z, { name: name, desc: desc });
        [-0.08, 0.08].forEach((x) => {
            tooth(x, 0.98, 0.22, 0.26, 1, '门齿', '门齿在口腔前端。' + (kind === 'rabbit' ? plant : '狼也有门齿。'));
            tooth(x, 0.72, 0.22, 0.2, 1, '门齿', '上下都有门齿。');
        });
        if (kind === 'wolf') [-0.3, 0.3].forEach((x) => tooth(x, 0.9, 0.1, 0.5, 1, '犬齿', '犬齿比较长，和捕捉猎物相适应。'));
        [-0.62, -0.44, 0.44, 0.62].forEach((x) => {
            const desc = kind === 'rabbit' ? '臼齿靠后。兔的门齿和臼齿与吃植物相适应。' : '臼齿靠后。狼有门齿、犬齿和臼齿，与捕捉猎物相适应。';
            tooth(x, 1.04, -0.06, 0.14, 1.45, '臼齿', desc);
            tooth(x, 0.68, -0.06, 0.12, 1.45, '臼齿', '臼齿位于口腔后部。');
        });
    }

    showExample(key) {
        const map = {
            leopard: { color: 0xd9d6cf, spots: true, tail: 0.9, hair: 14, ear: 'round', name: '雪豹', desc: '雪豹是哺乳动物，体表有毛。' },
            elephant: { color: 0x8e9194, ear: 'big', trunk: true, hair: 8, leg: 0.55, name: '亚洲象', desc: '亚洲象是哺乳动物，体表有毛。' },
            monkey: { color: 0xc7a36a, face: 0xe0b090, ear: 'round', tail: 0.75, hair: 12, name: '猕猴', desc: '猕猴是哺乳动物，体表有毛。' },
            porpoise: { color: 0x9bb0b8, aquatic: true, ear: 'none', long: 1.55, fluke: true, name: '长江江豚', desc: '长江江豚是哺乳动物。' },
            bat: { color: 0x6e5b4e, ear: 'bat', wing: true, hair: 12, name: '蝙蝠', desc: '蝙蝠体表有毛，是哺乳动物。' }
        };
        this.ground(0xf6f1e6);
        this.beast(map[key]);
        this.note(map[key].name, 0, 1.65, 0);
    }

    animate(time, delta) {
        this.t += delta;
        const anim = this.anim;
        (anim.wings || []).forEach((wing) => {
            wing.rotation.z = wing.userData.sign * (-0.3 + Math.sin(this.t * 2.6) * (this.view === 'feather' ? 0.55 : 0.25));
        });
        (anim.needles || []).forEach((mark) => {
            if (mark.userData.variable) mark.position.y = mark.userData.home + Math.sin(this.t * 1.7) * 0.28;
        });
        if (anim.bits && anim.sacs) {
            const cycle = (this.t % 5) / 5;
            const inhale = cycle < 0.5;
            const u = inhale ? cycle / 0.5 : (cycle - 0.5) / 0.5;
            anim.sacs.forEach((sac) => {
                const k = inhale ? 0.72 + u * 0.7 : 1.42 - u * 0.7;
                const base = sac.userData.base;
                sac.scale.set(base[0] * k, base[1] * k, base[2] * k);
            });
            anim.bits.forEach((bit, index) => {
                const sac = anim.sacs[index % anim.sacs.length];
                const lungX = index % 2 ? 0.14 : -0.14;
                const few = index < 2;
                let x = 0; let y = 1; let z = 1.1; let hot = false;
                if (inhale && few) { z = 1.15 - u * 1.05; x = lungX * u; hot = u > 0.55; }
                else if (inhale) { x = sac.position.x * u; y = 1 + (sac.position.y - 1) * u; z = 1.15 + (sac.position.z - 1.15) * u; }
                else if (few) { z = 0.1 + u * 1.1; x = lungX * (1 - u); }
                else if (u < 0.6) {
                    const k = u / 0.6;
                    hot = k > 0.75;
                    x = sac.position.x + (lungX - sac.position.x) * k;
                    y = sac.position.y + (1 - sac.position.y) * k;
                    z = sac.position.z + (0.05 - sac.position.z) * k;
                } else {
                    const k = (u - 0.6) / 0.4;
                    x = lungX * (1 - k);
                    z = 0.05 + k * 1.15;
                }
                bit.position.set(x, y, z);
                bit.material.color.setHex(hot ? 0xf0c14a : 0x3db7ef);
            });
        }
        (anim.labels || []).forEach((label) => label.lookAt(this.camera.position));
    }

    getInteractables() { return this.interactables; }

    dispose() {
        this.wipe();
        this.lights.forEach((light) => { this.scene.remove(light); if (light.dispose) light.dispose(); });
        this.lights = [];
        if (this.group) { this.scene.remove(this.group); this.group = null; }
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
        this.interactables.splice(0);
    }
};
