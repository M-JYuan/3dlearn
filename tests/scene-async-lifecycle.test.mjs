import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const sources = Object.fromEntries(await Promise.all(['sorting', 'maze'].map(async name => [name, await readFile(new URL(`../scenes/${name}-scene.js`, import.meta.url), 'utf8')])));
function harness(name) {
    let now = 0, next = 0;
    const tasks = new Map();
    const killed = [];
    const schedule = (fn, delay = 0) => { const id = ++next; tasks.set(id, { fn, at: now + delay }); return id; };
    const context = vm.createContext({ window: {}, console, Date: { now: () => now },
        setTimeout: schedule, clearTimeout: id => tasks.delete(id),
        requestAnimationFrame: fn => schedule(fn, 16), cancelAnimationFrame: id => tasks.delete(id),
        document: { getElementById() { return null; } },
        gsap: { to() {}, killTweensOf(target) { killed.push(target); } }
    });
    vm.runInContext(sources[name], context);
    const scene = new context.window[name === 'sorting' ? 'SortingScene' : 'MazeScene']();
    const guides = [];
    scene.showGuide = message => guides.push(message);
    scene.updateStats = () => {};
    scene.updateInfoPanel = () => {};
    async function tick(ms = 16) {
        now += ms;
        for (const [id, task] of [...tasks]) {
            if (task.at <= now && tasks.delete(id)) task.fn(now);
        }
        for (let i = 0; i < 15; i++) await Promise.resolve();
    }
    async function finish(promise) {
        let done = false, failure;
        promise.then(() => { done = true; }, error => { done = true; failure = error; });
        for (let i = 0; i < 2000 && !done; i++) await tick();
        assert.equal(done, true, 'operation must settle');
        if (failure) throw failure;
    }
    return { scene, tasks, guides, killed, tick, finish };
}
function bars(values) {
    return values.map((value, index) => ({ position: { x: index, y: value / 2, z: 0 }, userData: { index, value, mesh: { material: { color: { setHex() {} }, emissive: { setHex() {} } } } } }));
}
function sorting() {
    const h = harness('sorting');
    h.scene.displayBars = bars([4, 1, 3, 2]);
    h.scene.sortSpeed = 20;
    h.scene.generateArray = () => {};
    h.scene.createBars = () => { h.scene.displayBars = bars([9, 7, 8]); };
    return h;
}
function maze() {
    const h = harness('maze');
    const s = h.scene;
    s.mazeSize = 7;
    s.maze = Array.from({ length: 7 }, () => Array(7).fill(0));
    s.center = { x: 3, z: 3 };
    s.corners = [{ x: 0, z: 0, name: 'start' }];
    s.cornerAlgorithms = ['astar'];
    s.robots = [{ position: { set() {} }, userData: {} }];
    s.setCellColor = () => {};
    s.moveRobot = () => {};
    s.resetVisualization = () => {};
    s.generateMaze = () => {};
    s.createMazeVisualization = () => {};
    s.mainGroup = { remove() {} };
    s.highlightPath = () => {};
    return h;
}

for (const algorithm of ['bubble', 'selection', 'insertion', 'quick', 'merge']) {
    test(`${algorithm} still sorts correctly and settles after cancellation`, async () => {
        const h = sorting();
        h.scene.currentAlgorithm = algorithm;
        await h.finish(h.scene.startSort());
        assert.deepEqual(h.scene.displayBars.map(bar => bar.userData.value), [1, 2, 3, 4]);
        h.scene.reset();
        const cancelled = h.scene.startSort();
        h.scene.dispose();
        await h.finish(cancelled);
        assert.equal(h.tasks.size, 0);
    });
}

test('old sorting continuation cannot mutate reset bars or stop a restarted sort', async () => {
    const h = sorting();
    const old = h.scene.startSort();
    h.scene.reset();
    const fresh = h.scene.startSort();
    await old;
    assert.equal(h.scene.isSorting, true);
    assert.deepEqual(h.scene.displayBars.map(bar => bar.userData.value), [9, 7, 8]);
    h.scene.stopSort();
    await fresh;
    assert.equal(h.tasks.size, 0);
});

test('pausing an in-flight swap freezes positions and dispose cancels its RAF', async () => {
    const h = sorting();
    h.scene.isSorting = true;
    h.scene.sortSpeed = 100;
    const work = h.scene.swapBars(0, 1);
    await h.tick(16);
    h.scene.togglePause();
    const position = h.scene.displayBars[0].position.x;
    await h.tick(100);
    assert.equal(h.scene.displayBars[0].position.x, position);
    const cancelled = assert.rejects(work, { name: 'AbortError' });
    h.scene.dispose();
    await cancelled;
    assert.equal(h.tasks.size, 0);
    assert.equal(h.scene.swaps, 0);
});

test('pause during comparison prevents advancing when its timeout expires', async () => {
    const h = sorting();
    const work = h.scene.startSort();
    h.scene.togglePause();
    await h.tick(100);
    assert.equal(h.scene.comparisons, 1);
    assert.equal(h.scene.swaps, 0);
    h.scene.togglePause();
    await h.finish(work);
    assert.deepEqual(h.scene.displayBars.map(bar => bar.userData.value), [1, 2, 3, 4]);
});

for (const algorithm of ['righthand', 'dfs', 'bfs', 'astar', 'dijkstra', 'greedy', 'bidirectional']) {
    test(`maze ${algorithm} cancels on regenerate without stopping a new race`, async () => {
        const h = maze();
        h.scene.cornerAlgorithms = [algorithm];
        const old = h.scene.startRace();
        h.scene.regenerateMaze();
        h.scene.cornerAlgorithms = ['astar'];
        const fresh = h.scene.startRace();
        await old;
        assert.equal(h.scene.isRunning, true);
        assert.equal(h.guides.some(message => message.includes('获胜')), false);
        h.scene.dispose();
        await fresh;
        assert.equal(h.tasks.size, 0);
    });
}

test('maze path highlights and GSAP motion are cancelled on dispose', async () => {
    const h = maze();
    let colors = 0;
    const cell = { type: 'floor', mesh: { position: {}, material: { color: { setHex() { colors++; } }, emissive: { setHex() {} } } } };
    h.scene.cells = [[cell]];
    // Use the real highlight method, retained on the prototype.
    Object.getPrototypeOf(h.scene).highlightPath.call(h.scene, 0, [{ x: 0, z: 0 }]);
    h.scene.startAutoPlay();
    h.scene.dispose();
    await h.tick(1000);
    assert.equal(colors, 0);
    assert.equal(h.tasks.size, 0);
    assert.ok(h.killed.includes(cell.mesh.position));
    assert.equal(h.guides.length, 0);
});

test('bidirectional BFS path starts at the entrance, reaches the goal and stays adjacent', async () => {
    const h = maze();
    h.scene.isRunning = true;
    const work = h.scene.runBidirectional(0);
    await h.finish(work);
    const result = await work;
    const path = Array.from(result.path, p => ({ x: p.x, z: p.z }));
    assert.deepEqual(path[0], { x: 0, z: 0 });
    assert.deepEqual(path.at(-1), { x: 3, z: 3 });
    for (let i = 1; i < path.length; i++) {
        assert.equal(Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].z - path[i - 1].z), 1);
    }
});

test('a resolved delay queued before reset cannot resume against the new bars', async () => {
    const h = sorting();
    const old = h.scene.startSort();
    const checkpoint = h.tick(25); // Timer resolves, but the algorithm continuation has not run yet.
    h.scene.reset();
    const fresh = h.scene.startSort();
    await checkpoint;
    await old;
    assert.equal(h.scene.isSorting, true);
    assert.deepEqual(h.scene.displayBars.map(bar => bar.userData.value), [9, 7, 8]);
    h.scene.stopSort();
    await fresh;
});

test('merge retains ownership of every bar while an in-flight move is cancelled', async () => {
    const h = sorting();
    h.scene.displayBars = bars([4, 1]);
    h.scene.isSorting = true;
    const work = h.scene.merge(0, 0, 1);
    await h.tick(25);
    assert.equal(new Set(h.scene.displayBars).size, 2);
    const cancelled = assert.rejects(work, { name: 'AbortError' });
    h.scene.stopSort();
    await cancelled;
});

test('repeated start does not launch duplicate sort or maze algorithms', async () => {
    for (const h of [sorting(), maze()]) {
        const start = h.scene.startSort ? () => h.scene.startSort() : () => h.scene.startRace();
        const work = start();
        const taskCount = h.tasks.size;
        await start();
        assert.equal(h.tasks.size, taskCount);
        assert.equal(h.guides.length, 1);
        h.scene.dispose();
        await work;
    }
});

test('removed bars and maze meshes release shared geometry, material and label textures once', () => {
    for (const h of [sorting(), maze()]) {
        const disposed = [];
        const geometry = { dispose() { disposed.push('geometry'); } };
        const map = { isTexture: true, dispose() { disposed.push('texture'); } };
        const material = { map, dispose() { disposed.push('material'); } };
        const mesh = { geometry, material, position: {}, traverse(fn) { fn(this); } };
        h.scene.mainGroup = { remove() {} };
        if (h.scene.startSort) {
            h.scene.displayBars = [mesh, mesh];
            h.scene.originalArray = [];
            Object.getPrototypeOf(h.scene).createBars.call(h.scene);
        } else {
            h.scene.cells = [[{ mesh }, { mesh }]];
            h.scene.regenerateMaze();
        }
        assert.deepEqual(disposed.sort(), ['geometry', 'material', 'texture']);
    }
});

test('maze winner uses the algorithm actually run when the selector changes mid-race', async () => {
    const h = maze();
    const work = h.scene.startRace();
    h.scene.cornerAlgorithms = ['dfs'];
    await h.finish(work);
    assert.match(h.guides.at(-1), /A\*算法.*获胜/);
});
