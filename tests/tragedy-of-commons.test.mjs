import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

test('farmers can be built with the geometry API available in Three r128', async () => {
    class Object3D {
        constructor() {
            this.children = [];
            this.position = { set: (x, y, z) => Object.assign(this.position, { x, y, z }) };
        }
        add(object) { this.children.push(object); }
        lookAt() {}
    }
    class Mesh extends Object3D {
        constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; }
    }
    class Geometry { constructor(...args) { this.args = args; } }
    const THREE = {
        Group: Object3D,
        Mesh,
        CylinderGeometry: Geometry,
        SphereGeometry: Geometry,
        MeshStandardMaterial: class { constructor(options) { Object.assign(this, options); } }
    };
    const context = { window: {}, THREE };
    vm.runInNewContext(await readFile(new URL('../scenes/tragedy-of-commons-scene.js', import.meta.url), 'utf8'), context);
    const scene = new context.window.TragedyOfCommonsScene();
    scene.mainGroup = new THREE.Group();
    scene.sheepCounts = [3, 4, 5];
    scene.params.farmers = 3;
    for (let i = 0; i < 3; i++) scene.createFarmer(i);
    assert.equal(scene.farmerMeshes.length, 3);
    assert.equal(scene.mainGroup.children.length, 3);
    assert.equal(scene.interactables.length, 3);
    for (const [index, farmer] of scene.farmerMeshes.entries()) {
        assert.equal(farmer.userData.index, index);
        assert.ok(farmer.children.length >= 3);
        assert.ok(Number.isFinite(farmer.position.x));
        assert.ok(Number.isFinite(farmer.position.z));
    }
});
