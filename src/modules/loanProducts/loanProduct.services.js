import {
  createLoanProduct,
  listLoanProducts,
  getLoanProductById,
  updateLoanProduct,
  deleteLoanProduct
} from "./loanProduct.repositories.js";

export async function createLoanProductService(db, session, payload) {
  const product = await createLoanProduct(db, session, payload);
  return { ...product, id: product._id.toString() };
}

export async function listLoanProductsService(db, session) {
  const products = await listLoanProducts(db, session);
  return products.map((p) => ({ ...p, id: p._id.toString() }));
}

export async function getLoanProductService(db, session, productId) {
  const product = await getLoanProductById(db, session, productId);
  if (!product) return null;
  return { ...product, id: product._id.toString() };
}

export async function updateLoanProductService(db, session, productId, updates) {
  const product = await updateLoanProduct(db, session, productId, updates);
  if (!product) return null;
  return { ...product, id: product._id.toString() };
}

export async function deleteLoanProductService(db, session, productId) {
  return deleteLoanProduct(db, session, productId);
}
