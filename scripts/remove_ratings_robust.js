const fs = require('fs');
const path = require('path');

// 1. ProductCard.tsx
const cardPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'product', 'ProductCard.tsx');
let card = fs.readFileSync(cardPath, 'utf8');
const beforeCard = card;
card = card.replace(/\{\/\* Ratings \*\/\}[\r\n\s]*<div style=\{ratingStyles\}>[\s\S]*?<\/div>/, '');
// also clean unused ratingStyles, starsStyles, countStyles
card = card.replace(/const ratingStyles: React\.CSSProperties = {[\s\S]*?};\r?\n\r?\n/, '');
card = card.replace(/const starsStyles: React\.CSSProperties = {[\s\S]*?};\r?\n\r?\n/, '');
card = card.replace(/const countStyles: React\.CSSProperties = {[\s\S]*?};\r?\n\r?\n/, '');
fs.writeFileSync(cardPath, card, 'utf8');
console.log('ProductCard.tsx rating removed:', card !== beforeCard);

// 2. ProductSpecs.tsx
const specsPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'product', 'ProductSpecs.tsx');
let specs = fs.readFileSync(specsPath, 'utf8');
const beforeSpecs = specs;
specs = specs.replace(/\{\s*label:\s*'Aggregate Rating'[\s\S]*?\},?\r?\n/, '');
fs.writeFileSync(specsPath, specs, 'utf8');
console.log('ProductSpecs.tsx rating removed:', specs !== beforeSpecs);

// 3. RecentlyViewedPage.tsx
const recentPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Dashboard', 'RecentlyViewedPage.tsx');
let recent = fs.readFileSync(recentPath, 'utf8');
const beforeRecent = recent;
recent = recent.replace(/<div style=\{ratingRowStyles\}>[\s\S]*?<\/div>/, '');
recent = recent.replace(/const ratingRowStyles: React\.CSSProperties = {[\s\S]*?};\r?\n\r?\n/, '');
recent = recent.replace(/const reviewCountStyles: React\.CSSProperties = {[\s\S]*?};\r?\n\r?\n/, '');
fs.writeFileSync(recentPath, recent, 'utf8');
console.log('RecentlyViewedPage.tsx rating removed:', recent !== beforeRecent);

// 4. WishlistPage.tsx
const wishlistPath = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Dashboard', 'WishlistPage.tsx');
let wishlist = fs.readFileSync(wishlistPath, 'utf8');
const beforeWishlist = wishlist;
wishlist = wishlist.replace(/<div style=\{ratingRowStyles\}>[\s\S]*?<\/div>/, '');
wishlist = wishlist.replace(/const ratingRowStyles: React\.CSSProperties = {[\s\S]*?};\r?\n\r?\n/, '');
wishlist = wishlist.replace(/const reviewCountStyles: React\.CSSProperties = {[\s\S]*?};\r?\n\r?\n/, '');
fs.writeFileSync(wishlistPath, wishlist, 'utf8');
console.log('WishlistPage.tsx rating removed:', wishlist !== beforeWishlist);
