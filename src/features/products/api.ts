import { USE_MOCK } from "../../lib/flags";
import { productMock } from "../../services/mock/productMock";
import { ProductService } from "../../services/api/services/ProductService";

export type Product = {
  id: string;
  name: string;
  price?: number | null;
  description?: string | null;
  createdAt?: string | null;
};

export type ProductCreateDto = {
  name: string;
  price?: number;
  description?: string;
};

function normalizeProduct(raw: any): Product {
  return {
    id: String(raw?.id ?? raw?._id ?? raw?.productId ?? ""),
    name: String(raw?.name ?? raw?.title ?? ""),
    price: raw?.price != null ? Number(raw.price) : null,
    description: raw?.description ?? raw?.desc ?? null,
    createdAt: raw?.createdAt ?? null,
  };
}

export async function list(): Promise<Product[]> {
  if (USE_MOCK) {
    const items = await productMock.list();
    return items.map(normalizeProduct);
  }
  const res = await ProductService.postApiProductGetAll(undefined as any);
  return (Array.isArray(res) ? res : []).map(normalizeProduct);
}

export async function getById(id: string): Promise<Product> {
  if (USE_MOCK) {
    const item = await productMock.getById(id);
    return normalizeProduct(item);
  }
  const raw = await ProductService.getApiProductGetById(id);
  return normalizeProduct(raw);
}

export async function create(dto: ProductCreateDto): Promise<Product> {
  if (USE_MOCK) {
    const item = await productMock.create(dto as any);
    return normalizeProduct(item);
  }
  const raw = await ProductService.postApiProduct(dto as any);
  return normalizeProduct(raw);
}

export async function update(id: string, dto: ProductCreateDto): Promise<Product> {
  if (USE_MOCK) {
    const item = await productMock.update(id, dto as any);
    return normalizeProduct(item);
  }
  const raw = await ProductService.putApiProduct({ ...(dto as any), id } as any);
  return normalizeProduct(raw);
}

export async function remove(id: string): Promise<void> {
  if (USE_MOCK) {
    await productMock.remove(id);
    return;
  }
  await ProductService.deleteApiProduct(id);
}

export const productApi = { list, getById, create, update, remove };
