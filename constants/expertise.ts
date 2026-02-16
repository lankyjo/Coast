export const EXPERTISE_OPTIONS = [
    "Logo Design",
    "Brand Identity",
    "Brand Strategy",
    "Visual Design",
    "Social Media Design",
    "Flyer Design",
    "EPK Design",
    "Merchandise Design",
    "Web Design",
    "UI/UX Design",
    "Motion Graphics",
    "Illustration",
    "Photography",
    "Copywriting",
    "Marketing Strategy",
    "Project Management",
    "SEO Specialist",
    "Mobile App Developer"
] as const;

export type Expertise = (typeof EXPERTISE_OPTIONS)[number];
