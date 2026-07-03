// Add 'js' class for progressive enhancement
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if (isMobile) {
  document.documentElement.classList.add('is-mobile');
}

// Add touch support detection
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.documentElement.classList.add('touch-device');
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const toggleBtn = document.getElementById('theme-toggle');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  const toggleTheme = () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    if (toggleBtn) {
      toggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  };
  // Theme toggle (guard in case the button isn't present)
  if (toggleBtn) {
    if (localStorage.getItem('theme') === 'dark') {
      body.classList.add('dark-mode');
      toggleBtn.textContent = '☀️';
    } else {
      toggleBtn.textContent = '🌙';
    }

    toggleBtn.addEventListener('click', toggleTheme);
  } else {
    // Respect stored theme even without a toggle button
    if (localStorage.getItem('theme') === 'dark') {
      body.classList.add('dark-mode');
    }
  }

  // Hamburger menu toggle (guard for missing elements)
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
  }

  // Smooth scroll & scrollspy
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);
      if(targetSection){
        window.scrollTo({top:targetSection.offsetTop-60, behavior:'smooth'});
        // Close mobile menu
        if (hamburger && navMenu) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        }
      }
    });
  });

  // Scrollspy - highlight active section
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if(window.scrollY >= (sectionTop - 100)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if(link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Fade in on scroll
  const faders = document.querySelectorAll('section');
  const appearOptions = { threshold:0.1, rootMargin:"0px 0px -50px 0px" };
  const appearOnScroll = new IntersectionObserver((entries, observer)=>{
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('appear');
        observer.unobserve(entry.target);
      }
    });
  }, appearOptions);
  faders.forEach(fader => appearOnScroll.observe(fader));

  // Back to top
  const backToTopBtn = document.createElement('button');
  backToTopBtn.textContent = '⬆️';
  backToTopBtn.className = 'back-to-top';
  document.body.appendChild(backToTopBtn);
  backToTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll',()=>backToTopBtn.style.display=window.scrollY>300?'block':'none');

  // Typing animation (only if target element exists)
  const typedTextSpan = document.getElementById('typed-text');
  if (typedTextSpan) {
    const textArray = ["Python Developer", "Data Engineer", "AI/ML Enthusiast"];
    const typingDelay = 100, erasingDelay = 50, newTextDelay = 2000;
    let textArrayIndex = 0, charIndex = 0;

    function type() {
      if (charIndex < textArray[textArrayIndex].length) {
        typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
        charIndex++;
        setTimeout(type, typingDelay);
      } else setTimeout(erase, newTextDelay);
    }

    function erase() {
      if (charIndex > 0) {
        typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
        charIndex--;
        setTimeout(erase, erasingDelay);
      } else {
        textArrayIndex = (textArrayIndex + 1) % textArray.length;
        setTimeout(type, typingDelay + 500);
      }
    }

    if (textArray.length) setTimeout(type, newTextDelay + 250);
  }

  // Contact form handling with validation
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if(contactForm) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const nameValidation = document.getElementById('name-validation');
    const emailValidation = document.getElementById('email-validation');
    const messageValidation = document.getElementById('message-validation');
    
    // Input validation
    const validateName = () => {
      if (nameInput.validity.valueMissing) {
        nameValidation.textContent = 'Please enter your name';
        return false;
      } else if (nameInput.validity.tooShort) {
        nameValidation.textContent = 'Name must be at least 2 characters long';
        return false;
      } else {
        nameValidation.textContent = '';
        return true;
      }
    };
    
    const validateEmail = () => {
      if (emailInput.validity.valueMissing) {
        emailValidation.textContent = 'Please enter your email';
        return false;
      } else if (emailInput.validity.typeMismatch) {
        emailValidation.textContent = 'Please enter a valid email address';
        return false;
      } else {
        emailValidation.textContent = '';
        return true;
      }
    };
    
    const validateMessage = () => {
      if (messageInput.validity.valueMissing) {
        messageValidation.textContent = 'Please enter your message';
        return false;
      } else if (messageInput.validity.tooShort) {
        messageValidation.textContent = 'Message must be at least 10 characters long';
        return false;
      } else {
        messageValidation.textContent = '';
        return true;
      }
    };
    
    // Live validation
    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    messageInput.addEventListener('blur', validateMessage);
    
    // Form submission
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const isNameValid = validateName();
      const isEmailValid = validateEmail();
      const isMessageValid = validateMessage();
      
      if (!isNameValid || !isEmailValid || !isMessageValid) {
        return;
      }
      
      const formData = new FormData(contactForm);
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      formStatus.textContent = '';
      formStatus.className = 'form-status';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if(response.ok) {
          formStatus.innerHTML = '✓ Message sent successfully! I\'ll get back to you soon.';
          formStatus.classList.add('success');
          contactForm.reset();
        } else {
          throw new Error('Form submission failed');
        }
      } catch(error) {
        formStatus.innerHTML = '✗ Oops! Something went wrong. Please email me directly at <a href="mailto:virajkulye1474@gmail.com">virajkulye1474@gmail.com</a>';
        formStatus.classList.add('error');
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Project details modal
  const projectBtns = document.querySelectorAll('.project-details-btn');
  const modal = document.getElementById('project-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const modalTech = document.getElementById('modal-tech');
  const modalLink = document.getElementById('modal-link');

  function openModal(data) {
    if (!modal) return;
    modalTitle.textContent = data.title || '';
    modalDesc.textContent = data.desc || '';
    modalTech.textContent = data.tech ? 'Tech: ' + data.tech : '';
    if (data.link) {
      modalLink.href = data.link;
      modalLink.style.display = 'inline-block';
    } else {
      modalLink.style.display = 'none';
    }
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
  }

  if (projectBtns && projectBtns.length && modal) {
    projectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const data = {
          title: btn.getAttribute('data-title'),
          desc: btn.getAttribute('data-desc'),
          tech: btn.getAttribute('data-tech'),
          link: btn.getAttribute('data-link')
        };
        openModal(data);
      });
    });

    // Close handlers
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }
  
  // Set a class to indicate the page is loaded
  // Used by advanced features for controlling animations
  setTimeout(() => {
    document.body.classList.add('loaded');
  }, 300);
  
  // Mobile-specific optimizations
  if (isMobile || window.innerWidth < 768) {
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu && hamburger && navMenu.classList.contains('active')) {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        }
      }
    });
    
    // Prevent body scroll when mobile menu is open
    if (hamburger && navMenu) {
      const toggleBodyScroll = () => {
        if (navMenu.classList.contains('active')) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      };
      
      hamburger.addEventListener('click', () => {
        setTimeout(toggleBodyScroll, 10);
      });
    }
    
    // Add smooth scroll behavior for iOS
    document.documentElement.style.scrollBehavior = 'smooth';
  }
  
  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    // Reload page or adjust layout after orientation change
    setTimeout(() => {
      window.scrollTo(0, window.scrollY);
    }, 100);
  });
  
  // Handle resize events (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Update any dynamic elements on resize
      const windowWidth = window.innerWidth;
      
      // Close mobile menu if resized to desktop
      if (windowWidth >= 768 && navMenu && hamburger) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      // Reload advanced features if needed
      if (window.particleBackground && windowWidth < 768) {
        // Disable particle background on mobile after resize
        if (window.particleBackground.dispose) {
          window.particleBackground.dispose();
          window.particleBackground = null;
        }
      }
    }, 250);
  });
  
  // Export functions for advanced features if needed
  window.portfolioCore = {
    openModal,
    closeModal,
    toggleTheme: toggleTheme,
    isMobile: isMobile
  };
});
