export interface QuizQuestion {
  id: number;
  text: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'yesno' | 'tone' | 'text';
  options?: string[];
  femaleOnly?: boolean;
  showIf?: (answers: Record<number, string>) => boolean;
}

export const quizQuestions: QuizQuestion[] = [
  // Demographics
  { id: 1, text: "What is your gender?", subtitle: "This is relevant for hormonal acne patterns", type: 'single', options: ['Male', 'Female', 'Prefer not to say'] },
  { id: 2, text: "How old are you?", subtitle: "Skin needs change with time. We'll tailor your results to match", type: 'single', options: ['Less than 18', '18–24', '24–30', '30–40', '40–55', 'More than 55'] },
  { id: 3, text: "What is your skin tone?", subtitle: "Based on the Fitzpatrick scale. Pick the color closest to yours", type: 'tone', options: ['Very fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark brown'] },

  // Skin type & feel
  { id: 4, text: "How does your skin feel by midday, untouched?", subtitle: "The T-zone is the area covering your forehead, nose, and chin", type: 'single', options: ['Oily all over', 'Oily T-zone only', 'Normal', 'Dry', 'Tight and flaky'] },
  { id: 5, text: "Does your skin ever feel like it's both oily and dry in different areas?", subtitle: "This is known as combination skin — oily in some spots, dry or flaky in others", type: 'yesno' },

  // Pores
  { id: 6, text: "Do you have visible pores?", subtitle: "Pores are tiny openings on your skin where oil and sweat come out", type: 'yesno' },
  { id: 7, text: "Where?", type: 'single', options: ['Face', 'Arms', 'Legs', 'Two of the above combined', 'Everywhere'], showIf: (a) => a[6] === 'Yes' },

  // Sensitivity
  { id: 8, text: "Does your skin react easily to new products?", subtitle: "Redness, stinging, or burning", type: 'single', options: ['Yes', 'No', 'Often', 'Happens but not often'] },
  { id: 9, text: "Which reaction happens often?", type: 'multiple', options: ['Redness', 'Stinging', 'Burning', 'Two of the above combined', 'All of the above'], showIf: (a) => a[8] !== 'No' },

  // Primary concern
  { id: 10, text: "What's the #1 thing you want help with?", type: 'single', options: ['Acne', 'Texture', 'Redness', 'Dark spots', 'Scarring', 'Fine lines', 'Large pores'] },
  { id: 11, text: "How long has this been a concern?", type: 'single', options: ['Weeks', 'Months', 'Years'] },
  { id: 12, text: "What is the situation now?", type: 'single', options: ['Better', 'Worse', 'Same'] },

  // Breakouts (only if primary concern is acne-related)
  { id: 13, text: "What type of breakouts do you mostly get?", subtitle: "Blackheads are dark open bumps. Whiteheads are closed, skin-colored bumps. Cysts are deep, painful lumps under the skin", type: 'single', options: ['Blackheads', 'Whiteheads', 'Small red bumps', 'Large painful cysts', 'Mix'], showIf: (a) => ['Acne', 'Texture', 'Large pores', 'Scarring'].includes(a[10]) },
  { id: 14, text: "Where on the face?", type: 'multiple', options: ['Forehead', 'Cheeks', 'Chin and jawline', 'Nose', 'All over'], showIf: (a) => ['Acne', 'Texture', 'Large pores', 'Scarring'].includes(a[10]) },
  { id: 15, text: "Does it follow your menstrual cycle?", type: 'yesno', femaleOnly: true, showIf: (a) => ['Acne', 'Texture', 'Large pores', 'Scarring'].includes(a[10]) },
  { id: 16, text: "Does it flare with specific triggers?", type: 'multiple', options: ['Diet', 'Sweat', 'Stress', 'Certain products', 'All the above', 'No'], showIf: (a) => ['Acne', 'Texture', 'Large pores', 'Scarring'].includes(a[10]) },
  { id: 17, text: "Do breakouts leave marks or scars after they heal?", subtitle: "Marks are flat dark or red spots. Scars are raised or indented texture changes", type: 'yesno', showIf: (a) => ['Acne', 'Texture', 'Large pores', 'Scarring'].includes(a[10]) },
  { id: 18, text: "Have you had cystic or nodular acne?", subtitle: "Cystic acne is soft, pus-filled lumps deep under the skin. Nodular acne is hard, painful bumps that don't come to a head", type: 'yesno', showIf: (a) => ['Acne', 'Texture', 'Large pores', 'Scarring'].includes(a[10]) },

  // Habits
  { id: 19, text: "How often do you change pillowcases?", subtitle: "Dirty pillowcases collect oil, bacteria, and dead skin that can cause breakouts", type: 'single', options: ['Always', 'Often', 'Occasionally', 'Rarely', 'Never'] },
  { id: 20, text: "How often do you use sunscreen?", type: 'single', options: ['Always', 'Often', 'Occasionally', 'Rarely', 'Never', 'Only at the beach'] },

  // Treatment history
  { id: 21, text: "What have you already tried?", subtitle: "OTC = over-the-counter (store-bought). Topicals = creams or gels applied to skin. Isotretinoin (Accutane) is a strong prescription pill for severe acne", type: 'multiple', options: ['OTC products', 'Prescription topicals', 'Oral medication', 'Isotretinoin/Accutane', 'Professional treatments', 'None'] },
  { id: 22, text: "Did anything make it worse?", type: 'text', showIf: (a) => !!a[21] && a[21] !== 'None' },
  { id: 23, text: "Did anything work?", type: 'text', showIf: (a) => !!a[21] && a[21] !== 'None' },
  { id: 24, text: "Are you currently using any prescription skincare?", subtitle: "Products prescribed by a doctor or dermatologist, like tretinoin or clindamycin", type: 'yesno' },
  { id: 25, text: "Any known allergies or reactions to skincare ingredients?", type: 'yesno' },

  // Hormonal & lifestyle
  { id: 26, text: "What hormonal condition are you going through?", subtitle: "Hormonal changes can trigger breakouts, oiliness, or dryness. Menopause is when periods stop permanently, usually around age 45–55", type: 'single', options: ['Puberty', 'Pregnancy', 'Menopause', 'Starting/stopping birth control', 'None'], femaleOnly: true },
  { id: 27, text: "How much sleep do you get on average?", type: 'single', options: ['10 hours', '8 hours', '6 hours', '5 hours', '4 hours', 'Less than 4'] },
];
