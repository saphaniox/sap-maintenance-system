// Expose package version for display in UI
import pkg from '../../package.json';

export const APP_VERSION = pkg.version || '0.0.0';
export default APP_VERSION;