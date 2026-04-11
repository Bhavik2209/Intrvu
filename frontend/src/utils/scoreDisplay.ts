export type ScoreTone = 'positive' | 'warning' | 'negative' | 'neutral';

const normalize = (value: string) => value.trim().toLowerCase();

export const getJobFitLabel = (score: number): string => {
  if (score >= 90) return 'Great Match';
  if (score >= 75) return 'Good Match';
  if (score >= 60) return 'Moderate Match';
  return 'Low Fit';
};

export const getResumeQualityLabel = (score: number): string => {
  if (score >= 90) return 'Ready to Impress';
  if (score >= 70) return 'Needs Polish';
  return 'Refine for Impact';
};

export const getScoreSymbol = (label: string): string => {
  const l = normalize(label);

  if (l === 'great match' || l === 'ready to impress' || l.includes('excellent')) {
    return '✅';
  }
  if (l === 'good match' || l.includes('good')) {
    return '👍';
  }
  if (l === 'moderate match' || l === 'needs polish' || l.includes('fair')) {
    return '⚠️';
  }
  if (l === 'low fit' || l === 'refine for impact' || l.includes('poor')) {
    return '🛠';
  }

  return 'ℹ️';
};

export const getScoreTone = (label: string): ScoreTone => {
  const l = normalize(label);

  if (l === 'great match' || l === 'good match' || l === 'ready to impress') {
    return 'positive';
  }
  if (l === 'moderate match' || l === 'needs polish') {
    return 'warning';
  }
  if (l === 'low fit' || l === 'refine for impact') {
    return 'negative';
  }

  return 'neutral';
};

export const getToneClasses = (tone: ScoreTone) => {
  if (tone === 'positive') {
    return {
      bg: 'bg-[#f0fdf4]',
      text: 'text-[#166534]',
      border: 'border-[#dcfce7]'
    };
  }

  if (tone === 'warning') {
    return {
      bg: 'bg-[#fffbeb]',
      text: 'text-[#92400e]',
      border: 'border-[#fef3c7]'
    };
  }

  if (tone === 'negative') {
    return {
      bg: 'bg-[#fef2f2]',
      text: 'text-[#991b1b]',
      border: 'border-[#fee2e2]'
    };
  }

  return {
    bg: 'bg-[#f8fafc]',
    text: 'text-[#64748b]',
    border: 'border-[#f1f5f9]'
  };
};