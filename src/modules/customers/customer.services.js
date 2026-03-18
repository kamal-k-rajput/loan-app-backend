import {
  createCustomer,
  listCustomers,
  listCustomersByDealer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerLoans,
  getCustomerEmis,
  getCustomerPayments
} from "./customer.repositories.js";

import { ObjectId } from "mongodb";

export async function createCustomerService(db, session, dealerId, payload) {
  const doc = {
    ...payload,
    createdByDealer: new ObjectId(dealerId)
  };
  const customer = await createCustomer(db, session, doc);
  return { ...customer, id: customer._id.toString() };
}

export async function listCustomersService(db, session) {
  const customers = await listCustomers(db, session);
  return customers.map((c) => ({ ...c, id: c._id.toString() }));
}

export async function listDealerCustomersService(db, session, dealerId, { page, limit, startDate, endDate }) {
  const { items, total } = await listCustomersByDealer(db, session, dealerId, {
    page,
    limit,
    startDate,
    endDate
  });

  return {
    items: items.map((c) => ({ ...c, id: c._id.toString() })),
    total,
    page,
    limit
  };
}

export async function getCustomerService(db, session, customerId) {
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) return null;
  return { ...customer, id: customer._id.toString() };
}

export async function updateCustomerService(db, session, customerId, updates) {
  await updateCustomer(db, session, customerId, updates);
  const customer = await getCustomerById(db, session, customerId);
  if (!customer) return null;
  return { ...customer, id: customer._id.toString() };
}


export async function deleteCustomerService(db, session, customerId) {
  return deleteCustomer(db, session, customerId);
}

export async function customerLoansService(db, session, customerId) {
  return getCustomerLoans(db, session, customerId);
}

export async function customerEmisService(db, session, customerId) {
  return getCustomerEmis(db, session, customerId);
}

export async function customerPaymentsService(db, session, customerId) {
  return getCustomerPayments(db, session, customerId);
}

