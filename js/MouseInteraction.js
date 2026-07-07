export default class MouseInteraction {
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