import "./style.css";
import * as THREE from "three";
import { gsap } from "gsap";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

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
const light = new THREE.PointLight(0xffffff, 1000);
light.position.set(0, 5, 0);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 5));

// Add 3D Grid

const gridHelper = new THREE.GridHelper(20, 20, 0x00FFFF, 0x0000FF);
gridHelper.position.y = -3;
scene.add(gridHelper);


const gridHelperLeft = new THREE.GridHelper(20, 20, 0x000000, 0x000000);
gridHelperLeft.position.y = 7;
gridHelperLeft.position.z = -10;
gridHelperLeft.rotation.x = Math.PI / 2;
scene.add(gridHelperLeft);

// Load font and create text
let textMesh;
const fontLoader = new FontLoader();
fontLoader.load(
  'https://threejs.org/examples/fonts/gentilis_regular.typeface.json',
  (font) => {
    const textGeo = new TextGeometry('the_living_gallery', {
      font: font,
      size: 0.5,
      depth: 0.1,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    
    textGeo.center();
    
    const textMaterial = new THREE.MeshStandardMaterial({
      color: 0x049ef4,
      metalness: 1,
      roughness: 0.2,
    });
    
    textMesh = new THREE.Mesh(textGeo, textMaterial);
    textMesh.position.z = -2;
    textMesh.position.y = 4.2;
    scene.add(textMesh);
  }
);


// Load chromedino model
const loader = new GLTFLoader();
let dinoModel;

// Mouse tracking
const mouse = new THREE.Vector2();
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
    dinoModel.rotation.y = Math.PI; // Face forward
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
  
  // Make model position and rotation follow the mouse cursor
  if (dinoModel) {
    // Update position based on mouse
    const targetX = mouse.x * 2;
    const targetY = mouse.y * 2;
    dinoModel.position.x += (targetX - dinoModel.position.x) * 0.009;
    dinoModel.position.y += (targetY - dinoModel.position.y) * 0.009;
    
    // Make model face the mouse cursor
    const targetPosition = new THREE.Vector3(targetX, targetY, 0);
    const direction = new THREE.Vector3().subVectors(targetPosition, dinoModel.position).normalize();
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(-1, 0, 0);
    const axis = new THREE.Vector3().crossVectors(up, direction).normalize();
    const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(direction))));
    
    quaternion.setFromAxisAngle(axis, angle);
    dinoModel.quaternion.slerp(quaternion, 0.01);
  }
  
  renderer.render(scene, camera);
};

animate();

// Mobile hamburger menu toggle
const hamburger = document.querySelector("#hamburger");
const menu = document.querySelector("#menu");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    menu.classList.toggle("active");
  });

  // Close menu when a link is clicked
  const menuLinks = menu.querySelectorAll("a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      menu.classList.remove("active");
    });
  });
}

// Carousel functionality
const carouselImages = document.querySelectorAll(".carousel-image");
const carouselContainer = document.querySelector(".carousel-container");
const carouselPrevBtn = document.querySelector("#carouselPrev");
const carouselNextBtn = document.querySelector("#carouselNext");
const modal = document.querySelector("#carouselModal");
const modalImage = document.querySelector("#carouselModalImage");
const modalClose = document.querySelector(".carousel-modal-close");
const modalCaption = document.querySelector("#carouselModalCaption");

let carouselIndex = 0;
let imagesPerView = computeImagesPerView();
const totalImages = carouselImages.length;

function computeImagesPerView() {
  if (typeof window === 'undefined') return 3;
  return window.innerWidth <= 600 ? 1 : 3;
}

function updateCarouselView() {
  // Hide all images
  carouselImages.forEach((img) => {
    img.style.display = "none";
  });

  // Ensure carouselIndex is within bounds
  if (totalImages === 0) return;
  carouselIndex = ((carouselIndex % totalImages) + totalImages) % totalImages;

  // Show the current set of images based on imagesPerView
  for (let i = 0; i < Math.min(imagesPerView, totalImages); i++) {
    const imageIndex = (carouselIndex + i) % totalImages;
    carouselImages[imageIndex].style.display = "block";
  }
}

function nextCarouselSlide() {
  carouselIndex = (carouselIndex + 1) % totalImages;
  updateCarouselView();
}

function prevCarouselSlide() {
  carouselIndex = (carouselIndex - 1 + totalImages) % totalImages;
  updateCarouselView();
}

function openModal(imageSrc, altText) {
  modalImage.src = imageSrc;
  modalImage.alt = altText || "Closeup";
  if (modalCaption) modalCaption.textContent = altText || "Closeup";
  modal.classList.add("show");
}

function closeModal() {
  modal.classList.remove("show");
}

// Add click handlers to carousel images
carouselImages.forEach((img) => {
  img.addEventListener("click", () => {
    openModal(img.src, img.alt);
  });
});

// Add event listeners to carousel buttons
carouselPrevBtn.addEventListener("click", prevCarouselSlide);
carouselNextBtn.addEventListener("click", nextCarouselSlide);

// Modal close handlers
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Initialize carousel view
updateCarouselView();

// Recompute imagesPerView on resize and refresh view when it changes
window.addEventListener("resize", () => {
  const newImagesPerView = computeImagesPerView();
  if (newImagesPerView !== imagesPerView) {
    imagesPerView = newImagesPerView;
    updateCarouselView();
  }
});