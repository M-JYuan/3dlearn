/**
 * SceneLoader - 场景脚本按需加载器
 * 目标：首屏不加载 45+ 场景脚本，仅在用户点击场景时加载对应文件
 */
(function () {
    const SCENE_ASSET_MAP = {
        attention: ['scenes/attention-scene.js'],
        quantum: ['scenes/quantum-scene.js'],
        hydraulic: ['scenes/hydraulic-scene.js'],
        engine: ['scenes/engine-scene.js'],
        pendulum: ['scenes/pendulum-scene.js'],
        electromagnetic: ['scenes/electromagnetic-scene.js'],
        'circuit-ohm': ['scenes/circuit-ohm-scene.js'],
        vector3d: ['scenes/vector3d-scene.js'],
        conic: ['scenes/conic-scene.js'],
        'quadratic-function': ['scenes/quadratic-function-scene.js'],
        drumflower: ['scenes/drum-flower-scene.js'],
        gravity: ['scenes/gravity-scene.js'],
        nuclearfission: ['scenes/nuclear-fission-scene.js'],
        migdal: ['scenes/migdal-scene.js'],
        schrodinger: ['scenes/schrodinger-cat-scene.js'],
        tesseract: ['scenes/tesseract-scene.js'],
        gradientdescent: ['scenes/gradient-descent-scene.js'],
        sorting: ['scenes/sorting-scene.js'],
        kmeans: ['scenes/kmeans-scene.js'],
        maze: ['scenes/maze-scene.js'],
        entanglement: ['scenes/quantum-entanglement-scene.js'],
        orbital: ['scenes/orbital-mechanics-scene.js'],
        klein: ['scenes/klein-bottle-scene.js'],
        euler: ['scenes/euler-formula-scene.js'],
        fourier: ['scenes/fourier-scene.js'],
        'three-body': ['scenes/three-body-scene.js'],
        mandelbrot: ['scenes/mandelbrot-scene.js'],
        'dimensional-strike': ['scenes/dimensional-strike-scene.js'],
        boids: ['scenes/boids-scene.js'],
        doppler: ['scenes/doppler-effect-scene.js'],
        entropy: ['scenes/entropy-scene.js'],
        traffic: ['scenes/traffic-flow-scene.js'],
        'golden-spiral': ['scenes/golden-spiral-scene.js'],
        'prisoners-dilemma': ['scenes/prisoners-dilemma-scene.js'],
        'plato-cave': ['scenes/plato-cave-scene.js'],
        lorenz: ['scenes/lorenz-attractor-scene.js'],
        'game-of-life': ['scenes/game-of-life-scene.js'],
        'six-degrees': ['scenes/six-degrees-scene.js'],
        'herd-behavior': ['scenes/herd-behavior-scene.js'],
        'compound-interest': ['scenes/compound-interest-scene.js'],
        'tragedy-of-commons': ['scenes/tragedy-of-commons-scene.js'],
        'husky-battle': ['scenes/husky-battle-scene.js'],
        'geometry-problem': ['scenes/geometry-problem-scene.js'],
        'solid-geometry': ['scenes/solid-geometry-scene.js'],
        smartmine: ['data/mine-mock-data.js', 'scenes/smart-mine-scene.js'],
        'grade7-cell-mount': ['scenes/grade7-cell-mount-scene.js'],
        'grade7-microscope': ['scenes/grade7-microscope-scene.js'],
        'grade7-life-test': ['scenes/grade7-life-test-scene.js'],
        'grade7-dolly': ['scenes/grade7-dolly-scene.js'],
        'grade7-division': ['scenes/grade7-division-scene.js'],
        'grade7-paramecium': ['scenes/grade7-paramecium-scene.js'],
        'grade7-seed': ['scenes/grade7-seed-scene.js'],
        'grade7-fish-gill': ['scenes/grade7-fish-gill-scene.js'],
        'grade7-classify': ['scenes/grade7-classify-scene.js'],
        'grade7-campus': ['scenes/grade7-campus-scene.js'],
        'grade7-cell-life': ['scenes/grade7-cell-life-scene.js'],
        'grade7-animal-levels': ['scenes/grade7-animal-levels-scene.js'],
        'grade7-plant-levels': ['scenes/grade7-plant-levels-scene.js'],
        'grade7-plant-groups': ['scenes/grade7-plant-groups-scene.js'],
        'grade7-invertebrate': ['scenes/grade7-invertebrate-scene.js'],
        'grade7-amphibian': ['scenes/grade7-amphibian-scene.js'],
        'grade7-bird-mammal': ['scenes/grade7-bird-mammal-scene.js'],
        'grade7-cell-model': ['scenes/grade7-cell-model-scene.js'],
        'grade7-microbe-lab': ['scenes/grade7-microbe-lab-scene.js'],
        'grade7-bacteria': ['scenes/grade7-bacteria-scene.js'],
        'grade7-fungus': ['scenes/grade7-fungus-scene.js'],
        'grade7-virus': ['scenes/grade7-virus-scene.js'],
        'grade7-ferment': ['scenes/grade7-ferment-scene.js']
    };

    const assetRequests = new Map();
    const LOAD_TIMEOUT_MS = 30000;
    const RETRY_DELAY_MS = 220;

    function loaderError(message, code) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    function getAssets(caseId) {
        return typeof caseId === 'string' && Object.prototype.hasOwnProperty.call(SCENE_ASSET_MAP, caseId)
            ? SCENE_ASSET_MAP[caseId] : null;
    }

    function getAssetRequest(src) {
        const existing = assetRequests.get(src);
        if (existing) return existing;

        const script = document.createElement('script');
        const request = { script, status: 'loading', waiters: new Set(), error: null };
        assetRequests.set(src, request);

        const finish = (error = null) => {
            if (assetRequests.get(src) !== request || request.status !== 'loading') return;
            request.status = error ? 'failed' : 'loaded';
            request.error = error;
            script.onload = script.onerror = null;
            if (error) {
                assetRequests.delete(src);
                script.remove();
            }
            request.waiters.forEach(waiter => {
                clearTimeout(waiter.timer);
                if (error) waiter.reject(error);
                else waiter.resolve();
            });
            request.waiters.clear();
        };

        script.src = `${src}?v=lazy1`;
        script.async = true;
        script.onload = () => finish();
        script.onerror = () => finish(loaderError(`脚本加载失败: ${src}`, 'SCENE_SCRIPT_ERROR'));
        try {
            document.body.appendChild(script);
        } catch {
            finish(loaderError(`无法添加场景脚本: ${src}`, 'SCENE_SCRIPT_ERROR'));
        }
        return request;
    }

    function waitForAsset(src) {
        const request = getAssetRequest(src);
        if (request.status === 'loaded') return Promise.resolve();
        if (request.status === 'failed') return Promise.reject(request.error);

        return new Promise((resolve, reject) => {
            const waiter = { resolve, reject, timer: null };
            waiter.timer = setTimeout(() => {
                request.waiters.delete(waiter);
                reject(loaderError(`场景加载超时，请重试继续等待或刷新页面: ${src}`, 'SCENE_SCRIPT_TIMEOUT'));
            }, LOAD_TIMEOUT_MS);
            request.waiters.add(waiter);
        });
    }

    async function loadScript(src, retries = 0) {
        for (let attempt = 0; ; attempt += 1) {
            try {
                await waitForAsset(src);
                return;
            } catch (error) {
                // Removing a pending script does not reliably cancel its execution. A timeout
                // only releases this caller; later callers keep waiting on the same element.
                if (error.code !== 'SCENE_SCRIPT_ERROR' || attempt >= retries) throw error;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
    }

    function hasSceneConstructor(caseId) {
        if (typeof window.CasesConfig?.getSceneClass !== 'function') return true;
        try {
            return typeof window.CasesConfig.getSceneClass(caseId) === 'function';
        } catch {
            return false;
        }
    }

    async function ensureSceneLoaded(caseConfig) {
        if (!caseConfig || caseConfig.type !== 'scene') return;
        const assets = getAssets(caseConfig.id);
        if (!assets || assets.length === 0) {
            throw loaderError(`未知场景: ${caseConfig.id}`, 'SCENE_UNKNOWN');
        }
        for (const asset of assets) await loadScript(asset, 1);
        if (!hasSceneConstructor(caseConfig.id)) {
            // onload can still fire after a script throws during evaluation. Do not execute
            // it again: already-declared globals may make a second evaluation unsafe.
            throw loaderError(`场景脚本未正确初始化，请刷新页面: ${caseConfig.id}`, 'SCENE_REGISTRATION_ERROR');
        }
    }

    async function preloadCases(caseIds = []) {
        for (const caseId of caseIds) {
            const assets = getAssets(caseId);
            if (!assets || assets.length === 0) continue;
            for (const asset of assets) {
                try {
                    await loadScript(asset);
                } catch (error) {
                    console.warn('[SceneLoader] 预加载失败:', asset, error.message);
                    // Never execute a scene when one of its prerequisites failed.
                    break;
                }
            }
        }
    }

    function isSceneReady(caseId) {
        const assets = getAssets(caseId);
        return !!assets?.length && assets.every(asset => assetRequests.get(asset)?.status === 'loaded')
            && hasSceneConstructor(caseId);
    }

    window.SceneLoader = {
        ensureSceneLoaded,
        preloadCases,
        isSceneReady
    };
})();
