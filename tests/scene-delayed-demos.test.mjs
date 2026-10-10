import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const sources = Object.fromEntries(await Promise.all(['quantum', 'electromagnetic'].map(async name => [name, await readFile(new URL(`../scenes/${name}-scene.js`, import.meta.url), 'utf8')])));
function harness(name) {
    let id = 0;
    const timers = new Map(), tweens = new Set(), guides = [], draws = [];
    const gsap = {
        to(target, options) { const tween = { target, options }; tweens.add(tween); return tween; },
        killTweensOf(target) { for (const tween of tweens) if (tween.target === target) tweens.delete(tween); }
    };
    const context = vm.createContext({ window: {}, THREE: { Clock: class {} }, gsap,
        setTimeout(fn) { timers.set(++id, fn); return id; }, clearTimeout(id) { timers.delete(id); }
    });
    vm.runInContext(sources[name], context);
    const scene = new context.window[name === 'quantum' ? 'QuantumScene' : 'ElectromagneticScene']();
    scene.observerRay = { material: {} };
    scene.magnet = { position: { y: 5 } };
    scene.clearScreen = () => draws.push('clear');
    scene.drawInterferencePattern = () => draws.push('wave');
    scene.drawParticlePattern = () => draws.push('particle');
    scene.showExperimentGuide = scene.showGuide = message => guides.push(message);
    function flush() { for (const [id, fn] of [...timers]) if (timers.delete(id)) fn(); }
    return { scene, timers, tweens, guides, draws, flush };
}

test('changing quantum experiments cancels the previous delayed pattern', () => {
    const h = harness('quantum');
    h.scene.runWaveExperiment();
    h.scene.runObserveExperiment();
    h.flush();
    assert.deepEqual(h.draws, ['clear', 'clear', 'particle']);
    h.scene.runWaveExperiment();
    h.scene.resetExperiment();
    h.flush();
    assert.equal(h.draws.includes('wave'), false);
});

for (const name of ['quantum', 'electromagnetic']) {
    test(`${name} autoplay never starts after leaving the scene`, () => {
        const h = harness(name);
        h.scene.startAutoPlay();
        h.scene.dispose();
        h.flush();
        assert.equal(h.timers.size, 0);
        assert.equal(h.guides.length, 0);
        assert.equal(h.draws.length, 0);
        assert.equal(h.tweens.size, 0);
    });
}

test('quantum dispose also cancels a running experiment delayed result', () => {
    const h = harness('quantum');
    h.scene.runWaveExperiment();
    const count = h.guides.length;
    h.scene.dispose();
    h.flush();
    assert.deepEqual(h.draws, ['clear']);
    assert.equal(h.guides.length, count);
});

test('electromagnetic reset cancels autoplay and current magnet motion', () => {
    const h = harness('electromagnetic');
    h.scene.startAutoPlay();
    h.flush(); // Initial guide has run; the nested demo remains pending.
    h.scene.resetScene();
    h.flush();
    assert.equal(h.tweens.size, 0);
    h.scene.autoDemo();
    assert.equal(h.tweens.size, 1);
    h.scene.resetScene();
    assert.equal(h.tweens.size, 0);
    assert.equal(h.scene.magnet.position.y, 5);
    assert.equal(h.scene.params.inducedCurrent, 0);
    assert.equal(h.scene.params.isMoving, false);
});
