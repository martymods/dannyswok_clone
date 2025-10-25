/*
 * script.js
 *
 * This file contains all of the client side logic for the Danny's Wok clone.
 * It renders the menu on the page, manages a shopping cart and powers a
 * guided checkout experience for pickup or delivery orders.
 */

// Define the library of menu photography that was supplied for this clone.
// Each filename contains one or two dish names separated by casing.  We use
// the names encoded in the filenames to pair menu entries with imagery.
const fallbackImage = 'images/chinesemenu/store_interior.jpg';
const cartAddSound = typeof Audio === 'function' ? new Audio('audio/wok_register.mp3') : null;
if (cartAddSound) {
  cartAddSound.preload = 'auto';
}

const menuImageSources = [
  'images/chinesemenu/b-b-q_spare_rib_tips_w_fried_rice_Fried_Scallop_w_French_Fries.jpg',
  'images/chinesemenu/beef_w_brocccoli_combo_Shrimp_w_Lobster_Sauce_Combo.jpg',
  'images/chinesemenu/beef_w_broccoli_Pepper_Steak_w_Onion.jpg',
  'images/chinesemenu/beef_w_mixed_vegetables_Beef_w_Snow_Peas.jpg',
  'images/chinesemenu/beef_w_scallop_General_Tso_Chicken.jpg',
  'images/chinesemenu/boneless_spare_ribs_Pu_Pu_Platter.jpg',
  'images/chinesemenu/cheese_wonton_B-B-Q-Spare_Ribs.jpg',
  'images/chinesemenu/chicken_chow_mein_combo_Roast_Pork_Egg_Foo_Young_Combo.jpg',
  'images/chinesemenu/chicken_lo_mein_Beef_Lo_Mein.jpg',
  'images/chinesemenu/chicken_w_garlic_sauce_combo_Shrimp_w_Broccoli_combo.jpg',
  'images/chinesemenu/chicken_w_mixed_vegeteables_Curry_Chicken.jpg',
  'images/chinesemenu/chow_san_shiu_Steamed_Shrimp_w_Mixed_Vegetables.jpg',
  'images/chinesemenu/egg_drop_soup_Wonton_soup.jpg',
  'images/chinesemenu/four_season_Shrimp_Beef_w_Garlic_Sauce.jpg',
  'images/chinesemenu/fried_chicken_wings_w_fried_rice_Fried_Crab_Meat_Sticks_w_French_Fries.jpg',
  'images/chinesemenu/fried_jumbo_shrimp_w_fried_rice_Fried_Baby_Shrimp_w_French_Fries.jpg',
  'images/chinesemenu/fried_onion_rings_Egg_Roll.jpg',
  'images/chinesemenu/home_style_bean_curd_Mixed_Vegetabless.jpg',
  'images/chinesemenu/hot_sour_soup_House_Special_Soup.jpg',
  'images/chinesemenu/house_special_fried_rice_Shrimp_Fried_Rice.jpg',
  'images/chinesemenu/hunan_beef_Shredded_Beef_Szechuan_Style.jpg',
  'images/chinesemenu/kung_pao_chihcken_Chicken_w_Garlic_Sauce.jpg',
  'images/chinesemenu/ma_po_to_fu_Broccoli_w_Garlic_Sauce.jpg',
  'images/chinesemenu/mongolian_beed_Triple_Delight.jpg',
  'images/chinesemenu/moo_goo_gai_pan_Chicken_w_Broccoli.jpg',
  'images/chinesemenu/moo_goo_gai_pan_combo_Pepper_Steak_w_Onion_Combo.jpg',
  'images/chinesemenu/orange_chicken_Sesame_Chicken.jpg',
  'images/chinesemenu/party_tray_buffalo_wings.jpg',
  'images/chinesemenu/party_tray_chicken_w_broccoli.jpg',
  'images/chinesemenu/party_tray_chicken_wing.jpg',
  'images/chinesemenu/party_tray_chicken_wings.jpg',
  'images/chinesemenu/party_tray_fried_rice.jpg',
  'images/chinesemenu/party_tray_gerenral_tso_chicken.jpg',
  'images/chinesemenu/party_tray_shrimp_fried_rice.jpg',
  'images/chinesemenu/party_tray_shrimp_lo_mein.jpg',
  'images/chinesemenu/party_tray_spring_roll.jpg',
  'images/chinesemenu/party_tray_vegetable_lo_mein.jpg',
  'images/chinesemenu/pork_fried_rice_Beef_Fried_Rice.jpg',
  'images/chinesemenu/roast_pork_w_chinese_vegetables_combo_B-B-Q_Spare_Ribs_Combo.jpg',
  'images/chinesemenu/roast_pork_w_chinses_Vegetables_Roast_Pork_w_Snow_Peas.jpg',
  'images/chinesemenu/seafood_combination_Happy_Family.jpg',
  'images/chinesemenu/shrimp_chow_mein_Chicken_Chow_Mein.jpg',
  'images/chinesemenu/shrimp_lo_mein_House_Special_Lo_Mein.jpg',
  'images/chinesemenu/shrimp_mei_fun_Singapore_Mei_Fun.jpg',
  'images/chinesemenu/shrimp_szechuan_shrimp_Shrimp_w_Garlic_Sauce.jpg',
  'images/chinesemenu/shrimp_w_lobster_sauce_Shrimp_w_Chinese_Vegeteable.jpg',
  'images/chinesemenu/shrimp_w_mixed_Vegetable_Shrimp_w_Snow_Pea.jpg',
  'images/chinesemenu/steamed_scallop_shrimp_w_mixed_vegetables_Steamed_Checken_w_Broccoli.jpg',
  'images/chinesemenu/store_interior.jpg',
  'images/chinesemenu/store_interior2.jpg',
  'images/chinesemenu/store_interior3.jpg',
  'images/chinesemenu/sweet_sour_shrimp_Sweet_Sour_Chicken.jpg',
  'images/chinesemenu/vegetable_lo_mein_Pork_Lo_Mein.jpg',
];

function createAvatarDataUri(initials, background, textColor = '#fff') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="${background}"/><text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" font-family="'Google Sans', 'Product Sans', Arial, sans-serif" font-size="42" fill="${textColor}" font-weight="600">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const googleReviews = [
  {
    name: 'Amanda Lopez',
    profileImage: createAvatarDataUri('AL', '#1a73e8'),
    rating: 5,
    comment:
      '“The General Tso\'s Chicken was crispy with just the right kick. Their fried rice is my go-to comfort order and it never disappoints.”',
    foodImage: 'images/chinesemenu/beef_w_scallop_General_Tso_Chicken.jpg',
    foodAlt: 'General Tso\'s Chicken shared by Amanda Lopez',
    highlightDish: 'General Tso\'s Chicken',
  },
  {
    name: 'Marcus Green',
    profileImage: createAvatarDataUri('MG', '#ea4335'),
    rating: 5,
    comment:
      '“Picked up sesame chicken after a long shift—still piping hot when I got home. Portions are huge and the lo mein is full of veggies.”',
    foodImage: 'images/chinesemenu/orange_chicken_Sesame_Chicken.jpg',
    foodAlt: 'Sesame chicken and lo mein shared by Marcus Green',
    highlightDish: 'Sesame Chicken Combo',
  },
  {
    name: 'Priya Patel',
    profileImage: createAvatarDataUri('PP', '#34a853'),
    rating: 4,
    comment:
      '“Loved the vegetable lo mein—fresh, light, and packed with broccoli. Staff was super friendly even during the dinner rush.”',
    foodImage: 'images/chinesemenu/vegetable_lo_mein_Pork_Lo_Mein.jpg',
    foodAlt: 'Vegetable lo mein shared by Priya Patel',
    highlightDish: 'Vegetable Lo Mein',
  },
];

const TOKEN_STOP_WORDS = new Set([
  'w',
  'with',
  'and',
  'in',
  'on',
  'style',
  'sauce',
  'special',
  'combo',
  'dinner',
  'lunch',
  'pt',
  'pc',
  'pcs',
  'qt',
  'platter',
  'bowl',
  'no',
  'veggie',
  'stick',
  'sticks',
  'young',
  'foo',
]);

const TOKEN_REPLACEMENTS = {
  tsos: 'tso',
  tso: 'tso',
  chihcken: 'chicken',
  checken: 'chicken',
  beed: 'beef',
  gerenral: 'general',
  vegetabless: 'vegetable',
  vegeteable: 'vegetable',
  vegeteables: 'vegetable',
  chinses: 'chinese',
  mixed: 'mixed',
};

function sanitizeKey(text) {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeToken(token) {
  const replaced = TOKEN_REPLACEMENTS[token] || token;
  if (replaced.endsWith('ies') && replaced.length > 3) {
    return replaced.slice(0, -3) + 'y';
  }
  if (replaced.endsWith('s') && replaced.length > 3) {
    return replaced.slice(0, -1);
  }
  return replaced;
}

function extractTokens(text) {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token && !TOKEN_STOP_WORDS.has(token) && !/^\d+$/.test(token))
    .map(normalizeToken);
}

function buildImageEntries() {
  const entries = [];
  menuImageSources.forEach((src) => {
    const fileName = src.substring(src.lastIndexOf('/') + 1, src.length - 4);
    const upperIndex = fileName.search(/[A-Z]/);
    const parts = upperIndex === -1
      ? [fileName]
      : [
          fileName.slice(0, upperIndex).replace(/_+$/, ''),
          fileName.slice(upperIndex).replace(/^_+/, ''),
        ];
    parts.forEach((part) => {
      const tokens = Array.from(new Set(extractTokens(part.replace(/_/g, ' '))));
      if (tokens.length) {
        entries.push({ src, tokens: new Set(tokens) });
      }
    });
  });
  return entries;
}

const imageEntries = buildImageEntries();

const manualImageMap = {
  bbq_boneless_ribs: 'images/chinesemenu/boneless_spare_ribs_Pu_Pu_Platter.jpg',
  bbq_ribs: 'images/chinesemenu/boneless_spare_ribs_Pu_Pu_Platter.jpg',
  beef_bean_curd_with_black_pepper_sauce: 'images/chinesemenu/home_style_bean_curd_Mixed_Vegetabless.jpg',
  beef_fried_rice: 'images/chinesemenu/pork_fried_rice_Beef_Fried_Rice.jpg',
  beef_string_bean_black_bean_sauce: 'images/chinesemenu/home_style_bean_curd_Mixed_Vegetabless.jpg',
  beef_yat_w_vegetables: 'images/chinesemenu/beef_w_mixed_vegetables_Beef_w_Snow_Peas.jpg',
  brown_rice_no_veggie: 'images/chinesemenu/party_tray_fried_rice.jpg',
  chicken_bean_curd_black_pepper_sauce: 'images/chinesemenu/home_style_bean_curd_Mixed_Vegetabless.jpg',
  chicken_broth: 'images/chinesemenu/hot_sour_soup_House_Special_Soup.jpg',
  chicken_fried_rice: 'images/chinesemenu/house_special_fried_rice_Shrimp_Fried_Rice.jpg',
  chicken_noodle_soup: 'images/chinesemenu/hot_sour_soup_House_Special_Soup.jpg',
  chicken_rice_soup: 'images/chinesemenu/egg_drop_soup_Wonton_soup.jpg',
  chicken_teriyaki_on_stick_4: 'images/chinesemenu/party_tray_chicken_wing.jpg',
  chicken_w_black_pepper_sauce: 'images/chinesemenu/moo_goo_gai_pan_combo_Pepper_Steak_w_Onion_Combo.jpg',
  chicken_w_cashew_nuts: 'images/chinesemenu/kung_pao_chihcken_Chicken_w_Garlic_Sauce.jpg',
  chicken_w_garlic_sauce_combo: 'images/chinesemenu/chicken_w_garlic_sauce_combo_Shrimp_w_Broccoli_combo.jpg',
  chicken_w_string_bean_black_bean_sauce: 'images/chinesemenu/home_style_bean_curd_Mixed_Vegetabless.jpg',
  chicken_w_vegetable_soup: 'images/chinesemenu/chow_san_shiu_Steamed_Shrimp_w_Mixed_Vegetables.jpg',
  chicken_yat_w_vegetables: 'images/chinesemenu/chicken_w_mixed_vegeteables_Curry_Chicken.jpg',
  curry_shrimp_with_onion: 'images/chinesemenu/chicken_w_mixed_vegeteables_Curry_Chicken.jpg',
  dannys_special: 'images/chinesemenu/party_tray_buffalo_wings.jpg',
  fried_chicken_gizzards: 'images/chinesemenu/fried_chicken_wings_w_fried_rice_Fried_Crab_Meat_Sticks_w_French_Fries.jpg',
  fried_chicken_tenders_4pcs: 'images/chinesemenu/fried_chicken_wings_w_fried_rice_Fried_Crab_Meat_Sticks_w_French_Fries.jpg',
  fried_chicken_wings_4pcs: 'images/chinesemenu/fried_chicken_wings_w_fried_rice_Fried_Crab_Meat_Sticks_w_French_Fries.jpg',
  fried_crab_rangoon_10: 'images/chinesemenu/cheese_wonton_B-B-Q-Spare_Ribs.jpg',
  fried_crab_sticks_4pcs: 'images/chinesemenu/fried_chicken_wings_w_fried_rice_Fried_Crab_Meat_Sticks_w_French_Fries.jpg',
  fried_fish_2pcs: 'images/chinesemenu/fried_jumbo_shrimp_w_fried_rice_Fried_Baby_Shrimp_w_French_Fries.jpg',
  fried_jumbo_shrimp_5pcs: 'images/chinesemenu/fried_jumbo_shrimp_w_fried_rice_Fried_Baby_Shrimp_w_French_Fries.jpg',
  fried_pork_wonton_10: 'images/chinesemenu/cheese_wonton_B-B-Q-Spare_Ribs.jpg',
  fried_scallops_10pcs: 'images/chinesemenu/b-b-q_spare_rib_tips_w_fried_rice_Fried_Scallop_w_French_Fries.jpg',
  fried_shrimp_basket_15pc: 'images/chinesemenu/fried_jumbo_shrimp_w_fried_rice_Fried_Baby_Shrimp_w_French_Fries.jpg',
  fried_tofu_in_japanese_style: 'images/chinesemenu/home_style_bean_curd_Mixed_Vegetabless.jpg',
  fried_steamed_dumpling_8: 'images/chinesemenu/chicken_chow_mein_combo_Roast_Pork_Egg_Foo_Young_Combo.jpg',
  fried_steamed_pork_dumplings_8: 'images/chinesemenu/pork_fried_rice_Beef_Fried_Rice.jpg',
  fried_steamed_shrimp_dumpling_8: 'images/chinesemenu/chow_san_shiu_Steamed_Shrimp_w_Mixed_Vegetables.jpg',
  french_fries: 'images/chinesemenu/b-b-q_spare_rib_tips_w_fried_rice_Fried_Scallop_w_French_Fries.jpg',
  general_taos_tofu: 'images/chinesemenu/beef_w_scallop_General_Tso_Chicken.jpg',
  general_tsos_tofu: 'images/chinesemenu/beef_w_scallop_General_Tso_Chicken.jpg',
  general_tsos_shrimp: 'images/chinesemenu/party_tray_gerenral_tso_chicken.jpg',
  gyoza_8: 'images/chinesemenu/chicken_chow_mein_combo_Roast_Pork_Egg_Foo_Young_Combo.jpg',
  home_style_tofu: 'images/chinesemenu/home_style_bean_curd_Mixed_Vegetabless.jpg',
  house_fried_rice: 'images/chinesemenu/house_special_fried_rice_Shrimp_Fried_Rice.jpg',
  hunan_triple_crown: 'images/chinesemenu/hunan_beef_Shredded_Beef_Szechuan_Style.jpg',
  pan_fried_wonton_w_garlic_sauce: 'images/chinesemenu/chicken_w_garlic_sauce_combo_Shrimp_w_Broccoli_combo.jpg',
  pepper_steak_w_onion_combo: 'images/chinesemenu/moo_goo_gai_pan_combo_Pepper_Steak_w_Onion_Combo.jpg',
  phoenix_and_dragon: 'images/chinesemenu/seafood_combination_Happy_Family.jpg',
  pineapple_fried_rice: 'images/chinesemenu/house_special_fried_rice_Shrimp_Fried_Rice.jpg',
  plain_fried_rice_no_veggie: 'images/chinesemenu/party_tray_fried_rice.jpg',
  plain_yat_w_onion: 'images/chinesemenu/moo_goo_gai_pan_combo_Pepper_Steak_w_Onion_Combo.jpg',
  pork_fried_rice: 'images/chinesemenu/pork_fried_rice_Beef_Fried_Rice.jpg',
  pork_yat_w_onion: 'images/chinesemenu/moo_goo_gai_pan_combo_Pepper_Steak_w_Onion_Combo.jpg',
  seafood_soup: 'images/chinesemenu/seafood_combination_Happy_Family.jpg',
  shrimp_teriyaki_on_stick_4: 'images/chinesemenu/party_tray_shrimp_lo_mein.jpg',
  shrimp_with_black_bean_sauce: 'images/chinesemenu/chow_san_shiu_Steamed_Shrimp_w_Mixed_Vegetables.jpg',
  shrimp_w_cashew_nuts: 'images/chinesemenu/shrimp_szechuan_shrimp_Shrimp_w_Garlic_Sauce.jpg',
  shrimp_w_mixed_veg: 'images/chinesemenu/shrimp_w_mixed_Vegetable_Shrimp_w_Snow_Pea.jpg',
  shrimp_yat_w_vegetables: 'images/chinesemenu/chow_san_shiu_Steamed_Shrimp_w_Mixed_Vegetables.jpg',
  spare_rib_tips_pt: 'images/chinesemenu/b-b-q_spare_rib_tips_w_fried_rice_Fried_Scallop_w_French_Fries.jpg',
  spring_roll_3: 'images/chinesemenu/party_tray_spring_roll.jpg',
  steak_egg_roll: 'images/chinesemenu/fried_onion_rings_Egg_Roll.jpg',
  teriyaki_chicken_and_noodle: 'images/chinesemenu/chicken_lo_mein_Beef_Lo_Mein.jpg',
  vegetable_egg_roll_1: 'images/chinesemenu/fried_onion_rings_Egg_Roll.jpg',
  vegetable_fried_rice: 'images/chinesemenu/party_tray_vegetable_lo_mein.jpg',
  vegetable_mei_fun_ho_fun_no_egg: 'images/chinesemenu/party_tray_vegetable_lo_mein.jpg',
  white_rice: 'images/chinesemenu/party_tray_fried_rice.jpg',
  yang_chow_fried_rice: 'images/chinesemenu/house_special_fried_rice_Shrimp_Fried_Rice.jpg',
  fried_chicken_wings_w_fried_rice: 'images/chinesemenu/fried_chicken_wings_w_fried_rice_Fried_Crab_Meat_Sticks_w_French_Fries.jpg',
  fried_crab_meat_sticks_w_french_fries: 'images/chinesemenu/fried_chicken_wings_w_fried_rice_Fried_Crab_Meat_Sticks_w_French_Fries.jpg',
  fried_scallop_w_french_fries: 'images/chinesemenu/b-b-q_spare_rib_tips_w_fried_rice_Fried_Scallop_w_French_Fries.jpg',
  shrimp_fried_rice: 'images/chinesemenu/house_special_fried_rice_Shrimp_Fried_Rice.jpg',
  house_special_soup: 'images/chinesemenu/hot_sour_soup_House_Special_Soup.jpg',
  shrimp_w_broccoli_combo: 'images/chinesemenu/chicken_w_garlic_sauce_combo_Shrimp_w_Broccoli_combo.jpg',
  chicken_w_garlic_sauce_combo: 'images/chinesemenu/chicken_w_garlic_sauce_combo_Shrimp_w_Broccoli_combo.jpg',
  '4_chicken_wings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '8_chicken_wings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '12_chicken_wings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '16_chicken_wings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '20_chicken_wings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '12_wing_dings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '20_wing_dings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '30_wing_dings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '50_wing_dings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
  '100_wing_dings': 'images/chinesemenu/party_tray_chicken_wings.jpg',
};

function findImageForItem(name) {
  const key = sanitizeKey(name);
  if (manualImageMap[key]) {
    return manualImageMap[key];
  }
  const itemTokens = Array.from(new Set(extractTokens(name)));
  if (!itemTokens.length) {
    return null;
  }
  let bestMatch = null;
  imageEntries.forEach((entry) => {
    let shared = 0;
    itemTokens.forEach((token) => {
      if (entry.tokens.has(token)) {
        shared += 1;
      }
    });
    if (!shared) {
      return;
    }
    const coverage = shared / itemTokens.length;
    if (!bestMatch || coverage > bestMatch.coverage || (coverage === bestMatch.coverage && shared > bestMatch.shared)) {
      bestMatch = { src: entry.src, coverage, shared };
    }
  });
  if (bestMatch && bestMatch.coverage >= 0.5) {
    return bestMatch.src;
  }
  return null;
}

const categoryDescriptions = {
  american: 'Golden fried favourites, wings and ribs cooked the Danny\'s way.',
  appetizer: 'Shareable bites that kick off every meal with bold flavour.',
  soup: 'Comforting soups simmered with fresh vegetables and savoury broths.',
  'fried-rice': 'Classic wok-fried rice with your choice of protein or veggies.',
  'yat-gaw-mein': 'Noodle bowls loaded with protein and savoury broth.',
  seafood: 'Ocean-fresh shrimp and seafood sautéed with crisp vegetables.',
  beef: 'Tender beef stir fried with signature sauces and vegetables.',
  poultry: 'Chicken classics finished with our signature sauces.',
  'lo-mein': 'Soft noodles tossed in house sauce with fresh vegetables.',
  'mei-fun-ho-fun': 'Rice or flat noodles wok-seared with aromatics and spice.',
  'egg-foo-young': 'Fluffy egg patties smothered in rich brown gravy.',
  'vegetables-tofu': 'Vegetable-forward plates and tofu cooked to perfection.',
  'chef-signatures': 'Danny\'s specialities featuring bold flavours and combos.',
  'whole-wings': 'Whole wings fried until crispy on the outside and juicy inside.',
  'party-wing-dings': 'Party-sized wing dings, perfect for sharing.',
  'lunch-special': 'Midday value plates served with rice and classic sides.',
  'dinner-combo': 'Evening combos paired with rice and egg rolls.',
};

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

const menuItemsById = new Map();
menuData.forEach((category) => {
  category.items.forEach((item) => {
    if (!menuItemsById.has(item.id)) {
      menuItemsById.set(item.id, item);
    }
  });
});

function findMenuItemById(id) {
  return menuItemsById.get(id) || null;
}

// Cart state.  Each entry in the cart contains an item id, name, quantity,
// price and any special instructions entered during checkout.  We track
// unique ids to update quantities rather than adding duplicates.
const cart = {};

const EXPRESS_DELIVERY_FEE = 3;
let selectedTipPercent = 0.15;
let selectedTipType = 'percent';
let customTipAmount = 0;
let selectedDeliverySpeed = 'standard';
let selectedPickupTimeOption = 'standard';

function createScheduleState() {
  return {
    date: null,
    time: '',
    pendingTime: '',
    confirmed: false,
  };
}

const scheduleStates = {
  pickup: createScheduleState(),
  delivery: createScheduleState(),
};

let activeScheduleContext = 'delivery';

const calendarState = {
  current: startOfMonth(new Date()),
  selected: null,
};

function getScheduleState(context = activeScheduleContext) {
  return scheduleStates[context];
}

function getScheduleContextLabel(context) {
  return context === 'pickup' ? 'pickup' : 'delivery';
}

function getScheduleContextTitle(context) {
  return context === 'pickup' ? 'Pickup' : 'Delivery';
}

function setActiveScheduleContext(context) {
  activeScheduleContext = context;
  const state = getScheduleState();
  const referenceDate = state.date ? startOfDay(state.date) : state.date;
  if (referenceDate) {
    calendarState.selected = startOfDay(referenceDate);
    calendarState.current = startOfMonth(referenceDate);
  } else {
    calendarState.selected = null;
    calendarState.current = startOfMonth(new Date());
  }
  if (!state.pendingTime && state.confirmed && state.time) {
    state.pendingTime = state.time;
  }
  const timeInput = document.getElementById('schedule-time');
  if (timeInput) {
    timeInput.value = state.pendingTime || '';
  }
}

function calculateCartTotals() {
  let total = 0;
  let count = 0;
  Object.values(cart).forEach((item) => {
    total += item.price * item.quantity;
    count += item.quantity;
  });
  return { total, count };
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date) {
  const first = startOfDay(date);
  first.setDate(1);
  return first;
}

function sameDay(a, b) {
  return Boolean(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

const scheduleDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

function formatScheduleDate(date) {
  return scheduleDateFormatter.format(date);
}

function formatDisplayTime(timeValue) {
  if (timeValue instanceof Date) {
    return timeValue.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (typeof timeValue !== 'string') {
    return '';
  }
  const [hours, minutes] = timeValue.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return timeValue;
  }
  const temp = new Date();
  temp.setHours(hours, minutes, 0, 0);
  return temp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const calendarDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function setScheduleSummary(text, variant = 'info') {
  const summary = document.getElementById('schedule-summary');
  if (!summary) {
    return;
  }
  summary.textContent = text || '';
  summary.classList.remove('is-warning', 'is-confirmed');
  if (variant === 'warning') {
    summary.classList.add('is-warning');
  } else if (variant === 'success') {
    summary.classList.add('is-confirmed');
  }
}

function updateScheduleSummary() {
  const scheduleContainer = document.getElementById('schedule-container');
  if (!scheduleContainer || scheduleContainer.classList.contains('hidden')) {
    return;
  }
  const context = activeScheduleContext;
  const state = getScheduleState();
  const label = getScheduleContextLabel(context);
  const title = getScheduleContextTitle(context);
  if (!calendarState.selected) {
    setScheduleSummary(`Select a ${label} date to begin.`, 'info');
    return;
  }
  if (!state.pendingTime) {
    setScheduleSummary(`${title} date set to ${formatScheduleDate(calendarState.selected)}. Choose a ${label} time.`, 'info');
    return;
  }
  if (state.confirmed && state.date && state.time) {
    setScheduleSummary(`${title} scheduled for ${formatScheduleDate(state.date)} at ${formatDisplayTime(state.time)}.`, 'success');
    return;
  }
  setScheduleSummary(
    `Selected ${formatScheduleDate(calendarState.selected)} at ${formatDisplayTime(state.pendingTime)}. Save to confirm.`,
    'warning',
  );
}

function selectCalendarDate(date) {
  const normalized = startOfDay(date);
  calendarState.selected = normalized;
  const state = getScheduleState();
  state.confirmed = false;
  state.date = new Date(normalized);
  if (
    normalized.getFullYear() !== calendarState.current.getFullYear() ||
    normalized.getMonth() !== calendarState.current.getMonth()
  ) {
    calendarState.current = startOfMonth(normalized);
  }
  updateScheduleSummary();
  renderCalendar();
}

function changeCalendarMonth(offset) {
  const base = calendarState.current || startOfMonth(new Date());
  calendarState.current = startOfMonth(new Date(base.getFullYear(), base.getMonth() + offset, 1));
  renderCalendar();
}

function resetCalendarMonth() {
  calendarState.current = startOfMonth(new Date());
  renderCalendar();
}

function renderCalendar() {
  const mount = document.getElementById('calendar');
  if (!mount) {
    return;
  }
  const monthDate = calendarState.current || startOfMonth(new Date());
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const startIndex = (firstDay.getDay() + 6) % 7; // Monday-first
  const totalCells = 42;
  const today = startOfDay(new Date());

  const calendar = document.createElement('div');
  calendar.className = 'calendar';

  const nav = document.createElement('nav');
  nav.className = 'calendar--nav';

  const prev = document.createElement('a');
  prev.innerHTML = '&#8249;';
  prev.setAttribute('aria-label', 'Previous month');
  prev.addEventListener('click', () => changeCalendarMonth(-1));

  const next = document.createElement('a');
  next.innerHTML = '&#8250;';
  next.setAttribute('aria-label', 'Next month');
  next.addEventListener('click', () => changeCalendarMonth(1));

  const heading = document.createElement('h1');
  heading.innerHTML = `${monthDate.toLocaleString('default', { month: 'long' })} <small>${year}</small>`;
  heading.addEventListener('click', () => resetCalendarMonth());

  nav.appendChild(prev);
  nav.appendChild(heading);
  nav.appendChild(next);

  const daysNav = document.createElement('nav');
  daysNav.className = 'calendar--days';

  calendarDayLabels.forEach((label) => {
    const span = document.createElement('span');
    span.className = 'label';
    span.textContent = label;
    daysNav.appendChild(span);
  });

  const appendDay = (date, muted = false) => {
    const span = document.createElement('span');
    span.textContent = String(date.getDate());
    if (muted) {
      span.classList.add('muted');
    }
    if (sameDay(date, today)) {
      span.classList.add('today');
    }
    if (calendarState.selected && sameDay(date, calendarState.selected)) {
      span.classList.add('selected');
    }
    span.addEventListener('click', () => selectCalendarDate(date));
    daysNav.appendChild(span);
  };

  for (let i = 0; i < startIndex; i += 1) {
    const dayNumber = previousMonthDays - startIndex + 1 + i;
    appendDay(new Date(year, month - 1, dayNumber), true);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    appendDay(new Date(year, month, day));
  }

  const filledCells = startIndex + daysInMonth;
  const trailing = totalCells - filledCells;
  for (let i = 1; i <= trailing; i += 1) {
    appendDay(new Date(year, month + 1, i), true);
  }

  calendar.appendChild(nav);
  calendar.appendChild(daysNav);

  mount.innerHTML = '';
  mount.appendChild(calendar);
}

function handleScheduleSave() {
  const context = activeScheduleContext;
  const state = getScheduleState();
  const label = getScheduleContextLabel(context);
  const title = getScheduleContextTitle(context);
  if (!calendarState.selected) {
    setScheduleSummary(`Select a ${label} date before saving.`, 'warning');
    return;
  }
  if (!state.pendingTime) {
    setScheduleSummary(`Choose a ${label} time before saving.`, 'warning');
    return;
  }
  const [hours, minutes] = state.pendingTime.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    setScheduleSummary('Enter a valid time.', 'warning');
    return;
  }
  const selection = new Date(calendarState.selected);
  selection.setHours(hours, minutes, 0, 0);
  if (selection < new Date()) {
    setScheduleSummary(`Please pick a ${label} time in the future.`, 'warning');
    return;
  }
  state.date = selection;
  state.time = state.pendingTime;
  state.confirmed = true;
  calendarState.selected = startOfDay(selection);
  calendarState.current = startOfMonth(selection);
  state.pendingTime = state.time;
  updateScheduleSummary();
  renderCalendar();
}

function setTimePreference(context, value) {
  if (context === 'delivery') {
    selectedDeliverySpeed = value;
  } else {
    selectedPickupTimeOption = value;
  }
  const scheduleContainer = document.getElementById('schedule-container');
  const state = getScheduleState(context);
  const shouldShow = value === 'schedule';
  if (shouldShow) {
    setActiveScheduleContext(context);
    if (scheduleContainer) {
      scheduleContainer.classList.remove('hidden');
      scheduleContainer.setAttribute('aria-hidden', 'false');
      renderCalendar();
      updateScheduleSummary();
    }
  } else {
    if (!state.confirmed) {
      state.pendingTime = '';
    } else {
      state.pendingTime = state.time;
    }
    if (scheduleContainer && activeScheduleContext === context) {
      scheduleContainer.classList.add('hidden');
      scheduleContainer.setAttribute('aria-hidden', 'true');
      setScheduleSummary('', 'info');
    }
  }
  updateCheckoutView();
}

function setDeliverySpeed(value) {
  setTimePreference('delivery', value);
}

function setPickupTimePreference(value) {
  setTimePreference('pickup', value);
}

function updateItemQuantity(id, quantity) {
  const numericQuantity = Number(quantity);
  if (!Number.isFinite(numericQuantity)) {
    return;
  }
  if (numericQuantity <= 0) {
    removeFromCart(id);
    return;
  }
  if (cart[id]) {
    cart[id].quantity = Math.floor(numericQuantity);
    updateCart();
  }
}

// Utility: activate a tab by id
function activateTab(targetId) {
  const links = document.querySelectorAll('#menuTab .nav-link');
  const panes = document.querySelectorAll('#menuTabContent .tab-pane');
  links.forEach((link) => {
    if (link.dataset.target === targetId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  panes.forEach((pane) => {
    if (pane.id === targetId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

// Render the menu on the page.
function renderMenu() {
  const tabList = document.getElementById('menuTab');
  const tabContent = document.getElementById('menuTabContent');
  if (!tabList || !tabContent) {
    return;
  }
  tabList.innerHTML = '';
  tabContent.innerHTML = '';

  menuData.forEach((category, catIndex) => {
    const navItem = document.createElement('li');
    navItem.classList.add('nav-item');

    const navLink = document.createElement('button');
    navLink.type = 'button';
    navLink.classList.add('nav-link');
    navLink.textContent = category.name;
    navLink.dataset.target = category.id;
    if (catIndex === 0) {
      navLink.classList.add('active');
    }
    navLink.addEventListener('click', () => activateTab(category.id));

    navItem.appendChild(navLink);
    tabList.appendChild(navItem);

    const pane = document.createElement('div');
    pane.classList.add('tab-pane');
    if (catIndex === 0) {
      pane.classList.add('active');
    }
    pane.id = category.id;

    const row = document.createElement('div');
    row.classList.add('row');

    category.items.forEach((item, itemIndex) => {
      const col = document.createElement('div');
      col.classList.add('col-md-6');

      const singleMenu = document.createElement('div');
      singleMenu.classList.add('single_menu');

      const img = document.createElement('img');
      const matchedImage = findImageForItem(item.name);
      img.src = matchedImage || fallbackImage;
      img.alt = item.name;

      const content = document.createElement('div');
      content.classList.add('menu_content');

      const title = document.createElement('h4');
      title.textContent = item.name;
      const priceEl = document.createElement('span');
      priceEl.textContent = `$${item.price.toFixed(2)}`;
      title.appendChild(priceEl);

      const description = document.createElement('p');
      description.textContent = categoryDescriptions[category.id] || 'Freshly prepared and served hot.';

      const addBtn = document.createElement('button');
      addBtn.classList.add('add-btn');
      addBtn.textContent = 'Add to cart';
      addBtn.addEventListener('click', () => addToCart(item, { imageElement: img }));

      content.appendChild(title);
      content.appendChild(description);
      content.appendChild(addBtn);

      singleMenu.appendChild(img);
      singleMenu.appendChild(content);
      col.appendChild(singleMenu);
      row.appendChild(col);
    });

    pane.appendChild(row);
    tabContent.appendChild(pane);
  });
}

function buildHeroCarousel() {
  const track = document.getElementById('hero-track');
  const carousel = document.getElementById('hero-carousel');
  if (!track || !carousel) {
    return;
  }

  track.innerHTML = '';
  carousel.classList.remove('is-hidden');

  const items = Array.from(menuItemsById.values());
  if (!items.length) {
    carousel.classList.add('is-hidden');
    return;
  }

  const menuSlides = items.map((item) => ({
    type: 'menu',
    item,
    image: findImageForItem(item.name) || fallbackImage,
  }));

  const reviewSlides = googleReviews.map((review) => ({
    type: 'review',
    review,
  }));

  const combinedSlides = insertReviewSlides(menuSlides, reviewSlides);

  const pointerCoarse = window.matchMedia('(pointer: coarse)');
  const compactWidth = window.matchMedia('(max-width: 768px)');
  const useSwipeMode = pointerCoarse.matches || compactWidth.matches;
  const slidesToRender = useSwipeMode
    ? combinedSlides
    : combinedSlides.concat(combinedSlides);

  slidesToRender.forEach((slide) => {
    if (slide.type === 'review') {
      track.appendChild(createReviewCard(slide.review));
      return;
    }

    const { item, image } = slide;
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('hero-card');
    button.title = `Add ${item.name} to cart`;
    button.setAttribute('aria-label', `Add ${item.name} to cart`);

    const img = document.createElement('img');
    img.src = image;
    img.alt = item.name;
    img.loading = 'lazy';
    img.decoding = 'async';

    const info = document.createElement('div');
    info.classList.add('hero-card-info');

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('hero-card-name');
    nameSpan.textContent = item.name;

    const priceSpan = document.createElement('span');
    priceSpan.classList.add('hero-card-price');
    priceSpan.textContent = `$${item.price.toFixed(2)}`;

    info.appendChild(nameSpan);
    info.appendChild(priceSpan);

    button.appendChild(img);
    button.appendChild(info);
    button.addEventListener('click', () => addToCart(item, { imageElement: img }));
    track.appendChild(button);
  });

  const duration = Math.min(140, Math.max(45, items.length * 1.2));
  track.style.setProperty('--hero-duration', `${duration}s`);

  if (useSwipeMode) {
    track.dataset.mode = 'swipe';
    carousel.classList.add('is-touch');
    if (typeof carousel.scrollTo === 'function') {
      carousel.scrollTo({ left: 0, behavior: 'auto' });
    } else {
      carousel.scrollLeft = 0;
    }
  } else {
    track.removeAttribute('data-mode');
    carousel.classList.remove('is-touch');
    track.style.removeProperty('transform');
  }
}

function insertReviewSlides(menuSlides, reviewSlides) {
  const workingSlides = menuSlides.slice();
  reviewSlides.forEach((reviewSlide) => {
    const insertAt = Math.floor(Math.random() * (workingSlides.length + 1));
    workingSlides.splice(insertAt, 0, reviewSlide);
  });
  return workingSlides;
}

function createStarRatingElement(rating) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('hero-review-stars');
  wrapper.setAttribute('aria-label', `${rating} star rating on Google`);
  for (let i = 1; i <= 5; i += 1) {
    const star = document.createElement('span');
    star.classList.add('hero-review-star');
    star.textContent = i <= rating ? '★' : '☆';
    wrapper.appendChild(star);
  }
  return wrapper;
}

function createReviewCard(review) {
  const card = document.createElement('article');
  card.classList.add('hero-card', 'hero-card--review');
  card.setAttribute('aria-label', `Google review from ${review.name}`);

  const foodImage = document.createElement('img');
  foodImage.src = review.foodImage;
  foodImage.alt = review.foodAlt || `Dish shared by ${review.name}`;
  foodImage.loading = 'lazy';
  foodImage.decoding = 'async';

  const info = document.createElement('div');
  info.classList.add('hero-card-info', 'hero-card-info--review');

  const header = document.createElement('div');
  header.classList.add('hero-review-header');

  const avatar = document.createElement('img');
  avatar.src = review.profileImage;
  avatar.alt = `${review.name}'s Google profile photo`;
  avatar.classList.add('hero-review-avatar');
  avatar.loading = 'lazy';
  avatar.decoding = 'async';

  const meta = document.createElement('div');
  meta.classList.add('hero-review-meta');

  const name = document.createElement('span');
  name.classList.add('hero-review-name');
  name.textContent = review.name;

  const source = document.createElement('span');
  source.classList.add('hero-review-source');
  source.textContent = 'Google Reviews';

  const stars = createStarRatingElement(review.rating);

  meta.appendChild(name);
  meta.appendChild(source);
  meta.appendChild(stars);

  header.appendChild(avatar);
  header.appendChild(meta);

  const body = document.createElement('p');
  body.classList.add('hero-review-text');
  body.textContent = review.comment;

  info.appendChild(header);
  info.appendChild(body);

  if (review.highlightDish) {
    const dish = document.createElement('span');
    dish.classList.add('hero-review-dish');
    dish.textContent = `⭐ ${review.highlightDish}`;
    info.appendChild(dish);
  }

  card.appendChild(foodImage);
  card.appendChild(info);

  return card;
}

// Add an item to the cart.  If the item already exists, increment the quantity.
function addToCart(item, options = {}) {
  if (cart[item.id]) {
    cart[item.id].quantity += 1;
  } else {
    cart[item.id] = {
      name: item.name,
      price: item.price,
      quantity: 1,
      instructions: '',
    };
  }
  updateCart();
  celebrateCartScore(options.imageElement);
  animateItemImage(options.imageElement);
  playCartSound();
}

function playCartSound() {
  if (!cartAddSound) {
    return;
  }

  try {
    cartAddSound.currentTime = 0;
    const playPromise = cartAddSound.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.catch(() => {});
    }
  } catch (error) {
    // Ignore errors triggered by autoplay restrictions or unsupported playback.
  }
}

function animateItemImage(imageElement) {
  if (!imageElement) {
    return;
  }
  imageElement.classList.remove('photo-press');
  // Force a reflow so the animation can replay if the user taps repeatedly.
  void imageElement.offsetWidth;
  imageElement.classList.add('photo-press');
  imageElement.addEventListener(
    'animationend',
    () => {
      imageElement.classList.remove('photo-press');
    },
    { once: true }
  );
}

function celebrateCartScore(imageElement) {
  const cartIcon = document.getElementById('cart-icon-button');
  if (!imageElement || !cartIcon) {
    return;
  }

  const prefersReducedMotion =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
  if (prefersReducedMotion && prefersReducedMotion.matches) {
    cartIcon.classList.add('score-pop');
    window.setTimeout(() => {
      cartIcon.classList.remove('score-pop');
    }, 400);
    return;
  }

  const sourceRect = imageElement.getBoundingClientRect();
  const targetRect = cartIcon.getBoundingClientRect();

  if (!sourceRect.width || !sourceRect.height) {
    return;
  }

  const ghost = document.createElement('img');
  ghost.src = imageElement.currentSrc || imageElement.src;
  ghost.className = 'flying-cart-image';
  ghost.alt = '';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.style.width = `${sourceRect.width}px`;
  ghost.style.height = `${sourceRect.height}px`;
  ghost.style.left = `${sourceRect.left}px`;
  ghost.style.top = `${sourceRect.top}px`;

  document.body.appendChild(ghost);

  const deltaX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
  const deltaY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);

  const animation = ghost.animate(
    [
      {
        transform: 'translate(0, 0) scale(1)',
        opacity: 0.95,
        filter: 'drop-shadow(0 12px 18px rgba(0, 0, 0, 0.18))',
      },
      {
        transform: `translate(${deltaX}px, ${deltaY}px) scale(0.25)`,
        opacity: 0,
        filter: 'drop-shadow(0 8px 18px rgba(255, 214, 122, 0.45))',
      },
    ],
    {
      duration: 640,
      easing: 'cubic-bezier(0.21, 0.61, 0.45, 0.98)',
      fill: 'forwards',
    }
  );

  animation.onfinish = () => {
    ghost.remove();
    cartIcon.classList.add('score-pop');
    cartIcon.addEventListener(
      'animationend',
      () => {
        cartIcon.classList.remove('score-pop');
      },
      { once: true }
    );
  };
  animation.oncancel = () => {
    ghost.remove();
  };
}

// Remove an item from the cart entirely
function removeFromCart(id) {
  delete cart[id];
  updateCart();
}

// Update the cart display and totals
function updateCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyState = document.getElementById('cart-empty');
  const cartHeading = document.querySelector('#cart > h2');
  const cartSummary = document.querySelector('.cart-summary');
  if (!cartItemsContainer) {
    return;
  }
  cartItemsContainer.innerHTML = '';
  const { total, count } = calculateCartTotals();
  const entries = Object.keys(cart);
  const hasItems = entries.length > 0;
  if (cartSummary) {
    cartSummary.classList.toggle('is-hidden', !hasItems);
    cartSummary.setAttribute('aria-hidden', String(!hasItems));
  }
  if (cartHeading) {
    cartHeading.classList.toggle('is-hidden', !hasItems);
    cartHeading.setAttribute('aria-hidden', String(!hasItems));
  }
  cartItemsContainer.style.display = entries.length ? 'block' : 'none';
  entries.forEach((id) => {
    const item = cart[id];
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${item.quantity}× ${item.name}`;
    const priceSpan = document.createElement('span');
    const itemTotal = item.price * item.quantity;
    priceSpan.textContent = `$${itemTotal.toFixed(2)}`;
    li.appendChild(nameSpan);
    li.appendChild(priceSpan);
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeFromCart(id));
    li.appendChild(removeBtn);
    cartItemsContainer.appendChild(li);
  });
  const totalEl = document.getElementById('cart-total');
  if (totalEl) {
    totalEl.textContent = `Total: $${total.toFixed(2)}`;
  }

  if (emptyState) {
    emptyState.classList.add('is-hidden');
    emptyState.setAttribute('aria-hidden', 'true');
  }

  const cartCountEl = document.getElementById('cart-count');
  if (cartCountEl) {
    cartCountEl.textContent = count;
  }

  const checkoutButton = document.getElementById('checkout-button');
  if (checkoutButton) {
    checkoutButton.disabled = !hasItems;
  }

  updateCheckoutView();
  applyCartGlow(count, total);
}

function applyCartGlow(count, total) {
  const glowStrength = Math.min(1, Math.max(count / 10, total / 200));
  const glowAlpha = glowStrength > 0 ? 0.25 + glowStrength * 0.55 : 0;

  const cartIcon = document.getElementById('cart-icon-button');
  if (cartIcon) {
    cartIcon.style.setProperty('--glow-strength', glowStrength.toFixed(3));
    cartIcon.style.setProperty('--glow-alpha', glowAlpha.toFixed(3));
    cartIcon.classList.toggle('is-glowing', glowStrength > 0);
  }

}

function toggleDeliveryFields(isDelivery) {
  const deliveryFields = document.getElementById('delivery-fields');
  if (deliveryFields) {
    deliveryFields.classList.toggle('hidden', !isDelivery);
  }
  const pickupWrapper = document.getElementById('pickup-time-wrapper');
  if (pickupWrapper) {
    pickupWrapper.classList.toggle('hidden', isDelivery);
  }
  const tipSection = document.querySelector('.tip-section');
  if (tipSection) {
    tipSection.classList.toggle('hidden', !isDelivery);
  }
  const tipTotalRow = document.getElementById('tip-total-row');
  if (tipTotalRow) {
    tipTotalRow.classList.toggle('hidden', !isDelivery);
  }
  const scheduleContainer = document.getElementById('schedule-container');
  if (isDelivery) {
    if (scheduleContainer && !scheduleContainer.classList.contains('hidden') && activeScheduleContext !== 'delivery') {
      scheduleContainer.classList.add('hidden');
      scheduleContainer.setAttribute('aria-hidden', 'true');
    }
    const selectedDelivery = document.querySelector('input[name="delivery-time"]:checked');
    if (selectedDelivery) {
      setDeliverySpeed(selectedDelivery.value);
    } else {
      setDeliverySpeed(selectedDeliverySpeed);
    }
  } else {
    if (scheduleContainer && !scheduleContainer.classList.contains('hidden') && activeScheduleContext !== 'pickup') {
      scheduleContainer.classList.add('hidden');
      scheduleContainer.setAttribute('aria-hidden', 'true');
      setScheduleSummary('', 'info');
    }
    const selectedPickup = document.querySelector('input[name="pickup-time"]:checked');
    if (selectedPickup) {
      setPickupTimePreference(selectedPickup.value);
    } else {
      setPickupTimePreference(selectedPickupTimeOption);
    }
  }
  updateCheckoutView();
}

function toggleCheckoutPanel(open) {
  const checkoutPanel = document.getElementById('checkout-panel');
  if (!checkoutPanel) {
    return;
  }
  checkoutPanel.classList.toggle('hidden', !open);
  checkoutPanel.setAttribute('aria-hidden', String(!open));
  if (open) {
    updateCheckoutView();
    const panelTop = checkoutPanel.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: panelTop - 16, behavior: 'smooth' });
  }
}

function updateCheckoutView() {
  const checkoutItems = document.getElementById('checkout-items');
  const checkoutTotal = document.getElementById('checkout-total-amount');
  const placeOrderBtn = document.getElementById('place-order');
  if (!checkoutItems || !checkoutTotal) {
    return;
  }
  checkoutItems.innerHTML = '';
  const entries = Object.keys(cart);
  if (!entries.length) {
    const empty = document.createElement('p');
    empty.classList.add('cart-empty');
    empty.textContent = 'Add a few dishes to begin your order.';
    checkoutItems.appendChild(empty);
    checkoutTotal.textContent = '$0.00';
    const subtotalEl = document.getElementById('checkout-subtotal-amount');
    const tipSummaryEl = document.getElementById('tip-amount');
    const tipAmountEl = document.getElementById('checkout-tip-amount');
    const deliveryFeeRow = document.getElementById('delivery-fee-row');
    const deliveryFeeAmount = document.getElementById('delivery-fee-amount');
    if (subtotalEl) {
      subtotalEl.textContent = '$0.00';
    }
    if (tipSummaryEl) {
      tipSummaryEl.textContent = '$0.00';
    }
    if (tipAmountEl) {
      tipAmountEl.textContent = '$0.00';
    }
    if (deliveryFeeRow) {
      deliveryFeeRow.classList.add('hidden');
    }
    if (deliveryFeeAmount) {
      deliveryFeeAmount.textContent = formatCurrency(EXPRESS_DELIVERY_FEE);
    }
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
    }
    return;
  }
  if (placeOrderBtn) {
    placeOrderBtn.disabled = false;
  }
  entries.forEach((id) => {
    const item = cart[id];
    if (typeof item.instructions !== 'string') {
      item.instructions = '';
    }
    const wrapper = document.createElement('div');
    wrapper.classList.add('checkout-item');

    const image = document.createElement('img');
    image.src = findImageForItem(item.name) || fallbackImage;
    image.alt = item.name;

    const details = document.createElement('div');
    details.classList.add('checkout-item-details');
    const title = document.createElement('h4');
    title.textContent = item.name;
    const price = document.createElement('span');
    price.textContent = `$${item.price.toFixed(2)} each`;
    details.appendChild(title);
    details.appendChild(price);

    const instructionsWrapper = document.createElement('div');
    instructionsWrapper.classList.add('instructions-wrapper');

    const instructionsId = `instructions-${id}`;
    const instructionsLabel = document.createElement('label');
    instructionsLabel.classList.add('instructions-label');
    instructionsLabel.htmlFor = instructionsId;
    instructionsLabel.textContent = 'Special Instructions';

    const instructionsNote = document.createElement('p');
    instructionsNote.classList.add('instructions-note');
    instructionsNote.id = `${instructionsId}-note`;
    instructionsNote.textContent = 'Please note: requests for additional items or special preparation may incur an extra charge that will be calculated on your online order.';

    const textarea = document.createElement('textarea');
    textarea.id = instructionsId;
    textarea.classList.add('instructions-textarea');
    textarea.rows = 3;
    textarea.placeholder = 'Add a request, for example “No onions”.';
    textarea.value = item.instructions;
    textarea.setAttribute('aria-describedby', instructionsNote.id);

    const actions = document.createElement('div');
    actions.classList.add('instructions-actions');

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.classList.add('instructions-save');
    saveBtn.textContent = 'Save request';

    const status = document.createElement('span');
    status.classList.add('instructions-status');
    status.setAttribute('aria-live', 'polite');

    let savedValue = item.instructions || '';

    const refreshStatus = () => {
      const currentValue = textarea.value.trim();
      const hasUnsavedChanges = currentValue !== savedValue;
      saveBtn.disabled = !hasUnsavedChanges;
      status.textContent = hasUnsavedChanges
        ? 'Unsaved request'
        : savedValue
          ? 'Request saved'
          : '';
      status.classList.toggle('is-pending', hasUnsavedChanges);
      status.classList.toggle('is-saved', !hasUnsavedChanges && Boolean(savedValue));
    };

    textarea.addEventListener('input', refreshStatus);

    saveBtn.addEventListener('click', () => {
      savedValue = textarea.value.trim();
      cart[id].instructions = savedValue;
      item.instructions = savedValue;
      textarea.value = savedValue;
      refreshStatus();
    });

    actions.appendChild(saveBtn);
    actions.appendChild(status);

    instructionsWrapper.appendChild(instructionsLabel);
    instructionsWrapper.appendChild(instructionsNote);
    instructionsWrapper.appendChild(textarea);
    instructionsWrapper.appendChild(actions);
    details.appendChild(instructionsWrapper);

    refreshStatus();

    const quantity = document.createElement('div');
    quantity.classList.add('checkout-quantity');
    const controls = document.createElement('div');
    controls.classList.add('quantity-controls');

    const minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.textContent = '–';
    minusBtn.addEventListener('click', () => updateItemQuantity(id, item.quantity - 1));

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = item.quantity;
    input.addEventListener('change', (event) => {
      updateItemQuantity(id, event.target.value);
      event.target.value = cart[id] ? cart[id].quantity : 0;
    });

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.textContent = '+';
    plusBtn.addEventListener('click', () => updateItemQuantity(id, item.quantity + 1));

    controls.appendChild(minusBtn);
    controls.appendChild(input);
    controls.appendChild(plusBtn);

    const itemTotal = document.createElement('div');
    itemTotal.classList.add('checkout-item-total');
    itemTotal.textContent = `$${(item.price * item.quantity).toFixed(2)}`;

    quantity.appendChild(controls);
    quantity.appendChild(itemTotal);

    wrapper.appendChild(image);
    wrapper.appendChild(details);
    wrapper.appendChild(quantity);
    checkoutItems.appendChild(wrapper);
  });

  const { total } = calculateCartTotals();
  const subtotal = roundCurrency(total);
  const subtotalEl = document.getElementById('checkout-subtotal-amount');
  if (subtotalEl) {
    subtotalEl.textContent = formatCurrency(subtotal);
  }
  const delivery = document.getElementById('fulfilment-delivery');
  const isDelivery = Boolean(delivery && delivery.checked);
  let tipAmount = 0;
  if (entries.length && isDelivery) {
    if (selectedTipType === 'custom') {
      tipAmount = roundCurrency(Math.max(customTipAmount, 0));
    } else {
      const rawTip = Number.isFinite(selectedTipPercent) ? selectedTipPercent : 0;
      tipAmount = roundCurrency(subtotal * rawTip);
    }
  }
  const tipSummaryEl = document.getElementById('tip-amount');
  if (tipSummaryEl) {
    tipSummaryEl.textContent = formatCurrency(tipAmount);
  }
  const tipAmountEl = document.getElementById('checkout-tip-amount');
  if (tipAmountEl) {
    tipAmountEl.textContent = formatCurrency(tipAmount);
  }
  const deliveryFeeRow = document.getElementById('delivery-fee-row');
  const deliveryFeeAmount = document.getElementById('delivery-fee-amount');
  const expressFee = isDelivery && selectedDeliverySpeed === 'express' ? EXPRESS_DELIVERY_FEE : 0;
  if (deliveryFeeRow && deliveryFeeAmount) {
    if (expressFee > 0) {
      deliveryFeeRow.classList.remove('hidden');
      deliveryFeeAmount.textContent = formatCurrency(expressFee);
    } else {
      deliveryFeeRow.classList.add('hidden');
    }
  }
  const grandTotal = roundCurrency(subtotal + tipAmount + expressFee);
  checkoutTotal.textContent = formatCurrency(grandTotal);
}

// Kick off the rendering once the DOM has loaded
document.addEventListener('DOMContentLoaded', () => {
  buildHeroCarousel();
  renderMenu();
  updateCart();
  const rebuildHeroForViewport = () => buildHeroCarousel();
  const heroMediaQueries = [
    window.matchMedia('(pointer: coarse)'),
    window.matchMedia('(max-width: 768px)'),
  ];
  heroMediaQueries.forEach((media) => {
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', rebuildHeroForViewport);
    } else if (typeof media.addListener === 'function') {
      media.addListener(rebuildHeroForViewport);
    }
  });
  window.addEventListener('orientationchange', rebuildHeroForViewport);
  const cartLink = document.querySelector('.cart-link');
  if (cartLink) {
    cartLink.addEventListener('click', (event) => {
      if (Object.keys(cart).length) {
        event.preventDefault();
        toggleCheckoutPanel(true);
      }
    });
  }
  const cartIconButton = document.getElementById('cart-icon-button');
  if (cartIconButton) {
    cartIconButton.addEventListener('click', (event) => {
      if (Object.keys(cart).length) {
        event.preventDefault();
        toggleCheckoutPanel(true);
      }
    });
  }
  const checkoutButton = document.getElementById('checkout-button');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => toggleCheckoutPanel(true));
  }
  const closeCheckout = document.getElementById('close-checkout');
  if (closeCheckout) {
    closeCheckout.addEventListener('click', () => toggleCheckoutPanel(false));
  }
  const pickup = document.getElementById('fulfilment-pickup');
  const delivery = document.getElementById('fulfilment-delivery');
  if (pickup && delivery) {
    pickup.addEventListener('change', () => toggleDeliveryFields(false));
    delivery.addEventListener('change', () => toggleDeliveryFields(true));
  }
  const pickupTimeRadios = document.querySelectorAll('input[name="pickup-time"]');
  pickupTimeRadios.forEach((radio) => {
    if (radio.checked) {
      selectedPickupTimeOption = radio.value;
    }
    radio.addEventListener('change', () => {
      if (radio.checked) {
        selectedPickupTimeOption = radio.value;
        setPickupTimePreference(radio.value);
      }
    });
  });
  const deliveryTimeRadios = document.querySelectorAll('input[name="delivery-time"]');
  deliveryTimeRadios.forEach((radio) => {
    if (radio.checked) {
      selectedDeliverySpeed = radio.value;
    }
    radio.addEventListener('change', () => {
      if (radio.checked) {
        selectedDeliverySpeed = radio.value;
        setDeliverySpeed(radio.value);
      }
    });
  });
  const tipButtons = Array.from(document.querySelectorAll('.tip-button'));
  const customTipContainer = document.getElementById('custom-tip-container');
  const customTipInput = document.getElementById('custom-tip-input');
  const customTipButton = tipButtons.find((button) => button.dataset.tip === 'custom');
  const updateCustomTipLabel = () => {
    if (customTipButton) {
      customTipButton.textContent = `Custom (${formatCurrency(Math.max(customTipAmount, 0))})`;
    }
  };
  updateCustomTipLabel();
  if (customTipInput) {
    customTipInput.value = customTipAmount.toFixed(2);
  }
  if (tipButtons.length) {
    let defaultButton = tipButtons.find(
      (button) => button.dataset.tip !== 'custom' && Math.abs(parseFloat(button.dataset.tip) - selectedTipPercent) < 0.0001,
    );
    if (!defaultButton) {
      defaultButton = tipButtons.find((button) => button.dataset.tip !== 'custom') || tipButtons[0];
    }
    if (defaultButton) {
      const defaultValue = defaultButton.dataset.tip;
      if (defaultValue === 'custom') {
        selectedTipType = 'custom';
      } else {
        selectedTipType = 'percent';
        const parsed = parseFloat(defaultValue);
        selectedTipPercent = Number.isFinite(parsed) ? parsed : 0;
      }
      defaultButton.classList.add('is-active');
      if (defaultValue === 'custom' && customTipContainer) {
        customTipContainer.classList.remove('hidden');
        customTipContainer.setAttribute('aria-hidden', 'false');
      }
    }
    tipButtons.forEach((button) => {
      button.addEventListener('click', () => {
        tipButtons.forEach((btn) => btn.classList.toggle('is-active', btn === button));
        const tipValue = button.dataset.tip;
        if (tipValue === 'custom') {
          selectedTipType = 'custom';
          if (customTipContainer) {
            customTipContainer.classList.remove('hidden');
            customTipContainer.setAttribute('aria-hidden', 'false');
          }
          if (customTipInput) {
            customTipInput.focus();
            customTipInput.select();
          }
        } else {
          const percent = parseFloat(tipValue);
          selectedTipType = 'percent';
          selectedTipPercent = Number.isFinite(percent) ? percent : 0;
          if (customTipContainer) {
            customTipContainer.classList.add('hidden');
            customTipContainer.setAttribute('aria-hidden', 'true');
          }
        }
        updateCheckoutView();
      });
    });
  }
  if (customTipInput) {
    customTipInput.addEventListener('input', (event) => {
      const value = parseFloat(event.target.value);
      customTipAmount = Number.isFinite(value) && value >= 0 ? value : 0;
      updateCustomTipLabel();
      if (selectedTipType === 'custom') {
        updateCheckoutView();
      }
    });
    customTipInput.addEventListener('change', (event) => {
      const value = parseFloat(event.target.value);
      customTipAmount = Number.isFinite(value) && value >= 0 ? value : 0;
      event.target.value = customTipAmount.toFixed(2);
      updateCustomTipLabel();
      if (selectedTipType === 'custom') {
        updateCheckoutView();
      }
    });
  }
  toggleDeliveryFields(Boolean(delivery && delivery.checked));
  const scheduleTimeInput = document.getElementById('schedule-time');
  if (scheduleTimeInput) {
    scheduleTimeInput.addEventListener('input', (event) => {
      const state = getScheduleState();
      state.pendingTime = event.target.value;
      state.confirmed = false;
    });
    scheduleTimeInput.addEventListener('change', (event) => {
      const state = getScheduleState();
      state.pendingTime = event.target.value;
      state.confirmed = false;
      updateScheduleSummary();
    });
  }
  const saveScheduleBtn = document.getElementById('save-schedule');
  if (saveScheduleBtn) {
    saveScheduleBtn.addEventListener('click', handleScheduleSave);
  }
  const placeOrderBtn = document.getElementById('place-order');
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
      const { count } = calculateCartTotals();
      if (!count) {
        alert('Add items to your cart before placing an order.');
        return;
      }
      const fulfilment = delivery && delivery.checked ? 'Delivery' : 'Pickup';
      const isDelivery = fulfilment === 'Delivery';
      const { total: subtotal } = calculateCartTotals();
      let tipAmount = 0;
      if (isDelivery) {
        if (selectedTipType === 'custom') {
          tipAmount = roundCurrency(Math.max(customTipAmount, 0));
        } else {
          tipAmount = roundCurrency(subtotal * (Number.isFinite(selectedTipPercent) ? selectedTipPercent : 0));
        }
      }
      const expressFee = isDelivery && selectedDeliverySpeed === 'express' ? EXPRESS_DELIVERY_FEE : 0;
      const notes = [];
      if (fulfilment === 'Delivery') {
        const dropoff = document.querySelector('input[name="dropoff"]:checked');
        if (dropoff) {
          notes.push(`Drop-off: ${dropoff.value === 'door' ? 'Leave it at the door' : 'Hand it to me'}.`);
        }
        const dropoffNotes = document.getElementById('dropoff-notes');
        if (dropoffNotes && dropoffNotes.value.trim()) {
          notes.push(`Instructions: ${dropoffNotes.value.trim()}`);
        }
        if (selectedDeliverySpeed === 'express') {
          notes.push('Express delivery (ETA 15 mins) selected.');
        } else if (selectedDeliverySpeed === 'schedule') {
          const deliverySchedule = scheduleStates.delivery;
          if (deliverySchedule.confirmed && deliverySchedule.date && deliverySchedule.time) {
            notes.push(
              `Scheduled for ${formatScheduleDate(deliverySchedule.date)} at ${formatDisplayTime(deliverySchedule.time)}.`,
            );
          }
        }
      } else if (selectedPickupTimeOption === 'schedule') {
        const pickupSchedule = scheduleStates.pickup;
        if (pickupSchedule.confirmed && pickupSchedule.date && pickupSchedule.time) {
          notes.push(
            `Pickup scheduled for ${formatScheduleDate(pickupSchedule.date)} at ${formatDisplayTime(pickupSchedule.time)}.`,
          );
        } else {
          notes.push('Pickup schedule pending confirmation.');
        }
      } else {
        notes.push('Pickup: Standard window (10 – 15 mins).');
      }
      if (isDelivery) {
        notes.push(`Tip: ${formatCurrency(tipAmount)} (100% to drivers).`);
      }
      const grandTotal = roundCurrency(subtotal + tipAmount + expressFee);
      notes.push(`Total due: ${formatCurrency(grandTotal)}.`);
      notes.push('This demo does not submit the order.');
      alert(`Order placed for ${fulfilment}.\n${notes.join('\n')}`);
    });
  }
});
