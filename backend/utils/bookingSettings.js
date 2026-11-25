function settingsError(s) {
 if (!Number.isInteger(s.businessHoursStart) || s.businessHoursStart < 0 || s.businessHoursStart > 23 || !Number.isInteger(s.businessHoursEnd) || s.businessHoursEnd < 1 || s.businessHoursEnd > 24 || s.businessHoursEnd <= s.businessHoursStart) return 'Closing time must be after opening time (hours 0–24).';
 if (!Number.isInteger(s.slotIntervalMinutes) || s.slotIntervalMinutes < 1 || s.slotIntervalMinutes > (s.businessHoursEnd-s.businessHoursStart)*60) return 'Choose a positive slot interval within office hours.';
 if (!Array.isArray(s.workingDays) || !s.workingDays.length || s.workingDays.some(d=>!Number.isInteger(d)||d<0||d>6)) return 'Choose valid working days.';
 if (!Number.isInteger(s.maxActivePerService) || s.maxActivePerService<1) return 'The submission limit must be a positive whole number.';
 return null;
}
module.exports={settingsError};
