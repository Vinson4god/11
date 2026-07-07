import * as THREE from 'three';

export default class ImageParticles {
  constructor(options) {
    this.scene = options.scene;
    this.imageData = options.imageData;
    this.particleCount = options.particleCount;
    this.particleSize = options.particleSize;
    this.style = options.style;
    this.animationSpeed = 1;
    this.windForce = 0.05;
    this.time = 0;

    this.init();
  }

  init() {
    const { width, height, data } = this.imageData;
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    // 提取粒子位置
    const step = Math.ceil(Math.sqrt((width * height) / this.particleCount));
    let particleIndex = 0;

    if (this.style === 'grid') {
      // 点阵风格：规则网格
      for (let y = 0; y < height && particleIndex < this.particleCount; y += step) {
        for (let x = 0; x < width && particleIndex < this.particleCount; x += step) {
          const idx = (y * width + x) * 4;
          const r = data[idx] / 255;
          const g = data[idx + 1] / 255;
          const b = data[idx + 2] / 255;
          const a = data[idx + 3] / 255;

          if (a > 0.5) {
            const px = (x / width - 0.5) * 400;
            const py = -(y / height - 0.5) * 300;
            const pz = (Math.random() - 0.5) * 10;

            positions[particleIndex * 3] = px;
            positions[particleIndex * 3 + 1] = py;
            positions[particleIndex * 3 + 2] = pz;

            colors[particleIndex * 3] = r;
            colors[particleIndex * 3 + 1] = g;
            colors[particleIndex * 3 + 2] = b;

            velocities[particleIndex * 3] = (Math.random() - 0.5) * 0.5;
            velocities[particleIndex * 3 + 1] = (Math.random() - 0.5) * 0.5;
            velocities[particleIndex * 3 + 2] = (Math.random() - 0.5) * 0.5;

            sizes[particleIndex] = this.particleSize;
            particleIndex++;
          }
        }
      }
    } else {
      // 流体风格：随机分布
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

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;

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

    // 创建几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 创建材质
    const material = new THREE.PointsMaterial({
      size: this.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    this.mesh = new THREE.Points(geometry, material);
    this.scene.add(this.mesh);
  }

  update() {
    this.time += 0.016 * this.animationSpeed;

    const positions = this.mesh.geometry.attributes.position.array;

    // 更新粒子位置
    for (let i = 0; i < positions.length; i += 3) {
      // 速度更新
      const vx = this.velocities[i];
      const vy = this.velocities[i + 1];
      const vz = this.velocities[i + 2];

      // 应用风力
      this.velocities[i] += Math.sin(this.time * 0.5 + i) * this.windForce * 0.01;
      this.velocities[i + 1] -= 0.02 * this.animationSpeed; // 重力

      // 更新位置
      positions[i] += this.velocities[i] * 0.5 * this.animationSpeed;
      positions[i + 1] += this.velocities[i + 1] * 0.5 * this.animationSpeed;
      positions[i + 2] += this.velocities[i + 2] * 0.5 * this.animationSpeed;

      // 边界反弹
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

  reset() {
    const positions = this.mesh.geometry.attributes.position.array;
    positions.set(this.originalPositions);
    this.velocities.fill(0);
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }

  reform() {
    // 粒子逐渐重组成原始图像
    const positions = this.mesh.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      this.velocities[i] = (this.originalPositions[i] - positions[i]) * 0.02;
      this.velocities[i + 1] = (this.originalPositions[i + 1] - positions[i + 1]) * 0.02;
      this.velocities[i + 2] = (this.originalPositions[i + 2] - positions[i + 2]) * 0.02;
    }
  }
}
