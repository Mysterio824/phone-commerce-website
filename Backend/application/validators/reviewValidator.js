const reviewValidator = {
    validateReview: (review) => {
        const errors = [];
        
        if (!review.productId) {
            errors.push('Product ID is required');
        }
        
        if (!review.userId) {
            errors.push('User ID is required');
        }
        
        if (review.rating === undefined || review.rating === null) {
            errors.push('Rating is required');
        } else {
            const rating = parseFloat(review.rating);
            if (isNaN(rating) || rating < 0 || rating > 5) {
                errors.push('Rating must be a number between 0 and 5');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = reviewValidator;