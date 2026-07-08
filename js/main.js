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
  spotlightRadius: 120,
  spotlightIntensity: 0.8,
  visualScale: 1.0,
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
    spotlightRadius: config.spotlightRadius,
    spotlightIntensity: config.spotlightIntensity,
    visualScale: config.visualScale,
  });

  // 更新统计显示
  document.getElementById('particleStats').textContent = particles.actualParticleCount || 0;

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

// 光标照亮范围
document.getElementById('spotlightRadius').addEventListener('input', (e) => {
  config.spotlightRadius = parseInt(e.target.value);
  document.getElementById('spotlightRadiusValue').textContent = config.spotlightRadius;
  if (particles) particles.setSpotlightRadius(config.spotlightRadius);
});

// 光标照亮强度
document.getElementById('spotlightIntensity').addEventListener('input', (e) => {
  config.spotlightIntensity = parseFloat(e.target.value);
  document.getElementById('spotlightIntensityValue').textContent = config.spotlightIntensity.toFixed(1);
  if (particles) particles.setSpotlightIntensity(config.spotlightIntensity);
});

// 视觉大小
document.getElementById('visualScale').addEventListener('input', (e) => {
  config.visualScale = parseFloat(e.target.value);
  document.getElementById('visualScaleValue').textContent = config.visualScale.toFixed(1);
  if (particles) particles.setVisualScale(config.visualScale);
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

// Debug helper
window.__debugParticles = () => ({ scene, camera, renderer, particles, mouseInteraction });

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
    spotlightRadius: config.spotlightRadius,
    spotlightIntensity: config.spotlightIntensity,
    visualScale: config.visualScale,
  };

  const cssText = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0f0f0f;
  height: 100vh;
  overflow: hidden;
  color: #e0e0e0;
}

/* Canvas Container */
#canvas-container {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: crosshair;
}

/* Control Panel */
.control-panel {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 320px;
  max-height: 90vh;
  background: rgba(20, 20, 25, 0.92);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(16px);
  overflow-y: auto;
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* Upload Section */
.upload-section {
  margin-bottom: 20px;
}

.drop-zone {
  border: 2px dashed rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 30px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.03);
}

.drop-zone:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
}

.drop-zone.drag-over {
  border-color: #00d4aa;
  background: rgba(0, 212, 170, 0.08);
  box-shadow: 0 4px 20px rgba(0, 212, 170, 0.15);
}

.drop-zone svg {
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  transition: color 0.3s ease;
}

.drop-zone:hover svg {
  color: rgba(255, 255, 255, 0.8);
}

.drop-zone p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.image-preview {
  position: relative;
  margin-top: 15px;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
}

.image-preview img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}

.btn-small {
  width: 100%;
  margin-top: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-small:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

/* Divider */
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  margin: 20px 0;
}

/* Controls Section */
.controls-section h3 {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.control-group {
  margin-bottom: 16px;
}

.control-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.control-group label span {
  float: right;
  color: #00d4aa;
  font-weight: 600;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.5);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  flex: 1;
}

.radio-label input {
  cursor: pointer;
}

/* Color Row */
.color-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-row input[type="color"] {
  width: 48px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  padding: 2px;
}

.color-row input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-row input[type="color"]::-webkit-color-swatch {
  border-radius: 4px;
  border: none;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 0;
  text-transform: none;
}

.checkbox-label input {
  cursor: pointer;
}

/* Buttons Section */
.buttons-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn {
  padding: 11px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #00d4aa 0%, #00a884 100%);
  color: #000;
  box-shadow: 0 4px 16px rgba(0, 212, 170, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 212, 170, 0.35);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #e0e0e0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.btn-export {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
}

.btn-export:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.35);
}

.btn-tertiary {
  background: rgba(255, 200, 50, 0.1);
  color: #ffc832;
  border: 1px solid rgba(255, 200, 50, 0.25);
}

.btn-tertiary:hover {
  background: rgba(255, 200, 50, 0.18);
  transform: translateY(-2px);
}

/* Stats */
.stats {
  margin-top: 20px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.8;
}

.stats p {
  margin: 0;
}

.stats span {
  font-weight: 600;
  color: #00d4aa;
}

/* Mobile Hint */
.mobile-hint {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 200, 50, 0.9);
  color: #000;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 13px;
  backdrop-filter: blur(10px);
  display: none;
  z-index: 50;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .control-panel {
    width: 280px;
    right: 10px;
    top: 10px;
    padding: 15px;
  }

  .mobile-hint {
    display: block;
  }
}

@media (max-width: 768px) {
  .control-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    top: auto;
    width: 100%;
    max-height: 50vh;
    border-radius: 12px 12px 0 0;
    left: 0;
  }

  .mobile-hint {
    display: block;
    bottom: auto;
    top: 10px;
  }

  .drop-zone {
    padding: 20px 10px;
  }

  .image-preview img {
    height: 100px;
  }
}

/* Loading Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.control-panel {
  animation: fadeIn 0.3s ease;
}
`;
  const particlesCode = `import * as THREE from 'three';

export default class ImageParticles {
  constructor(options) {
    this.scene = options.scene;
    this.imageData = options.imageData;
    this.particleCount = options.particleCount;
    this.particleSize = options.particleSize;
    this.style = options.style;
    this.tintColor = options.tintColor || null;
    this.glowIntensity = options.glowIntensity || 1.0;
    this.feather = options.feather || 0.5;
    this.animationSpeed = 1;
    this.windForce = 0.05;
    this.time = 0;

    this.init();
  }

  createGlowTexture(feather) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );

    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    const midStop = 0.3 + (1 - feather) * 0.4;
    gradient.addColorStop(midStop, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  init() {
    const { width, height, data } = this.imageData;
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    const step = Math.ceil(Math.sqrt((width * height) / this.particleCount));
    let particleIndex = 0;

    let tintR = 1, tintG = 1, tintB = 1;
    if (this.tintColor) {
      const c = new THREE.Color(this.tintColor);
      tintR = c.r; tintG = c.g; tintB = c.b;
    }

    if (this.style === 'grid') {
      for (let y = 0; y < height && particleIndex < this.particleCount; y += step) {
        for (let x = 0; x < width && particleIndex < this.particleCount; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;
          const a = data[idx + 3] / 255;

          const brightness = (r + g + b) / 3;
          if (a > 0.5 && brightness > 0.12) {
            const px = (x / width - 0.5) * 400;
            const py = -(y / height - 0.5) * 300;
            const pz = (Math.random() - 0.5) * 10;

            positions[particleIndex * 3] = px;
            positions[particleIndex * 3 + 1] = py;
            positions[particleIndex * 3 + 2] = pz;

            if (this.tintColor) {
              colors[particleIndex * 3] = tintR;
              colors[particleIndex * 3 + 1] = tintG;
              colors[particleIndex * 3 + 2] = tintB;
            } else {
              colors[particleIndex * 3] = r;
              colors[particleIndex * 3 + 1] = g;
              colors[particleIndex * 3 + 2] = b;
            }

            velocities[particleIndex * 3] = (Math.random() - 0.5) * 0.5;
            velocities[particleIndex * 3 + 1] = (Math.random() - 0.5) * 0.5;
            velocities[particleIndex * 3 + 2] = (Math.random() - 0.5) * 0.5;

            sizes[particleIndex] = this.particleSize;
            particleIndex++;
          }
        }
      }
    } else {
      for (let i = 0; i < this.particleCount; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const idx = (y * width + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;

        positions[i * 3] = (Math.random() - 0.5) * 400;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

        if (this.tintColor) {
          colors[i * 3] = tintR;
          colors[i * 3 + 1] = tintG;
          colors[i * 3 + 2] = tintB;
        } else {
          colors[i * 3] = r;
          colors[i * 3 + 1] = g;
          colors[i * 3 + 2] = b;
        }

        velocities[i * 3] = (Math.random() - 0.5) * 2;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;

        sizes[i] = this.particleSize;
      }
    }

    this.positions = positions;
    this.originalPositions = new Float32Array(positions);
    this.colors = colors;
    this.velocities = velocities;
    this.sizes = sizes;
    this.targetPositions = new Float32Array(positions);
    this.actualParticleCount = particleIndex;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setDrawRange(0, this.actualParticleCount);

    const glowTexture = this.createGlowTexture(this.feather);

    const material = new THREE.PointsMaterial({
      size: this.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: this.glowIntensity,
      sizeAttenuation: true,
      map: glowTexture,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(geometry, material);
    this.scene.add(this.mesh);
  }

  update() {
    this.time += 0.016 * this.animationSpeed;

    const positions = this.mesh.geometry.attributes.position.array;
    const count = this.actualParticleCount * 3;

    for (let i = 0; i < count; i += 3) {
      const vx = this.velocities[i];
      const vy = this.velocities[i + 1];
      const vz = this.velocities[i + 2];

      this.velocities[i] += Math.sin(this.time * 0.5 + i) * this.windForce * 0.01;
      this.velocities[i + 1] -= 0.02 * this.animationSpeed;

      positions[i] += this.velocities[i] * 0.5 * this.animationSpeed;
      positions[i + 1] += this.velocities[i + 1] * 0.5 * this.animationSpeed;
      positions[i + 2] += this.velocities[i + 2] * 0.5 * this.animationSpeed;

      if (Math.abs(positions[i]) > 250) {
        this.velocities[i] *= -0.8;
        positions[i] = Math.sign(positions[i]) * 250;
      }
      if (positions[i + 1] < -200) {
        positions[i + 1] = -200;
        this.velocities[i + 1] *= -0.6;
      }
      if (positions[i + 1] > 200) {
        this.velocities[i + 1] *= -0.6;
        positions[i + 1] = 200;
      }
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  updateSize(size) {
    this.particleSize = size;
    if (this.mesh) {
      this.mesh.material.size = size;
    }
  }

  setWindForce(force) {
    this.windForce = force;
  }

  setAnimationSpeed(speed) {
    this.animationSpeed = speed;
  }

  setTintColor(colorHex) {
    this.tintColor = colorHex;
    if (!this.mesh) return;

    const colors = this.mesh.geometry.attributes.color.array;
    const c = new THREE.Color(colorHex);
    const count = this.actualParticleCount * 3;

    for (let i = 0; i < count; i += 3) {
      colors[i] = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }

    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  clearTintColor() {
    this.tintColor = null;
    if (!this.mesh) return;

    const colors = this.mesh.geometry.attributes.color.array;
    for (let i = 0; i < colors.length; i++) {
      colors[i] = 1.0;
    }
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  setGlowIntensity(intensity) {
    this.glowIntensity = intensity;
    if (this.mesh) {
      this.mesh.material.opacity = intensity;
    }
  }

  setFeather(feather) {
    this.feather = feather;
    if (this.mesh) {
      const newTexture = this.createGlowTexture(feather);
      this.mesh.material.map = newTexture;
      this.mesh.material.needsUpdate = true;
    }
  }

  reset() {
    const positions = this.mesh.geometry.attributes.position.array;
    positions.set(this.originalPositions);
    this.velocities.fill(0);
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  reform() {
    const positions = this.mesh.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      this.velocities[i] = (this.originalPositions[i] - positions[i]) * 0.02;
      this.velocities[i + 1] = (this.originalPositions[i + 1] - positions[i + 1]) * 0.02;
      this.velocities[i + 2] = (this.originalPositions[i + 2] - positions[i + 2]) * 0.02;
    }
  }
}
`;
  const interactionCode = `export default class MouseInteraction {
  constructor(particles, config) {
    this.particles = particles;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseWorldX = 0;
    this.mouseWorldY = 0;
    this.mouseForce = config.mouseForce || 100;
    this.isMouseOver = false;

    // 点击爆炸参数
    this.explosionForce = config.explosionForce || 300;   // 爆炸力度
    this.explosionRadius = config.explosionRadius || 150; // 爆炸影响半径
    this.explosionDecay = config.explosionDecay || 0.92;  // 爆炸后速度衰减
    this.reformSpeed = config.reformSpeed || 0.03;        // 回归原位的速度

    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.mouseWorldX = this.mouseX * 400;
      this.mouseWorldY = this.mouseY * 300;
      this.isMouseOver = true;
    });

    document.addEventListener('mouseleave', () => {
      this.isMouseOver = false;
    });

    document.addEventListener('mouseenter', () => {
      this.isMouseOver = true;
    });

    // 点击爆炸效果
    document.addEventListener('click', (e) => {
      const clickX = (e.clientX / window.innerWidth) * 2 - 1;
      const clickY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.triggerExplosion(clickX * 400, clickY * 300);
    });
  }

  // 触发爆炸：以点击位置为中心，粒子向四周散开
  triggerExplosion(cx, cy) {
    if (!this.particles) return;

    const positions = this.particles.mesh.geometry.attributes.position.array;
    const velocities = this.particles.velocities;
    const originalPositions = this.particles.originalPositions;

    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - cx;
      const dy = positions[i + 1] - cy;
      const dz = positions[i + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < this.explosionRadius && dist > 0.1) {
        // 越近爆炸越强
        const force = (1 - dist / this.explosionRadius) * this.explosionForce;
        // 向外推开（从爆炸中心远离）
        velocities[i] += (dx / dist) * force * 0.1;
        velocities[i + 1] += (dy / dist) * force * 0.1;
        velocities[i + 2] += (dz / (dist + 0.1)) * force * 0.05;
      }
    }
  }

  update() {
    if (!this.particles) return;

    const positions = this.particles.mesh.geometry.attributes.position.array;
    const velocities = this.particles.velocities;
    const originalPositions = this.particles.originalPositions;

    // === 1. 鼠标排斥力（光标附近的粒子被推开）===
    if (this.isMouseOver) {
      const mouseWorldZ = 0;

      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - this.mouseWorldX;
        const dy = positions[i + 1] - this.mouseWorldY;
        const dz = positions[i + 2] - mouseWorldZ;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const maxDistance = this.mouseForce;

        if (distance < maxDistance && distance > 1) {
          // 推开粒子（排斥力）
          const force = (1 - distance / maxDistance) * 0.8;
          velocities[i] += (dx / distance) * force;
          velocities[i + 1] += (dy / distance) * force;
          velocities[i + 2] += (dz / distance) * force * 0.3;
        }
      }
    }

    // === 2. 自动回归原位（弹性效果）===
    for (let i = 0; i < positions.length; i += 3) {
      const ox = originalPositions[i];
      const oy = originalPositions[i + 1];
      const oz = originalPositions[i + 2];

      // 向原始位置施加回拉力
      velocities[i] += (ox - positions[i]) * this.reformSpeed;
      velocities[i + 1] += (oy - positions[i + 1]) * this.reformSpeed;
      velocities[i + 2] += (oz - positions[i + 2]) * this.reformSpeed;

      // 速度阻尼（让运动逐渐稳定）
      velocities[i] *= this.explosionDecay;
      velocities[i + 1] *= this.explosionDecay;
      velocities[i + 2] *= this.explosionDecay;
    }
  }

  setParticles(particles) {
    this.particles = particles;
  }

  updateForce(force) {
    this.mouseForce = force;
  }

  // 更新爆炸参数
  setExplosionForce(force) {
    this.explosionForce = force;
  }

  setExplosionRadius(radius) {
    this.explosionRadius = radius;
  }

  setExplosionDecay(decay) {
    this.explosionDecay = decay;
  }

  setReformSpeed(speed) {
    this.reformSpeed = speed;
  }
}
`;
  const embeddedImage = imageData.dataURL;
  const configJSON = JSON.stringify(exportConfig);

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>粒子效果 - Particle Effect</title>
<style>${cssText}</style>
</head>
<body>
<div id="canvas-container"></div>
<div class="control-panel">
  <div class="upload-section">
    <div class="image-preview" style="display:block;">
      <img src="${embeddedImage}" alt="preview" style="width:100%;height:150px;object-fit:cover;display:block;">
    </div>
  </div>
  <div class="divider"></div>
  <div class="controls-section">
    <h3>粒子参数</h3>
    <div class="control-group">
      <label>粒子风格</label>
      <div class="radio-group">
        <label class="radio-label"><input type="radio" name="style" value="grid" checked><span>点阵风格</span></label>
        <label class="radio-label"><input type="radio" name="style" value="fluid"><span>流体风格</span></label>
      </div>
    </div>
    <div class="control-group">
      <label>粒子数量: <span id="particleCountValue">${exportConfig.particleCount}</span></label>
      <input type="range" id="particleCount" min="1000" max="40000" step="1000" value="${exportConfig.particleCount}" class="slider">
    </div>
    <div class="control-group">
      <label>粒子大小: <span id="particleSizeValue">${exportConfig.particleSize.toFixed(1)}</span></label>
      <input type="range" id="particleSize" min="0.5" max="8" step="0.5" value="${exportConfig.particleSize}" class="slider">
    </div>
    <div class="control-group">
      <label>光晕强度: <span id="glowIntensityValue">${exportConfig.glowIntensity.toFixed(1)}</span></label>
      <input type="range" id="glowIntensity" min="0.1" max="4" step="0.1" value="${exportConfig.glowIntensity}" class="slider">
    </div>
    <div class="control-group">
      <label>羽化程度: <span id="featherValue">${exportConfig.feather.toFixed(2)}</span></label>
      <input type="range" id="feather" min="0" max="1" step="0.05" value="${exportConfig.feather}" class="slider">
    </div>
    <div class="control-group">
      <label>粒子颜色</label>
      <div class="color-row">
        <input type="color" id="particleColor" value="${exportConfig.tintColor || '#ffffff'}">
        <label class="checkbox-label">
          <input type="checkbox" id="useOriginalColor" ${exportConfig.useOriginalColor ? 'checked' : ''}>
          <span>使用图片原色</span>
        </label>
      </div>
    </div>
    <div class="control-group">
      <label>鼠标排斥力: <span id="mouseForceValue">${exportConfig.mouseForce}</span></label>
      <input type="range" id="mouseForce" min="0" max="300" step="10" value="${exportConfig.mouseForce}" class="slider">
    </div>
    <div class="control-group">
      <label>点击爆炸力度: <span id="explosionForceValue">${exportConfig.explosionForce}</span></label>
      <input type="range" id="explosionForce" min="50" max="600" step="25" value="${exportConfig.explosionForce}" class="slider">
    </div>
    <div class="control-group">
      <label>风力效果: <span id="windForceValue">${exportConfig.windForce.toFixed(2)}</span></label>
      <input type="range" id="windForce" min="0" max="0.2" step="0.01" value="${exportConfig.windForce}" class="slider">
    </div>
    <div class="control-group">
      <label>动画速度: <span id="animationSpeedValue">${exportConfig.animationSpeed.toFixed(1)}</span></label>
      <input type="range" id="animationSpeed" min="0.1" max="2" step="0.1" value="${exportConfig.animationSpeed}" class="slider">
    </div>
    <div class="control-group">
      <label>光标照亮范围: <span id="spotlightRadiusValue">${exportConfig.spotlightRadius}</span></label>
      <input type="range" id="spotlightRadius" min="0" max="300" step="10" value="${exportConfig.spotlightRadius}" class="slider">
    </div>
    <div class="control-group">
      <label>光标照亮强度: <span id="spotlightIntensityValue">${exportConfig.spotlightIntensity.toFixed(1)}</span></label>
      <input type="range" id="spotlightIntensity" min="0" max="3" step="0.1" value="${exportConfig.spotlightIntensity}" class="slider">
    </div>
    <div class="control-group">
      <label>视觉大小: <span id="visualScaleValue">${exportConfig.visualScale.toFixed(1)}</span></label>
      <input type="range" id="visualScale" min="0.2" max="2.0" step="0.1" value="${exportConfig.visualScale}" class="slider">
    </div>
  </div>
  <div class="divider"></div>
  <div class="buttons-section">
    <button id="resetBtn" class="btn btn-primary">重置粒子</button>
    <button id="reformBtn" class="btn btn-secondary">重组图像</button>
    <button id="exportBtn" class="btn btn-tertiary">导出截图</button>
  </div>
  <div class="stats">
    <p>FPS: <span id="fps">60</span></p>
    <p>粒子数: <span id="particleStats">0</span></p>
  </div>
</div>
<div class="mobile-hint">💡 建议在桌面设备上使用以获得最佳体验</div>

<script type="importmap">
{"imports":{"three":"https://unpkg.com/three@0.128.0/build/three.module.js"}}
</script>
<script type="module">
import * as THREE from 'three';

// Helper: load image from dataURL
async function loadImageFromDataURL(dataURL) {
  const img = new Image();
  img.src = dataURL;
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  return { data: imageData.data, width: img.width, height: img.height, dataURL };
}

${particlesCode}
${interactionCode}

const CONFIG = ${configJSON};

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);
camera.position.z = 500;

let particles = null;
let mouseInteraction = null;
let currentImageData = null;

async function createParticlesFromConfig() {
  if (!currentImageData) currentImageData = await loadImageFromDataURL('${embeddedImage}');
  
  if (particles && particles.mesh) {
    scene.remove(particles.mesh);
  }
  
  const tintColor = CONFIG.useOriginalColor ? null : CONFIG.tintColor;
  
  particles = new ImageParticles({
    imageData: currentImageData,
    particleCount: CONFIG.particleCount,
    particleSize: CONFIG.particleSize,
    style: CONFIG.style,
    scene: scene,
    tintColor: tintColor,
    glowIntensity: CONFIG.glowIntensity,
    feather: CONFIG.feather,
  });
  
  document.getElementById('particleStats').textContent = particles.particleCount || 0;
  
  if (mouseInteraction) {
    mouseInteraction.setParticles(particles);
  } else {
    mouseInteraction = new MouseInteraction(particles, {
      mouseForce: CONFIG.mouseForce,
      explosionForce: CONFIG.explosionForce,
    });
  }
}

// Controls
document.querySelectorAll('input[name="style"]').forEach((radio) => {
  radio.addEventListener('change', (e) => { CONFIG.style = e.target.value; createParticlesFromConfig(); });
});

document.getElementById('particleCount').addEventListener('input', (e) => {
  CONFIG.particleCount = parseInt(e.target.value);
  document.getElementById('particleCountValue').textContent = CONFIG.particleCount;
  createParticlesFromConfig();
});

document.getElementById('particleSize').addEventListener('input', (e) => {
  CONFIG.particleSize = parseFloat(e.target.value);
  document.getElementById('particleSizeValue').textContent = CONFIG.particleSize.toFixed(1);
  if (particles) particles.updateSize(CONFIG.particleSize);
});

document.getElementById('glowIntensity').addEventListener('input', (e) => {
  CONFIG.glowIntensity = parseFloat(e.target.value);
  document.getElementById('glowIntensityValue').textContent = CONFIG.glowIntensity.toFixed(1);
  if (particles) particles.setGlowIntensity(CONFIG.glowIntensity);
});

document.getElementById('feather').addEventListener('input', (e) => {
  CONFIG.feather = parseFloat(e.target.value);
  document.getElementById('featherValue').textContent = CONFIG.feather.toFixed(2);
  if (particles) particles.setFeather(CONFIG.feather);
});

document.getElementById('particleColor').addEventListener('input', (e) => {
  CONFIG.tintColor = e.target.value;
  if (!CONFIG.useOriginalColor && particles) particles.setTintColor(CONFIG.tintColor);
});

document.getElementById('useOriginalColor').addEventListener('change', (e) => {
  CONFIG.useOriginalColor = e.target.checked;
  document.getElementById('particleColor').disabled = CONFIG.useOriginalColor;
  document.getElementById('particleColor').style.opacity = CONFIG.useOriginalColor ? '0.4' : '1';
  createParticlesFromConfig();
});

document.getElementById('mouseForce').addEventListener('input', (e) => {
  CONFIG.mouseForce = parseInt(e.target.value);
  document.getElementById('mouseForceValue').textContent = CONFIG.mouseForce;
  if (mouseInteraction) mouseInteraction.updateForce(CONFIG.mouseForce);
});

document.getElementById('explosionForce').addEventListener('input', (e) => {
  CONFIG.explosionForce = parseInt(e.target.value);
  document.getElementById('explosionForceValue').textContent = CONFIG.explosionForce;
  if (mouseInteraction) mouseInteraction.setExplosionForce(CONFIG.explosionForce);
});

document.getElementById('windForce').addEventListener('input', (e) => {
  CONFIG.windForce = parseFloat(e.target.value);
  document.getElementById('windForceValue').textContent = CONFIG.windForce.toFixed(2);
  if (particles) particles.setWindForce(CONFIG.windForce);
});

document.getElementById('animationSpeed').addEventListener('input', (e) => {
  CONFIG.animationSpeed = parseFloat(e.target.value);
  document.getElementById('animationSpeedValue').textContent = CONFIG.animationSpeed.toFixed(1);
  if (particles) particles.setAnimationSpeed(CONFIG.animationSpeed);
});

document.getElementById('resetBtn').addEventListener('click', () => { if (particles) particles.reset(); });
document.getElementById('reformBtn').addEventListener('click', () => { if (particles) particles.reform(); });
document.getElementById('exportBtn').addEventListener('click', () => {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.href = renderer.domElement.toDataURL('image/png');
  link.download = 'particle-effect.png';
  link.click();
});

// Init
createParticlesFromConfig();

// Animation
let frameCount = 0;
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

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `particle-effect-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
});


// ===== 导出为组件功能 =====

document.getElementById('exportComponentBtn').addEventListener('click', async () => {
  if (!imageData) {
    alert('请先上传图片');
    return;
  }

  const libraryCode = `import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';

// ============================================================
// ImageParticles — 内部粒子系统
// ============================================================
class ImageParticles {
  constructor(options) {
    this.scene = options.scene;
    this.imageData = options.imageData;
    this.particleCount = options.particleCount;
    this.particleSize = options.particleSize;
    this.style = options.style;
    this.tintColor = options.tintColor || null;
    this.glowIntensity = options.glowIntensity || 1.0;
    this.feather = options.feather || 0.5;
    this.animationSpeed = 1;
    this.windForce = 0.05;
    this.time = 0;
    this.init();
  }

  createGlowTexture(feather) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    const midStop = 0.3 + (1 - feather) * 0.4;
    gradient.addColorStop(midStop, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  init() {
    const { width, height, data } = this.imageData;
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const step = Math.ceil(Math.sqrt((width * height) / this.particleCount));
    let particleIndex = 0;
    let tintR = 1, tintG = 1, tintB = 1;
    if (this.tintColor) {
      const c = new THREE.Color(this.tintColor);
      tintR = c.r; tintG = c.g; tintB = c.b;
    }

    if (this.style === 'grid') {
      for (let y = 0; y < height && particleIndex < this.particleCount; y += step) {
        for (let x = 0; x < width && particleIndex < this.particleCount; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255, a = data[idx + 3] / 255;
          const brightness = (r + g + b) / 3;
          if (a > 0.5 && brightness > 0.12) {
            positions[particleIndex * 3] = (x / width - 0.5) * 400;
            positions[particleIndex * 3 + 1] = -(y / height - 0.5) * 300;
            positions[particleIndex * 3 + 2] = (Math.random() - 0.5) * 10;
            if (this.tintColor) {
              colors[particleIndex * 3] = tintR;
              colors[particleIndex * 3 + 1] = tintG;
              colors[particleIndex * 3 + 2] = tintB;
            } else {
              colors[particleIndex * 3] = r;
              colors[particleIndex * 3 + 1] = g;
              colors[particleIndex * 3 + 2] = b;
            }
            velocities[particleIndex * 3] = (Math.random() - 0.5) * 0.5;
            velocities[particleIndex * 3 + 1] = (Math.random() - 0.5) * 0.5;
            velocities[particleIndex * 3 + 2] = (Math.random() - 0.5) * 0.5;
            sizes[particleIndex] = this.particleSize;
            particleIndex++;
          }
        }
      }
    } else {
      for (let i = 0; i < this.particleCount; i++) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const idx = (y * width + x) * 4;
        const r = data[idx] / 255, g = data[idx + 1] / 255, b = data[idx + 2] / 255;
        positions[i * 3] = (Math.random() - 0.5) * 400;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        if (this.tintColor) {
          colors[i * 3] = tintR; colors[i * 3 + 1] = tintG; colors[i * 3 + 2] = tintB;
        } else {
          colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
        }
        velocities[i * 3] = (Math.random() - 0.5) * 2;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
        sizes[i] = this.particleSize;
      }
    }

    this.positions = positions;
    this.originalPositions = new Float32Array(positions);
    this.colors = colors;
    this.velocities = velocities;
    this.sizes = sizes;
    this.actualParticleCount = particleIndex;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setDrawRange(0, this.actualParticleCount);

    const material = new THREE.PointsMaterial({
      size: this.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: this.glowIntensity,
      sizeAttenuation: true,
      map: this.createGlowTexture(this.feather),
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(geometry, material);
    this.scene.add(this.mesh);
  }

  update() {
    this.time += 0.016 * this.animationSpeed;
    const positions = this.mesh.geometry.attributes.position.array;
    const count = this.actualParticleCount * 3;
    for (let i = 0; i < count; i += 3) {
      this.velocities[i] += Math.sin(this.time * 0.5 + i) * this.windForce * 0.01;
      this.velocities[i + 1] -= 0.02 * this.animationSpeed;
      positions[i] += this.velocities[i] * 0.5 * this.animationSpeed;
      positions[i + 1] += this.velocities[i + 1] * 0.5 * this.animationSpeed;
      positions[i + 2] += this.velocities[i + 2] * 0.5 * this.animationSpeed;
      if (Math.abs(positions[i]) > 250) { this.velocities[i] *= -0.8; positions[i] = Math.sign(positions[i]) * 250; }
      if (positions[i + 1] < -200) { positions[i + 1] = -200; this.velocities[i + 1] *= -0.6; }
      if (positions[i + 1] > 200) { this.velocities[i + 1] *= -0.6; positions[i + 1] = 200; }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  updateSize(size) { this.particleSize = size; if (this.mesh) this.mesh.material.size = size; }
  setWindForce(force) { this.windForce = force; }
  setAnimationSpeed(speed) { this.animationSpeed = speed; }

  setTintColor(colorHex) {
    this.tintColor = colorHex;
    if (!this.mesh) return;
    const colors = this.mesh.geometry.attributes.color.array;
    const c = new THREE.Color(colorHex);
    const count = this.actualParticleCount * 3;
    for (let i = 0; i < count; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  setGlowIntensity(intensity) { this.glowIntensity = intensity; if (this.mesh) this.mesh.material.opacity = intensity; }

  setFeather(feather) {
    this.feather = feather;
    if (this.mesh) { this.mesh.material.map = this.createGlowTexture(feather); this.mesh.material.needsUpdate = true; }
  }

  reset() { this.mesh.geometry.attributes.position.array.set(this.originalPositions); this.velocities.fill(0); this.mesh.geometry.attributes.position.needsUpdate = true; }
  reform() { const positions = this.mesh.geometry.attributes.position.array; for (let i = 0; i < positions.length; i += 3) { this.velocities[i] = (this.originalPositions[i] - positions[i]) * 0.02; this.velocities[i + 1] = (this.originalPositions[i + 1] - positions[i + 1]) * 0.02; this.velocities[i + 2] = (this.originalPositions[i + 2] - positions[i + 2]) * 0.02; } }
}

// ============================================================
// MouseInteraction — 内部鼠标交互
// ============================================================
class MouseInteraction {
  constructor(particles, config) {
    this.particles = particles;
    this.mouseWorldX = 0;
    this.mouseWorldY = 0;
    this.mouseForce = config.mouseForce || 100;
    this.isMouseOver = false;
    this.explosionForce = config.explosionForce || 300;
    this.explosionRadius = config.explosionRadius || 150;
    this.explosionDecay = config.explosionDecay || 0.92;
    this.reformSpeed = config.reformSpeed || 0.03;
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onM