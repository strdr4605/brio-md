# Brio Design System (Brio DS)

> **Официальный стандарт оформления пользовательского интерфейса портала Brio.md**  
> Документ является обязательным руководством для всех разработчиков и ИИ-ассистентов (Antigravity, Cursor, Copilot, Claude).  
> **Любые отклонения от описанных ниже правил, токенов и структуры строго запрещены.**

---

## 1. Философия дизайна: Clean Monochrome Enterprise

Дизайн Brio.md построен на принципах швейцарской типографики, сдержанного минимализма и высокой информационной плотности без визуального мусора.

### Главные догмы:
1. **Монохромная основа (Slate First):** Основной фон — нейтральный сверхсветлый `bg-[#F8FAFC]` (`slate-50`), карточки — чистый белый `bg-white`, текст — глубокий контрастный `text-slate-900`.
2. **Абсолютный запрет на «радугу» и градиенты:**
   - ❌ **ЗАПРЕЩЕНО:** Градиентные карточки (сине-фиолетовые, оранжево-розовые, неоновые подложки).
   - ❌ **ЗАПРЕЩЕНО:** Размытые светящиеся сферы (blur glow orbs) на фоне.
   - ❌ **ЗАПРЕЩЕНО:** Разноцветные разномастные подложки иконок (одна синяя, другая розовая, третья зелёная).
   - ✅ **РАЗРЕШЕНО:** Все подложки иконок карточек метрик строго монохромные: `bg-slate-100 text-slate-700`.
3. **Функциональные цветовые акценты (Semantic Colors Only):**
   Цвет используется исключительно для смысловой индикации статуса:
   - 🟢 **Изумрудный (`emerald-600` / `bg-emerald-500`):** Положительный тренд, успешная оплата, статус «Подключено / Онлайн / Активно».
   - 🔴 **Красный / Розовый (`rose-600` / `bg-rose-500`):** Задолженности, просроченные счета (Overdue), критические ошибки.
   - 🟡 **Янтарный (`amber-600` / `bg-amber-500`):** Частичная оплата, предупреждения, ожидание.
   - 🔘 **Серый (`slate-500` / `slate-600`):** Базовая статистика, количество записей, нейтральные индикаторы.
4. **Борьба с визуальным мусором (Zero-Clutter):**
   - Никаких некликабельных декоративных бейджей (вроде «Sistem Operațional» в заголовках).
   - Никаких дублирующих блоков быстрых действий («Acțiuni Rapide»), если эти действия уже доступны в навигации или на страницах.
   - Максимум свободного пространства (whitespace) и чистых геометрических отступов.

---

## 2. Палитра цветов и Tailwind-токены

| Элемент | Tailwind Классы | Описание |
|---|---|---|
| **Фон страницы** | `bg-slate-50` (`#F8FAFC`) | Общая подложка рабочей области |
| **Фон карточек** | `bg-white` | Контейнеры карточек, модалок, таблиц |
| **Бордеры карточек** | `border border-slate-200/80` | Тонкая, едва заметная разделительная линия |
| **Hover бордеров** | `hover:border-slate-300 hover:shadow-sm` | Деликатный отклик при наведении |
| **Внутренние разделители** | `border-slate-100` | Линии между телом карточки и футером |
| **Подложка иконки** | `bg-slate-100 text-slate-700` | Нейтральный фон для пиктограмм |
| **Главные цифры (KPI)** | `text-slate-900 font-black` | Глубокий чёрный акцент для показателей |
| **Названия метрик** | `text-slate-800 font-semibold` | Чёткий, легко читаемый заголовок |
| **Второстепенный текст** | `text-slate-500 text-xs sm:text-sm` | Пояснения, даты, футеры карточек |
| **Хедер / Аватар** | `bg-slate-900 text-white` | Монохромный контрастный аватар |

---

## 3. Типографическая шкала (Font Hierarchy)

Строгая иерархия шрифтов обеспечивает мгновенное считывание информации:

- **H1 (Главный заголовок страницы):**
  `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900`
- **Подзаголовок / описание страницы:**
  `text-xs sm:text-sm text-slate-500 mt-1`
- **H2 (Заголовок группы / секции):**
  `text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide`
- **Ссылка перехода в секции («Vezi orar complet >»):**
  `text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 transition flex items-center gap-1`
- **Название метрики в карточке:**
  `text-base font-semibold text-slate-800`
- **Крупная цифра KPI:**
  `text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3`
- **Футер карточки (контекст / тренд):**
  `text-xs sm:text-sm text-slate-500` с иконкой тренда `w-4 h-4` или `w-5 h-5`

---

## 4. Эталонный компонент: `MetricCard`

Каждая карточка метрики на портале должна использовать единый компонент [`MetricCard.tsx`](file:///D:/Project_Internship/brio-md/apps/portal/src/components/dashboard/MetricCard.tsx):

```tsx
import Link from "next/link";
import React from "react";

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
};

export function MetricCard({ title, value, icon, footer, href }: MetricCardProps) {
  const content = (
    <div className="bg-white rounded-[8px] p-5 border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:border-slate-300 transition-colors h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <div className="w-10 h-10 rounded-[6px] bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums mt-2">
          {value}
        </div>
      </div>
      {footer && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
```

### Требования к размерам иконки:
- Контейнер иконки: строго `w-12 h-12 rounded-xl bg-slate-100 text-slate-700`.
- Сама SVG-иконка: строго `w-6 h-6` (24px) до `w-7 h-7` (28px). Никогда не использовать крошечные `w-4 h-4` (16px) внутри карточек первого уровня!

---

## 5. Структура Дашборда (4-Секционная Модель)

Главная страница делит аналитику на 4 логические секции по 3 карточки в сетке (3×1 на десктопе, 2×2 на планшете, 1 на мобильном):

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
</div>
```

1. **Секция 1: Analitică Utilizatori & Elevi**
   - Карточка 1: `Total Utilizatori` (`UsersIcon`, число активных аккаунтов).
   - Карточка 2: `Studenți Înregistrați` (`StudentsIcon`, охват курсов).
   - Карточка 3: `Personal & Profesori` (`UserCheckIcon`, статус доступа).

2. **Секция 2: Activitate Academică & Orar**
   - Карточка 1: `Cursuri & Programe` (`BookOpenIcon`, куррикулум).
   - Карточка 2: `Grupe de Studiu` (`CalendarIcon`, расписание залов).
   - Карточка 3: `Prezență & Frecvență` (`SchoolIcon`, процент зачисления/посещаемости).

3. **Секция 3: Finanțe & Abonamente**
   - Карточка 1: `Încasări Confirmate` (`CheckCircleIcon`, собранные средства в MDL).
   - Карточка 2: `Facturat Total (Abonamente)` (`BarChartIcon`, объём выставленных счетов).
   - Карточка 3: `Restanțe Active (Datorii)` (`AlertTriangleIcon`, просроченная задолженность с переходом в `tab=overdue`).

4. **Секция 4: Stare Sistem & Securitate (Split Grid 2 колонки)**
   - Колонка 1: База данных PostgreSQL (Drizzle ORM) + Мультиарендная изоляция.
   - Колонка 2: Контроль периметра (Tasmota Smart Door) + Авторизация PBAC NextAuth.

---

## 6. Верхний Хедер (`TopHeader.tsx`)

Хедер должен оставаться максимально чистым и лаконичным:
- **Кликабельные хлебные крошки (Breadcrumbs):**
  `Brio Portal > Prezentare > Panou Principal`
- **Глобальный поиск (`GlobalSearch`):**
  По центру, скругление `rounded-lg` или `rounded-full`, хоткей `CTRL + K`.
- **Профиль пользователя:**
  Монохромная таблетка с аватаром `bg-slate-900 text-white font-bold`, отображением имени и роли.
- ❌ **Запрещено:** Размещать внешние ссылки («Portal Cursuri»), кнопки выбора школы («Toate Școlile»), если они не нужны для текущей роли, и декоративные бейджи в хедере.

---

## 7. Правила для ИИ-Ассистентов (AI Agent Directives)

При генерации или модификации любого UI-кода в этом репозитории ИИ **ОБЯЗАН** соблюдать:

1. **Strict File Budget (<350 строк):**
   Любой компонент или страница, превышающие 350 строк, бракуются. Сложные интерфейсы разделяются на атомарные подкомпоненты (как `MetricCard.tsx`).
2. **Никаких самовольных градиентов:**
   Никогда не добавлять классы `bg-gradient-to-*`, `from-blue-*`, `via-purple-*`, `to-pink-*` к фону карточек или секций.
3. **Строгая типизация иконок:**
   Все иконки импортируются строго из `@/components/ui/icons`. Запрещено импортировать непроверенные внешние пакеты иконок (lucide-react, heroicons), если они не согласованы.
4. **Интерактивные состояния (Hover & Transitions):**
   Все интерактивные элементы должны иметь деликатный hover:
   `transition-all hover:border-slate-300 hover:shadow-sm active:scale-[0.99]`
5. **Адаптивность (Mobile-First):**
   Всегда проверять поведение на экранах `xs`, `sm`, `md`, `lg`, `xl`. Сетки карточек всегда используют `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
