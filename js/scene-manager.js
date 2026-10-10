/**
 * SceneManager - 负责 Three.js 场景的生命周期管理
 * v3.0 - Blender风格专业UI
 */
class SceneManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // 场景对象引用
        this.interactableObjects = [];
        this.labels = [];
        this.clock = new THREE.Clock();

        // 初始教学引导的定时器（清理场景时需要取消，避免回到首页后仍弹出）
        this.guideTimers = [];
        
        // 当前活跃的场景实例
        this.currentSceneInstance = null;
        
        // 当前悬停对象
        this.hoveredObject = null;
        this.selectedObject = null;
        this.currentNavigationTool = 'select';
        this.pointerStart = null;
        this.pointerDragged = false;
        this.wireframeMaterials = new Map();
        this.hiddenGrids = new Map();
        this.wireframeEnabled = false;
        this.gridsHidden = false;
        this.lastViewportUpdate = -Infinity;
        
        // Gizmo相关
        this.gizmoRenderer = null;
        this.gizmoScene = null;
        this.gizmoCamera = null;

        // 绑定事件
        this.resizeHandler = this.onResize.bind(this);
        this.clickHandler = this.onClick.bind(this);
        this.hoverHandler = this.onHover.bind(this);
        this.mouseLeaveHandler = this.onMouseLeave.bind(this);
        this.pointerDownHandler = this.onPointerDown.bind(this);
        this.pointerMoveHandler = this.onPointerMove.bind(this);

        window.addEventListener('resize', this.resizeHandler);
        this.container.addEventListener('click', this.clickHandler);
        this.container.addEventListener('mousemove', this.hoverHandler);
        this.container.addEventListener('mouseleave', this.mouseLeaveHandler);
        this.container.addEventListener('pointerdown', this.pointerDownHandler);
        this.container.addEventListener('pointermove', this.pointerMoveHandler);
        
        // 创建提示框和Blender UI
        this.createTooltip();
        this.createBlenderUI();
    }

    /**
     * 创建悬停提示框元素
     */
    createTooltip() {
        if (document.getElementById('hover-tooltip')) return;
        
        const tooltip = document.createElement('div');
        tooltip.id = 'hover-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title"></div>
            <div class="tooltip-desc"></div>
        `;
        document.body.appendChild(tooltip);
    }

    /**
     * 创建Blender风格UI
     */
    createBlenderUI() {
        const viewScene = document.getElementById('view-scene');
        if (!viewScene || viewScene.querySelector('.viewport-header')) return;
        
        // 顶部信息栏
        const header = document.createElement('div');
        header.className = 'viewport-header';
        header.innerHTML = `
            <div class="view-mode">
                <i class="fas fa-cube"></i>
                <span>Object Mode</span>
            </div>
            <div class="view-info" id="view-angle-info">透视视图</div>
            <div class="scene-stats">
                <span><i class="fas fa-cube"></i> <span id="stat-objects">0</span> 对象</span>
                <span><i class="fas fa-dot-circle"></i> <span id="stat-vertices">0</span> 顶点</span>
                <span><i class="fas fa-clock"></i> <span id="stat-fps">60</span> FPS</span>
            </div>
        `;
        viewScene.appendChild(header);
        
        // 视角快捷按钮
        const viewPresets = document.createElement('div');
        viewPresets.className = 'view-presets';
        viewPresets.innerHTML = `
            <button class="view-preset-btn" data-view="front">前</button>
            <button class="view-preset-btn" data-view="back">后</button>
            <button class="view-preset-btn" data-view="left">左</button>
            <button class="view-preset-btn" data-view="right">右</button>
            <button class="view-preset-btn" data-view="top">顶</button>
            <button class="view-preset-btn active" data-view="persp">透视</button>
        `;
        viewScene.appendChild(viewPresets);
        
        // 绑定视角按钮事件
        viewPresets.querySelectorAll('.view-preset-btn').forEach(btn => {
            btn.onclick = () => this.setViewPreset(btn.dataset.view);
        });
        
        // 右侧工具栏
        const tools = document.createElement('div');
        tools.className = 'viewport-tools';
        tools.innerHTML = `
            <button class="tool-btn active" title="选择" data-tool="select"><i class="fas fa-mouse-pointer"></i></button>
            <button class="tool-btn" title="平移视角" data-tool="move"><i class="fas fa-arrows-alt"></i></button>
            <button class="tool-btn" title="旋转视角" data-tool="rotate"><i class="fas fa-sync-alt"></i></button>
            <button class="tool-btn" title="缩放视角" data-tool="scale"><i class="fas fa-expand-arrows-alt"></i></button>
            <div class="tool-divider"></div>
            <button class="tool-btn" title="重置视角" id="tool-reset-view"><i class="fas fa-home"></i></button>
            <button class="tool-btn" title="聚焦选中" id="tool-focus"><i class="fas fa-crosshairs"></i></button>
            <div class="tool-divider"></div>
            <button class="tool-btn" title="线框模式" id="tool-wireframe"><i class="fas fa-border-all"></i></button>
            <button class="tool-btn" title="网格开关" id="tool-grid"><i class="fas fa-th"></i></button>
        `;
        viewScene.appendChild(tools);
        
        // 绑定工具栏事件
        document.getElementById('tool-reset-view').onclick = () => this.resetToDefaultView();
        document.getElementById('tool-wireframe').onclick = (e) => this.toggleWireframe(e.currentTarget);
        document.getElementById('tool-grid').onclick = (e) => this.toggleGrid(e.currentTarget);
        document.getElementById('tool-focus').onclick = () => this.focusSelection();
        tools.querySelectorAll('[data-tool]').forEach(btn => {
            btn.onclick = () => this.setNavigationTool(btn.dataset.tool);
        });
        
        // 坐标轴指示器容器
        const gizmo = document.createElement('div');
        gizmo.className = 'axis-gizmo';
        gizmo.id = 'axis-gizmo';
        viewScene.appendChild(gizmo);
        
        // 底部状态栏
        const footer = document.createElement('div');
        footer.className = 'viewport-footer';
        footer.innerHTML = `
            <div class="camera-info">
                <span><i class="fas fa-video"></i> Cam: <span id="cam-pos">0, 0, 0</span></span>
                <span><i class="fas fa-bullseye"></i> Target: <span id="cam-target">0, 0, 0</span></span>
            </div>
            <div class="hint">
                <i class="fas fa-mouse"></i> 左键旋转 · 滚轮缩放 · 右键平移
            </div>
        `;
        viewScene.appendChild(footer);
        
        // 初始化坐标轴指示器
        this.initGizmo();
    }
    
    /**
     * 初始化坐标轴指示器
     */
    initGizmo() {
        const container = document.getElementById('axis-gizmo');
        if (!container) return;
        
        // 创建Gizmo渲染器
        this.gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.gizmoRenderer.setSize(80, 80);
        this.gizmoRenderer.setClearColor(0x000000, 0);
        container.appendChild(this.gizmoRenderer.domElement);
        
        // 创建Gizmo场景
        this.gizmoScene = new THREE.Scene();
        this.gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
        this.gizmoCamera.position.set(0, 0, 5);
        
        // 创建坐标轴
        const axisLength = 1.5;
        const axes = new THREE.Group();
        
        // X轴 (红色)
        const xMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        const xAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), xMat);
        xAxis.rotation.z = -Math.PI / 2;
        xAxis.position.x = axisLength / 2;
        axes.add(xAxis);
        
        const xCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), xMat);
        xCone.rotation.z = -Math.PI / 2;
        xCone.position.x = axisLength;
        axes.add(xCone);
        
        // Y轴 (绿色)
        const yMat = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
        const yAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), yMat);
        yAxis.position.y = axisLength / 2;
        axes.add(yAxis);
        
        const yCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), yMat);
        yCone.position.y = axisLength;
        axes.add(yCone);
        
        // Z轴 (蓝色)
        const zMat = new THREE.MeshBasicMaterial({ color: 0x4444ff });
        const zAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8), zMat);
        zAxis.rotation.x = Math.PI / 2;
        zAxis.position.z = axisLength / 2;
        axes.add(zAxis);
        
        const zCone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), zMat);
        zCone.rotation.x = Math.PI / 2;
        zCone.position.z = axisLength;
        axes.add(zCone);
        
        // 原点球
        const centerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), centerMat);
        axes.add(center);
        
        this.gizmoAxes = axes;
        this.gizmoScene.add(axes);
    }
    
    /**
     * 更新坐标轴指示器
     */
    updateGizmo() {
        if (!this.gizmoRenderer || !this.camera || !this.gizmoAxes) return;
        
        // 同步主相机的旋转
        this.gizmoAxes.quaternion.copy(this.camera.quaternion).invert();
        
        this.gizmoRenderer.render(this.gizmoScene, this.gizmoCamera);
    }
    
    /**
     * 更新状态栏信息
     */
    updateViewportInfo(delta = 0) {
        if (!this.camera) return;
        
        // 相机位置
        const camPos = document.getElementById('cam-pos');
        if (camPos) {
            camPos.textContent = `${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)}`;
        }
        
        // 目标位置
        const camTarget = document.getElementById('cam-target');
        if (camTarget && this.controls) {
            const t = this.controls.target;
            camTarget.textContent = `${t.x.toFixed(1)}, ${t.y.toFixed(1)}, ${t.z.toFixed(1)}`;
        }
        
        // FPS
        const fpsEl = document.getElementById('stat-fps');
        if (fpsEl) {
            const fps = delta > 0 ? Math.round(1 / delta) : 60;
            fpsEl.textContent = Math.min(fps, 120);
        }

        let objects = 0;
        let vertices = 0;
        this.scene?.traverse(object => {
            if (!object.isMesh) return;
            objects += 1;
            vertices += object.geometry?.attributes?.position?.count || 0;
        });
        const objectCount = document.getElementById('stat-objects');
        const vertexCount = document.getElementById('stat-vertices');
        if (objectCount) objectCount.textContent = objects;
        if (vertexCount) vertexCount.textContent = vertices;
    }
    
    /**
     * 设置预设视角
     */
    setViewPreset(view) {
        if (!this.camera || !this.controls) return;
        
        const presets = {
            front: { pos: [0, 0, 30], target: [0, 0, 0] },
            back: { pos: [0, 0, -30], target: [0, 0, 0] },
            left: { pos: [-30, 0, 0], target: [0, 0, 0] },
            right: { pos: [30, 0, 0], target: [0, 0, 0] },
            top: { pos: [0, 30, 0], target: [0, 0, 0] },
            persp: { pos: [15, 12, 25], target: [0, 0, 0] }
        };
        
        const preset = presets[view];
        if (!preset) return;
        
        // 更新按钮状态
        document.querySelectorAll('.view-preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // 更新视角信息
        const viewInfo = document.getElementById('view-angle-info');
        const viewNames = { front: '前视图', back: '后视图', left: '左视图', right: '右视图', top: '顶视图', persp: '透视视图' };
        if (viewInfo) viewInfo.textContent = viewNames[view];
        
        // 动画过渡
        gsap.to(this.camera.position, {
            x: preset.pos[0], y: preset.pos[1], z: preset.pos[2],
            duration: 0.6,
            ease: 'power2.out'
        });
        gsap.to(this.controls.target, {
            x: preset.target[0], y: preset.target[1], z: preset.target[2],
            duration: 0.6,
            ease: 'power2.out'
        });
    }
    
    resetToDefaultView() {
        this.setViewPreset('persp');
    }
    
    toggleWireframe(btn) {
        this.wireframeEnabled = !this.wireframeEnabled;
        btn.classList.toggle('active', this.wireframeEnabled);
        if (this.wireframeEnabled) {
            this.applyDisplayOverrides();
        } else {
            this.wireframeMaterials.forEach((value, material) => { material.wireframe = value; });
            this.wireframeMaterials.clear();
        }
    }
    
    toggleGrid(btn) {
        this.gridsHidden = !this.gridsHidden;
        btn.classList.toggle('active', this.gridsHidden);
        if (this.gridsHidden) {
            this.applyDisplayOverrides();
        } else {
            this.hiddenGrids.forEach((value, grid) => { grid.visible = value; });
            this.hiddenGrids.clear();
        }
    }

    applyDisplayOverrides() {
        if (!this.wireframeEnabled && !this.gridsHidden) return;
        const currentMaterials = new Set();
        const currentGrids = new Set();
        this.scene?.traverse(object => {
            if (this.gridsHidden && object.type === 'GridHelper') {
                currentGrids.add(object);
                if (!this.hiddenGrids.has(object)) this.hiddenGrids.set(object, object.visible);
                object.visible = false;
            }
            if (!this.wireframeEnabled || !object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(material => {
                if (!material || !('wireframe' in material)) return;
                currentMaterials.add(material);
                if (!this.wireframeMaterials.has(material)) {
                    this.wireframeMaterials.set(material, material.wireframe);
                }
                material.wireframe = true;
            });
        });
        // Simulations replace particles and meshes frequently; do not retain their old resources.
        this.wireframeMaterials.forEach((value, material) => {
            if (currentMaterials.has(material)) return;
            material.wireframe = value;
            this.wireframeMaterials.delete(material);
        });
        this.hiddenGrids.forEach((value, grid) => {
            if (currentGrids.has(grid)) return;
            grid.visible = value;
            this.hiddenGrids.delete(grid);
        });
    }

    setNavigationTool(tool = 'select') {
        if (!this.controls || !['select', 'move', 'rotate', 'scale'].includes(tool)) return;
        this.currentNavigationTool = tool;
        this.controls.mouseButtons.LEFT = tool === 'move' ? THREE.MOUSE.PAN
            : tool === 'scale' ? THREE.MOUSE.DOLLY : THREE.MOUSE.ROTATE;
        // OrbitControls supports touch zoom as a two-finger gesture only.
        this.controls.touches.ONE = tool === 'move' ? THREE.TOUCH.PAN
            : tool === 'scale' ? null : THREE.TOUCH.ROTATE;
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        const hint = document.querySelector('.viewport-footer .hint');
        if (hint) {
            hint.textContent = tool === 'move' ? '拖动平移 · 滚轮缩放'
                : tool === 'scale' ? '鼠标拖动缩放 · 触屏双指缩放'
                : '拖动旋转 · 滚轮缩放 · 右键平移';
        }
    }

    focusSelection() {
        if (!this.camera || !this.controls || !this.currentSceneInstance) return;
        // If nothing is selected, fit the teaching model as a whole.
        if (this.selectedObject) {
            let parent = this.selectedObject;
            while (parent && parent !== this.scene) parent = parent.parent;
            if (!parent) this.selectedObject = null;
        }
        const target = this.selectedObject || this.currentSceneInstance.mainGroup || this.scene;
        const box = new THREE.Box3().setFromObject(target);
        if (box.isEmpty()) return;
        const center = box.getCenter(new THREE.Vector3());
        const radius = box.getSize(new THREE.Vector3()).length() / 2;
        if (!Number.isFinite(radius)) return;
        const verticalFov = this.camera.fov * Math.PI / 180;
        const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * this.camera.aspect);
        const distance = Math.min(this.controls.maxDistance, Math.max(this.controls.minDistance,
            radius / Math.sin(Math.min(verticalFov, horizontalFov) / 2) * 1.15));
        const direction = this.camera.position.clone().sub(this.controls.target);
        if (direction.lengthSq() === 0) direction.set(0, 0, 1);
        if (typeof gsap !== 'undefined') {
            gsap.killTweensOf(this.camera.position);
            gsap.killTweensOf(this.controls.target);
        }
        this.camera.position.copy(center).add(direction.normalize().multiplyScalar(distance));
        this.controls.target.copy(center);
        this.controls.update();
    }

    /**
     * 初始化 Three.js 基础环境
     */
    init() {
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        const width = Math.max(this.container.clientWidth, 1);
        const height = Math.max(this.container.clientHeight, 1);
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // 创建空场景
        this.scene = new THREE.Scene();
        
        // 创建相机
        const aspect = width / height;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
        this.camera.position.set(0, 10, 30);

        // 控制器 - 确保所有控制功能启用
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.syncCameraTarget();
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enableZoom = true;
        this.controls.enableRotate = true;
        this.controls.enablePan = true;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI * 0.9;

        // 移动端交互调优：降低过敏感操作，双指缩放+平移更稳定
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            this.controls.rotateSpeed = 0.65;
            this.controls.zoomSpeed = 0.85;
            this.controls.panSpeed = 0.75;
            this.controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
        }

        // 默认灯光
        this.setupDefaultLights();

        // 启动循环
        this.animate();
    }

    syncCameraTarget() {
        // Scene modules use camera.lookAt() for their teaching views. OrbitControls
        // otherwise replaces that view with its previous target on the next frame.
        const controls = this.controls;
        const lookAt = this.camera.lookAt;
        this.camera.lookAt = function (x, y, z) {
            lookAt.call(this, x, y, z);
            if (x?.isVector3) controls.target.copy(x);
            else controls.target.set(x, y, z);
        };
    }

    setupDefaultLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    /**
     * 加载特定场景模块
     */
    loadScene(SceneClass) {
        this.clearScene();
        
        if (!this.renderer) {
            this.init();
        } else {
            // 重置场景
            this.scene = new THREE.Scene();
            this.setupDefaultLights();
            this.camera.position.set(0, 10, 30);
            this.camera.lookAt(0, 0, 0);
            
            // 确保controls正确更新
            if (this.controls) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        }

        try {
            this.currentSceneInstance = new SceneClass(this.scene, this.camera, this.renderer);
            
            if (this.currentSceneInstance.init) {
                this.currentSceneInstance.init();
            }

            if (this.currentSceneInstance.getInteractables) {
                this.interactableObjects = this.currentSceneInstance.getInteractables();
            }

            const sceneControls = document.getElementById('scene-controls');
            if (sceneControls) {
                sceneControls.style.display = sceneControls.children.length ? 'flex' : 'none';
            }
            
            // 显示初始教学引导
            this.showInitialGuides();
            
            console.log('Scene loaded successfully:', SceneClass.name || 'Unknown');
        } catch (e) {
            console.error('Failed to load scene:', e);
            this.resetToEmptyScene();
            throw e;
        }
    }

    /**
     * 清理当前场景
     */
    clearScene() {
        if (typeof gsap !== 'undefined') {
            if (this.camera) gsap.killTweensOf(this.camera.position);
            if (this.controls) gsap.killTweensOf(this.controls.target);
        }
        // Restore borrowed material properties before scene-owned cleanup runs.
        this.wireframeMaterials.forEach((value, material) => { material.wireframe = value; });
        this.hiddenGrids.forEach((value, grid) => { grid.visible = value; });
        this.wireframeMaterials.clear();
        this.hiddenGrids.clear();
        this.wireframeEnabled = false;
        this.gridsHidden = false;
        document.getElementById('tool-wireframe')?.classList.remove('active');
        document.getElementById('tool-grid')?.classList.remove('active');
        this.setNavigationTool('select');

        // Capture resources before scene.dispose() detaches its groups. Some older
        // scenes only remove their meshes, which does not release their GPU data.
        const resources = this.collectSceneResources();
        const alreadyDisposed = new Set();
        const recordDisposal = event => alreadyDisposed.add(event.target);
        resources.forEach(resource => resource.addEventListener?.('dispose', recordDisposal));
        try {
            if (this.currentSceneInstance?.dispose) {
                this.currentSceneInstance.dispose();
            }
        } catch (error) {
            console.warn('Scene cleanup failed:', error);
        } finally {
            resources.forEach(resource => {
                resource.removeEventListener?.('dispose', recordDisposal);
                if (alreadyDisposed.has(resource)) return;
                try { resource.dispose(); } catch (error) {
                    console.warn('Scene resource cleanup failed:', error);
                }
            });
            this.scene?.clear?.();
            if (this.scene) {
                this.scene.background = null;
                this.scene.environment = null;
            }
            this.renderer?.renderLists?.dispose();
        }

        // 取消尚未触发的初始引导定时器，并移除已弹出的引导提示
        if (this.guideTimers && this.guideTimers.length) {
            this.guideTimers.forEach(id => clearTimeout(id));
            this.guideTimers = [];
        }
        if (this.container) {
            this.container.querySelectorAll('.scene-guide-message').forEach(el => el.remove());
        }

        this.labels.forEach(l => {
            if (l.container && l.container.parentNode) {
                l.container.parentNode.removeChild(l.container);
            }
        });
        this.labels = [];
        this.interactableObjects = [];
        this.currentSceneInstance = null;
        this.hoveredObject = null;
        this.selectedObject = null;
        this.pointerStart = null;
        this.pointerDragged = false;

        this.hideTooltip();

        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) infoPanel.classList.remove('visible');
        
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'none';
            controlsDiv.innerHTML = '';
        }
    }

    collectSceneResources() {
        const resources = new Set();
        const track = resource => {
            if (typeof resource?.dispose === 'function') resources.add(resource);
        };
        const trackTexture = value => {
            if (Array.isArray(value)) value.forEach(trackTexture);
            else if (value?.isTexture) track(value);
        };
        trackTexture(this.scene?.background);
        trackTexture(this.scene?.environment);
        this.scene?.traverse(object => {
            track(object.geometry);
            track(object.shadow?.map);
            track(object.shadow?.mapPass);
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.filter(Boolean).forEach(material => {
                track(material);
                Object.values(material).forEach(trackTexture);
                Object.values(material.uniforms || {}).forEach(uniform => trackTexture(uniform?.value));
                if (typeof gsap !== 'undefined') {
                    [material, material.color, material.emissive, material.uniforms].filter(Boolean)
                        .forEach(target => gsap.killTweensOf(target));
                }
            });
            if (typeof gsap !== 'undefined') {
                [object, object.position, object.rotation, object.scale, object.quaternion].filter(Boolean)
                    .forEach(target => gsap.killTweensOf(target));
            }
        });
        return resources;
    }

    /**
     * 重置为空场景
     * 返回首页时调用：清理当前场景并换上一个只含默认灯光的空场景，
     * 避免渲染循环继续绘制已释放的旧场景，回到与初始一致的空白画面。
     */
    resetToEmptyScene() {
        this.clearScene();

        this.scene = new THREE.Scene();
        this.setupDefaultLights();
        this.camera.position.set(0, 10, 30);
        this.camera.lookAt(0, 0, 0);

        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    /**
     * 动画循环
     */
    animate() {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        // 注意: getDelta() 必须在 getElapsedTime() 之前调用，否则会重置
        const delta = this.clock.getDelta();
        const time = this.clock.elapsedTime; // 使用属性而非方法避免重置

        if (this.controls) this.controls.update();

        if (this.currentSceneInstance && this.currentSceneInstance.animate) {
            this.currentSceneInstance.animate(time, delta);
        }
        this.applyDisplayOverrides();

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }

        this.updateLabels();
        
        // 更新Blender UI
        this.updateGizmo();
        
        // 每半秒更新一次状态栏（不再次读取时钟，避免扰动动画 delta）
        if (time - this.lastViewportUpdate >= 0.5) {
            this.lastViewportUpdate = time;
            this.updateViewportInfo(delta);
        }
    }

    /**
     * 创建3D标签
     */
    createLabel(text, position, icon = 'info-circle') {
        const container = document.createElement('div'); 
        container.className = 'scene-label-container';
        
        const div = document.createElement('div'); 
        div.className = 'scene-label'; 
        div.innerHTML = `<i class="fas fa-${icon}"></i>${text}`; 
        container.appendChild(div);
        
        const line = document.createElement('div'); 
        line.className = 'label-line'; 
        container.appendChild(line);
        
        this.container.appendChild(container);
        
        this.labels.push({ 
            container, 
            line, 
            position: position.clone(), 
            element: div 
        });

        return div;
    }

    updateLabels() {
        if (!this.camera || this.labels.length === 0) return;
        
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w <= 0 || h <= 0) return;
        const tempV = new THREE.Vector3();

        this.labels.forEach(l => {
            tempV.copy(l.position).project(this.camera);
            
            if (tempV.z > 1 || Math.abs(tempV.x) > 1.1 || Math.abs(tempV.y) > 1.1) {
                l.container.style.opacity = 0;
                return;
            }

            l.container.style.opacity = 1;
            l.container.style.left = (tempV.x * 0.5 + 0.5) * w + 'px';
            l.container.style.top = (-(tempV.y * 0.5) + 0.5) * h + 'px';
            
            const labelHeight = l.element.offsetHeight;
            l.line.style.height = (labelHeight + 20) + 'px';
            l.line.style.top = '0px';
        });
    }

    onResize() {
        if (!this.renderer || !this.camera) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w <= 0 || h <= 0) return;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
    
    /**
     * 公开的调整大小方法
     */
    handleResize() {
        this.onResize();
    }

    onPointerDown(event) {
        this.pointerStart = { x: event.clientX, y: event.clientY };
        this.pointerDragged = false;
    }

    onPointerMove(event) {
        if (!this.pointerStart) return;
        if (Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y) > 5) {
            this.pointerDragged = true;
        }
    }

    onClick(event) {
        if (this.currentNavigationTool !== 'select' || this.pointerDragged) return;
        this.refreshInteractables();
        if (!this.currentSceneInstance || this.interactableObjects.length === 0) return;
        if (event.target && event.target !== this.renderer?.domElement) return;

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);
        const hit = this.findVisibleIntersection(intersects);

        if (hit) {
            let target = hit.object;
            this.selectedObject = target;
            while(target) {
                if (target.userData && target.userData.onClick) {
                    this.selectedObject = target;
                    target.userData.onClick(target);
                    break;
                }
                target = target.parent;
            }
        } else {
            this.selectedObject = null;
            if (this.currentSceneInstance.onBackgroundClick) {
                this.currentSceneInstance.onBackgroundClick();
            }
        }
    }
    
    /**
     * 悬停事件 - 显示提示框
     */
    onHover(event) {
        if (this.currentNavigationTool !== 'select' ||
            (event.target && event.target !== this.renderer?.domElement)) {
            this.onMouseLeave();
            return;
        }
        this.refreshInteractables();
        if (!this.currentSceneInstance || this.interactableObjects.length === 0) {
            this.onMouseLeave();
            return;
        }
         
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);
        const hit = this.findVisibleIntersection(intersects);
        
        if (hit) {
            let target = hit.object;
            // 向上查找有 hoverTitle 或 onClick 的对象
            while(target) {
                if (target.userData && (target.userData.hoverTitle || target.userData.onClick)) {
                    // 检查是否是新对象
                    if (this.hoveredObject !== target) {
                        this.hoveredObject = target;
                    }
                    
                    // 显示提示框
                    if (target.userData.hoverTitle) {
                        this.showTooltip(event, target.userData);
                    }
                    
                    this.container.style.cursor = 'pointer';
                    return;
                }
                target = target.parent;
            }
        }
        
        // 没有悬停对象
        this.hoveredObject = null;
        this.hideTooltip();
        this.container.style.cursor = 'default';
    }

    refreshInteractables() {
        if (this.currentSceneInstance?.getInteractables) {
            this.interactableObjects = this.currentSceneInstance.getInteractables() || [];
        }
    }

    findVisibleIntersection(intersections) {
        return intersections.find(hit => {
            const materials = hit.object.material;
            const material = Array.isArray(materials) ? materials[hit.face?.materialIndex || 0] : materials;
            if (material?.visible === false) return false;
            let object = hit.object;
            while (object) {
                if (object.visible === false) return false;
                if (object === this.scene) return true;
                object = object.parent;
            }
            return false; // Detached models can remain in old scene-owned pick lists.
        });
    }

    /**
     * 鼠标离开容器
     */
    onMouseLeave() {
        this.hideTooltip();
        this.hoveredObject = null;
        this.container.style.cursor = 'default';
    }

    /**
     * 显示悬停提示框
     */
    showTooltip(event, data) {
        const tooltip = document.getElementById('hover-tooltip');
        if (!tooltip) return;
        
        const titleEl = tooltip.querySelector('.tooltip-title');
        const descEl = tooltip.querySelector('.tooltip-desc');
        
        titleEl.innerHTML = `
            <i class="fas ${data.hoverIcon || 'fa-info-circle'}"></i>
            <span>${data.hoverTitle}</span>
        `;
        descEl.textContent = data.hoverDesc || '';
        
        // 计算位置（避免超出屏幕）
        let x = event.clientX + 15;
        let y = event.clientY + 15;
        
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (x + tooltipRect.width > viewportWidth - 20) {
            x = event.clientX - tooltipRect.width - 15;
        }
        if (y + tooltipRect.height > viewportHeight - 20) {
            y = event.clientY - tooltipRect.height - 15;
        }
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.classList.add('visible');
    }

    /**
     * 隐藏悬停提示框
     */
    hideTooltip() {
        const tooltip = document.getElementById('hover-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }

    /**
     * 显示教学引导提示
     */
    showGuide(message, duration = 3500) {
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        this.container.appendChild(guide);
        
        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, duration);
    }

    /**
     * 显示初始教学引导
     */
    showInitialGuides() {
        this.guideTimers.push(setTimeout(() => {
            this.showGuide('🖱️ 拖动旋转 · 滚轮缩放 · 右键平移');
        }, 1200));
        this.guideTimers.push(setTimeout(() => {
            this.showGuide('👆 点击蓝色部件查看详细说明');
        }, 5000));
    }
}
