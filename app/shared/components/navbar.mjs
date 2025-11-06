/**
 * Navbar Component
 * Main navigation bar for the app
 */

export class Navbar {
  constructor(options = {}) {
    this.items = options.items || [];
    this.currentPath = options.currentPath || '/';
    this.onNavigate = options.onNavigate || ((path) => { window.location.href = path; });
    this.userTier = options.userTier || 'free';
    this.userName = options.userName || 'User';

    this.element = null;
    this.isMobileMenuOpen = false;
  }

  /**
   * Render navbar element
   */
  render() {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.setAttribute('role', 'navigation');

    // Logo/Brand
    const brand = document.createElement('div');
    brand.className = 'navbar-brand';
    brand.innerHTML = `
      <a href="/" class="navbar-logo">
        <span class="logo-text">AI Bradaa</span>
        <span class="logo-badge">BETA</span>
      </a>
    `;
    nav.appendChild(brand);

    // Navigation items
    const navItems = document.createElement('div');
    navItems.className = 'navbar-items';

    this.items.forEach(item => {
      const navItem = this.renderNavItem(item);
      navItems.appendChild(navItem);
    });

    nav.appendChild(navItems);

    // Right section (tier badge + user menu)
    const navRight = document.createElement('div');
    navRight.className = 'navbar-right';

    // Tier badge
    const tierBadge = document.createElement('div');
    tierBadge.className = `navbar-tier-badge tier-${this.userTier}`;
    tierBadge.textContent = this.userTier.toUpperCase();
    navRight.appendChild(tierBadge);

    // User menu
    const userMenu = this.renderUserMenu();
    navRight.appendChild(userMenu);

    // Mobile menu toggle
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'navbar-mobile-toggle';
    mobileToggle.innerHTML = '☰';
    mobileToggle.setAttribute('aria-label', 'Toggle menu');
    mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
    navRight.appendChild(mobileToggle);

    nav.appendChild(navRight);

    this.element = nav;
    return nav;
  }

  /**
   * Render navigation item
   */
  renderNavItem(item) {
    const navItem = document.createElement('div');
    navItem.className = 'navbar-item';

    const link = document.createElement('a');
    link.href = item.path;
    link.className = 'navbar-link';
    link.textContent = item.label;

    // Mark as active if current path
    if (this.currentPath === item.path) {
      link.classList.add('navbar-link-active');
    }

    // Add tier badge if required
    if (item.tierRequired && item.tierRequired !== 'free') {
      const badge = document.createElement('span');
      badge.className = 'navbar-item-badge';
      badge.textContent = item.tierRequired;
      link.appendChild(badge);
    }

    link.addEventListener('click', (e) => {
      e.preventDefault();
      this.onNavigate(item.path);
      this.setActive(item.path);
    });

    navItem.appendChild(link);
    return navItem;
  }

  /**
   * Render user menu dropdown
   */
  renderUserMenu() {
    const menu = document.createElement('div');
    menu.className = 'navbar-user-menu';

    // Trigger button
    const trigger = document.createElement('button');
    trigger.className = 'navbar-user-trigger';
    trigger.innerHTML = `
      <span class="user-avatar">${this.userName.charAt(0).toUpperCase()}</span>
      <span class="user-name">${this.userName}</span>
      <span class="user-dropdown-icon">▾</span>
    `;
    trigger.addEventListener('click', () => {
      menu.classList.toggle('menu-open');
    });

    // Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'navbar-user-dropdown';

    const menuItems = [
      { label: 'Profile', path: '/profile', icon: '👤' },
      { label: 'Settings', path: '/settings', icon: '⚙️' },
      { label: 'Favorites', path: '/favorites', icon: '❤️' },
      { label: 'History', path: '/history', icon: '📜' },
      { label: 'Upgrade', path: '/pricing', icon: '⬆️', highlight: this.userTier === 'free' },
      { label: 'Logout', path: '/logout', icon: '🚪', danger: true },
    ];

    menuItems.forEach(item => {
      const menuItem = document.createElement('a');
      menuItem.href = item.path;
      menuItem.className = 'navbar-dropdown-item';
      if (item.highlight) menuItem.classList.add('dropdown-item-highlight');
      if (item.danger) menuItem.classList.add('dropdown-item-danger');

      menuItem.innerHTML = `
        <span class="dropdown-item-icon">${item.icon}</span>
        <span class="dropdown-item-label">${item.label}</span>
      `;

      menuItem.addEventListener('click', (e) => {
        e.preventDefault();
        this.onNavigate(item.path);
        menu.classList.remove('menu-open');
      });

      dropdown.appendChild(menuItem);
    });

    menu.appendChild(trigger);
    menu.appendChild(dropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove('menu-open');
      }
    });

    return menu;
  }

  /**
   * Set active navigation item
   */
  setActive(path) {
    this.currentPath = path;

    if (this.element) {
      const links = this.element.querySelectorAll('.navbar-link');
      links.forEach(link => {
        link.classList.remove('navbar-link-active');
        if (link.getAttribute('href') === path) {
          link.classList.add('navbar-link-active');
        }
      });
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    if (this.element) {
      const navItems = this.element.querySelector('.navbar-items');
      navItems.classList.toggle('mobile-menu-open', this.isMobileMenuOpen);
    }
  }

  /**
   * Update user tier
   */
  setUserTier(tier) {
    this.userTier = tier;

    if (this.element) {
      const badge = this.element.querySelector('.navbar-tier-badge');
      if (badge) {
        badge.className = `navbar-tier-badge tier-${tier}`;
        badge.textContent = tier.toUpperCase();
      }
    }
  }

  /**
   * Update user name
   */
  setUserName(name) {
    this.userName = name;

    if (this.element) {
      const nameEl = this.element.querySelector('.user-name');
      const avatarEl = this.element.querySelector('.user-avatar');

      if (nameEl) nameEl.textContent = name;
      if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    }
  }

  /**
   * Destroy navbar
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
  }
}

export default Navbar;
