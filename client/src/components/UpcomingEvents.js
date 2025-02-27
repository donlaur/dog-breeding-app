import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDog } from '../context/DogContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip
} from '@mui/material';
import { 
  Cake, 
  Home, 
  DateRange,
  Female,
  Male
} from '@mui/icons-material';
import { format, addYears, isBefore, differenceInDays, parseISO } from 'date-fns';

const UpcomingEvents = () => {
  const { dogs, loading: dogsLoading } = useDog();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [upcomingLitterDates, setUpcomingLitterDates] = useState([]);
  
  useEffect(() => {
    if (dogsLoading || !dogs.length) return;
    
    // Get today's date
    const today = new Date();
    
    // Calculate upcoming birthdays (within next 30 days)
    const birthdays = dogs
      .filter(dog => dog.birth_date)
      .map(dog => {
        // Convert string to Date object properly
        const birthDate = parseISO(dog.birth_date);
        
        // Find this year's birthday
        let thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // Check if today is the birthday (same month and day)
        const isBirthdayToday = today.getMonth() === birthDate.getMonth() && 
                               today.getDate() === birthDate.getDate();
        
        // Determine if we should use this year or next year
        let nextBirthday;
        if (isBefore(thisYearBirthday, today) && !isBirthdayToday) {
          // Birthday already passed this year, use next year
          nextBirthday = addYears(thisYearBirthday, 1);
        } else {
          // Birthday is today or still coming this year
          nextBirthday = thisYearBirthday;
        }
        
        // Calculate age they'll be turning
        const age = nextBirthday.getFullYear() - birthDate.getFullYear();
        
        // Calculate days until birthday (0 if today)
        const daysUntil = isBirthdayToday ? 0 : differenceInDays(nextBirthday, today);
        
        return {
          id: dog.id,
          name: dog.call_name,
          registeredName: dog.registered_name,
          date: nextBirthday,
          daysUntil,
          type: 'birthday',
          details: `Turning ${age} ${age === 1 ? 'year' : 'years'} old`,
          gender: dog.gender,
          image: dog.cover_photo
        };
      })
      .filter(event => event.daysUntil <= 30) // Only show upcoming 30 days
      .sort((a, b) => a.daysUntil - b.daysUntil);
    
    setUpcomingBirthdays(birthdays);
    
    // Calculate upcoming litter milestones
    // This is a placeholder for when you implement litter tracking
    const litters = []; // Replace with actual litter data
    
    const litterEvents = litters
      .filter(litter => litter.whelping_date || litter.go_home_date)
      .flatMap(litter => {
        const events = [];
        // Litter milestone calculations
        // ...
        return events;
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
    
    setUpcomingLitterDates(litterEvents);
    
  }, [dogs, dogsLoading]);
  
  // Simplified event item for better design integration
  const EventItem = ({ event }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Avatar 
        src={event.image}
        alt={event.name}
        sx={{ 
          width: 40, 
          height: 40, 
          mr: 1.5,
          border: '1px solid #eee'
        }}
      />
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Link
            to={`/dashboard/dogs/${event.id}`}
            style={{ textDecoration: 'none', color: '#1976d2' }}
          >
            <Typography variant="body1" component="span" fontWeight="medium">
              {event.name}
            </Typography>
          </Link>
          {event.daysUntil === 0 && (
            <Chip 
              size="small"
              label="Today!"
              color="primary"
              sx={{ 
                ml: 1, 
                height: 20, 
                fontSize: '0.7rem',
                fontWeight: 'bold',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {format(event.date, 'MMM d')} — {event.details}
        </Typography>
      </Box>
    </Box>
  );
  
  const renderEventSection = (events, title, emptyMessage) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      {events.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <Box>
          {events.map(event => (
            <EventItem key={event.id} event={event} />
          ))}
        </Box>
      )}
    </Box>
  );
  
  return (
    <Card sx={{ height: '100%', boxShadow: 1 }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DateRange sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Upcoming Events
          </Typography>
        </Box>
        
        {renderEventSection(
          upcomingBirthdays, 
          "Birthdays", 
          "No birthdays in the next 30 days"
        )}
        
        {renderEventSection(
          upcomingLitterDates, 
          "Litter Milestones", 
          "No litter milestones in the next 30 days"
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents; 