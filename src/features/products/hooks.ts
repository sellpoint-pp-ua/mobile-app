import { createCrudHooks } from "../../lib/crud";
import { productApi, type Product } from "./api";

export const productsCrud = createCrudHooks<Product, string>({
  key: "products",

  list: () => productApi.list(),
  getById: (id) => productApi.getById(String(id)),
  create: (payload) => productApi.create(payload),
  update: (id, payload) => productApi.update(String(id), payload),
  remove: (id) => productApi.remove(String(id)),
});
