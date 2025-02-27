const getLitterMilestones = (litter) => {
  const milestones = [];
  const today = new Date();
  
  if (!litter.whelping_date) return milestones;
  
  const whelpingDate = new Date(litter.whelping_date);
  
  // Calculate go-home date (typically 8 weeks after whelping)
  const goHomeDate = new Date(whelpingDate);
  goHomeDate.setDate(goHomeDate.getDate() + 56); // 8 weeks = 56 days
  
  // Only add future dates or dates within the past day (still relevant)
  if (differenceInDays(today, goHomeDate) <= 1) {
    milestones.push({
      type: 'go-home',
      date: goHomeDate,
      title: 'Puppies Go Home',
      description: 'Puppies ready to go to their new homes'
    });
  }
  
  // Add first vet check (typically 2-3 weeks after birth)
  const firstVetCheck = new Date(whelpingDate);
  firstVetCheck.setDate(firstVetCheck.getDate() + 21); // 3 weeks
  
  if (differenceInDays(today, firstVetCheck) <= 1) {
    milestones.push({
      type: 'vet-check',
      date: firstVetCheck,
      title: 'First Vet Check',
      description: 'Puppies first veterinary examination'
    });
  }
  
  // Add vaccination dates
  // First shots around 6-8 weeks
  const firstVaccination = new Date(whelpingDate);
  firstVaccination.setDate(firstVaccination.getDate() + 42); // 6 weeks
  
  if (differenceInDays(today, firstVaccination) <= 1) {
    milestones.push({
      type: 'vaccination',
      date: firstVaccination,
      title: 'First Vaccinations',
      description: 'Puppies first vaccination appointment'
    });
  }
  
  return milestones;
}; 