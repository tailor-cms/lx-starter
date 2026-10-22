import type { ProfileQuestion } from './create-multiple-choice';
import { createProfilingQuestion } from './create-multiple-choice';
import { formatTagLabel } from '../../utils';

// Get default profiling questions
export function getDefaultQuestions(topTags: string[]): ProfileQuestion[] {
  return [
    createProfilingQuestion({
      id: 'experience-level',
      questionText: 'How would you describe your experience level ?',
      category: 'experience',
      answers: [
        'Just starting out',
        'Some experience',
        'Experienced',
        'Expert level',
      ],
      tagAffinities: [{}, {}, {}, {}],
      allowMultiple: false,
      weight: 1,
      relatedTags: [],
    }),
    createProfilingQuestion({
      id: 'learning-goal',
      questionText: 'What\'s your primary learning goal?',
      category: 'goal',
      answers: [
        'Get certified',
        'Improve business outcomes',
        'Hone new skills',
        'General knowledge',
      ],
      tagAffinities: [{}, {}, {}, {}],
      allowMultiple: true,
      weight: 0.8,
      relatedTags: [],
    }),
    createProfilingQuestion({
      id: 'interest-areas',
      questionText: 'Which areas interest you most?',
      category: 'interest',
      answers: topTags.slice(0, 4).map((tag) => formatTagLabel(tag)),
      tagAffinities: topTags.slice(0, 4).map((tag) => ({ [tag]: 1 })),
      allowMultiple: true,
      weight: 1,
      relatedTags: topTags.slice(0, 4),
    }),
  ];
}
