import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

async function harness(files) {
    const elements = new Map();
    const timers = new Map();
    let nextId = 0;
    const element = () => ({
        style: {}, children: [], textContent: '', innerHTML: '',
        classList: { add() {}, remove() {}, toggle() {} },
        appendChild(child) { this.children.push(child); }, remove() { this.removed = true; }
    });
    const document = {
        getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
        querySelectorAll() { return []; }, createElement: element
    };
    class Vector3 { set() { return this; } }
    class Material {
        constructor() { this.emissive = { set() {}, getHex() { return 0; } }; }
        clone() { return new Material(); }
        dispose() {}
    }
    class Mesh {
        constructor(geometry, material) { this.geometry = geometry; this.material = material; this.userData = {}; this.position = new Vector3(); this.scale = new Vector3(); }
    }
    const context = vm.createContext({
        window: {}, document, console,
        THREE: { Vector3, Quaternion: class {}, Mesh, MeshStandardMaterial: Material, MeshBasicMaterial: Material,
            LineBasicMaterial: Material, Line: Mesh,
            QuadraticBezierCurve3: class { getPoints() { return []; } },
            BufferGeometry: class { setFromPoints() { return this; } }
        },
        gsap: { to(target, values) { if ('opacity' in values) target.opacity = values.opacity; }, killTweensOf() {} },
        setTimeout(callback) { const id = ++nextId; timers.set(id, callback); return id; },
        clearTimeout(id) { timers.delete(id); }
    });
    for (const file of files) vm.runInContext(await readFile(new URL('../' + file, import.meta.url), 'utf8'), context);
    return {
        context, document, timers,
        flush() { while (timers.size) { const [id, callback] = timers.entries().next().value; timers.delete(id); callback(); } }
    };
}

async function attentionHarness() {
    const app = await harness(['scenes/attention-scene.js']);
    const scene = new app.context.window.AttentionScene({ remove() {} }, { position: {} }, {});
    scene.attentionLines = [[{ material: { opacity: 0 }, userData: { weight: 0.8 } }]];
    return { ...app, scene };
}

test('attention step three always displays weights even when revisited', async () => {
    const { scene } = await attentionHarness();
    scene.showStep(3);
    assert.equal(scene.attentionLines[0][0].material.opacity, 0.4);
    scene.showStep(1);
    assert.equal(scene.attentionLines[0][0].material.opacity, 0);
    scene.showStep(3);
    scene.showStep(3);
    assert.equal(scene.attentionLines[0][0].material.opacity, 0.4);
});

test('manual attention steps cancel scheduled demonstration advances', async () => {
    const { scene, flush } = await attentionHarness();
    scene.playFullAnimation();
    scene.playFullAnimation();
    scene.showStep(2);
    flush();
    assert.equal(scene.currentStep, 2);
    assert.equal(scene.isAutoPlaying, false);
});

test('attention disposal cancels callbacks and disposes shared GPU resources once', async () => {
    const { scene, timers, flush } = await attentionHarness();
    let geometryDisposals = 0;
    let materialDisposals = 0;
    let textureDisposals = 0;
    const geometry = { dispose() { geometryDisposals++; } };
    const texture = { isTexture: true, dispose() { textureDisposals++; } };
    const material = { map: texture, dispose() { materialDisposals++; } };
    const mesh = { geometry, material, position: {}, rotation: {}, scale: {} };
    scene.mainGroup = { traverse(callback) { callback(mesh); callback(mesh); } };
    scene.startAutoPlay();
    scene.playAnimation();
    scene.playFullAnimation();
    scene.dispose();
    scene.dispose();
    flush();
    assert.equal(timers.size, 0);
    assert.equal(scene.currentStep, 1);
    assert.deepEqual([geometryDisposals, materialDisposals, textureDisposals], [1, 1, 1]);
});

test('Dolly repeated lock hints restart their delay and disposal cancels it', async () => {
    const app = await harness(['scenes/grade7-dolly-scene.js']);
    const scene = new app.context.window.Grade7DollyScene({ remove() {} }, {}, {});
    const lock = app.document.getElementById('grade7-dolly-lock');
    scene.flashLock();
    scene.flashLock();
    assert.equal(app.timers.size, 1);
    scene.dispose();
    app.flush();
    assert.equal(app.timers.size, 0);
    assert.equal(lock.style.outline, '2px solid #f3e6c4');
});

for (const [file, className, makeMesh] of [
    ['plant-levels', 'Grade7PlantLevelsScene', (scene, parent) => scene.M(parent, {}, 0, 1, 0, 0, 0, 1, 1, 1, 'leaf', '叶', '叶的说明')],
    ['animal-levels', 'Grade7AnimalLevelsScene', (scene, parent) => scene.P(parent, {}, 0, 1, 0, 0, 0, 1, 1, 1, ['组织', '组织的说明', 'tissue'])],
    ['cell-life', 'Grade7CellLifeScene', (scene, parent) => scene.add(parent, {}, scene.std(0, 1), 0, 0, 0, '细胞膜', '细胞膜的说明')]
]) {
    test(`${file} uses shared selection rules and opens teaching details`, async () => {
        const app = await harness([`scenes/grade7-${file}-scene.js`, 'js/scene-manager.js']);
        const scene = new app.context.window[className]({}, {}, { domElement: {} });
        scene.highlight = () => {};
        scene.paintBody = () => {};
        const parent = { add(mesh) { mesh.parent = this; } };
        const mesh = makeMesh(scene, parent);
        const manager = vm.runInContext('Object.create(SceneManager.prototype)', app.context);
        Object.assign(manager, {
            scene: parent, currentNavigationTool: 'move', currentSceneInstance: scene, renderer: { domElement: {} },
            container: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
            mouse: {}, camera: {}, raycaster: { setFromCamera() {}, intersectObjects() { return [{ object: mesh }]; } }
        });
        const click = { clientX: 50, clientY: 50, target: manager.renderer.domElement };
        const title = app.document.getElementById('info-title');
        let panelVisible = false;
        app.document.getElementById('info-panel').classList.add = name => { panelVisible = name === 'visible'; };
        manager.onClick(click);
        assert.equal(title.textContent, '');
        manager.currentNavigationTool = 'select';
        manager.onPointerDown({ clientX: 0, clientY: 0 });
        manager.onPointerMove({ clientX: 50, clientY: 0 });
        manager.onClick(click);
        assert.equal(title.textContent, '');
        manager.onPointerDown({ clientX: 50, clientY: 50 });
        manager.onClick(click);
        assert.equal(title.textContent, mesh.userData.name);
        assert.equal(panelVisible, true);
    });
}


test('attention probabilities are normalized independently for each source token', async () => {
    const { scene } = await attentionHarness();
    scene.attentionLines = [];
    scene.mainGroup = { add() {} };
    scene.createAttentionLines();
    assert.equal(scene.attentionLines.length, scene.sentence.length);
    for (const row of scene.attentionLines) {
        assert.equal(row.length, scene.sentence.length);
        assert.ok(Math.abs(row.reduce((sum, line) => sum + line.userData.weight, 0) - 1) < 1e-12);
        assert.ok(row.every(line => line.userData.weight > 0 && line.userData.weight <= 1));
    }
});
