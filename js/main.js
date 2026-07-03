// Add 'js' class for progressive enhancement
document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

// Detect mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);

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


  // =====================================================
  // THEME TOGGLE
  // =====================================================

  const toggleTheme = () => {

    body.classList.toggle('dark-mode');

    const isDarkMode = body.classList.contains('dark-mode');

    if (toggleBtn) {
      toggleBtn.textContent = isDarkMode ? '☀️' : '🌙';
    }

    localStorage.setItem(
      'theme',
      isDarkMode ? 'dark' : 'light'
    );
  };


  if (toggleBtn) {

    if (localStorage.getItem('theme') === 'dark') {

      body.classList.add('dark-mode');
      toggleBtn.textContent = '☀️';

    } else {

      toggleBtn.textContent = '🌙';

    }

    toggleBtn.addEventListener('click', toggleTheme);

  } else {

    if (localStorage.getItem('theme') === 'dark') {
      body.classList.add('dark-mode');
    }

  }


  // =====================================================
  // HAMBURGER MENU
  // =====================================================

  if (hamburger && navMenu) {

    hamburger.addEventListener('click', () => {

      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');

    });

  }


  // =====================================================
  // SMOOTH SCROLL
  // =====================================================

  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');


  navLinks.forEach(link => {

    link.addEventListener('click', e => {

      e.preventDefault();

      const targetId = link
        .getAttribute('href')
        .substring(1);

      const targetSection =
        document.getElementById(targetId);


      if (targetSection) {

        window.scrollTo({

          top: targetSection.offsetTop - 60,

          behavior: 'smooth'

        });


        // Close mobile menu
        if (hamburger && navMenu) {

          hamburger.classList.remove('active');

          navMenu.classList.remove('active');

        }

      }

    });

  });


  // =====================================================
  // SCROLLSPY
  // =====================================================

  window.addEventListener('scroll', () => {

    let current = '';


    sections.forEach(section => {

      const sectionTop = section.offsetTop;


      if (
        window.scrollY >=
        sectionTop - 100
      ) {

        current =
          section.getAttribute('id');

      }

    });


    navLinks.forEach(link => {

      link.classList.remove('active');


      if (
        link.getAttribute('href') ===
        `#${current}`
      ) {

        link.classList.add('active');

      }

    });

  });


  // =====================================================
  // FADE-IN SECTIONS
  // =====================================================

  const faders =
    document.querySelectorAll('section');


  const appearOptions = {

    threshold: 0.1,

    rootMargin:
      '0px 0px -50px 0px'

  };


  const appearOnScroll =
    new IntersectionObserver(

      (entries, observer) => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target
              .classList
              .add('appear');

            observer.unobserve(
              entry.target
            );

          }

        });

      },

      appearOptions

    );


  faders.forEach(fader => {

    appearOnScroll.observe(fader);

  });


  // =====================================================
  // BACK TO TOP BUTTON
  // =====================================================

  const backToTopBtn =
    document.createElement('button');


  backToTopBtn.innerHTML =
    '<i class="fas fa-chevron-up"></i>';


  backToTopBtn.className =
    'back-to-top';


  backToTopBtn.setAttribute(
    'aria-label',
    'Back to top'
  );


  document.body.appendChild(
    backToTopBtn
  );


  backToTopBtn.addEventListener(
    'click',
    () => {

      window.scrollTo({

        top: 0,

        behavior: 'smooth'

      });

    }
  );


  window.addEventListener(
    'scroll',
    () => {

      backToTopBtn.style.display =
        window.scrollY > 300
          ? 'block'
          : 'none';

    }
  );


  // =====================================================
  // RESUME ACCESS REQUEST
  // =====================================================

  /**
   * Single configurable place for the backend URL.
   * Automatically selects localhost when developing locally,
   * and your production backend URL when deployed.
   */
  const API_BASE_URL =
    (window.location.hostname === 'localhost' ||
     window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8000'
      : 'https://YOUR_PRODUCTION_BACKEND_URL'; // ← replace before deploying

  const requestResumeBtn  = document.getElementById('request-resume-btn');
  const resumeRequestForm = document.getElementById('resume-request-form');
  const resumeCancelBtn   = document.getElementById('resume-cancel-btn');
  const resumeAccessForm  = document.getElementById('resume-access-form');
  const resumeSubmitBtn   = document.getElementById('resume-submit-btn');
  const resumeSuccess     = document.getElementById('resume-success');
  const resumeError       = document.getElementById('resume-error');

  // ── Show / hide form ──────────────────────────────────────────────────────
  if (requestResumeBtn && resumeRequestForm) {
    requestResumeBtn.addEventListener('click', () => {
      resumeRequestForm.hidden = false;
      requestResumeBtn.closest('#resume-request-trigger').style.display = 'none';
      resumeRequestForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  if (resumeCancelBtn && resumeRequestForm && requestResumeBtn) {
    resumeCancelBtn.addEventListener('click', () => {
      resumeRequestForm.hidden = true;
      requestResumeBtn.closest('#resume-request-trigger').style.display = '';
      if (resumeAccessForm) resumeAccessForm.reset();
      _raClearErrors();
      if (resumeError)   { resumeError.hidden = true;   resumeError.textContent = ''; }
      if (resumeSuccess) { resumeSuccess.hidden = true; }
      if (resumeAccessForm) resumeAccessForm.hidden = false;
    });
  }

  // ── Validation helpers ────────────────────────────────────────────────────
  function _raSetError(fieldId, msg) {
    const el = document.getElementById(fieldId + '-err');
    if (el) el.textContent = msg;
  }
  function _raClearErrors() {
    ['ra-name','ra-email','ra-company','ra-role','ra-reason'].forEach(id => _raSetError(id, ''));
  }

  const _emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function _raValidate() {
    _raClearErrors();
    let ok = true;

    const name    = document.getElementById('ra-name');
    const email   = document.getElementById('ra-email');
    const company = document.getElementById('ra-company');
    const role    = document.getElementById('ra-role');
    const reason  = document.getElementById('ra-reason');

    if (!name || !name.value.trim() || name.value.trim().length < 2) {
      _raSetError('ra-name', 'Please enter your full name (at least 2 characters).');
      ok = false;
    }
    if (!email || !email.value.trim() || !_emailRe.test(email.value.trim())) {
      _raSetError('ra-email', 'Please enter a valid email address.');
      ok = false;
    }
    if (!company || !company.value.trim()) {
      _raSetError('ra-company', 'Please enter your company or organization.');
      ok = false;
    }
    if (!role || !role.value.trim()) {
      _raSetError('ra-role', 'Please enter your job role or purpose.');
      ok = false;
    }
    if (!reason || !reason.value.trim() || reason.value.trim().length < 10) {
      _raSetError('ra-reason', 'Please provide a reason (at least 10 characters).');
      ok = false;
    }
    return ok;
  }

  // ── Loading state helpers ─────────────────────────────────────────────────
  function _raSetLoading(loading) {
    if (!resumeSubmitBtn) return;
    const btnText    = resumeSubmitBtn.querySelector('.btn-text');
    const btnLoading = resumeSubmitBtn.querySelector('.btn-loading');
    resumeSubmitBtn.disabled = loading;
    if (btnText)    btnText.hidden    = loading;
    if (btnLoading) btnLoading.hidden = !loading;
  }

  // ── Form submission ───────────────────────────────────────────────────────
  if (resumeAccessForm) {
    // Live validation on blur
    ['ra-name','ra-email','ra-company','ra-role','ra-reason'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('blur', _raValidate);
    });

    resumeAccessForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!_raValidate()) return;

      _raSetLoading(true);
      if (resumeError) { resumeError.hidden = true; resumeError.textContent = ''; }

      const payload = {
        full_name: document.getElementById('ra-name').value.trim(),
        email:     document.getElementById('ra-email').value.trim(),
        company:   document.getElementById('ra-company').value.trim(),
        job_role:  document.getElementById('ra-role').value.trim(),
        reason:    document.getElementById('ra-reason').value.trim(),
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/resume/request`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          // Show success, hide the form
          resumeAccessForm.hidden = true;
          if (resumeSuccess) resumeSuccess.hidden = false;
        } else if (res.status === 429) {
          // Duplicate cooldown – show friendly message
          if (resumeError) {
            resumeError.textContent =
              data.detail ||
              'A request from this email was recently submitted. Please wait before submitting again.';
            resumeError.hidden = false;
          }
        } else {
          throw new Error(data.detail || 'Submission failed. Please try again.');
        }
      } catch (err) {
        if (resumeError) {
          resumeError.textContent =
            err.message ||
            'Something went wrong. Please try again or contact me directly.';
          resumeError.hidden = false;
        }
      } finally {
        _raSetLoading(false);
      }
    });
  }


  // =====================================================
  // TYPING ANIMATION
  // =====================================================

  const typedTextSpan =
    document.getElementById(
      'typed-text'
    );


  if (typedTextSpan) {

    const textArray = [

      'Python Developer',

      'Data Engineer',

      'AI/ML Enthusiast'

    ];


    const typingDelay = 100;

    const erasingDelay = 50;

    const newTextDelay = 2000;


    let textArrayIndex = 0;

    let charIndex = 0;


    function type() {

      if (
        charIndex <
        textArray[textArrayIndex].length
      ) {

        typedTextSpan.textContent +=
          textArray[textArrayIndex]
            .charAt(charIndex);

        charIndex++;

        setTimeout(
          type,
          typingDelay
        );

      } else {

        setTimeout(
          erase,
          newTextDelay
        );

      }

    }


    function erase() {

      if (charIndex > 0) {

        typedTextSpan.textContent =
          textArray[textArrayIndex]
            .substring(
              0,
              charIndex - 1
            );

        charIndex--;

        setTimeout(
          erase,
          erasingDelay
        );

      } else {

        textArrayIndex =
          (textArrayIndex + 1) %
          textArray.length;

        setTimeout(
          type,
          typingDelay + 500
        );

      }

    }


    if (textArray.length) {

      setTimeout(
        type,
        newTextDelay + 250
      );

    }

  }


  // =====================================================
  // CONTACT FORM
  // =====================================================

  const contactForm =
    document.getElementById(
      'contact-form'
    );


  const formStatus =
    document.getElementById(
      'form-status'
    );


  if (contactForm) {

    const nameInput =
      document.getElementById('name');

    const emailInput =
      document.getElementById('email');

    const messageInput =
      document.getElementById('message');


    const nameValidation =
      document.getElementById(
        'name-validation'
      );

    const emailValidation =
      document.getElementById(
        'email-validation'
      );

    const messageValidation =
      document.getElementById(
        'message-validation'
      );


    // -----------------------------
    // Name validation
    // -----------------------------

    const validateName = () => {

      if (
        nameInput.validity.valueMissing
      ) {

        nameValidation.textContent =
          'Please enter your name';

        return false;

      }


      if (
        nameInput.validity.tooShort
      ) {

        nameValidation.textContent =
          'Name must be at least 2 characters long';

        return false;

      }


      nameValidation.textContent = '';

      return true;

    };


    // -----------------------------
    // Email validation
    // -----------------------------

    const validateEmail = () => {

      if (
        emailInput.validity.valueMissing
      ) {

        emailValidation.textContent =
          'Please enter your email';

        return false;

      }


      if (
        emailInput.validity.typeMismatch
      ) {

        emailValidation.textContent =
          'Please enter a valid email address';

        return false;

      }


      emailValidation.textContent = '';

      return true;

    };


    // -----------------------------
    // Message validation
    // -----------------------------

    const validateMessage = () => {

      if (
        messageInput.validity.valueMissing
      ) {

        messageValidation.textContent =
          'Please enter your message';

        return false;

      }


      if (
        messageInput.validity.tooShort
      ) {

        messageValidation.textContent =
          'Message must be at least 10 characters long';

        return false;

      }


      messageValidation.textContent = '';

      return true;

    };


    // Live validation

    nameInput.addEventListener(
      'blur',
      validateName
    );


    emailInput.addEventListener(
      'blur',
      validateEmail
    );


    messageInput.addEventListener(
      'blur',
      validateMessage
    );


    // Contact form submission

    contactForm.addEventListener(
      'submit',
      async e => {

        e.preventDefault();


        const isNameValid =
          validateName();

        const isEmailValid =
          validateEmail();

        const isMessageValid =
          validateMessage();


        if (
          !isNameValid ||
          !isEmailValid ||
          !isMessageValid
        ) {

          return;

        }


        const formData =
          new FormData(contactForm);


        const submitBtn =
          contactForm.querySelector(
            'button[type="submit"]'
          );


        const originalText =
          submitBtn.textContent;


        submitBtn.textContent =
          'Sending...';

        submitBtn.disabled = true;


        if (formStatus) {

          formStatus.textContent = '';

          formStatus.className =
            'form-status';

        }


        try {

          const response =
            await fetch(
              contactForm.action,
              {

                method: 'POST',

                body: formData,

                headers: {

                  Accept:
                    'application/json'

                }

              }
            );


          if (response.ok) {

            if (formStatus) {

              formStatus.innerHTML =
                "✓ Message sent successfully! I'll get back to you soon.";

              formStatus.classList.add(
                'success'
              );

            }


            contactForm.reset();

          } else {

            throw new Error(
              'Form submission failed'
            );

          }

        } catch (error) {

          if (formStatus) {

            formStatus.innerHTML =
              '✗ Oops! Something went wrong. Please email me directly.';

            formStatus.classList.add(
              'error'
            );

          }

        } finally {

          submitBtn.textContent =
            originalText;

          submitBtn.disabled = false;

        }

      }
    );

  }


  // =====================================================
  // PROJECT DETAILS MODAL
  // =====================================================

  const projectBtns =
    document.querySelectorAll(
      '.project-details-btn'
    );


  const modal =
    document.getElementById(
      'project-modal'
    );


  const modalTitle =
    document.getElementById(
      'modal-title'
    );


  const modalDesc =
    document.getElementById(
      'modal-desc'
    );


  const modalTech =
    document.getElementById(
      'modal-tech'
    );


  const modalLink =
    document.getElementById(
      'modal-link'
    );


  function openModal(data) {

    if (!modal) return;


    modalTitle.textContent =
      data.title || '';


    modalDesc.textContent =
      data.desc || '';


    modalTech.textContent =
      data.tech
        ? 'Tech: ' + data.tech
        : '';


    if (data.link) {

      modalLink.href =
        data.link;

      modalLink.style.display =
        'inline-block';

    } else {

      modalLink.style.display =
        'none';

    }


    modal.setAttribute(
      'aria-hidden',
      'false'
    );

  }


  function closeModal() {

    if (!modal) return;


    modal.setAttribute(
      'aria-hidden',
      'true'
    );

  }


  if (
    projectBtns.length &&
    modal
  ) {

    projectBtns.forEach(btn => {

      btn.addEventListener(
        'click',
        () => {

          const data = {

            title:
              btn.getAttribute(
                'data-title'
              ),

            desc:
              btn.getAttribute(
                'data-desc'
              ),

            tech:
              btn.getAttribute(
                'data-tech'
              ),

            link:
              btn.getAttribute(
                'data-link'
              )

          };


          openModal(data);

        }
      );

    });


    modal
      .querySelectorAll(
        '[data-close]'
      )
      .forEach(el => {

        el.addEventListener(
          'click',
          closeModal
        );

      });


    document.addEventListener(
      'keydown',
      e => {

        if (e.key === 'Escape') {

          closeModal();

        }

      }
    );

  }


  // =====================================================
  // PAGE LOADED
  // =====================================================

  setTimeout(() => {

    document.body.classList.add(
      'loaded'
    );

  }, 300);


  // =====================================================
  // MOBILE OPTIMIZATIONS
  // =====================================================

  if (
    isMobile ||
    window.innerWidth < 768
  ) {

    document.addEventListener(
      'click',
      e => {

        if (
          navMenu &&
          hamburger &&
          navMenu.classList.contains(
            'active'
          )
        ) {

          if (
            !navMenu.contains(e.target) &&
            !hamburger.contains(e.target)
          ) {

            hamburger.classList.remove(
              'active'
            );

            navMenu.classList.remove(
              'active'
            );

          }

        }

      }
    );


    if (
      hamburger &&
      navMenu
    ) {

      const toggleBodyScroll = () => {

        if (
          navMenu.classList.contains(
            'active'
          )
        ) {

          document.body.style.overflow =
            'hidden';

        } else {

          document.body.style.overflow =
            '';

        }

      };


      hamburger.addEventListener(
        'click',
        () => {

          setTimeout(
            toggleBodyScroll,
            10
          );

        }
      );

    }


    document.documentElement.style
      .scrollBehavior = 'smooth';

  }


  // =====================================================
  // ORIENTATION CHANGE
  // =====================================================

  window.addEventListener(
    'orientationchange',
    () => {

      setTimeout(() => {

        window.scrollTo(
          0,
          window.scrollY
        );

      }, 100);

    }
  );


  // =====================================================
  // WINDOW RESIZE
  // =====================================================

  let resizeTimer;


  window.addEventListener(
    'resize',
    () => {

      clearTimeout(
        resizeTimer
      );


      resizeTimer =
        setTimeout(() => {

          const windowWidth =
            window.innerWidth;


          if (
            windowWidth >= 768 &&
            navMenu &&
            hamburger
          ) {

            hamburger.classList.remove(
              'active'
            );

            navMenu.classList.remove(
              'active'
            );

            document.body.style.overflow =
              '';

          }


          if (
            window.particleBackground &&
            windowWidth < 768
          ) {

            if (
              window.particleBackground
                .dispose
            ) {

              window
                .particleBackground
                .dispose();


              window.particleBackground =
                null;

            }

          }

        }, 250);

    }
  );


  // =====================================================
  // EXPORT FUNCTIONS
  // =====================================================

  window.portfolioCore = {

    openModal,

    closeModal,

    toggleTheme,

    isMobile

  };

});