/**
 * AI Bradaa - Landing Page JavaScript
 * Interactive functionality for cyberpunk landing page
 */

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');

    // Animate hamburger icon
    const spans = mobileMenuToggle.querySelectorAll('span');
    spans[0].style.transform = navLinks.classList.contains('active')
      ? 'rotate(45deg) translateY(8px)'
      : 'none';
    spans[1].style.opacity = navLinks.classList.contains('active') ? '0' : '1';
    spans[2].style.transform = navLinks.classList.contains('active')
      ? 'rotate(-45deg) translateY(-8px)'
      : 'none';
  });

  // Close mobile menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      const spans = mobileMenuToggle.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    });
  });
}

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Header Scroll Effect
const header = document.querySelector('header');
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

// Tool Preview Switching
const previewButtons = document.querySelectorAll('.preview-btn');
const previewPanels = document.querySelectorAll('.preview-panel');

previewButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    // Remove active class from all buttons and panels
    previewButtons.forEach(btn => btn.classList.remove('active'));
    previewPanels.forEach(panel => panel.classList.remove('active'));

    // Add active class to clicked button and corresponding panel
    button.classList.add('active');
    if (previewPanels[index]) {
      previewPanels[index].classList.add('active');
    }
  });
});

// Activate first preview by default
if (previewButtons.length > 0 && previewPanels.length > 0) {
  previewButtons[0].classList.add('active');
  previewPanels[0].classList.add('active');
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
      const valueElement = entry.target.querySelector('.metric-value');
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

document.querySelectorAll('.metric-card').forEach(card => {
  metricObserver.observe(card);
});

// Watch Demo Button Handler
const watchDemoButtons = document.querySelectorAll('[data-action="watch-demo"]');
watchDemoButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    // Could open a modal with demo video or redirect to app preview section
    document.querySelector('#app-preview')?.scrollIntoView({ behavior: 'smooth' });
  });
});

// Mentor Dots Interactive Effect
const mentorDots = document.querySelectorAll('.mentor-dot');
mentorDots.forEach((dot, index) => {
  // Random animation delays for more organic feel
  dot.style.animationDelay = `${Math.random() * 3}s`;

  // Click effect
  dot.addEventListener('click', () => {
    dot.style.animation = 'none';
    setTimeout(() => {
      dot.style.animation = '';
    }, 10);
  });
});

// Pricing Card Hover Effect Enhancement
const pricingCards = document.querySelectorAll('.pricing-card');
pricingCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    // Slight scale effect on hover
    card.style.transition = 'all 0.3s ease';
  });
});

// Performance: Debounce scroll events
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

// Apply debouncing to scroll handlers
const debouncedScroll = debounce(() => {
  // Any additional scroll-based animations can go here
}, 10);

window.addEventListener('scroll', debouncedScroll);

// Feature Card Interaction
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-8px) rotateX(2deg)';
  });

  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) rotateX(0)';
  });
});

// Initialize AOS (Animate On Scroll) alternative
document.addEventListener('DOMContentLoaded', () => {
  // Add fade-in classes to sections for initial load animation
  const sections = document.querySelectorAll('section');
  sections.forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

    setTimeout(() => {
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }, 100 * index);
  });
});

// Console Easter Egg
console.log('%c🤖 AI Bradaa', 'font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #00f3ff 0%, #d946ef 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cPowered by 84 AI Mentors 🧠', 'font-size: 14px; color: #00f3ff;');
console.log('%cInterested in the tech? Check out our GitHub!', 'font-size: 12px; color: #b4b4c8;');

// Add keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
  // ESC to close mobile menu
  if (e.key === 'Escape' && navLinks.classList.contains('active')) {
    navLinks.classList.remove('active');
    const spans = mobileMenuToggle.querySelectorAll('span');
    spans[0].style.transform = 'none';
    spans[1].style.opacity = '1';
    spans[2].style.transform = 'none';
  }
});

// Prevent FOUC (Flash of Unstyled Content)
document.documentElement.style.opacity = '0';
window.addEventListener('load', () => {
  document.documentElement.style.transition = 'opacity 0.3s ease';
  document.documentElement.style.opacity = '1';
});
