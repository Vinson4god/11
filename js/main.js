import * as THREE from 'three';
import ImageLoader from './ImageLoader.js';
import ImageParticles from './ImageParticles.js';
import MouseInteraction from './MouseInteraction.js';

// 配置
const config = {
  particleCount: 5000,
  particleSize: 2,
  style: 'grid',
  mouseForce: 100,
  windForce: 0.05,
  animationSpeed: 1,
};

// Scene 设置
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
document.getElementById('canvas-container').appendChild(renderer.domElement);

camera.position.z = 500;

// 初始化模块
const imageLoader = new ImageLoader();
let particles = null;
let mouseInteraction = null;
let imageData = null;

// 上传图片处理
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const changeImageBtn = document.getElementById('changeImageBtn');

// 拖放事件
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleImageUpload(files[0]);
  }
});

dropZone.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleImageUpload(e.target.files[0]);
  }
});

changeImageBtn.addEventListener('click', () => {
  imageInput.click();
});

async function handleImageUpload(file) {
  try {
    imageData = await imageLoader.loadImage(file);
    previewImg.src = imageData.dataURL;
    imagePreview.style.display = 'block';
    dropZone.style.display = 'none';

    // 创建粒子系统
    createParticles(imageData);
  } catch (error) {
    console.error('加载图片失败:', error);
    alert('加载图片失败，请重试');
  }
}

function createParticles(data) {
  // 移除旧粒子
  if (particles && particles.mesh) {
    scene.remove(particles.mesh);
  }

  particles = new ImageParticles({
    imageData: data,
    particleCount: config.particleCount,
    particleSize: config.particleSize,
    style: config.style,
    scene: scene,
  });

  // 初始化鼠标交互
  if (mouseInteraction) {
    mouseInteraction.setParticles(particles);
  } else {
    mouseInteraction = new MouseInteraction(particles, config);
  }
}

// 控制面板事件
document.querySelectorAll('input[name="style"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    config.style = e.target.value;
    if (imageData) createParticles(imageData);
  });
});

document.getElementById('particleCount').addEventListener('input', (e) => {
  config.particleCount = parseInt(e.target.value);
  document.getElementById('particleCountValue').textContent = config.particleCount;
  if (imageData) createParticles(imageData);
});

document.getElementById('particleSize').addEventListener('input', (e) => {
  config.particleSize = parseFloat(e.target.value);
  document.getElementById('particleSizeValue').textContent = config.particleSize.toFixed(1);
  if (particles) particles.updateSize(config.particleSize);
});

document.getElementById('mouseForce').addEventListener('input', (e) => {
  config.mouseForce = parseInt(e.target.value);
  document.getElementById('mouseForceValue').textContent = config.mouseForce;
  if (mouseInteraction) mouseInteraction.updateForce(config.mouseForce);
});

document.getElementById('windForce').addEventListener('input', (e) => {
  config.windForce = parseFloat(e.target.value);
  document.getElementById('windForceValue').textContent = config.windForce.toFixed(2);
  if (particles) particles.setWindForce(config.windForce);
});

document.getElementById('animationSpeed').addEventListener('input', (e) => {
  config.animationSpeed = parseFloat(e.target.value);
  document.getElementById('animationSpeedValue').textContent = config.animationSpeed.toFixed(1);
  if (particles) particles.setAnimationSpeed(config.animationSpeed);
});

// 按钮事件
document.getElementById('resetBtn').addEventListener('click', () => {
  if (particles) particles.reset();
});

document.getElementById('reformBtn').addEventListener('click', () => {
  if (particles) particles.reform();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.href = renderer.domElement.toDataURL('image/png');
  link.download = `particle-effect-${Date.now()}.png`;
  link.click();
});

// 性能监测
let lastTime = Date.now();
let frameCount = 0;
setInterval(() => {
  const now = Date.now();
  const delta = now - lastTime;
  const fps = Math.round(frameCount / (delta / 1000));
  document.getElementById('fps').textContent = fps;
  frameCount = 0;
  lastTime = now;
}, 1000);

if (particles) {
  document.getElementById('particleStats').textContent = particles.particleCount || 0;
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  frameCount++;

  if (particles) {
    particles.update();
    if (mouseInteraction) mouseInteraction.update();
  }

  renderer.render(scene, camera);
}

animate();

// 响应式
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
