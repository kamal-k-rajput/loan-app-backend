import { ObjectId } from "mongodb";
import { LOAN_APPLICATION_STATUS, COLLECTION_STATUS, EMI_STATUS } from "../../utils/constants.js";

export async function getDealerSalesFunnelService(db, session, dealerId) {
  const loans = await db
    .collection("loan_applications")
    .find({ dealerId: new ObjectId(dealerId) }, { session })
    .toArray();

  const applied = loans.filter((l) => l.status === LOAN_APPLICATION_STATUS.APPLIED).length;
  const kycPending = loans.filter((l) => l.status === LOAN_APPLICATION_STATUS.KYC_PENDING).length;
  const underReview = loans.filter((l) => l.status === LOAN_APPLICATION_STATUS.UNDER_REVIEW).length;
  const approved = loans.filter((l) => l.status === LOAN_APPLICATION_STATUS.APPROVED).length;
  const disbursed = loans.filter((l) => l.status === LOAN_APPLICATION_STATUS.DISBURSED).length;
  const rejected = loans.filter((l) => l.status === LOAN_APPLICATION_STATUS.REJECTED).length;

  // Get total customers
  const totalCustomers = await db
    .collection("customers")
    .countDocuments({ createdByDealer: new ObjectId(dealerId) }, { session });

  // Get total loan amount
  const totalLoanAmount = loans.reduce((sum, l) => sum + (l.loanAmount || 0), 0);

  return {
    totalCustomers,
    totalLoans: loans.length,
    totalLoanAmount: Math.round(totalLoanAmount * 100) / 100,
    salesFunnel: {
      applied,
      kycPending,
      underReview,
      approved,
      disbursed,
      rejected
    },
    conversionRate: loans.length > 0
      ? Math.round((disbursed / loans.length) * 100 * 100) / 100
      : 0
  };
}

export async function getDealerCollectionsService(db, session, dealerId) {
  const collections = await db
    .collection("collections")
    .find({ dealerId: new ObjectId(dealerId) }, { session })
    .sort({ createdAt: -1 })
    .toArray();

  const approved = collections.filter((c) => c.status === COLLECTION_STATUS.APPROVED);
  const pending = collections.filter((c) => c.status === COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION);
  const rejected = collections.filter((c) => c.status === COLLECTION_STATUS.REJECTED);

  // Group by month
  const monthlyData = {};
  approved.forEach((c) => {
    const month = new Date(c.createdAt).toISOString().substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, amount: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].amount += c.amountCollected || 0;
  });

  return {
    totalCollections: collections.length,
    approvedCollections: approved.length,
    pendingCollections: pending.length,
    rejectedCollections: rejected.length,
    totalAmount: Math.round(
      approved.reduce((sum, c) => sum + (c.amountCollected || 0), 0) * 100
    ) / 100,
    pendingAmount: Math.round(
      pending.reduce((sum, c) => sum + (c.amountCollected || 0), 0) * 100
    ) / 100,
    monthlyBreakdown: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      count: data.count,
      amount: Math.round(data.amount * 100) / 100
    })),
    recentCollections: collections.slice(0, 10).map((c) => ({
      ...c,
      id: c._id.toString(),
      loanId: c.loanId ? c.loanId.toString() : null,
      emiId: c.emiId ? c.emiId.toString() : null
    }))
  };
}

export async function getDealerEarningsService(db, session, dealerId) {
  // Get all loans for this dealer
  const loans = await db
    .collection("loan_applications")
    .find({ dealerId: new ObjectId(dealerId) }, { session })
    .toArray();

  const loanIds = loans.map((l) => l._id);

  // Get contracts for these loans
  const contracts = await db
    .collection("loan_contracts")
    .find(
      {
        loanApplicationId: { $in: loanIds.map((id) => new ObjectId(id)) }
      },
      { session }
    )
    .toArray();

  // Calculate commission (assuming commission rate from dealer or a fixed rate)
  // For now, we'll use a simple calculation
  const dealer = await db
    .collection("dealers")
    .findOne({ _id: new ObjectId(dealerId) }, { session });

  const commissionRate = dealer?.commissionRate || 0.02; // Default 2%

  // Get paid EMIs to calculate commission
  const paidEmis = await db
    .collection("emi_schedule")
    .find(
      {
        loanId: { $in: loanIds.map((id) => new ObjectId(id)) },
        status: EMI_STATUS.PAID
      },
      { session }
    )
    .toArray();

  const totalCollections = paidEmis.reduce((sum, e) => sum + (e.emiAmount || 0), 0);
  const totalCommission = totalCollections * commissionRate;

  // Get pending commission (from pending collections)
  const pendingCollections = await db
    .collection("collections")
    .find(
      {
        dealerId: new ObjectId(dealerId),
        status: COLLECTION_STATUS.PENDING_LENDER_CONFIRMATION
      },
      { session }
    )
    .toArray();

  const pendingAmount = pendingCollections.reduce((sum, c) => sum + (c.amountCollected || 0), 0);
  const pendingCommission = pendingAmount * commissionRate;

  return {
    commissionRate: Math.round(commissionRate * 10000) / 100, // Convert to percentage
    totalCollections: Math.round(totalCollections * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
    pendingCommission: Math.round(pendingCommission * 100) / 100,
    paidEmis: paidEmis.length,
    totalLoans: loans.length
  };
}
