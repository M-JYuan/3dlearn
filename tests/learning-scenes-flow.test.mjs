import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const files = ['data/learning-path-config.js', 'data/quiz-bank.js', 'js/learning-engine.js', 'scenes/quadratic-function-scene.js', 'scenes/circuit-ohm-scene.js'];
const sources = await Promise.all(files.map(file => readFile(new URL('../' + file, import.meta.url), 'utf8')));
const managerSource = await readFile(new URL('../js/scene-manager.js', import.meta.url), 'utf8');
function harness(storage = new Map()) {
    const ids = new Map();
    function element(tag = 'div') {
        const e = { tag, style: {}, children: [], inputs: [], isConnected: true,
            classList: { add() {}, remove() {} },
            appendChild(child) { this.children.push(child); child.isConnected = true; },
            remove() { this.isConnected = false; if (this.id) ids.delete(this.id); },
            querySelectorAll(selector) { return selector.includes('input') ? this.inputs : []; },
            querySelector(selector) {
                const name = selector.match(/name="([^"]+)"/)?.[1];
                return name ? this.inputs.find(input => input.name === name && input.checked) || null : null;
            }
        };
        Object.defineProperty(e, 'innerHTML', { get() { return this.html || ''; }, set(html) {
            this.html = html; this.inputs = [];
            for (const match of html.matchAll(/<(\w+)\b([^>]+)>/g)) {
                const attrs = match[2], id = attrs.match(/\bid="([^"]*)"/)?.[1];
                if (!id && match[1] !== 'input') continue;
                const child = element(match[1]);
                Object.assign(child, { id, name: attrs.match(/\bname="([^"]*)"/)?.[1], value: attrs.match(/\bvalue="([^"]*)"/)?.[1], checked: /\bchecked\b/.test(attrs) });
                if (id) ids.set(id, child);
                if (match[1] === 'input') this.inputs.push(child);
            }
        } });
        return e;
    }
    for (const id of ['scene-controls', 'view-scene', 'scene-canvas-container', 'info-panel', 'info-title', 'info-content']) { const el = element(); el.id = id; ids.set(id, el); }
    const context = vm.createContext({ window: {}, console, document: { getElementById: id => ids.get(id) || null, createElement: element },
        localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
        THREE: { Color: class {} }, setTimeout() { return 1; }, clearTimeout() {}
    });
    sources.forEach(source => vm.runInContext(source, context));
    function course(id) {
        const name = id === 'quadratic-function' ? 'QuadraticFunctionScene' : 'CircuitOhmScene';
        const scene = new context.window[name]({}, { position: { set() {} }, lookAt() {} }, {});
        scene.setupLights = () => {};
        scene.setupScene = () => {};
        scene.drawParabola = scene.createVertexMarker = scene.renderCircuit = () => {};
        scene.guides = [];
        scene.showGuide = message => scene.guides.push(message);
        scene.init();
        return scene;
    }
    return { course, ids, storage, context, window: context.window };
}
function answer(scene, question, value) {
    const inputs = scene.quizEl.querySelectorAll('input[type="radio"]');
    inputs.filter(input => input.name === question.id).forEach(input => { input.checked = input.value === value; if (input.checked) input.onchange(); });
}

for (const id of ['quadratic-function', 'circuit-ohm']) {
    test(`${id}: demonstrations unlock quiz, submission unlocks summary, reload restores progress`, () => {
        const h = harness(), scene = h.course(id), engine = h.window.LearningEngine;
        scene.executeStepAction(4);
        assert.equal(scene.quizEl, null);
        scene.showSummaryCard();
        assert.equal(engine.hasCompletedStep(id, 'summary'), false);
        for (let step = 1; step <= 3; step++) scene.executeStepAction(step);
        assert.equal(engine.canStartQuiz(id), true);
        scene.executeStepAction(4);
        assert.ok(scene.quizEl);
        assert.equal(engine.hasCompletedStep(id, 'practice'), false, 'opening practice must not complete it');
        for (const question of h.window.QuizBank[id]) answer(scene, question, question.correctAnswer);
        scene.submitQuiz();
        assert.equal(engine.getSession(id).quizResults.length, 3);
        assert.equal(engine.hasCompletedStep(id, 'practice'), true);
        scene.showSummaryCard();
        assert.equal(engine.getScore(id), 100);
        assert.equal(scene.currentStep, 5);
        assert.ok(scene.summaryEl);
        const fresh = harness(h.storage), restored = fresh.course(id);
        assert.equal(restored.currentStep, 5);
        assert.deepEqual(JSON.parse(JSON.stringify(restored[id === 'quadratic-function' ? 'params' : 'state'])), JSON.parse(JSON.stringify(scene[id === 'quadratic-function' ? 'params' : 'state'])));
        assert.match(restored.guides[0], /已恢复上次进度/);
        restored.showQuizPanel();
        assert.equal(restored.quizEl.inputs.filter(input => input.checked).length, 3);
        assert.equal(fresh.window.LearningEngine.getScore(id), 100);
    });

    test(`${id}: incomplete quiz remains ungraded, drafts restore, reset clears only this lesson`, () => {
        const h = harness(), scene = h.course(id), engine = h.window.LearningEngine;
        for (let step = 1; step <= 3; step++) scene.executeStepAction(step);
        scene.showQuizPanel();
        const question = h.window.QuizBank[id][0];
        answer(scene, question, question.correctAnswer);
        scene.submitQuiz();
        assert.equal(engine.getSession(id).quizResults.length, 0);
        assert.equal(engine.hasCompletedStep(id, 'practice'), false);
        const fresh = harness(h.storage), restored = fresh.course(id);
        restored.showQuizPanel();
        assert.equal(restored.quizEl.inputs.filter(input => input.checked).length, 1);
        const other = id === 'quadratic-function' ? 'circuit-ohm' : 'quadratic-function';
        const otherSession = fresh.window.LearningEngine.getSession(other);
        fresh.window.LearningEngine.completeStep(other, 'read');
        restored.reset();
        assert.equal(restored.currentStep, 0);
        assert.equal(restored.quizEl, null);
        assert.equal(restored.summaryEl, null);
        assert.equal(restored.demoState, null);
        assert.equal(Object.keys(restored.quizAnswers).length, 0);
        assert.equal(fresh.window.LearningEngine.getSession(other), otherSession);
        assert.equal(fresh.window.LearningEngine.canStartQuiz(id), false);
    });
}

test('quadratic coefficient never becomes zero or non-finite, including restored snapshots', () => {
    const h = harness(), scene = h.course('quadratic-function');
    scene.adjustParameter('a', 0);
    assert.equal(scene.params.a, 0.1);
    scene.adjustParameter('a', NaN);
    assert.equal(scene.params.a, 0.1);
    h.window.LearningEngine.updateSceneState(scene.sceneId, { params: { a: 0, b: 999, c: 2 }, currentStep: 5 });
    const restored = h.course(scene.sceneId);
    assert.equal(restored.params.a, 1);
    assert.equal(restored.params.b, 0);
    assert.equal(restored.params.c, 2);
    assert.ok(restored.currentStep < 5);
});

test('circuit equations use the expected series and parallel currents and voltage drops', () => {
    const h = harness(), scene = h.course('circuit-ohm');
    const series = scene.calculateCircuitMetrics();
    assert.equal(series.req, 12);
    assert.equal(series.totalCurrent, 1);
    assert.equal(series.voltage1 + series.voltage2, 12);
    scene.switchMode('parallel');
    const parallel = scene.calculateCircuitMetrics();
    assert.equal(parallel.req, 3);
    assert.equal(parallel.totalCurrent, 4);
    assert.equal(parallel.voltage1, 12);
    assert.equal(parallel.voltage2, 12);
    scene.startOhmLawDemo();
    scene.updateResistance('resistance2', 0);
    assert.equal(scene.demoState, null);
    assert.equal(scene.state.resistance2, 1);
});

test('quadratic vertex updates release the replaced geometry and material', () => {
    const h = harness(), scene = h.course('quadratic-function');
    let geometryDisposed = 0, materialDisposed = 0;
    h.context.THREE.SphereGeometry = class { dispose() { geometryDisposed++; } };
    h.context.THREE.MeshStandardMaterial = class { dispose() { materialDisposed++; } };
    h.context.THREE.Mesh = class { constructor(geometry, material) { Object.assign(this, {geometry, material, position: {set() {}}}); } };
    scene.mainGroup = { add() {}, remove() {} };
    Object.getPrototypeOf(scene).createVertexMarker.call(scene);
    Object.getPrototypeOf(scene).createVertexMarker.call(scene);
    assert.equal(geometryDisposed, 1);
    assert.equal(materialDisposed, 1);
});

test('circuit rebuilding releases removed shared resources while retaining its grid', () => {
    const h = harness(), scene = h.course('circuit-ohm');
    const disposed = [];
    const geometry = { dispose() { disposed.push('geometry'); } };
    const texture = { isTexture: true, dispose() { disposed.push('texture'); } };
    const material = { map: texture, dispose() { disposed.push('material'); } };
    const mesh = { traverse(fn) { fn({geometry, material}); } };
    const grid = {};
    scene.mainGroup = { children: [grid, mesh, mesh], remove(object) { this.children.splice(this.children.indexOf(object), 1); } };
    scene.releaseCircuitObjects();
    assert.deepEqual(disposed.sort(), ['geometry', 'material', 'texture']);
    assert.deepEqual(scene.mainGroup.children, [grid]);
});

test('parallel wiring connects each branch across distinct supply rails without shorting the battery', () => {
    const h = harness(), scene = h.course('circuit-ohm');
    class Vector3 {
        constructor(x, y, z) { Object.assign(this, {x,y,z}); }
        clone() { return new Vector3(this.x, this.y, this.z); }
        add(other) { this.x += other.x; this.y += other.y; this.z += other.z; return this; }
    }
    h.context.THREE.Vector3 = Vector3;
    scene.state.mode = 'parallel';
    scene.components = {
        resistor1: {position:new Vector3(-0.4,1.4,0.5)}, resistor2:{position:new Vector3(-0.4,-1.4,0.5)},
        bulb1:{position:new Vector3(2.8,1.4,0.5)}, bulb2:{position:new Vector3(2.8,-1.4,0.5)}
    };
    const wires = [];
    scene.addJunction = scene.addDirectionArrow = () => {};
    scene.addWire = points => wires.push(Array.from(points, p => `${p.x},${p.y},${p.z}`));
    scene.buildWireTopology();
    const [positiveRail, negativeRail, top, bottom] = wires;
    assert.equal(positiveRail[0], '-4.6,1.2,0.8');
    assert.equal(negativeRail.at(-1), '-4.6,-1.2,0.8');
    assert.equal(positiveRail.some(point => negativeRail.includes(point)), false);
    for (const branch of [top, bottom]) {
        assert.ok(positiveRail.includes(branch[0]));
        assert.ok(negativeRail.includes(branch.at(-1)));
    }
});

test('AI feedback handles failures as text and ignores answers after course reset', async () => {
    const h = harness(), scene = h.course('quadratic-function');
    for (let step = 1; step <= 3; step++) scene.executeStepAction(step);
    scene.showQuizPanel();
    for (const question of h.window.QuizBank[scene.sceneId]) answer(scene, question, question.correctAnswer);
    scene.submitQuiz();
    h.window.AIService = { async chat() { return {success:true, message:'<img src=x onerror=alert(1)>'}; } };
    await scene.askAIFeedback();
    const box = h.ids.get('qf-quiz-feedback');
    assert.equal(box.children.at(-1).textContent, '🎓 <img src=x onerror=alert(1)>');
    assert.equal(box.children.at(-1).innerHTML, '');
    h.window.AIService.chat = async () => { throw new Error('offline'); };
    await scene.askAIFeedback();
    assert.match(box.children.at(-1).textContent, /暂不可用/);
    let resolve;
    h.window.AIService.chat = () => new Promise(r => {resolve = r;});
    const pending = scene.askAIFeedback();
    const status = box.children.at(-1);
    scene.reset();
    resolve({success:true, message:'old result'});
    await pending;
    assert.notEqual(status.textContent, '🎓 old result');
});

function attachPickingManager(h, scene) {
    class Vector3 {
        constructor(x = 0, y = 0, z = 0) { this.set(x, y, z); }
        set(x, y, z) { Object.assign(this, {x, y, z}); return this; }
        copy(vector) { return this.set(vector.x, vector.y, vector.z); }
        clone() { return new Vector3(this.x, this.y, this.z); }
    }
    class Geometry { dispose() {} }
    class Material { constructor(options) { Object.assign(this, options); } dispose() {} }
    class Mesh {
        constructor(geometry, material) { Object.assign(this, {geometry, material, position:new Vector3(), userData:{}}); }
        traverse(callback) { callback(this); }
    }
    Object.assign(h.context.THREE, { Vector3, SphereGeometry:Geometry, BoxGeometry:Geometry, MeshStandardMaterial:Material, Mesh });
    scene.scene.remove = () => {};
    scene.mainGroup = {
        children: [], parent: scene.scene,
        add(...objects) { objects.forEach(object => { object.parent = this; this.children.push(object); }); },
        remove(object) { const index = this.children.indexOf(object); if (index >= 0) this.children.splice(index, 1); object.parent = null; }
    };
    vm.runInContext(managerSource, h.context);
    const manager = Object.create(vm.runInContext('SceneManager.prototype', h.context));
    manager.container = h.ids.get('scene-canvas-container');
    manager.container.getBoundingClientRect = () => ({left:0, top:0, width:100, height:100});
    Object.assign(manager, { labels: [], currentNavigationTool:'select', pointerDragged:false, currentSceneInstance:scene, scene:scene.scene, camera:scene.camera, mouse:{}, renderer:{domElement:{}}, raycaster:{setFromCamera(){}, intersectObjects(){return [{object:manager.testHit}];}} });
    return manager;
}

test('the real manager click handler opens descriptions for both course models', () => {
    for (const id of ['quadratic-function', 'circuit-ohm']) {
        const h = harness(), scene = h.course(id), manager = attachPickingManager(h, scene);
        if (id === 'quadratic-function') {
            Object.getPrototypeOf(scene).createVertexMarker.call(scene);
        } else {
            scene.buildWireTopology = () => {};
            Object.getPrototypeOf(scene).renderCircuit.call(scene);
        }
        const objects = scene.getInteractables();
        assert.equal(objects.length, id === 'quadratic-function' ? 1 : 5);
        for (const object of objects) {
            manager.testHit = object;
            manager.onClick({clientX:50, clientY:50, target:manager.renderer.domElement});
            assert.equal(manager.selectedObject, object);
            assert.ok(h.ids.get('info-title').innerHTML.includes(object.userData.name));
            assert.equal(h.ids.get('info-content').innerHTML, object.userData.description);
        }
    }
});

test('vertex labels follow replacement markers and are removed without touching other labels', () => {
    const h = harness(), scene = h.course('quadratic-function'), manager = attachPickingManager(h, scene);
    scene.createVertexMarker = Object.getPrototypeOf(scene).createVertexMarker;
    scene.createVertexMarker();
    const unrelated = { element:{} };
    manager.labels.push(unrelated);
    scene.createLabels(manager);
    const label = scene.courseLabel;
    scene.adjustParameter('b', 4);
    assert.equal(label.position.x, -2);
    assert.equal(label.position.y, -4);
    scene.reset();
    assert.ok(label.position.x === 0);
    assert.equal(label.position.y, 0);
    scene.createLabels(manager);
    assert.equal(manager.labels.length, 2, 'recreating labels must replace the old owned entry');
    assert.equal(label.container.isConnected, false);
    scene.dispose();
    assert.deepEqual(manager.labels, [unrelated]);
});

test('circuit mode label follows switching and resetting, with no duplicate labels', () => {
    const h = harness(), scene = h.course('circuit-ohm'), manager = attachPickingManager(h, scene);
    scene.renderCircuit = Object.getPrototypeOf(scene).renderCircuit;
    scene.buildWireTopology = () => {};
    scene.renderCircuit();
    scene.createLabels(manager);
    assert.match(scene.courseLabel.element.innerHTML, /串联模式/);
    scene.switchMode('parallel');
    assert.match(scene.courseLabel.element.innerHTML, /并联模式/);
    scene.reset();
    assert.match(scene.courseLabel.element.innerHTML, /串联模式/);
    scene.createLabels(manager);
    assert.equal(manager.labels.length, 1);
    scene.dispose();
    assert.equal(manager.labels.length, 0);
});
