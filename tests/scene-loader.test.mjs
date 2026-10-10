import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../js/scene-loader.js', import.meta.url), 'utf8');
function harness({ registry } = {}) {
    let now = 0;
    let nextId = 0;
    const timers = new Map();
    const scripts = [];
    const context = vm.createContext({
        window: registry ? { CasesConfig: registry } : {},
        console: { warn() {} },
        document: {
            createElement(tag) {
                assert.equal(tag, 'script');
                return { remove() { this.removed = true; } };
            },
            body: { appendChild(script) { scripts.push(script); } }
        },
        setTimeout(callback, delay) {
            const id = ++nextId;
            timers.set(id, { callback, at: now + delay });
            return id;
        },
        clearTimeout(id) { timers.delete(id); }
    });
    vm.runInContext(source, context);
    const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
    return {
        loader: context.window.SceneLoader, scripts, timers, flush,
        async advance(ms) {
            now += ms;
            for (const [id, timer] of [...timers]) {
                if (timer.at <= now && timers.delete(id)) timer.callback();
            }
            await flush();
        }
    };
}
const config = id => ({ id, type: 'scene' });

test('unknown and prototype scene IDs cannot masquerade as ready', async () => {
    const { loader, scripts } = harness();
    for (const id of ['missing', 'toString', '__proto__', 'constructor', undefined]) {
        assert.equal(loader.isSceneReady(id), false);
        await assert.rejects(loader.ensureSceneLoaded(config(id)), { code: 'SCENE_UNKNOWN' });
    }
    await loader.ensureSceneLoaded({ id: 'slides', type: 'ppt' });
    await loader.preloadCases(['missing', 'toString']);
    assert.equal(scripts.length, 0);
});

test('concurrent preload and scene clicks share one script and successful loads are cached', async () => {
    const { loader, scripts, timers } = harness();
    const preload = loader.preloadCases(['quantum']);
    const first = loader.ensureSceneLoaded(config('quantum'));
    const second = loader.ensureSceneLoaded(config('quantum'));
    assert.equal(scripts.length, 1);
    assert.equal(loader.isSceneReady('quantum'), false);
    scripts[0].onload();
    await Promise.all([preload, first, second]);
    assert.equal(loader.isSceneReady('quantum'), true);
    await loader.ensureSceneLoaded(config('quantum'));
    assert.equal(scripts.length, 1);
    assert.equal(timers.size, 0);
});

test('failed preload can be retried by a click and stale events cannot overwrite the replacement', async () => {
    const { loader, scripts, timers, flush } = harness();
    const preload = loader.preloadCases(['quantum']);
    const oldLoad = scripts[0].onload;
    const oldError = scripts[0].onerror;
    oldError();
    await preload;
    assert.equal(scripts[0].removed, true);
    const click = loader.ensureSceneLoaded(config('quantum'));
    assert.equal(scripts.length, 2);
    oldLoad();
    oldError();
    await flush();
    assert.equal(loader.isSceneReady('quantum'), false);
    assert.equal(scripts[1].removed, undefined);
    scripts[1].onload();
    await click;
    assert.equal(loader.isSceneReady('quantum'), true);
    assert.equal(timers.size, 0);
});

test('concurrent clicks retry a network failure once using one replacement request', async () => {
    const { loader, scripts, flush, advance } = harness();
    const first = loader.ensureSceneLoaded(config('quantum'));
    const second = loader.ensureSceneLoaded(config('quantum'));
    const firstFailure = assert.rejects(first, { code: 'SCENE_SCRIPT_ERROR' });
    const secondFailure = assert.rejects(second, { code: 'SCENE_SCRIPT_ERROR' });
    scripts[0].onerror();
    await flush();
    await advance(220);
    assert.equal(scripts.length, 2);
    scripts[1].onerror();
    await Promise.all([firstFailure, secondFailure]);
    const retry = loader.ensureSceneLoaded(config('quantum'));
    assert.equal(scripts.length, 3);
    scripts[2].onload();
    await retry;
});

test('click joined to a failing preload still has its own network retry allowance', async () => {
    const { loader, scripts, flush, advance } = harness();
    const preload = loader.preloadCases(['quantum']);
    const click = loader.ensureSceneLoaded(config('quantum'));
    scripts[0].onerror();
    await preload;
    await flush();
    await advance(220);
    assert.equal(scripts.length, 2);
    scripts[1].onload();
    await click;
});

test('never responding scripts time out repeatedly without duplicate script execution', async () => {
    const { loader, scripts, timers, advance } = harness();
    for (let attempt = 0; attempt < 3; attempt++) {
        const failure = assert.rejects(loader.ensureSceneLoaded(config('quantum')), { code: 'SCENE_SCRIPT_TIMEOUT' });
        await advance(30000);
        await failure;
        assert.equal(scripts.length, 1);
        assert.equal(scripts[0].removed, undefined);
        assert.equal(loader.isSceneReady('quantum'), false);
        assert.equal(timers.size, 0);
    }
});

test('late load resolves only current waiters after an earlier caller timed out', async () => {
    const { loader, scripts, timers, advance } = harness();
    const first = assert.rejects(loader.ensureSceneLoaded(config('quantum')), { code: 'SCENE_SCRIPT_TIMEOUT' });
    await advance(30000);
    await first;
    const retry = loader.ensureSceneLoaded(config('quantum'));
    assert.equal(scripts.length, 1);
    scripts[0].onload();
    await retry;
    assert.equal(loader.isSceneReady('quantum'), true);
    assert.equal(timers.size, 0);
});

test('timeout is per caller and late network errors allow an actual retry', async () => {
    const { loader, scripts, advance, flush } = harness();
    const first = assert.rejects(loader.ensureSceneLoaded(config('quantum')), { code: 'SCENE_SCRIPT_TIMEOUT' });
    await advance(15000);
    let secondFinished = false;
    const second = loader.ensureSceneLoaded(config('quantum')).then(() => { secondFinished = true; });
    await advance(15000);
    await first;
    assert.equal(secondFinished, false);
    scripts[0].onerror();
    await flush();
    await advance(220);
    assert.equal(scripts.length, 2);
    scripts[1].onload();
    await second;
});

test('dependencies load in order and a failed prerequisite never executes its dependent scene', async () => {
    const { loader, scripts, flush } = harness();
    const preload = loader.preloadCases(['smartmine']);
    assert.match(scripts[0].src, /mine-mock-data/);
    scripts[0].onerror();
    await preload;
    assert.equal(scripts.length, 1);
    const click = loader.ensureSceneLoaded(config('smartmine'));
    assert.match(scripts[1].src, /mine-mock-data/);
    scripts[1].onload();
    await flush();
    assert.equal(scripts.length, 3);
    assert.match(scripts[2].src, /smart-mine-scene/);
    scripts[2].onload();
    await click;
    assert.equal(loader.isSceneReady('smartmine'), true);
});

test('preload timeout releases its queue and a late success is reused by clicks', async () => {
    const { loader, scripts, advance } = harness();
    const preload = loader.preloadCases(['quantum', 'gravity']);
    await advance(30000);
    assert.equal(scripts.length, 2);
    scripts[1].onload();
    await preload;
    scripts[0].onload();
    await loader.ensureSceneLoaded(config('quantum'));
    assert.equal(scripts.length, 2);
});

test('script load without its constructor is not ready and is never executed twice', async () => {
    let registered = false;
    const { loader, scripts } = harness({ registry: { getSceneClass() { return registered ? class Scene {} : null; } } });
    const failed = assert.rejects(loader.ensureSceneLoaded(config('quantum')), { code: 'SCENE_REGISTRATION_ERROR' });
    scripts[0].onload();
    await failed;
    assert.equal(loader.isSceneReady('quantum'), false);
    await assert.rejects(loader.ensureSceneLoaded(config('quantum')), { code: 'SCENE_REGISTRATION_ERROR' });
    assert.equal(scripts.length, 1);
    registered = true;
    await loader.ensureSceneLoaded(config('quantum'));
    assert.equal(loader.isSceneReady('quantum'), true);
});
