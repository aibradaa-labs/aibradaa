# Contributing to AI Bradaa

Thank you for your interest in contributing to AI Bradaa! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🎨 Enhance UI/UX
- 🔧 Fix issues
- 🌐 Add translations (Bahasa Malaysia support coming soon!)
- 🧪 Write tests
- 🚀 Optimize performance

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Text editor (VS Code recommended)
- Basic knowledge of JavaScript, HTML, CSS

### Setup Development Environment

1. **Fork the repository**

   Click the "Fork" button on GitHub

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/aibradaa.git
   cd aibradaa
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Add your `GEMINI_API_KEY` and other required variables

5. **Run development server**

   ```bash
   npm run dev
   ```

   App will be available at `http://localhost:3000`

---

## 📋 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Comment complex logic
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:api
npm run test:data

# Run linter
npm run lint

# Format code
npm run format
```

### 4. Commit Changes

We use conventional commits:

```bash
git commit -m "feat: add laptop comparison export feature"
git commit -m "fix: resolve price filter bug in Explorer"
git commit -m "docs: update API documentation"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting, semicolons)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance

### 5. Push and Create Pull Request

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub with:
- Clear title and description
- Link to related issue (if any)
- Screenshots (for UI changes)
- Test results

---

## 🎯 Code Guidelines

### JavaScript/ESM

```javascript
// ✅ Good
export class LaptopCard {
  constructor(laptop) {
    this.laptop = laptop;
  }

  render() {
    return `<div class="card">${this.laptop.name}</div>`;
  }
}

// ❌ Avoid
var card = function(laptop) {
  return "<div>" + laptop.name + "</div>";
}
```

**Guidelines:**
- Use ES6+ features (arrow functions, destructuring, modules)
- Use `const` and `let`, avoid `var`
- Prefer template literals over string concatenation
- Use async/await over callbacks
- Add JSDoc comments for public functions

### CSS/Tailwind

```html
<!-- ✅ Good: Use Tailwind utilities -->
<div class="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow">
  <h2 class="text-2xl font-bold text-gray-900">Title</h2>
</div>

<!-- ❌ Avoid: Inline styles -->
<div style="background: white; padding: 24px;">
  <h2 style="font-size: 24px;">Title</h2>
</div>
```

**Guidelines:**
- Use Tailwind utility classes
- Custom CSS only when necessary (in `main.css`)
- Mobile-first responsive design
- Maintain consistent spacing (4px increments)

### HTML

```html
<!-- ✅ Good: Semantic, accessible -->
<nav role="navigation" aria-label="Main navigation">
  <button aria-label="Open menu" class="menu-btn">
    ☰
  </button>
</nav>

<!-- ❌ Avoid: Non-semantic -->
<div class="nav">
  <div onclick="openMenu()">Menu</div>
</div>
```

**Guidelines:**
- Use semantic HTML5 tags
- Include ARIA attributes for accessibility
- Proper heading hierarchy (h1 → h2 → h3)
- Alt text for images

---

## 🧪 Testing

### Writing Tests

All new features should include tests:

```javascript
// tests/example.test.mjs
import { strict as assert } from 'assert';
import { describe, it } from 'node:test';
import { formatCurrency } from '../public/js/utils/helpers.js';

describe('formatCurrency', () => {
  it('should format Malaysian Ringgit correctly', () => {
    const result = formatCurrency(5000);
    assert.strictEqual(result, 'RM 5,000');
  });

  it('should handle decimal values', () => {
    const result = formatCurrency(5000.99);
    assert.strictEqual(result, 'RM 5,001'); // Rounds to nearest RM
  });
});
```

### Test Coverage

Aim for:
- **Unit tests**: Individual functions and classes
- **Integration tests**: API endpoints
- **E2E tests**: Critical user flows (coming in Phase 2)

---

## 📝 Documentation

### Code Comments

```javascript
/**
 * Calculate laptop recommendation score
 * @param {Object} laptop - Laptop object with specs
 * @param {Object} preferences - User preferences
 * @returns {number} Score from 0-100
 */
export function calculateScore(laptop, preferences) {
  // Implementation
}
```

### README Updates

If your change affects setup or usage:
- Update `README.md`
- Update relevant documentation in `docs/`
- Add examples if applicable

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Try to reproduce on latest version
3. Check if it's a known limitation

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120, Safari 17]
- Version: [e.g., 1.0.0]

**Additional Context**
Any other relevant information
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other ways to solve this?

**Additional Context**
Mockups, examples, etc.
```

---

## 🔐 Security

**DO NOT** open public issues for security vulnerabilities.

Instead, email: security@aibradaa.com

We'll respond within 48 hours.

---

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy

### Unacceptable Behavior

- Harassment, discrimination, or trolling
- Publishing others' private information
- Spam or off-topic content
- Any conduct that would be inappropriate professionally

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report issues to: conduct@aibradaa.com

---

## 🎓 Learning Resources

### For Beginners

- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Git Basics](https://git-scm.com/book/en/v2)

### Project-Specific

- [Google Gemini API](https://ai.google.dev/docs)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

---

## 🏆 Recognition

Contributors will be:
- Listed in `CONTRIBUTORS.md`
- Mentioned in release notes
- Given credit in relevant documentation

Significant contributors may become maintainers!

---

## 📞 Getting Help

- **General Questions**: GitHub Discussions
- **Bug Reports**: GitHub Issues
- **Security**: security@aibradaa.com
- **Other**: hello@aibradaa.com

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to AI Bradaa! Together, we're making laptop shopping easier for everyone in Malaysia! 🇲🇾**
