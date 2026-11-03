/**
 * Automatic Romanian -> Russian & English UI Translation Engine for Brio.md Portal.
 * Translates static labels, split JSX fragments, dates, months, days of week,
 * dynamic counters, placeholders, and tooltips across the entire portal,
 * while preserving user-defined group and course names.
 */

export type TargetLocale = "ru" | "en";

// Each entry maps Romanian source string -> [Russian, English]
const EXACT_PHRASES: Record<string, [string, string]> = {
  // Auth & Login
  "Portal Personal": ["Личный кабинет", "Staff Portal"],
  "Email": ["Электронная почта", "Email"],
  "Parolă": ["Пароль", "Password"],
  "Autentificare": ["Войти", "Sign In"],
  "Se autentifică...": ["Вход...", "Signing in..."],
  "Se procesează...": ["Обработка...", "Processing..."],
  "Accesează Portalul de Învățare →": ["Перейти на учебный портал →", "Go to Learning Portal →"],
  "Invalid credentials": ["Неверный логин или пароль", "Invalid login credentials"],
  "Date de conectare invalide": ["Неверный логин или пароль", "Invalid login credentials"],

  // Navigation & Global Shell
  "Panou Principal": ["Главная панель", "Dashboard"],
  "Prezentare": ["Обзор", "Overview"],
  "Gestiune Academică": ["Учебная часть", "Academic Management"],
  "Academic": ["Учебная часть", "Academic"],
  "Prezență": ["Посещаемость", "Attendance"],
  "Matrice Prezență": ["Матрица посещаемости", "Attendance Matrix"],
  "Orar & Săli": ["Расписание", "Schedule & Rooms"],
  "Orar": ["Расписание", "Schedule"],
  "Orar →": ["Расписание →", "Schedule →"],
  "Studenți": ["Ученики", "Students"],
  "Elevi": ["Ученики", "Students"],
  "Cursuri": ["Курсы", "Courses"],
  "Cursuri & Grupe": ["Курсы и группы", "Courses & Groups"],
  "Facturare": ["Счета", "Billing"],
  "Registru Facturi": ["Реестр счетов", "Invoices Registry"],
  "Statistici Financiare": ["Финансы", "Financial Analytics"],
  "Utilizatori": ["Пользователи", "Users"],
  "Gestiune": ["Управление", "Management"],
  "Sistem": ["Система", "System"],
  "Setări": ["Настройки", "Settings"],
  "Setări Sistem": ["Настройки системы", "System Settings"],
  "Configurare": ["Настройки", "Configuration"],
  "Permisiuni": ["Права доступа", "Permissions"],
  "Securitate": ["Безопасность", "Security"],
  "Roletă Intrare": ["Роллета входа", "Entrance Door"],
  "Control Acces": ["Контроль доступа", "Access Control"],
  "Deconectare": ["Выйти", "Sign Out"],
  "Deschide meniu": ["Меню", "Open menu"],
  "Deschide meniul rapid": ["Меню", "Open quick menu"],
  "Meniu": ["Меню", "Menu"],
  "Închide": ["Закрыть", "Close"],
  "Închide meniul": ["Закрыть меню", "Close menu"],
  "Statistici & rezumat": ["Статистика и сводка", "Analytics & summary"],
  "Gestionare academică": ["Учебное управление", "Academic management"],
  "Registru & plăți": ["Реестр и платежи", "Registry & payments"],
  "Profesori & conturi": ["Преподаватели и аккаунты", "Teachers & accounts"],
  "Încasări & restanțe": ["Поступления и долги", "Collections & arrears"],
  "Preferințe & școală": ["Настройки и школа", "Preferences & school"],
  "Super Administrator": ["Супер-администратор", "Super Administrator"],
  "Administrator Școală": ["Администратор школы", "School Administrator"],
  "Profesor / Instructor": ["Преподаватель", "Teacher / Instructor"],
  "Profesor / Personal": ["Преподаватель / Персонал", "Teacher / Staff"],
  "Membru Brio": ["Сотрудник Brio", "Brio Member"],
  "← Înapoi la Panou": ["← На главную", "← Back to Dashboard"],
  "Înapoi la Panou": ["На главную", "Back to Dashboard"],

  // Split JSX Fragments & Counters
  "Toți (": ["Все (", "All ("],
  "Toate (": ["Все (", "All ("],
  "Azi (": ["Сегодня (", "Today ("],
  "Ale Mele (": ["Мои (", "My Groups ("],
  "Restanțieri (": ["Должники (", "Overdue ("],
  "Achitați (": ["Оплачено (", "Paid ("],
  "Cursuri (": ["Курсы (", "Courses ("],
  "Grupe (": ["Группы (", "Groups ("],
  "Toate Grupele (": ["Все группы (", "All Groups ("],
  "Toate Sălile (": ["Все аудитории (", "All Rooms ("],
  "Toate Cursurile (": ["Все курсы (", "All Courses ("],
  "Toți profesorii (": ["Все преподаватели (", "All Teachers ("],
  "ani)": ["лет)", "yrs)"],
  "ani": ["лет", "yrs"],
  "facturi": ["счетов", "invoices"],
  "factură": ["счёт", "invoice"],
  "facturi depășite)": ["просроч. счетов)", "overdue invoices)"],
  "restanțieri (": ["должн. (", "debtors ("],
  "restanțier (": ["должн. (", "debtor ("],
  "lecții": ["ур.", "lessons"],
  "lecție": ["ур.", "lesson"],
  "în lună": ["в месяце", "this month"],
  "prezenți": ["присут.", "present"],
  "absenți": ["отсут.", "absent"],
  "întârziați": ["опозд.", "late"],
  "nemarcați": ["не отм.", "unmarked"],
  "conturi active în platformă": ["активных аккаунтов", "active platform accounts"],
  "înrolați pe cursuri active": ["записаны на активные курсы", "enrolled in active courses"],
  "facturi cu termen depășit": ["просроченных счетов", "overdue invoices"],
  "elevi înscriși": ["учеников", "enrolled students"],
  "elev înscris": ["ученик", "enrolled student"],
  "grupă": ["группа", "group"],
  "grupe": ["групп", "groups"],
  "Grupă": ["Группа", "Group"],
  "Grupe": ["Группы", "Groups"],
  "Î": ["О", "L"],

  // Global Search
  "Caută elev, părinte, telefon...": ["Поиск ученика, родителя...", "Search student, parent, phone..."],
  "Caută elev, părinte, număr telefon...": [
    "Поиск ученика, родителя, номера телефона...",
    "Search student, parent, phone number...",
  ],
  "Caută elev": ["Поиск ученика", "Search student"],
  "Niciun student găsit": ["Ученики не найдены", "No students found"],
  "Tastați cel puțin un caracter pentru a căuta instantaneu în toți studenții.": [
    "Введите хотя бы один символ для мгновенного поиска по всем ученикам.",
    "Type at least one character to search across all students.",
  ],
  "Părinte:": ["Родитель:", "Parent:"],
  "Nespecificat": ["Не указан", "Unspecified"],
  "Fără cursuri/grupe active": ["Нет активных курсов/групп", "No active courses/groups"],
  "Navigare": ["Навигация", "Navigate"],
  "Deschide": ["Открыть", "Open"],
  "Navighează direct la profilul studentului": [
    "Быстрый переход в профиль ученика",
    "Jump directly to student profile",
  ],

  // Dashboard Main Panel
  "Prezentare generală a activității școlare, elevilor și indicatorilor financiari.": [
    "Общая сводка учебной активности, учеников и финансовых показателей.",
    "Overview of school activity, student enrollments, and financial metrics.",
  ],
  "Analitică Utilizatori & Elevi": ["Аналитика пользователей и учеников", "Users & Students Analytics"],
  "Gestiune utilizatori": ["Управление пользователями", "Manage users"],
  "Total Utilizatori": ["Всего пользователей", "Total Users"],
  "Studenți Înregistrați": ["Зарегистрировано учеников", "Registered Students"],
  "Personal & Profesori": ["Персонал и преподаватели", "Staff & Teachers"],
  "Acces securizat configurat": ["Защищённый доступ настроен", "Secure access configured"],
  "Activitate Academică & Orar": ["Учебная активность и расписание", "Academic Activity & Schedule"],
  "Vezi orar complet": ["Полное расписание", "View full schedule"],
  "Cursuri & Programe": ["Курсы и программы", "Courses & Programs"],
  "Curriculum activ": ["Активная программа", "Active curriculum"],
  "Grupe de Studiu": ["Учебные группы", "Study Groups"],
  "Orar sincronizat pe săli": ["Расписание по аудиториям", "Room-synced schedule"],
  "Rată Înrolare Cursuri": ["Охват курсами", "Course Enrollment Rate"],
  "Grad înrolare elevi": ["Доля записанных учеников", "Student enrollment ratio"],
  "Finanțe & Abonamente": ["Финансы и абонементы", "Finance & Subscriptions"],
  "Registru facturi": ["Реестр счетов", "Invoices registry"],
  "Încasări Confirmate": ["Подтверждённые оплаты", "Confirmed Collections"],
  "Venit total colectat din taxe": ["Общая сумма собранных оплат", "Total tuition revenue collected"],
  "Facturat Total (Abonamente)": ["Выставлено всего (Абонементы)", "Total Invoiced (Subscriptions)"],
  "Volum facturi generate": ["Объём выставленных счетов", "Total generated invoice volume"],
  "Restanțe Active (Datorii)": ["Активные задолженности (Долги)", "Active Arrears (Debt)"],
  "Detalii →": ["Подробнее →", "Details →"],

  // Attendance Page, Journal & Matrix
  "Catalog Prezență": ["Журнал посещаемости", "Attendance Journal"],
  "Selectează o grupă pentru a deschide catalogul tip școală și a nota în 1-click.": [
    "Выберите группу, чтобы открыть школьный журнал и отметить посещаемость в 1 клик.",
    "Select a group to open the school attendance register and mark in 1 click.",
  ],
  "Notează rapid prezența pentru lecția de azi cu salvare automată.": [
    "Быстрая отметка посещаемости на сегодняшнем уроке с автосохранением.",
    "Quickly mark today's lesson attendance with auto-save.",
  ],
  "Inspectează istoricul sesiunilor și analitica absențelor.": [
    "Просмотр истории занятий и аналитики пропусков.",
    "Inspect session history and absence analytics.",
  ],
  "Catalog Jurnal": ["Классный журнал", "Class Journal"],
  "Prezență Rapidă": ["Быстрая отметка", "Quick Check-in"],
  "Analitică & Matrice": ["Аналитика и матрица", "Analytics & Matrix"],
  "Matrice Globală": ["Общая матрица", "Global Matrix"],
  "Matrice & Istoric Prezență": ["Матрица и история посещаемости", "Attendance Matrix & History"],
  "Matrice & Istoric": ["Матрица и история", "Matrix & History"],
  "Perspectivă globală pe lecțiile trecute, analiza absențelor și modificări retroactive.": [
    "Общий обзор прошедших уроков, анализ пропусков и ретроактивное редактирование.",
    "Global overview of past lessons, absence analysis, and retroactive edits.",
  ],
  "Notează în Orar →": ["Отметить в расписании →", "Mark in Schedule →"],
  "Mergi la Orar pentru a nota prezența": [
    "Перейти в расписание для отметки посещаемости",
    "Go to Schedule to mark attendance",
  ],
  "Doar administratorii au permisiunea de a vizualiza matricea istorică și analitica de prezență.": [
    "Только администраторы имеют доступ к исторической матрице и аналитике посещаемости.",
    "Only administrators have permission to view historical matrix and attendance analytics.",
  ],
  "Toate cursurile": ["Все курсы", "All courses"],
  "Nicio grupă disponibilă": ["Нет доступных групп", "No groups available"],
  "Elevi Înrolați": ["Записано учеников", "Enrolled Students"],
  "Sesiuni Desfășurate": ["Проведено занятий", "Completed Sessions"],
  "Prezență Medie": ["Средняя посещаемость", "Average Attendance"],
  "Prezență Medie Grupă": ["Средняя посещаемость группы", "Group Average Attendance"],
  "Elevi în Risc": ["Группа риска", "At-Risk Students"],
  "Elevi în Risc (3+)": ["Группа риска (3+)", "At-Risk Students (3+)"],
  "3+ absențe înregistrate": ["3+ пропуска", "3+ recorded absences"],
  "Legendă:": ["Легенда:", "Legend:"],
  "💡 Click pe o celulă pentru editare retroactivă.": [
    "💡 Нажмите на ячейку для редактирования.",
    "💡 Click any cell for retroactive editing.",
  ],
  "Nu există sesiuni de prezență înregistrate pentru această grupă în perioada selectată.": [
    "За выбранный период нет записанных занятий для этой группы.",
    "No attendance sessions recorded for this group in the selected period.",
  ],
  "Se generează matricea istorică de prezență...": [
    "Формирование матрицы посещаемости...",
    "Generating attendance matrix...",
  ],
  "Selectați o grupă pentru a afișa matricea de prezență.": [
    "Выберите группу для отображения матрицы посещаемости.",
    "Select a group to display the attendance matrix.",
  ],
  "Atenție: Lecția de astăzi s-a încheiat! Vă rugăm să marcați prezența elevilor.": [
    "Внимание: сегодняшний урок завершён! Пожалуйста, отметьте посещаемость учеников.",
    "Attention: Today's lesson has ended! Please mark student attendance.",
  ],
  "Prezență Necesară": ["Требуется отметка", "Attendance Required"],
  "Lecție în desfășurare chiar acum! Catalogul a fost deschis automat.": [
    "Урок идёт прямо сейчас! Журнал открыт автоматически.",
    "Lesson in progress right now! The journal was opened automatically.",
  ],
  "Sesiune Activă": ["Активный урок", "Active Session"],
  "Înapoi la lista de grupe": ["Назад к списку групп", "Back to groups list"],
  "Grupa precedentă": ["Предыдущая группа", "Previous group"],
  "Grupa următoare": ["Следующая группа", "Next group"],
  "Luna precedentă": ["Предыдущий месяц", "Previous month"],
  "Luna următoare": ["Следующий месяц", "Next month"],
  "Salvează": ["Сохранить", "Save"],
  "Se salvează...": ["Сохранение...", "Saving..."],
  "Salvat ✓": ["Сохранено ✓", "Saved ✓"],
  "Salvează prezența": ["Сохранить посещаемость", "Save attendance"],
  "Salvează prezența și confirmă modificările": [
    "Сохранить посещаемость и подтвердить изменения",
    "Save attendance and confirm changes",
  ],
  "Ecran Complet": ["Во весь экран", "Full Screen"],
  "Ecran complet": ["Во весь экран", "Full screen"],
  "Ieși (ESC)": ["Выйти (ESC)", "Exit (ESC)"],
  "Ieși din ecran complet": ["Выйти из полноэкранного режима", "Exit full screen"],
  "Ieși din ecran complet (tasta ESC)": [
    "Выйти из полноэкранного режима (ESC)",
    "Exit full screen (ESC key)",
  ],
  "Deschide pe tot ecranul": ["Открыть во весь экран", "Open in full screen"],
  "1 click": ["1 клик", "1 click"],
  "2 click": ["2 клика", "2 clicks"],
  "Admin: Toate datele editabile": ["Админ: все даты доступны", "Admin: All dates editable"],
  "Doar ziua curentă": ["Только текущий день", "Current day only"],
  "Filtrează:": ["Фильтр:", "Filter:"],
  "Caută elev...": ["Поиск ученика...", "Search student..."],
  "Caută grupă, sală, profesor...": [
    "Поиск группы, аудитории, преподавателя...",
    "Search group, room, teacher...",
  ],
  "Listă Zi": ["По дням", "Day View"],
  "Tabel Matrice": ["Таблица", "Matrix View"],
  "Lecția precedentă": ["Предыдущий урок", "Previous lesson"],
  "Lecția următoare": ["Следующий урок", "Next lesson"],
  "Azi": ["Сег.", "Today"],
  "Lecție Astăzi": ["Урок сегодня", "Lesson Today"],
  "Editare Admin": ["Режим админа", "Admin Edit"],
  "Arhivă": ["Архив", "Archive"],
  "Marchează toți prezenți": ["Отметить всех присут.", "Mark all present"],
  "Nu există elevi înscriși în această grupă.": [
    "В этой группе нет записанных учеников.",
    "No students enrolled in this group.",
  ],
  "Niciun elev nu corespunde filtrelor selectate.": [
    "Нет учеников, соответствующих выбранным фильтрам.",
    "No students match the selected filters.",
  ],
  "Se încarcă catalogul clasei...": ["Загрузка журнала группы...", "Loading class journal..."],
  "Se încarcă sesiunea...": ["Загрузка сессии...", "Loading session..."],
  "Prezent": ["Присут.", "Present"],
  "Absent": ["Отсут.", "Absent"],
  "Întârziat": ["Опоздал", "Late"],
  "Scuzat": ["Уваж.", "Excused"],
  "Nemarcat": ["Не отм.", "Unmarked"],
  "Notă": ["Заметка", "Note"],
  "Notă ✓": ["Заметка ✓", "Note ✓"],
  "Modifică": ["Изменить", "Edit"],
  "Motiv absență / notă...": ["Причина пропуска / заметка...", "Absence reason / note..."],
  "Adaugă sau modifică notă": ["Добавить или изменить заметку", "Add or edit note"],
  "Întârziat 10 min din cauza transportului": [
    "Опоздал на 10 мин из-за транспорта",
    "10 min late due to traffic",
  ],
  "Sună": ["Позвонить", "Call"],
  "Elev (Nume, Abonament & Contact)": [
    "Ученик (Имя, Абонемент и Контакт)",
    "Student (Name, Plan & Contact)",
  ],
  "Elev": ["Ученик", "Student"],
  "Prez": ["Прис", "Pres"],
  "Abs": ["Отс", "Abs"],
  "Total Prezenți pe Lecție:": ["Всего присутствовало на уроке:", "Total Present per Lesson:"],
  "Total:": ["Итого:", "Total:"],
  "Nicio grupă găsită": ["Группы не найдены", "No groups found"],
  "Nu există grupe disponibile": ["Нет доступных групп", "No groups available"],
  "Nu a fost găsită nicio grupă conform filtrelor alese. Încercați alt termen de căutare.": [
    "По выбранным фильтрам группы не найдены. Попробуйте изменить запрос.",
    "No groups match the selected filters. Try another search term.",
  ],
  "Nu aveți grupe alocate pentru completarea catalogului de prezență.": [
    "У вас нет назначенных групп для заполнения журнала посещаемости.",
    "You have no assigned groups for attendance tracking.",
  ],
  "Deschide Catalog": ["Открыть журнал", "Open Journal"],
  "Deschide Catalogul →": ["Открыть журнал →", "Open Journal →"],
  "Fără program stabilit": ["Без расписания", "No schedule set"],
  "Fără sală": ["Без аудитории", "No room"],
  "Fără profesor": ["Без преподавателя", "No teacher"],

  // Student Billing Badge & Invoice Statuses
  "Restant": ["Просрочен", "Overdue"],
  "Restantă": ["Просрочен", "Overdue"],
  "Factură restantă": ["Просроченный счёт", "Overdue invoice"],
  "Neachitat": ["Не оплачен", "Unpaid"],
  "Neachitată": ["Не оплачен", "Unpaid"],
  "Neachitat luna curentă": ["Не оплачен в текущем месяце", "Unpaid current month"],
  "Achitat": ["Оплачен", "Paid"],
  "Achitată": ["Оплачен", "Paid"],
  "Achitat integral": ["Оплачен полностью", "Paid in full"],
  "Parțial achitată": ["Частично оплачен", "Partially paid"],
  "Achitat parțial": ["Частично оплачен", "Partially paid"],
  "Ciornă": ["Черновик", "Draft"],
  "Emisă": ["Выставлен", "Issued"],
  "Anulată": ["Отменён", "Cancelled"],
  "Abonament ✓": ["Абонемент ✓", "Subscription ✓"],
  "Per lecție": ["Поурочно", "Per lesson"],
  "Per ședință": ["Поурочно", "Per session"],
  "Situațional / Eveniment": ["Разовый / Событие", "Ad-hoc / Event"],
  "Situativ / Ad-hoc": ["Разовый / Ситуативный", "Situational / Ad-hoc"],
  "Fără factură": ["Без счёта", "No invoice"],
  "Abonament (fără factură)": ["Абонемент (без счёта)", "Subscription (no invoice)"],
  "În așteptare": ["Ожидает", "Pending"],
  "Plată în așteptare": ["Ожидает оплаты", "Payment pending"],
  "Abonament lunar": ["Месячный абонемент", "Monthly subscription"],
  "Abonament curs complet": ["Полный курс", "Full course package"],
  "Plată per lecție": ["Поурочная оплата", "Pay per lesson"],
  "Plan personalizat": ["Индивидуальный тариф", "Custom plan"],
  "Restanță": ["Долг", "Arrears"],
  "Activ": ["Активен", "Active"],
  "Activă": ["Активна", "Active"],
  "Inactiv": ["Неактивен", "Inactive"],
  "Inactivă": ["Неактивна", "Inactive"],
  "Plan tarifar:": ["Тарифный план:", "Billing plan:"],
  "Tarif stabilit:": ["Установленный тариф:", "Configured rate:"],
  "Luna curentă:": ["Текущий месяц:", "Current month:"],
  "Fără factură emisă": ["Счёт не выставлен", "No invoice issued"],
  "Factură:": ["Счёт:", "Invoice:"],
  "Factură": ["Счёт", "Invoice"],
  "Scadență:": ["Срок оплаты:", "Due date:"],
  "Scadență": ["Срок оплаты", "Due Date"],
  "Rest de plată": ["Остаток к оплате", "Balance due"],
  "Total datorie:": ["Общий долг:", "Total debt:"],
  "0 MDL (La zi)": ["0 MDL (Оплачено)", "0 MDL (Up to date)"],
  "Registru Facturi →": ["Реестр счетов →", "Invoices Registry →"],
  "Esc pentru a închide": ["Esc чтобы закрыть", "Esc to close"],

  // Schedule Page & Filters
  "Orar General & Săli": ["Общее расписание и аудитории", "Master Schedule & Rooms"],
  "Orar & Distribuție Săli": ["Расписание и аудитории", "Schedule & Room Allocation"],
  "Planificarea cabinetelor, a orelor și a grupelor pe săli în timp real": [
    "Планирование кабинетов, часов и групп по аудиториям в реальном времени",
    "Real-time classroom, timetable, and group allocation planning",
  ],
  "Vizualizează distribuția grupelor pe zile, intervale orare și săli de curs.": [
    "Просмотр распределения групп по дням, часам и учебным аудиториям.",
    "View group distribution across days, time slots, and classrooms.",
  ],
  "Grupe în Orar": ["Групп в расписании", "Scheduled Groups"],
  "Grupe cu program alocat": ["Группы с назначенным расписанием", "Groups with assigned timetable"],
  "Săli Utilizate": ["Занятые аудитории", "Active Rooms"],
  "Cabinete ocupate activ": ["Активно используемые кабинеты", "Classrooms actively in use"],
  "Elevi în Orar": ["Учеников в расписании", "Scheduled Students"],
  "Total elevi cu ore stabilite": [
    "Ученики с назначенным расписанием",
    "Total students with scheduled classes",
  ],
  "Stare Săli": ["Статус аудиторий", "Room Status"],
  "suprapunere": ["конфликт", "conflict"],
  "suprapuneri": ["конфликтов", "conflicts"],
  "Optimal": ["Оптимально", "Optimal"],
  "Alerte de suprapunere sală": ["Конфликты аудиторий", "Room overlap alerts"],
  "Fără suprapuneri de săli": ["Без конфликтов аудиторий", "No room conflicts"],
  "Fără sală alocată": ["Без аудитории", "Unassigned room"],
  "Resetează": ["Сбросить", "Reset"],
  "+ Adaugă Grupă în Orar": ["+ Добавить группу в расписание", "+ Add Group to Schedule"],
  "Adaugă Grupă în Orar": ["Добавить группу в расписание", "Add Group to Schedule"],
  "Matrice Grupe": ["Матрица групп", "Group Matrix"],
  "Matrice": ["Матрица", "Matrix"],
  "Distribuție Săli": ["По аудиториям", "By Rooms"],
  "Săli": ["Аудитории", "Rooms"],
  "Săptămânal": ["По неделям", "Weekly"],
  "Săptămână": ["Неделя", "Week"],
  "Toate Zilele": ["Все дни", "All Days"],
  "Toate": ["Все", "All"],
  "Ocupate": ["Занятые", "Occupied"],
  "Caută grupă, curs, sală, profesor...": [
    "Поиск группы, курса, аудитории, преподавателя...",
    "Search group, course, room, teacher...",
  ],
  "Sortare:": ["Сортировка:", "Sort by:"],
  "Curs": ["Курс", "Course"],
  "Nr. Elevi": ["Кол-во уч.", "Students"],
  "Grupele mele": ["Мои группы", "My groups"],
  "Resetează filtre": ["Сбросить фильтры", "Reset filters"],
  "Resetează filtrele": ["Сбросить фильтры", "Reset filters"],
  "Grupă / Curs": ["Группа / Курс", "Group / Course"],
  "Luni": ["Понедельник", "Monday"],
  "Marți": ["Вторник", "Tuesday"],
  "Miercuri": ["Среда", "Wednesday"],
  "Joi": ["Четверг", "Thursday"],
  "Vineri": ["Пятница", "Friday"],
  "Sâmbătă": ["Суббота", "Saturday"],
  "Duminică": ["Воскресенье", "Sunday"],

  // Courses Page & Course Detail
  "Catalog Cursuri": ["Каталог курсов", "Courses Catalog"],
  "Gestionează programa școlară, grupele de studiu și materialele didactice.": [
    "Управление учебной программой, группами и учебными материалами.",
    "Manage school curriculum, study groups, and learning materials.",
  ],
  "Administrează cursurile, orarele, sălile și capacitatea grupelor": [
    "Управление курсами, расписанием, аудиториями и вместимостью групп",
    "Manage courses, schedules, classrooms, and group capacity",
  ],
  "+ Adaugă Curs": ["+ Добавить курс", "+ Add Course"],
  "Adaugă Curs": ["Добавить курс", "Add Course"],
  "Adaugă Curs Nou": ["Добавить новый курс", "Add New Course"],
  "Caută curs...": ["Поиск курса...", "Search course..."],
  "Caută curs după nume...": ["Поиск курса по названию...", "Search course by name..."],
  "Caută după nume sau descriere...": [
    "Поиск по названию или описанию...",
    "Search by name or description...",
  ],
  "Caută după nume, profesor, sală...": [
    "Поиск по названию, преподавателю, аудитории...",
    "Search by name, teacher, room...",
  ],
  "Toate Nivelurile": ["Все уровни", "All Levels"],
  "Începător": ["Начальный", "Beginner"],
  "Intermediar": ["Средний", "Intermediate"],
  "Mediu": ["Средний", "Intermediate"],
  "Avansat": ["Продвинутый", "Advanced"],
  "Vezi Grupe": ["Группы", "View Groups"],
  "Editează": ["Изменить", "Edit"],
  "Șterge": ["Удалить", "Delete"],
  "Dezactivează": ["Деактивировать", "Deactivate"],
  "Activează": ["Активировать", "Activate"],
  "Arhivează": ["В архив", "Archive"],
  "Curs Activ": ["Активный курс", "Active Course"],
  "Curs Inactiv": ["Неактивный курс", "Inactive Course"],
  "Sesiuni": ["Занятия", "Sessions"],
  "Durată sesiune": ["Длительность урока", "Session duration"],
  "Grupe & Sesiuni": ["Группы и занятия", "Groups & Sessions"],
  "Detalii & Materiale": ["Детали и материалы", "Details & Materials"],
  "Descriere Curs": ["Описание курса", "Course Description"],
  "Nu există o descriere completă pentru acest curs.": [
    "Полное описание для этого курса отсутствует.",
    "No detailed description available for this course.",
  ],
  "Materiale Didactice & Curriculum": ["Учебные материалы и программа", "Study Materials & Curriculum"],
  "Resursele educaționale, lecțiile video, documentele PDF și activitățile interactive sunt administrate centralizat în Brio Learn.": [
    "Образовательные ресурсы, видеоуроки, PDF-документы и интерактивные задания управляются централизованно в Brio Learn.",
    "Educational resources, video lessons, PDFs, and interactive activities are managed centrally in Brio Learn.",
  ],
  "Înapoi la cursuri": ["Назад к курсам", "Back to courses"],

  // Students Page & Profile
  "Catalog Studenți": ["Каталог учеников", "Students Catalog"],
  "Gestionează datele de contact, înscrierile și activitatea fiecărui elev.": [
    "Управление контактами, записями и активностью каждого ученика.",
    "Manage contact details, enrollments, and activity for every student.",
  ],
  "+ Adaugă Student": ["+ Добавить ученика", "+ Add Student"],
  "Adaugă Student": ["Добавить ученика", "Add Student"],
  "Registru Elevi": ["Реестр учеников", "Student Registry"],
  "Caută după nume sau telefon...": ["Поиск по имени или телефону...", "Search by name or phone..."],
  "Toate Școlile": ["Все школы", "All Schools"],
  "Toate Cursurile": ["Все курсы", "All Courses"],
  "Doar Înrolați": ["Только записанные", "Enrolled Only"],
  "Fără Curs Asignat": ["Без курса", "Unassigned"],
  "Total Studenți": ["Всего учеников", "Total Students"],
  "Total elevi înregistrați": ["Всего зарегистрировано", "Total registered students"],
  "Fără Curs": ["Без курса", "No Course"],
  "Necesită distribuire": ["Требуется распределение", "Needs assignment"],
  "Student": ["Ученик", "Student"],
  "Telefon Contact": ["Телефон", "Contact Phone"],
  "Cursuri Asignate": ["Назначенные курсы", "Assigned Courses"],
  "Statut": ["Статус", "Status"],
  "Status": ["Статус", "Status"],
  "Acțiuni": ["Действия", "Actions"],
  "Dosar Elev": ["Досье ученика", "Student Dossier"],
  "Fișă Elev": ["Профиль ученика", "Student Profile"],
  "Fișă completă": ["Полное досье", "Full profile"],
  "Asignează curs": ["Назначить курс", "Assign course"],
  "Înapoi la Catalog Studenți": ["Назад в каталог учеников", "Back to Students Catalog"],
  "Înrolare în Grupă": ["Записать в группу", "Enroll in Group"],
  "Înscris la": ["Записан", "Enrolled on"],
  "Apelează": ["Позвонить", "Call"],
  "De plată": ["К оплате", "Balance due"],
  "Vezi istoricul plăților & facturi": ["История платежей и счета", "View payment history & invoices"],
  "Facturi & Plăți": ["Счета и платежи", "Invoices & Payments"],
  "Observații": ["Заметки", "Notes"],
  "+ Înscrie în altă grupă": ["+ Записать в другую группу", "+ Enroll in another group"],
  "Grupe & Cursuri Active": ["Активные группы и курсы", "Active Groups & Courses"],
  "Istoric Cursuri Finalizate & Arhivate": [
    "История завершённых и архивных курсов",
    "Completed & Archived Courses History",
  ],
  "+ Înrolare nouă": ["+ Новая запись", "+ New enrollment"],
  "Orar Săptămânal:": ["Расписание:", "Weekly Schedule:"],
  "Sală / Locație:": ["Аудитория / Место:", "Room / Location:"],
  "Data Înrolării:": ["Дата записи:", "Enrollment Date:"],
  "Schimbă Status / Arhivează": ["Изменить статус / В архив", "Change Status / Archive"],

  // Invoices & Financial Statistics
  "Facturare & Plăți": ["Счета и платежи", "Billing & Payments"],
  "Gestiunea centralizată a facturilor, plăților și a datoriilor școlii.": [
    "Централизованное управление счетами, платежами и задолженностями школы.",
    "Centralized management of school invoices, payments, and arrears.",
  ],
  "Gestionează facturile emise, plățile încasate și abonamentele lunare ale elevilor.": [
    "Управление выставленными счетами, полученными платежами и абонементами учеников.",
    "Manage issued invoices, collected payments, and monthly student subscriptions.",
  ],
  "Factură Situațională": ["Разовый счёт", "Ad-hoc Invoice"],
  "Emite Factură": ["Выставить счёт", "Issue Invoice"],
  "Total Facturat": ["Выставлено всего", "Total Invoiced"],
  "Volum total facturi emise": ["Общий объём выставленных счетов", "Total volume of issued invoices"],
  "Total Încasat": ["Оплачено всего", "Total Collected"],
  "Datorii Active": ["Активные долги", "Active Debt"],
  "Restanțe neachitate în curs": ["Неоплаченные задолженности", "Outstanding unpaid balances"],
  "Facturi Restante": ["Просроченные счета", "Overdue Invoices"],
  "Termen de plată depășit": ["Срок оплаты истёк", "Past due date"],
  "Nicio factură restantă": ["Нет просроченных счетов", "No overdue invoices"],
  "Caută după număr factură sau nume elev...": [
    "Поиск по номеру счёта или имени ученика...",
    "Search by invoice number or student name...",
  ],
  "Caută student sau # factură...": [
    "Поиск ученика или № счёта...",
    "Search student or # invoice...",
  ],
  "Toate Grupele": ["Все группы", "All Groups"],
  "Toate grupele": ["Все группы", "All groups"],
  "Toate Tipurile": ["Все типы", "All Types"],
  "Toate tipurile de plată": ["Все типы оплаты", "All payment types"],
  "Neachitate": ["Неоплаченные", "Unpaid"],
  "Restante": ["Просроченные", "Overdue"],
  "Achitate": ["Оплаченные", "Paid"],
  "Abonament": ["Абонемент", "Subscription"],
  "Situațională": ["Разовый", "Ad-hoc"],
  "Grupă & Tip": ["Группа и тип", "Group & Type"],
  "Sumă & Sold": ["Сумма и остаток", "Amount & Balance"],
  "Achită": ["Оплатить", "Pay"],
  "Exportă CSV": ["Экспорт CSV", "Export CSV"],
  "Statistici Financiare & Restanțieri": [
    "Финансовая статистика и должники",
    "Financial Analytics & Debtors",
  ],
  "Monitorizează indicatorii de încasare, veniturile recurente și gestionează restanțele elevilor.": [
    "Мониторинг показателей собираемости, регулярных доходов и задолженностей учеников.",
    "Monitor collection rates, recurring revenue, and manage student arrears.",
  ],
  "Luna Curentă": ["Текущий месяц", "Current Month"],
  "Anul Curent": ["Текущий год", "Current Year"],
  "Personalizat": ["Период", "Custom"],
  "Alege intervalul:": ["Выберите период:", "Select range:"],
  "De la:": ["С:", "From:"],
  "Până la:": ["По:", "To:"],
  "Prezentare & Venituri": ["Обзор и доходы", "Overview & Revenue"],
  "Registru Restanțieri": ["Реестр должников", "Debtors Registry"],
  "Rata de Colectare": ["Процент собираемости", "Collection Rate"],
  "Rată Colectare": ["Собираемость", "Collection Rate"],
  "Rată colectare:": ["Собираемость:", "Collection rate:"],
  "Performanță excelentă de colectare": [
    "Отличный показатель собираемости",
    "Excellent collection performance",
  ],
  "Nivel moderat de încasare": ["Средний уровень собираемости", "Moderate collection level"],
  "Atenție: risc ridicat de restanțe": [
    "Внимание: высокий риск задолженностей",
    "Warning: high arrears risk",
  ],
  "Încasări Luna Curentă (MTD)": ["Поступления за месяц (MTD)", "Collected This Month (MTD)"],
  "Datorie Totală Activă": ["Общая активная задолженность", "Total Active Debt"],
  "Venit Recurent Proiectat (MRR)": [
    "Прогноз регулярного дохода (MRR)",
    "Projected Recurring Revenue (MRR)",
  ],
  "MDL / lună": ["MDL / мес.", "MDL / mo"],
  "Estimare pe baza abonamentelor active": [
    "Оценка на основе активных абонементов",
    "Estimated from active subscriptions",
  ],
  "Analiză Venituri pe Cursuri & Grupe": [
    "Анализ доходов по курсам и группам",
    "Revenue Breakdown by Courses & Groups",
  ],
  "Venituri facturate, încasate și datorii per curs sau grupă": [
    "Выставленные, оплаченные суммы и долги по курсам и группам",
    "Billed, collected revenue, and debt per course or group",
  ],
  "Nu există facturi asociate vreunui curs în perioada selectată.": [
    "За выбранный период нет счетов, привязанных к курсам.",
    "No course invoices found for the selected period.",
  ],
  "Nu există facturi asociate vreunei grupe în perioada selectată.": [
    "За выбранный период нет счетов, привязанных к группам.",
    "No group invoices found for the selected period.",
  ],
  "Facturat": ["Выставлено", "Billed"],
  "Încasat": ["Оплачено", "Collected"],
  "Încasat:": ["Оплачено:", "Collected:"],
  "Datorie": ["Долг", "Debt"],
  "Evoluție Lunară: Facturat vs Încasat": [
    "Динамика по месяцам: Выставлено и Оплачено",
    "Monthly Trend: Billed vs Collected",
  ],
  "Comparație între volumul facturat și plățile încasate pe luni": [
    "Сравнение выставленных счетов и полученных оплат по месяцам",
    "Monthly comparison between billed volume and collected payments",
  ],
  "Nu există date pentru perioada selectată.": [
    "Нет данных за выбранный период.",
    "No data available for the selected period.",
  ],
  "Distribuție Modele Facturare": ["Распределение моделей оплаты", "Billing Models Distribution"],
  "Ponderea veniturilor pe tipuri de pachete": [
    "Доля доходов по типам пакетов",
    "Revenue share by package type",
  ],
  "Model principal:": ["Основная модель:", "Primary model:"],
  "Registru Restanțieri (Top Restanțe)": [
    "Реестр должников (Топ задолженностей)",
    "Debtors Registry (Top Arrears)",
  ],
  "Elevi cu facturi neachitate, ordonați după valoarea soldului și durata întârzierii.": [
    "Ученики с неоплаченными счетами, отсортированные по сумме долга и сроку просрочки.",
    "Students with unpaid invoices, sorted by balance amount and overdue days.",
  ],
  "Caută elev, părinte sau grupă...": [
    "Поиск ученика, родителя или группы...",
    "Search student, parent, or group...",
  ],
  "Toate sumele": ["Все суммы", "All amounts"],
  "Datorie Totală:": ["Общий долг:", "Total Debt:"],
  "Grupe Înscrise": ["Группы", "Enrolled Groups"],
  "Contact Părinte (Apel Direct)": ["Контакт родителя (Звонок)", "Parent Contact (Direct Call)"],
  "Zile Întârziere": ["Дней просрочки", "Overdue Days"],
  "Datorie Totală": ["Сумма долга", "Total Debt"],
  "Fără grupă": ["Без группы", "No group"],
  "Nicio restanță găsită!": ["Задолженностей не найдено!", "No arrears found!"],
  "Toate facturile emise sunt achitate sau nu există restanțe active.": [
    "Все выставленные счета оплачены или активных задолженностей нет.",
    "All issued invoices are paid or there are no active arrears.",
  ],
  "Nu există restanțieri care să corespundă filtrelor selectate.": [
    "Нет должников, соответствующих выбранным фильтрам.",
    "No debtors match the selected filters.",
  ],
  "Încasează": ["Оплатить", "Collect"],
  "Chitanță": ["Квитанция", "Receipt"],
  "Anulează": ["Отмена", "Cancel"],

  // Users & Permissions
  "Administrează conturile de acces, rolurile de securitate și școlile asociate.": [
    "Управление аккаунтами доступа, ролями безопасности и привязанными школами.",
    "Manage access accounts, security roles, and associated schools.",
  ],
  "Definiții Permisiuni": ["Описание прав", "Permission Definitions"],
  "Adaugă Utilizator": ["Добавить пользователя", "Add User"],
  "Conturi înregistrate": ["Зарегистрированные аккаунты", "Registered accounts"],
  "Conturi Active": ["Активные аккаунты", "Active Accounts"],
  "Acces autorizat": ["Доступ разрешён", "Authorized access"],
  "Conturi Inactive": ["Неактивные аккаунты", "Inactive Accounts"],
  "Acces suspendat": ["Доступ приостановлен", "Suspended access"],
  "Administratori": ["Администраторы", "Administrators"],
  "Roluri cu drepturi avansate": ["Роли с расширенными правами", "Roles with elevated privileges"],
  "Caută după nume sau email...": ["Поиск по имени или email...", "Search by name or email..."],
  "Toate Statusurile": ["Все статусы", "All Statuses"],
  "Doar Activi": ["Только активные", "Active Only"],
  "Doar Inactivi": ["Только неактивные", "Inactive Only"],
  "Toate Rolurile": ["Все роли", "All Roles"],
  "Profesor": ["Преподаватель", "Teacher"],
  "Utilizator": ["Пользователь", "User"],
  "Rol": ["Роль", "Role"],
  "Școală": ["Школа", "School"],
  "Permisiuni & Privilegii": ["Права и привилегии", "Permissions & Privileges"],
  "Gestionează definițiile permisiunilor de securitate și acces în cadrul tenant-ului.": [
    "Управление определениями прав безопасности и доступа в системе.",
    "Manage security and access permission definitions across the platform.",
  ],
  "Adaugă Permisiune": ["Добавить право", "Add Permission"],
  "Cheie Identificator": ["Ключ идентификатора", "Identifier Key"],
  "Etichetă": ["Название", "Label"],
  "Descriere": ["Описание", "Description"],

  // Roller Door & Settings
  "Control Roletă Intrare": ["Управление входной роллетой", "Entrance Roller Door Control"],
  "Comandă relay-ul Wi-Fi IoT pentru accesul securizat în clădire.": [
    "Управление Wi-Fi IoT-реле для безопасного доступа в здание.",
    "Control the Wi-Fi IoT relay for secure building access.",
  ],
  "Releu Intrare Conectat": ["Входное реле подключено", "Entrance Relay Connected"],
  "Se procesează comanda...": ["Выполнение команды...", "Processing command..."],
  "Receptor IoT activ prin protocol securizat MQTT / Tasmota.": [
    "Приёмник IoT активен по защищённому протоколу MQTT / Tasmota.",
    "IoT receiver active via secure MQTT / Tasmota protocol.",
  ],
  "Deschide Roleta": ["Открыть роллету", "Open Door"],
  "Închide Roleta": ["Закрыть роллету", "Close Door"],
  "Nu ai permisiunea să accesezi această pagină.": [
    "У вас нет прав для доступа к этой странице.",
    "You do not have permission to access this page.",
  ],
  "Setări Sistem & Cont": ["Настройки системы и аккаунта", "System & Account Settings"],
  "Configurează rechizitele oficiale ale școlii, securitatea contului și preferințele de acces.": [
    "Настройка официальных реквизитов школы, безопасности аккаунта и прав доступа.",
    "Configure official school billing details, account security, and access preferences.",
  ],
  "Campus Școlar Asignat": ["Назначенный школьный кампус", "Assigned School Campus"],
  "Toate Școlile (Global)": ["Все школы (Глобально)", "All Schools (Global)"],
  "Nivel de Securitate": ["Уровень безопасности", "Security Level"],
  "Control Total Superadmin": ["Полный доступ Суперадмина", "Full Superadmin Control"],
  "Permisiuni Active Asignate": ["Активные назначенные права", "Active Assigned Permissions"],
  "Profil & Relații Bancare Școală": [
    "Профиль и банковские реквизиты школы",
    "School Profile & Bank Details",
  ],
  "Aceste date apar pe chitanțele și facturile printabile emise elevilor.": [
    "Эти данные отображаются на печатных квитанциях и счетах, выставляемых ученикам.",
    "These details appear on printable receipts and invoices issued to students.",
  ],
  "Nume Campus / Instituție": ["Название кампуса / учреждения", "Campus / Institution Name"],
  "Adresă Sediu": ["Адрес филиала", "Campus Address"],
  "Telefon Contact Facturare": ["Контактный телефон для счетов", "Billing Contact Phone"],
  "Email Oficial Facturare": ["Официальный Email для счетов", "Official Billing Email"],
  "Rechizite Bancare pentru Transfer": [
    "Банковские реквизиты для перевода",
    "Bank Transfer Details",
  ],
  "Banca Beneficiară": ["Банк получателя", "Beneficiary Bank"],
  "Cont IBAN": ["Счёт IBAN", "IBAN Account"],
  "Cod Fiscal / IDNO": ["Фискальный код / IDNO", "Tax ID / IDNO"],
  "Salvează Datele Școlii": ["Сохранить данные школы", "Save School Details"],
  "Securitate Cont: Schimbă Parola": ["Безопасность: Сменить пароль", "Account Security: Change Password"],
  "Actualizează datele de acces pentru contul tău de utilizator.": [
    "Обновление пароля для вашего аккаунта пользователя.",
    "Update login credentials for your user account.",
  ],
  "Ascunde": ["Скрыть", "Hide"],
  "Extinde": ["Развернуть", "Expand"],
  "Parola Curentă": ["Текущий пароль", "Current Password"],
  "Parola Nouă": ["Новый пароль", "New Password"],
  "Confirmă Parola Nouă": ["Подтвердите новый пароль", "Confirm New Password"],
  "Actualizează Parola": ["Обновить пароль", "Update Password"],
  "Scurtături Rapide de Navigare": ["Быстрые ссылки навигации", "Quick Navigation Shortcuts"],
  "Gestiune Utilizatori": ["Управление пользователями", "User Management"],
  "Acces Restricționat": ["Доступ ограничен", "Restricted Access"],
  "ex: Vibe Academy Chișinău": ["напр.: Vibe Academy Кишинёв", "e.g. Vibe Academy Chisinau"],
  "ex: bd. Dacia 31/1, Chișinău": ["напр.: бул. Дачия 31/1, Кишинёв", "e.g. 31/1 Dacia Blvd, Chisinau"],

  // Modals, Drawers, Forms & Popovers (Complete Coverage)
  "Editează Utilizator": ["Редактировать пользователя", "Edit User"],
  "Creează un cont nou cu rol și permisiuni": [
    "Создание нового аккаунта с ролью и правами",
    "Create a new account with role and permissions",
  ],
  "Actualizează datele contului și permisiunile": [
    "Обновление данных аккаунта и прав доступа",
    "Update account details and permissions",
  ],
  "Nume": ["Имя", "Name"],
  "Introdu parolă": ["Введите пароль", "Enter password"],
  "Introdu nouă parolă sau lasă gol": [
    "Введите новый пароль или оставьте пустым",
    "Enter new password or leave blank",
  ],
  "Fără școală (Global)": ["Без школы (Глобально)", "No school (Global)"],
  "Nicio permisiune definită în sistem.": [
    "В системе не определено ни одного права доступа.",
    "No permissions defined in the system.",
  ],
  "Admin Școală": ["Администратор школы", "School Admin"],
  "Gestionează utilizatorii și cursurile din școala sa.": [
    "Управление пользователями и курсами своей школы.",
    "Manages users and courses within their school.",
  ],
  "Gestiune Facturare": ["Управление счетами", "Billing Management"],
  "Permite accesul la facturi, plăți și generarea abonamentelor recurente.": [
    "Доступ к счетам, платежам и генерации регулярных абонементов.",
    "Allows access to invoices, payments, and recurring subscription generation.",
  ],
  "Acces complet la sistem. Poate gestiona școli, utilizatori și permisiuni.": [
    "Полный доступ к системе. Управление школами, пользователями и правами.",
    "Full system access. Can manage schools, users, and permissions.",
  ],
  "Salvează Modificările": ["Сохранить изменения", "Save Changes"],
  "Creează Utilizator": ["Создать пользователя", "Create User"],
  "Se șterge...": ["Удаление...", "Deleting..."],
  "Sigur doriți să ștergeți acest utilizator?": [
    "Вы уверены, что хотите удалить этого пользователя?",
    "Are you sure you want to delete this user?",
  ],
  "Dicționar permisiuni și etichete sistem": [
    "Словарь прав доступа и системных меток",
    "Permissions dictionary and system labels",
  ],
  "Adaugă": ["Добавить", "Add"],
  "Definire Permisiune Nouă": ["Создание нового права доступа", "Define New Permission"],
  "Cheie permisiune (cod unic)": ["Ключ права (уникальный код)", "Permission key (unique code)"],
  "ex: open-front-door": ["напр.: open-front-door", "e.g. open-front-door"],
  "Etichetă descriptivă": ["Описательное название", "Descriptive label"],
  "ex: Acces Roletă Intrare": ["напр.: Доступ к входной роллете", "e.g. Entrance Door Access"],
  "Descriere rol (opțional)": ["Описание права (опционально)", "Permission description (optional)"],
  "Permite acționarea releului IoT la intrarea principală...": [
    "Разрешает управление реле IoT на главном входе...",
    "Allows triggering the IoT relay at the main entrance...",
  ],
  "Se încarcă definițiile permisiunilor...": [
    "Загрузка определений прав доступа...",
    "Loading permission definitions...",
  ],
  "Nu există permisiuni definite în sistem.": [
    "В системе нет определённых прав доступа.",
    "No permissions defined in the system.",
  ],
  "Șterge permisiune": ["Удалить право доступа", "Delete permission"],

  // StudentForm & Course/Group Allocation
  "Cursuri înscrise": ["Записанные курсы", "Enrolled Courses"],
  "Alocare Grupe (Opțional)": ["Распределение по группам (Опционально)", "Group Allocation (Optional)"],
  "curs selectat": ["курс выбран", "course selected"],
  "cursuri selectate": ["выбрано курсов", "courses selected"],
  "(sau telefon părinte)*": ["(или телефон родителя)*", "(or parent phone)*"],
  "(sau telefon părinte)": ["(или телефон родителя)", "(or parent phone)"],
  "(sau telefon student)*": ["(или телефон ученика)*", "(or student phone)*"],
  "Nu există grupe active pentru acest curs. (Elevul va fi înscris doar la nivel de curs).": [
    "Для этого курса нет активных групп. (Ученик будет записан только на курс).",
    "No active groups for this course. (Student will be enrolled at course level only).",
  ],
  "Fără grupă (doar înscriere la curs)": [
    "Без группы (только запись на курс)",
    "No group (course-only enrollment)",
  ],
  "Detalii adiționale despre elev...": [
    "Дополнительные сведения об ученике...",
    "Additional details about the student...",
  ],
  "Detalii suplimentare despre student...": [
    "Дополнительные сведения об ученике...",
    "Additional details about the student...",
  ],
  "Cont elev activ": ["Активный аккаунт ученика", "Active student account"],
  "Creează Student": ["Создать ученика", "Create Student"],
  "Format invalid. Ex: +373 69 000 000 sau 069000000": [
    "Неверный формат. Напр.: +373 69 000 000 или 069000000",
    "Invalid format. E.g. +373 69 000 000 or 069000000",
  ],
  "Introduceți cel puțin un număr de telefon (student sau părinte)": [
    "Введите хотя бы один номер телефона (ученика или родителя)",
    "Enter at least one phone number (student or parent)",
  ],

  // Attendance Popovers, Modals & Rapid Tab
  "Motivat": ["Уваж.", "Excused"],
  "Învoit": ["Уваж.", "Excused"],
  "motivați": ["уваж.", "excused"],
  "Modificare Prezență": ["Изменение посещаемости", "Edit Attendance"],
  "Dată Sesiune": ["Дата занятия", "Session Date"],
  "Data Sesiunii": ["Дата занятия", "Session Date"],
  "Status Prezență": ["Статус посещаемости", "Attendance Status"],
  "Comentariu / Motivare (opțional)": [
    "Комментарий / Причина (опционально)",
    "Comment / Reason (optional)",
  ],
  "Adaugă o observație scurtă...": ["Добавьте краткое примечание...", "Add a brief note..."],
  "Salvează Modificarea": ["Сохранить изменение", "Save Change"],
  "Eroare la actualizarea prezenței": [
    "Ошибка при обновлении посещаемости",
    "Error updating attendance",
  ],
  "Bolnav": ["Болен", "Sick"],
  "Învoit de părinte": ["Отпрошен родителем", "Excused by parent"],
  "Concurs / Olimpiadă": ["Конкурс / Олимпиада", "Competition / Olympiad"],
  "Vacanță familie": ["Семейный отъезд", "Family trip"],
  "Problemă transport": ["Проблема с транспортом", "Transport issue"],
  "Bolnav / motiv medical": ["Болен / медицинская причина", "Sick / medical reason"],
  "Învoit cu acordul părintelui": [
    "Отпрошен с согласия родителя",
    "Excused with parent permission",
  ],
  "Participare la concurs / olimpiadă": [
    "Участие в конкурсе / олимпиаде",
    "Competition / olympiad participation",
  ],
  "Plecat în vacanță cu familia": ["Уехал в отпуск с семьёй", "Away on family vacation"],
  "Motiv absență / observație": ["Причина пропуска / примечание", "Absence reason / note"],
  "Șterge comentariul": ["Удалить комментарий", "Clear comment"],
  "Ex: Anunțat de mamă pe WhatsApp, revine săptămâna viitoare...": [
    "Напр.: Мама предупредила в WhatsApp, вернётся на следующей неделе...",
    "E.g. Mother notified on WhatsApp, returning next week...",
  ],
  "Apasă Enter pentru salvare rapidă": [
    "Нажмите Enter для быстрого сохранения",
    "Press Enter for quick save",
  ],
  "Adaugă motiv / notă": ["Добавить причину / заметку", "Add reason / note"],
  "Ieri": ["Вчера", "Yesterday"],
  "Se sincronizează...": ["Синхронизация...", "Syncing..."],
  "Sincronizat": ["Синхронизировано", "Synced"],
  "Eroare la salvare. Reîncearcă.": ["Ошибка сохранения. Повторите.", "Save error. Try again."],
  "Se încarcă grupele atribuite...": ["Загрузка назначенных групп...", "Loading assigned groups..."],
  "Selectați o grupă pentru a nota prezența.": [
    "Выберите группу для отметки посещаемости.",
    "Select a group to mark attendance.",
  ],
  "Se încarcă lista elevilor...": ["Загрузка списка учеников...", "Loading students list..."],
  "Nu sunt elevi înscriși în această grupă.": [
    "В этой группе нет записанных учеников.",
    "No students enrolled in this group.",
  ],
  "Adăugați înscrieri pentru grupa selectată din catalogul de cursuri.": [
    "Добавьте учеников в выбранную группу через каталог курсов.",
    "Add enrollments for the selected group from the courses catalog.",
  ],

  // CourseForm, GroupFormModal, CourseGroupsDrawer & CourseGroupsTab
  "Editează Curs": ["Редактировать курс", "Edit Course"],
  "Modifică detaliile și configurația cursului": [
    "Изменение деталей и настроек курса",
    "Modify course details and configuration",
  ],
  "Creează un curs nou în catalogul școlii": [
    "Создание нового курса в каталоге школы",
    "Create a new course in the school catalog",
  ],
  "Denumire Curs": ["Название курса", "Course Name"],
  "Ex: Robotică & Arduino — Modul 1": [
    "Напр.: Робототехника и Arduino — Модуль 1",
    "E.g. Robotics & Arduino — Module 1",
  ],
  "Nivel Dificultate": ["Уровень сложности", "Difficulty Level"],
  "Standard / Toate nivelurile": ["Стандартный / Все уровни", "Standard / All levels"],
  "Durată Sesiune (ex: 90 min)": [
    "Длительность занятия (напр.: 90 мин)",
    "Session Duration (e.g. 90 min)",
  ],
  "Ex: 90 min": ["Напр.: 90 мин", "E.g. 90 min"],
  "Număr Sesiuni / Modul": ["Кол-во занятий / Модуль", "Sessions per Module"],
  "Ex: 12": ["Напр.: 12", "E.g. 12"],
  "Zile Săptămână (implicit)": ["Дни недели (по умолчанию)", "Days of Week (default)"],
  "Interval Orar (implicit)": ["Время занятий (по умолчанию)", "Time Slot (default)"],
  "Ex: 16:00 - 17:30": ["Напр.: 16:00 - 17:30", "E.g. 16:00 - 17:30"],
  "Descriere & Obiective": ["Описание и цели", "Description & Objectives"],
  "Scurtă descriere a materiei, competențelor dobândite și structurii cursului...": [
    "Краткое описание предмета, приобретаемых навыков и структуры курса...",
    "Brief description of the subject, skills acquired, and course structure...",
  ],
  "Curs activ (vizibil în catalog și disponibil pentru înscrieri)": [
    "Курс активен (виден в каталоге и доступен для записи)",
    "Active course (visible in catalog and open for enrollment)",
  ],
  "Sigur doriți să ștergeți acest curs? Grupele asociate vor fi de asemenea eliminate.": [
    "Вы уверены, что хотите удалить этот курс? Связанные группы также будут удалены.",
    "Are you sure you want to delete this course? Associated groups will also be removed.",
  ],
  "Creează Curs": ["Создать курс", "Create Course"],
  "Adaugă Grupă Nouă": ["Добавить новую группу", "Add New Group"],
  "Editează Grupă": ["Редактировать группу", "Edit Group"],
  "Modifică programul, sala sau profesorul alocat": [
    "Изменение расписания, аудитории или назначенного преподавателя",
    "Modify schedule, room, or assigned teacher",
  ],
  "Creează o grupă nouă și alocă-i un interval orar": [
    "Создание новой группы и назначение расписания",
    "Create a new group and assign a time slot",
  ],
  "Denumire Grupă": ["Название группы", "Group Name"],
  "Nume Grupă *": ["Название группы *", "Group Name *"],
  "Ex: Grupa A1 - Luni/Miercuri": ["Напр.: Группа A1 - Пн/Ср", "E.g. Group A1 - Mon/Wed"],
  "Ex: Grupa M1 - Matematică": ["Напр.: Группа M1 - Математика", "E.g. Group M1 - Math"],
  "Selectează cursul...": ["Выберите курс...", "Select course..."],
  "Neasignat": ["Не назначен", "Unassigned"],
  "Fără profesor asignat": ["Без назначенного преподавателя", "No teacher assigned"],
  "Sală / Locație": ["Аудитория / Место", "Room / Location"],
  "Sală / Cabinet": ["Аудитория / Кабинет", "Room / Classroom"],
  "Ex: Sala 204 / Lab 1": ["Напр.: Аудитория 204 / Лаб 1", "E.g. Room 204 / Lab 1"],
  "Ex: Sala 101 / Lab Robotică": [
    "Напр.: Аудитория 101 / Лаб. Робототехники",
    "E.g. Room 101 / Robotics Lab",
  ],
  "Zile de Curs": ["Дни занятий", "Class Days"],
  "Zile de desfășurare": ["Дни проведения", "Schedule days"],
  "Selectați cel puțin o zi": ["Выберите хотя бы один день", "Select at least one day"],
  "Interval Orar": ["Время занятий", "Time Slot"],
  "Oră început": ["Время начала", "Start time"],
  "Oră sfârșit": ["Время окончания", "End time"],
  "Suprapunere detectată în sală!": [
    "Обнаружено пересечение в аудитории!",
    "Room overlap detected!",
  ],
  "Grupă activă (disponibilă pentru înscrieri și prezență)": [
    "Группа активна (доступна для записи и посещаемости)",
    "Active group (available for enrollment and attendance)",
  ],
  "Salvează Grupa": ["Сохранить группу", "Save Group"],
  "Creează Grupa": ["Создать группу", "Create Group"],
  "Creează Grupă": ["Создать группу", "Create Group"],
  "Grupe de Studiu & Sesiuni": ["Учебные группы и занятия", "Study Groups & Sessions"],
  "Organizează cohorte pe intervale orare, săli și profesori pentru acest curs.": [
    "Организация групп по времени, аудиториям и преподавателям для этого курса.",
    "Organize cohorts by time slots, rooms, and teachers for this course.",
  ],
  "Se încarcă grupele...": ["Загрузка групп...", "Loading groups..."],
  "Nicio grupă creată pentru acest curs": [
    "Для этого курса ещё не создано ни одной группы",
    "No groups created for this course",
  ],
  "Nu există grupe configurate pentru acest curs": [
    "Для этого курса нет настроенных групп",
    "No groups configured for this course",
  ],
  "Creează prima grupă pentru a putea înrola studenți și a marca prezența.": [
    "Создайте первую группу, чтобы записывать учеников и отмечать посещаемость.",
    "Create the first group to enroll students and mark attendance.",
  ],
  "Adaugă o grupă de studiu (ex: Grupa A - Luni/Miercuri 16:00) pentru a putea înscrie elevi.": [
    "Добавьте учебную группу (напр.: Группа A - Пн/Ср 16:00), чтобы записывать учеников.",
    "Add a study group (e.g. Group A - Mon/Wed 16:00) to enroll students.",
  ],
  "Creează Prima Grupă": ["Создать первую группу", "Create First Group"],
  "Orar:": ["Расписание:", "Schedule:"],
  "Sală:": ["Аудитория:", "Room:"],
  "Profesor:": ["Преподаватель:", "Teacher:"],
  "Nespecificată": ["Не указана", "Unspecified"],
  "Sală nespecificată": ["Аудитория не указана", "Room unspecified"],
  "Fără orar stabilit": ["Без расписания", "No schedule set"],
  "Ascunde Elevi": ["Скрыть учеников", "Hide Students"],
  "Vezi Elevi": ["Показать учеников", "View Students"],
  "Înscrie Elevi": ["Записать учеников", "Enroll Students"],
  "Înrolează Elevi": ["Записать учеников", "Enroll Students"],
  "Elevi Înscriși": ["Записанные ученики", "Enrolled Students"],
  "Se încarcă lista de elevi...": ["Загрузка списка учеников...", "Loading students list..."],
  "Niciun elev înscris în această grupă momentan.": [
    "В эту группу пока не записан ни один ученик.",
    "No students enrolled in this group yet.",
  ],
  "+ Înscrie elevi în grupă": ["+ Записать учеников в группу", "+ Enroll students in group"],
  "+ Înrolează Elevi": ["+ Записать учеников", "+ Enroll Students"],
  "Modifică Status:": ["Изменить статус:", "Change Status:"],
  "Completat": ["Завершён", "Completed"],
  "Finalizat": ["Завершён", "Completed"],
  "Arhivat": ["В архиве", "Archived"],
  "Tutore:": ["Опекун:", "Guardian:"],
  "Sigur doriți să ștergeți această grupă?": [
    "Вы уверены, что хотите удалить эту группу?",
    "Are you sure you want to delete this group?",
  ],
  "Ascunde formular": ["Скрыть форму", "Hide form"],
  "Închide Panoul": ["Закрыть панель", "Close Panel"],

  // Student Dossier, EnrollmentDrawer & Tabs
  "Selectează cursul și intervalul orar pentru înscrierea în grupă": [
    "Выберите курс и время для записи в группу",
    "Select the course and time slot for group enrollment",
  ],
  "grupă selectată": ["группа выбрана", "group selected"],
  "grupe selectate": ["выбрано групп", "groups selected"],
  "student selectat": ["ученик выбран", "student selected"],
  "studenți selectați": ["выбрано учеников", "students selected"],
  "Salvează Înscrierea": ["Сохранить запись", "Save Enrollment"],
  "Caută curs sau grupă...": ["Поиск курса или группы...", "Search course or group..."],
  "Caută student după nume sau telefon...": [
    "Поиск ученика по имени или телефону...",
    "Search student by name or phone...",
  ],
  "Filtru Curs:": ["Фильтр курса:", "Course Filter:"],
  "Toate cursurile disponibile": ["Все доступные курсы", "All available courses"],
  "⚠️ Conflict de orar detectat": [
    "⚠️ Обнаружен конфликт расписания",
    "⚠️ Schedule conflict detected",
  ],
  "Suprapunere de orar": ["Пересечение расписания", "Schedule overlap"],
  "Configurare Facturare & Tarif": [
    "Настройка оплаты и тарифа",
    "Billing & Tariff Configuration",
  ],
  "pentru noile înrolări": ["для новых записей", "for new enrollments"],
  "Model facturare": ["Модель оплаты", "Billing model"],
  "Model de facturare": ["Модель оплаты", "Billing model"],
  "Preț personalizat (MDL)": ["Индивидуальная цена (MDL)", "Custom price (MDL)"],
  "Preț implicit curs": ["Стандартная цена курса", "Default course price"],
  "Lasă gol pentru preț implicit curs": [
    "Оставьте пустым для стандартной цены курса",
    "Leave blank for default course price",
  ],
  "Reducere (%)": ["Скидка (%)", "Discount (%)"],
  "Reducere individuală (%)": ["Индивидуальная скидка (%)", "Individual discount (%)"],
  "Salvează Tarif": ["Сохранить тариф", "Save Tariff"],
  "Configurare Tarif Înrolare": [
    "Настройка тарифа обучения",
    "Enrollment Tariff Configuration",
  ],
  "Nu există cursuri disponibile": ["Нет доступных курсов", "No courses available"],
  "Nu au fost găsite cursuri active configurate pentru această școală.": [
    "Для этой школы не найдено активных настроенных курсов.",
    "No active courses configured for this school.",
  ],
  "Niciun curs găsit": ["Курсы не найдены", "No courses found"],
  "Nu există încă grupe create pentru acest curs.": [
    "Для этого курса ещё не созданы группы.",
    "No groups created for this course yet.",
  ],
  "Inactiv anterior": ["Ранее неактивен", "Previously inactive"],
  "Niciun student înscris la acest curs": [
    "На этот курс не записан ни один ученик",
    "No students enrolled in this course",
  ],
  "Nu a fost găsit niciun student": ["Ученики не найдены", "No students found"],
  "Fără telefon": ["Без телефона", "No phone"],
  "Fără contact": ["Без контакта", "No contact"],
  "Părinte nespecificat": ["Родитель не указан", "Unspecified parent"],
  "Sună Părinte": ["Позвонить родителю", "Call Parent"],
  "Lipsă număr": ["Нет номера", "No number"],
  "Înrolat": ["Записан", "Enrolled"],
  "Modifică Status Înscriere": ["Изменить статус записи", "Change Enrollment Status"],
  "Status Nou": ["Новый статус", "New Status"],
  "Activ (Grupă în derulare)": ["Активен (Обучается в группе)", "Active (Currently enrolled)"],
  "Finalizat (A absolvit nivelul cursului)": [
    "Завершён (Окончил уровень курса)",
    "Completed (Graduated course level)",
  ],
  "Arhivat (Retras / Trecut în arhivă)": [
    "В архиве (Отчислен / Архив)",
    "Archived (Withdrawn / Archived)",
  ],
  "Inactiv (Pauză temporară)": ["Неактивен (Временная пауза)", "Inactive (Temporary pause)"],
  "Notă sau Motivare (opțional)": [
    "Заметка или причина (опционально)",
    "Note or Reason (optional)",
  ],
  "Ex: A finalizat modulul cu succes, recomandare pentru nivelul următor...": [
    "Напр.: Успешно завершил модуль, рекомендован на следующий уровень...",
    "E.g. Successfully completed module, recommended for next level...",
  ],
  "Acces LMS Elev": ["Доступ ученика к LMS", "Student LMS Access"],
  "Parolă resetată cu succes!": ["Пароль успешно сброшен!", "Password reset successfully!"],
  "Credențiale generate cu succes!": [
    "Данные доступа успешно созданы!",
    "Credentials generated successfully!",
  ],
  "Fișă Acces Părinți & Elev": [
    "Карточка доступа для родителей и ученика",
    "Parent & Student Access Card",
  ],
  "Copiat": ["Скопировано", "Copied"],
  "Copiază": ["Копировать", "Copy"],
  "Mesaj Complet Copiat!": ["Полное сообщение скопировано!", "Full Message Copied!"],
  "Copiază Tot (Pentru Părinți)": [
    "Скопировать всё (Для родителей)",
    "Copy All (For Parents)",
  ],
  "Gata / Închide": ["Готово / Закрыть", "Done / Close"],
  "Cont Activ în LMS": ["Активный аккаунт в LMS", "Active LMS Account"],
  "Platformă:": ["Платформа:", "Platform:"],
  "Dacă elevul sau părintele a uitat parola, puteți genera o parolă nouă mai jos.": [
    "Если ученик или родитель забыл пароль, вы можете сгенерировать новый ниже.",
    "If the student or parent forgot the password, you can generate a new one below.",
  ],
  "Se resetează...": ["Сброс...", "Resetting..."],
  "Resetează Parola": ["Сбросить пароль", "Reset Password"],
  "Niciun cont LMS asociat": ["Нет привязанного аккаунта LMS", "No linked LMS account"],
  "Se generează...": ["Создание...", "Generating..."],
  "Generează Acces LMS": ["Создать доступ LMS", "Generate LMS Access"],
  "Vârstă Nespecificată": ["Возраст не указан", "Age Unspecified"],
  "Vârstă N/A": ["Возраст Н/Д", "Age N/A"],
  "Campus Principal": ["Главный кампус", "Main Campus"],
  "Număr Contract": ["Номер договора", "Contract Number"],
  "Acces LMS (learn.brio.md)": ["Доступ LMS (learn.brio.md)", "LMS Access (learn.brio.md)"],
  "Reprezentant Legal / Părinte": [
    "Законный представитель / Родитель",
    "Legal Guardian / Parent",
  ],
  "Reprezentant Nespecificat": ["Представитель не указан", "Unspecified Guardian"],
  "Contact Primar": ["Основной контакт", "Primary Contact"],
  "Fără număr înregistrat": ["Номер не зарегистрирован", "No phone registered"],
  "Sold & Plăți": ["Баланс и платежи", "Balance & Payments"],
  "La zi": ["Оплачено", "Up to date"],
  "Achitat la zi pentru luna curentă": [
    "Оплачено за текущий месяц",
    "Paid up to date for current month",
  ],
  "Părinte / Tutore": ["Родитель / Опекун", "Parent / Guardian"],
  "Telefon Student": ["Телефон ученика", "Student Phone"],
  "Detalii Înscriere": ["Детали записи", "Enrollment Details"],
  "Grupe & Cohorte": ["Группы и потоки", "Groups & Cohorts"],
  "Înrolare Grupe": ["Запись в группы", "Group Enrollment"],
  "Nu este înrolat în niciun curs sau grupă": [
    "Не записан ни на один курс или группу",
    "Not enrolled in any course or group",
  ],
  "Nicio grupă selectată": ["Группа не выбрана", "No group selected"],
  "Observații Pedagogice": ["Педагогические заметки", "Pedagogical Notes"],
  "Nu sunt menționate notițe sau recomandări speciale.": [
    "Особые заметки или рекомендации не указаны.",
    "No special notes or recommendations recorded.",
  ],
  "Se încarcă lista de grupe...": ["Загрузка списка групп...", "Loading groups list..."],
  "Nicio grupă activă în acest moment": [
    "В данный момент нет активных групп",
    "No active groups at the moment",
  ],
  "Elevul nu este înrolat în nicio grupă activă. Folosește butonul de mai jos pentru a-l înrola într-o grupă.": [
    "Ученик не записан ни в одну активную группу. Используйте кнопку ниже для записи.",
    "The student is not enrolled in any active group. Use the button below to enroll them.",
  ],
  "Înrolează în Curs": ["Записать на курс", "Enroll in Course"],
  "Profesor / Mentor:": ["Преподаватель / Ментор:", "Teacher / Mentor:"],
  "Sala Principală": ["Главная аудитория", "Main Room"],
  "Fără istoric de cursuri finalizate": [
    "Нет истории завершённых курсов",
    "No completed courses history",
  ],
  "Când un curs este marcat drept finalizat sau arhivat, acesta va apărea aici cu data completării și nivelul atins.": [
    "Когда курс отмечен как завершённый или архивный, он появится здесь с датой окончания и уровнем.",
    "When a course is marked completed or archived, it will appear here with completion date and level.",
  ],
  "Curs & Nivel": ["Курс и уровень", "Course & Level"],
  "Orar / Profesor": ["Расписание / Преподаватель", "Schedule / Teacher"],
  "Perioadă Înrolare": ["Период обучения", "Enrollment Period"],
  "Status Final": ["Итоговый статус", "Final Status"],
  "Modifică / Reactivează": ["Изменить / Восстановить", "Modify / Reactivate"],
  "Sinteză Prezență & Disciplină Cursuri": [
    "Сводка посещаемости и дисциплины",
    "Attendance & Discipline Summary",
  ],
  "Calculat pe baza tuturor sesiunilor desfășurate în grupele înrolate.": [
    "Рассчитано на основе всех проведённых занятий в записанных группах.",
    "Calculated across all completed sessions in enrolled groups.",
  ],
  "Rată Globală:": ["Общий показатель:", "Overall Rate:"],
  "Fără date": ["Нет данных", "No data"],
  "Total Sesiuni": ["Всего занятий", "Total Sessions"],
  "Lecții înregistrate în sistem": [
    "Занятий зарегистрировано в системе",
    "Lessons recorded in system",
  ],
  "Prezențe Totale": ["Всего посещений", "Total Attendances"],
  "Participare activă la clasă": [
    "Активное участие на занятиях",
    "Active class participation",
  ],
  "Absențe Nemotivate": ["Пропуски без причины", "Unexcused Absences"],
  "Sesiuni ratate fără învoire": [
    "Пропущенные занятия без уважительной причины",
    "Missed sessions without excuse",
  ],
  "Învoiri / Motivate": ["По уважительной причине", "Excused Absences"],
  "Absențe justificate medical/părinte": [
    "Пропуски по справке или заявлению родителя",
    "Medical or parent-excused absences",
  ],
  "Rata de participare efectivă": [
    "Фактический процент посещаемости",
    "Effective attendance rate",
  ],
  "Nicio sesiune desfășurată": ["Занятия ещё не проводились", "No sessions held yet"],
  "Cronologie Sesiuni de Curs & Prezență": [
    "Хронология занятий и посещаемости",
    "Course Sessions & Attendance Timeline",
  ],
  "Se încarcă istoricul de prezență...": [
    "Загрузка истории посещаемости...",
    "Loading attendance history...",
  ],
  "Nu există încă sesiuni de prezență înregistrate pentru acest elev.": [
    "Для этого ученика ещё нет записей о посещаемости.",
    "No attendance sessions recorded for this student yet.",
  ],
  "Prezențele vor apărea aici automat când profesorii marchează catalogul la cursuri.": [
    "Отметки появятся здесь автоматически, когда преподаватели заполнят журнал.",
    "Attendance records will appear here automatically when teachers mark the journal.",
  ],
  "Grupă & Orar": ["Группа и расписание", "Group & Schedule"],
  "Sală": ["Аудитория", "Room"],
  "Observație Profesor": ["Примечание преподавателя", "Teacher Note"],
  "Didactice & Pedagogice": ["Учебные и педагогические", "Didactic & Pedagogical"],
  "Observații Didactice & Pedagogice": [
    "Учебные и педагогические заметки",
    "Didactic & Pedagogical Notes",
  ],
  "Vizibilitate instructori": ["Видно преподавателям", "Visible to instructors"],
  "Nu sunt menționate observații didactice speciale pentru acest elev.": [
    "Для этого ученика не указаны особые учебные заметки.",
    "No special pedagogical observations recorded for this student.",
  ],
  "Contacte Urgență & Reprezentant Legal": [
    "Экстренные контакты и законный представитель",
    "Emergency Contacts & Legal Guardian",
  ],
  "Reprezentant Principal": ["Основной представитель", "Primary Guardian"],
  "Contact Secundar / Urgență": [
    "Дополнительный / Экстренный контакт",
    "Secondary / Emergency Contact",
  ],
  "Conform dosarului depus": ["Согласно поданному досье", "As per submitted dossier"],
  "Apelare în caz de indisponibilitate reprezentant": [
    "Звонить при недоступности основного представителя",
    "Call if primary guardian is unavailable",
  ],
  "Progres Curricular": ["Прогресс обучения", "Curriculum Progress"],
  "Modul Curent": ["Текущий модуль", "Current Module"],

  // Billing Modals, Invoices & Export CSV
  "Situativ": ["Разовый", "Situational"],
  "Parțial achitat": ["Частично оплачен", "Partially paid"],
  "Emis": ["Выставлен", "Issued"],
  "Anulat": ["Отменён", "Cancelled"],
  "Schiță": ["Черновик", "Draft"],
  "Numerar": ["Наличные", "Cash"],
  "Transfer bancar": ["Банковский перевод", "Bank transfer"],
  "Card": ["Карта", "Card"],
  "Se încarcă sumarul financiar...": [
    "Загрузка финансовой сводки...",
    "Loading financial summary...",
  ],
  "Statut Plăți Elev": ["Статус оплат ученика", "Student Payment Status"],
  "factură restantă": ["просроченный счёт", "overdue invoice"],
  "facturi restante": ["просроченных счетов", "overdue invoices"],
  "Fără restanțe": ["Без задолженностей", "No arrears"],
  "Elevul are sume neachitate sau parțial achitate în contul facturilor curente.": [
    "У ученика есть неоплаченные или частично оплаченные текущие счета.",
    "The student has unpaid or partially paid balances on current invoices.",
  ],
  "Toate facturile emise pentru acest elev sunt achitate la zi.": [
    "Все выставленные для этого ученика счета своевременно оплачены.",
    "All invoices issued for this student are paid up to date.",
  ],
  "Emite factură": ["Выставить счёт", "Issue invoice"],
  "Înregistrează plată": ["Записать оплату", "Record payment"],
  "Înregistrează Plată": ["Записать оплату", "Record Payment"],
  "Restanță Curentă": ["Текущий долг", "Current Arrears"],
  "Grupe Active": ["Активные группы", "Active Groups"],
  "Tarife & Scheme de Facturare Active": [
    "Активные тарифы и схемы оплаты",
    "Active Tariffs & Billing Plans",
  ],
  "Configurarea de preț și reducere aplicată elevului pentru fiecare grupă înscrisă.": [
    "Настройка цены и скидки ученика для каждой записанной группы.",
    "Price and discount configuration applied to the student for each enrolled group.",
  ],
  "Elevul nu are nicio grupă activă configurată pentru facturare.": [
    "У ученика нет активных групп, настроенных для выставления счетов.",
    "The student has no active groups configured for billing.",
  ],
  "Preț:": ["Цена:", "Price:"],
  "Standard curs": ["Стандарт курса", "Course standard"],
  "Editează tarif": ["Изменить тариф", "Edit tariff"],
  "Registru Facturi Elev": ["Реестр счетов ученика", "Student Invoices Registry"],
  "Istoricul tuturor facturilor emise, scadente sau achitate.": [
    "История всех выставленных, текущих и оплаченных счетов.",
    "History of all issued, due, or paid invoices.",
  ],
  "Se încarcă registrul facturilor...": [
    "Загрузка реестра счетов...",
    "Loading invoices registry...",
  ],
  "Nu a fost emisă nicio factură.": [
    "Ни одного счёта ещё не выставлено.",
    "No invoices have been issued.",
  ],
  "Folosiți butonul de emitere pentru a adăuga o factură situativă sau abonament.": [
    "Используйте кнопку выставления счёта, чтобы добавить разовый счёт или абонемент.",
    "Use the issue button to add a situational or subscription invoice.",
  ],
  "Nr. Factură": ["№ Счёта", "Invoice No."],
  "Tip": ["Тип", "Type"],
  "Total": ["Всего", "Total"],
  "Fără scadență": ["Без срока", "No due date"],
  "Istoric Încasări & Plăți": [
    "История поступлений и оплат",
    "Collections & Payments History",
  ],
  "Jurnalul complet al plăților înregistrate pentru acest elev.": [
    "Полный журнал платежей, зарегистрированных для этого ученика.",
    "Complete log of payments recorded for this student.",
  ],
  "tranzacții": ["транзакций", "transactions"],
  "Se încarcă istoricul plăților...": [
    "Загрузка истории платежей...",
    "Loading payment history...",
  ],
  "Nu a fost înregistrată nicio plată pentru acest elev.": [
    "Для этого ученика не зарегистрировано ни одного платежа.",
    "No payments recorded for this student.",
  ],
  "Data Plății": ["Дата оплаты", "Payment Date"],
  "Chitanță / Bon": ["Квитанция / Чек", "Receipt / Slip"],
  "Metodă": ["Способ", "Method"],
  "Sumă Încasată": ["Оплаченная сумма", "Collected Amount"],
  "Note": ["Заметки", "Notes"],
  "Emite Factură Nouă": ["Выставить новый счёт", "Issue New Invoice"],
  "Creați o factură de abonament, per lecție sau situativă cu articole detaliate.": [
    "Создание счёта за абонемент, поурочно или разового с детализацией позиций.",
    "Create a subscription, per-lesson, or situational invoice with detailed line items.",
  ],
  "Elev beneficiar": ["Ученик (плательщик)", "Student beneficiary"],
  "Schimbă": ["Изменить", "Change"],
  "Caută elev după nume sau telefon...": [
    "Поиск ученика по имени или телефону...",
    "Search student by name or phone...",
  ],
  "Căutare...": ["Поиск...", "Searching..."],
  "Niciun elev găsit": ["Ученики не найдены", "No students found"],
  "Grupă asociată (opțional)": [
    "Привязанная группа (опционально)",
    "Associated group (optional)",
  ],
  "Fără grupă specifică / General": [
    "Без конкретной группы / Общий",
    "No specific group / General",
  ],
  "Tip Factură": ["Тип счёта", "Invoice Type"],
  "Preseturi rapide pentru facturi situaționale:": [
    "Быстрые шаблоны для разовых счетов:",
    "Quick presets for situational invoices:",
  ],
  "Materiale didactice / Manuale": [
    "Учебные материалы / Учебники",
    "Study materials / Textbooks",
  ],
  "Taxă examinare / Certificare": [
    "Экзаменационный сбор / Сертификация",
    "Exam / Certification fee",
  ],
  "Lecție privată / Consultație": [
    "Индивидуальный урок / Консультация",
    "Private lesson / Consultation",
  ],
  "Taxă înscriere / Echipament": [
    "Регистрационный взнос / Оборудование",
    "Registration / Equipment fee",
  ],
  "Ajustare sold / Serviciu adițional": [
    "Корректировка баланса / Доп. услуга",
    "Balance adjustment / Additional service",
  ],
  "Articole Factură": ["Позиции счёта", "Invoice Items"],
  "Adaugă rând": ["Добавить строку", "Add row"],
  "Șterge articol": ["Удалить позицию", "Remove item"],
  "Descriere articol...": ["Описание позиции...", "Item description..."],
  "Descriere poziție...": ["Описание позиции...", "Line item description..."],
  "Cant.": ["Кол.", "Qty"],
  "Cantitate": ["Количество", "Quantity"],
  "Preț": ["Цена", "Price"],
  "Preț unitar (MDL)": ["Цена за ед. (MDL)", "Unit price (MDL)"],
  "Data scadenței": ["Срок оплаты", "Due date"],
  "Status inițial": ["Начальный статус", "Initial status"],
  "Emisă (Issued)": ["Выставлен (Issued)", "Issued"],
  "Ciornă (Draft)": ["Черновик (Draft)", "Draft"],
  "Note / Observații factură": ["Заметки / Примечания к счёту", "Invoice notes / observations"],
  "Detalii adiționale vizibile pe factură...": [
    "Дополнительные детали, отображаемые в счёте...",
    "Additional details visible on the invoice...",
  ],
  "Subtotal articole:": ["Подытог позиций:", "Items subtotal:"],
  "Total de plată:": ["Итого к оплате:", "Total due:"],
  "Total De Plată": ["Итого к оплате", "Total Due"],
  "Se emite...": ["Выставление...", "Issuing..."],
  "Emite factură situativă": ["Выставить разовый счёт", "Issue situational invoice"],
  "Șabloane rapide ad-hoc:": ["Быстрые разовые шаблоны:", "Quick ad-hoc templates:"],
  "Grupă / Curs asociat (opțional)": [
    "Группа / Курс (опционально)",
    "Associated Group / Course (optional)",
  ],
  "Fără asociere directă": ["Без прямой привязки", "No direct association"],
  "Poziții Factură": ["Позиции счёта", "Invoice Line Items"],
  "Adaugă poziție": ["Добавить позицию", "Add line item"],
  "Note adiționale pe factură": ["Дополнительные заметки в счёте", "Additional invoice notes"],
  "Observații vizibile pentru elev/părinte...": [
    "Примечания, видимые ученику/родителю...",
    "Notes visible to student/parent...",
  ],
  "Factură asociată": ["Связанный счёт", "Associated invoice"],
  "Total Factură": ["Сумма счёта", "Invoice Total"],
  "Deja Achitat": ["Уже оплачено", "Already Paid"],
  "Suma de achitat (MDL)": ["Сумма к оплате (MDL)", "Payment amount (MDL)"],
  "Suma integrală": ["Полная сумма", "Full amount"],
  "Metodă de plată": ["Способ оплаты", "Payment method"],
  "Numerar (Cash)": ["Наличные (Cash)", "Cash"],
  "Card bancar / Terminal": ["Банковская карта / Терминал", "Bank card / POS Terminal"],
  "Altă metodă": ["Другой способ", "Other method"],
  "Data plății": ["Дата оплаты", "Payment date"],
  "Număr chitanță / Bon fiscal": [
    "Номер квитанции / Фискальный чек",
    "Receipt / Fiscal slip number",
  ],
  "ex: BON-9281, CHIT-001": ["напр.: BON-9281, CHIT-001", "e.g. BON-9281, REC-001"],
  "Notițe / Comentariu plată": ["Заметки / Комментарий к оплате", "Payment notes / comment"],
  "Detalii suplimentare referitoare la tranzacție...": [
    "Дополнительные сведения о транзакции...",
    "Additional details regarding the transaction...",
  ],
  "Nu există facturi pentru acest elev.": [
    "Для этого ученика нет счетов.",
    "No invoices found for this student.",
  ],
  "Emiteți mai întâi o factură înainte de a înregistra o plată.": [
    "Сначала выставите счёт перед регистрацией оплаты.",
    "Issue an invoice first before recording a payment.",
  ],
  "Anulare Factură": ["Отмена счёта", "Cancel Invoice"],
  "Motivul anulării": ["Причина отмены", "Cancellation reason"],
  "Ex: Factură duplicată, recalculare ore, renunțare curs...": [
    "Напр.: Дубликат счёта, перерасчёт часов, отказ от курса...",
    "E.g. Duplicate invoice, hours recalculation, course withdrawal...",
  ],
  "Renunță": ["Отмена", "Back"],
  "Se anulează...": ["Отмена...", "Cancelling..."],
  "Confirmă Anularea": ["Подтвердить отмену", "Confirm Cancellation"],
  "Previzualizare Chitanță & Factură": [
    "Предпросмотр квитанции и счёта",
    "Receipt & Invoice Preview",
  ],
  "Tipărește / PDF": ["Печать / PDF", "Print / PDF"],
  "Chitanță de Plată": ["Платёжная квитанция", "Payment Receipt"],
  "Beneficiar Servicii (Elev)": ["Получатель услуг (Ученик)", "Service Beneficiary (Student)"],
  "Grupă & Format": ["Группа и формат", "Group & Format"],
  "Servicii Educaționale": ["Образовательные услуги", "Educational Services"],
  "Descriere Serviciu": ["Описание услуги", "Service Description"],
  "Sumă (MDL)": ["Сумма (MDL)", "Amount (MDL)"],
  "Perioada conform contractului de studii": [
    "Период согласно договору об обучении",
    "Period according to study contract",
  ],
  "Total Facturat:": ["Выставлено всего:", "Total Invoiced:"],
  "Achitat Până în Prezent:": ["Оплачено на данный момент:", "Paid to Date:"],
  "Sold Rămas de Plată:": ["Остаток к оплате:", "Remaining Balance Due:"],
  "Instrucțiuni & Rechizite Bancare pentru Transfer": [
    "Инструкции и банковские реквизиты для перевода",
    "Bank Transfer Instructions & Details",
  ],
  "Banca Beneficiară:": ["Банк получателя:", "Beneficiary Bank:"],
  "Cont IBAN:": ["Счёт IBAN:", "IBAN Account:"],
  "Cod Fiscal Beneficiar:": ["Фискальный код получателя:", "Beneficiary Tax ID:"],
  "Destinația Plății:": ["Назначение платежа:", "Payment Reference:"],
  "Emis de Administrație:": ["Выдано администрацией:", "Issued by Administration:"],
  "Semnătură / Ștampilă": ["Подпись / Печать", "Signature / Stamp"],
  "Semnătură Plătitor / Părinte:": [
    "Подпись плательщика / родителя:",
    "Payer / Parent Signature:",
  ],
  "Confirmare de primire": ["Подтверждение получения", "Receipt confirmation"],
  "Exportă Rapoarte Financiare CSV": [
    "Экспорт финансовых отчётов CSV",
    "Export Financial CSV Reports",
  ],
  "Format compatibil Excel & Numbers (cu caractere diacritice)": [
    "Формат совместим с Excel и Numbers (UTF-8)",
    "Excel & Numbers compatible format (UTF-8)",
  ],
  "Raport Registru Facturi": ["Отчёт по реестру счетов", "Invoices Registry Report"],
  "facturi înregistrate": ["зарегистрированных счетов", "registered invoices"],
  "Raport Încasări & Plăți": [
    "Отчёт по поступлениям и платежам",
    "Collections & Payments Report",
  ],
  "plăți înregistrate": ["зарегистрированных платежей", "recorded payments"],
  "Raport Restanțieri (Top Restanțe)": [
    "Отчёт по должникам (Топ долгов)",
    "Debtors Report (Top Arrears)",
  ],
  "elevi cu solduri neachitate": [
    "учеников с неоплаченным балансом",
    "students with unpaid balances",
  ],

  // Schedule Modals, Roller Door & Settings
  "Grupa Ta": ["Ваша группа", "Your Group"],
  "Atenție: Suprapunere în sală!": ["Внимание: пересечение в аудитории!", "Warning: Room overlap!"],
  "Această sală este programată concomitent pentru alt curs.": [
    "Эта аудитория одновременно назначена для другого курса.",
    "This room is scheduled concurrently for another course.",
  ],
  "Orar & Zile": ["Расписание и дни", "Schedule & Days"],
  "Profesor Asignat": ["Назначенный преподаватель", "Assigned Teacher"],
  "Înscrieri Active": ["Активные записи", "Active Enrollments"],
  "ℹ️ Mod vizualizare. Doar profesorul asignat acestei grupe sau administratorii au acces la modificarea setărilor.": [
    "ℹ️ Режим просмотра. Только назначенный преподаватель или администраторы могут изменять настройки.",
    "ℹ️ View mode. Only the assigned teacher or administrators can modify settings.",
  ],
  "Verifică / Notează Prezența": [
    "Проверить / Отметить посещаемость",
    "Check / Mark Attendance",
  ],
  "Editează Grupa": ["Редактировать группу", "Edit Group"],
  "Vezi Pagina Cursului": ["Открыть страницу курса", "View Course Page"],
  "• Catalog Lecție": ["• Журнал урока", "• Lesson Register"],
  "Se încarcă lista elevilor înscriși...": [
    "Загрузка списка записанных учеников...",
    "Loading enrolled students list...",
  ],
  "Releu IoT acces clădire": ["IoT-реле доступа в здание", "Building access IoT relay"],
  "Releu IoT Intrare Activ": ["Входное реле IoT активно", "Entrance IoT Relay Active"],
  "Minim 6 caractere": ["Минимум 6 символов", "Minimum 6 characters"],
  "Reintroduceți parola nouă": ["Повторите новый пароль", "Re-enter new password"],
  "Se actualizează...": ["Обновление...", "Updating..."],
  "Date Campus Școlar": ["Данные школьного кампуса", "School Campus Details"],
  "Modificarea profilului oficial și a rechizitelor bancare ale școlii este permisă doar administratorilor.": [
    "Изменение официального профиля и банковских реквизитов школы доступно только администраторам.",
    "Modifying the official school profile and bank details is restricted to administrators.",
  ],
  "Se încarcă datele școlii...": ["Загрузка данных школы...", "Loading school details..."],
  "Editează cursuri": ["Редактировать курсы", "Edit courses"],
  "Cursuri disponibile": ["Доступные курсы", "Available courses"],
  "Fără curs asignat": ["Без назначенного курса", "No assigned course"],
  "părinte": ["родитель", "parent"],
  "Ascunde fișa": ["Скрыть карточку", "Hide dossier"],
  "Nu ai permisiuni suficiente pentru gestiunea utilizatorilor.": [
    "Недостаточно прав для управления пользователями.",
    "You do not have sufficient permissions to manage users.",
  ],
  "Se încarcă utilizatorii...": ["Загрузка пользователей...", "Loading users..."],
  "Niciun utilizator găsit": ["Пользователи не найдены", "No users found"],
  "Încearcă să ajustezi filtrele de căutare.": [
    "Попробуйте изменить параметры поиска.",
    "Try adjusting your search filters.",
  ],
  "Actualizează detaliile cursului și orarul": [
    "Обновление деталей курса и расписания",
    "Update course details and schedule",
  ],
  "Configurează un nou curs academic": [
    "Настройка нового учебного курса",
    "Configure a new academic course",
  ],
  "Se încarcă datele cursului...": ["Загрузка данных курса...", "Loading course details..."],
  "Informații Generale": ["Общая информация", "General Information"],
  "Ex: Robotică & Programare A1": [
    "Напр.: Робототехника и Программирование A1",
    "e.g. Robotics & Programming A1",
  ],
  "Descrierea cursului și obiectivele de învățare...": [
    "Описание курса и цели обучения...",
    "Course description and learning objectives...",
  ],
  "Începător (Beginner)": ["Начальный (Beginner)", "Beginner"],
  "Mediu (Intermediate)": ["Средний (Intermediate)", "Intermediate"],
  "Avansat (Advanced)": ["Продвинутый (Advanced)", "Advanced"],
  "Sesiuni & Durată": ["Занятия и длительность", "Sessions & Duration"],
  "Durată sesiune (min) *": ["Длительность занятия (мин) *", "Session duration (min) *"],
  "Program & Orar": ["График и расписание", "Schedule & Timetable"],
  "Zile din săptămână": ["Дни недели", "Days of the week"],
  "Ora început": ["Время начала", "Start time"],
  "Ora sfârșit": ["Время окончания", "End time"],
  "-- Fără profesor asignat --": [
    "-- Без назначенного преподавателя --",
    "-- No assigned teacher --",
  ],
  "Resursele educaționale (lecții video, documente PDF, prezentări, activități interactive și maparea pe sesiuni) sunt gestionate centralizat în platforma LMS Brio Learn.": [
    "Образовательные ресурсы (видеоуроки, PDF-документы, презентации, интерактивные задания и привязка к занятиям) централизованно управляются на платформе LMS Brio Learn.",
    "Educational resources (video lessons, PDF documents, presentations, interactive activities, and session mapping) are centrally managed in the Brio Learn LMS platform.",
  ],
  "Manage course curriculum and study materials in Brio Learn ↗": [
    "Управление программой и материалами курса в Brio Learn ↗",
    "Manage course curriculum and study materials in Brio Learn ↗",
  ],
  "Curs activ (vizibil pentru elevi și profesori)": [
    "Активный курс (виден ученикам и преподавателям)",
    "Active course (visible to students and teachers)",
  ],
  "Actualizează Curs": ["Обновить курс", "Update Course"],
  "Numele cursului este obligatoriu": [
    "Название курса обязательно",
    "Course name is required",
  ],
  "Numărul de sesiuni trebuie să fie cel puțin 1": [
    "Количество занятий должно быть не менее 1",
    "Number of sessions must be at least 1",
  ],
  "Durata sesiunii trebuie să fie cel puțin 1 minut": [
    "Длительность занятия должна быть не менее 1 минуты",
    "Session duration must be at least 1 minute",
  ],
  "Datele introduse sunt invalide.": [
    "Введённые данные некорректны.",
    "Entered data is invalid.",
  ],
  "Ex: +373 69 000 000": ["Напр.: +373 69 000 000", "e.g. +373 69 000 000"],
  "Ex: Maria Popescu": ["Напр.: Мария Попеску", "e.g. Maria Popescu"],
  "Ex: +373 68 000 000": ["Напр.: +373 68 000 000", "e.g. +373 68 000 000"],
  "Acces LMS": ["Доступ LMS", "LMS Access"],
  "Editează Dosarul": ["Редактировать досье", "Edit Dossier"],
  "Contacte Părinți": ["Контакты родителей", "Parent Contacts"],
  "Balanță Financiară": ["Финансовый баланс", "Financial Balance"],
  "0 MDL datorie": ["0 MDL долг", "0 MDL debt"],
  "Achitat pentru luna curentă": ["Оплачено за текущий месяц", "Paid for current month"],
  "Gestiune Elevi": ["Управление учениками", "Student Management"],
  "Înregistrează Elev Nou": ["Зарегистрировать ученика", "Register New Student"],
  "Caută după nume, telefon sau contract...": [
    "Поиск по имени, телефону или договору...",
    "Search by name, phone, or contract...",
  ],
  "Profil Student": ["Профиль ученика", "Student Profile"],
  "Dosar cursant (30%) + activitate academică (70%)": [
    "Досье ученика (30%) + учебная активность (70%)",
    "Student dossier (30%) + academic activity (70%)",
  ],
  "Toți elevii": ["Все ученики", "All students"],
  "Nu există cursuri": ["Курсов нет", "No courses"],
  "Adăugați primul curs pentru această filială": [
    "Добавьте первый курс для этого филиала",
    "Add the first course for this branch",
  ],
  "locuri ocupate": ["мест занято", "seats occupied"],
  "Înscrie în Grupă": ["Записать в группу", "Enroll in Group"],
  "Modul": ["Модуль", "Module"],
  "din": ["из", "of"],
  "Modul Curricular": ["Учебный модуль", "Curriculum Module"],
  "Stare prezență": ["Статус посещаемости", "Attendance status"],
  "Motiv / Notă": ["Причина / Заметка", "Reason / Note"],
  "Apasă": ["Нажмите", "Press"],
  "pentru salvare": ["для сохранения", "to save"],
  "Ex: Bolnav, învoit de părinți, concurs...": [
    "Напр.: Болен, отпросился, соревнование...",
    "e.g. Sick, excused by parents, competition...",
  ],
  "Astăzi": ["Сегодня", "Today"],
};

const MONTHS_MAP: Record<string, [string, string]> = {
  ianuarie: ["Январь", "January"],
  februarie: ["Февраль", "February"],
  martie: ["Март", "March"],
  aprilie: ["Апрель", "April"],
  mai: ["Май", "May"],
  iunie: ["Июнь", "June"],
  iulie: ["Июль", "July"],
  august: ["Август", "August"],
  septembrie: ["Сентябрь", "September"],
  octombrie: ["Октябрь", "October"],
  noiembrie: ["Ноябрь", "November"],
  decembrie: ["Декабрь", "December"],
};

const MONTHS_GENITIVE_RU: Record<string, string> = {
  ianuarie: "января",
  februarie: "февраля",
  martie: "марта",
  aprilie: "апреля",
  mai: "мая",
  iunie: "июня",
  iulie: "июля",
  august: "августа",
  septembrie: "сентября",
  octombrie: "октября",
  noiembrie: "ноября",
  decembrie: "декабря",
};

const SHORT_MONTHS_MAP: Record<string, [string, string]> = {
  ian: ["янв.", "Jan"],
  feb: ["фев.", "Feb"],
  mar: ["мар.", "Mar"],
  apr: ["апр.", "Apr"],
  mai: ["мая", "May"],
  iun: ["июн.", "Jun"],
  iul: ["июл.", "Jul"],
  aug: ["авг.", "Aug"],
  sep: ["сент.", "Sep"],
  sept: ["сент.", "Sep"],
  oct: ["окт.", "Oct"],
  nov: ["нояб.", "Nov"],
  noi: ["нояб.", "Nov"],
  dec: ["дек.", "Dec"],
};

const DAYS_FULL_MAP: Record<string, [string, string]> = {
  luni: ["Понедельник", "Monday"],
  marți: ["Вторник", "Tuesday"],
  marti: ["Вторник", "Tuesday"],
  miercuri: ["Среда", "Wednesday"],
  joi: ["Четверг", "Thursday"],
  vineri: ["Пятница", "Friday"],
  sâmbătă: ["Суббота", "Saturday"],
  sambata: ["Суббота", "Saturday"],
  duminică: ["Воскресенье", "Sunday"],
  duminica: ["Воскресенье", "Sunday"],
};

const DAYS_SHORT_MAP: Record<string, [string, string]> = {
  L: ["ПН", "MO"],
  MA: ["ВТ", "TU"],
  MI: ["СР", "WE"],
  J: ["ЧТ", "TH"],
  V: ["ПТ", "FR"],
  S: ["СБ", "SA"],
  D: ["ВС", "SU"],
  Lu: ["Пн", "Mon"],
  Ma: ["Вт", "Tue"],
  Mi: ["Ср", "Wed"],
  Jo: ["Чт", "Thu"],
  Vi: ["Пт", "Fri"],
  Sâ: ["Сб", "Sat"],
  Sa: ["Сб", "Sat"],
  Du: ["Вс", "Sun"],
};

function translateDayToken(token: string, locale: TargetLocale): string {
  const idx = locale === "ru" ? 0 : 1;
  const lower = token.toLowerCase();
  if (lower === "sâm") return locale === "ru" ? "Сб" : "Sat";
  if (lower === "dum") return locale === "ru" ? "Вс" : "Sun";
  const full = DAYS_FULL_MAP[lower];
  if (full) {
    // Use short day in schedule strings like "Luni, Miercuri • 16:00"
    const shortMap: Record<string, [string, string]> = {
      luni: ["Пн", "Mon"],
      marți: ["Вт", "Tue"],
      marti: ["Вт", "Tue"],
      miercuri: ["Ср", "Wed"],
      joi: ["Чт", "Thu"],
      vineri: ["Пт", "Fri"],
      sâmbătă: ["Сб", "Sat"],
      sambata: ["Сб", "Sat"],
      duminică: ["Вс", "Sun"],
      duminica: ["Вс", "Sun"],
    };
    return shortMap[lower]?.[idx] ?? full[idx];
  }
  return token;
}

const PATTERN_RULES: Array<[RegExp, (locale: TargetLocale, ...args: string[]) => string]> = [
  // Short day codes in calendar pills ("L", "MI", "Lu", etc.)
  [
    /^(L|MA|MI|J|V|S|D|Lu|Ma|Mi|Jo|Vi|Sâ|Sa|Du)$/,
    (loc, _m, code) => DAYS_SHORT_MAP[code]?.[loc === "ru" ? 0 : 1] || code,
  ],
  // Month + Year ("Noiembrie 2026")
  [
    /^(Ianuarie|Februarie|Martie|Aprilie|Mai|Iunie|Iulie|August|Septembrie|Octombrie|Noiembrie|Decembrie)\s+(\d{4})$/i,
    (loc, _m, month, year) =>
      `${MONTHS_MAP[month.toLowerCase()]?.[loc === "ru" ? 0 : 1] || month} ${year}`,
  ],
  // Full Date ("3 noiembrie 2026")
  [
    /^(\d{1,2})\s+(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s+(\d{4})$/i,
    (loc, _m, d, month, year) => {
      const lowerM = month.toLowerCase();
      if (loc === "ru") {
        const gen = MONTHS_GENITIVE_RU[lowerM] || MONTHS_MAP[lowerM]?.[0]?.toLowerCase() || month;
        return `${d} ${gen} ${year}`;
      }
      const mName = MONTHS_MAP[lowerM]?.[1] || month;
      return `${mName} ${d}, ${year}`;
    },
  ],
  // Short Date ("16 sept. 2026", "10 ian. 2026")
  [
    /^(\d{1,2})\s+(ian|feb|mar|apr|mai|iun|iul|aug|sep|sept|oct|nov|noi|dec)\.?\s+(\d{4})$/i,
    (loc, _m, d, shortM, year) => {
      const lowerM = shortM.toLowerCase();
      const mapped = SHORT_MONTHS_MAP[lowerM];
      if (!mapped) return _m;
      return loc === "ru" ? `${d} ${mapped[0]} ${year}` : `${mapped[1]} ${d}, ${year}`;
    },
  ],
  // Day + Date ("Luni, 2 2026-11")
  [
    /^(Luni|Marți|Marti|Miercuri|Joi|Vineri|Sâmbătă|Sambata|Duminică|Duminica),\s*(\d.+)$/i,
    (loc, _m, day, rest) =>
      `${DAYS_FULL_MAP[day.toLowerCase()]?.[loc === "ru" ? 0 : 1] || day}, ${rest}`,
  ],
  // Schedule Days + Time ("Luni, Miercuri • 16:00 - 17:30" or "Sâm • 10:00 - 12:00")
  [
    /^((?:(?:Luni|Marți|Marti|Miercuri|Joi|Vineri|Sâmbătă|Sambata|Duminică|Duminica|Sâm|Dum)(?:,\s*)?)+)\s*•\s*(\d{1,2}:\d{2}.*)$/i,
    (loc, _m, daysPart, timePart) => {
      const translatedDays = daysPart.replace(
        /(Luni|Marți|Marti|Miercuri|Joi|Vineri|Sâmbătă|Sambata|Duminică|Duminica|Sâm|Dum)/gi,
        (d) => translateDayToken(d, loc),
      );
      return `${translatedDays} • ${timePart}`;
    },
  ],
  // Filter tabs with counts ("Toți (5)", "Restanțieri (2)", "Achitați (3)", etc.)
  [/^Toți\s*\((\d+)\)$/i, (loc, _m, n) => (loc === "ru" ? `Все (${n})` : `All (${n})`)],
  [/^Toate\s*\((\d+)\)$/i, (loc, _m, n) => (loc === "ru" ? `Все (${n})` : `All (${n})`)],
  [/^Azi\s*\((\d+)\)$/i, (loc, _m, n) => (loc === "ru" ? `Сегодня (${n})` : `Today (${n})`)],
  [/^Ale Mele\s*\((\d+)\)$/i, (loc, _m, n) => (loc === "ru" ? `Мои (${n})` : `My Groups (${n})`)],
  [
    /^Restanțieri\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `Должники (${n})` : `Overdue (${n})`),
  ],
  [/^Achitați\s*\((\d+)\)$/i, (loc, _m, n) => (loc === "ru" ? `Оплачено (${n})` : `Paid (${n})`)],
  [
    /^Cursuri\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `Курсы (${n})` : `Courses (${n})`),
  ],
  [/^Grupe\s*\((\d+)\)$/i, (loc, _m, n) => (loc === "ru" ? `Группы (${n})` : `Groups (${n})`)],
  [
    /^Toate Grupele\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `Все группы (${n})` : `All Groups (${n})`),
  ],
  [
    /^Toate Sălile\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `Все аудитории (${n})` : `All Rooms (${n})`),
  ],
  [
    /^Toate Cursurile\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `Все курсы (${n})` : `All Courses (${n})`),
  ],
  [
    /^Toți profesorii\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `Все преподаватели (${n})` : `All Teachers (${n})`),
  ],
  // Attendance summary badges ("9 lecții în lună", "4 prezenți", "1 întârziați", etc.)
  [
    /^(\d+)\s+lecți(?:e|i)\s+în\s+lună$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} ур. в месяце` : `${n} lessons/mo`),
  ],
  [/^(\d+)\s+lecți(?:e|i)$/i, (loc, _m, n) => (loc === "ru" ? `${n} ур.` : `${n} lessons`)],
  [/^(\d+)\s+sesiun(?:e|i)$/i, (loc, _m, n) => (loc === "ru" ? `${n} зан.` : `${n} sessions`)],
  [/^(\d+)\s+prezenți$/i, (loc, _m, n) => (loc === "ru" ? `${n} присут.` : `${n} present`)],
  [/^(\d+)\s+absenți$/i, (loc, _m, n) => (loc === "ru" ? `${n} отсут.` : `${n} absent`)],
  [/^(\d+)\s+întârziați$/i, (loc, _m, n) => (loc === "ru" ? `${n} опозд.` : `${n} late`)],
  [/^(\d+)\s+nemarcați$/i, (loc, _m, n) => (loc === "ru" ? `${n} не отм.` : `${n} unmarked`)],
  // Dashboard & Financial metric footers
  [
    /^(\d+)\s+conturi active în platformă$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} активных аккаунтов` : `${n} active accounts`),
  ],
  [
    /^(\d+)\s+înrolați pe cursuri active$/i,
    (loc, _m, n) =>
      loc === "ru" ? `${n} записаны на активные курсы` : `${n} enrolled in active courses`,
  ],
  [
    /^(\d+)\s+facturi cu termen depășit$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} просроченных счетов` : `${n} overdue invoices`),
  ],
  [
    /^Rată colectare:\s*(\d+)%$/i,
    (loc, _m, n) => (loc === "ru" ? `Собираемость: ${n}%` : `Collection rate: ${n}%`),
  ],
  [
    /^În perioada:\s*([\d.,]+)\s*MDL$/i,
    (loc, _m, amt) => (loc === "ru" ? `За период: ${amt} MDL` : `In period: ${amt} MDL`),
  ],
  [
    /^din\s*([\d.,]+)\s*MDL$/i,
    (loc, _m, amt) => (loc === "ru" ? `из ${amt} MDL` : `of ${amt} MDL`),
  ],
  [
    /^([\d.,]+)\s*MDL\s+datorie activă$/i,
    (loc, _m, amt) => (loc === "ru" ? `${amt} MDL активный долг` : `${amt} MDL active debt`),
  ],
  [
    /^([\d.,]+)\s*MDL\s+facturat$/i,
    (loc, _m, amt) => (loc === "ru" ? `${amt} MDL выставлено` : `${amt} MDL billed`),
  ],
  [
    /^(\d+)\s+restanțieri?\s*\((\d+)\s+facturi depășite\)$/i,
    (loc, _m, n, m) =>
      loc === "ru" ? `${n} должн. (${m} просроч. сч.)` : `${n} debtors (${m} overdue inv.)`,
  ],
  [
    /^Grupă Curs #(\d+)$/i,
    (loc, _m, n) => (loc === "ru" ? `Группа курса #${n}` : `Course Group #${n}`),
  ],
  // Age & counts
  [/^\((\d+)\s+ani\)$/i, (loc, _m, n) => (loc === "ru" ? `(${n} лет)` : `(${n} yrs)`)],
  [/^(\d+)\s+ani$/i, (loc, _m, n) => (loc === "ru" ? `${n} лет` : `${n} yrs`)],
  [/^(\d+)\s+elevi?$/i, (loc, _m, n) => (loc === "ru" ? `${n} уч.` : `${n} students`)],
  [/^(\d+)\s+studenți$/i, (loc, _m, n) => (loc === "ru" ? `${n} уч.` : `${n} students`)],
  [/^(\d+)\s+grupe?$/i, (loc, _m, n) => (loc === "ru" ? `${n} гр.` : `${n} groups`)],
  [/^(\d+)\s+factur(?:ă|i)$/i, (loc, _m, n) => (loc === "ru" ? `${n} сч.` : `${n} invoices`)],
  [/^(\d+)\s+total$/i, (loc, _m, n) => (loc === "ru" ? `${n} всего` : `${n} total`)],
  [/^(\d+)\s+definiții$/i, (loc, _m, n) => (loc === "ru" ? `${n} прав` : `${n} permissions`)],
  [/^(\d+)\s+zile$/i, (loc, _m, n) => (loc === "ru" ? `${n} дн.` : `${n} days`)],
  [
    /^În termen\s*\(0 zile\)$/i,
    (loc) => (loc === "ru" ? `В срок (0 дн.)` : `Current (0 days)`),
  ],
  [
    /^Mai mult de 14 zile\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `Более 14 дней (${n})` : `Over 14 days (${n})`),
  ],
  [
    /^Până la 14 zile\s*\((\d+)\)$/i,
    (loc, _m, n) => (loc === "ru" ? `До 14 дней (${n})` : `Up to 14 days (${n})`),
  ],
  [
    /^Peste\s+([\d.,]+)\s*MDL\s*\((\d+)\)$/i,
    (loc, _m, amt, n) => (loc === "ru" ? `Свыше ${amt} MDL (${n})` : `Over ${amt} MDL (${n})`),
  ],
  [
    /^Peste\s+([\d.,]+)\s*MDL$/i,
    (loc, _m, amt) => (loc === "ru" ? `Свыше ${amt} MDL` : `Over ${amt} MDL`),
  ],
  [
    /^Restanță:\s*([\d.,]+)\s*MDL$/i,
    (loc, _m, amt) => (loc === "ru" ? `Долг: ${amt} MDL` : `Arrears: ${amt} MDL`),
  ],
  [
    /^Facturat:\s*([\d.,]+)\s*MDL$/i,
    (loc, _m, amt) => (loc === "ru" ? `Выставлено: ${amt} MDL` : `Billed: ${amt} MDL`),
  ],
  [
    /^Încasat:\s*([\d.,]+)\s*MDL(?:\s*\((\d+%)\))?$/i,
    (loc, _m, amt, pct) => {
      if (loc === "ru") {
        return pct ? `Оплачено: ${amt} MDL (${pct})` : `Оплачено: ${amt} MDL`;
      }
      return pct ? `Collected: ${amt} MDL (${pct})` : `Collected: ${amt} MDL`;
    },
  ],
  [
    /^Scadență:\s*(.+)$/i,
    (loc, _m, date) => (loc === "ru" ? `Срок: ${date}` : `Due: ${date}`),
  ],
  [/^Școala\s*#(\d+)$/i, (loc, _m, id) => (loc === "ru" ? `Школа #${id}` : `School #${id}`)],
  [
    /^Sună părinte:\s*(.+)$/i,
    (loc, _m, info) => (loc === "ru" ? `Позвонить родителю: ${info}` : `Call parent: ${info}`),
  ],
  [
    /^Părinte:\s*(.+)$/i,
    (loc, _m, info) => (loc === "ru" ? `Родитель: ${info}` : `Parent: ${info}`),
  ],
  [
    /^Status financiar:\s*(.+)$/i,
    (loc, _m, info) => (loc === "ru" ? `Финансовый статус: ${info}` : `Billing status: ${info}`),
  ],
  [
    /^(\d+)\s+curs(?:uri)?\s+selectat(?:e)?$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} выбр. курсов` : `${n} courses selected`),
  ],
  [
    /^(\d+)\s+grup(?:ă|e)\s+selectat(?:ă|e)$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} выбр. групп` : `${n} groups selected`),
  ],
  [
    /^(\d+)\s+studen(?:t|ți)\s+selecta(?:t|ți)$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} выбр. учеников` : `${n} students selected`),
  ],
  [
    /^(\d+)\s+factur(?:ă|i)\s+restant(?:ă|e)$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} просроч. сч.` : `${n} overdue invoices`),
  ],
  [
    /^(\d+)\s+facturi înregistrate$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} зарегистр. счетов` : `${n} registered invoices`),
  ],
  [
    /^(\d+)\s+plăți înregistrate$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} зарегистр. платежей` : `${n} recorded payments`),
  ],
  [
    /^(\d+)\s+elevi cu solduri neachitate$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} уч. с долгами` : `${n} students with unpaid balances`),
  ],
  [
    /^(\d+)\s+tranzacții$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} транзакций` : `${n} transactions`),
  ],
  [
    /^(\d+)\s+elevi înscriși$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} уч. записано` : `${n} enrolled students`),
  ],
  [
    /^(\d+)\s+motivați$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} уваж.` : `${n} excused`),
  ],
  [
    /^Datorie activă:\s*([\d.,]+)\s*MDL$/i,
    (loc, _m, amt) => (loc === "ru" ? `Активный долг: ${amt} MDL` : `Active debt: ${amt} MDL`),
  ],
  [
    /^Reducere acordată:\s*(\d+)%$/i,
    (loc, _m, pct) => (loc === "ru" ? `Скидка: ${pct}%` : `Discount granted: ${pct}%`),
  ],
  [
    /^Reducere acordată\s*\((\d+)%\):$/i,
    (loc, _m, pct) => (loc === "ru" ? `Скидка (${pct}%):` : `Discount (${pct}%):`),
  ],
  [
    /^Articol\s*#(\d+)$/i,
    (loc, _m, n) => (loc === "ru" ? `Позиция #${n}` : `Item #${n}`),
  ],
  [
    /^Înrolare Grupe\s*[–-]\s*(.+)$/i,
    (loc, _m, name) => (loc === "ru" ? `Запись в группы – ${name}` : `Group Enrollment – ${name}`),
  ],
  [
    /^Înrolare Studenți\s*[–-]\s*(.+)$/i,
    (loc, _m, name) => (loc === "ru" ? `Запись учеников – ${name}` : `Student Enrollment – ${name}`),
  ],
  [
    /^Afișează doar studenții înscriși la cursul\s+(.+)$/i,
    (loc, _m, c) =>
      loc === "ru"
        ? `Показаны только ученики, записанные на курс ${c}`
        : `Showing only students enrolled in ${c}`,
  ],
  [
    /^Modul\s+(\d+)\s+din\s+(\d+)$/i,
    (loc, _m, a, b) => (loc === "ru" ? `Модуль ${a} из ${b}` : `Module ${a} of ${b}`),
  ],
  [
    /^Modul\s+(\d+)$/i,
    (loc, _m, a) => (loc === "ru" ? `Модуль ${a}` : `Module ${a}`),
  ],
  [
    /^•\s*(Modul Curent|Modul Curricular)$/i,
    (loc, _m, label) => {
      const idx = loc === "ru" ? 0 : 1;
      return `• ${EXACT_PHRASES[label]?.[idx] || label}`;
    },
  ],
  [
    /^\((\d+)\s+prezenți,\s*(\d+)\s+întârzieri\)$/i,
    (loc, _m, a, b) => (loc === "ru" ? `(${a} присут., ${b} опозд.)` : `(${a} present, ${b} late)`),
  ],
  [
    /^Înscris:\s*(.+)$/i,
    (loc, _m, d) => (loc === "ru" ? `Записан: ${d}` : `Enrolled: ${d}`),
  ],
  [
    /^Finalizat:\s*(.+)$/i,
    (loc, _m, d) => (loc === "ru" ? `Завершён: ${d}` : `Completed: ${d}`),
  ],
  [
    /^Înscris la\s+(.+)$/i,
    (loc, _m, d) => (loc === "ru" ? `Записан ${d}` : `Enrolled on ${d}`),
  ],
  [
    /^Data:\s*(.+)$/i,
    (loc, _m, d) => (loc === "ru" ? `Дата: ${d}` : `Date: ${d}`),
  ],
  [
    /^(\+?\s*)(Materiale didactice \/ Manuale|Taxă examinare \/ Certificare|Lecție privată \/ Consultație|Taxă înscriere \/ Echipament|Ajustare sold \/ Serviciu adițional)\s*\((\d+)\s*MDL\)$/i,
    (loc, _m, prefix, label, price) => {
      const idx = loc === "ru" ? 0 : 1;
      const tLabel = EXACT_PHRASES[label]?.[idx] || label;
      return `${prefix}${tLabel} (${price} MDL)`;
    },
  ],
  [
    /^Elimină\s+(.+)$/i,
    (loc, _m, name) => (loc === "ru" ? `Удалить ${name}` : `Remove ${name}`),
  ],
  [
    /^Apelează elevul\s+(.+)$/i,
    (loc, _m, name) => (loc === "ru" ? `Позвонить ученику ${name}` : `Call student ${name}`),
  ],
  [
    /^Apelează părintele:\s*(.*)$/i,
    (loc, _m, name) => (loc === "ru" ? `Позвонить родителю: ${name}` : `Call parent: ${name}`),
  ],
  [
    /^(\d+)\s+ani$/i,
    (loc, _m, n) => (loc === "ru" ? `${n} лет` : `${n} yrs`),
  ],
  [
    /^(\d+)\s+total$/i,
    (loc, _m, n) => (loc === "ru" ? `Всего ${n}` : `${n} total`),
  ],
];

export function translateRoText(input: string, locale: TargetLocale): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;

  const leadingMatch = input.match(/^\s*/);
  const trailingMatch = input.match(/\s*$/);
  const leading = leadingMatch ? leadingMatch[0] : "";
  const trailing = trailingMatch ? trailingMatch[0] : "";

  const idx = locale === "ru" ? 0 : 1;
  // Normalize legacy Turkish/Romanian cedilla characters (Ş/ş/Ţ/ţ -> Ș/ș/Ț/ț)
  const normalized = trimmed
    .replace(/Ş/g, "Ș")
    .replace(/ş/g, "ș")
    .replace(/Ţ/g, "Ț")
    .replace(/ţ/g, "ț");

  // 1. Exact phrase match
  const exact = EXACT_PHRASES[normalized];
  if (exact) {
    return `${leading}${exact[idx]}${trailing}`;
  }

  // 2. Pattern rules
  for (const [regex, replacer] of PATTERN_RULES) {
    const match = normalized.match(regex);
    if (match) {
      return `${leading}${replacer(locale, ...match)}${trailing}`;
    }
  }

  return input;
}

export function translateRoToRu(input: string): string {
  return translateRoText(input, "ru");
}

export function translateRoToEn(input: string): string {
  return translateRoText(input, "en");
}

// Build reverse lookup map (Russian / English -> original Romanian) so switching
// between RO, RU, and EN in any order (or after HMR reload) always recovers the canonical Romanian source.
const REVERSE_TO_RO: Record<string, string> = {};
for (const [ro, [ru, en]] of Object.entries(EXACT_PHRASES)) {
  if (ru && !REVERSE_TO_RO[ru]) REVERSE_TO_RO[ru] = ro;
  if (en && !REVERSE_TO_RO[en]) REVERSE_TO_RO[en] = ro;
}

const REVERSE_MONTHS_TO_RO: Record<string, string> = {};
for (const [roMonth, [ruNom, enNom]] of Object.entries(MONTHS_MAP)) {
  REVERSE_MONTHS_TO_RO[ruNom.toLowerCase()] = roMonth;
  REVERSE_MONTHS_TO_RO[enNom.toLowerCase()] = roMonth;
}
for (const [roMonth, ruGen] of Object.entries(MONTHS_GENITIVE_RU)) {
  REVERSE_MONTHS_TO_RO[ruGen.toLowerCase()] = roMonth;
}

const REVERSE_SHORT_MONTHS_TO_RO: Record<string, string> = {
  "янв.": "ian.",
  "фев.": "feb.",
  "мар.": "mar.",
  "апр.": "apr.",
  "мая": "mai",
  "июн.": "iun.",
  "июл.": "iul.",
  "авг.": "aug.",
  "сент.": "sept.",
  "окт.": "oct.",
  "нояб.": "noi.",
  "дек.": "dec.",
  jan: "ian.",
  feb: "feb.",
  mar: "mar.",
  apr: "apr.",
  may: "mai",
  jun: "iun.",
  jul: "iul.",
  aug: "aug.",
  sep: "sept.",
  oct: "oct.",
  nov: "noi.",
  dec: "dec.",
};

const REVERSE_SHORT_DAY_TOKEN_TO_RO: Record<string, string> = {
  пн: "Luni",
  вт: "Marți",
  ср: "Miercuri",
  чт: "Joi",
  пт: "Vineri",
  сб: "Sâmbătă",
  вс: "Duminică",
  mon: "Luni",
  tue: "Marți",
  wed: "Miercuri",
  thu: "Joi",
  fri: "Vineri",
  sat: "Sâmbătă",
  sun: "Duminică",
};

export function recoverRoText(input: string): string {
  if (!input) return input;
  const trimmed = input.trim();
  if (!trimmed) return input;

  const leadingMatch = input.match(/^\s*/);
  const trailingMatch = input.match(/\s*$/);
  const leading = leadingMatch ? leadingMatch[0] : "";
  const trailing = trailingMatch ? trailingMatch[0] : "";

  if (EXACT_PHRASES[trimmed]) return input;
  const rev = REVERSE_TO_RO[trimmed];
  if (rev) return `${leading}${rev}${trailing}`;

  // Reverse RU full date ("24 сентября 2026" or "24 сентябрь 2026")
  const ruDateMatch = trimmed.match(
    /^(\d{1,2})\s+(январ[ья]|феврал[ья]|март[а]?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|август[а]?|сентябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])\s+(\d{4})$/i,
  );
  if (ruDateMatch) {
    const [, d, m, y] = ruDateMatch;
    const roM = REVERSE_MONTHS_TO_RO[m.toLowerCase()] || m;
    return `${leading}${d} ${roM} ${y}${trailing}`;
  }

  // Reverse EN full date ("September 24, 2026")
  const enDateMatch = trimmed.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})$/i,
  );
  if (enDateMatch) {
    const [, m, d, y] = enDateMatch;
    const roM = REVERSE_MONTHS_TO_RO[m.toLowerCase()] || m;
    return `${leading}${d} ${roM} ${y}${trailing}`;
  }

  // Reverse RU short date ("16 сент. 2026")
  const ruShortDate = trimmed.match(
    /^(\d{1,2})\s+(янв\.|фев\.|мар\.|апр\.|мая|июн\.|июл\.|авг\.|сент\.|окт\.|нояб\.|дек\.)\s+(\d{4})$/i,
  );
  if (ruShortDate) {
    const [, d, m, y] = ruShortDate;
    const roM = REVERSE_SHORT_MONTHS_TO_RO[m.toLowerCase()] || m;
    return `${leading}${d} ${roM} ${y}${trailing}`;
  }

  // Reverse EN short date ("Sep 16, 2026")
  const enShortDate = trimmed.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s*(\d{4})$/i,
  );
  if (enShortDate) {
    const [, m, d, y] = enShortDate;
    const roM = REVERSE_SHORT_MONTHS_TO_RO[m.toLowerCase()] || m;
    return `${leading}${d} ${roM} ${y}${trailing}`;
  }

  // Reverse schedule ("Вт, Чт • 17:30 - 19:00" or "Tue, Thu • 17:30 - 19:00")
  const schedMatch = trimmed.match(
    /^((?:(?:Пн|Вт|Ср|Чт|Пт|Сб|Вс|Mon|Tue|Wed|Thu|Fri|Sat|Sun)(?:,\s*)?)+)\s*•\s*(\d{1,2}:\d{2}.*)$/i,
  );
  if (schedMatch) {
    const [, daysPart, timePart] = schedMatch;
    const roDays = daysPart.replace(
      /(Пн|Вт|Ср|Чт|Пт|Сб|Вс|Mon|Tue|Wed|Thu|Fri|Sat|Sun)/gi,
      (tok) => REVERSE_SHORT_DAY_TOKEN_TO_RO[tok.toLowerCase()] || tok,
    );
    return `${leading}${roDays} • ${timePart}${trailing}`;
  }

  // Reverse active debt ("1400 MDL активный долг" / "1400 MDL active debt")
  const debtMatch = trimmed.match(/^([\d.,]+)\s*MDL\s+(?:активный долг|active debt)$/i);
  if (debtMatch) {
    return `${leading}${debtMatch[1]} MDL datorie activă${trailing}`;
  }

  // Reverse age ("14 лет" / "14 yrs")
  const ageMatch = trimmed.match(/^(\d+)\s+(?:лет|yrs)$/i);
  if (ageMatch) {
    return `${leading}${ageMatch[1]} ani${trailing}`;
  }

  // Reverse module ("Модуль 2 из 4" / "Module 2 of 4")
  const modMatch = trimmed.match(/^(?:Модуль|Module)\s+(\d+)\s+(?:из|of)\s+(\d+)$/i);
  if (modMatch) {
    return `${leading}Modul ${modMatch[1]} din ${modMatch[2]}${trailing}`;
  }

  return input;
}
