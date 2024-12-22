import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const frameRate = 165

const startingCameraHeight = 0.4
let curCameraHeight = startingCameraHeight
const startingRunSpeed = 0.05
const maxSpeed = 2
const gravity = 4.9
let isSneaking = false
let isSprinting = false

let movingForward = false
let movingBackward = false
let movingLeft = false
let movingRight = false

let hasSecondJump = false;
let score = 0

let windowWidth = window.innerWidth
let windowHeight = window.innerHeight

let scene = new THREE.Scene()
// const canvas = document.getElementById("canvas")
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize( windowWidth, windowHeight );
document.body.appendChild( renderer.domElement );
// let renderer = new THREE.WebGLRenderer({
//     canvas,
//     // alpha: true,
//     // antialias:true
// });
let camera = new THREE.PerspectiveCamera(75, windowWidth / windowHeight, 0.05, 100) // perspective camera
camera.lookAt(0, 0, 1)
camera.position.y = startingCameraHeight

scene.add(camera)

const floorGeo = new THREE.PlaneGeometry(1000, 1000)
const floorMat = new THREE.MeshPhongMaterial({color: 0x808080})
const floor = new THREE.Mesh(floorGeo, floorMat)

// const box = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), new THREE.MeshBasicMaterial({color: 0xff0000}))
// box.position.y = 1
// box.position.z = 4
// scene.add(box)

floor.rotateX(-Math.PI/2)

scene.add(floor)

// const boxGeo = new THREE.BoxGeometry(0.01, 0.01, 0.01)
// const boxMat = new THREE.MeshBasicMaterial({color: 0xff0000})
// const box = new THREE.Mesh(boxGeo, boxMat)

// box.position.y = 0.5
// box.position.z = 2

// scene.add(box)

let controls = new PointerLockControls(camera, document.body)

const blocker = document.getElementById("blocker")
const blockerText = document.getElementById("blockerText")
const crosshair = document.getElementById("crosshair")

crosshair.width = windowWidth
crosshair.height = windowHeight

const infoText = document.getElementById("infoText")

blockerText.addEventListener("click", () => {
    controls.lock()
})

controls.addEventListener('lock', () => {
    blocker.style.display = "none"
    blockerText.style.display = "none"
    crosshair.style.display = "block"
    infoText.style.display = "block"
})
controls.addEventListener("unlock", () => {
    blocker.style.display = "block"
    blockerText.style.display = ""
    crosshair.style.display = "none"
    infoText.style.display = "none"
    if(hasWon){
        blockerText.style.display = "none"
        winscreen.style.display = "block"
    }
})

scene.add(controls.getObject())

// const ambientLight = new THREE.AmbientLight(0xffffff, 0.001)
const ambientLight = new THREE.HemisphereLight(0xffffff)

scene.add(ambientLight)

const raycaster = new THREE.Raycaster()

const loader = new GLTFLoader()

const loadedObjs = []
let loaded = 0
let hasWonYet = false
const seed = 1
const platforms = [floor]
const treats = []
function loadModel(name){
    loader.load(`models/${name}.glb`, (gltf) => {
        // scene.add(gltf.scene.children[0])
        console.log(gltf.scene.children[0]);
        loadedObjs.push(gltf.scene.children[0])
        // loaded++
        // if(loaded === 4){
        //     loaded = 0
        //     init()
        // }
        genPlatforms(gltf.scene.children[0])
    },
    (xhr) => {
        console.log(( xhr.loaded / xhr.total * 100 ) + '% loaded');

    },
    function (error) {
        console.log( 'An error happened' + error);
    }
    )
}

loadModel("dogtreat")
// setTimeout(() => {
// console.log(loadedObjs);
// }, 1000)
// scene.add(loadedObjs[0])
// loadedObjs[0].position.set(0, 4, 0)

function genPlatforms(dogTreat){
    console.log(dogTreat);
    const platformGeo = new THREE.BoxGeometry(20, 4, 20).toNonIndexed()
    const colorsBox = [];

    const color = new THREE.Color();
    let flipper = false;
    console.log(platformGeo.attributes.position.count);
    for (let i = 0; i < platformGeo.attributes.position.count; i ++) {
    
        if(i % 3 === 0){
            flipper = !flipper
        }
        // if(i % 12 === 0){
        //     flipper = !flipper
        // }
        color.setRGB(Number(flipper), 1 - Number(flipper), 0 );
        colorsBox.push(color.r, color.g, color.b);
    
    }

    platformGeo.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsBox, 3 ) );
    // const platform = new THREE.Mesh(platformGeo, new THREE.MeshPhongMaterial({specular: 0xffffff, flatShading: true, vertexColors: true}))
    //generate platforms

    for(let i = 0; i < 50; i++){
        const platform = new THREE.Mesh(platformGeo, new THREE.MeshPhongMaterial({specular: 0xffffff, flatShading: true, vertexColors: true}))
        platform.position.set(Math.random(seed)*100 - 50, Math.random(seed)*100 - 50, Math.random(seed)*100 - 50)
        const boxA = new THREE.Box3().setFromObject(platform)
        for(let j = 0; j < i + 1; j++){
            const boxB = new THREE.Box3().setFromObject(platforms[j])
            if(boxA.intersectsBox(boxB)){
                platform.position.set(Math.random(seed)*100 - 50, Math.random(seed)*100 - 50, Math.random(seed)*100 - 50)
                boxA.setFromObject(platform)
                j = 0
            }
        }
        scene.add(platform)
        platforms.push(platform)
        
        const treat = new THREE.Mesh(dogTreat.geometry, dogTreat.material)
        treat.position.set(platform.position.x, platform.position.y + 4, platform.position.z)
        treat.setRotationFromEuler(new THREE.Euler(0, Math.random(seed)*Math.PI*2, 0))
        treats.push(treat)
        scene.add(treat)
    }
    init();
}
function raycastTesting(){
    raycaster.setFromCamera({x: 0, y: 0}, camera)
    const intersectedObjects = raycaster.intersectObject(scene)
    if(intersectedObjects){
        console.log(intersectedObjects)
        const position = intersectedObjects[0].point
        // intersectedObjects[0].object.material.color.set(0x000000)
        // setTimeout(() => {}, 100)
        box.position.set(position.x, position.y, position.z)
        console.log(box.position)
        console.log(position)
    }
}



const winscreen = document.getElementById("winscreen")
const timerText = document.getElementById("time")

let hasWon = false
let bestTime
let sessionTime
let startTime = 0
function win(){
    // controls.unlock()
    hasWon = true
    hasWonYet = true
    sessionTime = (Date.now() - startTime)/1000
    document.exitPointerLock()
    if(bestTime){
        if(sessionTime < bestTime){
            bestTime = sessionTime
        }
    } else {
        bestTime = sessionTime
    }
    timerText.innerHTML = `Your time was ${sessionTime} seconds and your best time this session was ${bestTime} seconds`
    // blockerText.style.display = "none"
    // winscreen.style.display = 'block'

}


winscreen.onclick = () => {
    hasWon = false

    winscreen.style.display = 'none'

    camera.position.set(0,startingCameraHeight,0)
    camera.lookAt(0, startingCameraHeight, -1)

    controls.lock()

    startTime = Date.now()

    render()
}

renderer.render(scene, camera)


function init(){
    startTime = Date.now()
    console.log(controls.getObject().position);
    render()
}


let time2
let start
let vx = 0
let vz = 0
let count = 0;
let groundedFrames = [false, false, false, false, false]
let isJumping = false
let lastJumpTime = 0;
let lastGroudedTime = 0;

function coyoteFrames(){
    groundedFrames.push(groundCheck())
    groundedFrames.shift()
}


// logic

let runSpeed = maxSpeed

function groundCheck(){
    raycaster.set(controls.getObject().position, new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObjects(scene.children);
    if(intersects.length === 0){
        return false
    }
    // console.log(intersects[0].distance);
    return intersects[0].distance <= curCameraHeight + 0.05
}

function isGrounded(){
    for(let i = 0; i < groundedFrames.length; i++){
        if(groundedFrames[i] === true){
            return true
        }
    }
    return false
}

function jump(){

    if(isGrounded() && !isJumping){
        totalVelocity.y += 0.5
        groundedFrames = [false, false, false, false, false]
    }
    isJumping = true
}

function jumpCut(){
    if(isJumping && totalVelocity.y > 0){
        totalVelocity.y *= 0.3
    }
}

let totalVelocity = new THREE.Vector3(0, 0, 0)

let neg = false
function move(deltaTime){
    const accel = runSpeed * 24 * deltaTime/1000
    const airAccel = accel * 0.5
    let fwdSpeed = 0
    let sideSpeed = 0
    if(movingForward) fwdSpeed += accel
    if(movingBackward) fwdSpeed -= accel
    if(movingLeft) sideSpeed -= accel
    if(movingRight) sideSpeed += accel
    if(fwdSpeed > runSpeed) fwdSpeed = runSpeed
    if(fwdSpeed < -runSpeed) fwdSpeed = -runSpeed
    if(sideSpeed > runSpeed) sideSpeed = runSpeed
    if(sideSpeed < -runSpeed) sideSpeed = -runSpeed
    if(!movingForward && !movingBackward || movingForward && movingBackward){
        if(fwdSpeed > 0){
            fwdSpeed -= airAccel
        } else if(fwdSpeed < 0){
            fwdSpeed += airAccel
        }
    }
    if(!movingLeft && !movingRight || movingLeft && movingRight){
        if(sideSpeed > 0){
            sideSpeed -= airAccel
        } else if(sideSpeed < 0){
            sideSpeed += airAccel
        }
    }
    if(Math.abs(fwdSpeed) < 0.01) fwdSpeed = 0
    if(Math.abs(sideSpeed) < 0.01) sideSpeed = 0
    controls.moveForward(fwdSpeed)
    controls.moveRight(sideSpeed)
}
function forces(deltaTime){
    move(deltaTime)
    // gravity
    if(!isGrounded()){
        totalVelocity.y -= totalVelocity.y < 0 ? gravity * deltaTime/1000 : gravity * 0.5 * deltaTime/1000
    }
    
    controls.getObject().position.set(controls.getObject().position.x + totalVelocity.x, controls.getObject().position.y + totalVelocity.y, controls.getObject().position.z + totalVelocity.z)
    if(controls.getObject().position.y < -100){
        controls.getObject().position.y = curCameraHeight
        totalVelocity.y = 0
    }
}

function checkPlatform(){
    raycaster.set(controls.getObject().position, new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObjects(scene.children);
    if(intersects.length === 0){
        // controls.getObject().position.y = curCameraHeight
        // totalVelocity.y = 0
        return
    }
    if(intersects[0].distance <= curCameraHeight){
        controls.getObject().position.y = intersects[0].point.y + curCameraHeight
        if(isJumping) totalVelocity.y = 0
        isJumping = false
        return
    }
    if(-totalVelocity.y > intersects[0].distance - curCameraHeight){
        controls.getObject().position.y = intersects[0].point.y + curCameraHeight
        totalVelocity.y = 0
        isJumping = false
    }
}
let scoreText = document.getElementById("score")
function checkTreats(){
    for(let i = 0; i < treats.length; i++){
        const treat = treats[i]
        if(treat.position.distanceTo(controls.getObject().position) < 5){
            console.log(scoreText);
            scene.remove(treat)
            treats.splice(i, 1)
            score++
            console.log(score, scoreText.innerHTML);
            scoreText.innerHTML = `Score: ${score}`
        }
    }
}

function rotateTreats(){
    for(let i = 0; i < treats.length; i++){
        treats[i].rotation.y += Math.sin(Date.now()/1000) * 0.01
        treats[i].position.y += Math.sin(Date.now()/500) * 0.01
    }
}

function render(time){
    // render loop
    coyoteFrames()
    forces(time - time2)
    checkPlatform()
    checkTreats()
    rotateTreats()
    count++
    // fps stuff
    console.log(isJumping);
    renderer.render(scene, camera)
    const diff = time - time2
    if(count === 60){
        // console.log("diff", diff)
        // console.log("input", 1000/frameRate - diff);
    }
    // console.log("start", start, "elapsed", elapsed, "time", time);
    // requestAnimationFrame(render)
    // setTimeout(requestAnimationFrame, 16 - 5, render)
    if(!hasWon) setTimeout(requestAnimationFrame, 1000/frameRate - diff, render)
    time2 = time
}

setInterval(() => {
    // console.log("frames",count);
    count = 0
}, 1000)
// key stuff

document.addEventListener("keydown", (event) => {
    event.isComposing ? console.log("composing") : ""
    const key = event.key
    event.preventDefault()
    // console.log(event.key)
    if (event.ctrlKey && event.key === 'w') {
        event.preventDefault();
    }
    switch (key.toLowerCase()) {
        case 'w':
            movingForward = true
            break;
        case 'a':
            movingLeft = true
            break
        case 's':
            movingBackward = true
            break
        case 'd':
            movingRight = true
            break;
        case ' ':
            jump()
            break;
        case 'shift':
            enterSneak()
            break;
        case 'control':
            enterSprint()
            break;
    } 
})

document.addEventListener('pointerlockchange', () => {
    if (!controls.isLocked) {
        // if()
    }
});

document.addEventListener('beforeunload', () => {
    return "you sure?"
})

document.addEventListener("keyup", (event) => {
    event.isComposing ? console.log("composing") : ""
    const key = event.key
    event.preventDefault()
    // console.log(key)
    switch (key.toLowerCase()) {
        case 'w':
            movingForward = false
            break;
        case 'a':
            movingLeft = false
            break
        case 's':
            movingBackward = false
            break
        case 'd':
            movingRight = false
            break;
        case ' ':
            jumpCut()
            break;
        case 'shift':
            exitSneak()
            break;
        case 'control':
            exitSprint()
            break;
    }
})

function enterSneak(){
    if(isSneaking) return
    controls.getObject().position.y -= curCameraHeight/2
    curCameraHeight -= curCameraHeight/2
    runSpeed = maxSpeed/4
    isSneaking = true
}

function exitSneak(){
    controls.getObject().position.y += curCameraHeight/2
    curCameraHeight += curCameraHeight/2
    runSpeed = maxSpeed
    isSneaking = false
}

function enterSprint(){
    if(isSprinting) return
    runSpeed = maxSpeed * 2
    isSprinting = true
}

function exitSprint(){
    runSpeed = maxSpeed
    isSprinting = false
}

// crosshair creation code
let ctx = crosshair.getContext("2d")
ctx.fillStyle = 'white'
ctx.beginPath()
ctx.arc(windowWidth/2, windowHeight/2, 4, 0, 2 * Math.PI)
ctx.fill()
ctx.stroke()

function onWindowResize() {

    console.log('resize')

    windowWidth = window.innerWidth
    windowHeight = window.innerHeight

    crosshair.width = windowWidth
    crosshair.height = windowHeight

    camera.aspect = windowWidth / windowHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( windowWidth, windowHeight );

}

window.onresize = onWindowResize