import assert from "node:assert/strict";
import test from "node:test";
import {
  buyAndPlaceBuilding,
  removeBuilding,
} from "../src/js/systems/buildingSystem.js";

const house = { id: "house", price: 20 };

function createLots() {
  return [
    { id: 1, buildingId: null },
    { id: 2, buildingId: null },
  ];
}

test("buys a building and places it on the selected empty lot", () => {
  const lots = createLots();
  const result = buyAndPlaceBuilding({
    balance: 100,
    building: house,
    lots,
    lotId: 2,
  });

  assert.deepEqual(result, {
    success: true,
    balance: 80,
    lots: [
      { id: 1, buildingId: null },
      { id: 2, buildingId: "house" },
    ],
  });
  assert.equal(lots[1].buildingId, null);
});

test("rejects a purchase when the player cannot afford it", () => {
  const result = buyAndPlaceBuilding({
    balance: 19,
    building: house,
    lots: createLots(),
    lotId: 1,
  });

  assert.deepEqual(result, { success: false, reason: "insufficient-funds" });
});

test("allows a purchase with an exact balance without going negative", () => {
  const result = buyAndPlaceBuilding({
    balance: 20,
    building: house,
    lots: createLots(),
    lotId: 1,
  });

  assert.equal(result.success, true);
  assert.equal(result.balance, 0);
});

test("rejects placing a building on an occupied lot", () => {
  const lots = [{ id: 1, buildingId: "park" }];
  const result = buyAndPlaceBuilding({
    balance: 100,
    building: house,
    lots,
    lotId: 1,
  });

  assert.deepEqual(result, { success: false, reason: "occupied-lot" });
});

test("rejects invalid building and lot data", () => {
  assert.deepEqual(
    buyAndPlaceBuilding({
      balance: 100,
      building: null,
      lots: createLots(),
      lotId: 1,
    }),
    { success: false, reason: "invalid-building" },
  );
  assert.deepEqual(
    buyAndPlaceBuilding({
      balance: 100,
      building: house,
      lots: createLots(),
      lotId: 3,
    }),
    { success: false, reason: "invalid-lot" },
  );
});

test("removes a building and refunds half its price rounded down", () => {
  const lots = [
    { id: 1, buildingId: "house" },
    { id: 2, buildingId: null },
  ];

  assert.deepEqual(
    removeBuilding({
      balance: 0,
      building: { id: "house", price: 21 },
      lots,
      lotId: 1,
      refundRate: 0.5,
      coinLimit: 500,
    }),
    {
      success: true,
      balance: 10,
      refunded: 10,
      lots: [
        { id: 1, buildingId: null },
        { id: 2, buildingId: null },
      ],
    },
  );
  assert.equal(lots[0].buildingId, "house");
});

test("caps a building refund at the configured coin limit", () => {
  assert.deepEqual(
    removeBuilding({
      balance: 498,
      building: { id: "house", price: 20 },
      lots: [{ id: 1, buildingId: "house" }],
      lotId: 1,
      refundRate: 0.5,
      coinLimit: 500,
    }),
    {
      success: true,
      balance: 500,
      refunded: 2,
      lots: [{ id: 1, buildingId: null }],
    },
  );
});

test("rejects removal from empty, mismatched, or invalid lots", () => {
  const options = {
    balance: 0,
    building: house,
    lots: createLots(),
    lotId: 1,
    refundRate: 0.5,
    coinLimit: 500,
  };

  assert.deepEqual(removeBuilding(options), {
    success: false,
    reason: "building-mismatch",
  });
  assert.deepEqual(removeBuilding({ ...options, lots: null }), {
    success: false,
    reason: "invalid-lots",
  });
  assert.deepEqual(removeBuilding({ ...options, refundRate: 2 }), {
    success: false,
    reason: "invalid-building",
  });
});
