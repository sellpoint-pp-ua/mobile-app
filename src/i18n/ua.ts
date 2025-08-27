// Простенький словарь + хелпер t(). Якщо ключа нема — повертаємо сам ключ.
export const ua: Record<string, string> = {
  // --- Sign In ---
  auth_title: "Вхід",
  auth_subtitle: "Увійдіть, щоб продовжити",
  auth_login: "Логін або Email",
  auth_login_placeholder: "name@example.com",
  auth_password: "Пароль",
  auth_password_placeholder: "••••••••",
  show: "Показати",
  hide: "Приховати",
  auth_submit: "Увійти",
  auth_hint: "Переконайтесь, що дані введено правильно.",
  auth_sign_up_link: "Зареєструватись",

  // --- Sign Up ---
  sign_up_title: "Реєстрація",
  sign_up_subtitle: "Створіть акаунт, щоб продовжити",
  label_name: "Ім’я",
  label_email: "Email",
  label_password: "Пароль",
  agree_text: "Погоджуюсь з умовами та політикою",
  sign_up_cta: "Зареєструватись",
  creating: "Створюємо…",
  go_to_sign_in: "Увійти",

  // --- Verify Email ---
  verify_title: "Підтвердження email",
  verify_code_label: "Код з листа",
  verify_submit: "Підтвердити",
  verify_resend: "Надіслати код ще раз",
  verify_resend_in: "Надіслати повторно через {s} сек.",
  verify_check_inbox_title: "Перевірте пошту",
  verify_check_inbox_msg: "Ми надіслали код підтвердження на ваш email.",

  // --- Errors ---
  error: "Помилка",
  err_name: "Вкажіть ім’я",
  err_email: "Невірний email",
  err_password: "Мінімум 6 символів",
  err_agree: "Потрібна згода",
  err_code: "Введіть код з листа",
};

export const t = (k: string) => ua[k] ?? k;
