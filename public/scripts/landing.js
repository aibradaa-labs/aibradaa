/**
 * AI Bradaa - Landing Page JavaScript
 * Interactive functionality for cyberpunk landing page
 */

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');

if (mobileMenuToggle && mobileNavOverlay) {
  mobileMenuToggle.addEventListener('click', () => {
    const isHidden = mobileNavOverlay.getAttribute('aria-hidden') === 'true';

    // Toggle overlay
    mobileNavOverlay.setAttribute('aria-hidden', !isHidden);
    mobileMenuToggle.setAttribute('aria-expanded', isHidden);

    // Animate hamburger icon
    const spans = mobileMenuToggle.querySelectorAll('span');
    if (isHidden) {
      spans[0].style.transform = 'rotate(45deg) translateY(8px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });

  // Close mobile menu when clicking a link
  const mobileNav = document.querySelector('.mobile-nav');
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNavOverlay.setAttribute('aria-hidden', 'true');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        const spans = mobileMenuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      });
    });
  }
}

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Header Scroll Effect
const header = document.querySelector('header, .site-header');
if (header) {
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // Add scrolled class for styling
    if (currentScroll > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  });
}

// Tool Preview Switching
const toolButtons = document.querySelectorAll('.tool-btn');
const previewPanels = document.querySelectorAll('.preview-panel');
const previewToolName = document.querySelector('#preview-tool-name');

if (toolButtons.length > 0 && previewPanels.length > 0) {
  toolButtons.forEach(button => {
    button.addEventListener('click', () => {
      const toolName = button.getAttribute('data-tool');

      // Remove active class from all buttons
      toolButtons.forEach(btn => btn.classList.remove('active'));

      // Remove active class from all panels
      previewPanels.forEach(panel => panel.classList.remove('active'));

      // Add active class to clicked button
      button.classList.add('active');

      // Show corresponding panel
      const targetPanel = document.querySelector(`.preview-panel[data-panel="${toolName}"]`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }

      // Update preview title
      if (previewToolName) {
        const toolText = button.querySelector('span').textContent;
        previewToolName.textContent = toolText;
      }
    });
  });

  // Activate first tool by default
  if (toolButtons[0]) {
    toolButtons[0].click();
  }
}

// Scroll Reveal Animation
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all elements with .reveal class
document.querySelectorAll('.reveal').forEach(element => {
  observer.observe(element);
});

// Metric Counter Animation
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const increment = target / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

// Animate metrics when they come into view
const metricObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const valueElement = entry.target.querySelector('.metric-number');
      if (valueElement) {
        const targetText = valueElement.textContent;
        const targetNumber = parseInt(targetText.replace(/[^0-9]/g, ''));
        if (!isNaN(targetNumber)) {
          animateCounter(valueElement, targetNumber);
        }
      }
      metricObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.metric-item').forEach(item => {
  metricObserver.observe(item);
});

// Watch Demo Button Handler
const watchDemoButtons = document.querySelectorAll('[data-action="watch-demo"]');
watchDemoButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    const appPreview = document.querySelector('#app-preview');
    if (appPreview) {
      appPreview.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Feature Card Interaction
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-8px)';
  });

  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0)';
  });
});

// Performance: Debounce function
function debounce(func, wait = 10) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Console Easter Egg
console.log('%c🤖 AI Bradaa', 'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #00f3ff 0%, #d946ef 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cPowered by 84 AI Mentors 🧠', 'font-size: 14px; color: #00f3ff;');
console.log('%cInterested in the tech? Check out our GitHub!', 'font-size: 12px; color: #b4b4c8;');

// Add keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
  // ESC to close mobile menu
  if (e.key === 'Escape' && mobileNavOverlay) {
    if (mobileNavOverlay.getAttribute('aria-hidden') === 'false') {
      mobileNavOverlay.setAttribute('aria-hidden', 'true');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      const spans = mobileMenuToggle.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  }
});

// Prevent FOUC (Flash of Unstyled Content) with timeout fallback
document.documentElement.style.opacity = '0';

// Show page when loaded OR after 2 second timeout (whichever comes first)
let pageShown = false;
const showPage = () => {
  if (!pageShown) {
    pageShown = true;
    document.documentElement.style.transition = 'opacity 0.3s ease';
    document.documentElement.style.opacity = '1';
  }
};

window.addEventListener('load', showPage);
// Fallback: force show after 2 seconds even if load event doesn't fire
setTimeout(showPage, 2000);
