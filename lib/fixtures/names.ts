// Closed-dictionary Arabic + English name pairs. No PII — synthetic.
// Kept small and round-robin'd so the fixture never leaks unintended
// personal data; documented in `lib/fixtures/README.md`.

export const GIVEN_NAMES = [
  { ar: "عبدالله", en: "Abdullah" },
  { ar: "محمد", en: "Mohammed" },
  { ar: "فيصل", en: "Faisal" },
  { ar: "سلمان", en: "Salman" },
  { ar: "خالد", en: "Khalid" },
  { ar: "سعد", en: "Saad" },
  { ar: "ناصر", en: "Nasser" },
  { ar: "بدر", en: "Badr" },
  { ar: "ياسر", en: "Yasser" },
  { ar: "تركي", en: "Turki" },
  { ar: "نورة", en: "Noura" },
  { ar: "سارة", en: "Sara" },
  { ar: "ريم", en: "Reem" },
  { ar: "فاطمة", en: "Fatimah" },
  { ar: "هند", en: "Hind" },
  { ar: "مها", en: "Maha" },
  { ar: "لطيفة", en: "Latifah" },
  { ar: "دانة", en: "Dana" },
  { ar: "منيرة", en: "Munira" },
  { ar: "الجوهرة", en: "Al-Jawhara" },
] as const;

export const FAMILY_NAMES = [
  { ar: "السعيد", en: "Al-Saeed" },
  { ar: "القحطاني", en: "Al-Qahtani" },
  { ar: "العتيبي", en: "Al-Otaibi" },
  { ar: "الشمري", en: "Al-Shammari" },
  { ar: "الدوسري", en: "Al-Dosari" },
  { ar: "الحربي", en: "Al-Harbi" },
  { ar: "المطيري", en: "Al-Mutairi" },
  { ar: "الزهراني", en: "Al-Zahrani" },
  { ar: "الغامدي", en: "Al-Ghamdi" },
  { ar: "البلوي", en: "Al-Balawi" },
  { ar: "العنزي", en: "Al-Anzi" },
  { ar: "الخالدي", en: "Al-Khalidi" },
] as const;
