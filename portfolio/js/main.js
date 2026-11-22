/**
 * ============================================================================
 * MAIN JAVASCRIPT LOGIC
 * Portfolio Interactive Features & Behaviors
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     1. THEME SWITCHER (Cyber Neon -> Emerald Stealth -> Synthwave Sunset)
     -------------------------------------------------------------------------- */
  const themeToggle = document.getElementById('theme-toggle');
  const themes = ['', 'emerald', 'synthwave'];
  let currentThemeIndex = 0;

  // Restore saved theme from localStorage
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme) {
    currentThemeIndex = themes.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentThemeIndex = (currentThemeIndex + 1) % themes.length;
      const newTheme = themes[currentThemeIndex];
      
      if (newTheme) {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('portfolio-theme', newTheme);
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.removeItem('portfolio-theme');
      }
    });
  }

  /* --------------------------------------------------------------------------
     2. BACKGROUND PARTICLE CANVAS
     -------------------------------------------------------------------------- */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = 45;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.speedY = (Math.random() - 0.5) * 0.6;
        this.alpha = Math.random() * 0.4 + 0.1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        ctx.fillStyle = `rgba(99, 102, 241, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animateParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 - dist / 1300})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animateParticles);
    };

    animateParticles();
  }

  /* --------------------------------------------------------------------------
     3. TYPING ANIMATION (Hero Section)
     -------------------------------------------------------------------------- */
  const typedTarget = document.getElementById('typed-text');
  if (typedTarget) {
    const words = [
      'responsive web apps',
      'clean modern interfaces',
      'interactive web experiences',
      'scalable frontend code'
    ];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 90;
    const eraseSpeed = 50;
    const pauseTime = 1800;

    const typeStep = () => {
      const currentWord = words[wordIndex];

      if (isDeleting) {
        typedTarget.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        typedTarget.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      if (!isDeleting && charIndex === currentWord.length) {
        setTimeout(() => { isDeleting = true; typeStep(); }, pauseTime);
        return;
      }

      if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(typeStep, 350);
        return;
      }

      setTimeout(typeStep, isDeleting ? eraseSpeed : typeSpeed);
    };

    typeStep();
  }

  /* --------------------------------------------------------------------------
     4. NAVBAR SCROLL EFFECT, ACTIVE LINKS & SCROLL PROGRESS BAR
     -------------------------------------------------------------------------- */
  const header = document.getElementById('header');
  const scrollProgress = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

    // Scroll Progress Bar
    if (scrollProgress && totalHeight > 0) {
      const progressPercent = (scrollY / totalHeight) * 100;
      scrollProgress.style.width = `${progressPercent}%`;
    }

    // Header blurred background on scroll
    if (header) {
      if (scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Back to top button visibility
    if (backToTop) {
      if (scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }

    // Highlight current nav section link
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --------------------------------------------------------------------------
     5. MOBILE MENU TOGGLE
     -------------------------------------------------------------------------- */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinksContainer = document.getElementById('nav-links');

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('mobile-open');
    });

    // Close mobile nav when clicking a link
    navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinksContainer.classList.remove('mobile-open');
      });
    });
  }

  /* --------------------------------------------------------------------------
     6. CUSTOM CURSOR
     -------------------------------------------------------------------------- */
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');

  if (cursorDot && cursorRing && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    });

    const renderRing = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.left = `${ringX}px`;
      cursorRing.style.top = `${ringY}px`;
      requestAnimationFrame(renderRing);
    };
    renderRing();

    // Scale cursor ring on hover over clickable elements
    const clickables = document.querySelectorAll('a, button, input, textarea, .tab-btn, .filter-btn');
    clickables.forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('cursor-hover'));
    });
  } else {
    // Hide custom cursor on touch devices
    if (cursorDot) cursorDot.style.display = 'none';
    if (cursorRing) cursorRing.style.display = 'none';
  }

  /* --------------------------------------------------------------------------
     7. 3D TILT EFFECT ON HERO PROFILE CARD
     -------------------------------------------------------------------------- */
  const profileCard = document.getElementById('profile-card');
  if (profileCard) {
    profileCard.addEventListener('mousemove', (e) => {
      const rect = profileCard.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = -(y / rect.height) * 14;
      const rotateY = (x / rect.width) * 14;
      profileCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    profileCard.addEventListener('mouseleave', () => {
      profileCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  }

  /* --------------------------------------------------------------------------
     8. SCROLL REVEAL ANIMATIONS & SKILL PROGRESS BARS
     -------------------------------------------------------------------------- */
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const skillBars = document.querySelectorAll('.skill-bar-fill');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => revealObserver.observe(el));

  // Animate skill bars when visible
  const skillObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const progress = bar.getAttribute('data-progress');
        if (progress) {
          bar.style.width = progress;
        }
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });

  skillBars.forEach(bar => skillObserver.observe(bar));

  /* --------------------------------------------------------------------------
     9. ABOUT SECTION TABS
     -------------------------------------------------------------------------- */
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetTabId = `tab-${btn.getAttribute('data-tab')}`;
      const targetContent = document.getElementById(targetTabId);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  /* --------------------------------------------------------------------------
     10. PROJECT CATEGORY FILTERING
     -------------------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.classList.add('revealed');
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* --------------------------------------------------------------------------
     11. CONTACT FORM VALIDATION & SIMULATION
     -------------------------------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!name || !email || !message) {
        formFeedback.className = 'form-feedback error';
        formFeedback.textContent = 'Please fill out all required fields.';
        return;
      }

      // Simulate sending message
      formFeedback.className = 'form-feedback success';
      formFeedback.textContent = `Thank you, ${name}! Your message has been received. I will respond within 24 hours.`;
      contactForm.reset();

      setTimeout(() => {
        formFeedback.className = 'form-feedback';
        formFeedback.textContent = '';
      }, 6000);
    });
  }

  /* --------------------------------------------------------------------------
     12. PROJECT DETAILS MODAL
     -------------------------------------------------------------------------- */
  const projectModal = document.getElementById('project-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalBodyContent = document.getElementById('modal-body-content');
  const detailButtons = document.querySelectorAll('.view-details-btn');

  const projectData = {
    nexus: {
      title: 'Nexus Real-Time Dashboard',
      category: 'Frontend Engineering',
      description: 'A modular monitoring console built for operations engineers. Provides real-time metrics tracking, reactive animated SVG graphs, customized dark/light theme persistence, and customizable telemetry widgets.',
      stack: ['HTML5', 'CSS Grid', 'Vanilla JavaScript', 'SVG Charts', 'LocalStorage']
    },
    particles: {
      title: 'Cyber Particle System',
      category: 'Creative WebGL & Canvas API',
      description: 'An interactive 2D canvas simulation exploring particle mechanics, velocity vectors, boundary collision detection, and proximity node networking with silky smooth 60fps performance.',
      stack: ['HTML5 Canvas', 'Physics Math', 'RequestAnimationFrame', 'ES6 Classes']
    },
    cloudtask: {
      title: 'Cloud Task Orchestrator',
      category: 'Full-Stack Architecture',
      description: 'A distributed workflow automation engine supporting background jobs, scheduled crons, webhook dispatchers, and detailed execution audit trails.',
      stack: ['Node.js', 'Express', 'REST API', 'JavaScript', 'JSON']
    }
  };

  const openProjectModal = (key) => {
    const data = projectData[key];
    if (!data || !modalBodyContent || !projectModal) return;

    modalBodyContent.innerHTML = `
      <span class="section-tag">${data.category}</span>
      <h3 style="font-size: 1.8rem; margin: 0.8rem 0 1rem 0;">${data.title}</h3>
      <p style="color: var(--text-muted); line-height: 1.7; margin-bottom: 1.5rem;">${data.description}</p>
      <h4 style="font-size: 1rem; margin-bottom: 0.75rem;">Technologies Used:</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
        ${data.stack.map(tech => `<span class="p-tag">${tech}</span>`).join('')}
      </div>
      <a href="#hero" class="btn btn-primary" onclick="document.getElementById('project-modal').classList.remove('active')">
        Close Preview
      </a>
    `;

    projectModal.classList.add('active');
  };

  detailButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-project');
      openProjectModal(key);
    });
  });

  if (modalCloseBtn && projectModal) {
    modalCloseBtn.addEventListener('click', () => {
      projectModal.classList.remove('active');
    });

    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        projectModal.classList.remove('active');
      }
    });
  }

  /* --------------------------------------------------------------------------
     13. INTERACTIVE TERMINAL EASTER EGG
     -------------------------------------------------------------------------- */
  const terminalToggle = document.getElementById('terminal-toggle');
  const terminalModal = document.getElementById('terminal-modal');
  const terminalCloseDot = document.getElementById('terminal-close-dot');
  const terminalInput = document.getElementById('terminal-input');
  const terminalBody = document.getElementById('terminal-body');

  if (terminalToggle && terminalModal) {
    terminalToggle.addEventListener('click', () => {
      terminalModal.classList.add('active');
      if (terminalInput) terminalInput.focus();
    });

    if (terminalCloseDot) {
      terminalCloseDot.addEventListener('click', () => {
        terminalModal.classList.remove('active');
      });
    }

    terminalModal.addEventListener('click', (e) => {
      if (e.target === terminalModal) {
        terminalModal.classList.remove('active');
      }
    });

    if (terminalInput && terminalBody) {
      terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const rawCmd = terminalInput.value.trim();
          const cmd = rawCmd.toLowerCase();
          terminalInput.value = '';

          // Echo user command
          const userLine = document.createElement('div');
          userLine.className = 'terminal-output-line cmd';
          userLine.textContent = `> ${rawCmd}`;
          terminalBody.appendChild(userLine);

          // Handle command response
          const outputLine = document.createElement('div');
          outputLine.className = 'terminal-output-line';

          switch (cmd) {
            case 'help':
              outputLine.className = 'terminal-output-line system';
              outputLine.innerHTML = `Available commands:<br>
  - <strong style="color: #fff;">about</strong>: Learn about Alex<br>
  - <strong style="color: #fff;">skills</strong>: Display top technologies<br>
  - <strong style="color: #fff;">projects</strong>: List featured projects<br>
  - <strong style="color: #fff;">theme</strong>: Toggle theme palette<br>
  - <strong style="color: #fff;">clear</strong>: Clear terminal screen<br>
  - <strong style="color: #fff;">exit</strong>: Close terminal window`;
              break;

            case 'about':
              outputLine.textContent = 'Alex Chen — Software Engineer focused on interactive web experiences, clean architecture, and modern full-stack development.';
              break;

            case 'skills':
              outputLine.textContent = 'Skills: HTML5, CSS3, JavaScript (ES6+), Node.js, Python, Git, Antigravity IDE & CLI.';
              break;

            case 'projects':
              outputLine.textContent = 'Projects: Nexus Dashboard, Cyber Particle System, Cloud Task Orchestrator.';
              break;

            case 'theme':
              if (themeToggle) themeToggle.click();
              outputLine.textContent = 'Theme palette toggled!';
              break;

            case 'clear':
              terminalBody.innerHTML = '';
              return;

            case 'exit':
              terminalModal.classList.remove('active');
              return;

            case '':
              return;

            default:
              outputLine.className = 'terminal-output-line error';
              outputLine.textContent = `Command not recognized: '${rawCmd}'. Type 'help' for command list.`;
              break;
          }

          terminalBody.appendChild(outputLine);
          terminalBody.scrollTop = terminalBody.scrollHeight;
        }
      });
    }
  }

});
