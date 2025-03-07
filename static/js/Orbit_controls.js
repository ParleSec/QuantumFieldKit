// OrbitControls.js - Three.js camera controls
// This is a simplified version of the original THREE.OrbitControls

// Original source: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/OrbitControls.js
// License: MIT

// Usage:
// const controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.update(); // in animation loop

THREE.OrbitControls = function (object, domElement) {
    this.object = object;
    this.domElement = (domElement !== undefined) ? domElement : document;

    // API
    this.enabled = true;
    this.target = new THREE.Vector3();

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    this.minAzimuthAngle = -Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    this.enableDamping = false;
    this.dampingFactor = 0.05;

    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true;
    this.keyPanSpeed = 7.0;

    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

    this.enableKeys = true;
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

    // internals
    this.changeEvent = { type: 'change' };
    this.startEvent = { type: 'start' };
    this.endEvent = { type: 'end' };

    this.STATE = {
        NONE: -1,
        ROTATE: 0,
        DOLLY: 1,
        PAN: 2,
        TOUCH_ROTATE: 3,
        TOUCH_DOLLY: 4,
        TOUCH_PAN: 5
    };

    let state = this.STATE.NONE;

    const EPS = 0.000001;

    // current position in spherical coordinates
    const spherical = new THREE.Spherical();
    const sphericalDelta = new THREE.Spherical();

    let scale = 1;
    const panOffset = new THREE.Vector3();
    let zoomChanged = false;

    const rotateStart = new THREE.Vector2();
    const rotateEnd = new THREE.Vector2();
    const rotateDelta = new THREE.Vector2();

    const panStart = new THREE.Vector2();
    const panEnd = new THREE.Vector2();
    const panDelta = new THREE.Vector2();

    const dollyStart = new THREE.Vector2();
    const dollyEnd = new THREE.Vector2();
    const dollyDelta = new THREE.Vector2();

    const scope = this;

    // Private methods
    const updateSpherical = () => {
        const offset = new THREE.Vector3();
        offset.copy(scope.object.position).sub(scope.target);
        spherical.setFromVector3(offset);
        spherical.theta += sphericalDelta.theta;
        spherical.phi += sphericalDelta.phi;

        // restrict theta to be between desired limits
        spherical.theta = Math.max(scope.minAzimuthAngle, Math.min(scope.maxAzimuthAngle, spherical.theta));

        // restrict phi to be between desired limits
        spherical.phi = Math.max(scope.minPolarAngle, Math.min(scope.maxPolarAngle, spherical.phi));

        spherical.makeSafe();
        spherical.radius *= scale;

        // restrict radius to be between desired limits
        spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));

        // move target to panned location
        scope.target.add(panOffset);

        offset.setFromSpherical(spherical);

        // rotate offset back to "camera-up-vector-is-up" space
        scope.object.position.copy(scope.target).add(offset);
        scope.object.lookAt(scope.target);

        if (scope.enableDamping) {
            sphericalDelta.theta *= (1 - scope.dampingFactor);
            sphericalDelta.phi *= (1 - scope.dampingFactor);
            panOffset.multiplyScalar(1 - scope.dampingFactor);
        } else {
            sphericalDelta.set(0, 0, 0);
            panOffset.set(0, 0, 0);
        }

        scale = 1;

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8
        const position = scope.object.position;
        const offset2 = new THREE.Vector3().copy(position).sub(scope.target);
        const update = offset2.lengthSq() > EPS || 8 * (1 - lastPosition.dot(position.clone().normalize())) > EPS;

        if (update || zoomChanged) {
            lastPosition.copy(position);
            scope.dispatchEvent(scope.changeEvent);
            zoomChanged = false;
            return true;
        }
        return false;
    };

    function handleMouseDownRotate(event) {
        rotateStart.set(event.clientX, event.clientY);
    }

    function handleMouseDownDolly(event) {
        dollyStart.set(event.clientX, event.clientY);
    }

    function handleMouseDownPan(event) {
        panStart.set(event.clientX, event.clientY);
    }

    function handleMouseMoveRotate(event) {
        rotateEnd.set(event.clientX, event.clientY);
        rotateDelta.subVectors(rotateEnd, rotateStart).multiplyScalar(scope.rotateSpeed);

        const element = scope.domElement === document ? scope.domElement.body : scope.domElement;

        // rotating across whole screen goes 360 degrees around
        sphericalDelta.theta -= 2 * Math.PI * rotateDelta.x / element.clientWidth;

        // rotating up and down along whole screen attempts to go 360, but limited to 180
        sphericalDelta.phi -= 2 * Math.PI * rotateDelta.y / element.clientHeight;

        rotateStart.copy(rotateEnd);
        scope.update();
    }

    function handleMouseMoveDolly(event) {
        dollyEnd.set(event.clientX, event.clientY);
        dollyDelta.subVectors(dollyEnd, dollyStart);

        if (dollyDelta.y > 0) {
            dollyIn(getZoomScale());
        } else if (dollyDelta.y < 0) {
            dollyOut(getZoomScale());
        }

        dollyStart.copy(dollyEnd);
        scope.update();
    }

    function handleMouseMovePan(event) {
        panEnd.set(event.clientX, event.clientY);
        panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed);
        pan(panDelta.x, panDelta.y);
        panStart.copy(panEnd);
        scope.update();
    }

    function handleMouseWheel(event) {
        if (event.deltaY < 0) {
            dollyOut(getZoomScale());
        } else if (event.deltaY > 0) {
            dollyIn(getZoomScale());
        }
        scope.update();
    }

    // Handle keyboard arrow keys for panning
    function handleKeyDown(event) {
        let needsUpdate = false;

        switch (event.keyCode) {
            case scope.keys.UP:
                pan(0, scope.keyPanSpeed);
                needsUpdate = true;
                break;
            case scope.keys.BOTTOM:
                pan(0, -scope.keyPanSpeed);
                needsUpdate = true;
                break;
            case scope.keys.LEFT:
                pan(scope.keyPanSpeed, 0);
                needsUpdate = true;
                break;
            case scope.keys.RIGHT:
                pan(-scope.keyPanSpeed, 0);
                needsUpdate = true;
                break;
        }

        if (needsUpdate) {
            event.preventDefault();
            scope.update();
        }
    }

    function pan(deltaX, deltaY) {
        const element = scope.domElement === document ? scope.domElement.body : scope.domElement;

        if (scope.object.isPerspectiveCamera) {
            // perspective
            const position = scope.object.position;
            const offset = position.clone().sub(scope.target);
            let targetDistance = offset.length();

            // half of the fov is center to top of screen
            targetDistance *= Math.tan((scope.object.fov / 2) * Math.PI / 180.0);

            // we use only clientHeight here so aspect ratio does not distort speed
            panLeft(2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix);
            panUp(2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix);
        } else if (scope.object.isOrthographicCamera) {
            // orthographic
            panLeft(deltaX * (scope.object.right - scope.object.left) / scope.object.zoom / element.clientWidth, scope.object.matrix);
            panUp(deltaY * (scope.object.top - scope.object.bottom) / scope.object.zoom / element.clientHeight, scope.object.matrix);
        } else {
            // camera neither orthographic nor perspective
            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
            scope.enablePan = false;
        }
    }

    function dollyIn(dollyScale) {
        if (scope.object.isPerspectiveCamera) {
            scale /= dollyScale;
        } else if (scope.object.isOrthographicCamera) {
            scope.object.zoom = Math.max(scope.minZoom || 0, Math.min(scope.maxZoom || Infinity, scope.object.zoom * dollyScale));
            scope.object.updateProjectionMatrix();
            zoomChanged = true;
        } else {
            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
            scope.enableZoom = false;
        }
    }

    function dollyOut(dollyScale) {
        if (scope.object.isPerspectiveCamera) {
            scale *= dollyScale;
        } else if (scope.object.isOrthographicCamera) {
            scope.object.zoom = Math.max(scope.minZoom || 0, Math.min(scope.maxZoom || Infinity, scope.object.zoom / dollyScale));
            scope.object.updateProjectionMatrix();
            zoomChanged = true;
        } else {
            console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
            scope.enableZoom = false;
        }
    }

    function getZoomScale() {
        return Math.pow(0.95, scope.zoomSpeed);
    }

    function panLeft(distance, objectMatrix) {
        const v = new THREE.Vector3();
        v.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
        v.multiplyScalar(-distance);
        panOffset.add(v);
    }

    function panUp(distance, objectMatrix) {
        const v = new THREE.Vector3();
        
        if (scope.screenSpacePanning === true) {
            v.setFromMatrixColumn(objectMatrix, 1);
        } else {
            v.setFromMatrixColumn(objectMatrix, 0);
            v.crossVectors(scope.object.up, v);
        }

        v.multiplyScalar(distance);
        panOffset.add(v);
    }

    // Public methods
    this.update = function() {
        return updateSpherical();
    };

    this.dispose = function() {
        scope.domElement.removeEventListener('contextmenu', onContextMenu, false);
        scope.domElement.removeEventListener('mousedown', onMouseDown, false);
        scope.domElement.removeEventListener('wheel', onMouseWheel, false);
        scope.domElement.removeEventListener('mousemove', onMouseMove, false);
        scope.domElement.removeEventListener('mouseup', onMouseUp, false);
        window.removeEventListener('keydown', onKeyDown, false);
    };

    // Event listeners
    const onMouseDown = function(event) {
        if (scope.enabled === false) return;
        event.preventDefault();

        switch (event.button) {
            case 0: // left
                if (event.ctrlKey || event.metaKey || event.shiftKey) {
                    if (scope.enablePan === false) return;
                    handleMouseDownPan(event);
                    state = scope.STATE.PAN;
                } else {
                    if (scope.enableRotate === false) return;
                    handleMouseDownRotate(event);
                    state = scope.STATE.ROTATE;
                }
                break;
            case 1: // middle
                if (scope.enableZoom === false) return;
                handleMouseDownDolly(event);
                state = scope.STATE.DOLLY;
                break;
            case 2: // right
                if (scope.enablePan === false) return;
                handleMouseDownPan(event);
                state = scope.STATE.PAN;
                break;
        }

        if (state !== scope.STATE.NONE) {
            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('mouseup', onMouseUp, false);
            scope.dispatchEvent(scope.startEvent);
        }
    };

    const onMouseMove = function(event) {
        if (scope.enabled === false) return;
        event.preventDefault();

        switch (state) {
            case scope.STATE.ROTATE:
                if (scope.enableRotate === false) return;
                handleMouseMoveRotate(event);
                break;
            case scope.STATE.DOLLY:
                if (scope.enableZoom === false) return;
                handleMouseMoveDolly(event);
                break;
            case scope.STATE.PAN:
                if (scope.enablePan === false) return;
                handleMouseMovePan(event);
                break;
        }
    };

    const onMouseUp = function(event) {
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        scope.dispatchEvent(scope.endEvent);
        state = scope.STATE.NONE;
    };

    const onMouseWheel = function(event) {
        if (scope.enabled === false || scope.enableZoom === false || (state !== scope.STATE.NONE && state !== scope.STATE.ROTATE)) return;
        event.preventDefault();
        event.stopPropagation();
        scope.dispatchEvent(scope.startEvent);
        handleMouseWheel(event);
        scope.dispatchEvent(scope.endEvent);
    };

    const onKeyDown = function(event) {
        if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) return;
        handleKeyDown(event);
    };

    const onContextMenu = function(event) {
        if (scope.enabled === false) return;
        event.preventDefault();
    };

    scope.domElement.addEventListener('contextmenu', onContextMenu, false);
    scope.domElement.addEventListener('mousedown', onMouseDown, false);
    scope.domElement.addEventListener('wheel', onMouseWheel, false);
    window.addEventListener('keydown', onKeyDown, false);

    // Initial setup
    const lastPosition = new THREE.Vector3();
    this.update();
};

THREE.OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);
THREE.OrbitControls.prototype.constructor = THREE.OrbitControls;