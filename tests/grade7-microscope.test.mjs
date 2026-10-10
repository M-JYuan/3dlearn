import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../scenes/grade7-microscope-scene.js', import.meta.url), 'utf8');
function microscope() {
    const elements = new Map();
    const context = vm.createContext({ window: {}, THREE: { Vector3: class {} }, document: {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, { classList: { toggle() {} } });
            return elements.get(id);
        }
    } });
    vm.runInContext(source, context);
    return { scene: new context.window.Grade7MicroscopeScene(), elements };
}

test('microscope coarse focus only moves the part used by the selected model', () => {
    const {scene} = microscope();
    scene.nudge('stage', 1);
    assert.equal(scene.stageLift, 0, 'single-eye microscope must not move its stage');
    scene.head = 'bino';
    scene.nudge('tube', 1);
    assert.equal(scene.tubeDrop, 0, 'binocular microscope must not move its tube');
    scene.sideView = true;
    scene.nudge('stage', 1);
    assert.ok(scene.stageLift > 0);
});

test('coarse focus requires a side view and stays disabled at high magnification', () => {
    const {scene, elements} = microscope();
    scene.nudge('tube', 1);
    assert.equal(scene.tubeDrop, 0);
    scene.sideView = true;
    scene.nudge('tube', 1);
    assert.ok(scene.tubeDrop > 0);
    const previous = scene.tubeDrop;
    scene.objective = 40;
    scene.nudge('tube', 1);
    assert.equal(scene.tubeDrop, previous);
    scene.syncButtons();
    for (const id of ['down', 'up', 'stage-up', 'stage-down']) {
        assert.equal(elements.get('grade7-microscope-btn-' + id).disabled, true);
    }
});
