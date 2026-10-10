window.Grade7PlantGroupsScene = class Grade7PlantGroupsScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-plant-groups';
        this.group = null;
        this.lights = [];
        this.geos = [];
        this.mats = [];
        this.interactables = [];
        this.kinds = {};
        this.motions = [];
        this.clock = 0;
        this.dyingSpores = [];
        this.waterDrop = null;
        this.waterBaseY = 0;
        this.ground = null;
        this.copy = {
            sumian: ['水绵（藻类）', '水绵生活在水中，身体呈细丝状。藻类主要生活在水里，有色素，能够进行光合作用。它没有根、茎、叶，全身都能吸收水和无机盐，也可以用孢子繁殖。学者对藻类算不算植物意见并不一致，不能说所有藻类都是植物。紫菜和海带是海藻。', 0x8fb7d6],
            huluye: ['葫芦藓', '葫芦藓生活在阴湿处。像茎的部分没有输导组织，像叶的部分没有叶脉，基部像根的结构是假根，并不是真正的根。', 0x6d7a62],
            shenjue: ['肾蕨', '肾蕨有真正的根、茎、叶，也有输导组织，所以比葫芦藓更高大，结构更复杂。它不产生种子，翻起的那片叶背面有长孢子的小包。铁线蕨也是蕨类。浅色细条只表示输导组织。', 0x6a7d55],
            yousong: ['油松（裸子植物）', '油松是种子植物，也是裸子植物。球果不是果实，木质鳞片的缝隙里种子是裸露的。根、茎、叶发达并有输导组织，因此能在干旱、贫瘠的土壤里长得高大。银杏和水杉也是这一类，人们看到的肉质部分并不是果实。', 0xc2ad7a],
            shuidao: ['水稻（被子植物）', '水稻是被子植物，也就是开花植物。种子包在果实里。它有根、茎、叶、花、果实、种子六种器官，输导组织发达。菜豆是双子叶植物，玉米是单子叶植物；这里不解剖种子。', 0x7f9a62],
            spore: ['孢子', '孢子只是一个细胞。环境必须又温暖又潮湿，否则它很快死亡。左边是温暖潮湿，孢子保持完整；右边分别是干燥和寒冷，孢子萎缩。', 0xd5d8dc],
            seed: ['种子', '种子可以在干燥或寒冷中等待。种子植物完成受精，也不必依靠外界的水。水滴停在花和球果一旁，并不进入受精的位置。', 0xd7d3c8]
        };
    }

    init() {
        this.camera.position.set(0.4, 2.8, 7.5);
        this.camera.lookAt(0, 1.0, 0);
        this.scene.background = new THREE.Color(0xd7e6ea);
        this.setupLights();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.g = {
            sphere: new THREE.SphereGeometry(1, 12, 8),
            cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
            box: new THREE.BoxGeometry(1, 1, 1),
            plane: new THREE.PlaneGeometry(1, 1),
            circle: new THREE.CircleGeometry(1, 28),
            cone: new THREE.ConeGeometry(1, 1, 9)
        };
        Object.keys(this.g).forEach((key) => this.geos.push(this.g[key]));
        this.mat = {
            alga: this.makeMat(0x2f9a45, { roughness: 0.45 }),
            glass: this.makeMat(0xd5e7ef, { transparent: true, opacity: 0.28, roughness: 0.15 }),
            water: this.makeMat(0x67b4dc, { transparent: true, opacity: 0.55, roughness: 0.2 }),
            damp: this.makeMat(0x4e5c45),
            rhizoid: this.makeMat(0x8a6244),
            mossStem: this.makeMat(0x3e7a38),
            mossLeaf: this.makeMat(0x67a84b, { side: THREE.DoubleSide, roughness: 0.55 }),
            root: this.makeMat(0x7a5336),
            fernStem: this.makeMat(0x2f6b34),
            fernLeaf: this.makeMat(0x217a3a, { side: THREE.DoubleSide }),
            sori: this.makeMat(0x6b4128),
            vein: this.makeMat(0xd6c36a, { emissive: 0x5a4a20, emissiveIntensity: 0.35 }),
            bark: this.makeMat(0x7a5132, { roughness: 0.9 }),
            needle: this.makeMat(0x1d5a32),
            wood: this.makeMat(0xa67b49, { roughness: 0.82 }),
            pineSeed: this.makeMat(0xe6d7a2),
            sand: this.makeMat(0xd2be8d),
            mud: this.makeMat(0x6b543c),
            riceStem: this.makeMat(0x7ea24a),
            riceLeaf: this.makeMat(0x8fbf4e, { side: THREE.DoubleSide }),
            flower: this.makeMat(0xf4f0d8, { side: THREE.DoubleSide }),
            grain: this.makeMat(0xe2c56a),
            shell: this.makeMat(0xe6d48a, { transparent: true, opacity: 0.42, roughness: 0.35 }),
            innerSeed: this.makeMat(0xf3e2a4),
            padMoist: this.makeMat(0x6eae78),
            padDry: this.makeMat(0xd2b07a),
            padCold: this.makeMat(0xb9c7d6),
            spore: this.makeMat(0x47a35a),
            sporeDying: this.makeMat(0x8a8f6a, { transparent: true, opacity: 0.7 }),
            drop: this.makeMat(0x79c2e8, { transparent: true, opacity: 0.8 }),
            ground: this.makeMat(0x8fb7d6)
        };
        this.ground = this.disc(this.group, this.mat.ground, 0, 0, 4.2);
        this.addKind('sumian', (g) => this.buildAlgae(g));
        this.addKind('huluye', (g) => this.buildMoss(g));
        this.addKind('shenjue', (g) => this.buildFern(g));
        this.addKind('yousong', (g) => this.buildPine(g));
        this.addKind('shuidao', (g) => this.buildRice(g));
        this.addKind('spore', (g) => this.buildSpore(g));
        this.addKind('seed', (g) => this.buildSeed(g));
        this.setupUI();
        this.show('sumian');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.68);
        const sun = new THREE.DirectionalLight(0xfff4e4, 1.05);
        sun.position.set(4.5, 8, 5);
        const fill = new THREE.DirectionalLight(0xc5d4ff, 0.32);
        fill.position.set(-5, 3, -2);
        [ambient, sun, fill].forEach((light) => {
            this.scene.add(light);
            this.lights.push(light);
        });
    }

    makeMat(color, extra) {
        const material = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.72, metalness: 0.03 }, extra || {}));
        this.mats.push(material);
        return material;
    }

    mesh(parent, geometry, material, x, y, z, s, name, desc) {
        const obj = new THREE.Mesh(geometry, material);
        obj.position.set(x, y, z);
        if (Array.isArray(s)) obj.scale.set(s[0], s[1], s[2]);
        else if (typeof s === 'number') obj.scale.setScalar(s);
        parent.add(obj);
        if (name) {
            obj.userData.name = name;
            obj.userData.description = desc;
            this.interactables.push(obj);
        }
        return obj;
    }

    disc(parent, material, x, z, s, name, desc) {
        const pad = this.mesh(parent, this.g.circle, material, x, 0.02, z, s || 1, name, desc);
        pad.rotation.x = -Math.PI / 2;
        return pad;
    }

    addKind(name, builder) {
        const holder = new THREE.Group();
        this.group.add(holder);
        this.kinds[name] = holder;
        builder(holder);
    }

    buildAlgae(g) {
        this.mesh(g, this.g.cyl, this.mat.glass, 0, 0.16, 0, [1.5, 0.28, 1.5]);
        const text = '水绵是丝状藻类，生活在水中。没有根、茎、叶，全身都能吸收水和无机盐，有色素，能进行光合作用，也可以用孢子繁殖。';
        this.mesh(g, this.g.cyl, this.mat.water, 0, 0.24, 0, [1.28, 0.14, 1.28], '水中的水绵', text);
        for (let f = 0; f < 6; f += 1) {
            const filament = new THREE.Group();
            const angle = f * 1.05;
            filament.position.set(Math.cos(angle) * 0.38, 0.3, Math.sin(angle) * 0.3);
            filament.rotation.z = -0.35 + f * 0.12;
            g.add(filament);
            for (let i = 0; i < 11; i += 1) {
                this.mesh(filament, this.g.sphere, this.mat.alga, Math.sin(i * 0.8) * 0.05, i * 0.078, Math.cos(i * 0.65) * 0.04, [0.055, 0.072, 0.055], '水绵', text);
            }
            this.motions.push({ obj: filament, axis: 'z', base: filament.rotation.z, amp: 0.08, speed: 0.85, phase: f });
        }
    }

    buildMoss(g) {
        this.mesh(g, this.g.sphere, this.mat.damp, 0, 0.02, 0, [1.35, 0.16, 1.05]);
        const stemText = '葫芦藓长在阴湿处。像茎的部分没有输导组织。';
        const leafText = '像叶的部分没有叶脉。';
        const rootText = '基部这个像根的部分是假根，不是真正的根。';
        for (let i = 0; i < 8; i += 1) {
            const plant = new THREE.Group();
            const angle = (i / 8) * Math.PI * 2;
            const radius = 0.16 + (i % 3) * 0.24;
            plant.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
            g.add(plant);
            const height = 0.42 + (i % 4) * 0.07;
            this.mesh(plant, this.g.cyl, this.mat.rhizoid, 0, 0.05, 0, [0.014, 0.14, 0.014], '假根', rootText);
            this.mesh(plant, this.g.cyl, this.mat.mossStem, 0, 0.12 + height / 2, 0, [0.022, height, 0.022], '茎状部分', stemText);
            for (let k = 0; k < 4; k += 1) {
                const leaf = this.mesh(plant, this.g.plane, this.mat.mossLeaf, 0, 0.24 + k * 0.09, 0, [0.16, 0.065, 1], '叶状部分', leafText);
                leaf.rotation.y = k * 1.25 + angle;
                leaf.rotation.z = 0.65;
                leaf.position.x = Math.cos(leaf.rotation.y) * 0.06;
                leaf.position.z = Math.sin(leaf.rotation.y) * 0.06;
            }
            this.motions.push({ obj: plant, axis: 'z', base: 0, amp: 0.045, speed: 1.1, phase: i });
        }
    }

    buildFern(g) {
        this.disc(g, this.mat.damp, 0, 0, 1.5);
        for (let i = 0; i < 6; i += 1) {
            const angle = (i / 6) * Math.PI * 2;
            const root = this.mesh(g, this.g.cyl, this.mat.root, Math.cos(angle) * 0.22, 0.08, Math.sin(angle) * 0.22, [0.028, 0.26, 0.028], '肾蕨的根', '这是真正的根。肾蕨也有茎、叶和输导组织，比苔藓更高大。');
            root.rotation.z = Math.cos(angle) * 0.8;
            root.rotation.x = -Math.sin(angle) * 0.8;
        }
        const stem = this.mesh(g, this.g.cyl, this.mat.fernStem, 0, 0.28, 0, [0.07, 0.95, 0.07], '肾蕨的茎', '这是真正的茎。浅色细条表示输导组织，只是示意图。肾蕨没有种子。');
        stem.rotation.z = Math.PI / 2;
        const vein = this.mesh(g, this.g.cyl, this.mat.vein, 0, 0.28, 0.08, [0.022, 0.98, 0.022], '输导组织', '肾蕨体内有输导组织。这条浅色不是实物的真实颜色。');
        vein.rotation.z = Math.PI / 2;
        this.frond(g, -0.7, 0.15, false);
        this.frond(g, 0.15, -1.15, true);
        this.frond(g, 0.9, 0.2, false);
        const ref = new THREE.Group();
        ref.position.set(-1.9, 0, 0.35);
        ref.scale.setScalar(0.4);
        g.add(ref);
        this.buildMoss(ref);
    }

    frond(parent, yaw, tilt, withSori) {
        const frond = new THREE.Group();
        frond.rotation.y = yaw;
        frond.rotation.x = tilt;
        parent.add(frond);
        const leafText = withSori
            ? '示意图把这一片叶翻起，便于看见背面长孢子的小包。肾蕨没有种子。铁线蕨也是蕨类。'
            : '肾蕨有真正的叶，植株比葫芦藓更复杂。';
        this.mesh(frond, this.g.cyl, this.mat.fernStem, 0, 0.9, 0, [0.028, 1.65, 0.028], '肾蕨的叶', leafText);
        for (let i = 0; i < 6; i += 1) {
            [-1, 1].forEach((side) => {
                const y = 0.4 + i * 0.22;
                const leaf = this.mesh(frond, this.g.plane, this.mat.fernLeaf, side * 0.16, y, 0, [0.28, 0.14, 1], '肾蕨的叶', leafText);
                leaf.rotation.z = side * 0.45;
                if (withSori) this.mesh(frond, this.g.sphere, this.mat.sori, side * 0.16, y, 0.03, 0.038, '叶背的小包', '这些小包在叶的背面，里面会形成孢子。肾蕨不产生种子。');
            });
        }
    }

    buildPine(g) {
        this.disc(g, this.mat.sand, 0, 0, 1.8);
        for (let i = 0; i < 5; i += 1) {
            const angle = (i / 5) * Math.PI * 2;
            const root = this.mesh(g, this.g.cyl, this.mat.root, Math.cos(angle) * 0.28, 0.08, Math.sin(angle) * 0.28, [0.035, 0.28, 0.035], '油松的根', '油松的根发达，并有输导组织，能在干旱、贫瘠的土壤里支撑高大的植株。');
            root.rotation.z = Math.cos(angle);
            root.rotation.x = -Math.sin(angle);
        }
        const stemText = '茎很发达。中间露出的浅色细条表示输导组织，只是示意图。';
        this.mesh(g, this.g.cyl, this.mat.bark, 0, 0.48, 0, [0.16, 0.9, 0.16], '油松的茎', stemText);
        this.mesh(g, this.g.cyl, this.mat.bark, 0, 1.45, 0, [0.11, 0.85, 0.11], '油松的茎', stemText);
        this.mesh(g, this.g.cyl, this.mat.vein, 0, 1.02, 0.12, [0.035, 0.42, 0.035], '输导组织', '油松的根、茎、叶里都有输导组织，所以植株可以长得高大。');
        const leafText = '油松的叶发达。它是裸子植物，种子不包在果实中。';
        for (let layer = 0; layer < 3; layer += 1) {
            for (let i = 0; i < 6; i += 1) {
                const angle = (i / 6) * Math.PI * 2 + layer;
                const bundle = new THREE.Group();
                const radius = 0.42 - layer * 0.1;
                bundle.position.set(Math.cos(angle) * radius, 1.25 + layer * 0.42, Math.sin(angle) * radius);
                bundle.rotation.y = -angle;
                bundle.rotation.z = 0.85;
                g.add(bundle);
                for (let n = 0; n < 3; n += 1) {
                    this.mesh(bundle, this.g.cyl, this.mat.needle, (n - 1) * 0.03, 0.16, 0, [0.012, 0.34, 0.012], '油松的叶', leafText);
                }
                this.motions.push({ obj: bundle, axis: 'z', base: bundle.rotation.z, amp: 0.035, speed: 0.7, phase: i + layer });
            }
        }
        this.buildCone(g, 0.48, 1.05, 0.32);
    }

    buildCone(parent, x, y, z) {
        const cone = new THREE.Group();
        cone.position.set(x, y, z);
        cone.rotation.z = 0.35;
        parent.add(cone);
        const scaleText = '这是球果上的木质鳞片，球果不是果实。';
        const seedText = '种子裸露在鳞片之间的缝隙里，没有包进果实。银杏和水杉也是裸子植物，肉质部分同样不是果实。';
        for (let i = 0; i < 10; i += 1) {
            const angle = i * 1.15;
            const radius = 0.1 + i * 0.012;
            const scale = this.mesh(cone, this.g.box, this.mat.wood, Math.cos(angle) * radius, i * 0.055, Math.sin(angle) * radius, [0.2, 0.042, 0.12], '木质鳞片', scaleText);
            scale.rotation.y = -angle;
            scale.rotation.z = 0.35;
            if (i % 2 === 0) {
                this.mesh(cone, this.g.sphere, this.mat.pineSeed, Math.cos(angle) * radius * 0.42, i * 0.055 + 0.03, Math.sin(angle) * radius * 0.42, [0.032, 0.05, 0.028], '裸露的种子', seedText);
            }
        }
    }

    buildRice(g) {
        const mud = this.disc(g, this.mat.mud, 0, 0, 1);
        mud.scale.set(1.7, 1, 1.2);
        this.mesh(g, this.g.cyl, this.mat.water, 0, 0.06, 0, [1.45, 0.06, 1.05]);
        for (let i = 0; i < 5; i += 1) {
            const tiller = new THREE.Group();
            tiller.position.set((i - 2) * 0.32, 0, (i % 2) * 0.15 - 0.05);
            g.add(tiller);
            for (let r = 0; r < 3; r += 1) {
                const root = this.mesh(tiller, this.g.cyl, this.mat.root, (r - 1) * 0.05, 0.06, 0, [0.012, 0.16, 0.012], '根', '根是水稻的六种器官之一，输导组织发达。');
                root.rotation.z = (r - 1) * 0.4;
            }
            this.mesh(tiller, this.g.cyl, this.mat.riceStem, 0, 0.55, 0, [0.03, 0.85, 0.03], '茎', '茎是六种器官之一，里面有发达的输导组织。');
            if (i === 2) this.mesh(tiller, this.g.cyl, this.mat.vein, 0.05, 0.55, 0, [0.012, 0.7, 0.012], '输导组织', '水稻的输导组织发达。浅色细条是示意图。');
            for (let k = 0; k < 3; k += 1) {
                const leaf = this.mesh(tiller, this.g.plane, this.mat.riceLeaf, 0, 0.45 + k * 0.18, 0, [0.14, 0.55, 1], '叶', '叶是水稻的六种器官之一。');
                leaf.rotation.y = k * 0.8 + i;
                leaf.rotation.z = 0.55 + k * 0.15;
                this.motions.push({ obj: leaf, axis: 'z', base: leaf.rotation.z, amp: 0.05, speed: 0.9, phase: i + k });
            }
            if (i === 0) {
                for (let p = 0; p < 5; p += 1) {
                    const petal = this.mesh(tiller, this.g.plane, this.mat.flower, 0, 1.05, 0, [0.08, 0.14, 1], '花', '水稻会开花，属于被子植物。花是六种器官之一。');
                    petal.rotation.y = p;
                    petal.rotation.z = 0.4;
                }
            }
            for (let q = 0; q < 4; q += 1) {
                this.mesh(tiller, this.g.sphere, this.mat.grain, (q - 1.5) * 0.07, 1.12 + (q % 2) * 0.08, 0, [0.05, 0.09, 0.04], '果实', '水稻的种子包在果实里面。果实是六种器官之一。');
            }
        }
        const callout = new THREE.Group();
        callout.position.set(1.65, 0.85, 0.35);
        g.add(callout);
        this.mesh(callout, this.g.sphere, this.mat.shell, 0, 0, 0, [0.36, 0.22, 0.18], '果实', '半透明的外层表示果实。种子在它里面。这不是菜豆和玉米的解剖。');
        this.mesh(callout, this.g.sphere, this.mat.innerSeed, 0, 0, 0, [0.2, 0.12, 0.1], '种子', '种子位于果实内部。水稻具有根、茎、叶、花、果实、种子。');
    }

    buildSpore(g) {
        this.disc(g, this.mat.padMoist, -1.7, 0.15, 0.72, '温暖又潮湿', '孢子是一个细胞。这里又温暖又潮湿，它才能保持完整。');
        this.disc(g, this.mat.padDry, 1.15, 0.7, 0.72, '干燥', '这里缺少潮湿。孢子只是一个细胞，很快就会死亡。');
        this.disc(g, this.mat.padCold, 1.15, -0.75, 0.72, '寒冷', '这里不够温暖。孢子必须同时温暖和潮湿，否则很快死亡。');
        this.mesh(g, this.g.sphere, this.mat.spore, -1.7, 0.28, 0.15, 0.22, '孢子', '这一个球就表示一个细胞。温暖又潮湿时，它保持完整。');
        [-1, 1].forEach((side, index) => {
            const dying = this.mesh(g, this.g.sphere, this.mat.sporeDying, 1.15, 0.24, side * 0.72, 0.16, '即将死亡的孢子', index === 0 ? '干燥时，这个单细胞的孢子很快死亡。' : '寒冷时，这个单细胞的孢子很快死亡。');
            this.dyingSpores.push(dying);
        });
    }

    buildSeed(g) {
        this.disc(g, this.mat.padDry, -1.35, 0.15, 0.72, '干燥中的种子', '种子可以在干燥中等待，不像孢子那样很快死亡。');
        this.disc(g, this.mat.padCold, 0.15, -0.85, 0.72, '寒冷中的种子', '种子可以在寒冷中等待。');
        this.mesh(g, this.g.sphere, this.mat.innerSeed, -1.35, 0.16, 0.15, [0.16, 0.11, 0.1], '种子', '干燥没有让这粒种子萎缩。它能够等待。');
        this.mesh(g, this.g.sphere, this.mat.innerSeed, 0.15, 0.16, -0.85, [0.16, 0.11, 0.1], '种子', '寒冷没有让这粒种子萎缩。它能够等待。');
        const flower = new THREE.Group();
        flower.position.set(0.2, 0, 0.45);
        g.add(flower);
        this.mesh(flower, this.g.cyl, this.mat.riceStem, 0, 0.28, 0, [0.02, 0.5, 0.02]);
        for (let i = 0; i < 5; i += 1) {
            const petal = this.mesh(flower, this.g.plane, this.mat.flower, 0, 0.58, 0, [0.12, 0.2, 1], '种子植物', '花和旁边的球果都表示种子植物。它们受精不必依靠外界的水。');
            petal.rotation.y = (i / 5) * Math.PI * 2;
            petal.rotation.z = 0.5;
        }
        this.buildCone(g, 1.05, 0.15, 0.35);
        this.waterDrop = this.mesh(g, this.g.sphere, this.mat.drop, 1.85, 0.72, 1.25, 0.16, '外界的水', '这滴水停在外面，没有参与受精。种子植物的受精不依赖外界的水。');
        this.waterBaseY = 0.72;
    }

    setupUI() {
        this.setInfo('植物类群', '选择一种植物，看它有没有真正的根、茎、叶，以及靠孢子还是种子生活。图是示意图。');
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.innerHTML = '';
        [['sumian', '水绵'], ['huluye', '葫芦藓'], ['shenjue', '肾蕨'], ['yousong', '油松'], ['shuidao', '水稻'], ['spore', '孢子'], ['seed', '种子']].forEach((item) => {
            const button = document.createElement('button');
            button.className = 'control-btn';
            button.id = this.id + '-' + item[0];
            button.type = 'button';
            button.textContent = item[1];
            button.addEventListener('click', () => this.show(item[0]));
            controls.appendChild(button);
        });
    }

    show(key) {
        Object.keys(this.kinds).forEach((name) => {
            this.kinds[name].visible = name === key;
        });
        const info = this.copy[key];
        this.ground.material.color.setHex(info[2]);
        this.setInfo(info[0], info[1]);
        this.mark(this.id + '-' + key);
    }

    mark(id) {
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        Array.prototype.forEach.call(controls.children, (button) => {
            button.style.outline = button.id === id ? '2px solid #246b3a' : '';
        });
    }

    setInfo(title, text) {
        const titleEl = document.getElementById('info-title');
        const contentEl = document.getElementById('info-content');
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.textContent = text;
    }

    pathVisible(obj) {
        let node = obj;
        while (node) {
            if (node.visible === false) return false;
            node = node.parent;
        }
        return true;
    }

    animate(time, delta) {
        if (!this.group) return;
        this.clock += delta;
        this.motions.forEach((item) => {
            if (!this.pathVisible(item.obj)) return;
            item.obj.rotation[item.axis] = item.base + Math.sin(this.clock * item.speed + item.phase) * item.amp;
        });
        if (this.kinds.spore && this.kinds.spore.visible) {
            const pulse = 0.5 + 0.5 * Math.sin(this.clock * 1.6);
            this.dyingSpores.forEach((spore) => {
                const size = 0.07 + pulse * 0.05;
                spore.scale.set(size, size * 0.55, size);
                spore.material.opacity = 0.25 + pulse * 0.35;
            });
        }
        if (this.waterDrop && this.kinds.seed && this.kinds.seed.visible) {
            this.waterDrop.position.y = this.waterBaseY + Math.sin(this.clock * 1.3) * 0.05;
        }
    }

    getInteractables() {
        return this.interactables.filter((mesh) => this.pathVisible(mesh));
    }

    dispose() {
        this.lights.forEach((light) => {
            this.scene.remove(light);
            if (light.target) this.scene.remove(light.target);
            if (typeof light.dispose === 'function') light.dispose();
        });
        this.lights = [];
        this.geos.forEach((geometry) => geometry.dispose());
        this.mats.forEach((material) => material.dispose());
        this.geos = [];
        this.mats = [];
        if (this.group) this.scene.remove(this.group);
        this.group = null;
        this.interactables = [];
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
    }
};
