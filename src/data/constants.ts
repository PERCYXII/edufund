
// ============================================
// Fields of Study
// ============================================
export const FIELDS_OF_STUDY = [
    'All Fields',
    'Engineering',
    'Medicine & Health',
    'Business & Commerce',
    'Law',
    'Science & Technology',
    'Arts & Humanities',
    'Education',
    'Social Sciences',
];

// ============================================
// Campaign Categories
// ============================================
export const CAMPAIGN_CATEGORIES = [
    { label: 'Tuition Fees', value: 'tuition' },
    { label: 'Accommodation', value: 'accommodation' },
    { label: 'Food Assistance', value: 'food' },
    { label: 'Textbooks', value: 'textbooks' },
    { label: 'Transport', value: 'transport' },
    { label: 'Application Fee', value: 'application_fee' },
    { label: 'Registration Fee', value: 'registration_fee' },
    { label: 'Stationary', value: 'stationary' },
    { label: 'Other', value: 'other' },
];

export const CAMPAIGN_TYPES = [
    { label: 'Standard Campaign', value: 'standard', description: 'Large fees like Tuition and Accommodation' },
    { label: 'Quick Support', value: 'quick', description: 'Small fees like Application, Registration, Meal and Stationary assistance' },
];

export const CATEGORY_TO_TYPE: Record<string, 'standard' | 'quick'> = {
    'tuition': 'standard',
    'accommodation': 'standard',
    'food': 'quick',
    'textbooks': 'quick',
    'transport': 'quick',
    'application_fee': 'quick',
    'registration_fee': 'quick',
    'stationary': 'quick',
    'other': 'quick',
};

// ============================================
// Year of Study Options
// ============================================
export const YEAR_OPTIONS = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year',
    'Postgraduate',
    'Honours',
    'Masters',
    'PhD',
];

// ============================================
// Donation Amount Options
// ============================================
export const DONATION_AMOUNTS = [50, 100, 250, 500, 1000, 2500];

// ============================================
// Accepted Documents
// ============================================
export const ACCEPTED_DOCUMENTS = [
    'Student ID Card',
    'Registration Letter',
    'Fee Statement',
    'Enrollment Certificate',
    'Academic Transcript',
    'Letter from Registrar',
];
