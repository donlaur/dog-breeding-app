import { formatAge } from '../utils/dateUtils';

// ... existing code ...

// Find where whelp_date is displayed and replace with formatAge
<Typography variant="body2" color="text.secondary">
  Whelped: {litter.whelp_date ? `${format(new Date(litter.whelp_date), 'MM/dd/yyyy')} (${formatAge(litter.whelp_date)})` : 'Expected: ' + format(new Date(litter.expected_date), 'MM/dd/yyyy')}
</Typography>

// ... existing code ... 