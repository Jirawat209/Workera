export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start
        .replace(/-+$/, '');      // Trim - from end
}

export const isValidGoogleDriveUrl = (url: string): boolean => {
    try {
        const urlStr = url.trim();
        if (!urlStr) return false;

        let fullUrl = urlStr;
        if (!fullUrl.startsWith('http')) {
            fullUrl = `https://${fullUrl}`;
        }

        // const urlObj = new URL(fullUrl);
        return fullUrl.includes('drive.google.com') || fullUrl.includes('docs.google.com');
    } catch (e) {
        return false;
    }
};

export const getGoogleDriveFileName = (url: string, defaultName = 'Google Drive File'): string => {
    try {
        const urlStr = url.trim();
        if (!urlStr) return defaultName;

        if (urlStr.includes('docs.google.com')) {
            if (urlStr.includes('/document/')) return 'Google Doc';
            if (urlStr.includes('/spreadsheets/')) return 'Google Sheet';
            if (urlStr.includes('/presentation/')) return 'Google Slides';
            if (urlStr.includes('/forms/')) return 'Google Form';
        }

        // Return default if generic drive link
        return defaultName;
    } catch (e) {
        return defaultName;
    }
};
