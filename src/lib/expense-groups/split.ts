export type SplitMember = {
  id: string;
  paid: number;
};

export type SplitTransfer = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

const EPSILON = 0.005; // round to 2 decimals

export function computeSettlements(
  members: SplitMember[],
  total: number,
): SplitTransfer[] {
  const n = members.length;
  if (n === 0) return [];
  const share = total / n;
  const balances = members.map((m) => ({
    id: m.id,
    balance: m.paid - share,
  }));

  const creditors = balances
    .filter((b) => b.balance > EPSILON)
    .sort((a, b) => b.balance - a.balance);
  const debtors = balances
    .filter((b) => b.balance < -EPSILON)
    .sort((a, b) => a.balance - b.balance);

  const transfers: SplitTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const c = creditors[i];
    const d = debtors[j];
    const amount = Math.min(c.balance, -d.balance);
    if (amount > EPSILON) {
      transfers.push({
        fromUserId: d.id,
        toUserId: c.id,
        amount: Math.round(amount * 100) / 100,
      });
    }
    c.balance -= amount;
    d.balance += amount;
    if (c.balance <= EPSILON) i++;
    if (-d.balance <= EPSILON) j++;
  }
  return transfers;
}
