import { ObjectId } from "mongodb";
import { EMI_STATUS } from "../../utils/constants.js";

export async function getCustomerLoansService(db, session, customerId) {
  const loans = await db
    .collection("loan_applications")
    .find({ customerId: new ObjectId(customerId) }, { session })
    .sort({ createdAt: -1 })
    .toArray();

  // Get contracts for these loans
  const loanIds = loans.map((l) => l._id);
  const contracts = await db
    .collection("loan_contracts")
    .find(
      {
        loanApplicationId: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  // Get EMIs for these loans
  const allEmis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  return loans.map((loan) => {
    const contract = contracts.find((c) => c.loanApplicationId.toString() === loan._id.toString());
    const loanEmis = allEmis.filter((e) => e.loanId.toString() === loan._id.toString());
    const paidEmis = loanEmis.filter((e) => e.status === EMI_STATUS.PAID);
    const pendingEmis = loanEmis.filter((e) => e.status !== EMI_STATUS.PENDING);

    const totalPaid = paidEmis.reduce((sum, e) => sum + (e.principalComponent || 0), 0);
    const remainingPrincipal = contract
      ? contract.principalAmount - totalPaid
      : loan.loanAmount;

    return {
      ...loan,
      id: loan._id.toString(),
      customerId: loan.customerId ? loan.customerId.toString() : null,
      dealerId: loan.dealerId ? loan.dealerId.toString() : null,
      productId: loan.productId ? loan.productId.toString() : null,
      contract: contract
        ? {
            ...contract,
            id: contract._id.toString(),
            principalAmount: contract.principalAmount,
            interestRate: contract.interestRate,
            emiAmount: contract.emiAmount
          }
        : null,
      totalEmis: loanEmis.length,
      paidEmis: paidEmis.length,
      pendingEmis: pendingEmis.length,
      remainingPrincipal: Math.round(remainingPrincipal * 100) / 100
    };
  });
}

export async function getCustomerEmisService(db, session, customerId) {
  // Get customer's loans
  const loans = await db
    .collection("loan_applications")
    .find({ customerId: new ObjectId(customerId) }, { session })
    .toArray();

  const loanIds = loans.map((l) => l._id);

  // Get all EMIs for these loans
  const emis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .sort({ dueDate: 1 })
    .toArray();

  const pending = emis.filter((e) => e.status === EMI_STATUS.PENDING);
  const paid = emis.filter((e) => e.status === EMI_STATUS.PAID);
  const overdue = emis.filter((e) => {
    if (e.status === EMI_STATUS.OVERDUE) return true;
    if (e.status === EMI_STATUS.PENDING && new Date(e.dueDate) < new Date()) return true;
    return false;
  });

  return {
    totalEmis: emis.length,
    pendingEmis: pending.length,
    paidEmis: paid.length,
    overdueEmis: overdue.length,
    emis: emis.map((e) => ({
      ...e,
      id: e._id.toString(),
      loanId: e.loanId ? e.loanId.toString() : null,
      contractId: e.contractId ? e.contractId.toString() : null,
      isOverdue: overdue.some((o) => o._id.toString() === e._id.toString())
    }))
  };
}

export async function getCustomerPaymentHistoryService(db, session, customerId) {
  // Get customer's loans
  const loans = await db
    .collection("loan_applications")
    .find({ customerId: new ObjectId(customerId) }, { session })
    .toArray();

  const loanIds = loans.map((l) => l._id);

  // Get all payments for these loans
  const payments = await db
    .collection("payments")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
        status: "SUCCESS"
      },
      { session }
    )
    .sort({ createdAt: -1 })
    .toArray();

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Group by month
  const monthlyData = {};
  payments.forEach((p) => {
    const month = new Date(p.createdAt).toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, amount: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].amount += p.amount || 0;
  });

  return {
    totalPayments: payments.length,
    totalPaid: Math.round(totalPaid * 100) / 100,
    monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100
    })),
    recentPayments: payments.slice(0, 20).map((p) => ({
      ...p,
      id: p._id.toString(),
      loanId: p.loanId ? p.loanId.toString() : null,
      emiId: p.emiId ? p.emiId.toString() : null
    }))
  };
}
