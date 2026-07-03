/**
 * Interactive 3D Particle Background
 * Uses Three.js for rendering and animation
 */

class ParticleBackground {
  constructor(options = {}) {
    this.container = options.container || document.body;
    this.particleCount = options.particleCount || 100;
    this.particleColor = options.particleColor || 0xd4af37; // Match accent color
    this.backgroundColor = options.backgroundColor || 0x000000;
    this.connectionDistance = options.connectionDistance || 100;
    this.mouseInteraction = options.mouseInteraction !== false;
    
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.mouse = { x: 0, y: 0 };
    
    this.init();
  }
  
  init() {
    // Create scene, camera, renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 2000);
    this.camera.position.z = 400;
    
    this.renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.backgroundColor, 0); // Transparent background
    this.container.appendChild(this.renderer.domElement);
    
    // Add the canvas element and style it
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '-1';
    this.renderer.domElement.style.pointerEvents = 'none';
    
    // Create particles
    this.particles = [];
    this.particleSystem = new THREE.Group();
    this.scene.add(this.particleSystem);
    
    this.createParticles();
    this.addEventListeners();
    this.animate();
  }
  
  createParticles() {
    const particleGeometry = new THREE.SphereGeometry(1, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: this.particleColor,
      transparent: true,
      opacity: 0.8
    });
    
    for (let i = 0; i < this.particleCount; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Random position within view
      particle.position.x = Math.random() * this.width - this.width / 2;
      particle.position.y = Math.random() * this.height - this.height / 2;
      particle.position.z = Math.random() * 500 - 250;
      
      // Set random movement speed
      particle.velocity = {
        x: (Math.random() - 0.5) * 0.5,
        y: (Math.random() - 0.5) * 0.5,
        z: (Math.random() - 0.5) * 0.2
      };
      
      this.particleSystem.add(particle);
      this.particles.push(particle);
    }
    
    // Create line material for connections
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: this.particleColor,
      transparent: true,
      opacity: 0.2
    });
    
    this.connections = [];
  }
  
  updateParticles() {
    // Update particle positions
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Update position based on velocity
      particle.position.x += particle.velocity.x;
      particle.position.y += particle.velocity.y;
      particle.position.z += particle.velocity.z;
      
      // Wrap around edges
      const halfWidth = this.width / 2;
      const halfHeight = this.height / 2;
      
      if (particle.position.x < -halfWidth) particle.position.x = halfWidth;
      if (particle.position.x > halfWidth) particle.position.x = -halfWidth;
      if (particle.position.y < -halfHeight) particle.position.y = halfHeight;
      if (particle.position.y > halfHeight) particle.position.y = -halfHeight;
      if (particle.position.z < -250) particle.position.z = 250;
      if (particle.position.z > 250) particle.position.z = -250;
      
      // Mouse interaction
      if (this.mouseInteraction) {
        const mouseX = this.mouse.x - this.width / 2;
        const mouseY = -(this.mouse.y - this.height / 2);
        const dx = mouseX - particle.position.x;
        const dy = mouseY - particle.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 120) {
          particle.velocity.x += dx * 0.0001;
          particle.velocity.y += dy * 0.0001;
        }
      }
    }
    
    // Remove old connections
    for (let i = this.connections.length - 1; i >= 0; i--) {
      this.particleSystem.remove(this.connections[i]);
    }
    this.connections = [];
    
    // Create new connections between close particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];
        
        const dx = p1.position.x - p2.position.x;
        const dy = p1.position.y - p2.position.y;
        const dz = p1.position.z - p2.position.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < this.connectionDistance) {
          const opacity = (1 - dist / this.connectionDistance) * 0.2;
          
          const geometry = new THREE.BufferGeometry().setFromPoints([
            p1.position,
            p2.position
          ]);
          
          const material = this.lineMaterial.clone();
          material.opacity = opacity;
          
          const line = new THREE.Line(geometry, material);
          this.particleSystem.add(line);
          this.connections.push(line);
        }
      }
    }
  }
  
  animate() {
    this.updateParticles();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
  
  addEventListeners() {
    window.addEventListener('resize', this.onResize.bind(this));
    
    if (this.mouseInteraction) {
      window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }
  }
  
  onResize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
  
  onMouseMove(event) {
    this.mouse.x = event.clientX;
    this.mouse.y = event.clientY;
  }
  
  setDarkMode(isDark) {
    // Change particle color for dark mode
    const newColor = isDark ? 0xd4af37 : 0xd4af37;
    
    this.particles.forEach(particle => {
      particle.material.color.set(newColor);
    });
    
    this.lineMaterial.color.set(newColor);
  }
}

// Export for use
if (typeof module !== 'undefined') {
  module.exports = ParticleBackground;
}