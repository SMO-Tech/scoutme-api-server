// Helper function to format date as DD-MM-YYYY
export const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

// Helper function to parse DD-MM-YYYY format to Date
export const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    // Try DD-MM-YYYY format
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month, day);
            // Validate the date
            if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
                return date;
            }
        }
    }
    
    // Fallback to standard Date parsing
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? date : null;
};