/**
 * Sample E-commerce Cart Module
 * This code has intentional bugs and issues for ABO-84 analysis demo
 */

// Bug 1: Missing 'use strict'
class ShoppingCart {
  constructor() {
    this.items = [];
    this.discount = 0;
  }

  // Bug 2: No input validation
  addItem(item) {
    this.items.push(item);
  }

  // Bug 3: Inefficient algorithm (O(n²) complexity)
  calculateTotal() {
    let total = 0;
    for (let i = 0; i < this.items.length; i++) {
      for (let j = 0; j < this.items.length; j++) {
        if (i === j) {
          total += this.items[i].price * this.items[i].quantity;
        }
      }
    }
    return total - this.discount;
  }

  // Bug 4: Synchronous operation that should be async
  applyDiscount(code) {
    // Simulating API call without async/await
    const discounts = {
      'SAVE10': 10,
      'SAVE20': 20,
      'SPECIAL50': 50
    };

    // Bug 5: No error handling
    this.discount = discounts[code];

    return this.discount;
  }

  // Bug 6: Direct DOM manipulation in business logic
  updateUI() {
    document.getElementById('cart-total').innerHTML = this.calculateTotal();
    document.getElementById('item-count').innerHTML = this.items.length;
  }

  // Bug 7: Memory leak - event listener not removed
  setupEventListeners() {
    const btn = document.getElementById('checkout-btn');
    btn.addEventListener('click', () => {
      this.checkout();
    });
  }

  // Bug 8: Security issue - eval usage
  applyCustomRule(rule) {
    return eval(rule);
  }

  // Bug 9: No null/undefined check
  getItemById(id) {
    return this.items.filter(item => item.id === id)[0];
  }

  // Bug 10: Mutation of input parameter
  removeItem(items) {
    items.pop();
    this.items = items;
  }
}

// Bug 11: Global variable pollution
var cart = new ShoppingCart();

// Bug 12: Using var instead of const/let
for (var i = 0; i < 5; i++) {
  setTimeout(function() {
    console.log(i); // Will always log 5
  }, 100);
}

// Bug 13: Incorrect comparison (should use ===)
function isCartEmpty(cart) {
  return cart.items.length == 0;
}

// Bug 14: No return statement in function that should return
function getCartValue(cart) {
  const total = cart.calculateTotal();
  // Missing return statement
}

// Bug 15: Unused variable
const unusedVariable = "This is never used";

// Export
export default ShoppingCart;
