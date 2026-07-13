/**
 * Utility for formatting Cloudinary Image URLs
 * Applies q_auto and f_auto optimizations to significantly reduce bandwidth and load time.
 */

export const getOptimizedImageUrl = (url: string | null | undefined): string => {
    if (!url) return '/placeholder-image.jpg';

    // If the URL is a local or non-cloudinary URL, just return it
    if (!url.includes('cloudinary.com')) {
        return url;
    }

    // Insert q_auto,f_auto into the upload segment of the cloudinary URL
    // e.g. https://res.cloudinary.com/cloudname/image/upload/v12345/image.jpg
    // becomes https://res.cloudinary.com/cloudname/image/upload/q_auto,f_auto/v12345/image.jpg

    const uploadSegment = '/upload/';
    const uploadIndex = url.indexOf(uploadSegment);
    
    if (uploadIndex === -1) return url;

    // Check if optimizations are already present to avoid duplication
    if (url.includes('q_auto') || url.includes('f_auto')) {
        return url;
    }

    const beforeUpload = url.substring(0, uploadIndex + uploadSegment.length);
    const afterUpload = url.substring(uploadIndex + uploadSegment.length);

    return `${beforeUpload}q_auto,f_auto/${afterUpload}`;
};
