import * as THREE from 'three';

// ─── 自定义着色器 ───

const vertexShader = `
  attribute float aSize;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vBrightness;

  uniform vec2 uSpotlightCenter;
  uniform float uSpotlightRadius;
  uniform float uSpotlightIntensity;
  uniform float uVisualScale;

  void main() {
    vColor = color;
    vec3 scaledPosition = position * uVisualScale;
    vec4 mvPosition = modelViewMatrix * vec4(scaledPosition, 1.0);
    gl_PointSize = aSize * (1000.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    float dist = distance(scaledPosition.xy, uSpotlightCenter);
    float brightness = 1.0;
    if (dist < uSpotlightRadius) {
      float t = 1.0 - smoothstep(0.0, uSpotlightRadius, dist);
      brightness = 1.0 + uSpotlightIntensity * t * t;
    }
    vBrightness = brightness;
  }
`;

const fragmentShader = `
  uniform sampler2D uPointTexture;
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vBrightness;

  void main() {
    vec4 texColor = texture2D(uPointTexture, gl_PointCoord);
    if (texColor.a < 0.01) discard;

    vec3 finalColor = vColor * vBrightness;
    finalColor = mix(finalColor, vec3(1.0), clamp((vBrightness - 1.0) * 0.3, 0.0, 0.5));

    gl_FragColor = vec4(finalColor, texColor.a * uOpacity);
  }
`;

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
    this.spotlightRadius = options.spotlightRadius || 120;
    this.spotlightIntensity = options.spotlightIntensity || 0.8;
    this.visualScale = options.visualScale || 1.0;

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
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setDrawRange(0, this.actualParticleCount);

    const glowTexture = this.createGlowTexture(this.feather);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uPointTexture: { value: glowTexture },
        uOpacity: { value: this.glowIntensity },
        uSpotlightCenter: { value: new THREE.Vector2(99999, 99999) },
        uSpotlightRadius: { value: this.spotlightRadius },
        uSpotlightIntensity: { value: this.spotlightIntensity },
        uVisualScale: { value: this.visualScale },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
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
    const sizes = this.mesh.geometry.attributes.aSize.array;
    for (let i = 0; i < sizes.length; i++) {
      sizes[i] = size;
    }
    this.mesh.geometry.attributes.aSize.needsUpdate = true;
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
      this.mesh.material.uniforms.uOpacity.value = intensity;
    }
  }

  setFeather(feather) {
    this.feather = feather;
    if (this.mesh) {
      const newTexture = this.createGlowTexture(feather);
      this.mesh.material.uniforms.uPointTexture.value = newTexture;
    }
  }

  setSpotlightCenter(x, y) {
    if (this.mesh) {
      this.mesh.material.uniforms.uSpotlightCenter.value.set(x, y);
    }
  }

  setSpotlightRadius(radius) {
    this.spotlightRadius = radius;
    if (this.mesh) {
      this.mesh.material.uniforms.uSpotlightRadius.value = radius;
    }
  }

  setSpotlightIntensity(intensity) {
    this.spotlightIntensity = intensity;
    if (this.mesh) {
      this.mesh.material.uniforms.uSpotlightIntensity.value = intensity;
    }
  }

  setVisualScale(scale) {
    this.visualScale = scale;
    if (this.mesh) {
      this.mesh.material.uniforms.uVisualScale.value = scale;
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
