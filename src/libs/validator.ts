/**
 * Simple validation utility for Express controllers.
 * Throws an error if validation fails.
 * Usage: validate(req.body, { field: 'required|string|min:3' })
 */
export function validate(obj: any, rules: Record<string, string>) {
	for (const [field, ruleStr] of Object.entries(rules)) {
		const rulesArr = ruleStr.split('|');
		const value = obj[field];
		for (const rule of rulesArr) {
			if (rule === 'required' && (value === undefined || value === null || value === '')) {
				throw new Error(`${field} is required`);
			}
			if (rule === 'string' && value !== undefined && typeof value !== 'string') {
				throw new Error(`${field} must be a string`);
			}
			if (rule === 'array' && value !== undefined && !Array.isArray(value)) {
				throw new Error(`${field} must be an array`);
			}
			if (rule.startsWith('min:')) {
				const min = parseInt(rule.split(':')[1], 10);
				if (typeof value === 'string' && value.length < min) {
					throw new Error(`${field} must be at least ${min} characters`);
				}
			}
			if (rule.startsWith('max:')) {
				const max = parseInt(rule.split(':')[1], 10);
				if (typeof value === 'string' && value.length > max) {
					throw new Error(`${field} must be at most ${max} characters`);
				}
			}
		}
	}
}
