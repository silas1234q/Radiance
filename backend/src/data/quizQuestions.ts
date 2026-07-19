export interface QuizQuestion {
  id: number;
  text: string;
  type: 'single' | 'multiple' | 'yesno' | 'tone' | 'text';
  options?: string[];
}

export const quizQuestions: QuizQuestion[] = [
  { id: 1, text: "What is your gender?", type: 'single', options: ['Male', 'Female', 'Prefer not to say'] },
  { id: 2, text: "How old are you?", type: 'single', options: ['Less than 18', '18–24', '24–30', '30–40', '40–55', 'More than 55'] },
  { id: 3, text: "What is your skin tone?", type: 'tone', options: ['Very fair', 'Fair', 'Medium', 'Olive', 'Brown', 'Dark brown'] },
  { id: 4, text: "How does your skin feel by midday, untouched?", type: 'single', options: ['Oily all over', 'Oily T-zone only', 'Normal', 'Dry', 'Tight and flaky'] },
  { id: 5, text: "Does your skin ever feel like it's both oily and dry in different areas?", type: 'yesno' },
  { id: 6, text: "Do you have visible pores?", type: 'yesno' },
  { id: 7, text: "Where?", type: 'single', options: ['Face', 'Arms', 'Legs', 'Two of the above combined', 'Everywhere'] },
  { id: 8, text: "Does your skin react easily to new products?", type: 'single', options: ['Yes', 'No', 'Often', 'Happens but not often'] },
  { id: 9, text: "Which reaction happens often?", type: 'multiple', options: ['Redness', 'Stinging', 'Burning', 'Two of the above combined', 'All of the above'] },
  { id: 10, text: "What's the #1 thing you want help with?", type: 'single', options: ['Acne', 'Texture', 'Redness', 'Dark spots', 'Scarring', 'Fine lines', 'Large pores'] },
  { id: 11, text: "How long has this been a concern?", type: 'single', options: ['Weeks', 'Months', 'Years'] },
  { id: 12, text: "What is the situation now?", type: 'single', options: ['Better', 'Worse', 'Same'] },
  { id: 13, text: "What type of breakouts do you mostly get?", type: 'single', options: ['Blackheads', 'Whiteheads', 'Small red bumps', 'Large painful cysts', 'Mix'] },
  { id: 14, text: "Where on the face?", type: 'multiple', options: ['Forehead', 'Cheeks', 'Chin and jawline', 'Nose', 'All over'] },
  { id: 15, text: "Does it follow your menstrual cycle?", type: 'yesno' },
  { id: 16, text: "Does it flare with specific triggers?", type: 'multiple', options: ['Diet', 'Sweat', 'Stress', 'Certain products', 'All the above', 'No'] },
  { id: 17, text: "Do breakouts leave marks or scars after they heal?", type: 'yesno' },
  { id: 18, text: "Have you had cystic or nodular acne?", type: 'yesno' },
  { id: 19, text: "How often do you change pillowcases?", type: 'single', options: ['Always', 'Often', 'Occasionally', 'Rarely', 'Never'] },
  { id: 20, text: "How often do you use sunscreen?", type: 'single', options: ['Always', 'Often', 'Occasionally', 'Rarely', 'Never', 'Only at the beach'] },
  { id: 21, text: "What have you already tried?", type: 'multiple', options: ['OTC products', 'Prescription topicals', 'Oral medication', 'Isotretinoin/Accutane', 'Professional treatments', 'None'] },
  { id: 22, text: "Did anything make it worse?", type: 'text' },
  { id: 23, text: "Did anything work?", type: 'text' },
  { id: 24, text: "Are you currently using any prescription skincare?", type: 'yesno' },
  { id: 25, text: "Any known allergies or reactions to skincare ingredients?", type: 'yesno' },
  { id: 26, text: "What hormonal condition are you going through?", type: 'single', options: ['Puberty', 'Pregnancy', 'Menopause', 'Starting/stopping birth control', 'None'] },
  { id: 27, text: "How much sleep do you get on average?", type: 'single', options: ['10 hours', '8 hours', '6 hours', '5 hours', '4 hours', 'Less than 4'] },
];
