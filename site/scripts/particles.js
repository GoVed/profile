// site/scripts/particles.js

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
    }

    /**
     * Spawn a burst of particles at (x, y)
     */
    spawnBurst(x, y, count = 12, colors = ['#ff6600', '#ffd700', '#00e5ff', '#ffffff'], speedMultiplier = 1) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 4 + 1.5) * speedMultiplier;
            const size = Math.random() * 4 + 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const maxLife = Math.floor(Math.random() * 20 + 25);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5, // subtle upward drift
                size,
                color,
                life: maxLife,
                maxLife,
                shape: Math.random() > 0.5 ? 'star' : 'circle',
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.2
            });
        }
    }

    /**
     * Spawn floating score / combo text at (x, y)
     */
    spawnText(text, x, y, options = {}) {
        const {
            color = '#ff6600',
            size = 20,
            bold = true,
            vy = -1.8,
            maxLife = 45
        } = options;

        this.floatingTexts.push({
            text,
            x,
            y,
            vy,
            color,
            size,
            bold,
            life: maxLife,
            maxLife
        });
    }

    update(timeStepFactor = 1) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * timeStepFactor;
            p.y += p.vy * timeStepFactor;
            p.vy += 0.08 * timeStepFactor; // gentle particle gravity
            p.rotation += p.vRot * timeStepFactor;
            p.life -= timeStepFactor;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * timeStepFactor;
            ft.life -= timeStepFactor;

            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // Draw particles
        for (const p of this.particles) {
            const progress = p.life / p.maxLife;
            const alpha = Math.max(0, Math.min(1, progress));
            const currentSize = p.size * Math.sqrt(progress);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;

            if (p.shape === 'star') {
                // Draw 4-pointed sparkle
                ctx.beginPath();
                ctx.moveTo(0, -currentSize * 1.5);
                ctx.lineTo(currentSize * 0.4, -currentSize * 0.4);
                ctx.lineTo(currentSize * 1.5, 0);
                ctx.lineTo(currentSize * 0.4, currentSize * 0.4);
                ctx.lineTo(0, currentSize * 1.5);
                ctx.lineTo(-currentSize * 0.4, currentSize * 0.4);
                ctx.lineTo(-currentSize * 1.5, 0);
                ctx.lineTo(-currentSize * 0.4, -currentSize * 0.4);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, currentSize, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Draw floating texts
        for (const ft of this.floatingTexts) {
            const progress = ft.life / ft.maxLife;
            const alpha = Math.max(0, Math.min(1, progress));
            const scale = 1 + (1 - progress) * 0.3;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `${ft.bold ? 'bold ' : ''}${Math.round(ft.size * scale)}px system-ui, -apple-system, sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Glow / outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);

            ctx.restore();
        }
    }
}
