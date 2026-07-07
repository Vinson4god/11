export default class MouseInteraction {
  constructor(particles, config) {
    this.particles = particles;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseForce = config.mouseForce || 100;
    this.isMouseOver = false;

    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.isMouseOver = true;
    });

    document.addEventListener('mouseleave', () => {
      this.isMouseOver = false;
    });

    document.addEventListener('mouseenter', () => {
      this.isMouseOver = true;
    });
  }

  update() {
    if (!this.isMouseOver || !this.particles) return;

    const positions = this.particles.mesh.geometry.attributes.position.array;
    const velocities = this.particles.velocities;

    // 鼠标在3D空间中的位置（转换坐标）
    const mouseWorldX = this.mouseX * 400;
    const mouseWorldY = this.mouseY * 300;
    const mouseWorldZ = 0;

    // 应用鼠标作用力到每个粒子
    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - mouseWorldX;
      const dy = positions[i + 1] - mouseWorldY;
      const dz = positions[i + 2] - mouseWorldZ;

      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const maxDistance = this.mouseForce;

      if (distance < maxDistance && distance > 1) {
        // 推开粒子
        const force = (1 - distance / maxDistance) * 0.5;
        velocities[i] += (dx / distance) * force;
        velocities[i + 1] += (dy / distance) * force;
        velocities[i + 2] += (dz / distance) * force;
      }
    }
  }

  setParticles(particles) {
    this.particles = particles;
  }

  updateForce(force) {
    this.mouseForce = force;
  }
}
