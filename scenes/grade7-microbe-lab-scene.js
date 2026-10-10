window.Grade7MicrobeLabScene = class Grade7MicrobeLabScene {
    constructor(scene, camera, renderer) {
        this.scene = scene; this.camera = camera; this.renderer = renderer; this.id = 'grade7-microbe-lab';
        this.group = null; this.lights = []; this.interactables = []; this.btns = {}; this.lamps = [];
        this.holders = []; this.paintables = []; this.steams = []; this.specks = []; this.dishes = [];
        this.mediums = []; this.lids = []; this.step = 0; this.skipped = false; this.coated = false;
        this.masked = false; this.ended = false; this.overlay = ''; this.t = 0; this.grow = 0; this.flashT = 0; this.flashMesh = null;
    }
    init() {
        this.camera.position.set(0.35, 4.5, 7.1); this.camera.lookAt(0.15, 1.05, 0);
        this.scene.background = new THREE.Color(0xd5e0db);
        const hemi = new THREE.HemisphereLight(0xf7f8f4, 0xc9beae, 0.62);
        const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(3.5, 6.5, 4);
        const rim = new THREE.DirectionalLight(0xd7e6f0, 0.38); rim.position.set(-4, 3, -2);
        [hemi, key, rim].forEach((light) => { this.scene.add(light); this.lights.push(light); });
        this.group = new THREE.Group(); this.scene.add(this.group);
        this.add(this.group, new THREE.BoxGeometry(7.4, 0.16, 3.5), this.mat(0xd9d3c8), 0.1, 0.78, 0.05);
        ['配制', '灭菌', '冷却', '接种', '培养'].forEach((name, i) => {
            this.lamps.push(this.add(this.group, new THREE.SphereGeometry(0.07, 10, 8), this.mat(0x66736e, { emissive: 0x222222 }), -1.15 + i * 0.34, 0.95, 1.45));
            this.tag(this.group, name, -1.15 + i * 0.34, 0.76, 1.45, 0.55);
        });
        this.buildGear(); this.buildDishes(); this.buildFigure(); this.buildPlaces(); this.setupUI();
    }
    mat(color, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.62, metalness: 0.04 }, extra || {})); }
    add(parent, geo, material, x, y, z) { const mesh = new THREE.Mesh(geo, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
    clickable(mesh, name, desc) { mesh.userData.name = name; mesh.userData.description = desc; this.interactables.push(mesh); return mesh; }
    tag(parent, text, x, y, z, w) {
        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
        const pen = canvas.getContext('2d'); pen.fillStyle = '#f6f3ea'; pen.fillRect(0, 12, 512, 104);
        pen.fillStyle = '#1c3330'; pen.font = '46px sans-serif'; pen.textAlign = 'center'; pen.textBaseline = 'middle'; pen.fillText(text, 256, 64);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        sprite.position.set(x, y, z); sprite.scale.set(w, w * 0.25, 1); parent.add(sprite); return sprite;
    }
    puff(parent, x, y, z, zone, phase) {
        const mesh = this.add(parent, new THREE.SphereGeometry(0.055, 8, 6), this.mat(0xffffff, { transparent: true, opacity: 0.3, depthWrite: false }), x, y, z);
        mesh.userData.zone = zone; mesh.userData.phase = phase; mesh.userData.baseY = y; this.steams.push(mesh);
    }
    buildGear() {
        const pot = new THREE.Group(); pot.position.set(-2.45, 0.86, -0.15); this.group.add(pot);
        this.add(pot, new THREE.CylinderGeometry(0.28, 0.32, 0.62, 18), this.mat(0xc5d5d2, { transparent: true, opacity: 0.45 }), 0, 0.31, 0);
        this.broth = this.clickable(this.add(pot, new THREE.CylinderGeometry(0.22, 0.22, 0.28, 14), this.mat(0xb56a38, { transparent: true, opacity: 0.8, emissive: 0x000000 }), 0, 0.24, 0), '培养基原料', '用牛肉汁加上琼脂配制。琼脂煮沸后熔化，冷却后又凝固。这不是饮料，不能喝。');
        this.agarBag = this.add(pot, new THREE.BoxGeometry(0.28, 0.2, 0.16), this.mat(0xf3f0e6), 0.46, 0.18, 0);
        this.tag(pot, '琼脂', 0.46, 0.42, 0, 0.7); this.tag(pot, '牛肉汁', -0.55, 0.42, 0.15, 0.85);
        for (let i = 0; i < 4; i++) this.puff(pot, (i - 1.5) * 0.07, 0.7, 0, 'pot', i * 0.6);
        const autoclave = new THREE.Group(); autoclave.position.set(2.45, 0.86, -0.55); this.group.add(autoclave);
        this.autoBody = this.clickable(this.add(autoclave, new THREE.BoxGeometry(0.78, 0.92, 0.62), this.mat(0x8ea4a8, { emissive: 0x000000 }), 0, 0.46, 0), '高温灭菌设备', '高温灭菌用来杀死培养基里原来就有的微生物。否则后来的菌落，分不清是样品带来的，还是培养基自己带来的。');
        this.tag(autoclave, '灭菌', 0, 1.05, 0, 0.7);
        for (let i = 0; i < 3; i++) this.puff(autoclave, -0.08 + i * 0.08, 0.98, 0.2, 'auto', i);
        this.incubator = this.clickable(this.add(this.group, new THREE.BoxGeometry(0.78, 0.7, 0.55), this.mat(0xc8b59a, { emissive: 0x000000 }), 2.45, 1.22, 0.85), '恒温培养箱', '接种后放在比较稳定的温度下培养，微生物繁殖到肉眼能看见，才形成菌落。这里不写具体温度。');
        this.tag(this.group, '恒温', 2.45, 1.7, 0.85, 0.7);
        this.swab = new THREE.Group(); this.swabHome = new THREE.Vector3(-2.35, 0.9, 1.05); this.swabWork = new THREE.Vector3(-0.15, 1.15, 0.35);
        this.swab.position.copy(this.swabHome); this.group.add(this.swab);
        this.add(this.swab, new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), this.mat(0xf2efe6), 0, 0.42, 0);
        this.swabCotton = this.clickable(this.add(this.swab, new THREE.SphereGeometry(0.07, 10, 8), this.mat(0xfffaf2, { emissive: 0x000000 }), 0, 0.86, 0), '无菌棉签', '棉签本身也要无菌。不然棉签上的微生物会混进样品，菌落就不能代表所检测的环境。');
        this.dirtySwab = new THREE.Group(); this.dirtySwab.position.set(-1.7, 0.9, 1.05); this.dirtySwab.visible = false; this.group.add(this.dirtySwab);
        this.add(this.dirtySwab, new THREE.CylinderGeometry(0.02, 0.02, 0.85, 8), this.mat(0x8d8174), 0, 0.42, 0);
        this.add(this.dirtySwab, new THREE.SphereGeometry(0.08, 8, 6), this.mat(0x6e6240), 0, 0.86, 0);
        this.tag(this.dirtySwab, '未灭菌', 0.15, 1.15, 0, 0.8);
    }
    buildDishes() {
        const glass = this.mat(0xd5ece8, { transparent: true, opacity: 0.34, roughness: 0.08, side: THREE.DoubleSide });
        for (let d = 0; d < 2; d++) {
            const root = new THREE.Group(); root.position.set(d === 0 ? -0.55 : 0.85, 0.9, 0.12); root.userData.home = root.position.clone();
            root.userData.away = new THREE.Vector3(1.55, 1.05 + d * 0.28, -0.2); this.group.add(root); this.dishes.push(root);
            this.add(root, new THREE.CylinderGeometry(0.62, 0.62, 0.06, 24), glass, 0, 0.03, 0);
            this.add(root, new THREE.CylinderGeometry(0.62, 0.62, 0.2, 24, 1, true), glass, 0, 0.14, 0);
            const medium = this.add(root, new THREE.CylinderGeometry(0.56, 0.56, 0.05, 24), this.mat(0xd2b48a, { transparent: true, opacity: 0.9, emissive: 0x000000 }), 0, 0.07, 0);
            medium.visible = false; this.mediums.push(medium);
            this.clickable(medium, d ? '对照皿里的培养基' : '接种皿里的培养基', d
                ? '对照皿不接种，盖子也不打开。培养基若灭菌彻底，培养后这里应仍然干净。'
                : '这是固体培养基。灭菌并冷却后，原来的微生物应已被杀死。只有这个皿用棉签接种。');
            if (d === 0) {
                this.streak = this.add(root, new THREE.BoxGeometry(0.34, 0.012, 0.05), this.mat(0xf4efe4), 0.04, 0.1, 0.02);
                this.streak.rotation.y = 0.5; this.streak.visible = false;
                this.warnRing = this.add(root, new THREE.TorusGeometry(0.7, 0.015, 8, 20), this.mat(0xc47b2a, { emissive: 0x8a4e12 }), 0, 0.02, 0);
                this.warnRing.rotation.x = Math.PI / 2; this.warnTag = this.tag(root, '不要触摸', 0, 0.72, 0.9, 1.15); this.warnTag.visible = false;
            }
            const lid = new THREE.Group(); lid.position.y = 0.2; root.add(lid); this.lids.push(lid);
            const lidMesh = this.add(lid, new THREE.CylinderGeometry(0.66, 0.66, 0.08, 24, 1, true), glass, 0, 0.04, 0);
            this.add(lid, new THREE.CylinderGeometry(0.66, 0.66, 0.05, 24), glass, 0, 0.08, 0);
            this.clickable(lidMesh, d ? '对照皿的盖' : '接种皿的盖', d
                ? '对照皿的盖子一直盖着。如果它也长菌，往往说明培养基没有灭菌干净。'
                : '盖子只在接种时短暂打开。培养时要盖上，透过盖子看，不要伸手进去，也不要凑近去闻。');
            this.tag(root, d ? '对照皿' : '接种皿', 0, 0.55, 0.72, 0.9);
            const holder = new THREE.Group(); root.add(holder); this.holders.push({ group: holder, dish: d });
            const plan = [['bs', -0.2, 0.02, 0xf3f0e4], ['br', 0.12, 0.14, 0xd8b83d], ['bs', 0.02, -0.16, 0xc44747], ['web', -0.06, 0.22, 0xf2f2f2], ['velvet', 0.22, 0.2, 0x3c7a44], ['fluff', -0.24, 0.18, 0x8d4a2a], ['fluff', 0.26, -0.08, 0x242424], ['velvet', -0.18, -0.22, 0xc6a43a]];
            plan.forEach((item) => this.colony(holder, d, item[0], item[1], item[2], item[3]));
            for (let s = 0; s < 5; s++) {
                const speck = this.add(root, new THREE.SphereGeometry(0.018, 6, 5), this.mat(0x5c5348), Math.cos(s * 1.3) * 0.28, 0.11, Math.sin(s * 1.7) * 0.22);
                speck.visible = false; speck.userData.dish = d; this.specks.push(speck);
            }
        }
    }
    colony(holder, dish, kind, x, z, color) {
        const spot = new THREE.Group(); spot.position.set(x, 0.1, z); holder.add(spot);
        const mold = kind !== 'bs' && kind !== 'br';
        const name = mold ? '霉菌菌落' : '细菌菌落';
        const desc = mold
            ? '这种菌落大得多，更像霉菌，呈绒毛状、絮状或蛛网状，颜色有白、红、褐、绿、黑、黄等。形态和大小只能提示类别。不能触摸或品尝。'
            : '这种较小的菌落更像细菌。表面有的光滑黏稠，有的粗糙干燥，颜色可以是白、黄或红。只凭大小和外形，只能推测大类。不要打开盖子去碰。';
        const made = [];
        if (kind === 'bs') made.push(this.add(spot, new THREE.SphereGeometry(0.045, 10, 8), this.mat(color, { roughness: 0.22 }), 0, 0, 0));
        else if (kind === 'br') { const rough = this.add(spot, new THREE.DodecahedronGeometry(0.05, 0), this.mat(color, { roughness: 1 }), 0, 0, 0); rough.scale.y = 0.62; made.push(rough); }
        else if (kind === 'web') for (let k = 0; k < 3; k++) { const arm = this.add(spot, new THREE.CylinderGeometry(0.008, 0.008, 0.34, 5), this.mat(color, { roughness: 0.9 }), 0, 0, 0); arm.rotation.z = Math.PI / 2; arm.rotation.y = k; made.push(arm); }
        else if (kind === 'velvet') { made.push(this.add(spot, new THREE.CylinderGeometry(0.15, 0.15, 0.03, 12), this.mat(color, { roughness: 1 }), 0, 0, 0)); for (let k = 0; k < 6; k++) made.push(this.add(spot, new THREE.CylinderGeometry(0.008, 0.008, 0.05, 4), this.mat(color, { roughness: 1 }), Math.cos(k) * 0.08, 0.04, Math.sin(k) * 0.08)); }
        else for (let k = 0; k < 5; k++) made.push(this.add(spot, new THREE.SphereGeometry(0.07, 7, 6), this.mat(color, { roughness: 1 }), Math.cos(k) * 0.09, (k % 2) * 0.06, Math.sin(k) * 0.09));
        made.forEach((mesh) => { this.clickable(mesh, name, desc); this.paintables.push({ mat: mesh.material, color: color, dish: dish }); });
    }
    buildFigure() {
        const fig = new THREE.Group(); fig.position.set(-2.55, 0.86, 1.2); this.group.add(fig);
        const torso = this.add(fig, new THREE.BoxGeometry(0.34, 0.48, 0.18), this.mat(0x4d6f8a), 0, 0.46, 0);
        this.coat = this.add(fig, new THREE.BoxGeometry(0.4, 0.52, 0.22), this.mat(0xe7f2ef), 0, 0.46, 0); this.coat.visible = false;
        this.add(fig, new THREE.SphereGeometry(0.13, 12, 10), this.mat(0xf0c7a8), 0, 0.86, 0);
        this.mask = this.add(fig, new THREE.BoxGeometry(0.16, 0.09, 0.06), this.mat(0xf7f7f7), 0, 0.8, 0.1); this.mask.visible = false;
        this.ppeLamp = this.add(fig, new THREE.SphereGeometry(0.04, 8, 6), this.mat(0x888888, { emissive: 0x222222 }), 0.22, 0.7, 0);
        this.clickable(torso, '实验人员', '做这个实验要穿实验服、戴口罩。衣服和口罩只是减少污染，不表示培养物可以触摸或品尝。');
    }
    buildPlaces() {
        this.placeBoard = new THREE.Group(); this.placeBoard.position.set(0.15, 1.75, -0.85); this.placeBoard.visible = false; this.group.add(this.placeBoard);
        this.clickable(this.add(this.placeBoard, new THREE.BoxGeometry(1.8, 0.9, 0.06), this.mat(0xf7f4ec), 0, 0, 0), '地点比较牌', '甲、乙都没有标出菌落数量。课本没有给出卫生间或别的某个真实地点菌落更多的结果，不能自己下这种结论。');
        this.tag(this.placeBoard, '甲 ?', -0.45, 0.05, 0.06, 0.7); this.tag(this.placeBoard, '乙 ?', 0.45, 0.05, 0.06, 0.7);
        this.add(this.placeBoard, new THREE.BoxGeometry(0.28, 0.06, 0.2), this.mat(0x2f5e4e), 0, -0.55, 0.1); this.tag(this.placeBoard, '课本', 0, -0.36, 0.16, 0.6);
    }
    setupUI() {
        const title = document.getElementById('info-title'); if (title) title.textContent = '检测环境中的细菌和真菌';
        const controls = document.getElementById('scene-controls'); controls.innerHTML = '';
        const items = [['prepare', '配制培养基', () => this.prepare()], ['sterilize', '高温灭菌', () => this.sterilize()], ['skip', '跳过灭菌', () => this.skip()], ['cool', '冷却', () => this.cool()], ['inoculate', '接种', () => this.inoculate()], ['incubate', '恒温培养', () => this.incubate()], ['why-medium', '为何灭菌', () => this.whyMedium()], ['why-swab', '棉签为何无菌', () => this.whySwab()], ['coat', '穿实验服', () => this.toggleCoat()], ['mask', '戴口罩', () => this.toggleMask()], ['places', '课本未比地点', () => this.showPlaces()], ['finish', '实验结束', () => this.finish()], ['reset', '重新实验', () => this.resetAll()]];
        items.forEach((item) => { const btn = document.createElement('button'); btn.type = 'button'; btn.id = this.id + '-' + item[0]; btn.className = 'control-btn'; btn.textContent = item[1]; btn.addEventListener('click', item[2]); controls.appendChild(btn); this.btns[item[0]] = btn; });
        this.say('菌落是一个或几个细菌、真菌在固体培养基上繁殖后形成的、肉眼可见的一团。请按顺序操作：配制培养基、高温灭菌、冷却、接种、恒温培养。牛肉汁加琼脂，煮沸时琼脂熔化，冷却后凝固。灭菌是为了去掉培养基里原有的微生物，棉签也要无菌。一个皿接种，另一个始终盖好作为对照。若跳过灭菌，两个皿都会长菌。课本没有给出某个真实地点菌落更多的结果。培养物不能摸、不能尝。要穿实验服、戴口罩，结束后再次灭菌。');
    }
    say(text) {
        const el = document.getElementById('info-content'); if (el) el.textContent = text;
        const done = { prepare: this.step >= 1, sterilize: this.step >= 2 && !this.skipped, skip: this.skipped && this.step >= 2, cool: this.step >= 3, inoculate: this.step >= 4, incubate: this.step >= 5, coat: this.coated, mask: this.masked, finish: this.ended };
        Object.keys(this.btns).forEach((key) => { this.btns[key].style.outline = done[key] ? '2px solid #1f6a4d' : ''; });
    }
    deny(mesh, text) {
        if (this.flashMesh && this.flashMesh !== mesh && this.flashMesh.material && this.flashMesh.material.emissive) this.flashMesh.material.emissive.setHex(0x000000);
        this.flashMesh = mesh; this.flashT = 0.8; this.say(text);
    }
    guard(minStep, mesh, text) {
        if (this.ended) { this.deny(this.autoBody, '实验已经结束，培养皿已再次灭菌。要重做，请点重新实验。'); return false; }
        if (this.step < minStep) { this.deny(mesh, text); return false; }
        return true;
    }
    prepare() {
        if (this.ended) return this.guard(0, this.broth, '');
        this.step = 1; this.skipped = false; this.overlay = '';
        this.say('正在配制培养基：牛肉汁加上琼脂。加热时琼脂熔化，呈液体。它不是食物，不能喝。下一步应高温灭菌；如果跳过，后面两个皿都会长菌。');
    }
    sterilize() {
        if (!this.guard(1, this.broth, '请先配制培养基，再高温灭菌。')) return;
        if (this.step >= 3) return this.deny(this.autoBody, '已经冷却，这一轮的灭菌选择已经定了。');
        this.skipped = false; this.step = 2; this.overlay = '';
        this.say('正在高温灭菌。这一步把培养基里原来的微生物杀死，后面才能把长出的菌落归因于接种的样品。');
    }
    skip() {
        if (!this.guard(1, this.broth, '请先配制培养基。跳过灭菌会让对照失效。')) return;
        if (this.step >= 3) return this.deny(this.mediums[1], '已经冷却，不能再回头跳过。');
        if (this.step >= 2 && !this.skipped) return this.deny(this.autoBody, '这一轮已经灭菌。若想看没灭菌的结果，请重新实验后再跳过。');
        this.skipped = true; this.step = 2; this.overlay = '';
        this.say('你跳过了高温灭菌。培养基里可能还留着原来的微生物。冷却、接种并培养后，接种皿和对照皿都会长出菌落。');
    }
    cool() {
        if (!this.guard(2, this.lamps[1], '请先高温灭菌，或明确点“跳过灭菌”。')) return;
        if (this.step >= 4) return this.deny(this.lamps[2], '已经做过接种，冷却步骤已经完成。');
        this.step = 3; this.overlay = '';
        this.say(this.skipped ? '培养基冷却后凝固成果冻状固体。因为没有灭菌，里面的微生物还可能活着。' : '琼脂冷却后凝固，液体变成固体。高温阶段留下的微生物应已被杀死。');
    }
    inoculate() {
        if (!this.guard(3, this.lamps[2], '请先让培养基冷却凝固，再接种。')) return;
        if (this.step >= 5) return this.deny(this.incubator, '已经在恒温培养，接种步骤已经完成。');
        if (!this.coated || !this.masked) return this.deny(this.ppeLamp, '接种前先穿实验服、戴口罩。不要把脸凑近培养皿，也不要碰培养基。');
        this.step = 4; this.overlay = '';
        this.say('只用无菌棉签在左边的皿表面接种，右边的对照皿保持盖好。棉签要无菌，免得把别的微生物混进样品。采样不代表某个具体地点，课本也没说哪里的菌落一定更多。');
    }
    incubate() {
        if (!this.guard(4, this.swabCotton, '请先完成接种，再放入恒温培养。')) return;
        this.step = 5; this.overlay = '';
        const shape = '菌落是一个或几个细菌、真菌在固体培养基上繁殖后形成的可见集团。较小、光滑黏稠或粗糙干燥的，多半像细菌菌落，颜色可以是白、黄或红；大好几倍、呈绒毛状、絮状或蛛网状的，多半像霉菌菌落，颜色有白、红、褐、绿、黑、黄等。形状和大小只能提示大类。';
        this.say((this.skipped ? '恒温培养后两个皿都长出了菌落。没灭菌时对照皿也会长，说明不了微生物来自样品。' : '恒温培养后，只有接种皿长出菌落，盖着的对照皿仍然干净。长出来的微生物来自棉签上的样品，不是培养基本身。') + shape);
    }
    whyMedium() { this.overlay = 'medium'; this.deny(this.autoBody, '培养基要灭菌，是因为原料和器皿里可能本来就有微生物。不灭菌的话，菌落可能是它们长出来的，实验就无法说明环境样品里有没有细菌和真菌。'); }
    whySwab() { this.overlay = 'swab'; this.deny(this.swabCotton, '棉签要无菌，是为了不把操作者或棉签上的微生物带进培养皿。否则菌落不能代表所检测的环境。旁边发灰的棉签表示没有灭菌的错误做法。'); }
    toggleCoat() { this.coated = !this.coated; this.say(this.coated ? '已穿上实验服。实验服用来减少污染，不表示可以触摸或品尝培养物。' : '已脱掉实验服。接种前需要重新穿上。'); }
    toggleMask() { this.masked = !this.masked; this.say(this.masked ? '已戴上口罩。口罩用来避免口鼻靠近培养物，不是让培养物变得可以接触。' : '已取下口罩。接种前需要重新戴上。'); }
    showPlaces() { this.overlay = this.overlay === 'places' ? '' : 'places'; this.say('课本没有给出卫生间或其他某个真实地点菌落更多的结果。牌子上的甲、乙都只是问号，不能把任何真实场所说成菌落一定更多。'); }
    finish() { this.ended = true; this.overlay = ''; this.say('实验结束。两个培养皿再次高温灭菌，活着的微生物被处理掉。不要打开盖子去摸、去闻，更不能尝。'); }
    resetAll() { this.step = 0; this.skipped = false; this.ended = false; this.overlay = ''; this.grow = 0; this.coated = false; this.masked = false; this.say('实验已复位。培养皿是空的。请重新按顺序操作，并穿实验服、戴口罩。培养物在任何步骤都不能触摸或品尝。'); }
    animate(time, delta) {
        const dt = Math.min(Math.max(delta, 0), 0.05); this.t += dt;
        if (this.flashT <= 0 && this.flashMesh && this.flashMesh.material && this.flashMesh.material.emissive) this.flashMesh.material.emissive.setHex(0x000000);
        if (this.flashT <= 0) this.flashMesh = null;
        const hot = this.step >= 1 && this.step < 3 && !this.ended;
        this.grow += ((this.step >= 5 && !this.ended ? 1 : 0) - this.grow) * (1 - Math.exp(-dt * 1.3));
        this.mediums.forEach((medium) => {
            medium.visible = this.step >= 1;
            medium.material.color.setHex(this.ended ? 0x6e6258 : hot ? 0xb56a38 : 0xd2b48a);
            medium.material.opacity = hot ? 0.55 : 0.92; medium.material.roughness = hot ? 0.16 : 0.78;
            medium.material.emissive.setHex(this.overlay === 'medium' && Math.sin(this.t * 6) > 0 ? 0x8a3d12 : 0x000000);
        });
        this.streak.visible = this.step >= 4 && !this.ended;
        const openLid = this.step === 4 && !this.ended;
        this.lids[0].position.y = openLid ? 0.48 : 0.2; this.lids[0].rotation.z = openLid ? -0.45 : 0; this.lids[1].position.y = 0.2;
        this.warnRing.visible = openLid; this.warnTag.visible = openLid;
        this.holders.forEach((item) => { const allow = (item.dish === 0 || this.skipped) && this.step >= 5 && this.grow > 0.04; item.group.visible = allow; item.group.scale.setScalar(Math.max(0.001, this.grow)); });
        this.paintables.forEach((chip) => chip.mat.color.setHex(this.ended ? 0x9a9a9a : chip.color));
        this.specks.forEach((speck) => { speck.visible = this.skipped && this.step >= 2 && this.step < 5 && !this.ended; });
        this.dishes.forEach((dish) => dish.position.lerp(this.ended ? dish.userData.away : dish.userData.home, 1 - Math.exp(-dt * 2)));
        const sterilizing = this.step === 2 && !this.skipped && !this.ended;
        this.autoBody.material.emissive.setHex(sterilizing || this.ended ? 0xc45a2a : 0x000000);
        this.incubator.material.emissive.setHex(this.step >= 5 && !this.ended ? 0xffb26b : 0x000000);
        this.agarBag.rotation.z = this.step >= 1 ? 0.9 : 0.05; this.agarBag.position.x = this.step >= 1 ? 0.28 : 0.46;
        this.swab.position.lerp(openLid ? this.swabWork : this.swabHome, 1 - Math.exp(-dt * 3)); this.swab.rotation.z = openLid ? 0.8 : 0.15;
        this.swabCotton.material.emissive.setHex(this.overlay === 'swab' ? 0x7eb6ff : 0x000000);
        this.dirtySwab.visible = this.overlay === 'swab'; this.placeBoard.visible = this.overlay === 'places';
        this.coat.visible = this.coated; this.mask.visible = this.masked;
        this.ppeLamp.material.emissive.setHex(this.coated && this.masked ? 0x335577 : 0x222222);
        const potSteam = this.step === 1 && !this.ended; const autoSteam = sterilizing || this.ended;
        this.steams.forEach((puff) => { const on = puff.userData.zone === 'pot' ? potSteam : autoSteam; const wave = (this.t * 0.35 + puff.userData.phase) % 1; puff.visible = on; puff.position.y = puff.userData.baseY + wave * 0.35; puff.material.opacity = on ? (1 - wave) * 0.4 : 0; });
        this.lamps.forEach((lamp, i) => { const on = this.step > i; lamp.material.color.setHex(on ? 0x8ee0b8 : 0x66736e); lamp.material.emissive.setHex(on ? 0x1f8a5b : 0x222222); });
        if (this.flashT > 0 && this.flashMesh && this.flashMesh.material && this.flashMesh.material.emissive) { this.flashT -= dt; this.flashMesh.material.emissive.setHex(Math.sin(this.t * 22) > 0 ? 0xff8a3a : 0x663311); }
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
