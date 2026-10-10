import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../js/scene-manager.js', import.meta.url), 'utf8');

function harness() {
    const elements = new Map();
    const element = id => {
        if (!elements.has(id)) elements.set(id, {
            style: {}, children: [], textContent: '', innerHTML: '',
            classList: { remove() {}, toggle() {} }
        });
        return elements.get(id);
    };
    class Scene {
        constructor() { this.children = []; }
        traverse(callback) { this.children.forEach(callback); }
        clear() { this.children = []; }
    }
    const position = () => ({ x: 0, y: 10, z: 30, set(x, y, z) { Object.assign(this, { x, y, z }); } });
    const context = vm.createContext({
        console: { log() {}, warn() {}, error() {} },
        document: { getElementById: element, querySelectorAll: () => [], querySelector: () => null },
        THREE: { Scene, MOUSE: { PAN: 2, DOLLY: 1, ROTATE: 0 }, TOUCH: { PAN: 1, ROTATE: 0 } },
        clearTimeout, requestAnimationFrame: () => 1,
    });
    vm.runInContext(source, context);
    const manager = vm.runInContext('Object.create(SceneManager.prototype)', context);
    Object.assign(manager, {
        scene: new Scene(),
        container: { clientWidth: 800, clientHeight: 600, style: {}, querySelectorAll: () => [],
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) },
        renderer: { domElement: {}, setSize() {}, render() {} },
        camera: { position: position(), lookAt() {}, aspect: 4 / 3, updateProjectionMatrix() {} },
        controls: { target: position(), update() {}, mouseButtons: {}, touches: {} },
        labels: [], guideTimers: [], interactableObjects: [],
        wireframeMaterials: new Map(), hiddenGrids: new Map(),
        wireframeEnabled: false, gridsHidden: false, lastViewportUpdate: -Infinity,
        currentNavigationTool: 'select',
        mouse: {}, setupDefaultLights() {}, showInitialGuides() {}, hideTooltip() {},
        updateGizmo() {},
    });
    return { manager, element };
}

test('wireframe and grid tools affect scene objects and restore original values', () => {
    const { manager } = harness();
    const solid = { wireframe: false };
    const outline = { wireframe: true };
    const visibleGrid = { type: 'GridHelper', visible: true };
    const hiddenGrid = { type: 'GridHelper', visible: false };
    manager.scene.children.push({ isMesh: true, material: [solid, outline] }, visibleGrid, hiddenGrid);
    const button = { classList: { toggle() {} } };
    manager.toggleWireframe(button);
    manager.toggleGrid(button);
    assert.equal(solid.wireframe, true);
    assert.equal(visibleGrid.visible, false);
    // Newly rebuilt geometry must also inherit the active tool setting.
    const added = { wireframe: false };
    manager.scene.children.push({ isMesh: true, material: added });
    manager.applyDisplayOverrides();
    assert.equal(added.wireframe, true);
    manager.toggleWireframe(button);
    manager.toggleGrid(button);
    assert.equal(solid.wireframe, false);
    assert.equal(outline.wireframe, true);
    assert.equal(added.wireframe, false);
    assert.equal(visibleGrid.visible, true);
    assert.equal(hiddenGrid.visible, false);
});

test('loading a scene reveals controls even when setupUI only inserts buttons', () => {
    const { manager, element } = harness();
    manager.loadScene(class {
        init() { element('scene-controls').children = [{}]; }
    });
    assert.equal(element('scene-controls').style.display, 'flex');
    manager.clearScene();
    assert.equal(element('scene-controls').style.display, 'none');
});

test('display overrides release references to objects removed by simulations', () => {
    const { manager } = harness();
    const material = { wireframe: false };
    const grid = { type: 'GridHelper', visible: true };
    manager.scene.children.push({ isMesh: true, material }, grid);
    manager.wireframeEnabled = true;
    manager.gridsHidden = true;
    manager.applyDisplayOverrides();
    manager.scene.children = [];
    manager.applyDisplayOverrides();
    assert.equal(manager.wireframeMaterials.size, 0);
    assert.equal(manager.hiddenGrids.size, 0);
    assert.equal(material.wireframe, false);
    assert.equal(grid.visible, true);
});

test('failed initialization clears partial state and propagates the original error', () => {
    const { manager, element } = harness();
    let disposed = false;
    const error = new Error('bad scene');
    assert.throws(() => manager.loadScene(class {
        init() { element('scene-controls').children = [{}]; throw error; }
        dispose() { disposed = true; throw new Error('partial cleanup failed'); }
    }), value => value === error);
    assert.equal(disposed, true);
    assert.equal(manager.currentSceneInstance, null);
    assert.equal(element('scene-controls').style.display, 'none');
    assert.equal(manager.scene.children.length, 0);
});

test('raycasting follows scene objects rebuilt after loading', () => {
    const { manager } = harness();
    const old = {};
    let selected = false;
    const replacement = { parent: manager.scene, userData: { onClick() { selected = true; } } };
    manager.interactableObjects = [old];
    manager.currentSceneInstance = { getInteractables: () => [replacement] };
    manager.raycaster = {
        setFromCamera() {}, intersectObjects(objects) {
            assert.equal(objects[0], replacement);
            return [{ object: replacement }];
        }
    };
    manager.onClick({ clientX: 400, clientY: 300, target: manager.renderer.domElement });
    assert.equal(selected, true);
    assert.equal(manager.selectedObject, replacement);
});

test('invisible ancestors, hidden materials and detached meshes cannot intercept visible picks', () => {
    const { manager } = harness();
    const hiddenGroup = { visible: false, parent: manager.scene };
    const invisibleChild = { parent: hiddenGroup };
    const invisibleMaterial = { material: { visible: false }, parent: manager.scene };
    const detached = {};
    let selected = 0;
    const visible = { parent: manager.scene, userData: { onClick() { selected++; } } };
    manager.currentSceneInstance = { getInteractables: () => [invisibleChild, invisibleMaterial, detached, visible] };
    manager.raycaster = { setFromCamera() {}, intersectObjects(objects) { return objects.map(object => ({ object })); } };
    manager.onClick({ clientX: 400, clientY: 300, target: manager.renderer.domElement });
    assert.equal(selected, 1);
    assert.equal(manager.selectedObject, visible);
    manager.onHover({ clientX: 400, clientY: 300, target: manager.renderer.domElement });
    assert.equal(manager.hoveredObject, visible);
});

test('scene teardown frees detached model resources and shared textures exactly once', () => {
    const { manager } = harness();
    function resource(props = {}) {
        const listeners = new Set();
        return Object.assign({
            calls: 0,
            dispose() { this.calls++; listeners.forEach(fn => fn({ target: this })); },
            addEventListener(type, fn) { listeners.add(fn); },
            removeEventListener(type, fn) { listeners.delete(fn); }
        }, props);
    }
    const texture = resource({ isTexture: true });
    const material = resource({ map: texture, uniforms: { diffuse: { value: texture } } });
    const geometry = resource();
    const shadowMap = resource();
    manager.scene.background = texture;
    manager.scene.children.push({ geometry, material }, { geometry, material }, { shadow: { map: shadowMap } });
    manager.currentSceneInstance = { dispose() {
        geometry.dispose(); // Some scenes already release their geometry.
        manager.scene.clear(); // Other resources become unreachable after this.
    } };
    manager.clearScene();
    for (const value of [texture, material, geometry, shadowMap]) assert.equal(value.calls, 1);
    assert.equal(manager.scene.background, null);
    manager.clearScene();
    for (const value of [texture, material, geometry, shadowMap]) assert.equal(value.calls, 1);
});

test('viewport updates do not consume a second clock delta and hidden views retain aspect', () => {
    const { manager, element } = harness();
    let reads = 0;
    manager.clock = { elapsedTime: 1, getDelta() { reads++; return 1 / 60; } };
    manager.animate();
    assert.equal(reads, 1);
    assert.equal(element('stat-fps').textContent, 60);
    manager.container.clientHeight = 0;
    manager.onResize();
    assert.equal(manager.camera.aspect, 4 / 3);
});

test('navigation tools change actual camera gesture bindings', () => {
    const { manager } = harness();
    manager.setNavigationTool('move');
    assert.equal(manager.controls.mouseButtons.LEFT, 2);
    assert.equal(manager.controls.touches.ONE, 1);
    manager.setNavigationTool('scale');
    assert.equal(manager.controls.mouseButtons.LEFT, 1);
    assert.equal(manager.controls.touches.ONE, null);
    manager.setNavigationTool('select');
    assert.equal(manager.controls.mouseButtons.LEFT, 0);
});

test('scene camera lookAt updates the orbit target for both coordinate forms', () => {
    const { manager } = harness();
    let looks = 0;
    manager.camera.lookAt = () => { looks++; };
    manager.controls.target.copy = function (v) { this.set(v.x, v.y, v.z); };
    manager.syncCameraTarget();
    manager.camera.lookAt(0, 1.15, 0);
    assert.equal(manager.controls.target.y, 1.15);
    manager.camera.lookAt({ isVector3: true, x: 2, y: 3, z: 4 });
    assert.equal(manager.controls.target.x, 2);
    assert.equal(manager.controls.target.y, 3);
    assert.equal(manager.controls.target.z, 4);
    manager.controls.target.isVector3 = true;
    manager.camera.lookAt(manager.controls.target); // OrbitControls' own update must remain safe.
    assert.equal(looks, 3);
});

test('camera tools and completed drags never trigger model actions', () => {
    const { manager } = harness();
    manager.currentSceneInstance = { getInteractables() { throw new Error('unexpected interaction'); } };
    manager.setNavigationTool('move');
    manager.onClick({});
    manager.setNavigationTool('select');
    manager.onPointerDown({ clientX: 0, clientY: 0 });
    manager.onPointerMove({ clientX: 20, clientY: 0 });
    manager.onClick({});
    assert.equal(manager.pointerDragged, true);
    manager.onPointerDown({ clientX: 0, clientY: 0 });
    assert.equal(manager.pointerDragged, false);
});
