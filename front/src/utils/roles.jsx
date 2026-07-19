export const ROLES = {
    ADMIN: 'Administrator',
    PRODUCT_OWNER: 'Product Owner',
    SCRUM_MASTER: 'Scrum Master',
    DEVELOPER: 'Developer'
};

export const hasRole = (requiredRole) => {
    const userRole = sessionStorage.getItem('role')?.toLowerCase();
    return userRole === requiredRole.toLowerCase();
};