import {
  getOverdueEmis,
  getLoansWithOverdueEmis
} from "./npa.repositories.js";
import { ObjectId } from "mongodb";

export async function getNpaByDaysService(db, session, days, user) {
  let filter = {};

  if (user.role === "DEALER" && user.dealerId) {
    // Get loans for this dealer
    const loans = await db
      .collection("loan_applications")
      .find({ dealerId: new ObjectId(user.dealerId) }, { session })
      .toArray();
    const loanIds = loans.map((l) => l._id);
    filter.loanId = { $in: loanIds.map((id) => new ObjectId(id)) };
  } else if (user.role === "LENDER" && user.lenderId) {
    // Get contracts for this lender
    const contracts = await db
      .collection("loan_contracts")
      .find({ lenderId: new ObjectId(user.lenderId) }, { session })
      .toArray();
    const loanApplicationIds = contracts.map((c) => c.loanApplicationId);
    filter.loanId = { $in: loanApplicationIds.map((id) => new ObjectId(id)) };
  }

  const overdueEmis = await getOverdueEmis(db, session, days);

  // Apply filter if needed
  let filteredEmis = overdueEmis;
  if (Object.keys(filter).length > 0) {
    filteredEmis = overdueEmis.filter((e) => {
      if (filter.loanId && filter.loanId.$in) {
        return filter.loanId.$in.some((id) => id.toString() === e.loanId.toString());
      }
      return true;
    });
  }

  const totalOverdue = filteredEmis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);
  const uniqueLoans = [...new Set(filteredEmis.map((e) => e.loanId.toString()))];

  return {
    days,
    totalOverdueEmis: filteredEmis.length,
    totalOverdueAmount: Math.round(totalOverdue * 100) / 100,
    affectedLoans: uniqueLoans.length,
    emis: filteredEmis.map((e) => ({
      ...e,
      id: e._id.toString(),
      loanId: e.loanId ? e.loanId.toString() : null,
      contractId: e.contractId ? e.contractId.toString() : null
    }))
  };
}

export async function getNpaLoansService(db, session, user) {
  // Get loans with overdue EMIs (30+ days)
  const loans = await getLoansWithOverdueEmis(db, session, 30);

  // Apply role-based filtering
  let filteredLoans = loans;
  if (user.role === "DEALER" && user.dealerId) {
    filteredLoans = loans.filter((l) => l.dealerId && l.dealerId.toString() === user.dealerId);
  } else if (user.role === "LENDER" && user.lenderId) {
    filteredLoans = loans.filter((l) => {
      return l.contract && l.contract.lenderId && l.contract.lenderId.toString() === user.lenderId;
    });
  }

  return filteredLoans.map((l) => ({
    ...l,
    id: l._id.toString(),
    customerId: l.customerId ? l.customerId.toString() : null,
    dealerId: l.dealerId ? l.dealerId.toString() : null,
    productId: l.productId ? l.productId.toString() : null,
    contract: l.contract
      ? {
          ...l.contract,
          id: l.contract._id.toString(),
          loanApplicationId: l.contract.loanApplicationId
            ? l.contract.loanApplicationId.toString()
            : null,
          customerId: l.contract.customerId ? l.contract.customerId.toString() : null,
          dealerId: l.contract.dealerId ? l.contract.dealerId.toString() : null,
          lenderId: l.contract.lenderId ? l.contract.lenderId.toString() : null
        }
      : null
  }));
}
