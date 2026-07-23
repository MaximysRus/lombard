/**
 * Рассчитывает сумму выкупа залога.
 * Интерпретация просрочки: 
 * basePeriodRate - начисляется один раз как фиксированный % за основной период.
 * overdueRate - начисляется за КАЖДЫЙ полный день просрочки от изначальной суммы займа.
 */
export function calculateRedemption(
  loanAmount: number,
  basePeriodRate: number,
  overdueRate: number,
  dueDate: Date,
  currentDate: Date = new Date()
): { total: number; baseInterest: number; overdueInterest: number; overdueDays: number } {
  
  const baseInterest = loanAmount * (basePeriodRate / 100);
  let overdueDays = 0;
  let overdueInterest = 0;

  const due = new Date(dueDate).setHours(0,0,0,0);
  const current = new Date(currentDate).setHours(0,0,0,0);

  if (current > due) {
    const diffTime = Math.abs(current - due);
    overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    overdueInterest = loanAmount * (overdueRate / 100) * overdueDays;
  }

  const total = loanAmount + baseInterest + overdueInterest;

  return {
    total: Number(total.toFixed(2)),
    baseInterest: Number(baseInterest.toFixed(2)),
    overdueInterest: Number(overdueInterest.toFixed(2)),
    overdueDays
  };
}