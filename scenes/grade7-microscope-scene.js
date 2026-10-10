/**
 * 人教版七年级上册：显微镜放大倍数和调焦。标签只显示目镜与物镜的乘积。
 */
window.Grade7MicroscopeScene = class Grade7MicroscopeScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.mainGroup = this.tubeGroup = this.stageGroup = null;
        this.opticMount = this.fieldGroup = this.objectiveMesh = this.mirrorMesh = null;
        this.lights = [];
        this.interactables = [];
        this.head = 'mono';
        this.objective = 4;
        this.eyepiece = 10;
        this.sideView = false;
        this.tubeDrop = this.stageLift = this.fine = this.hitFlash = 0;
        this.fineDir = 1;
        this.stageBase = 1.22;
        this.slideTop = 0.12;
        this.camFront = new THREE.Vector3(2.5, 3.5, 8.4);
        this.camSide = new THREE.Vector3(8.8, 2.5, 1.1);
    }
    init() {
        this.camera.position.copy(this.camFront);
        this.scene.background = new THREE.Color(0x12151c);
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        const key = new THREE.DirectionalLight(0xffffff, 0.9);
        key.position.set(5, 10, 6);
        const fill = new THREE.PointLight(0xffe2a8, 0.45, 7);
        fill.position.set(0.5, 0.7, 0.4);
        [ambient, key, fill].forEach((light) => {
            this.scene.add(light);
            this.lights.push(light);
        });
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        this.interactables.push(this.mainGroup);
        this.buildBody();
        this.buildOptics();
        this.buildField();
        this.applyPose();
        this.setupUI();
        this.refreshMag();
        this.syncButtons();
    }
    metal(color) {
        return new THREE.MeshStandardMaterial({ color: color, roughness: 0.38, metalness: 0.55, emissive: 0x000000 });
    }
    addBox(parent, x, y, z, w, h, d, color, name, desc) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.metal(color));
        mesh.position.set(x, y, z);
        if (name) this.mark(mesh, name, desc);
        parent.add(mesh);
        return mesh;
    }
    addCyl(parent, x, y, z, r, h, color, name, desc) {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18), this.metal(color));
        mesh.position.set(x, y, z);
        if (name) this.mark(mesh, name, desc);
        parent.add(mesh);
        return mesh;
    }
    mark(mesh, name, desc) {
        mesh.userData.name = name;
        mesh.userData.description = desc;
        mesh.userData.hoverTitle = name;
        mesh.userData.hoverDesc = desc;
        mesh.userData.onClick = () => {
            const title = document.getElementById('info-title');
            if (title) title.innerText = name;
            this.setCaption(desc);
        };
        return mesh;
    }
    setCaption(text) {
        const el = document.getElementById('grade7-microscope-caption');
        if (el) el.textContent = text;
    }
    objSpec() {
        const table = {
            4: { h: 0.36, r: 0.1, color: 0xd24b4b, name: '4倍物镜' },
            10: { h: 0.5, r: 0.08, color: 0xe0b03a, name: '10倍物镜' },
            40: { h: 0.74, r: 0.06, color: 0x3c6ad8, name: '40倍物镜' }
        };
        return table[this.objective];
    }
    tipLocal() {
        return 2.2 - this.objSpec().h;
    }
    gap() {
        const tubeFine = this.head === 'mono' ? this.fine : 0;
        const stageFine = this.head === 'bino' ? this.fine : 0;
        const tip = -this.tubeDrop + tubeFine + this.tipLocal();
        const slide = this.stageBase + this.stageLift - stageFine + this.slideTop;
        return tip - slide;
    }
    applyPose() {
        const tubeFine = this.head === 'mono' ? this.fine : 0;
        const stageFine = this.head === 'bino' ? this.fine : 0;
        if (this.tubeGroup) this.tubeGroup.position.y = -this.tubeDrop + tubeFine;
        if (this.stageGroup) this.stageGroup.position.y = this.stageBase + this.stageLift - stageFine;
    }
    buildBody() {
        const g = this.mainGroup;
        this.addBox(g, 0.15, 0.16, 0, 3.6, 0.32, 2.35, 0x2a2e33, '镜座', '镜座放稳在桌上。搬动时一手托镜座，一手握镜臂。');
        this.addBox(g, -1.2, 2.05, 0, 0.42, 3.5, 0.52, 0x343a42, '镜臂', '粗准焦螺旋和细准焦螺旋装在镜臂上。');
        this.addBox(g, -0.25, 3.62, 0, 1.9, 0.26, 0.46, 0x3c4450, '镜臂上端', '上端托住镜筒。');
        const coarse = this.addCyl(g, -1.2, 2.35, 0.42, 0.2, 0.16, 0xc0c6ce, '粗准焦螺旋', '低倍时用来较大幅度地升降。换成高倍物镜后它停止使用。');
        coarse.rotation.x = Math.PI / 2;
        const fine = this.addCyl(g, -1.2, 2.35, 0.58, 0.11, 0.12, 0xd8dee6, '细准焦螺旋', '只做很小的调节。高倍镜下只能转它。');
        fine.rotation.x = Math.PI / 2;
        this.tubeGroup = new THREE.Group();
        this.tubeGroup.position.set(0.5, 0, 0);
        g.add(this.tubeGroup);
        this.addCyl(this.tubeGroup, 0, 3.15, 0, 0.24, 1.35, 0xd5dbe3, '镜筒', '单目显微镜调焦时升降的是镜筒。下降前必须从侧面看。');
        this.opticMount = new THREE.Group();
        this.tubeGroup.add(this.opticMount);
        this.stageGroup = new THREE.Group();
        this.stageGroup.position.set(0.5, this.stageBase, 0);
        g.add(this.stageGroup);
        const stage = this.addBox(this.stageGroup, 0, 0, 0, 2.25, 0.1, 1.7, 0x1a1c20, '载物台', '放玻片的平台。双目显微镜靠升降载物台调焦，上升前要从侧面看。');
        this.addBox(stage, -0.55, 0.1, 0.42, 0.4, 0.05, 0.1, 0x888888);
        this.addBox(stage, 0.55, 0.1, 0.42, 0.4, 0.05, 0.1, 0x888888);
        const slide = this.addBox(this.stageGroup, 0, 0.1, 0, 0.95, 0.04, 0.38, 0xd5ecff, '玻片', '标本放在载玻片上。镜头不能压到这块玻璃。');
        slide.material.transparent = true;
        slide.material.opacity = 0.55;
        slide.material.depthWrite = false;
        slide.material.needsUpdate = true;
        this.mirrorMesh = this.addCyl(g, 0.5, 0.62, 0, 0.36, 0.06, 0x9eb4c8, '反光镜', '反光镜把光线反射到标本上。');
        this.mirrorMesh.rotation.x = 0.7;
        const anchor = new THREE.Group();
        anchor.position.set(-3.4, 1.9, 0);
        anchor.rotation.y = 0.6;
        g.add(anchor);
        this.addBox(anchor, 0, -0.85, 0, 0.08, 1.3, 0.08, 0x8b939e);
        this.fieldGroup = new THREE.Group();
        anchor.add(this.fieldGroup);
    }
    clearGroup(group) {
        if (!group) return;
        while (group.children.length) {
            const child = group.children[0];
            group.remove(child);
            this.disposeTree(child);
        }
    }
    buildOptics() {
        this.clearGroup(this.opticMount);
        const spec = this.objSpec();
        const obj = new THREE.Mesh(
            new THREE.CylinderGeometry(spec.r, spec.r + 0.015, spec.h, 16),
            this.metal(spec.color)
        );
        obj.position.y = 2.2 - spec.h / 2;
        this.mark(obj, spec.name, '物镜靠近玻片。高倍物镜更长，换上之后粗准焦螺旋不能再转。');
        this.opticMount.add(obj);
        this.objectiveMesh = obj;
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), this.metal(0x22262c));
        nose.scale.y = 0.55;
        nose.position.y = 2.28;
        this.opticMount.add(nose);
        const eyeDesc = this.head === 'mono'
            ? '目镜固定为 10 倍，不能在这里更换。放大倍数只看标签上的乘积。'
            : '两只目镜都固定为 10 倍。双目显微镜用载物台升降来调焦。';
        if (this.head === 'mono') {
            this.addCyl(this.opticMount, 0, 4.05, 0, 0.16, 0.48, 0xe7eef6, '目镜', eyeDesc);
        } else {
            [-1, 1].forEach((side) => {
                const eye = this.addCyl(this.opticMount, side * 0.18, 4.02, 0, 0.12, 0.4, 0xe7eef6, '目镜', eyeDesc);
                eye.rotation.z = side * -0.42;
            });
        }
    }
    gridPts(cols, rows, spacing) {
        const pts = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) pts.push([(c - (cols - 1) / 2) * spacing, (r - (rows - 1) / 2) * spacing]);
        }
        return pts;
    }
    buildField() {
        this.clearGroup(this.fieldGroup);
        const back = new THREE.Mesh(new THREE.CircleGeometry(1.2, 36), new THREE.MeshBasicMaterial({ color: 0x2a261f, side: THREE.DoubleSide }));
        this.mark(back, '标本平面', '这片平面表示看到的标本范围。倍数升高后，亮着的视野会变小。');
        this.fieldGroup.add(back);
        const fieldR = this.objective === 4 ? 1.05 : (this.objective === 10 ? 0.72 : 0.46);
        const cellR = this.objective === 4 ? 0.1 : (this.objective === 10 ? 0.15 : 0.22);
        const pts = this.objective === 40 ? [[-0.14, 0], [0.14, 0]] : this.gridPts(this.objective === 4 ? 4 : 3, this.objective === 4 ? 4 : 2, this.objective === 4 ? 0.32 : 0.36);
        const field = new THREE.Mesh(new THREE.CircleGeometry(fieldR, 36), new THREE.MeshBasicMaterial({ color: 0xf6f1e4, side: THREE.DoubleSide }));
        field.position.z = 0.02;
        this.mark(field, '视野', '明亮的圆是当前视野。物镜倍数越高，这个圆越小。');
        this.fieldGroup.add(field);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(fieldR, 0.02, 8, 28), new THREE.MeshBasicMaterial({ color: 0x111111 }));
        ring.position.z = 0.03;
        this.fieldGroup.add(ring);
        pts.forEach((p) => {
            const cell = new THREE.Mesh(new THREE.CircleGeometry(cellR, 16), new THREE.MeshBasicMaterial({ color: 0xf3d27a, side: THREE.DoubleSide }));
            cell.position.set(p[0], p[1], 0.05);
            this.mark(cell, '视野中的细胞', '倍数越高，细胞越大，数得清的细胞越少。');
            this.fieldGroup.add(cell);
            const nuc = new THREE.Mesh(new THREE.CircleGeometry(cellR * 0.38, 12), new THREE.MeshBasicMaterial({ color: 0x7a3f78, side: THREE.DoubleSide }));
            nuc.position.set(p[0] + cellR * 0.2, p[1], 0.07);
            this.fieldGroup.add(nuc);
        });
    }
    refreshMag() {
        const el = document.getElementById('grade7-microscope-mag');
        if (el) el.textContent = String(this.objective * this.eyepiece);
    }
    relieve() {
        let guard = 0;
        while (this.gap() < 0.08 && guard < 24) {
            if (this.tubeDrop > 0) this.tubeDrop = Math.max(0, this.tubeDrop - 0.05);
            else if (this.stageLift > 0) this.stageLift = Math.max(0, this.stageLift - 0.05);
            else break;
            guard += 1;
        }
    }
    setHead(head) {
        this.head = head;
        this.buildOptics();
        this.applyPose();
        this.syncButtons();
        this.setCaption(head === 'mono'
            ? '这是单目显微镜。下降镜筒之前，先按「从侧面看」，盯住镜头和玻片的空隙。'
            : '这是双目显微镜。上升载物台之前，先按「从侧面看」，否则镜头会顶到玻片。');
    }
    setObjective(n) {
        this.objective = n;
        this.relieve();
        this.buildOptics();
        this.buildField();
        this.applyPose();
        this.refreshMag();
        this.syncButtons();
        this.setCaption(n === 40
            ? '已换成高倍物镜。粗准焦螺旋停止使用，只能用细准焦螺旋。视野里细胞更大、更少，范围也更小。'
            : '现在还是低倍物镜，粗准焦螺旋可以升降。放大倍数只看标签上的数。');
    }
    useHigh() {
        if (this.objective === 40) {
            this.setCaption('已经是高倍物镜。粗准焦螺旋保持停用，请只转细准焦螺旋。');
            return;
        }
        this.setObjective(40);
    }
    nudge(which, dir) {
        const part = which === 'tube' ? '镜筒' : '载物台';
        if ((this.head === 'mono' && which !== 'tube') || (this.head === 'bino' && which !== 'stage')) {
            this.setCaption(this.head === 'mono'
                ? '当前单目显微镜通过升降镜筒调焦，请使用镜筒按钮。'
                : '当前双目显微镜通过升降载物台调焦，请使用载物台按钮。');
            return;
        }
        if (this.objective === 40) {
            this.setCaption('高倍镜下粗准焦螺旋不能再转动，' + part + '没有移动。请改用细准焦螺旋。');
            return;
        }
        const danger = dir > 0 && !this.sideView && ((which === 'tube' && this.head === 'mono') || (which === 'stage' && this.head === 'bino'));
        if (danger) {
            this.hitFlash = 0.7;
            const why = which === 'tube'
                ? '单目显微镜没有从侧面看就不能下降镜筒'
                : '双目显微镜没有从侧面看就不能上升载物台';
            this.setCaption('操作已阻止，避免镜头碰到玻片。' + why + '，请先切换到侧面观察。');
            return;
        }
        if (dir > 0) {
            const room = this.gap() - 0.06;
            if (room <= 0.01) {
                this.setCaption(which === 'tube' ? '物镜已经贴近玻片，镜筒不再下降。' : '玻片已经贴近物镜，载物台不再上升。');
                return;
            }
            const step = Math.min(0.1, room);
            if (which === 'tube') this.tubeDrop += step;
            else this.stageLift += step;
            this.setCaption(which === 'tube'
                ? '镜筒下降了一点。从侧面能看见物镜和玻片之间还留着空隙。'
                : '载物台上升了一点。双目显微镜要一边从侧面看，一边做这一步。');
        } else {
            if (which === 'tube') this.tubeDrop = Math.max(0, this.tubeDrop - 0.1);
            else this.stageLift = Math.max(0, this.stageLift - 0.1);
            this.setCaption(which === 'tube' ? '镜筒上升，物镜离开玻片。' : '载物台下降，玻片离开物镜。');
        }
        this.applyPose();
    }
    fineFocus() {
        const prev = this.fine;
        this.fine += 0.02 * this.fineDir;
        if (Math.abs(this.fine) > 0.08) {
            this.fine = Math.max(-0.08, Math.min(0.08, this.fine));
            this.fineDir *= -1;
        }
        if (this.gap() < 0.05) {
            this.fine = prev;
            this.fineDir *= -1;
            this.applyPose();
            this.setCaption('细准焦螺旋已贴近玻片，不再往前顶。');
            return;
        }
        this.applyPose();
        this.setCaption(this.objective === 40
            ? '细准焦螺旋只转动了一点。高倍镜下只允许这样调。'
            : '细准焦螺旋做了很小的调节。大幅升降仍用粗准焦螺旋。');
    }
    toggleSide() {
        this.sideView = !this.sideView;
        this.camera.position.copy(this.sideView ? this.camSide : this.camFront);
        this.syncButtons();
        this.setCaption(this.sideView
            ? '现在从侧面看物镜和玻片的空隙。单目可以下降镜筒，双目可以上升载物台。'
            : '已经回到正面，看不清镜头和玻片的空隙。此时不要下降镜筒，也不要上升载物台。');
    }
    syncButtons() {
        const flags = {
            mono: this.head === 'mono',
            bino: this.head === 'bino',
            x4: this.objective === 4,
            x10: this.objective === 10,
            x40: this.objective === 40,
            side: this.sideView
        };
        const coarseDisabled = this.objective === 40;
        ['down', 'up', 'stage-up', 'stage-down'].forEach((id) => {
            const el = document.getElementById('grade7-microscope-btn-' + id);
            if (el) el.disabled = coarseDisabled || (id.startsWith('stage-') ? this.head !== 'bino' : this.head !== 'mono');
        });
        Object.keys(flags).forEach((id) => {
            const el = document.getElementById('grade7-microscope-btn-' + id);
            if (el) el.classList.toggle('active', flags[id]);
        });
    }
    setupUI() {
        const title = document.getElementById('info-title');
        if (title) title.innerText = '使用显微镜';
        const info = document.getElementById('info-content');
        if (info) {
            info.innerHTML = [
                '<p>人教版七年级上册：目镜固定为 10 倍。放大倍数标签只显示它和物镜相乘的结果。</p>',
                '<p>放大倍数 <b id="grade7-microscope-mag">40</b></p>',
                '<p>换成高倍物镜后，视野里细胞更大、数目更少，看到的范围更小。这时粗准焦螺旋停用，只转细准焦螺旋。</p>',
                '<p>单目下降镜筒、双目上升载物台时，都要先从侧面看着镜头和玻片之间的空隙。</p>',
                '<p id="grade7-microscope-caption">当前从正面看。先选单目或双目，再练习调焦。</p>'
            ].join('');
        }
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');
        const controls = document.getElementById('scene-controls');
        if (!controls) return;
        const buttons = [
            ['mono', '单目', () => this.setHead('mono')],
            ['bino', '双目', () => this.setHead('bino')],
            ['x4', '4×', () => this.setObjective(4)],
            ['x10', '10×', () => this.setObjective(10)],
            ['x40', '40×', () => this.setObjective(40)],
            ['eye', '目镜10×', () => this.setCaption('目镜固定为 10 倍，这个按钮不能更换它。放大倍数标签只写和物镜相乘后的结果。')],
            ['down', '下降镜筒', () => this.nudge('tube', 1)],
            ['up', '上升镜筒', () => this.nudge('tube', -1)],
            ['stage-up', '载物台上升', () => this.nudge('stage', 1)],
            ['stage-down', '载物台下降', () => this.nudge('stage', -1)],
            ['high', '切换高倍', () => this.useHigh()],
            ['fine', '细准焦', () => this.fineFocus()],
            ['side', '从侧面看', () => this.toggleSide()]
        ];
        controls.style.display = 'flex';
        controls.innerHTML = buttons.map(([id, label]) => '<button class="control-btn" id="grade7-microscope-btn-' + id + '">' + label + '</button>').join('');
        buttons.forEach(([id, , fn]) => {
            const el = document.getElementById('grade7-microscope-btn-' + id);
            if (el) el.onclick = fn;
        });
    }
    animate(time, delta) {
        if (this.mirrorMesh) this.mirrorMesh.rotateZ(Math.sin(time * 0.7) * delta * 0.2);
        if (this.hitFlash > 0 && this.objectiveMesh && this.objectiveMesh.material) {
            this.hitFlash -= delta;
            const hot = this.hitFlash > 0 && Math.sin(time * 28) > 0;
            this.objectiveMesh.material.emissive.setHex(hot ? 0xff2200 : 0x000000);
        }
    }
    getInteractables() {
        return this.interactables;
    }
    disposeTree(root) {
        if (!root) return;
        const geos = new Set();
        const mats = new Set();
        root.traverse((node) => {
            if (node.geometry && !geos.has(node.geometry)) {
                geos.add(node.geometry);
                node.geometry.dispose();
            }
            const bag = node.material;
            const list = Array.isArray(bag) ? bag : (bag ? [bag] : []);
            list.forEach((mat) => {
                if (mat && !mats.has(mat)) {
                    mats.add(mat);
                    mat.dispose();
                }
            });
        });
    }
    dispose() {
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
            this.disposeTree(this.mainGroup);
            this.mainGroup = null;
        }
        this.lights.forEach((light) => this.scene.remove(light));
        this.lights = [];
        const controls = document.getElementById('scene-controls');
        if (controls) controls.innerHTML = '';
        this.interactables.length = 0;
    }
};
