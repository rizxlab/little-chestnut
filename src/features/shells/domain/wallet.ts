export function canAfford(balance: number, cost: number) {
  return balance >= Math.max(0, cost);
}

export function spendShells(balance: number, cost: number) {
  return Math.max(0, balance - Math.max(0, Math.floor(cost)));
}

export function addShells(value: number, amount: number) {
  return value + Math.max(0, Math.floor(amount));
}

export function removeShells(value: number, amount: number) {
  return Math.max(0, value - Math.max(0, Math.floor(amount)));
}
