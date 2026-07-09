const User = require('../models/User');

// Escape a string for safe use inside a RegExp.
const escapeRegex = (str = '') => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Find every counsellor assigned to a department.
 *
 * Matching is case-insensitive and ignores surrounding whitespace so that minor
 * data-entry differences (e.g. "SIT" vs "sit " vs " SIT") still route to every
 * counsellor covering that department — not just the one whose stored string
 * happens to match byte-for-byte.
 */
const findCounselorsForDepartment = async (department) => {
  if (!department || !String(department).trim()) return [];
  const dept = String(department).trim();
  return User.find({
    role: 'counsellor',
    assignedDepartments: {
      $elemMatch: { $regex: `^\\s*${escapeRegex(dept)}\\s*$`, $options: 'i' },
    },
  });
};

module.exports = { escapeRegex, findCounselorsForDepartment };
