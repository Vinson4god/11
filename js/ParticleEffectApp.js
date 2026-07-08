import * as THREE from 'three';

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
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onMouseEnter = this._onMouseEnter.bind(this);
    this._onClick = this._onClick.bind(this);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseleave', this._onMouseLeave);
    document.addEventListener('mouseenter', this._onMouseEnter);
    document.addEventListener('click', this._onClick);
  }

  _onMouseMove(e) {
    this.mouseWorldX = ((e.clientX / window.innerWidth) * 2 - 1) * 400;
    this.mouseWorldY = (-(e.clientY / window.innerHeight) * 2 + 1) * 300;
    this.isMouseOver = true;
  }
  _onMouseLeave() { this.isMouseOver = false; }
  _onMouseEnter() { this.isMouseOver = true; }

  _onClick(e) {
    const cx = ((e.clientX / window.innerWidth) * 2 - 1) * 400;
    const cy = (-(e.clientY / window.innerHeight) * 2 + 1) * 300;
    if (!this.particles) return;
    const positions = this.particles.mesh.geometry.attributes.position.array;
    const velocities = this.particles.velocities;
    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - cx;
      const dy = positions[i + 1] - cy;
      const dz = positions[i + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < this.explosionRadius && dist > 0.1) {
        const force = (1 - dist / this.explosionRadius) * this.explosionForce;
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

    if (this.isMouseOver) {
      for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - this.mouseWorldX;
        const dy = positions[i + 1] - this.mouseWorldY;
        const dz = positions[i + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < this.mouseForce && distance > 1) {
          const force = (1 - distance / this.mouseForce) * 0.8;
          velocities[i] += (dx / distance) * force;
          velocities[i + 1] += (dy / distance) * force;
          velocities[i + 2] += (dz / distance) * force * 0.3;
        }
      }
    }

    for (let i = 0; i < positions.length; i += 3) {
      velocities[i] += (originalPositions[i] - positions[i]) * this.reformSpeed;
      velocities[i + 1] += (originalPositions[i + 1] - positions[i + 1]) * this.reformSpeed;
      velocities[i + 2] += (originalPositions[i + 2] - positions[i + 2]) * this.reformSpeed;
      velocities[i] *= this.explosionDecay;
      velocities[i + 1] *= this.explosionDecay;
      velocities[i + 2] *= this.explosionDecay;
    }
  }

  destroy() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseleave', this._onMouseLeave);
    document.removeEventListener('mouseenter', this._onMouseEnter);
    document.removeEventListener('click', this._onClick);
  }

  setParticles(particles) { this.particles = particles; }
  updateForce(force) { this.mouseForce = force; }
  setExplosionForce(force) { this.explosionForce = force; }
}

// ============================================================
// ParticleEffectApp — 可嵌入组件 API
// ============================================================
export class ParticleEffectApp {
  /**
   * @param {Object} params
   * @param {HTMLElement} params.container — 挂载容器（必须有宽高）
   * @param {string} params.imageSrc — 图片 URL 或 dataURL
   * @param {Object} [params.options] — 可选配置
   */
  constructor({ container, imageSrc, options = {} }) {
    if (!container) throw new Error('ParticleEffectApp: container is required');
    if (!imageSrc) throw new Error('ParticleEffectApp: imageSrc is required');

    this.container = container;
    this.imageSrc = imageSrc;
    this.config = {
      particleCount: options.particleCount || 5000,
      particleSize: options.particleSize || 2,
      style: options.style || 'grid',
      mouseForce: options.mouseForce || 100,
      windForce: options.windForce || 0.05,
      animationSpeed: options.animationSpeed || 1,
      glowIntensity: options.glowIntensity || 1.0,
      feather: options.feather || 0.5,
      tintColor: options.tintColor || null,
      useOriginalColor: options.useOriginalColor !== false,
      explosionForce: options.explosionForce || 300,
    };

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.mouseInteraction = null;
    this._rafId = null;
    this._resizeHandler = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;

    // 1. 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    // 2. 相机
    this.camera = new THREE.PerspectiveCamera(75, this._getAspect(), 0.1, 1000);
    this.camera.position.z = 500;

    // 3. 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this._updateRendererSize();
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    // 4. 加载图片
    const imageData = await this._loadImage(this.imageSrc);

    // 5. 创建粒子
    this._createParticles(imageData);

    // 6. 响应式
    this._resizeHandler = () => this._onResize();
    window.addEventListener('resize', this._resizeHandler);

    // 7. 启动动画
    this._animate();

    this._initialized = true;
    return this;
  }

  _getAspect() {
    const rect = this.container.getBoundingClientRect();
    return rect.width / rect.height || 1;
  }

  _updateRendererSize() {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  _onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = this._getAspect();
    this.camera.updateProjectionMatrix();
    this._updateRendererSize();
  }

  async _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve({ data: imageData.data, width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  _createParticles(imageData) {
    const tintColor = this.config.useOriginalColor ? null : this.config.tintColor;
    this.particles = new ImageParticles({
      scene: this.scene,
      imageData,
      particleCount: this.config.particleCount,
      particleSize: this.config.particleSize,
      style: this.config.style,
      tintColor,
      glowIntensity: this.config.glowIntensity,
      feather: this.config.feather,
    });
    this.mouseInteraction = new MouseInteraction(this.particles, {
      mouseForce: this.config.mouseForce,
      explosionForce: this.config.explosionForce,
    });
  }

  _animate() {
    this._rafId = requestAnimationFrame(() => this._animate());
    if (this.particles) {
      this.particles.update();
      if (this.mouseInteraction) this.mouseInteraction.update();
    }
    this.renderer.render(this.scene, this.camera);
  }

  // ===== 公共 API =====

  /** 更新任意配置项 */
  setOption(key, value) {
    if (!(key in this.config)) return;
    this.config[key] = value;

    switch (key) {
      case 'particleCount':
      case 'style':
      case 'useOriginalColor':
      case 'tintColor':
        this._reloadParticles();
        break;
      case 'particleSize':
        if (this.particles) this.particles.updateSize(value);
        break;
      case 'glowIntensity':
        if (this.particles) this.particles.setGlowIntensity(value);
        break;
      case 'feather':
        if (this.particles) this.particles.setFeather(value);
        break;
      case 'mouseForce':
        if (this.mouseInteraction) this.mouseInteraction.updateForce(value);
        break;
      case 'explosionForce':
        if (this.mouseInteraction) this.mouseInteraction.setExplosionForce(value);
        break;
      case 'windForce':
        if (this.particles) this.particles.setWindForce(value);
        break;
      case 'animationSpeed':
        if (this.particles) this.particles.setAnimationSpeed(value);
        break;
    }
  }

  async _reloadParticles() {
    if (!this._initialized) return;
    const imageData = await this._loadImage(this.imageSrc);
    if (this.particles && this.particles.mesh) {
      this.scene.remove(this.particles.mesh);
    }
    if (this.mouseInteraction) this.mouseInteraction.destroy();
    this._createParticles(imageData);
  }

  /** 重置粒子到初始位置 */
  reset() { if (this.particles) this.particles.reset(); }

  /** 触发重组动画 */
  reform() { if (this.particles) this.particles.reform(); }

  /** 导出当前帧为 PNG dataURL */
  exportScreenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /** 彻底销毁，释放所有资源 */
  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    if (this.mouseInteraction) this.mouseInteraction.destroy();
    if (this.particles && this.particles.mesh) {
      this.particles.mesh.geometry.dispose();
      this.particles.mesh.material.dispose();
      this.scene.remove(this.particles.mesh);
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.mouseInteraction = null;
    this._initialized = false;
  }
}

export default ParticleEffectApp;
