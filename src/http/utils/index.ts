export const categorizeAge = (age: number) => {
    if (age < 15) return '<15 age';
    if (age < 30) return '15-29 age';
    if (age < 45) return '30-44 age';
    if (age < 60) return '45-59 age';
    if (age < 75) return '60-74 age';
    if (age < 90) return '75-89 age';
    return '90+ age';
};

export function formatDateLabel(date: Date, timePeriod: number): string {
    if (timePeriod <= 7) {
        // For 7 days: "Mon, 12"
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    } else if (timePeriod <= 90) {
        // For 30 and 90 days: "Feb 12"
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
        // For yearly view: "February"
        return date.toLocaleDateString('en-US', { month: 'long' });
    }
}

export function findNearestDate(targetDate: Date, dates: Date[]): Date {
    return dates.reduce((prev, curr) => {
        const prevDiff = Math.abs(prev.getTime() - targetDate.getTime());
        const currDiff = Math.abs(curr.getTime() - targetDate.getTime());
        return prevDiff < currDiff ? prev : curr;
    });
}

export function findNearestLabel(currentLabel: string, existingLabels: string[]): string {
    const currentDate = new Date(currentLabel);
    let minDiff = Infinity;
    let nearestLabel = existingLabels[0];

    existingLabels.forEach(label => {
        const labelDate = new Date(label);
        const diff = Math.abs(currentDate.getTime() - labelDate.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            nearestLabel = label;
        }
    });

    return nearestLabel;
}