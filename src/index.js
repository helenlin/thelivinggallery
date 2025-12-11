import "./style.css";
import * as THREE from "three";
import { gsap } from "gsap";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";

// Background Three.js scene
const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// Lighting
const light = new THREE.PointLight(0xffffff, 10);
light.position.set(0, 5, 0);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 5));

// Add 3D Grid
/*
const gridHelper = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
gridHelper.position.y = -3;
scene.add(gridHelper);
*/

const gridHelperLeft = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
gridHelperLeft.position.y = -3;
gridHelperLeft.rotation.x = Math.PI / 2;
scene.add(gridHelperLeft);

// Load chromedino model
const loader = new GLTFLoader();
let dinoModel;

// Mouse tracking
const mouse = new THREE.Vector2();
let mouseTimeout;
const body = document.body;

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Calculate color based on mouse position
  const normalizedX = (event.clientX / window.innerWidth) * 255;
  const normalizedY = (event.clientY / window.innerHeight) * 255;
  const hue = ((normalizedX + normalizedY) / 2) % 360;
  const saturation = 50 + (normalizedX / 255) * 30;
  const lightness = 50 + (normalizedY / 255) * 30;
  
  // Apply the color to background
  body.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Apply blur to canvas when mouse is moving
  canvas.style.filter = "blur(3px)";
  
  // Clear existing timeout
  clearTimeout(mouseTimeout);
  
  // Remove blur after mouse stops moving (500ms)
  mouseTimeout = setTimeout(() => {
    canvas.style.filter = "blur(0px)";
  }, 500);
});

loader.load(
  "./tlg-dino-chrome.glb",
  (gltf) => {
    dinoModel = gltf.scene;
    
    // Apply normal material to all meshes
    const normalMaterial = new THREE.MeshNormalMaterial();
    
    dinoModel.traverse((child) => {
      if (child.isMesh) {
        child.material = normalMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    scene.add(dinoModel);
    
    // Center the model
    const box = new THREE.Box3().setFromObject(dinoModel);
    const center = box.getCenter(new THREE.Vector3());
    dinoModel.position.set(center.x, center.y+1, center.z);
    dinoModel.scale.set(5, 5, 5);
  },
  (progress) => {
    console.log((progress.loaded / progress.total) * 100 + "% loaded");
  },
  (error) => {
    console.error("Error loading model:", error);
  }
);


// Create floating geometry
const geometries = [
  //new THREE.IcosahedronGeometry(0.5, 4),
  //new THREE.OctahedronGeometry(0.5),
  //new THREE.TetrahedronGeometry(0.5),
  
];

const materials = [
  new THREE.MeshStandardMaterial({ color: 0xff0080, metalness: 0.7, roughness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: 0x00ff88, metalness: 0.7, roughness: 0.2 }),
  new THREE.MeshStandardMaterial({ color: 0x0088ff, metalness: 0.7, roughness: 0.2 }),
];

const meshes = [];
for (let i = 0; i < 5; i++) {
  const geometry = geometries[i % geometries.length];
  const material = materials[i % materials.length];
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 10
  );
  scene.add(mesh);
  meshes.push(mesh);

  // Animate each mesh
  gsap.to(mesh.rotation, {
    x: Math.PI * 2,
    y: Math.PI * 2,
    duration: 5 + i,
    repeat: -1,
    ease: "none",
  });

  gsap.to(mesh.position, {
    y: mesh.position.y + 2,
    duration: 3 + i,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

// Handle window resize
const onWindowResize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

window.addEventListener("resize", onWindowResize);

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);
  
  // Make model face the mouse cursor
  if (dinoModel) {
    // Create a target position based on mouse position
    const targetX = mouse.x * 1;
    const targetY = mouse.y * 1;
    const targetPosition = new THREE.Vector3(targetX, targetY, 0);
    
    // Make model look at the target position
    const direction = targetPosition.sub(dinoModel.position).normalize();
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
    const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(direction))));
    
    quaternion.setFromAxisAngle(axis, angle);
    dinoModel.quaternion.slerp(quaternion, 0.01);
  }
  
  renderer.render(scene, camera);
};

animate();