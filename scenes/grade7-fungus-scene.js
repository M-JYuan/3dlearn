window.Grade7FungusScene = class Grade7FungusScene {
    constructor(scene, camera, renderer) {
        this.scene = scene; this.camera = camera; this.renderer = renderer; this.id = 'grade7-fungus';
        this.group = null; this.lights = []; this.interactables = []; this.btns = {}; this.parts = [];
        this.t = 0; this.budT = 0; this.budPlay = false; this.stained = false; this.explode = false;
        this.gloves = false; this.maskOn = false; this.goggles = false; this.lidOpen = false; this.sterile = false;
        this.focus = ''; this.nucleusMode = false; this.noChloroT = 0; this.flashT = 0; this.flashMesh = null;
    }
    init() {
        this.camera.position.set(0.2, 3.35, 8.1); this.camera.lookAt(0.15, 1.15, 0); this.scene.background = new THREE.Color(0xe4ebe7);
        const hemi = new THREE.HemisphereLight(0xf7f8f4, 0xcbbda8, 0.66); const key = new THREE.DirectionalLight(0xffffff, 0.88); key.position.set(3.2, 6.2, 4);
        const rim = new THREE.DirectionalLight(0xd5e6ea, 0.32); rim.position.set(-4, 2.5, -2);
        [hemi, key, rim].forEach((light) => { this.scene.add(light); this.lights.push(light); });
        this.group = new THREE.Group(); this.scene.add(this.group);
        this.add(this.group, new THREE.BoxGeometry(8.2, 0.16, 3.6), this.mat(0xd7d2c8), 0.1, 0.78, 0.1);
        this.nucMark = this.mat(0xf2d27a, { emissive: 0x000000 });
        this.buildYeast(); this.buildDish(); this.buildFungi(); this.buildExtras(); this.setupUI();
    }
    mat(color, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.58, metalness: 0.03 }, extra || {})); }
    add(parent, geo, material, x, y, z) { const mesh = new THREE.Mesh(geo, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh; }
    clickable(mesh, name, desc) { mesh.userData.name = name; mesh.userData.description = desc; this.interactables.push(mesh); return mesh; }
    tag(parent, text, x, y, z, w) {
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 128;
        const pen = canvas.getContext('2d'); pen.fillStyle = '#f7f4ec'; pen.fillRect(0, 14, 640, 100);
        pen.fillStyle = '#1d332c'; pen.font = '40px sans-serif'; pen.textAlign = 'center'; pen.textBaseline = 'middle'; pen.fillText(text, 320, 64);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
        sprite.position.set(x, y, z); sprite.scale.set(w, w * 0.2, 1); parent.add(sprite); return sprite;
    }
    track(mesh, ox, oy, oz) { mesh.userData.home = mesh.position.clone(); mesh.userData.out = new THREE.Vector3(ox, oy, oz); this.parts.push(mesh); return mesh; }
    buildYeast() {
        const g = new THREE.Group(); g.position.set(-2.35, 0.9, 0.05); this.group.add(g); this.yeastRoot = g;
        this.yeastWall = this.clickable(this.add(g, new THREE.SphereGeometry(0.62, 22, 16), this.mat(0xf0e2c4, { transparent: true, opacity: 0.28, depthWrite: false }), 0, 1.15, 0), '酵母菌细胞壁', '酵母菌是椭圆形的单细胞真菌，外有细胞壁。它没有叶绿体。');
        this.yeastWall.scale.set(1, 1.28, 1);
        this.membrane = this.track(this.clickable(this.add(g, new THREE.SphereGeometry(0.52, 18, 14), this.mat(0xe7c7a2, { transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }), 0, 1.15, 0), '细胞膜', '细胞膜在细胞壁内侧。'), -0.15, 1.2, 0.2);
        this.membrane.scale.set(1, 1.22, 1);
        this.cyto = this.track(this.clickable(this.add(g, new THREE.SphereGeometry(0.48, 18, 14), this.mat(0xf6e7c4, { transparent: true, opacity: 0.55 }), 0, 1.15, 0), '细胞质', '细胞质位于细胞膜以内。酵母菌利用现成的有机物，细胞内没有叶绿体。'), 0.15, 1.15, 0.35);
        this.cyto.scale.set(1, 1.2, 1);
        this.nucleus = this.track(this.clickable(this.add(g, new THREE.SphereGeometry(0.16, 14, 10), this.mat(0xd8c6e4, { emissive: 0x000000 }), 0.08, 1.22, 0.05), '成形的细胞核', '酵母菌有成形的细胞核。滴加碘液后，细胞核会被染成较深的颜色。'), 0.45, 1.45, 0.35);
        this.envelope = this.track(this.add(g, new THREE.SphereGeometry(0.2, 12, 10), this.mat(0xf7f7f7, { transparent: true, opacity: 0.35, depthWrite: false }), 0.08, 1.22, 0.05), 0.45, 1.45, 0.35);
        this.mito = this.track(this.clickable(this.add(g, new THREE.SphereGeometry(0.1, 10, 8), this.mat(0xd07a4a), -0.16, 1.02, 0.08), '线粒体', '酵母菌细胞内有线粒体。'), -0.55, 0.85, 0.35); this.mito.scale.set(1.4, 0.75, 0.75);
        this.vacuole = this.track(this.clickable(this.add(g, new THREE.SphereGeometry(0.16, 12, 10), this.mat(0xd5e7f5, { transparent: true, opacity: 0.8 }), -0.05, 1.32, -0.02), '液泡', '酵母菌细胞内有液泡。'), -0.4, 1.6, 0.25);
        this.bud = new THREE.Group(); g.add(this.bud);
        this.clickable(this.add(this.bud, new THREE.SphereGeometry(0.36, 14, 10), this.mat(0xf0e2c4, { transparent: true, opacity: 0.45 }), 0, 0, 0), '芽体', '酵母菌长出芽体。芽体长大后可以离开母体。这不是孢子炸开。');
        this.budNucleus = this.clickable(this.add(this.bud, new THREE.SphereGeometry(0.08, 10, 8), this.mat(0xd8c6e4, { emissive: 0x000000 }), 0, 0, 0.02), '芽体里的细胞核', '芽体也有成形的细胞核。碘液同样能把它染深。');
        this.chloroGhost = new THREE.Group(); this.chloroGhost.visible = false; g.add(this.chloroGhost);
        this.add(this.chloroGhost, new THREE.SphereGeometry(0.12, 10, 8), this.mat(0x7dba67), 0.95, 1.7, 0);
        const cross = this.add(this.chloroGhost, new THREE.BoxGeometry(0.34, 0.04, 0.04), this.mat(0xb33b3b), 0.95, 1.7, 0.05); cross.rotation.z = 0.8;
        this.tag(this.chloroGhost, '无叶绿体', 0.95, 2.05, 0, 1.15); this.tag(g, '酵母菌', 0, 2.15, 0, 1.15);
    }
    buildDish() {
        const root = new THREE.Group(); root.position.set(0.15, 0.9, 0.05); this.group.add(root);
        const glass = this.mat(0xd7eeea, { transparent: true, opacity: 0.32, roughness: 0.08, side: THREE.DoubleSide });
        this.add(root, new THREE.CylinderGeometry(0.95, 0.95, 0.08, 24), glass, 0, 0.04, 0);
        this.add(root, new THREE.CylinderGeometry(0.95, 0.95, 0.55, 24, 1, true), glass, 0, 0.32, 0);
        this.peel = this.clickable(this.add(root, new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), this.mat(0xef8a3a), 0, 0.16, 0), '橘皮', '橘皮是培养青霉的材料，不是食物，不能吃。营养菌丝伸进皮里吸收有机物。');
        this.peel.scale.set(1.25, 0.7, 1);
        this.feedMat = this.mat(0xe3d2a4, { emissive: 0x000000 }); this.aerialMat = this.mat(0xf4f4f4, { emissive: 0x000000 }); this.sporeMat = this.mat(0x3e8f6a, { roughness: 0.8 });
        for (let i = 0; i < 5; i++) { const h = this.clickable(this.add(root, new THREE.CylinderGeometry(0.018, 0.018, 0.36, 6), this.feedMat, Math.cos(i) * 0.18, 0.12, Math.sin(i) * 0.14), '营养菌丝', '营养菌丝长进橘皮内部，吸收其中的有机物。青霉不能进行光合作用。'); h.rotation.z = 0.5; h.rotation.y = i; }
        this.aerial = new THREE.Group(); this.aerial.position.y = -0.34; root.add(this.aerial);
        for (let i = 0; i < 3; i++) {
            const x = -0.18 + i * 0.18;
            this.clickable(this.add(this.aerial, new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6), this.aerialMat, x, 0.48, 0.04 * i), '气生菌丝', '直立的气生菌丝呈白色。顶端像扫帚，上面串着孢子。孢子留在链上，不会炸开。');
            for (let k = 0; k < 4; k++) {
                const ang = (k / 4) * Math.PI * 2;
                const br = this.add(this.aerial, new THREE.CylinderGeometry(0.01, 0.01, 0.12, 4), this.aerialMat, x + Math.cos(ang) * 0.05, 0.7, 0.04 * i + Math.sin(ang) * 0.05);
                br.rotation.z = Math.cos(ang) * 0.7; br.rotation.x = Math.sin(ang) * 0.7;
                for (let s = 0; s < 3; s++) this.clickable(this.add(this.aerial, new THREE.SphereGeometry(0.022, 6, 5), this.sporeMat, x + Math.cos(ang) * (0.07 + s * 0.015), 0.78 + s * 0.04, 0.04 * i + Math.sin(ang) * (0.07 + s * 0.015)), '孢子链', '扫帚状分支上有成串的孢子。它们留在链上。观察时不要碰，看完要灭菌。');
            }
        }
        this.lid = new THREE.Group(); this.lid.position.y = 0.62; root.add(this.lid);
        this.add(this.lid, new THREE.CylinderGeometry(1.02, 1.02, 0.06, 24), glass, 0, 0.08, 0);
        this.clickable(this.add(this.lid, new THREE.CylinderGeometry(1.02, 1.02, 0.1, 24, 1, true), glass, 0, 0.02, 0), '培养皿的盖', '没戴好手套、口罩和护目镜时，盖子保持关闭。打开也只是为了观察，不能触摸、品尝或凑近去闻。看完要灭菌。');
        this.lockBar = this.add(this.lid, new THREE.BoxGeometry(1.3, 0.04, 0.08), this.mat(0xb33b3b, { emissive: 0x000000 }), 0, 0.16, 0);
        this.warnRing = this.add(root, new THREE.TorusGeometry(1.05, 0.02, 8, 24), this.mat(0xc47b2a, { emissive: 0x8a4e12 }), 0, 0.02, 0); this.warnRing.rotation.x = Math.PI / 2;
        this.warnTag = this.tag(root, '只观察勿触摸', 0, 1.15, 0.85, 1.5);
        this.steam = []; for (let i = 0; i < 4; i++) { const puff = this.add(root, new THREE.SphereGeometry(0.06, 8, 6), this.mat(0xffffff, { transparent: true, opacity: 0, depthWrite: false }), -0.15 + i * 0.1, 0.9, 0.3); puff.userData.phase = i; this.steam.push(puff); }
        this.sterilizer = this.clickable(this.add(this.group, new THREE.BoxGeometry(0.7, 0.55, 0.45), this.mat(0x8ea4a8, { emissive: 0x000000 }), 1.55, 1.15, -0.85), '灭菌箱', '观察结束后要把培养皿再次灭菌。不要把青霉带走，也不要碰孢子。');
        this.tag(this.group, '用后灭菌', 1.55, 1.55, -0.85, 1.15);
    }
    buildFungi() {
        const g = new THREE.Group(); g.position.set(2.45, 0.9, 0.05); this.group.add(g); this.trio = g;
        const log = this.add(g, new THREE.CylinderGeometry(0.2, 0.22, 1.7, 12), this.mat(0x7a5a3c, { roughness: 0.9 }), 0, 0.28, 0); log.rotation.z = Math.PI / 2;
        this.mushroom = new THREE.Group(); this.mushroom.position.set(-0.45, 0.4, 0); g.add(this.mushroom);
        this.clickable(this.add(this.mushroom, new THREE.CylinderGeometry(0.07, 0.09, 0.32, 10), this.mat(0xf3e2c4), 0, 0.16, 0), '蘑菇', '蘑菇是比较大的真菌，细胞里有成形的细胞核。它不能进行光合作用。');
        this.clickable(this.add(this.mushroom, new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.mat(0x8d4e32), 0, 0.32, 0), '蘑菇菌盖', '蘑菇由许多有成形细胞核的细胞构成，利用现成的有机物生活。');
        this.add(this.mushroom, new THREE.SphereGeometry(0.04, 8, 6), this.nucMark, 0.08, 0.4, 0.08);
        this.woodEar = this.clickable(this.add(g, new THREE.SphereGeometry(0.22, 14, 10, 0, Math.PI, 0, Math.PI), this.mat(0x4a2b22, { roughness: 0.85, side: THREE.DoubleSide }), 0.05, 0.48, 0.05), '木耳', '木耳也是真菌，细胞有成形的细胞核，不能自己进行光合作用。');
        this.woodEar.scale.set(1, 1.15, 0.38); this.woodEar.rotation.z = 0.4; this.add(g, new THREE.SphereGeometry(0.035, 8, 6), this.nucMark, 0.12, 0.58, 0.12);
        this.silver = new THREE.Group(); this.silver.position.set(0.5, 0.5, 0); g.add(this.silver);
        for (let i = 0; i < 4; i++) { const lobe = this.clickable(this.add(this.silver, new THREE.SphereGeometry(0.12 + (i % 2) * 0.03, 10, 8), this.mat(0xfff6e8, { transparent: true, opacity: 0.86, roughness: 0.35 }), Math.cos(i) * 0.08, i * 0.05, Math.sin(i) * 0.06), '银耳', '银耳是较大的真菌，同样有成形的细胞核，不能进行光合作用。'); lobe.scale.set(1, 1.2, 0.45); }
        this.add(this.silver, new THREE.SphereGeometry(0.035, 8, 6), this.nucMark, 0.02, 0.12, 0.08); this.tag(g, '较大真菌', 0, 1.05, 0.45, 1.25);
    }
    buildExtras() {
        this.bigCell = new THREE.Group(); this.bigCell.position.set(-2.3, 0.9, 0.2); this.bigCell.visible = false; this.group.add(this.bigCell);
        this.clickable(this.add(this.bigCell, new THREE.CylinderGeometry(0.42, 0.42, 1.1, 16), this.mat(0xf3e6cf, { transparent: true, opacity: 0.4, side: THREE.DoubleSide }), 0, 1.15, 0), '菌丝细胞的细胞壁', '青霉的菌丝由许多细胞连接而成。每个细胞都有细胞壁、细胞膜、细胞质和成形的细胞核。');
        this.clickable(this.add(this.bigCell, new THREE.CylinderGeometry(0.34, 0.34, 0.92, 14), this.mat(0xf6e1b8, { transparent: true, opacity: 0.75 }), 0, 1.15, 0), '菌丝细胞的细胞质', '菌丝里的每个细胞都有细胞质和成形的细胞核，所以真菌是真核生物。');
        this.clickable(this.add(this.bigCell, new THREE.SphereGeometry(0.14, 12, 10), this.nucMark, 0.05, 1.2, 0.08), '菌丝细胞的细胞核', '成形的细胞核外面有核膜。青霉和酵母菌都因此属于真核生物。');
        this.add(this.bigCell, new THREE.CylinderGeometry(0.43, 0.43, 0.03, 12), this.mat(0xe7d3b0), 0, 0.6, 0);
        this.add(this.bigCell, new THREE.CylinderGeometry(0.43, 0.43, 0.03, 12), this.mat(0xe7d3b0), 0, 1.7, 0);
        this.tag(this.bigCell, '一个菌丝细胞', 0, 2.05, 0, 1.7);
        this.euGroup = new THREE.Group(); this.euGroup.position.set(-2.35, 0.9, 1.15); this.euGroup.visible = false; this.group.add(this.euGroup);
        const fish = this.add(this.euGroup, new THREE.SphereGeometry(0.16, 10, 8), this.mat(0x7ea0c4), -0.55, 0.55, 0); fish.scale.set(1.5, 0.7, 0.55);
        const tail = this.add(this.euGroup, new THREE.ConeGeometry(0.08, 0.16, 8), this.mat(0x7ea0c4), -0.78, 0.55, 0); tail.rotation.z = Math.PI / 2;
        this.add(this.euGroup, new THREE.SphereGeometry(0.04, 8, 6), this.nucMark, -0.55, 0.55, 0.06); this.tag(this.euGroup, '动物', -0.55, 0.9, 0, 0.7);
        const leaf = this.add(this.euGroup, new THREE.SphereGeometry(0.14, 10, 8), this.mat(0x6aaa55), 0, 0.58, 0); leaf.scale.set(1.3, 0.7, 0.2);
        this.add(this.euGroup, new THREE.SphereGeometry(0.035, 8, 6), this.nucMark, 0, 0.58, 0.05); this.tag(this.euGroup, '植物', 0, 0.9, 0, 0.7);
        this.add(this.euGroup, new THREE.CylinderGeometry(0.04, 0.05, 0.16, 8), this.mat(0xf3e2c4), 0.55, 0.48, 0);
        this.add(this.euGroup, new THREE.SphereGeometry(0.1, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.mat(0x8d4e32), 0.55, 0.58, 0);
        this.add(this.euGroup, new THREE.SphereGeometry(0.035, 8, 6), this.nucMark, 0.55, 0.62, 0.05); this.tag(this.euGroup, '真菌', 0.55, 0.9, 0, 0.7);
        const fig = new THREE.Group(); fig.position.set(-3.35, 0.86, 1.25); this.group.add(fig);
        this.add(fig, new THREE.BoxGeometry(0.32, 0.46, 0.16), this.mat(0x4d6f8a), 0, 0.42, 0);
        this.add(fig, new THREE.SphereGeometry(0.12, 12, 10), this.mat(0xf0c7a8), 0, 0.8, 0);
        this.handL = this.clickable(this.add(fig, new THREE.SphereGeometry(0.05, 8, 6), this.mat(0xf0c7a8), -0.24, 0.32, 0.02), '观察者的手', '手要戴手套，并且始终放在身体两侧，不伸进培养皿。');
        this.handR = this.add(fig, new THREE.SphereGeometry(0.05, 8, 6), this.mat(0xf0c7a8), 0.24, 0.32, 0.02);
        this.faceMask = this.add(fig, new THREE.BoxGeometry(0.14, 0.08, 0.05), this.mat(0xf7f7f7), 0, 0.75, 0.09); this.faceMask.visible = false;
        this.goggleL = this.add(fig, new THREE.TorusGeometry(0.035, 0.01, 6, 10), this.mat(0x356b86), -0.045, 0.84, 0.1);
        this.goggleR = this.add(fig, new THREE.TorusGeometry(0.035, 0.01, 6, 10), this.mat(0x356b86), 0.045, 0.84, 0.1);
        this.goggleL.visible = false; this.goggleR.visible = false;
        this.plaque = this.clickable(this.add(this.group, new THREE.BoxGeometry(1.5, 0.7, 0.05), this.mat(0x2c3338), 2.45, 1.55, 0.15), '寄生提示', '有的真菌会寄生在人身上。这里不介绍表现，也不提供任何处理办法。'); this.plaque.visible = false;
        this.sunCross = new THREE.Group(); this.sunCross.position.set(2.45, 1.7, -0.55); this.sunCross.visible = false; this.group.add(this.sunCross);
        this.add(this.sunCross, new THREE.SphereGeometry(0.16, 10, 8), this.mat(0xf0c14a), 0, 0, 0);
        const bar = this.add(this.sunCross, new THREE.BoxGeometry(0.42, 0.045, 0.045), this.mat(0xb33b3b), 0, 0, 0.04); bar.rotation.z = 0.8;
    }
    setupUI() {
        const title = document.getElementById('info-title'); if (title) title.textContent = '真菌';
        const controls = document.getElementById('scene-controls'); controls.innerHTML = '';
        const items = [['bud', '酵母出芽', () => this.budOnce()], ['iodine', '碘液染色', () => this.iodine()], ['parts', '酵母结构', () => this.yeastParts()], ['chloro', '没有叶绿体', () => this.noChloro()], ['gloves', '戴手套', () => this.toggleGear('gloves')], ['mask', '戴口罩', () => this.toggleGear('mask')], ['goggles', '戴护目镜', () => this.toggleGear('goggles')], ['open', '打开观察', () => this.openDish()], ['aerial', '气生菌丝', () => this.showHypha('aerial')], ['feed', '营养菌丝', () => this.showHypha('feed')], ['cell', '菌丝细胞', () => this.showCell()], ['nuclei', '成形细胞核', () => this.showNuclei()], ['eu', '真核生物', () => this.showEu()], ['mushroom', '蘑菇', () => this.focusFungus('mushroom')], ['wood', '木耳', () => this.focusFungus('wood')], ['silver', '银耳', () => this.focusFungus('silver')], ['sun', '不能光合', () => this.noPhoto()], ['harm', '有的会寄生', () => this.parasite()], ['finish', '观察后灭菌', () => this.finish()], ['reset', '重新实验', () => this.resetAll()]];
        items.forEach((item) => { const btn = document.createElement('button'); btn.type = 'button'; btn.id = this.id + '-' + item[0]; btn.className = 'control-btn'; btn.textContent = item[1]; btn.addEventListener('click', item[2]); controls.appendChild(btn); this.btns[item[0]] = btn; });
        this.say('酵母菌是椭圆形单细胞真菌，有细胞壁、细胞膜、细胞质、成形的细胞核、线粒体和液泡，没有叶绿体。青霉长在橘皮上：营养菌丝伸进皮里吸收有机物，直立菌丝顶端呈扫帚状并串着孢子。培养皿在戴好手套、口罩和护目镜之前保持关闭。打开只为观察，不能触摸或品尝，看完要灭菌。蘑菇、木耳和银耳是较大的真菌，也有成形的细胞核，不能光合作用。');
    }
    say(text) {
        const el = document.getElementById('info-content'); if (el) el.textContent = text;
        const mark = { iodine: this.stained, parts: this.explode, gloves: this.gloves, mask: this.maskOn, goggles: this.goggles, open: this.lidOpen, nuclei: this.nucleusMode, finish: this.sterile };
        Object.keys(this.btns).forEach((key) => { this.btns[key].style.outline = mark[key] ? '2px solid #1f6a4d' : ''; });
    }
    showYeast() { this.bigCell.visible = false; this.yeastRoot.visible = true; this.euGroup.visible = false; this.plaque.visible = false; this.sunCross.visible = false; }
    budOnce() { this.showYeast(); this.budPlay = true; this.budT = 0; this.say('酵母菌从母细胞上长出芽体。芽体逐渐变大，里面也有细胞核。这是单细胞酵母的繁殖，不是孢子炸开。'); }
    iodine() { this.showYeast(); this.stained = !this.stained; this.say(this.stained ? '滴加碘液后，细胞核被染成较深的颜色，便于观察。酵母菌有成形的细胞核，仍然没有叶绿体。' : '已去掉染色。未染色时细胞核不那么显眼，但细胞里仍然有成形的细胞核。'); }
    yeastParts() { this.showYeast(); this.explode = !this.explode; this.say(this.explode ? '结构被轻轻分开：细胞壁、细胞膜、细胞质、成形的细胞核、线粒体和液泡。酵母菌没有叶绿体。' : '结构恢复叠合。透过较透明的细胞壁，仍能看到内部。'); }
    noChloro() { this.showYeast(); this.noChloroT = 3; this.say('酵母菌细胞内没有叶绿体，不能进行光合作用，要利用现成的有机物。旁边被划掉的绿色颗粒表示没有，不是细胞里的结构。'); }
    ready() { return this.gloves && this.maskOn && this.goggles; }
    toggleGear(kind) {
        if (kind === 'gloves') this.gloves = !this.gloves; if (kind === 'mask') this.maskOn = !this.maskOn; if (kind === 'goggles') this.goggles = !this.goggles;
        if (!this.ready()) this.lidOpen = false;
        const text = { gloves: '手套', mask: '口罩', goggles: '护目镜' }[kind]; const on = kind === 'gloves' ? this.gloves : kind === 'mask' ? this.maskOn : this.goggles;
        this.say(on ? '已戴上' + text + '。防护只说明可以准备观察，不表示可以触摸或品尝培养物。' : '已取下' + text + '。未戴齐手套、口罩和护目镜时，培养皿会重新盖上。');
    }
    deny(mesh, text) {
        if (this.flashMesh && this.flashMesh !== mesh && this.flashMesh.material && this.flashMesh.material.emissive) this.flashMesh.material.emissive.setHex(0x000000);
        this.flashMesh = mesh; this.flashT = 0.8; this.say(text);
    }
    openDish() {
        if (this.sterile) return this.deny(this.sterilizer, '培养皿已经灭菌并盖好，不要再打开。可以点重新实验。');
        if (!this.ready()) return this.deny(this.lockBar, '培养皿保持关闭。请先戴上手套、口罩和护目镜，再打开观察。');
        this.lidOpen = true; this.plaque.visible = false;
        this.say('现在只是打开盖子观察青霉。橘皮不是食物。不要触摸、品尝，也不要凑近去闻。看完要点“观察后灭菌”。');
    }
    showHypha(kind) { this.focus = kind; this.plaque.visible = false; this.say(kind === 'aerial' ? '白色直立的是气生菌丝，顶端呈扫帚状，上面有成串孢子。孢子留在链上。' : '伸进橘皮的是营养菌丝，用来吸收橘皮中的有机物。橘皮不能吃。'); }
    showCell() { this.yeastRoot.visible = false; this.euGroup.visible = false; this.bigCell.visible = true; this.nucleusMode = true; this.say('把一根菌丝放大看：它由许多细胞组成。每个细胞都有细胞壁、细胞膜、细胞质和成形的细胞核。真菌因此属于真核生物。'); }
    showNuclei() { this.nucleusMode = !this.nucleusMode; this.say(this.nucleusMode ? '发亮处是成形的细胞核。酵母菌、青霉的菌丝细胞，以及蘑菇、木耳、银耳都有。真菌和动物、植物一样是真核生物。' : '已取消细胞核高亮。这些细胞核仍然存在。'); }
    showEu() { this.bigCell.visible = false; this.yeastRoot.visible = true; this.euGroup.visible = true; this.nucleusMode = true; this.plaque.visible = false; this.say('真菌有成形的细胞核，属于真核生物。动物和植物也是真核生物。这一点和没有成形细胞核的细菌不同。'); }
    focusFungus(kind) {
        this.mushroom.scale.setScalar(kind === 'mushroom' ? 1.35 : 1);
        this.woodEar.scale.set(kind === 'wood' ? 1.25 : 1, kind === 'wood' ? 1.4 : 1.15, kind === 'wood' ? 0.5 : 0.38);
        this.silver.scale.setScalar(kind === 'silver' ? 1.35 : 1); this.nucleusMode = true; this.plaque.visible = false;
        this.say({ mushroom: '蘑菇', wood: '木耳', silver: '银耳' }[kind] + '是比较大的真菌，身体由有成形细胞核的细胞构成，不能进行光合作用，要利用现成的有机物。');
    }
    noPhoto() { this.sunCross.visible = true; this.plaque.visible = false; this.say('酵母菌、青霉、蘑菇、木耳和银耳都不能进行光合作用。它们没有叶绿体，靠吸收现成的有机物生活。'); }
    parasite() { this.plaque.visible = true; this.sunCross.visible = false; this.say('有的真菌会寄生在人身上。这一课不介绍表现，也不提供任何处理办法。'); }
    finish() { this.sterile = true; this.lidOpen = false; this.say('观察结束，培养皿已再次灭菌并盖好。不要再打开，不要碰孢子，也不要把青霉带走。'); }
    resetAll() {
        this.stained = false; this.explode = false; this.gloves = false; this.maskOn = false; this.goggles = false; this.lidOpen = false; this.sterile = false; this.focus = ''; this.nucleusMode = false; this.noChloroT = 0; this.budPlay = false; this.budT = 0;
        this.showYeast(); this.mushroom.scale.setScalar(1); this.woodEar.scale.set(1, 1.15, 0.38); this.silver.scale.setScalar(1);
        this.say('模型已复位，培养皿关闭。观察青霉前仍要戴手套、口罩和护目镜。培养物不能触摸或品尝。');
    }
    animate(time, delta) {
        const dt = Math.min(Math.max(delta, 0), 0.05); this.t += dt;
        if (this.flashT <= 0 && this.flashMesh && this.flashMesh.material && this.flashMesh.material.emissive) this.flashMesh.material.emissive.setHex(0x000000);
        if (this.flashT <= 0) this.flashMesh = null;
        if (this.budPlay) { this.budT += dt * 0.28; if (this.budT > 1.15) this.budPlay = false; }
        const budK = Math.max(0, Math.min(1, this.budT));
        this.bud.position.set(0.55 + budK * 0.25, 1.35, 0.1); this.bud.scale.setScalar(Math.max(0.001, 0.15 + budK * 0.7)); this.budNucleus.visible = budK > 0.35;
        const nucColor = this.stained ? 0x4a2c12 : 0xd8c6e4;
        this.nucleus.material.color.setHex(nucColor); this.budNucleus.material.color.setHex(nucColor); this.cyto.material.color.setHex(this.stained ? 0xd8b15a : 0xf6e7c4);
        this.nucleus.material.emissive.setHex(this.nucleusMode ? 0xc9a227 : 0x000000); this.budNucleus.material.emissive.setHex(this.nucleusMode ? 0xc9a227 : 0x000000);
        this.parts.forEach((mesh) => mesh.position.lerpVectors(mesh.userData.home, mesh.userData.out, this.explode ? 1 : 0));
        this.chloroGhost.visible = this.noChloroT > 0; this.noChloroT = Math.max(0, this.noChloroT - dt);
        const ppe = this.ready(); this.lockBar.visible = !ppe && !this.lidOpen;
        this.handL.material.color.setHex(this.gloves ? 0x6a5acd : 0xf0c7a8); this.handR.material.color.setHex(this.gloves ? 0x6a5acd : 0xf0c7a8);
        this.faceMask.visible = this.maskOn; this.goggleL.visible = this.goggles; this.goggleR.visible = this.goggles;
        const lift = this.lidOpen && !this.sterile;
        this.lid.position.y = lift ? 1.15 : 0.62; this.lid.rotation.z = lift ? -0.7 : 0; this.lid.position.x = lift ? 0.35 : 0;
        this.warnRing.visible = lift; this.warnTag.visible = lift;
        this.aerialMat.color.setHex(this.sterile ? 0xbdbdbd : 0xf4f4f4); this.aerialMat.emissive.setHex(this.focus === 'aerial' && !this.sterile ? 0xfff2c4 : 0x000000);
        this.feedMat.color.setHex(this.sterile ? 0xbdbdbd : 0xe3d2a4); this.feedMat.emissive.setHex(this.focus === 'feed' && !this.sterile ? 0xffe0a0 : 0x000000);
        this.sporeMat.color.setHex(this.sterile ? 0x9a9a9a : 0x3e8f6a);
        this.peel.material.opacity = this.focus === 'feed' ? 0.35 : 1; this.peel.material.transparent = this.focus === 'feed';
        this.sterilizer.material.emissive.setHex(this.sterile ? 0xc45a2a : 0x000000);
        this.steam.forEach((puff) => { const wave = (this.t * 0.35 + puff.userData.phase * 0.2) % 1; puff.visible = this.sterile; puff.position.y = 0.85 + wave * 0.35; puff.material.opacity = this.sterile ? (1 - wave) * 0.35 : 0; });
        this.nucMark.emissive.setHex(this.nucleusMode ? 0xc9a227 : 0x000000); this.nucMark.emissiveIntensity = this.nucleusMode ? 0.45 + Math.sin(this.t * 3) * 0.35 : 0;
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
