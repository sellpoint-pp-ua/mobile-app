export const authMock = {
  async login(_p: { Login: string; Password: string; DeviceInfo?: string }) {
    // имитируем сеть
    await new Promise((r) => setTimeout(r, 400));
    // примитивная валидация
    if (!_p.Login || !_p.Password) throw new Error("Введіть логін і пароль");
    // возвращаем строковый "токен" как ваш бэк
    return "mock-token-123";
  },
  async logout() {
    await new Promise((r) => setTimeout(r, 200));
    return true;
  },
};
