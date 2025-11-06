import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FirstPersonControls } from "./FirstPersonControls.js";

const loader = new GLTFLoader();

// create variables and make them available globally
let scene, myRenderer, camera;
let textureLoader;
// keep track of which frame we are on
let frameCount = 0;
let avatarMesh = null; 
let mouse;
let pointerDown = false; // keep track of whether the mouse pointer is down
let shiftDown = false;

const floorGeometry = new THREE.PlaneGeometry(1000, 1000); // width, height
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0xf5f1e4, // color
  roughness: 1,    // matte look
  metalness: 0     // not metallic
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
floor.position.y = -1;           // Lower it under your object
floor.receiveShadow = true;      // Optional: receives shadows

let artworks = [
   {
    "url": "assets/sm/gardenofoysters.glb", 
    "sizeX": 15,
    "sizeY": 15,
    "sizeZ": 15,
    "x": -55, 
    "y": 1, 
    "z": 1, 
    "rotation": 90,
    "title": "garden of oysters", 
    "walltext": "title: garden of oysters\n\nartist: helen lin\n\ndescription: This soft sculpture painting was sewn together using digitally printed floral fabric. The fabric was cut up and rearranged into fleshy oyster bouquet, presents its treasured pearls to the viewer."
   },
   {
     "url": "assets/sm/milliondollarshirt.glb", 
     "sizeX": 6,
     "sizeY": 6,
     "sizeZ": 6,
     "x": 30, 
     "y": 0, 
     "z": 5, 
     "rotation": 180,
     "title": "million dollar shirt", 
     "walltext": "title: million dollar shirtn\n\nartist: helen lin\n\ndescription: million dollar shirt is made with puff flowers and the spirit of friendship. You can't put a price on friendship, but if you did, it would be a million dollars."
   },
     {
     "url": "assets/sm/shortcake-anim.glb", 
     "sizeX": 6,
     "sizeY": 6,
     "sizeZ": 6,
     "x": 20, 
     "y": 0, 
     "z": -5, 
     "rotation": 0,
     "title": "you’re a shortcake and i am too", 
     "walltext": "title: you’re a shortcake and i am too\n\nartist: helen lin\n\ndescription: Fleece pants and ruffle skirt scraps stretched over a canvas to create a painting with soft curves protruding out towards the viewer. Playful and nostalgic elementary school ornaments such as plastic star beads, zippers, lace, and frills from discarded girls' clothing decorate the two white bases."
   },
     {
     "url": "assets/sm/fusign.glb", 
     "sizeX": 10,
     "sizeY": 10,
     "sizeZ": 10,
     "x": -10, 
     "y": 0, 
     "z": 5, 
     "rotation": 180,
     "title": "dotted fu sign", 
     "walltext": "title: dottedfusign\n\nartist: helen lin\n\ndescription: Fu signs are traditionally displayed on the front doors of Chinese households to bring in prosperity. This interpretation renders the traditionally red signifier of prosperity into white, a color typically reserved for funeral rites."
   },
  {
    "url": "assets/sm/canyougrab-anim.glb", 
    "sizeX": 14,
    "sizeY": 14,
    "sizeZ": 14,
    "x": -30, 
    "y": 0, 
    "z": -5, 
    "rotation": 90,
    "title": "can you grab these on the way in, pt. i", 
    "walltext": "title: can you grab these on the way in, pt. i\n\nartist: helen lin\n\ndescription: Repurposed fabric shopping bag from a Chinese supermarket in Flushing, folded and sewn using shibori fabric manipulation technique. Despite being constructed to serve as a sustainable alternative to plastic bags, this bag can often be found in landfills and littered across the streets of New York City. The time-intensive manipulation process turns this common item into something special. The title references the everyday action of asking a family member to help grab the bags of groceries on the way back into the house from the supermarket."
  }
]

let stitches = []; 
let stitchGeo = new THREE.BoxGeometry(0.3, 0.05, 0.05);
let stitchMat = new THREE.MeshBasicMaterial({ color: 0x000000 });


// wall text variables
const popupText = document.getElementById('popupText');
let textVisible = false;

// Track typed letters
let typed = '';

let viewers = [];

// keep track of our controls so we can update them in the draw loop
let controls;

let socket;

function setupMySocket(){
  socket = io();
  socket.on('msg', updateLocation);
  socket.on('cast', castStitch);

}

function addModels() {

  for (let i = 0; i < artworks.length; i++) {

    console.log(artworks[i].url);

    
    let modelLoader = new GLTFLoader();
    let myUrl = artworks[i].url;
    modelLoader.load(myUrl, function ( gltf ) {
    
      let mesh = gltf.scene;
      mesh.position.set(artworks[i].x, artworks[i].y, artworks[i].z);
      mesh.scale.set(artworks[i].sizeX, artworks[i].sizeY, artworks[i].sizeZ);
      mesh.rotation.y = THREE.MathUtils.degToRad(artworks[i].rotation);
      mesh.layers.enable(3);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    
    
    });

  
  }
}

// function addOtherPersonsDrawing(x, y, z) {
//   let mesh = new THREE.Mesh(geo, mat);
//   scene.add(mesh);
//   mesh.position.set(x, y, z);
//   mesh.castShadow = true;
// }

 function setupRaycastInteraction() {
   mouse = new THREE.Vector2(0, 0);

    //create a geometry and material which we'll reuse for each newly created mesh
   let geo = new THREE.IcosahedronGeometry(0.25, 0);
   let mat = new THREE.MeshPhongMaterial({ color: "red" });

   document.addEventListener(
     "pointermove",
     (ev) => {
        //three.js expects 'normalized device coordinates' (i.e. between -1 and 1 on both axes)
       mouse.x = (ev.clientX / window.innerWidth) * 2 - 1;
       mouse.y = -(ev.clientY / window.innerHeight) * 2 + 1;

       if (pointerDown) {
         raycaster.setFromCamera(mouse, camera);

         const intersects = raycaster.intersectObject(floor);

         if (intersects.length) {
           let point = intersects[0].point;
           console.log(point);
           addStitch();
           //socket.emit("msg", point);

           /*
           // add our own
           let mesh = new THREE.Mesh(geo, mat);
           scene.add(mesh);
           mesh.position.set(point.x, point.y, point.z);
           mesh.castShadow = true;
           */
         }
       }
     },
     false
   );

   let raycaster = new THREE.Raycaster();
   document.addEventListener("pointerdown", (ev) => {
     pointerDown = true;
   });
   document.addEventListener("pointerup", (ev) => {
     pointerDown = false;
   });

 }

function loadAvatarModel() {
  let modelLoader = new GLTFLoader();
  let myUrl = "assets/sm/needle2.glb";
  modelLoader.load(myUrl, function ( gltf ) {
  
    // lets us create a for each callback
    gltf.scene.traverse((child) => {if (child.isMesh) {
      avatarMesh = child;
      }})

    //console.log(avatarMesh.geometry);
    //scene.add(avatarMesh);
  });
}

function createNewAvatar(msg){

  let geo = avatarMesh.geometry;
  let mat = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,     // Light gray (silver-like)
    //metalness: 1.0,       // Fully metallic
    roughness: 0.2        // Some shine, not a mirror
  });

  let newMesh = new THREE.Mesh(geo, mat);
  newMesh.scale.set(0.25, 0.25, 0.25);

  viewers.push(
    {id: msg.id,
    mesh: newMesh});

  newMesh.position.set(msg.x,msg.y-0.5,msg.z);
  scene.add(newMesh);
  console.log(scene.children);
}

function updateLocation(msg){
  //console.log(msg);
  let myMesh;
  for(let i = 0; i < viewers.length; i++){
    if (viewers[i].id == msg.id) { 
      myMesh = viewers[i].mesh;
      myMesh.position.set(msg.x,msg.y-0.5,msg.z);
    }
  }
  if (myMesh == null) {
    createNewAvatar(msg);
  }
  
}

function castStitch(msg){
  console.log("stitchCast");
  let stitchLeft = new THREE.Mesh(stitchGeo, stitchMat);
  let stitchRight = new THREE.Mesh(stitchGeo, stitchMat);
  stitchRight.rotation.z = Math.PI / 2;

  let stitchGroup = new THREE.Group();
  stitchGroup.add(stitchLeft);
  stitchGroup.add(stitchRight);

  stitchGroup.position.set(msg.x,msg.y-1,msg.z);
  stitchGroup.rotation.set(Math.random() * Math.PI*2, 
  Math.random() * Math.PI*2, 
  Math.random() * Math.PI*2);
  scene.add(stitchGroup);
}

function onKeyDown(ev){
  if ((ev.key === "w") ||
  (ev.key === "a") ||
  (ev.key === "s") ||
  (ev.key === "d"))
    {
      /*
    let myMessage = {
      id: socket.id,
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    socket.emit('msg', myMessage);
    */
  }
}

// Listen for keypress
window.addEventListener('keydown', (e) => {
  typed += e.key.toLowerCase();
  if (!'cast'.startsWith(typed)) {
    typed = e.key.toLowerCase() === 'c' ? 'c' : '';
  }

  if (typed === 'cast') {
    let myMessage = {
      id: socket.id,
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    socket.emit('cast', myMessage);
    typed = ''; // reset after success
  }
});


// Handle resizing
window.addEventListener('resize', () => {
  myRenderer.setSize(window.innerWidth, window.innerHeight);
});

function checkTrigger() {
  // Check if camera is inside the trigger box

  let camX = camera.position.x; 
  let camY = camera.position.y;
  let camZ = camera.position.z;
  let tDist = 3;


  for (let i = 0; i < artworks.length; i++) {
    let item = artworks[i];

    if (
      camX >= item.x-tDist && camX <= item.x+tDist &&
      camY >= item.y-tDist && camY <= item.y+tDist &&
      camZ >= item.z-tDist && camZ <= item.z+tDist
    ) {
      if (!textVisible) {
        let wText = item.walltext;
        popupText.innerHTML = wText.replace(/\n/g, "<br>");;
        popupText.style.display = 'block';
        textVisible = true;
        break;
      }
    } else {
      if (textVisible) {
        popupText.style.display = 'none';
        textVisible = false;
      }
    }

  }

}

function init() {

  loadAvatarModel();
  setupRaycastInteraction();

  // create a scene and give it a background color
  scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(20,20,20)");

  // create the renderer which will actually draw our scene and add it to the document
  myRenderer = new THREE.WebGLRenderer();
  myRenderer.setSize(window.innerWidth, window.innerHeight);
  myRenderer.shadowMap.enabled = true; // ✅ enable shadow maps
  myRenderer.shadowMap.type = THREE.PCFSoftShadowMap; // optional: softer shadows
  document.body.appendChild(myRenderer.domElement);

  // create our camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(41, 0, 0);
  camera.lookAt(6, 0, 0);

  // add orbit controls so we can navigate our scene while testing
  controls = new FirstPersonControls(scene, camera, myRenderer);

  // mesh
  //let grid = new THREE.GridHelper(300, 100);
  //scene.add(grid);
  scene.background = new THREE.Color("rgb(252, 220, 220)");
  scene.add(floor);


  // walls and space
  let wallGeo = new THREE.BoxGeometry(100,15,0.25);
  let regMat = new THREE.MeshStandardMaterial({ color: 0xffeae0 });

  let wallMesh1 = new THREE.Mesh(wallGeo, regMat);
  let wallMesh2 = new THREE.Mesh(wallGeo, regMat);
  wallMesh1.position.set(6,5,6);
  wallMesh2.position.set(6,5,-6);

  let wallMesh2ExtendGeo = new THREE.BoxGeometry(20,15,0.25);
  let wallMesh2Extend = new THREE.Mesh(wallMesh2ExtendGeo, regMat);
  let vertMeshGeo = new THREE.BoxGeometry(0.25,15,20);
  let vertWallMesh1 = new THREE.Mesh(vertMeshGeo, regMat);
  let vertWallMesh2 = new THREE.Mesh(vertMeshGeo, regMat);  
  wallMesh2Extend.position.set(-50,5,6);
  vertWallMesh1.position.set(-44, 5, -16);
  vertWallMesh2.position.set(-56, 5, -16);

  let backWallGeo = new THREE.BoxGeometry(0.25,15,20);
  let backWall1 = new THREE.Mesh(backWallGeo, regMat);
  let backWall2 = new THREE.Mesh(backWallGeo, regMat);
  backWall1.position.set(50,5,0);
  backWall2.position.set(-56,5,0);

  let innerCylGeo = new THREE.CylinderGeometry(20, 20, 15, 45 );
  let innerCylMesh = new THREE.Mesh(innerCylGeo, regMat);
  innerCylMesh.position.set(-50, 5, -66);

  let outerCylGeo = new THREE.CylinderGeometry(41, 41, 15, 45, 1,true
  );
  let outerCylMesh = new THREE.Mesh(outerCylGeo, regMat);
  outerCylMesh.position.set(-50, 5, -66);
  outerCylMesh.rotation.set(0, Math.PI, 0);

  [
    wallMesh1, wallMesh2, wallMesh2Extend, vertWallMesh1, vertWallMesh2,
    backWall1, backWall2, innerCylMesh, outerCylMesh
  ].forEach(mesh => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.layers.enable(3);
    scene.add(mesh);
  });


  // Add artwork models
  addModels();

  // add websocket support
  setupMySocket();

  // add some lights
  let ambientLight = new THREE.AmbientLight(0xf3f5d0, 3); // reduce intensity a bit
  scene.add(ambientLight);

  // White directional light at half intensity shining from the top.
  let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(30, 50, 30);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;

  scene.add(directionalLight);

  window.addEventListener('keydown', onKeyDown);

  // start the draw loop
  draw();
}

function draw() {
  controls.update();
  frameCount = frameCount + 1;

  checkTrigger(); 
  
  if (frameCount % 5 === 0) {
    let myMessage = {
      id: socket.id,
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    socket.emit('msg', myMessage);
  }

  myRenderer.render(scene, camera);

  // ask the browser to render another frame when it is ready
  window.requestAnimationFrame(draw);
}

// get everything started by calling init
init();










