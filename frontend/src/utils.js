export function getScoreColor(score) {
    if (score >= 85) return '#4CAF50'; // Green for excellent
    if (score >= 70) return '#2196F3'; // Blue for good
    if (score >= 55) return '#FF9800'; // Orange for fair
    return '#F44336'; // Red for low scores
}

export function getMatchLevel(score) {
    score = parseFloat(score) || 0;
    if (score >= 85) return "Excellent Match";
    if (score >= 70) return "Strong Match";
    if (score >= 55) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Poor Match";
}
