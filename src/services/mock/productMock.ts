type Product = { id: string; name: string; description?: string; price?: number };

let db: Product[] = [
  { id: "1", name: "Ноутбук", description: "Легкий, 16 ГБ RAM", price: 35000 },
  { id: "2", name: "Смартфон", description: "OLED, 128 ГБ", price: 18000 },
];

export const productMock = {
  async list() {
    await new Promise((r) => setTimeout(r, 300));
    return [...db];
  },
  async getById(id: string) {
    await new Promise((r) => setTimeout(r, 200));
    const item = db.find((x) => x.id === id);
    if (!item) throw new Error("Не знайдено");
    return { ...item };
  },
  async create(payload: Partial<Product>) {
    await new Promise((r) => setTimeout(r, 300));
    const id = String(Date.now());
    const item: Product = { id, name: payload.name ?? "Без назви", description: payload.description, price: payload.price ?? 0 };
    db.unshift(item);
    return item;
  },
  async update(id: string, payload: Partial<Product>) {
    await new Promise((r) => setTimeout(r, 300));
    const i = db.findIndex((x) => x.id === id);
    if (i < 0) throw new Error("Не знайдено");
    db[i] = { ...db[i], ...payload, id };
    return db[i];
  },
  async remove(id: string) {
    await new Promise((r) => setTimeout(r, 200));
    db = db.filter((x) => x.id !== id);
    return true;
  },
};
