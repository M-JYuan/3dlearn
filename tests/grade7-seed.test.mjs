import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../scenes/grade7-seed-scene.js', import.meta.url), 'utf8');
// Rendering doubles retain color and pose state; exercise the real teaching controls and animation.
function setup() {
    const elements = new Map();
    const context = vm.createContext({ window: {}, document: { getElementById(id) {
        if (!elements.has(id)) elements.set(id, { classList: { toggle() {} } });
        return elements.get(id);
    } } });
    vm.runInContext(source, context);
    const scene = new context.window.Grade7SeedScene();
    class Color {
        constructor(value) { this.value = value; }
        copy(other) { this.value = other.value; return this; }
        lerp(other, alpha) { this.value += (other.value - this.value) * alpha; return this; }
    }
    const object = () => ({ visible: true, position: { set() {} }, rotation: {}, scale: {}, material: { color: new Color(1), opacity: 1 } });
    for (const name of ['group', 'bean', 'corn', 'sporeGrp', 'coatPivot', 'cotLPivot', 'cotRPivot', 'embryo', 'cornWhole', 'cornCut', 'wholeLabel', 'beanSprout', 'cornSprout', 'sporeThread', 'spore', 'cotL', 'cotR']) scene[name] = object();
    scene.endoBase = new Color(1);
    scene.cotLBase = new Color(2);
    scene.cotRBase = new Color(3);
    scene.endoBlue = new Color(9);
    scene.endospermMat = { color: new Color(1) };
    return { scene, elements };
}

test('iodine opens a bean and stains both cotyledons, not the hidden corn endosperm', () => {
    const {scene, elements} = setup();
    scene.toggleIodine();
    assert.equal(scene.opened, true);
    scene.animate(0, 1);
    assert.equal(scene.cotL.material.color.value, 9);
    assert.equal(scene.cotR.material.color.value, 9);
    assert.equal(scene.endospermMat.color.value, 1);
    assert.match(elements.get('g7seed-caption').textContent, /子叶.*淀粉/);
    scene.toggleIodine();
    scene.animate(1, 1);
    assert.equal(scene.cotL.material.color.value, 2);
    assert.equal(scene.cotR.material.color.value, 3);
});

test('iodine exposes and stains corn endosperm while restoring bean colors', () => {
    const {scene} = setup();
    scene.toggleIodine();
    scene.animate(0, 1);
    scene.choose('corn');
    scene.animate(1, 1);
    assert.equal(scene.cornCut.visible, true);
    assert.equal(scene.endospermMat.color.value, 9);
    assert.equal(scene.cotL.material.color.value, 2);
    assert.equal(scene.cotR.material.color.value, 3);
});

test('spores remain intact before suitable conditions, without a death visual', () => {
    const {scene, elements} = setup();
    scene.toggleSpore();
    scene.animate(0, 1);
    assert.equal(scene.spore.material.opacity, 1);
    assert.equal(scene.spore.material.color.value, 1);
    assert.equal(scene.sporeThread.visible, false);
    scene.toggleEnv('dry');
    scene.animate(1, 1);
    assert.equal(scene.spore.material.opacity, 1);
    assert.equal(scene.spore.material.color.value, 1);
    assert.match(elements.get('g7seed-caption').textContent, /耐受性因种类而异/);
    assert.match(elements.get('g7seed-caption').textContent, /种子有活力、空气充足/);
});
