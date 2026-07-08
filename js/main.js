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
  glowIntensity: 1.0,
  feather: 0.5,
  tintColor: null,        // null = 使用图片原色
  useOriginalColor: true,
  explosionForce: 300,
};

// Scene 设置 — 深色背景
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111); // 深色背景

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
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

  const tintColor = config.useOriginalColor ? null : config.tintColor;

  particles = new ImageParticles({
    imageData: data,
    particleCount: config.particleCount,
    particleSize: config.particleSize,
    style: config.style,
    scene: scene,
    tintColor: tintColor,
    glowIntensity: config.glowIntensity,
    feather: config.feather,
  });

  // 更新统计显示
  document.getElementById('particleStats').textContent = particles.particleCount || 0;

  // 初始化鼠标交互
  if (mouseInteraction) {
    mouseInteraction.setParticles(particles);
  } else {
    mouseInteraction = new MouseInteraction(particles, {
      mouseForce: config.mouseForce,
      explosionForce: config.explosionForce,
    });
  }
}

// ===== 控制面板事件 =====

// 风格
document.querySelectorAll('input[name="style"]').forEach((radio) => {
  radio.addEventListener('change', (e) => {
    config.style = e.target.value;
    if (imageData) createParticles(imageData);
  });
});

// 粒子数量
document.getElementById('particleCount').addEventListener('input', (e) => {
  config.particleCount = parseInt(e.target.value);
  document.getElementById('particleCountValue').textContent = config.particleCount;
  if (imageData) createParticles(imageData);
});

// 粒子大小
document.getElementById('particleSize').addEventListener('input', (e) => {
  config.particleSize = parseFloat(e.target.value);
  document.getElementById('particleSizeValue').textContent = config.particleSize.toFixed(1);
  if (particles) particles.updateSize(config.particleSize);
});

// 光晕强度
document.getElementById('glowIntensity').addEventListener('input', (e) => {
  config.glowIntensity = parseFloat(e.target.value);
  document.getElementById('glowIntensityValue').textContent = config.glowIntensity.toFixed(1);
  if (particles) particles.setGlowIntensity(config.glowIntensity);
});

// 羽化程度
document.getElementById('feather').addEventListener('input', (e) => {
  config.feather = parseFloat(e.target.value);
  document.getElementById('featherValue').textContent = config.feather.toFixed(2);
  if (particles) particles.setFeather(config.feather);
});

// 粒子颜色选择器
document.getElementById('particleColor').addEventListener('input', (e) => {
  config.tintColor = e.target.value;
  if (!config.useOriginalColor && particles) {
    particles.setTintColor(config.tintColor);
  }
});

// 使用图片原色 复选框
document.getElementById('useOriginalColor').addEventListener('change', (e) => {
  config.useOriginalColor = e.target.checked;
  const colorPicker = document.getElementById('particleColor');
  colorPicker.disabled = config.useOriginalColor;
  colorPicker.style.opacity = config.useOriginalColor ? '0.4' : '1';

  if (imageData) {
    // 需要重新创建粒子才能切换颜色模式
    createParticles(imageData);
  }
});

// 鼠标排斥力
document.getElementById('mouseForce').addEventListener('input', (e) => {
  config.mouseForce = parseInt(e.target.value);
  document.getElementById('mouseForceValue').textContent = config.mouseForce;
  if (mouseInteraction) mouseInteraction.updateForce(config.mouseForce);
});

// 点击爆炸力度
document.getElementById('explosionForce').addEventListener('input', (e) => {
  config.explosionForce = parseInt(e.target.value);
  document.getElementById('explosionForceValue').textContent = config.explosionForce;
  if (mouseInteraction) mouseInteraction.setExplosionForce(config.explosionForce);
});

// 风力效果
document.getElementById('windForce').addEventListener('input', (e) => {
  config.windForce = parseFloat(e.target.value);
  document.getElementById('windForceValue').textContent = config.windForce.toFixed(2);
  if (particles) particles.setWindForce(config.windForce);
});

// 动画速度
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


// ===== 导出HTML功能 =====

document.getElementById('exportHTMLBtn').addEventListener('click', async () => {
  if (!imageData) {
    alert('请先上传图片');
    return;
  }

  const exportConfig = {
    particleCount: config.particleCount,
    particleSize: config.particleSize,
    style: config.style,
    mouseForce: config.mouseForce,
    windForce: config.windForce,
    animationSpeed: config.animationSpeed,
    glowIntensity: config.glowIntensity,
    feather: config.feather,
    tintColor: config.tintColor,
    useOriginalColor: config.useOriginalColor,
    explosionForce: config.explosionForce,
  };

  const cssText = `* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n  background: #0f0f0f;\n  height: 100vh;\n  overflow: hidden;\n  color: #e0e0e0;\n}\n\n/* Canvas Container */\n#canvas-container {\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  top: 0;\n  left: 0;\n  cursor: crosshair;\n}\n\n/* Control Panel */\n.control-panel {\n  position: fixed;\n  right: 20px;\n  top: 20px;\n  width: 320px;\n  max-height: 90vh;\n  background: rgba(20, 20, 25, 0.92);\n  border-radius: 12px;\n  padding: 20px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);\n  backdrop-filter: blur(16px);\n  overflow-y: auto;\n  z-index: 100;\n  border: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.control-panel::-webkit-scrollbar {\n  width: 6px;\n}\n\n.control-panel::-webkit-scrollbar-track {\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: 3px;\n}\n\n.control-panel::-webkit-scrollbar-thumb {\n  background: rgba(255, 255, 255, 0.15);\n  border-radius: 3px;\n}\n\n.control-panel::-webkit-scrollbar-thumb:hover {\n  background: rgba(255, 255, 255, 0.25);\n}\n\n/* Upload Section */\n.upload-section {\n  margin-bottom: 20px;\n}\n\n.drop-zone {\n  border: 2px dashed rgba(255, 255, 255, 0.25);\n  border-radius: 8px;\n  padding: 30px 15px;\n  text-align: center;\n  cursor: pointer;\n  transition: all 0.3s ease;\n  background: rgba(255, 255, 255, 0.03);\n}\n\n.drop-zone:hover {\n  border-color: rgba(255, 255, 255, 0.5);\n  background: rgba(255, 255, 255, 0.06);\n  transform: translateY(-2px);\n}\n\n.drop-zone.drag-over {\n  border-color: #00d4aa;\n  background: rgba(0, 212, 170, 0.08);\n  box-shadow: 0 4px 20px rgba(0, 212, 170, 0.15);\n}\n\n.drop-zone svg {\n  color: rgba(255, 255, 255, 0.5);\n  margin-bottom: 8px;\n  transition: color 0.3s ease;\n}\n\n.drop-zone:hover svg {\n  color: rgba(255, 255, 255, 0.8);\n}\n\n.drop-zone p {\n  font-size: 14px;\n  color: rgba(255, 255, 255, 0.5);\n  margin: 0;\n}\n\n.image-preview {\n  position: relative;\n  margin-top: 15px;\n  border-radius: 8px;\n  overflow: hidden;\n  background: #1a1a1a;\n}\n\n.image-preview img {\n  width: 100%;\n  height: 150px;\n  object-fit: cover;\n  display: block;\n}\n\n.btn-small {\n  width: 100%;\n  margin-top: 10px;\n  padding: 8px 12px;\n  background: rgba(255, 255, 255, 0.1);\n  color: #e0e0e0;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  border-radius: 6px;\n  font-size: 12px;\n  cursor: pointer;\n  transition: all 0.3s ease;\n}\n\n.btn-small:hover {\n  background: rgba(255, 255, 255, 0.18);\n  transform: translateY(-1px);\n}\n\n/* Divider */\n.divider {\n  height: 1px;\n  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);\n  margin: 20px 0;\n}\n\n/* Controls Section */\n.controls-section h3 {\n  font-size: 13px;\n  font-weight: 600;\n  color: rgba(255, 255, 255, 0.7);\n  margin-bottom: 15px;\n  text-transform: uppercase;\n  letter-spacing: 0.8px;\n}\n\n.control-group {\n  margin-bottom: 16px;\n}\n\n.control-group label {\n  display: block;\n  font-size: 12px;\n  font-weight: 500;\n  color: rgba(255, 255, 255, 0.55);\n  margin-bottom: 8px;\n  text-transform: uppercase;\n  letter-spacing: 0.3px;\n}\n\n.control-group label span {\n  float: right;\n  color: #00d4aa;\n  font-weight: 600;\n}\n\n.slider {\n  width: 100%;\n  height: 6px;\n  -webkit-appearance: none;\n  appearance: none;\n  background: rgba(255, 255, 255, 0.1);\n  border-radius: 3px;\n  outline: none;\n}\n\n.slider::-webkit-slider-thumb {\n  -webkit-appearance: none;\n  appearance: none;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: #ffffff;\n  cursor: pointer;\n  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);\n  transition: all 0.2s ease;\n}\n\n.slider::-webkit-slider-thumb:hover {\n  transform: scale(1.2);\n  box-shadow: 0 0 16px rgba(255, 255, 255, 0.5);\n}\n\n.slider::-moz-range-thumb {\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: #ffffff;\n  cursor: pointer;\n  border: none;\n  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);\n}\n\n/* Radio Group */\n.radio-group {\n  display: flex;\n  gap: 12px;\n  margin-top: 10px;\n}\n\n.radio-label {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  cursor: pointer;\n  font-size: 13px;\n  color: rgba(255, 255, 255, 0.6);\n  flex: 1;\n}\n\n.radio-label input {\n  cursor: pointer;\n}\n\n/* Color Row */\n.color-row {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n\n.color-row input[type=\"color\"] {\n  width: 48px;\n  height: 32px;\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  border-radius: 6px;\n  cursor: pointer;\n  background: transparent;\n  padding: 2px;\n}\n\n.color-row input[type=\"color\"]::-webkit-color-swatch-wrapper {\n  padding: 0;\n}\n\n.color-row input[type=\"color\"]::-webkit-color-swatch {\n  border-radius: 4px;\n  border: none;\n}\n\n.checkbox-label {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  cursor: pointer;\n  font-size: 12px;\n  color: rgba(255, 255, 255, 0.55);\n  margin-bottom: 0;\n  text-transform: none;\n}\n\n.checkbox-label input {\n  cursor: pointer;\n}\n\n/* Buttons Section */\n.buttons-section {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.btn {\n  padding: 11px 16px;\n  border: none;\n  border-radius: 6px;\n  font-size: 13px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.3s ease;\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  text-align: center;\n}\n\n.btn-primary {\n  background: linear-gradient(135deg, #00d4aa 0%, #00a884 100%);\n  color: #000;\n  box-shadow: 0 4px 16px rgba(0, 212, 170, 0.25);\n}\n\n.btn-primary:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 24px rgba(0, 212, 170, 0.35);\n}\n\n.btn-primary:active {\n  transform: translateY(0);\n}\n\n.btn-secondary {\n  background: rgba(255, 255, 255, 0.06);\n  color: #e0e0e0;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n}\n\n.btn-secondary:hover {\n  background: rgba(255, 255, 255, 0.12);\n  transform: translateY(-2px);\n}\n\n.btn-export {\n  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);\n  color: #fff;\n  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);\n}\n\n.btn-export:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.35);\n}\n\n.btn-tertiary {\n  background: rgba(255, 200, 50, 0.1);\n  color: #ffc832;\n  border: 1px solid rgba(255, 200, 50, 0.25);\n}\n\n.btn-tertiary:hover {\n  background: rgba(255, 200, 50, 0.18);\n  transform: translateY(-2px);\n}\n\n/* Stats */\n.stats {\n  margin-top: 20px;\n  padding: 12px;\n  background: rgba(255, 255, 255, 0.04);\n  border-radius: 6px;\n  font-size: 12px;\n  color: rgba(255, 255, 255, 0.4);\n  line-height: 1.8;\n}\n\n.stats p {\n  margin: 0;\n}\n\n.stats span {\n  font-weight: 600;\n  color: #00d4aa;\n}\n\n/* Mobile Hint */\n.mobile-hint {\n  position: fixed;\n  bottom: 20px;\n  left: 20px;\n  background: rgba(255, 200, 50, 0.9);\n  color: #000;\n  padding: 12px 16px;\n  border-radius: 6px;\n  font-size: 13px;\n  backdrop-filter: blur(10px);\n  display: none;\n  z-index: 50;\n}\n\n/* Responsive Design */\n@media (max-width: 1024px) {\n  .control-panel {\n    width: 280px;\n    right: 10px;\n    top: 10px;\n    padding: 15px;\n  }\n\n  .mobile-hint {\n    display: block;\n  }\n}\n\n@media (max-width: 768px) {\n  .control-panel {\n    position: fixed;\n    bottom: 0;\n    right: 0;\n    top: auto;\n    width: 100%;\n    max-height: 50vh;\n    border-radius: 12px 12px 0 0;\n    left: 0;\n  }\n\n  .mobile-hint {\n    display: block;\n    bottom: auto;\n    top: 10px;\n  }\n\n  .drop-zone {\n    padding: 20px 10px;\n  }\n\n  .image-preview img {\n    height: 100px;\n  }\n}\n\n/* Loading Animation */\n@keyframes fadeIn {\n  from {\n    opacity: 0;\n    transform: translateY(10px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n.control-panel {\n  animation: fadeIn 0.3s ease;\n}\n`;
  const particlesCode = `import * as THREE from 'three';\n\nexport default class ImageParticles {\n  constructor(options) {\n    this.scene = options.scene;\n    this.imageData = options.imageData;\n    this.particleCount = options.particleCount;\n    this.particleSize = options.particleSize;\n    this.style = options.style;\n    this.tintColor = options.tintColor || null;\n    this.glowIntensity = options.glowIntensity || 1.0;\n    this.feather = options.feather || 0.5;\n    this.animationSpeed = 1;\n    this.windForce = 0.05;\n    this.time = 0;\n\n    this.init();\n  }\n\n  createGlowTexture(feather) {\n    const size = 64;\n    const canvas = document.createElement('canvas');\n    canvas.width = size;\n    canvas.height = size;\n    const ctx = canvas.getContext('2d');\n\n    const gradient = ctx.createRadialGradient(\n      size / 2, size / 2, 0,\n      size / 2, size / 2, size / 2\n    );\n\n    gradient.addColorStop(0, 'rgba(255,255,255,1)');\n    const midStop = 0.3 + (1 - feather) * 0.4;\n    gradient.addColorStop(midStop, 'rgba(255,255,255,0.6)');\n    gradient.addColorStop(1, 'rgba(255,255,255,0)');\n\n    ctx.fillStyle = gradient;\n    ctx.fillRect(0, 0, size, size);\n\n    const texture = new THREE.CanvasTexture(canvas);\n    texture.needsUpdate = true;\n    return texture;\n  }\n\n  init() {\n    const { width, height, data } = this.imageData;\n    const positions = new Float32Array(this.particleCount * 3);\n    const colors = new Float32Array(this.particleCount * 3);\n    const velocities = new Float32Array(this.particleCount * 3);\n    const sizes = new Float32Array(this.particleCount);\n\n    const step = Math.ceil(Math.sqrt((width * height) / this.particleCount));\n    let particleIndex = 0;\n\n    let tintR = 1, tintG = 1, tintB = 1;\n    if (this.tintColor) {\n      const c = new THREE.Color(this.tintColor);\n      tintR = c.r; tintG = c.g; tintB = c.b;\n    }\n\n    if (this.style === 'grid') {\n      for (let y = 0; y < height && particleIndex < this.particleCount; y += step) {\n        for (let x = 0; x < width && particleIndex < this.particleCount; x += step) {\n          const idx = (y * width + x) * 4;\n          const r = data[idx] / 255;\n          const g = data[idx + 1] / 255;\n          const b = data[idx + 2] / 255;\n          const a = data[idx + 3] / 255;\n\n          const brightness = (r + g + b) / 3;\n          if (a > 0.5 && brightness > 0.12) {\n            const px = (x / width - 0.5) * 400;\n            const py = -(y / height - 0.5) * 300;\n            const pz = (Math.random() - 0.5) * 10;\n\n            positions[particleIndex * 3] = px;\n            positions[particleIndex * 3 + 1] = py;\n            positions[particleIndex * 3 + 2] = pz;\n\n            if (this.tintColor) {\n              colors[particleIndex * 3] = tintR;\n              colors[particleIndex * 3 + 1] = tintG;\n              colors[particleIndex * 3 + 2] = tintB;\n            } else {\n              colors[particleIndex * 3] = r;\n              colors[particleIndex * 3 + 1] = g;\n              colors[particleIndex * 3 + 2] = b;\n            }\n\n            velocities[particleIndex * 3] = (Math.random() - 0.5) * 0.5;\n            velocities[particleIndex * 3 + 1] = (Math.random() - 0.5) * 0.5;\n            velocities[particleIndex * 3 + 2] = (Math.random() - 0.5) * 0.5;\n\n            sizes[particleIndex] = this.particleSize;\n            particleIndex++;\n          }\n        }\n      }\n    } else {\n      for (let i = 0; i < this.particleCount; i++) {\n        const x = Math.floor(Math.random() * width);\n        const y = Math.floor(Math.random() * height);\n        const idx = (y * width + x) * 4;\n        const r = data[idx] / 255;\n        const g = data[idx + 1] / 255;\n        const b = data[idx + 2] / 255;\n\n        positions[i * 3] = (Math.random() - 0.5) * 400;\n        positions[i * 3 + 1] = (Math.random() - 0.5) * 300;\n        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;\n\n        if (this.tintColor) {\n          colors[i * 3] = tintR;\n          colors[i * 3 + 1] = tintG;\n          colors[i * 3 + 2] = tintB;\n        } else {\n          colors[i * 3] = r;\n          colors[i * 3 + 1] = g;\n          colors[i * 3 + 2] = b;\n        }\n\n        velocities[i * 3] = (Math.random() - 0.5) * 2;\n        velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;\n        velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;\n\n        sizes[i] = this.particleSize;\n      }\n    }\n\n    this.positions = positions;\n    this.originalPositions = new Float32Array(positions);\n    this.colors = colors;\n    this.velocities = velocities;\n    this.sizes = sizes;\n    this.targetPositions = new Float32Array(positions);\n    this.actualParticleCount = particleIndex;\n\n    const geometry = new THREE.BufferGeometry();\n    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));\n    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));\n    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));\n    geometry.setDrawRange(0, this.actualParticleCount);\n\n    const glowTexture = this.createGlowTexture(this.feather);\n\n    const material = new THREE.PointsMaterial({\n      size: this.particleSize,\n      vertexColors: true,\n      transparent: true,\n      opacity: this.glowIntensity,\n      sizeAttenuation: true,\n      map: glowTexture,\n      alphaTest: 0.01,\n      depthWrite: false,\n      blending: THREE.AdditiveBlending,\n    });\n\n    this.mesh = new THREE.Points(geometry, material);\n    this.scene.add(this.mesh);\n  }\n\n  update() {\n    this.time += 0.016 * this.animationSpeed;\n\n    const positions = this.mesh.geometry.attributes.position.array;\n    const count = this.actualParticleCount * 3;\n\n    for (let i = 0; i < count; i += 3) {\n      const vx = this.velocities[i];\n      const vy = this.velocities[i + 1];\n      const vz = this.velocities[i + 2];\n\n      this.velocities[i] += Math.sin(this.time * 0.5 + i) * this.windForce * 0.01;\n      this.velocities[i + 1] -= 0.02 * this.animationSpeed;\n\n      positions[i] += this.velocities[i] * 0.5 * this.animationSpeed;\n      positions[i + 1] += this.velocities[i + 1] * 0.5 * this.animationSpeed;\n      positions[i + 2] += this.velocities[i + 2] * 0.5 * this.animationSpeed;\n\n      if (Math.abs(positions[i]) > 250) {\n        this.velocities[i] *= -0.8;\n        positions[i] = Math.sign(positions[i]) * 250;\n      }\n      if (positions[i + 1] < -200) {\n        positions[i + 1] = -200;\n        this.velocities[i + 1] *= -0.6;\n      }\n      if (positions[i + 1] > 200) {\n        this.velocities[i + 1] *= -0.6;\n        positions[i + 1] = 200;\n      }\n    }\n\n    this.mesh.geometry.attributes.position.needsUpdate = true;\n  }\n\n  updateSize(size) {\n    this.particleSize = size;\n    if (this.mesh) {\n      this.mesh.material.size = size;\n    }\n  }\n\n  setWindForce(force) {\n    this.windForce = force;\n  }\n\n  setAnimationSpeed(speed) {\n    this.animationSpeed = speed;\n  }\n\n  setTintColor(colorHex) {\n    this.tintColor = colorHex;\n    if (!this.mesh) return;\n\n    const colors = this.mesh.geometry.attributes.color.array;\n    const c = new THREE.Color(colorHex);\n    const count = this.actualParticleCount * 3;\n\n    for (let i = 0; i < count; i += 3) {\n      colors[i] = c.r;\n      colors[i + 1] = c.g;\n      colors[i + 2] = c.b;\n    }\n\n    this.mesh.geometry.attributes.color.needsUpdate = true;\n  }\n\n  clearTintColor() {\n    this.tintColor = null;\n    if (!this.mesh) return;\n\n    const colors = this.mesh.geometry.attributes.color.array;\n    for (let i = 0; i < colors.length; i++) {\n      colors[i] = 1.0;\n    }\n    this.mesh.geometry.attributes.color.needsUpdate = true;\n  }\n\n  setGlowIntensity(intensity) {\n    this.glowIntensity = intensity;\n    if (this.mesh) {\n      this.mesh.material.opacity = intensity;\n    }\n  }\n\n  setFeather(feather) {\n    this.feather = feather;\n    if (this.mesh) {\n      const newTexture = this.createGlowTexture(feather);\n      this.mesh.material.map = newTexture;\n      this.mesh.material.needsUpdate = true;\n    }\n  }\n\n  reset() {\n    const positions = this.mesh.geometry.attributes.position.array;\n    positions.set(this.originalPositions);\n    this.velocities.fill(0);\n    this.mesh.geometry.attributes.position.needsUpdate = true;\n  }\n\n  reform() {\n    const positions = this.mesh.geometry.attributes.position.array;\n    for (let i = 0; i < positions.length; i += 3) {\n      this.velocities[i] = (this.originalPositions[i] - positions[i]) * 0.02;\n      this.velocities[i + 1] = (this.originalPositions[i + 1] - positions[i + 1]) * 0.02;\n      this.velocities[i + 2] = (this.originalPositions[i + 2] - positions[i + 2]) * 0.02;\n    }\n  }\n}\n`;
  const interactionCode = `export default class MouseInteraction {\n  constructor(particles, config) {\n    this.particles = particles;\n    this.mouseX = 0;\n    this.mouseY = 0;\n    this.mouseWorldX = 0;\n    this.mouseWorldY = 0;\n    this.mouseForce = config.mouseForce || 100;\n    this.isMouseOver = false;\n\n    // 点击爆炸参数\n    this.explosionForce = config.explosionForce || 300;   // 爆炸力度\n    this.explosionRadius = config.explosionRadius || 150; // 爆炸影响半径\n    this.explosionDecay = config.explosionDecay || 0.92;  // 爆炸后速度衰减\n    this.reformSpeed = config.reformSpeed || 0.03;        // 回归原位的速度\n\n    this.setupListeners();\n  }\n\n  setupListeners() {\n    document.addEventListener('mousemove', (e) => {\n      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;\n      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;\n      this.mouseWorldX = this.mouseX * 400;\n      this.mouseWorldY = this.mouseY * 300;\n      this.isMouseOver = true;\n    });\n\n    document.addEventListener('mouseleave', () => {\n      this.isMouseOver = false;\n    });\n\n    document.addEventListener('mouseenter', () => {\n      this.isMouseOver = true;\n    });\n\n    // 点击爆炸效果\n    document.addEventListener('click', (e) => {\n      const clickX = (e.clientX / window.innerWidth) * 2 - 1;\n      const clickY = -(e.clientY / window.innerHeight) * 2 + 1;\n      this.triggerExplosion(clickX * 400, clickY * 300);\n    });\n  }\n\n  // 触发爆炸：以点击位置为中心，粒子向四周散开\n  triggerExplosion(cx, cy) {\n    if (!this.particles) return;\n\n    const positions = this.particles.mesh.geometry.attributes.position.array;\n    const velocities = this.particles.velocities;\n    const originalPositions = this.particles.originalPositions;\n\n    for (let i = 0; i < positions.length; i += 3) {\n      const dx = positions[i] - cx;\n      const dy = positions[i + 1] - cy;\n      const dz = positions[i + 2];\n      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);\n\n      if (dist < this.explosionRadius && dist > 0.1) {\n        // 越近爆炸越强\n        const force = (1 - dist / this.explosionRadius) * this.explosionForce;\n        // 向外推开（从爆炸中心远离）\n        velocities[i] += (dx / dist) * force * 0.1;\n        velocities[i + 1] += (dy / dist) * force * 0.1;\n        velocities[i + 2] += (dz / (dist + 0.1)) * force * 0.05;\n      }\n    }\n  }\n\n  update() {\n    if (!this.particles) return;\n\n    const positions = this.particles.mesh.geometry.attributes.position.array;\n    const velocities = this.particles.velocities;\n    const originalPositions = this.particles.originalPositions;\n\n    // === 1. 鼠标排斥力（光标附近的粒子被推开）===\n    if (this.isMouseOver) {\n      const mouseWorldZ = 0;\n\n      for (let i = 0; i < positions.length; i += 3) {\n        const dx = positions[i] - this.mouseWorldX;\n        const dy = positions[i + 1] - this.mouseWorldY;\n        const dz = positions[i + 2] - mouseWorldZ;\n\n        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);\n        const maxDistance = this.mouseForce;\n\n        if (distance < maxDistance && distance > 1) {\n          // 推开粒子（排斥力）\n          const force = (1 - distance / maxDistance) * 0.8;\n          velocities[i] += (dx / distance) * force;\n          velocities[i + 1] += (dy / distance) * force;\n          velocities[i + 2] += (dz / distance) * force * 0.3;\n        }\n      }\n    }\n\n    // === 2. 自动回归原位（弹性效果）===\n    for (let i = 0; i < positions.length; i += 3) {\n      const ox = originalPositions[i];\n      const oy = originalPositions[i + 1];\n      const oz = originalPositions[i + 2];\n\n      // 向原始位置施加回拉力\n      velocities[i] += (ox - positions[i]) * this.reformSpeed;\n      velocities[i + 1] += (oy - positions[i + 1]) * this.reformSpeed;\n      velocities[i + 2] += (oz - positions[i + 2]) * this.reformSpeed;\n\n      // 速度阻尼（让运动逐渐稳定）\n      velocities[i] *= this.explosionDecay;\n      velocities[i + 1] *= this.explosionDecay;\n      velocities[i + 2] *= this.explosionDecay;\n    }\n  }\n\n  setParticles(particles) {\n    this.particles = particles;\n  }\n\n  updateForce(force) {\n    this.mouseForce = force;\n  }\n\n  // 更新爆炸参数\n  setExplosionForce(force) {\n    this.explosionForce = force;\n  }\n\n  setExplosionRadius(radius) {\n    this.explosionRadius = radius;\n  }\n\n  setExplosionDecay(decay) {\n    this.explosionDecay = decay;\n  }\n\n  setReformSpeed(speed) {\n    this.reformSpeed = speed;\n  }\n}\n`;
  const embeddedImage = imageData.dataURL;
  const configJSON = JSON.stringify(exportConfig);

  const html = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>粒子效果 - Particle Effect</title>\n<style>\${cssText}</style>\n</head>\n<body>\n<div id="canvas-container"></div>\n<div class="control-panel">\n  <div class="upload-section">\n    <div class="image-preview" style="display:block;">\n      <img src="\${embeddedImage}" alt="preview" style="width:100%;height:150px;object-fit:cover;display:block;">\n    </div>\n  </div>\n  <div class="divider"></div>\n  <div class="controls-section">\n    <h3>粒子参数</h3>\n    <div class="control-group">\n      <label>粒子风格</label>\n      <div class="radio-group">\n        <label class="radio-label"><input type="radio" name="style" value="grid" checked><span>点阵风格</span></label>\n        <label class="radio-label"><input type="radio" name="style" value="fluid"><span>流体风格</span></label>\n      </div>\n    </div>\n    <div class="control-group">\n      <label>粒子数量: <span id="particleCountValue">\${exportConfig.particleCount}</span></label>\n      <input type="range" id="particleCount" min="1000" max="40000" step="1000" value="\${exportConfig.particleCount}" class="slider">\n    </div>\n    <div class="control-group">\n      <label>粒子大小: <span id="particleSizeValue">\${exportConfig.particleSize.toFixed(1)}</span></label>\n      <input type="range" id="particleSize" min="0.5" max="8" step="0.5" value="\${exportConfig.particleSize}" class="slider">\n    </div>\n    <div class="control-group">\n      <label>光晕强度: <span id="glowIntensityValue">\${exportConfig.glowIntensity.toFixed(1)}</span></label>\n      <input type="range" id="glowIntensity" min="0.1" max="4" step="0.1" value="\${exportConfig.glowIntensity}" class="slider">\n    </div>\n    <div class="control-group">\n      <label>羽化程度: <span id="featherValue">\${exportConfig.feather.toFixed(2)}</span></label>\n      <input type="range" id="feather" min="0" max="1" step="0.05" value="\${exportConfig.feather}" class="slider">\n    </div>\n    <div class="control-group">\n      <label>粒子颜色</label>\n      <div class="color-row">\n        <input type="color" id="particleColor" value="\${exportConfig.tintColor || '#ffffff'}">\n        <label class="checkbox-label">\n          <input type="checkbox" id="useOriginalColor" \${exportConfig.useOriginalColor ? 'checked' : ''}>\n          <span>使用图片原色</span>\n        </label>\n      </div>\n    </div>\n    <div class="control-group">\n      <label>鼠标排斥力: <span id="mouseForceValue">\${exportConfig.mouseForce}</span></label>\n      <input type="range" id="mouseForce" min="0" max="300" step="10" value="\${exportConfig.mouseForce}" class="slider">\n    </div>\n    <div class="control-group">\n      <label>点击爆炸力度: <span id="explosionForceValue">\${exportConfig.explosionForce}</span></label>\n      <input type="range" id="explosionForce" min="50" max="600" step="25" value="\${exportConfig.explosionForce}" class="slider">\n    </div>\n    <div class="control-group">\n      <label>风力效果: <span id="windForceValue">\${exportConfig.windForce.toFixed(2)}</span></label>\n      <input type="range" id="windForce" min="0" max="0.2" step="0.01" value="\${exportConfig.windForce}" class="slider">\n    </div>\n    <div class="control-group">\n      <label>动画速度: <span id="animationSpeedValue">\${exportConfig.animationSpeed.toFixed(1)}</span></label>\n      <input type="range" id="animationSpeed" min="0.1" max="2" step="0.1" value="\${exportConfig.animationSpeed}" class="slider">\n    </div>\n  </div>\n  <div class="divider"></div>\n  <div class="buttons-section">\n    <button id="resetBtn" class="btn btn-primary">重置粒子</button>\n    <button id="reformBtn" class="btn btn-secondary">重组图像</button>\n    <button id="exportBtn" class="btn btn-tertiary">导出截图</button>\n  </div>\n  <div class="stats">\n    <p>FPS: <span id="fps">60</span></p>\n    <p>粒子数: <span id="particleStats">0</span></p>\n  </div>\n</div>\n<div class="mobile-hint">💡 建议在桌面设备上使用以获得最佳体验</div>\n\n<script type="importmap">\n{"imports":{"three":"https://unpkg.com/three@0.128.0/build/three.module.js"}}\n</script>\n<script type="module">\nimport * as THREE from 'three';\n\n// Helper: load image from dataURL\nasync function loadImageFromDataURL(dataURL) {\n  const img = new Image();\n  img.src = dataURL;\n  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });\n  const canvas = document.createElement('canvas');\n  canvas.width = img.width;\n  canvas.height = img.height;\n  const ctx = canvas.getContext('2d');\n  ctx.drawImage(img, 0, 0);\n  const imageData = ctx.getImageData(0, 0, img.width, img.height);\n  return { data: imageData.data, width: img.width, height: img.height, dataURL };\n}\n\n\${particlesCode}\n\${interactionCode}\n\nconst CONFIG = \${configJSON};\n\n// Scene\nconst scene = new THREE.Scene();\nscene.background = new THREE.Color(0x111111);\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);\nconst renderer = new THREE.WebGLRenderer({ antialias: true });\nrenderer.setSize(window.innerWidth, window.innerHeight);\nrenderer.setPixelRatio(window.devicePixelRatio);\ndocument.getElementById('canvas-container').appendChild(renderer.domElement);\ncamera.position.z = 500;\n\nlet particles = null;\nlet mouseInteraction = null;\nlet currentImageData = null;\n\nasync function createParticlesFromConfig() {\n  if (!currentImageData) currentImageData = await loadImageFromDataURL('\${embeddedImage}');\n  \n  if (particles && particles.mesh) {\n    scene.remove(particles.mesh);\n  }\n  \n  const tintColor = CONFIG.useOriginalColor ? null : CONFIG.tintColor;\n  \n  particles = new ImageParticles({\n    imageData: currentImageData,\n    particleCount: CONFIG.particleCount,\n    particleSize: CONFIG.particleSize,\n    style: CONFIG.style,\n    scene: scene,\n    tintColor: tintColor,\n    glowIntensity: CONFIG.glowIntensity,\n    feather: CONFIG.feather,\n  });\n  \n  document.getElementById('particleStats').textContent = particles.particleCount || 0;\n  \n  if (mouseInteraction) {\n    mouseInteraction.setParticles(particles);\n  } else {\n    mouseInteraction = new MouseInteraction(particles, {\n      mouseForce: CONFIG.mouseForce,\n      explosionForce: CONFIG.explosionForce,\n    });\n  }\n}\n\n// Controls\ndocument.querySelectorAll('input[name="style"]').forEach((radio) => {\n  radio.addEventListener('change', (e) => { CONFIG.style = e.target.value; createParticlesFromConfig(); });\n});\n\ndocument.getElementById('particleCount').addEventListener('input', (e) => {\n  CONFIG.particleCount = parseInt(e.target.value);\n  document.getElementById('particleCountValue').textContent = CONFIG.particleCount;\n  createParticlesFromConfig();\n});\n\ndocument.getElementById('particleSize').addEventListener('input', (e) => {\n  CONFIG.particleSize = parseFloat(e.target.value);\n  document.getElementById('particleSizeValue').textContent = CONFIG.particleSize.toFixed(1);\n  if (particles) particles.updateSize(CONFIG.particleSize);\n});\n\ndocument.getElementById('glowIntensity').addEventListener('input', (e) => {\n  CONFIG.glowIntensity = parseFloat(e.target.value);\n  document.getElementById('glowIntensityValue').textContent = CONFIG.glowIntensity.toFixed(1);\n  if (particles) particles.setGlowIntensity(CONFIG.glowIntensity);\n});\n\ndocument.getElementById('feather').addEventListener('input', (e) => {\n  CONFIG.feather = parseFloat(e.target.value);\n  document.getElementById('featherValue').textContent = CONFIG.feather.toFixed(2);\n  if (particles) particles.setFeather(CONFIG.feather);\n});\n\ndocument.getElementById('particleColor').addEventListener('input', (e) => {\n  CONFIG.tintColor = e.target.value;\n  if (!CONFIG.useOriginalColor && particles) particles.setTintColor(CONFIG.tintColor);\n});\n\ndocument.getElementById('useOriginalColor').addEventListener('change', (e) => {\n  CONFIG.useOriginalColor = e.target.checked;\n  document.getElementById('particleColor').disabled = CONFIG.useOriginalColor;\n  document.getElementById('particleColor').style.opacity = CONFIG.useOriginalColor ? '0.4' : '1';\n  createParticlesFromConfig();\n});\n\ndocument.getElementById('mouseForce').addEventListener('input', (e) => {\n  CONFIG.mouseForce = parseInt(e.target.value);\n  document.getElementById('mouseForceValue').textContent = CONFIG.mouseForce;\n  if (mouseInteraction) mouseInteraction.updateForce(CONFIG.mouseForce);\n});\n\ndocument.getElementById('explosionForce').addEventListener('input', (e) => {\n  CONFIG.explosionForce = parseInt(e.target.value);\n  document.getElementById('explosionForceValue').textContent = CONFIG.explosionForce;\n  if (mouseInteraction) mouseInteraction.setExplosionForce(CONFIG.explosionForce);\n});\n\ndocument.getElementById('windForce').addEventListener('input', (e) => {\n  CONFIG.windForce = parseFloat(e.target.value);\n  document.getElementById('windForceValue').textContent = CONFIG.windForce.toFixed(2);\n  if (particles) particles.setWindForce(CONFIG.windForce);\n});\n\ndocument.getElementById('animationSpeed').addEventListener('input', (e) => {\n  CONFIG.animationSpeed = parseFloat(e.target.value);\n  document.getElementById('animationSpeedValue').textContent = CONFIG.animationSpeed.toFixed(1);\n  if (particles) particles.setAnimationSpeed(CONFIG.animationSpeed);\n});\n\ndocument.getElementById('resetBtn').addEventListener('click', () => { if (particles) particles.reset(); });\ndocument.getElementById('reformBtn').addEventListener('click', () => { if (particles) particles.reform(); });\ndocument.getElementById('exportBtn').addEventListener('click', () => {\n  renderer.render(scene, camera);\n  const link = document.createElement('a');\n  link.href = renderer.domElement.toDataURL('image/png');\n  link.download = 'particle-effect.png';\n  link.click();\n});\n\n// Init\ncreateParticlesFromConfig();\n\n// Animation\nlet frameCount = 0;\nfunction animate() {\n  requestAnimationFrame(animate);\n  frameCount++;\n  if (particles) {\n    particles.update();\n    if (mouseInteraction) mouseInteraction.update();\n  }\n  renderer.render(scene, camera);\n}\nanimate();\n\nwindow.addEventListener('resize', () => {\n  camera.aspect = window.innerWidth / window.innerHeight;\n  camera.updateProjectionMatrix();\n  renderer.setSize(window.innerWidth, window.innerHeight);\n});\n</script>\n</body>\n</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `particle-effect-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
});

// ===== 导出组件功能 =====

document.getElementById('exportComponentBtn').addEventListener('click', async () => {
  if (!imageData) {
    alert('请先上传图片');
    return;
  }

  // 读取 ParticleEffectApp.js 并替换 three.js 导入为 CDN
  const response = await fetch('js/ParticleEffectApp.js');
  let componentCode = await response.text();
  
  // 替换本地 three.js 导入为 CDN 导入
  componentCode = componentCode.replace(
    "import * as THREE from './three.module.js';",
    "import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';"
  );

  const exportConfig = {
    particleCount: config.particleCount,
    particleSize: config.particleSize,
    style: config.style,
    mouseForce: config.mouseForce,
    windForce: config.windForce,
    animationSpeed: config.animationSpeed,
    glowIntensity: config.glowIntensity,
    feather: config.feather,
    tintColor: config.tintColor,
    useOriginalColor: config.useOriginalColor,
    explosionForce: config.explosionForce,
  };

  // 生成 particle-effect.js (ES Module 库)
  const libraryCode = componentCode;

  // 生成 embed-example.html (使用示例)
  const exampleHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>我的网站 - 粒子效果嵌入示例</title>
<style>
  /* 你的网站样式 */
  body { font-family: sans-serif; margin: 0; background: #1a1a2e; }
  .navbar { background: #16213e; padding: 1rem 2rem; color: white; }
  .content { padding: 2rem; color: #e0e0e0; }
  
  /* 粒子容器 - 可以放在任何地方 */
  #particle-container {
    width: 100%;
    height: 500px;
    position: relative;
    background: #0f0f0f;
    border-radius: 8px;
    overflow: hidden;
    margin: 2rem 0;
  }
</style>
<!-- Import Map: 必须先定义 Three.js -->
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.128.0/build/three.module.js"
  }
}
</script>
</head>
<body>
  <nav class="navbar">
    <h1>我的网站</h1>
  </nav>
  <div class="content">
    <h2>欢迎来到我的网站</h2>
    <p>下面是一个嵌入的粒子效果：</p>
    
    <!-- 粒子效果容器 -->
    <div id="particle-container"></div>
    
    <p>更多内容...</p>
  </div>

  <!-- 嵌入粒子效果 -->
  <script type="module">
    import { ParticleEffectApp } from './particle-effect.js';
    
    const app = new ParticleEffectApp({
      container: document.getElementById('particle-container'),
      imageSrc: '${imageData.dataURL}',
      options: ${JSON.stringify(exportConfig, null, 2)}
    });
    
    // 可选：5秒后改变配置
    // setTimeout(() => app.setOption('particleCount', 10000), 5000);
  </script>
</body>
</html>`;

  // 下载两个文件
  const libBlob = new Blob([libraryCode], { type: 'application/javascript' });
  const libUrl = URL.createObjectURL(libBlob);
  const libA = document.createElement('a');
  libA.href = libUrl;
  libA.download = 'particle-effect.js';
  libA.click();
  URL.revokeObjectURL(libUrl);

  const exampleBlob = new Blob([exampleHTML], { type: 'text/html' });
  const exampleUrl = URL.createObjectURL(exampleBlob);
  const exampleA = document.createElement('a');
  exampleA.href = exampleUrl;
  exampleA.download = 'embed-example.html';
  exampleA.click();
  URL.revokeObjectURL(exampleUrl);

  // 显示提示
  alert('已下载两个文件：\n1. particle-effect.js - 组件库\n2. embed-example.html - 使用示例\n\n在你的网站中引入 importmap 和 particle-effect.js 即可使用。');
});