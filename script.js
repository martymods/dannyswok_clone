/*
 * script.js
 *
 * This file contains all of the client side logic for the Danny's Wok clone.
 * It renders the menu on the page, manages a simple shopping cart and
 * integrates with Stripe's Payment Request API to offer Apple Pay and other
 * express checkout options.  To use this integration you will need to
 * replace the placeholder publishable key with your own and implement
 * server‑side code to create PaymentIntent objects.  Without a backend the
 * payment button will not complete a transaction but it will still display
 * the Apple Pay / Google Pay sheet on supported devices for demonstration
 * purposes.
 */

// Define the menu data.  Each category has a unique id, a name and a list
// of items.  Each item contains an id, a name, an optional description and
// a price in dollars.  When adding new items be sure to assign unique ids.
const menuData = [
  {
    id: 'american',
    name: 'American Dishes',
    items: [
      { id: 'A1', name: 'Fried Chicken Wings (4pcs)', price: 6.60 },
      { id: 'A2', name: 'Fried Fish (2pcs)', price: 5.50 },
      { id: 'A3', name: 'Fried Jumbo Shrimp (5pcs)', price: 5.90 },
      { id: 'A4', name: 'Fried Shrimp Basket (15pc)', price: 6.00 },
      { id: 'A5', name: 'Fried Scallops (10pcs)', price: 5.50 },
      { id: 'A6', name: 'Fried Crab Sticks (4pcs)', price: 4.95 },
      { id: 'A7', name: 'BBQ Boneless Ribs', price: 7.95 },
      { id: 'A8', name: 'Spare Rib Tips (Pt)', price: 6.00 },
      { id: 'A9', name: 'Fried Chicken Gizzards', price: 5.00 },
      { id: 'A10', name: 'Fried Chicken Tenders (4pcs)', price: 5.50 },
      { id: 'A11', name: 'Shrimp Teriyaki on Stick (4)', price: 6.00 },
      { id: 'A13', name: 'Chicken Teriyaki on Stick (4)', price: 6.00 },
      { id: 'A14', name: 'French Fries', price: 2.75 },
      { id: 'A15', name: 'BBQ Ribs', price: 8.25 },
    ],
  },
  {
    id: 'appetizer',
    name: 'Appetizer',
    items: [
      { id: 'AP1', name: 'Steak Egg Roll', price: 2.35 },
      { id: 'AP2', name: 'Vegetable Egg Roll (1)', price: 1.85 },
      { id: 'AP3', name: 'Shrimp Egg Roll (1)', price: 2.00 },
      { id: 'AP4', name: 'Spring Roll (3)', price: 3.25 },
      { id: 'AP5', name: 'Fried Crab Rangoon (10)', price: 7.25 },
      { id: 'AP6', name: 'Fried Pork Wonton (10)', price: 6.50 },
      { id: 'AP7', name: 'Pan Fried Wonton w. Garlic Sauce', price: 7.25 },
      { id: 'AP8', name: 'Gyoza (8)', price: 8.75 },
      { id: 'AP9', name: 'Fried/Steamed Dumpling (8)', price: 8.25 },
      { id: 'AP10', name: 'Fried/Steamed Shrimp Dumpling (8)', price: 8.25 },
      { id: 'AP11', name: 'Fried/Steamed Pork Dumplings (8)', price: 7.25 },
      { id: 'AP12', name: 'Pizza Roll', price: 1.85 },
    ],
  },
  {
    id: 'soup',
    name: 'Soup',
    items: [
      { id: 'S13', name: 'Wonton Soup', price: 5.90 },
      { id: 'S13b', name: 'Egg Drop Soup', price: 5.90 },
      { id: 'S14', name: 'Chicken Noodle Soup', price: 5.90 },
      { id: 'S14b', name: 'Chicken Rice Soup', price: 5.90 },
      { id: 'S15', name: 'House Special Soup', price: 7.25 },
      { id: 'S16', name: 'Hot & Sour Soup', price: 5.95 },
      { id: 'S17', name: 'Chicken w. Vegetable Soup', price: 5.75 },
      { id: 'S18', name: 'Seafood Soup', price: 7.75 },
      { id: 'S19', name: 'Chicken Broth', price: 2.75 },
    ],
  },
  {
    id: 'fried-rice',
    name: 'Fried Rice',
    items: [
      { id: 'FR20', name: 'White Rice', price: 2.25 },
      { id: 'FR21', name: 'Brown Rice (No Veggie)', price: 2.25 },
      { id: 'FR22', name: 'Plain Fried Rice (No Veggie)', price: 3.50 },
      { id: 'FR23', name: 'Vegetable Fried Rice', price: 5.75 },
      { id: 'FR24', name: 'Chicken Fried Rice', price: 5.95 },
      { id: 'FR24b', name: 'Pork Fried Rice', price: 5.95 },
      { id: 'FR25', name: 'Beef Fried Rice', price: 6.95 },
      { id: 'FR26', name: 'Shrimp Fried Rice', price: 6.25 },
      { id: 'FR27', name: 'House Fried Rice', price: 6.50 },
      { id: 'FR28', name: 'Yang Chow Fried Rice', price: 6.75 },
      { id: 'FR29', name: 'Pineapple Fried Rice', price: 6.75 },
    ],
  },
  {
    id: 'yat-gaw-mein',
    name: 'Yat Gaw Mein',
    items: [
      { id: 'Y30', name: 'Pork Yat (w. Onion)', price: 6.45 },
      { id: 'Y31', name: 'Chicken Yat (w. Vegetables)', price: 6.45 },
      { id: 'Y32', name: 'Shrimp Yat (w. Vegetables)', price: 6.95 },
      { id: 'Y33', name: 'Beef Yat (w. Vegetables)', price: 6.95 },
      { id: 'Y34', name: 'Plain Yat (w. Onion)', price: 5.50 },
    ],
  },
  {
    id: 'seafood',
    name: 'Seafood',
    items: [
      { id: 'SF35', name: 'Shrimp w. Broccoli', price: 11.95 },
      { id: 'SF36', name: 'Shrimp w. Mixed Veg', price: 11.95 },
      { id: 'SF37', name: 'Curry Shrimp with Onion', price: 11.95 },
      { id: 'SF38', name: 'Shrimp in Szechuan Style', price: 11.95 },
      { id: 'SF39', name: 'Shrimp in Hunan Style', price: 11.95 },
      { id: 'SF40', name: 'Shrimp w. Cashew Nuts', price: 11.95 },
      { id: 'SF41', name: 'Kung Pao Shrimp', price: 11.95 },
      { id: 'SF42', name: 'Shrimp w. Garlic Sauce', price: 11.95 },
      { id: 'SF43', name: 'Shrimp w. Lobster Sauce', price: 11.95 },
    ],
  },
  {
    id: 'beef',
    name: 'Beef',
    items: [
      { id: 'B44', name: 'Beef w. Broccoli', price: 11.95 },
      { id: 'B45', name: 'Pepper Steak with Onion', price: 11.95 },
      { id: 'B46', name: 'Beef w. Mixed Vegs', price: 11.95 },
      { id: 'B47', name: 'Beef in Szechuan Style', price: 11.95 },
      { id: 'B48', name: 'Beef in Hunan Style', price: 11.95 },
      { id: 'B49', name: 'Beef in Garlic Sauce', price: 11.95 },
    ],
  },
  {
    id: 'poultry',
    name: 'Poultry',
    items: [
      { id: 'P50', name: 'Sweet & Sour Chicken', price: 11.95 },
      { id: 'P51', name: 'Chicken w. Broccoli', price: 11.95 },
      { id: 'P52', name: 'Chicken w. Mixed Vegetables', price: 11.95 },
      { id: 'P53', name: 'Curry Chicken w. Onions', price: 11.95 },
      { id: 'P54', name: 'Kung Pao Chicken', price: 11.95 },
      { id: 'P55', name: 'Chicken w. Cashew Nuts', price: 11.95 },
      { id: 'P56', name: 'Chicken in Garlic Sauce', price: 11.95 },
      { id: 'P57', name: 'Chicken in Szechuan Style', price: 11.95 },
      { id: 'P58', name: 'Chicken in Hunan Style', price: 11.95 },
    ],
  },
  {
    id: 'lo-mein',
    name: 'Lo Mein',
    items: [
      { id: 'L67', name: 'Chicken Lo Mein', price: 8.75 },
      { id: 'L68', name: 'Pork Lo Mein', price: 8.75 },
      { id: 'L69', name: 'Shrimp Lo Mein', price: 9.50 },
      { id: 'L70', name: 'Beef Lo Mein', price: 9.50 },
      { id: 'L71', name: 'House Special Lo Mein', price: 10.25 },
      { id: 'L72', name: 'Vegetable Lo Mein', price: 8.25 },
      { id: 'L73', name: 'Plain Lo Mein (No Veggie)', price: 7.95 },
    ],
  },
  {
    id: 'mei-fun-ho-fun',
    name: 'Mei Fun / Ho Fun',
    items: [
      { id: 'M74', name: 'Chicken Mei Fun / Ho Fun', price: 9.50 },
      { id: 'M75', name: 'Pork Mei Fun / Ho Fun', price: 9.50 },
      { id: 'M76', name: 'Shrimp Mei Fun / Ho Fun', price: 9.75 },
      { id: 'M77', name: 'Beef Mei Fun / Ho Fun', price: 9.75 },
      { id: 'M78', name: 'Singapore Mei Fun / Ho Fun', price: 10.50 },
      { id: 'M79', name: 'Vegetable Mei Fun / Ho Fun (No Egg)', price: 8.25 },
    ],
  },
  {
    id: 'egg-foo-young',
    name: 'Egg Foo Young',
    items: [
      { id: 'EF80', name: 'Chicken Egg Foo Young', price: 8.25 },
      { id: 'EF81', name: 'Pork Egg Foo Young', price: 8.25 },
      { id: 'EF82', name: 'Shrimp Egg Foo Young', price: 8.75 },
      { id: 'EF83', name: 'Beef Egg Foo Young', price: 8.75 },
      { id: 'EF84', name: 'Vegetable Egg Foo Young', price: 8.25 },
      { id: 'EF85', name: 'Plain Egg Foo Young', price: 8.75 },
      { id: 'EF86', name: 'House Egg Foo Young', price: 8.95 },
    ],
  },
  {
    id: 'vegetables-tofu',
    name: 'Vegetables & Tofu',
    items: [
      { id: 'VT59', name: 'Mixed Vegetables', price: 8.30 },
      { id: 'VT60', name: 'Plain Broccoli', price: 8.30 },
      { id: 'VT61', name: 'Ma Po Tofu', price: 8.50 },
      { id: 'VT62', name: "General Tao's Tofu", price: 8.50 },
      { id: 'VT63', name: 'Kung Pao Tofu', price: 8.95 },
      { id: 'VT64', name: 'Fried Tofu in Japanese Style', price: 8.95 },
      { id: 'VT65', name: 'Sesame Tofu', price: 8.95 },
      { id: 'VT66', name: 'Home Style Tofu', price: 8.95 },
    ],
  },
  {
    id: 'chef-signatures',
    name: "Chef's Signatures",
    items: [
      { id: 'H1', name: "General Tso's Chicken", price: 11.25 },
      { id: 'H2', name: 'Sesame Chicken', price: 11.25 },
      { id: 'H3', name: 'Bourbon Chicken', price: 11.25 },
      { id: 'H3b', name: 'Mongolian Beef', price: 11.95 },
      { id: 'H4', name: 'Mongolian Chicken', price: 11.95 },
      { id: 'H5', name: 'Mongolia Jumbo Shrimp', price: 11.95 },
      { id: 'H4b', name: "General Tso's Shrimp", price: 12.00 },
      { id: 'H6', name: 'Sesame Shrimp', price: 12.00 },
      { id: 'H7', name: 'Orange Flavored Chicken', price: 11.25 },
      { id: 'H8', name: 'Sizzling Chicken', price: 11.75 },
      { id: 'H9', name: 'Teriyaki Chicken & Noodle', price: 11.75 },
      { id: 'H10', name: 'Four Seasons', price: 13.50 },
      { id: 'H11', name: 'Phoenix & Dragon', price: 13.50 },
      { id: 'H12', name: 'Pineapple Chicken in Bowl', price: 11.50 },
      { id: 'H13', name: 'Seafood Combination', price: 14.50 },
      { id: 'H14', name: 'Happy Family', price: 13.50 },
      { id: 'H15', name: 'Hunan Triple Crown', price: 13.50 },
      { id: 'H16', name: "Danny's Special", price: 12.50 },
    ],
  },
  {
    id: 'whole-wings',
    name: 'Whole Wings',
    items: [
      { id: 'W4', name: '4 Chicken Wings', price: 6.60 },
      { id: 'W8', name: '8 Chicken Wings', price: 13.20 },
      { id: 'W12', name: '12 Chicken Wings', price: 19.80 },
      { id: 'W16', name: '16 Chicken Wings', price: 26.40 },
      { id: 'W20', name: '20 Chicken Wings', price: 33.00 },
    ],
  },
  {
    id: 'party-wing-dings',
    name: 'Party Wing Dings',
    items: [
      { id: 'PD12', name: '12 Wing Dings', price: 9.85 },
      { id: 'PD20', name: '20 Wing Dings', price: 16.40 },
      { id: 'PD30', name: '30 Wing Dings', price: 24.60 },
      { id: 'PD50', name: '50 Wing Dings', price: 41.00 },
      { id: 'PD100', name: '100 Wing Dings', price: 82.00 },
    ],
  },
  {
    id: 'lunch-special',
    name: 'Lunch Special',
    items: [
      { id: 'L1', name: 'Chicken Broccoli', price: 7.85 },
      { id: 'L2', name: 'Chicken w. Black Pepper Sauce', price: 7.85 },
      { id: 'L3', name: 'Chicken Mushroom', price: 7.85 },
      { id: 'L4', name: 'Chicken Bean Curd Black Pepper Sauce', price: 7.85 },
      { id: 'L5', name: 'Chicken Lo Mein', price: 7.85 },
      { id: 'L6', name: 'Curry Chicken', price: 7.85 },
      { id: 'L7', name: 'Chicken Egg Foo Young', price: 7.85 },
      { id: 'L8', name: 'Chicken w. String Bean Black Bean Sauce', price: 7.85 },
      { id: 'L9', name: 'Sweet & Sour Chicken', price: 7.85 },
      { id: 'L10', name: 'Roast Pork Broccoli', price: 7.85 },
      { id: 'L11', name: 'Roast Pork Oyster Sauce', price: 7.85 },
      { id: 'L12', name: 'Roast Pork Mushroom', price: 7.85 },
      { id: 'L13', name: 'Roast Pork with Black Pepper Sauce', price: 7.85 },
      { id: 'L14', name: 'Hunan Chicken', price: 7.85 },
      { id: 'L15', name: 'Szechuan Chicken', price: 7.85 },
      { id: 'L16', name: 'Kung Pao Chicken', price: 7.85 },
      { id: 'L17', name: 'Mongolian Beef', price: 7.85 },
      { id: 'L18', name: 'Chicken w. Garlic Sauce', price: 7.85 },
      { id: 'L19', name: "General Tso's Chicken", price: 7.85 },
      { id: 'L20', name: "General Tso's Tofu", price: 7.85 },
      { id: 'L21', name: 'Sesame Chicken', price: 7.85 },
      { id: 'L22', name: 'Chicken w. Cashew Nuts', price: 7.85 },
      { id: 'L23', name: 'Beef Broccoli', price: 7.85 },
      { id: 'L24', name: 'Pepper Steak', price: 7.85 },
      { id: 'L25', name: 'Beef String Bean Black Bean Sauce', price: 7.85 },
      { id: 'L26', name: 'Beef with Mushroom', price: 7.85 },
      { id: 'L27', name: 'Beef with Oyster Sauce', price: 7.85 },
      { id: 'L28', name: 'Beef Bean Curd with Black Pepper Sauce', price: 7.85 },
      { id: 'L29', name: 'Shrimp Broccoli', price: 7.85 },
      { id: 'L30', name: 'Shrimp Mushroom', price: 7.85 },
      { id: 'L31', name: 'Shrimp Oyster Sauce', price: 7.85 },
      { id: 'L32', name: 'Shrimp with Black Bean Sauce', price: 7.85 },
    ],
  },
  {
    id: 'dinner-combo',
    name: 'Dinner Combo',
    items: [
      { id: 'D1', name: 'Chicken Broccoli', price: 9.50 },
      { id: 'D2', name: 'Chicken w. Black Pepper Sauce', price: 9.50 },
      { id: 'D3', name: 'Chicken Mushroom', price: 9.50 },
      { id: 'D4', name: 'Chicken Bean Curd Black Pepper Sauce', price: 9.50 },
      { id: 'D5', name: 'Chicken Lo Mein', price: 9.50 },
      { id: 'D6', name: 'Curry Chicken', price: 9.50 },
      { id: 'D7', name: 'Chicken Egg Foo Young', price: 9.50 },
      { id: 'D8', name: 'Chicken w. String Bean Black Bean Sauce', price: 9.50 },
      { id: 'D9', name: 'Sweet & Sour Chicken', price: 9.50 },
      { id: 'D10', name: 'Roast Pork Broccoli', price: 9.50 },
      { id: 'D11', name: 'Roast Pork Oyster Sauce', price: 9.50 },
      { id: 'D12', name: 'Roast Pork Mushroom', price: 9.50 },
      { id: 'D13', name: 'Roast Pork with Black Pepper Sauce', price: 9.50 },
      { id: 'D14', name: 'Hunan Chicken', price: 9.50 },
      { id: 'D15', name: 'Szechuan Chicken', price: 9.50 },
      { id: 'D16', name: 'Kung Pao Chicken', price: 9.50 },
      { id: 'D17', name: 'Mongolian Beef', price: 9.50 },
      { id: 'D18', name: 'Chicken w. Garlic Sauce', price: 9.50 },
      { id: 'D19', name: "General Tso's Chicken", price: 9.50 },
      { id: 'D20', name: "General Tso's Tofu", price: 9.50 },
      { id: 'D21', name: 'Sesame Chicken', price: 9.50 },
      { id: 'D22', name: 'Chicken w. Cashew Nuts', price: 9.50 },
      { id: 'D23', name: 'Beef Broccoli', price: 9.50 },
      { id: 'D24', name: 'Pepper Steak', price: 9.50 },
      { id: 'D25', name: 'Beef String Bean Black Bean Sauce', price: 9.50 },
      { id: 'D26', name: 'Beef with Mushroom', price: 9.50 },
      { id: 'D27', name: 'Beef with Oyster Sauce', price: 9.50 },
      { id: 'D28', name: 'Beef Bean Curd with Black Pepper Sauce', price: 9.50 },
      { id: 'D29', name: 'Shrimp Broccoli', price: 9.50 },
      { id: 'D30', name: 'Shrimp Mushroom', price: 9.50 },
      { id: 'D31', name: 'Shrimp Oyster Sauce', price: 9.50 },
      { id: 'D32', name: 'Shrimp with Black Bean Sauce', price: 9.50 },
    ],
  },
];

// Cart state.  Each entry in the cart contains an item id, name, quantity and
// price.  We track unique ids to update quantities rather than adding
// duplicates.
const cart = {};

// Render the menu on the page.
function renderMenu() {
  const menuContainer = document.getElementById('menu');
  menuData.forEach((category) => {
    const section = document.createElement('section');
    section.classList.add('category');
    const header = document.createElement('h2');
    header.textContent = category.name;
    section.appendChild(header);
    const list = document.createElement('ul');
    list.classList.add('menu-items');
    category.items.forEach((item) => {
      const li = document.createElement('li');
      li.classList.add('menu-item');
      const info = document.createElement('div');
      const nameEl = document.createElement('h3');
      nameEl.textContent = item.name;
      const priceEl = document.createElement('span');
      priceEl.classList.add('price');
      priceEl.textContent = `$${item.price.toFixed(2)}`;
      info.appendChild(nameEl);
      info.appendChild(priceEl);
      const addBtn = document.createElement('button');
      addBtn.textContent = 'Add';
      addBtn.addEventListener('click', () => addToCart(item));
      li.appendChild(info);
      li.appendChild(addBtn);
      list.appendChild(li);
    });
    section.appendChild(list);
    menuContainer.appendChild(section);
  });
}

// Add an item to the cart.  If the item already exists, increment the quantity.
function addToCart(item) {
  if (cart[item.id]) {
    cart[item.id].quantity += 1;
  } else {
    cart[item.id] = {
      name: item.name,
      price: item.price,
      quantity: 1,
    };
  }
  updateCart();
}

// Remove an item from the cart entirely
function removeFromCart(id) {
  delete cart[id];
  updateCart();
}

// Update the cart display and totals
function updateCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  cartItemsContainer.innerHTML = '';
  let total = 0;
  Object.keys(cart).forEach((id) => {
    const item = cart[id];
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.quantity}× ${item.name}`;
    const priceSpan = document.createElement('span');
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    priceSpan.textContent = `$${itemTotal.toFixed(2)}`;
    li.appendChild(nameSpan);
    li.appendChild(priceSpan);
    // Add a remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.style.marginLeft = '0.5rem';
    removeBtn.style.backgroundColor = '#e74c3c';
    removeBtn.style.color = '#fff';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '0.25rem';
    removeBtn.style.padding = '0.25rem 0.5rem';
    removeBtn.addEventListener('click', () => removeFromCart(id));
    li.appendChild(removeBtn);
    cartItemsContainer.appendChild(li);
  });
  const totalEl = document.getElementById('cart-total');
  totalEl.textContent = `Total: $${total.toFixed(2)}`;

  // Update the payment request total if the paymentRequest exists
  if (window.paymentRequest) {
    window.paymentRequest.update({
      total: { label: 'Total', amount: Math.round(total * 100) },
      displayItems: Object.keys(cart).map((id) => ({
        label: `${cart[id].quantity}× ${cart[id].name}`,
        amount: Math.round(cart[id].price * cart[id].quantity * 100),
      })),
    });
  }
}

// Initialize Stripe Payment Request.  Replace the publishable key below with
// your Stripe key.  You will also need to implement server side code to
// create PaymentIntent objects in order to complete a payment.  See:
// https://stripe.com/docs/payments/payment-request-api for details.
async function initPaymentRequest(total = 0) {
  if (!window.Stripe) {
    return;
  }
  const stripe = Stripe('pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY');
  const paymentRequest = stripe.paymentRequest({
    country: 'US',
    currency: 'usd',
    total: {
      label: 'Total',
      amount: Math.round(total * 100),
    },
    requestPayerName: true,
    requestPayerEmail: true,
  });
  window.paymentRequest = paymentRequest;
  const elements = stripe.elements();
  const prButton = elements.create('paymentRequestButton', { paymentRequest });
  const result = await paymentRequest.canMakePayment();
  if (result) {
    prButton.mount('#payment-request-button');
  } else {
    document.getElementById('payment-request-button').style.display = 'none';
  }
  paymentRequest.on('paymentmethod', async (ev) => {
    // This is where you would create a PaymentIntent on your server
    // and call ev.complete('success') or ev.complete('fail').  For now
    // we simply thank the customer and reset the cart.
    alert('Payment request received. Implement server side processing to handle payment.');
    ev.complete('success');
    Object.keys(cart).forEach((id) => delete cart[id]);
    updateCart();
  });
}

// Kick off the rendering once the DOM has loaded
document.addEventListener('DOMContentLoaded', () => {
  renderMenu();
  updateCart();
  // Initialize payment request with a zero total; it will be updated when items
  // are added to the cart.
  initPaymentRequest(0);
});