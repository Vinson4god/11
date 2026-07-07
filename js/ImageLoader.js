import * as THREE from 'three';

export default class ImageLoader {
  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new Image();

      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 512;
          let width = img.width;
          let height = img.height;

          // 缩放到合适大小
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const imageData = ctx.getImageData(0, 0, width, height);
          resolve({
            data: imageData.data,
            width,
            height,
            dataURL: canvas.toDataURL(),
          });
        };
        img.onerror = () => reject(new Error('图片加载失败'));
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  // 提取图片的关键像素（颜色>阈值）
  extractParticles(imageData, particleCount) {
    const { data, width, height } = imageData;
    const particles = [];
    const step = Math.ceil(Math.sqrt((width * height) / particleCount));

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // 亮度阈值
        const brightness = (r + g + b) / 3;
        if (brightness > 30 && a > 128) {
          const px = (x / width - 0.5) * 400;
          const py = -(y / height - 0.5) * 300;
          particles.push({
            x: px,
            y: py,
            color: new THREE.Color(r / 255, g / 255, b / 255),
          });
        }
      }
    }

    return particles.slice(0, particleCount);
  }
}
