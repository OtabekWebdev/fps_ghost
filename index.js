import * as THREE from "three";
import { PointerLockControls } from "PointerLockControls";
import { GLTFLoader } from 'GLTFLoader'

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 1;
const renderer = new THREE.WebGLRenderer({ canvas: c });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new PointerLockControls(camera, renderer.domElement);
scene.add(controls.getObject());

// ========== Plan
const planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
scene.add(plane);
// ========== Plan

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// GLTFLoader
const loader = new GLTFLoader();
let gun;
let arrow;

let mixer;

loader.load(
  './3d model/mk.glb',
  function (gltf) {
    gun = gltf.scene;
    gun.position.set(0.2, -0.3, -0.6);
    gun.rotation.y = Math.PI / 2 * 2;
    camera.add(gun);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Arrow configuration
const arrowLength = 0.4;
const arrowWidth = 0.02;
let arrowColorIndex = 0;

const arrowGeometry = new THREE.BoxGeometry(arrowWidth, arrowWidth, arrowLength);
const arrowColors = ['red', 'green', 'yellow', 'blue', 'purple', 'orange'];

let arrows = [];
let arrowMaterial = new THREE.MeshBasicMaterial({ color: arrowColors[arrowColorIndex] });


loader.load(
  './3d model/bullet.glb',
  function (gltf) {
    arrow = gltf.scene;
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

// Keyboard events
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let spacePressed = false;

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

let firstPosition;
let gunBobbingOffset = 0;

function onKeyDown(event) {
  switch (event.keyCode) {
    case 87: // w key
      moveForward = true;
      break;
    case 83: // s key
      moveBackward = true;
      break;
    case 65: // a key
      moveLeft = true;
      break;
    case 68: // d key
      moveRight = true;
      break;
    case 32: // space key
      if (!spacePressed) {
        spacePressed = true;
        firstPosition = controls.getObject().position.y;
      }
      break;
  }
}

function onKeyUp(event) {
  switch (event.keyCode) {
    case 87: // w key
      moveForward = false;
      break;
    case 83: // s key
      moveBackward = false;
      break;
    case 65: // a key
      moveLeft = false;
      break;
    case 68: // d key
      moveRight = false;
      break;
    case 32: // space key
      spacePressed = false;
      break;
  }
}

// Mouse events
let mouseDown = false;
let lastShotTime = Date.now();
let aim = false
renderer.domElement.addEventListener("mousedown", onMouseDown);
renderer.domElement.addEventListener("mouseup", onMouseUp);


function onMouseDown(event) {
  if (event.button === 0 && Date.now() - lastShotTime >= 500) {
    mouseDown = true;
    lastShotTime = Date.now();
  } else if (event.button === 2) {
    aim = true
    gun.position.set(-0, -0.255, -0.2);
  }
}

function onMouseUp(event) {
  if (event.button === 0) {
    mouseDown = false;
  } else if (event.button == 2) {
    aim = false
    gun.position.set(0.2, -0.3, -0.6);
  }
}

// Cube configuration
let ghost;
loader.load(
  './3d model/ghost.glb',
  function (gltf) {
    ghost = gltf.scene;
    scene.add(ghost);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);
const cubeGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
const cubeMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
const GhostDebug = new THREE.Mesh(cubeGeometry, cubeMaterial);
GhostDebug.position.set(0, 0, -5); // Set initial position
scene.add(GhostDebug);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  // ghots
  if (ghost) {
    ghost.position.set(GhostDebug.position.x, GhostDebug.position.y - 2.25, GhostDebug.position.z)
    ghost.rotation.y = GhostDebug.rotation.y
  }
  // ghots
  const movementSpeed = 0.05;
  const bobbingSpeed = 0.1;
  const bobbingHeight = 0.02;

  if (moveForward) {
    controls.moveForward(movementSpeed);
  }
  if (moveBackward) {
    controls.moveForward(-movementSpeed);
  }
  if (moveLeft) {
    controls.moveRight(-movementSpeed);
  }
  if (moveRight) {
    controls.moveRight(movementSpeed);
  }

  if (spacePressed && controls.getObject().position.y < firstPosition + 2) {
    controls.getObject().position.y += 0.1;
  } else if (!spacePressed && controls.getObject().position.y > firstPosition) {
    controls.getObject().position.y -= 0.1;
  }

  // Gun bobbing effect
  if (gun && !aim) {
    if (moveForward || moveBackward || moveLeft || moveRight) {
      gunBobbingOffset += bobbingSpeed;
      const gunBobbingValue = Math.sin(gunBobbingOffset) * bobbingHeight;
      gun.position.y = -0.3 + gunBobbingValue;
    } else {
      gunBobbingOffset = 0;
      gun.position.y = -0.3;
    }
  }

  if (mouseDown && arrow) {
    const currentTime = Date.now();
    if (currentTime - lastShotTime >= 50) {
      const m416sound = new Audio('./sound/m416.mp3')
      m416sound.play()
      const weapon = arrow.clone();
      const s = 0.015;
      weapon.scale.set(s, s, s);

      // Set the arrow position to the tip of the gun
      const gunTip = new THREE.Vector3(0, 0.155, 0.6); // Specify the desired position offset
      gun.localToWorld(gunTip);
      weapon.position.copy(gunTip);

      weapon.quaternion.copy(gun.getWorldQuaternion(new THREE.Quaternion()));
      weapon.rotateY(Math.PI); // 180 gradusga aylantirish uchun Y o'zgarganining o'rtasida PI qiymatini qo'shing
      scene.add(weapon);
      arrows.push(weapon);

      lastShotTime = currentTime;
    }
  }

  // Move arrows
  const arrowSpeed = 0.5; // Change the speed of the arrows here

  for (let i = 0; i < arrows.length; i++) {
    const arrow = arrows[i];
    arrow.translateZ(-arrowSpeed);
    if (arrow.position.z < -10) {
      scene.remove(arrow);
      arrows.splice(i, 1);
      i--;
    } else if (arrow.position.distanceTo(GhostDebug.position) < 1) {
      // Arrow hits the cube
      scene.remove(arrow);
      arrows.splice(i, 1);
      i--;
      const randomX = Math.random() * 10 - 5; // Random position between -5 and 5 on the x-axis
      const randomY = 1; // Keep the cube's height
      const randomZ = -Math.random() * 10; // Random position between -10 and 0 on the z-axis
      GhostDebug.position.set(randomX, randomY, randomZ);
      score.innerText = 1 + Number(score.innerText)
      // Move the cube towards the camera
    }
  }
  if (arrow) {
    console.log(arrow.position.distanceTo(GhostDebug.position));
  }
  const distanceThreshold = 0.3; // Adjust the distance threshold as needed
  const distanceToCamera = GhostDebug.position.distanceTo(camera.position);
  if (distanceToCamera < distanceThreshold) {
    console.log("Game Over");
  }

  const direction = new THREE.Vector3();
  camera.getWorldPosition(direction);
  direction.sub(GhostDebug.position).normalize();

  // Move the ghost object towards the camera
  const moveDistance = 0.05; // Adjust the distance the cube moves towards the camera
  GhostDebug.position.add(direction.multiplyScalar(moveDistance));

  // Rotate the ghost object to face the camera
  GhostDebug.lookAt(camera.position);

  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Lock controls to get input
renderer.domElement.addEventListener("click", function () {
  controls.lock();
});
