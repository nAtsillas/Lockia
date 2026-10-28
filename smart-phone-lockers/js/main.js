/**
 * Lockia - Smart Phone Lockers
 * Interactive Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
      mobileToggle.innerHTML = isOpen ? '✕' : '☰';
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        if (mobileToggle) mobileToggle.innerHTML = '☰';
      });
    });
  }

  // Active Navigation Indicator via IntersectionObserver
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navItems = document.querySelectorAll('.nav-link');

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const currentId = entry.target.getAttribute('id');
        navItems.forEach(item => {
          if (item.getAttribute('href') === `#${currentId}`) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(sec => observer.observe(sec));

  // Copy-to-clipboard for placeholder text
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const textToCopy = targetElement.textContent.trim();
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalText = btn.textContent;
          btn.textContent = 'Copied!';
          btn.style.backgroundColor = '#10b981';
          btn.style.color = '#ffffff';

          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy text: ', err);
        });
      }
    });
  });

  // Animación de entrada de textos en la página de Inicio
  // - Los textos se animan asentándose y apareciendo al llegar a cada sección
  // - Solo animación de entrada, sin animación de salida
  // - Si la animación ya se ejecutó, al volver con scroll no se repite
  // - Se reactiva al llegar de nuevo desde los accesos directos de inicio
  const animatedSections = document.querySelectorAll('.animate-section');
  if (animatedSections.length > 0) {
    const sectionObserverOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.12
    };

    let sectionObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('has-animated');
          // Solo animación de entrada, sin salida; no se repite al hacer scroll
          obs.unobserve(entry.target);
        }
      });
    }, sectionObserverOptions);

    function startObservingSections() {
      animatedSections.forEach(sec => {
        sectionObserver.observe(sec);
      });
    }

    startObservingSections();

    // Accesos directos de inicio: re-armar la animación si se pulsa para volver a Inicio
    const inicioTriggers = document.querySelectorAll('a[href="index.html"], a.brand-logo');
    inicioTriggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const isCurrentPageHome = window.location.pathname.endsWith('index.html') || 
                                  window.location.pathname === '' || 
                                  window.location.pathname.endsWith('/');
        if (isCurrentPageHome) {
          sectionObserver.disconnect();
          animatedSections.forEach(sec => sec.classList.remove('has-animated'));
          setTimeout(() => {
            startObservingSections();
          }, 100);
        }
      });
    });
  }
});
