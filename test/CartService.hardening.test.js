'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { CartService } = require('../src/CartService');

const apple = { id: 'apple', price: 2, quantity: 3 };
const empty = (userId) => ({ userId, items: [], itemCount: 0, total: 0 });

test('adding to a stored cart that has no items list starts a new list', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1' }]]));
  svc.addItem('u1', apple);
  assert.equal(svc.refreshCart('u1').itemCount, 1);
  assert.equal(svc.refreshCart('u1').total, 6);
});

test('removing from a stored cart that has no items list leaves an empty cart', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1' }]]));
  assert.doesNotThrow(() => svc.removeItem('u1', 'apple'));
  assert.deepEqual(svc.getCart('u1').items, []);
  assert.deepEqual(svc.refreshCart('u1'), empty('u1'));
});

test('getCartSummary matches refreshCart for a filled cart', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  assert.deepEqual(svc.getCartSummary('u1'), svc.refreshCart('u1'));
});

test('getCartSummary returns an empty cart after clearing', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  svc.clearCart('u1');
  assert.deepEqual(svc.getCartSummary('u1'), empty('u1'));
  assert.deepEqual(svc.getCartSummary('u1'), svc.refreshCart('u1'));
});

test('getCartSummary returns an empty cart for an unknown user', () => {
  const svc = new CartService();
  assert.deepEqual(svc.getCartSummary('nobody'), empty('nobody'));
});

test('invalid items are rejected', () => {
  const svc = new CartService();
  assert.throws(() => svc.addItem('u1', { price: 1, quantity: 1 }), /Invalid item/);
  assert.throws(() => svc.addItem('u1', { id: 'x', price: -1, quantity: 1 }), /Invalid item/);
  assert.throws(() => svc.addItem('u1', { id: 'x', price: 1, quantity: 0 }), /Invalid item/);
});

test('a free item with price 0 is accepted', () => {
  const svc = new CartService();
  svc.addItem('u1', { id: 'gift', price: 0, quantity: 1 });
  assert.equal(svc.refreshCart('u1').itemCount, 1);
  assert.equal(svc.refreshCart('u1').total, 0);
});

test('adding the same item twice merges the quantity', () => {
  const svc = new CartService();
  svc.addItem('u1', apple);
  svc.addItem('u1', { id: 'apple', price: 2, quantity: 2 });
  const view = svc.refreshCart('u1');
  assert.equal(view.itemCount, 1);
  assert.equal(view.items[0].quantity, 5);
  assert.equal(view.total, 10);
});

const itemX = { id: 'x', price: 5, quantity: 2 };

test('E1: summary of a stored cart whose items is an object is empty', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1', items: {} }]]));
  assert.deepEqual(svc.refreshCart('u1'), empty('u1'));
  assert.deepEqual(svc.getCartSummary('u1'), empty('u1'));
});

test('E2: summary of a stored cart whose items is a string is empty', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1', items: 'oops' }]]));
  assert.deepEqual(svc.refreshCart('u1'), empty('u1'));
});

test('E3: removing from a stored cart whose items is an object leaves an empty list', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1', items: {} }]]));
  assert.doesNotThrow(() => svc.removeItem('u1', 'x'));
  assert.deepEqual(svc.getCart('u1').items, []);
});

test('E4: adding to a stored cart whose items is an object keeps only the new item', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1', items: {} }]]));
  svc.addItem('u1', apple);
  assert.deepEqual(svc.getCart('u1').items, [apple]);
  assert.equal(svc.refreshCart('u1').total, 6);
});

test('E5: null entries are ignored by the summary', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1', items: [null, { ...itemX }] }]]));
  const view = svc.refreshCart('u1');
  assert.deepEqual(view.items, [itemX]);
  assert.equal(view.itemCount, 1);
  assert.equal(view.total, 10);
});

test('E6: add and remove drop null entries from the stored list', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1', items: [null, { ...itemX }] }]]));
  svc.addItem('u1', apple);
  assert.deepEqual(svc.getCart('u1').items, [itemX, apple]);

  const svc2 = new CartService(new Map([['u1', { userId: 'u1', items: [null, { ...itemX }] }]]));
  assert.doesNotThrow(() => svc2.removeItem('u1', 'nothing'));
  assert.deepEqual(svc2.getCart('u1').items, [itemX]);
});

test('E7: a line with a missing price or bad quantity adds 0 and stays in the cart', () => {
  const svc = new CartService(new Map([['u1', { userId: 'u1', items: [
    { ...itemX },
    { id: 'y', quantity: 1 },
    { id: 'z', price: 3, quantity: '2' },
  ] }]]));
  const view = svc.refreshCart('u1');
  assert.equal(view.total, 10);
  assert.ok(Number.isFinite(view.total));
  assert.equal(view.itemCount, 3);
});

test('E8: changing the returned summary does not change the stored cart', () => {
  const svc = new CartService();
  svc.addItem('u1', itemX);
  const summary = svc.getCartSummary('u1');
  summary.items.push({ id: 'extra', price: 1, quantity: 1 });
  svc.refreshCart('u1').items.splice(0, 1);
  const fresh = svc.getCartSummary('u1');
  assert.deepEqual(fresh.items, [itemX]);
  assert.equal(fresh.total, 10);
});
