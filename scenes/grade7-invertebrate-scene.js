window.Grade7InvertebrateScene = class Grade7InvertebrateScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.id = 'grade7-invertebrate';
        this.group = null;
        this.lights = [];
        this.geos = [];
        this.mats = [];
        this.interactables = [];
        this.animals = {};
        this.motions = [];
        this.clock = 0;
        this.ground = null;
        this.moltNow = 0;
        this.moltTarget = 0;
        this.shellLeft = null;
        this.shellRight = null;
        this.shellMat = null;
        this.radialGuide = null;
        this.bilateralGuide = null;
        this.banner = '脊椎动物有由椎骨组成的脊柱，无脊椎动物没有。无脊椎动物的种类更多。模型是示意图，没有按真实大小互相缩放。';
        this.copy = {
            hydra: ['水螅（刺胞动物）', '水螅生活在淡水中，大约 0.5 到 1 厘米，身体辐射对称。身体上有刺细胞，触手上尤其多。其他刺胞动物大多生活在海里。'],
            radial: ['辐射对称', '水螅的触手绕着身体一圈排列，这是辐射对称。刺细胞分布在身体上，触手上更多。它生活在淡水里，大约 0.5 到 1 厘米。'],
            planarian: ['涡虫（扁形动物）', '涡虫身体扁平，大约 1 到 1.5 厘米，两侧对称，背面有两个眼点。扁形动物大多营寄生生活，例如血吸虫和绦虫。这里不画它们的生活史。'],
            bilateral: ['两侧对称', '涡虫可以沿身体中线分成左右两侧。它扁平，大约 1 到 1.5 厘米，背面有两个眼点。扁形动物大多营寄生，例如血吸虫和绦虫。'],
            ascaris: ['蛔虫（线虫动物）', '蛔虫身体细长，像一根圆柱，表面有角质层，有口也有肛门。雌虫大约 20 到 35 厘米，雄虫稍短。它在小肠里取食部分消化的食物。身体不是许多相似体节接成的，这一点和蚯蚓不同。蛲虫、钩虫、丝虫也是线虫动物。'],
            earthworm: ['蚯蚓（环节动物）', '蚯蚓身体呈圆柱形，由许多相似体节组成，靠肌肉和刚毛运动，体表有黏液。湿润皮肤里的毛细血管用于气体交换。它能疏松土壤，粪便中含有氮、磷和钾。沙蚕和蛭也是环节动物。蛭能吸血，唾液里的蛭素可用来制作抗血栓药物。'],
            locust: ['蝗虫（节肢动物）', '蝗虫身体分节，附肢也分节，外面有坚韧的外骨骼。外骨骼能保护身体，并减少水分丢失；身体要长大，就必须蜕皮。蜜蜂、蝉、蝴蝶、蚊、蝇是昆虫，蜘蛛、蜈蚣、虾和蟹也是节肢动物。'],
            exo: ['外骨骼与蜕皮', '蝗虫的外骨骼坚韧，能保护身体，并减慢水分丢失，所以水珠停在壳外。身体要长大，就得蜕去这层壳。图中外壳掀开，只是蜕皮的示意图。'],
            snail: ['蜗牛（软体动物）', '蜗牛身体柔软，外面有贝壳。软体动物大多有贝壳。河蚌、鲍、扇贝和枪乌贼也是软体动物。'],
            starfish: ['海星（棘皮动物）', '海星生活在海里，体表有棘。海胆、海参和海蛇尾也是棘皮动物。']
        };
        this.modeAnimal = {
            hydra: 'hydra', radial: 'hydra', planarian: 'planarian', bilateral: 'planarian',
            ascaris: 'ascaris', earthworm: 'earthworm', locust: 'locust', exo: 'locust',
            snail: 'snail', starfish: 'starfish'
        };
        this.groundColors = {
            hydra: 0x8ec4e4, radial: 0x8ec4e4, planarian: 0xcbb892, bilateral: 0xcbb892,
            ascaris: 0xd9d3cb, earthworm: 0x8d6344, locust: 0xd7d2c4, exo: 0xd7d2c4,
            snail: 0xc8b79a, starfish: 0xd8c48a
        };
    }

    init() {
        this.camera.position.set(0.2, 2.6, 7.2);
        this.camera.lookAt(0, 0.7, 0);
        this.scene.background = new THREE.Color(0xe6e7f0);
        this.setupLights();
        this.group = new THREE.Group();
        this.scene.add(this.group);
        this.g = {
            sphere: new THREE.SphereGeometry(1, 14, 10),
            cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
            box: new THREE.BoxGeometry(1, 1, 1),
            cone: new THREE.ConeGeometry(1, 1, 8),
            circle: new THREE.CircleGeometry(1, 28),
            torus: new THREE.TorusGeometry(0.28, 0.012, 8, 24)
        };
        Object.keys(this.g).forEach((key) => this.geos.push(this.g[key]));
        this.mat = {
            ground: this.makeMat(0x8ec4e4),
            hydra: this.makeMat(0xe38b62, { roughness: 0.45 }),
            tentacle: this.makeMat(0xf0b08a, { roughness: 0.4 }),
            sting: this.makeMat(0x49b8c8),
            water: this.makeMat(0x79c0e6, { transparent: true, opacity: 0.45, roughness: 0.15 }),
            dish: this.makeMat(0xd7e4ec, { transparent: true, opacity: 0.35 }),
            flat: this.makeMat(0x8a7058),
            eye: this.makeMat(0x1b1b1b),
            guide: this.makeMat(0xf2f6ff, { transparent: true, opacity: 0.85 }),
            ascaris: this.makeMat(0xf0d2c0, { roughness: 0.35 }),
            mouth: this.makeMat(0xc47a74),
            worm: this.makeMat(0xa85a48, { roughness: 0.32 }),
            seta: this.makeMat(0x5c3a32),
            cap: this.makeMat(0xc44b4b),
            soil: this.makeMat(0x6b4a32),
            cast: this.makeMat(0x4e3928),
            exo: this.makeMat(0x8a9a4a, { roughness: 0.4 }),
            joint: this.makeMat(0x55602c),
            shellMat: this.makeMat(0x9aaa62, { transparent: true, opacity: 0.32, roughness: 0.25 }),
            bead: this.makeMat(0x8fd4ef, { transparent: true, opacity: 0.85 }),
            snailShell: this.makeMat(0xb5814a, { roughness: 0.55 }),
            soft: this.makeMat(0xc8b39a, { roughness: 0.48 }),
            star: this.makeMat(0xe07a3d, { roughness: 0.62 }),
            spine: this.makeMat(0xf2c7a5),
            sand: this.makeMat(0xe3d2a4),
            axis: this.makeMat(0xf7fbff)
        };
        this.shellMat = this.mat.shellMat;
        this.ground = this.mesh(this.group, this.g.circle, this.mat.ground, 0, 0, 0);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.scale.setScalar(3.6);
        this.addAnimal('hydra', (g) => this.buildHydra(g));
        this.addAnimal('planarian', (g) => this.buildPlanarian(g));
        this.addAnimal('ascaris', (g) => this.buildAscaris(g));
        this.addAnimal('earthworm', (g) => this.buildEarthworm(g));
        this.addAnimal('locust', (g) => this.buildLocust(g));
        this.addAnimal('snail', (g) => this.buildSnail(g));
        this.addAnimal('starfish', (g) => this.buildStarfish(g));
        this.setupUI();
        this.show('hydra');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        const sun = new THREE.DirectionalLight(0xfff6ea, 1.0);
        sun.position.set(4, 7, 5);
        const fill = new THREE.DirectionalLight(0xc9d4ff, 0.34);
        fill.position.set(-4, 2.5, -3);
        [ambient, sun, fill].forEach((light) => {
            this.scene.add(light);
            this.lights.push(light);
        });
    }

    makeMat(color, extra) {
        const material = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.7, metalness: 0.04 }, extra || {}));
        this.mats.push(material);
        return material;
    }

    mesh(parent, geometry, material, x, y, z) {
        const obj = new THREE.Mesh(geometry, material);
        obj.position.set(x, y, z);
        parent.add(obj);
        return obj;
    }

    tag(obj, name, description) {
        obj.userData.name = name;
        obj.userData.description = description;
        this.interactables.push(obj);
        return obj;
    }

    addAnimal(name, builder) {
        const holder = new THREE.Group();
        this.group.add(holder);
        this.animals[name] = holder;
        builder(holder);
    }

    buildHydra(g) {
        const dish = this.mesh(g, this.g.cyl, this.mat.dish, 0, 0.08, 0);
        dish.scale.set(0.85, 0.12, 0.85);
        const water = this.mesh(g, this.g.cyl, this.mat.water, 0, 0.14, 0);
        water.scale.set(0.72, 0.08, 0.72);
        this.tag(water, '淡水', '水螅生活在淡水里。其他刺胞动物大多生活在海洋中。');
        const body = this.mesh(g, this.g.cyl, this.mat.hydra, 0, 0.55, 0);
        body.scale.set(0.14, 0.72, 0.14);
        this.tag(body, '水螅', '水螅大约 0.5 到 1 厘米，身体辐射对称。模型为了看清而放大。');
        for (let i = 0; i < 5; i += 1) {
            const bump = this.mesh(g, this.g.sphere, this.mat.sting, Math.cos(i) * 0.15, 0.4 + i * 0.08, Math.sin(i) * 0.15);
            bump.scale.setScalar(0.02);
            this.tag(bump, '刺细胞', '身体表面有刺细胞，不过触手上的刺细胞更多。');
        }
        for (let i = 0; i < 7; i += 1) {
            const angle = (i / 7) * Math.PI * 2;
            const tentacle = new THREE.Group();
            tentacle.position.set(Math.cos(angle) * 0.1, 0.92, Math.sin(angle) * 0.1);
            tentacle.rotation.order = 'YXZ';
            tentacle.rotation.y = angle;
            tentacle.rotation.z = 1.05;
            g.add(tentacle);
            for (let k = 0; k < 6; k += 1) {
                const seg = this.mesh(tentacle, this.g.sphere, this.mat.tentacle, 0, k * 0.09, 0);
                seg.scale.setScalar(0.048 - k * 0.004);
                this.tag(seg, '触手', '触手环绕着身体，上面的刺细胞尤其多。');
                const sting = this.mesh(tentacle, this.g.sphere, this.mat.sting, 0.03, k * 0.09, 0);
                sting.scale.setScalar(0.018);
                this.tag(sting, '刺细胞', '刺细胞在触手上特别多，身体其他部位也有。');
            }
            this.motions.push({ obj: tentacle, axis: 'z', base: tentacle.rotation.z, amp: 0.14, speed: 1.35, phase: i });
        }
        this.radialGuide = new THREE.Group();
        g.add(this.radialGuide);
        const axis = this.mesh(this.radialGuide, this.g.cyl, this.mat.axis, 0, 0.7, 0);
        axis.scale.set(0.012, 1.35, 0.012);
        const ring = this.mesh(this.radialGuide, this.g.torus, this.mat.axis, 0, 0.98, 0);
        ring.rotation.x = Math.PI / 2;
        this.tag(axis, '辐射对称', '轴穿过身体中心，触手绕轴排列，这就是辐射对称。');
        this.tag(ring, '辐射对称', '触手沿这一圈均匀伸出。水螅的身体呈辐射对称。');
        this.radialGuide.visible = false;
    }

    buildPlanarian(g) {
        const body = this.mesh(g, this.g.sphere, this.mat.flat, 0, 0.1, 0);
        body.scale.set(0.42, 0.07, 1.15);
        this.tag(body, '涡虫', '涡虫身体扁平，大约 1 到 1.5 厘米，两侧对称。');
        [-1, 1].forEach((side) => {
            const eye = this.mesh(g, this.g.sphere, this.mat.eye, side * 0.1, 0.16, 0.48);
            eye.scale.setScalar(0.045);
            this.tag(eye, '眼点', '两个眼点生在背面。涡虫大约 1 到 1.5 厘米。');
        });
        this.bilateralGuide = this.mesh(g, this.g.box, this.mat.guide, 0, 0.17, 0);
        this.bilateralGuide.scale.set(0.015, 0.02, 1.15);
        this.tag(this.bilateralGuide, '两侧对称', '沿这条中线，身体可以分成左右两侧。');
        this.bilateralGuide.visible = false;
    }

    buildAscaris(g) {
        this.wormRod(g, 3.3, 0.22, 0.16, '雌蛔虫', '雌虫大约 20 到 35 厘米。身体细长如圆柱，没有许多相似的体节，不要和蚯蚓混淆。');
        this.wormRod(g, 2.55, -0.28, -0.2, '雄蛔虫', '雄虫比雌虫稍短。它同样有角质层、口和肛门，身体不分成许多相似体节。');
    }

    wormRod(parent, length, z, yLift, name, text) {
        const body = this.mesh(parent, this.g.cyl, this.mat.ascaris, 0, 0.28 + yLift, z);
        body.rotation.z = Math.PI / 2;
        body.scale.set(0.1, length, 0.1);
        this.tag(body, name, text + '体表有角质层，在小肠里取食部分消化的食物。');
        const mouth = this.mesh(parent, this.g.sphere, this.mat.mouth, -length / 2, 0.28 + yLift, z);
        mouth.scale.setScalar(0.07);
        this.tag(mouth, '口', '蛔虫一端有口，取食小肠里部分消化的食物。');
        const anus = this.mesh(parent, this.g.sphere, this.mat.mouth, length / 2, 0.28 + yLift, z);
        anus.scale.setScalar(0.055);
        this.tag(anus, '肛门', '另一端有肛门。蛔虫不是由许多相似体节构成的。');
    }

    buildEarthworm(g) {
        const soil = this.mesh(g, this.g.circle, this.mat.soil, 0, 0.02, 0);
        soil.rotation.x = -Math.PI / 2;
        soil.scale.set(1.8, 1, 1.1);
        this.tag(soil, '土壤', '蚯蚓能疏松土壤。它的粪便里含有氮、磷和钾。');
        for (let i = 0; i < 4; i += 1) {
            const clod = this.mesh(g, this.g.sphere, this.mat.cast, -1.3 + i * 0.22, 0.08, 0.55);
            clod.scale.set(0.1, 0.07, 0.08);
            this.tag(clod, '粪便', '这些土团表示蚯蚓排出的粪便，其中含有氮、磷和钾。它还能疏松土壤。');
        }
        const text = '身体由许多相似体节组成，呈圆柱形。肌肉和刚毛帮助运动，体表有黏液。';
        for (let i = 0; i < 16; i += 1) {
            const seg = this.mesh(g, this.g.sphere, this.mat.worm, -1.15 + i * 0.15, 0.2, 0);
            seg.scale.set(0.13, 0.12, 0.12);
            this.tag(seg, '体节', text);
            if (i % 2 === 0) {
                [-1, 1].forEach((side) => {
                    const seta = this.mesh(g, this.g.cone, this.mat.seta, -1.15 + i * 0.15, 0.1, side * 0.1);
                    seta.scale.set(0.018, 0.05, 0.018);
                    seta.rotation.x = side * 1.2;
                    this.tag(seta, '刚毛', '刚毛能帮助蚯蚓运动。');
                });
            }
            if (i % 3 === 1) {
                const cap = this.mesh(g, this.g.cyl, this.mat.cap, -1.15 + i * 0.15, 0.3, 0.04);
                cap.rotation.z = Math.PI / 2;
                cap.rotation.y = 0.6;
                cap.scale.set(0.008, 0.16, 0.008);
                this.tag(cap, '毛细血管', '湿润的皮肤里有毛细血管，蚯蚓靠它们进行气体交换。皮肤外面还有黏液。');
            }
        }
    }

    buildLocust(g) {
        const spots = [-0.42, -0.22, 0.0, 0.24, 0.46, 0.66];
        const radii = [0.13, 0.16, 0.18, 0.16, 0.14, 0.11];
        const lengths = [0.18, 0.2, 0.22, 0.2, 0.18, 0.16];
        const bodyText = '蝗虫的身体分节。外面的外骨骼能保护身体，并减少水分丢失。';
        spots.forEach((x, i) => {
            const seg = this.mesh(g, this.g.sphere, this.mat.exo, x, 0.38, 0);
            seg.scale.set(lengths[i], radii[i], radii[i] * 0.9);
            this.tag(seg, '分节的身体', bodyText);
        });
        [[-0.05, 1, 0.22], [0.16, 1, 0.34], [0.34, 1, 0.22], [-0.05, -1, 0.22], [0.16, -1, 0.34], [0.34, -1, 0.22]].forEach((spec) => {
            this.leg(g, spec[0], 0.3, spec[1] * 0.12, spec[1], spec[2]);
        });
        this.shellLeft = new THREE.Group();
        this.shellRight = new THREE.Group();
        g.add(this.shellLeft);
        g.add(this.shellRight);
        spots.forEach((x, i) => {
            [-1, 1].forEach((side) => {
                const half = this.mesh(side < 0 ? this.shellLeft : this.shellRight, this.g.sphere, this.shellMat, x, 0.4, side * 0.08);
                half.scale.set(lengths[i] * 1.05, radii[i] * 1.12, radii[i] * 0.55);
                this.tag(half, '外骨骼', '这层坚韧的外壳能保护身体，并减慢水分丢失。要继续长大，就必须蜕皮。');
            });
        });
        [-0.2, 0.15, 0.45].forEach((x, i) => {
            const bead = this.mesh(this.shellRight, this.g.sphere, this.mat.bead, x, 0.58, 0.12);
            bead.scale.setScalar(0.035 + i * 0.008);
            this.tag(bead, '壳外的水', '水珠留在外骨骼表面，说明这层壳能减少水分丢失。');
        });
    }

    leg(parent, x, y, z, side, reach) {
        let node = new THREE.Group();
        node.position.set(x, y, z);
        parent.add(node);
        const angles = [side * 0.95, side * -0.75, side * 0.45];
        const lens = [reach, reach * 0.82, reach * 0.5];
        lens.forEach((len, i) => {
            const pivot = new THREE.Group();
            pivot.rotation.z = angles[i];
            node.add(pivot);
            const joint = this.mesh(pivot, this.g.sphere, this.mat.joint, 0, 0, 0);
            joint.scale.setScalar(0.04);
            this.tag(joint, '关节', '附肢分节，节与节之间可以弯曲。');
            const seg = this.mesh(pivot, this.g.cyl, this.mat.exo, 0, -len / 2, 0);
            seg.scale.set(0.025, len, 0.025);
            this.tag(seg, '分节的附肢', '蝗虫的附肢分节。蜜蜂、蝉、蝴蝶、蚊、蝇以及蜘蛛、蜈蚣、虾、蟹也都有分节的附肢。');
            const next = new THREE.Group();
            next.position.y = -len;
            pivot.add(next);
            node = next;
        });
    }

    buildSnail(g) {
        const foot = this.mesh(g, this.g.sphere, this.mat.soft, -0.05, 0.09, 0.2);
        foot.scale.set(0.62, 0.1, 0.32);
        this.tag(foot, '柔软的身体', '蜗牛身体柔软。软体动物大多有贝壳，河蚌、鲍、扇贝和枪乌贼也属于软体动物。');
        for (let i = 0; i < 16; i += 1) {
            const t = i / 16;
            const angle = t * Math.PI * 3.5;
            const radius = 0.08 + t * 0.4;
            const bit = this.mesh(g, this.g.sphere, this.mat.snailShell, 0.15 + Math.cos(angle) * radius, 0.32 + Math.sin(angle) * radius * 0.82, t * 0.04);
            bit.scale.setScalar(0.07 + t * 0.18);
            this.tag(bit, '贝壳', '大多数软体动物有贝壳。这只是蜗牛的示意图。');
        }
    }

    buildStarfish(g) {
        const sand = this.mesh(g, this.g.circle, this.mat.sand, 0, 0.02, 0);
        sand.rotation.x = -Math.PI / 2;
        sand.scale.setScalar(1.5);
        const water = this.mesh(g, this.g.cyl, this.mat.water, 0, 0.55, 0);
        water.scale.set(1.35, 0.08, 1.35);
        this.tag(water, '海水', '海星生活在海里。海胆、海参和海蛇尾也是棘皮动物。');
        const center = this.mesh(g, this.g.sphere, this.mat.star, 0, 0.14, 0);
        center.scale.set(0.28, 0.12, 0.28);
        this.tag(center, '海星', '海星是棘皮动物，生活在海水中，体表有棘。');
        for (let i = 0; i < 5; i += 1) {
            const arm = new THREE.Group();
            arm.rotation.y = (i / 5) * Math.PI * 2;
            g.add(arm);
            const limb = this.mesh(arm, this.g.sphere, this.mat.star, 0.48, 0.13, 0);
            limb.scale.set(0.62, 0.1, 0.2);
            this.tag(limb, '海星', '海星生活在海里。海胆、海参、海蛇尾和它同属棘皮动物。');
            for (let s = 0; s < 4; s += 1) {
                const spine = this.mesh(arm, this.g.cone, this.mat.spine, 0.22 + s * 0.16, 0.24, (s % 2) * 0.06 - 0.03);
                spine.scale.set(0.028, 0.1, 0.028);
                this.tag(spine, '棘', '这些棘生在海星体表。棘皮动物包括海星、海胆、海参和海蛇尾。');
            }
        }
    }

    setupUI() {
        this.setInfo('无脊椎动物', this.banner);
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        controls.innerHTML = '';
        [['hydra', '水螅'], ['planarian', '涡虫'], ['ascaris', '蛔虫'], ['earthworm', '蚯蚓'], ['locust', '蝗虫'], ['snail', '蜗牛'], ['starfish', '海星'], ['radial', '辐射对称'], ['bilateral', '两侧对称'], ['exo', '外骨骼']].forEach((item) => {
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
        const animal = this.modeAnimal[key];
        Object.keys(this.animals).forEach((name) => {
            this.animals[name].visible = name === animal;
        });
        if (this.radialGuide) this.radialGuide.visible = key === 'radial';
        if (this.bilateralGuide) this.bilateralGuide.visible = key === 'bilateral';
        this.moltTarget = key === 'exo' ? 1 : 0;
        this.ground.material.color.setHex(this.groundColors[key]);
        const info = this.copy[key];
        this.setInfo(info[0], this.banner + info[1]);
        this.mark(this.id + '-' + key);
    }

    mark(id) {
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        Array.prototype.forEach.call(controls.children, (button) => {
            button.style.outline = button.id === id ? '2px solid #24506b' : '';
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
        this.moltNow += (this.moltTarget - this.moltNow) * Math.min(1, delta * 2.4);
        if (this.shellLeft && this.shellRight) {
            this.shellLeft.position.x = -0.18 * this.moltNow;
            this.shellRight.position.x = 0.18 * this.moltNow;
            this.shellLeft.rotation.z = 0.45 * this.moltNow;
            this.shellRight.rotation.z = -0.5 * this.moltNow;
            this.shellLeft.position.y = 0.25 * this.moltNow;
            this.shellRight.position.y = 0.32 * this.moltNow;
            this.shellMat.opacity = 0.3 + 0.45 * this.moltNow;
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
