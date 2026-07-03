/**
 * Advanced Portfolio Features
 * Implements futuristic animations, interactive elements, and visual enhancements
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the 3D background if browser supports WebGL
  initParticleBackground();
  
  // Initialize advanced animations for sections
  initSectionAnimations();
  
  // Initialize command palette interface
  initCommandPalette();
  
  // Initialize interactive skill visualization
  initSkillVisualization();
  
  // Initialize smooth theme transition effects
  initSmoothThemeTransition();
});

/**
 * Initialize the 3D particle background with Three.js
 */
function initParticleBackground() {
  // Check if browser supports WebGL and not on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.innerWidth < 768;
  
  // Reduce particle count on mobile or disable entirely on small screens
  if (isSmallScreen) {
    console.log('Skipping particle background on small screens for better performance');
    return;
  }
  
  try {
    // Create a container for the background
    const container = document.createElement('div');
    container.id = 'bg-canvas';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '-1';
    container.style.opacity = '0.7';
    document.body.prepend(container);
    
    // Load required scripts
    loadScript('js/lib/three.min.js', () => {
      loadScript('js/lib/particle-background.js', () => {
        // Initialize the particle background
        try {
          const options = {
            container: container,
            particleCount: isMobile ? 30 : (window.innerWidth < 1024 ? 50 : 100),
            particleColor: 0xd4af37, // Match accent color
            connectionDistance: isMobile ? 60 : (window.innerWidth < 1024 ? 80 : 120),
            mouseInteraction: !isMobile
          };
          
          window.particleBackground = new ParticleBackground(options);
          
          // Adjust the background on dark/light mode toggle
          const toggleBtn = document.getElementById('theme-toggle');
          if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
              setTimeout(() => {
                const isDark = document.body.classList.contains('dark-mode');
                if (window.particleBackground && window.particleBackground.setDarkMode) {
                  window.particleBackground.setDarkMode(isDark);
                }
              }, 100);
            });
          }
        } catch (err) {
          console.warn('Could not initialize particle background:', err);
        }
      });
    });
  } catch (err) {
    console.warn('WebGL not supported. Falling back to standard background.');
  }
}

/**
 * Initialize advanced animations for section transitions
 */
function initSectionAnimations() {
  loadScript('js/lib/gsap.min.js', () => {
    try {
      // Select all sections
      const sections = document.querySelectorAll('section');
      
      // Create animation timeline for each section
      sections.forEach(section => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            end: "top 20%",
            toggleActions: "play none none reverse"
          }
        });
        
        // Customize animation based on section id
        switch(section.id) {
          case 'hero':
            tl.from(section.querySelector('h1'), {
              y: 50, 
              opacity: 0, 
              duration: 0.8, 
              ease: "power3.out"
            })
            .from(section.querySelector('#typed-text'), {
              y: 30, 
              opacity: 0, 
              duration: 0.5, 
              ease: "power3.out"
            }, "-=0.4")
            .from(section.querySelectorAll('.hero-buttons a'), {
              y: 20, 
              opacity: 0, 
              stagger: 0.2, 
              duration: 0.5, 
              ease: "power3.out"
            }, "-=0.3")
            .from(section.querySelector('.social-links'), {
              y: 20, 
              opacity: 0, 
              duration: 0.5, 
              ease: "power3.out"
            }, "-=0.2");
            break;
          
          case 'about':
            tl.from(section.querySelector('.profile-pic'), {
              scale: 0.8, 
              opacity: 0, 
              duration: 0.6, 
              ease: "back.out(1.7)"
            })
            .from(section.querySelector('h1'), {
              y: 30, 
              opacity: 0, 
              duration: 0.5
            }, "-=0.3")
            .from(section.querySelectorAll('p'), {
              y: 20, 
              opacity: 0, 
              stagger: 0.2, 
              duration: 0.5
            }, "-=0.2");
            break;
          
          case 'skills':
            tl.from(section.querySelector('h1'), {
              y: 30, 
              opacity: 0, 
              duration: 0.5
            })
            .from(section.querySelectorAll('.skills-grid span'), {
              scale: 0.8, 
              opacity: 0, 
              stagger: 0.05, 
              duration: 0.5, 
              ease: "back.out(1.5)"
            }, "-=0.2");
            break;
          
          case 'projects':
            tl.from(section.querySelector('h1'), {
              y: 30, 
              opacity: 0, 
              duration: 0.5
            })
            .from(section.querySelector('p'), {
              y: 20, 
              opacity: 0, 
              duration: 0.5
            }, "-=0.3")
            .from(section.querySelectorAll('.project-card'), {
              y: 50, 
              opacity: 0, 
              stagger: 0.2, 
              duration: 0.6, 
              ease: "power3.out"
            }, "-=0.2");
            break;
          
          case 'certificates':
            tl.from(section.querySelector('h1'), {
              y: 30, 
              opacity: 0, 
              duration: 0.5
            })
            .from(section.querySelector('p'), {
              y: 20, 
              opacity: 0, 
              duration: 0.4
            }, "-=0.3")
            .from(section.querySelectorAll('.certificate-card'), {
              scale: 0.9, 
              opacity: 0, 
              stagger: 0.1, 
              duration: 0.5, 
              ease: "back.out(1.2)"
            }, "-=0.2");
            break;
          
          case 'contact':
            tl.from(section.querySelector('h1'), {
              y: 30, 
              opacity: 0, 
              duration: 0.5
            })
            .from(section.querySelector('p'), {
              y: 20, 
              opacity: 0, 
              duration: 0.4
            }, "-=0.3")
            .from(section.querySelector('form'), {
              y: 30, 
              opacity: 0, 
              duration: 0.6
            }, "-=0.2")
            .from(section.querySelector('.contact-info'), {
              y: 20, 
              opacity: 0, 
              duration: 0.5
            }, "-=0.3");
            break;
          
          default:
            tl.from(section, {
              y: 50, 
              opacity: 0, 
              duration: 0.8, 
              ease: "power3.out"
            });
        }
      });
      
    } catch(err) {
      console.warn('GSAP animations not available:', err);
      
      // Fallback to basic CSS animations
      document.querySelectorAll('section').forEach(section => {
        section.classList.add('appear');
      });
    }
  });
}

/**
 * Initialize command palette interface
 * Pressing Ctrl+K or Cmd+K will open a terminal-like interface
 */
function initCommandPalette() {
  // Skip on mobile devices - not practical for touch interfaces
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile || window.innerWidth < 768) {
    return;
  }
  
  // Create command palette container
  const palette = document.createElement('div');
  palette.id = 'command-palette';
  palette.classList.add('command-palette');
  palette.innerHTML = `
    <div class="command-palette-inner">
      <div class="command-header">
        <span>Command Palette</span>
        <button class="command-close">&times;</button>
      </div>
      <div class="command-input-container">
        <span class="prompt">></span>
        <input type="text" class="command-input" placeholder="Type a command (e.g. 'goto projects')">
      </div>
      <div class="command-results"></div>
      <div class="command-help">
        <p><strong>Available commands:</strong></p>
        <p><code>goto [section]</code> - Navigate to a section</p>
        <p><code>theme [light/dark]</code> - Switch theme</p>
        <p><code>contact</code> - Open contact form</p>
      </div>
    </div>
  `;
  
  // Style for command palette
  const style = document.createElement('style');
  style.textContent = `
    .command-palette {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 9999;
      display: none;
      justify-content: center;
      align-items: flex-start;
      padding-top: 10vh;
    }
    
    .command-palette-inner {
      width: 90%;
      max-width: 600px;
      background: var(--bg-color);
      color: var(--text-color);
      border: 2px solid var(--accent-color);
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    
    .command-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background: var(--accent-color);
      color: var(--bg-color);
      font-weight: 600;
    }
    
    .command-close {
      background: none;
      border: none;
      color: var(--bg-color);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0 5px;
    }
    
    .command-input-container {
      display: flex;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }
    
    .prompt {
      color: var(--accent-color);
      margin-right: 10px;
      font-weight: bold;
      font-family: monospace;
      font-size: 1.2rem;
    }
    
    .command-input {
      flex: 1;
      background: none;
      border: none;
      color: var(--text-color);
      font-size: 1rem;
      outline: none;
      padding: 5px;
    }
    
    .command-results {
      max-height: 300px;
      overflow-y: auto;
      padding: 0 15px;
    }
    
    .command-result {
      padding: 10px;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      cursor: pointer;
    }
    
    .command-result:hover {
      background: rgba(0,0,0,0.05);
    }
    
    .command-help {
      padding: 15px;
      border-top: 1px solid rgba(0,0,0,0.1);
      background: rgba(0,0,0,0.03);
      font-size: 0.9rem;
    }
    
    .command-help code {
      background: rgba(0,0,0,0.1);
      padding: 2px 5px;
      border-radius: 3px;
      font-family: monospace;
    }
    
    /* Animation */
    .command-palette.show {
      display: flex;
      animation: fadeIn 0.2s forwards;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(palette);
  
  // Command palette functionality
  const input = palette.querySelector('.command-input');
  const results = palette.querySelector('.command-results');
  const closeBtn = palette.querySelector('.command-close');
  
  // Available commands
  const commands = {
    'goto': {
      exec: (arg) => {
        const target = document.getElementById(arg);
        if (target) {
          window.scrollTo({
            top: target.offsetTop - 60,
            behavior: 'smooth'
          });
          return `Navigating to ${arg}...`;
        }
        return `Section "${arg}" not found`;
      },
      suggestions: ['hero', 'about', 'skills', 'projects', 'certificates', 'contact']
    },
    'theme': {
      exec: (arg) => {
        const toggleBtn = document.getElementById('theme-toggle');
        const isDark = document.body.classList.contains('dark-mode');
        
        if ((arg === 'dark' && !isDark) || (arg === 'light' && isDark)) {
          toggleBtn && toggleBtn.click();
          return `Theme switched to ${arg} mode`;
        }
        return `Already in ${isDark ? 'dark' : 'light'} mode`;
      },
      suggestions: ['light', 'dark']
    },
    'contact': {
      exec: () => {
        const contactSection = document.getElementById('contact');
        window.scrollTo({
          top: contactSection.offsetTop - 60,
          behavior: 'smooth'
        });
        
        setTimeout(() => {
          document.getElementById('name')?.focus();
        }, 1000);
        
        return 'Opening contact form...';
      }
    },
    'help': {
      exec: () => {
        return `
          <p><strong>Available commands:</strong></p>
          <p><code>goto [section]</code> - Navigate to a section</p>
          <p><code>theme [light/dark]</code> - Switch theme</p>
          <p><code>contact</code> - Open contact form</p>
        `;
      }
    }
  };
  
  // Show suggestions based on input
  function showSuggestions(cmd, arg) {
    results.innerHTML = '';
    
    if (!cmd) {
      // Show all available commands
      Object.keys(commands).forEach(command => {
        const div = document.createElement('div');
        div.classList.add('command-result');
        div.textContent = command;
        div.addEventListener('click', () => {
          input.value = command + ' ';
          input.focus();
        });
        results.appendChild(div);
      });
      return;
    }
    
    if (!commands[cmd]) {
      // Try to find matching commands
      const matches = Object.keys(commands).filter(command => 
        command.startsWith(cmd)
      );
      
      if (matches.length) {
        matches.forEach(match => {
          const div = document.createElement('div');
          div.classList.add('command-result');
          div.textContent = match;
          div.addEventListener('click', () => {
            input.value = match + ' ';
            input.focus();
          });
          results.appendChild(div);
        });
        return;
      }
      
      results.innerHTML = '<div class="command-result">Unknown command</div>';
      return;
    }
    
    // Show suggestions for arguments if available
    if (commands[cmd].suggestions && arg !== undefined) {
      const matches = commands[cmd].suggestions.filter(suggestion => 
        suggestion.startsWith(arg)
      );
      
      if (matches.length) {
        matches.forEach(match => {
          const div = document.createElement('div');
          div.classList.add('command-result');
          div.textContent = `${cmd} ${match}`;
          div.addEventListener('click', () => {
            executeCommand(`${cmd} ${match}`);
          });
          results.appendChild(div);
        });
        return;
      }
    }
    
    // Execute command if no suggestions needed
    if (arg === undefined) {
      executeCommand(cmd);
    }
  }
  
  // Execute command
  function executeCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');
    
    if (commands[cmd]) {
      const result = commands[cmd].exec(arg);
      results.innerHTML = `<div class="command-result">${result}</div>`;
      setTimeout(() => {
        hideCommandPalette();
      }, 1000);
    } else {
      results.innerHTML = '<div class="command-result">Unknown command</div>';
    }
  }
  
  // Handle input changes
  input.addEventListener('input', () => {
    const parts = input.value.trim().split(' ');
    const cmd = parts[0];
    const arg = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
    
    showSuggestions(cmd, arg);
  });
  
  // Handle enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeCommand(input.value.trim());
    }
    
    if (e.key === 'Escape') {
      hideCommandPalette();
    }
  });
  
  // Show command palette
  function showCommandPalette() {
    palette.classList.add('show');
    input.value = '';
    input.focus();
    showSuggestions('', '');
  }
  
  // Hide command palette
  function hideCommandPalette() {
    palette.classList.remove('show');
  }
  
  // Toggle with keyboard shortcut (Ctrl+K or Cmd+K)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      showCommandPalette();
    }
  });
  
  // Close button
  closeBtn.addEventListener('click', hideCommandPalette);
  
  // Close when clicking outside
  palette.addEventListener('click', (e) => {
    if (e.target === palette) {
      hideCommandPalette();
    }
  });
}

/**
 * Initialize interactive skill visualization
 * Transforms the static skill list into an animated, interactive visualization
 */
function initSkillVisualization() {
  // Skip on mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile || window.innerWidth < 768) {
    return;
  }
  
  const skillsSection = document.getElementById('skills');
  const skillsGrid = skillsSection.querySelector('.skills-grid');
  
  if (!skillsGrid) return;
  
  // Get all skills
  const skills = Array.from(skillsGrid.querySelectorAll('span')).map(span => ({
    name: span.textContent,
    el: span
  }));
  
  // Create a container for the visualization
  const visualContainer = document.createElement('div');
  visualContainer.className = 'skills-visual-container';
  
  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'btn skill-viz-toggle';
  toggleBtn.textContent = 'Interactive View';
  toggleBtn.setAttribute('aria-label', 'Toggle skill visualization');
  
  // Add toggle button before skills grid
  skillsSection.insertBefore(toggleBtn, skillsGrid.nextSibling);
  
  // Style the visualization
  const style = document.createElement('style');
  style.textContent = `
    .skills-visual-container {
      height: 0;
      overflow: hidden;
      transition: height 0.5s ease-out;
      margin: 20px auto;
      position: relative;
      max-width: 700px;
    }
    
    .skills-visual-container.active {
      height: 400px;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 10px;
    }
    
    .skill-node {
      position: absolute;
      padding: 10px 15px;
      background: var(--accent-color);
      color: var(--bg-color);
      border-radius: 20px;
      font-weight: 500;
      transform: translate(-50%, -50%);
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      z-index: 1;
    }
    
    .skill-node:hover {
      transform: translate(-50%, -50%) scale(1.1);
    }
    
    .skill-connection {
      position: absolute;
      background: var(--accent-color);
      opacity: 0.2;
      z-index: 0;
      transform-origin: 0 0;
    }
    
    .skill-viz-toggle {
      margin-top: 20px;
    }
  `;
  
  document.head.appendChild(style);
  skillsSection.insertBefore(visualContainer, skillsGrid.nextSibling);
  
  // Toggle visualization
  let isActive = false;
  toggleBtn.addEventListener('click', () => {
    isActive = !isActive;
    
    if (isActive) {
      visualContainer.classList.add('active');
      toggleBtn.textContent = 'Grid View';
      skillsGrid.style.display = 'none';
      renderVisualization();
    } else {
      visualContainer.classList.remove('active');
      toggleBtn.textContent = 'Interactive View';
      skillsGrid.style.display = '';
      visualContainer.innerHTML = '';
    }
  });
  
  // Render interactive visualization
  function renderVisualization() {
    visualContainer.innerHTML = '';
    
    // Create nodes
    const nodes = [];
    
    // Position nodes in a graph-like structure
    const containerWidth = visualContainer.offsetWidth;
    const containerHeight = 400; // Same as the active height
    
    skills.forEach((skill, i) => {
      // Create node
      const node = document.createElement('div');
      node.className = 'skill-node';
      node.textContent = skill.name;
      
      // Position node (slightly randomized for organic feel)
      const angle = (i / skills.length) * Math.PI * 2;
      const radius = Math.min(containerWidth, containerHeight) * 0.35;
      const offsetX = containerWidth / 2 + Math.cos(angle) * radius;
      const offsetY = containerHeight / 2 + Math.sin(angle) * radius;
      
      node.style.left = `${offsetX}px`;
      node.style.top = `${offsetY}px`;
      
      // Add node to container
      visualContainer.appendChild(node);
      
      // Store node data
      nodes.push({
        el: node,
        x: offsetX,
        y: offsetY,
        vx: 0,
        vy: 0
      });
      
      // Make nodes draggable
      let isDragging = false;
      let startX, startY, nodeStartX, nodeStartY;
      
      node.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        nodeStartX = parseFloat(node.style.left);
        nodeStartY = parseFloat(node.style.top);
        node.style.zIndex = 10;
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newX = nodeStartX + dx;
        const newY = nodeStartY + dy;
        
        // Keep node within container
        node.style.left = `${Math.max(50, Math.min(containerWidth - 50, newX))}px`;
        node.style.top = `${Math.max(50, Math.min(containerHeight - 50, newY))}px`;
        
        // Update node data
        const nodeIndex = nodes.findIndex(n => n.el === node);
        if (nodeIndex !== -1) {
          nodes[nodeIndex].x = parseFloat(node.style.left);
          nodes[nodeIndex].y = parseFloat(node.style.top);
        }
        
        // Redraw connections
        drawConnections(nodes);
      });
      
      document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        node.style.zIndex = 1;
      });
    });
    
    // Draw connections between nodes
    drawConnections(nodes);
    
    // Simulate slight movement
    setInterval(() => {
      if (!isActive) return;
      
      nodes.forEach(node => {
        // Apply small random movement
        node.vx = (Math.random() - 0.5) * 0.5;
        node.vy = (Math.random() - 0.5) * 0.5;
        
        // Update position
        node.x += node.vx;
        node.y += node.vy;
        
        // Keep node within container
        node.x = Math.max(50, Math.min(containerWidth - 50, node.x));
        node.y = Math.max(50, Math.min(containerHeight - 50, node.y));
        
        // Update node element
        node.el.style.left = `${node.x}px`;
        node.el.style.top = `${node.y}px`;
      });
      
      // Redraw connections
      drawConnections(nodes);
    }, 3000);
  }
  
  // Draw connections between nodes
  function drawConnections(nodes) {
    // Remove existing connections
    const existingConnections = visualContainer.querySelectorAll('.skill-connection');
    existingConnections.forEach(connection => connection.remove());
    
    // Draw new connections
    nodes.forEach((node, i) => {
      // Connect to a few nearby nodes
      const numConnections = Math.min(3, nodes.length - 1);
      
      // Sort other nodes by distance
      const otherNodes = nodes
        .filter((_, idx) => idx !== i)
        .sort((a, b) => {
          const distA = Math.sqrt(Math.pow(node.x - a.x, 2) + Math.pow(node.y - a.y, 2));
          const distB = Math.sqrt(Math.pow(node.x - b.x, 2) + Math.pow(node.y - b.y, 2));
          return distA - distB;
        });
      
      // Connect to closest nodes
      for (let j = 0; j < numConnections; j++) {
        const targetNode = otherNodes[j];
        
        // Calculate distance and angle
        const dx = targetNode.x - node.x;
        const dy = targetNode.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Create connection element
        const connection = document.createElement('div');
        connection.className = 'skill-connection';
        connection.style.width = `${distance}px`;
        connection.style.height = '2px';
        connection.style.left = `${node.x}px`;
        connection.style.top = `${node.y}px`;
        connection.style.transform = `rotate(${angle}rad)`;
        
        visualContainer.appendChild(connection);
      }
    });
  }
}

/**
 * Initialize smooth theme transition effects
 */
function initSmoothThemeTransition() {
  // Add transition styles
  const style = document.createElement('style');
  style.textContent = `
    body {
      transition: background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                  color 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .theme-transition-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.1);
      pointer-events: none;
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.8s;
    }
    
    .theme-transition-overlay.active {
      opacity: 1;
    }
    
    /* Enhanced button effect */
    .theme-btn {
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .theme-btn:hover {
      transform: scale(1.1) rotate(10deg);
    }
    
    .theme-btn:active {
      transform: scale(0.95);
    }
  `;
  
  document.head.appendChild(style);
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'theme-transition-overlay';
  document.body.appendChild(overlay);
  
  // Enhance the theme toggle button
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      overlay.classList.add('active');
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 800);
    });
  }
}

/**
 * Helper function to load scripts
 */
function loadScript(url, callback) {
  const script = document.createElement('script');
  script.src = url;
  script.onload = callback;
  script.onerror = () => {
    console.warn(`Failed to load script: ${url}`);
    callback();
  };
  document.head.appendChild(script);
}