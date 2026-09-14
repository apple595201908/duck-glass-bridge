export class GlassShatterEffect {
  /**
   * 在指定瓷磚位置產生碎玻璃破片落下
   */
  static spawnShards(container: HTMLElement, targetRect: DOMRect, boardRect: DOMRect): void {
    const shardCount = 12;
    const centerX = targetRect.left - boardRect.left + targetRect.width / 2;
    const centerY = targetRect.top - boardRect.top + targetRect.height / 2;

    const shardsWrapper = document.createElement('div');
    shardsWrapper.className = 'shards-particle-layer';
    shardsWrapper.style.position = 'absolute';
    shardsWrapper.style.left = '0';
    shardsWrapper.style.top = '0';
    shardsWrapper.style.width = '100%';
    shardsWrapper.style.height = '100%';
    shardsWrapper.style.pointerEvents = 'none';
    shardsWrapper.style.zIndex = '15';

    container.appendChild(shardsWrapper);

    const shards: {
      el: HTMLElement;
      x: number;
      y: number;
      vx: number;
      vy: number;
      rot: number;
      vRot: number;
      scale: number;
    }[] = [];

    // 預製 4 種不同銳角玻璃碎片形狀
    const clipPaths = [
      'polygon(0% 0%, 100% 20%, 60% 100%, 10% 80%)',
      'polygon(20% 0%, 90% 0%, 100% 70%, 10% 100%)',
      'polygon(50% 0%, 100% 100%, 0% 80%)',
      'polygon(10% 0%, 100% 30%, 80% 90%, 0% 60%)',
    ];

    for (let i = 0; i < shardCount; i++) {
      const shard = document.createElement('div');
      shard.className = 'glass-shard';

      const angle = (Math.PI * 2 * i) / shardCount + (Math.random() * 0.4 - 0.2);
      const speed = Math.random() * 3.5 + 1.8;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 2.5; // 初期稍微向上炸開再墜落

      const size = Math.random() * 16 + 14;
      shard.style.width = `${size}px`;
      shard.style.height = `${size}px`;
      shard.style.clipPath = clipPaths[i % clipPaths.length];

      shardsWrapper.appendChild(shard);

      shards.push({
        el: shard,
        x: centerX + (Math.random() - 0.5) * (targetRect.width * 0.6),
        y: centerY + (Math.random() - 0.5) * (targetRect.height * 0.6),
        vx,
        vy,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 14,
        scale: 1,
      });
    }

    // 60FPS 輕量物理模擬
    const startTime = performance.now();
    const duration = 850;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      shards.forEach((s) => {
        s.vy += 0.35; // 重力加速度
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vRot;
        const opacity = Math.max(0, 1 - progress * 1.15);

        s.el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${s.rot}deg) scale(${s.scale})`;
        s.el.style.opacity = `${opacity}`;
      });

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        if (shardsWrapper.parentElement) {
          shardsWrapper.parentElement.removeChild(shardsWrapper);
        }
      }
    };

    requestAnimationFrame(tick);
  }

  /**
   * 輕微鏡頭震動 (Camera Shake)
   */
  static triggerCameraShake(element: HTMLElement): void {
    element.classList.remove('camera-shake-active');
    // 強制重繪
    void element.offsetWidth;
    element.classList.add('camera-shake-active');
    setTimeout(() => {
      element.classList.remove('camera-shake-active');
    }, 180);
  }
}
