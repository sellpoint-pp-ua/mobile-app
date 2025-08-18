const UA: Record<string, string> = {
  // ── Auth ───────────────────────────────────────────────
  auth_title: "Вхід",
  auth_subtitle: "Увійдіть до свого облікового запису",
  auth_login: "Логін або email",
  auth_login_placeholder: "you@example.com",
  auth_password: "Пароль",
  auth_password_placeholder: "Пароль",
  auth_submit: "Увійти",
  auth_hint: "Використайте дані свого облікового запису",
  show: "Показати",
  hide: "Сховати",

  // ── Навігація / Загальне ───────────────────────────────
  nav_home: "Головна",
  nav_entities: "Сутності",
  nav_profile: "Профіль",

  // ── Entities (мінімум для списку/редагування) ─────────
  entities_title: "Сутності",
  entities_add: "Додати",
  entities_create: "Створити",
  entities_edit: "Редагувати",
  entities_delete: "Видалити",
  entities_save: "Зберегти",
  entities_price: "Ціна",
  entities_description: "Опис",
  entities_name: "Назва",
  entities_load_error: "Помилка завантаження",
  entities_invalid_id: "Невірний ідентифікатор",
  confirm_delete_title: "Підтвердження",
  confirm_delete_text: "Видалити цей запис?",
  done: "Готово",
  ok: "OK",
  cancel: "Скасувати",
};

export const t = (key: string): string => UA[key] ?? key;
export default UA;
