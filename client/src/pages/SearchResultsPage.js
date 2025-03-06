import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Grid,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PetsIcon from '@mui/icons-material/Pets';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import PregnantWomanIcon from '@mui/icons-material/PregnantWoman';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getPhotoUrl } from '../utils/photoUtils';

function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [query, setQuery] = useState('');
  
  // Get search results from location state or query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('q') || '';
    setQuery(searchQuery);
    
    if (searchQuery) {
      performSearch(searchQuery);
    } else if (location.state?.results) {
      setSearchResults(location.state.results);
    }
  }, [location]);
  
  // Perform search when query changes
  const performSearch = async (searchQuery) => {
    if (!searchQuery) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Navigate back
  const handleBack = () => {
    navigate(-1);
  };
  
  // Navigate to details page based on entity type
  const navigateToDetails = (type, id) => {
    switch (type) {
      case 'dogs':
        navigate(`/dashboard/dogs/${id}`);
        break;
      case 'puppies':
        navigate(`/dashboard/puppies/${id}`);
        break;
      case 'litters':
        navigate(`/dashboard/litters/${id}`);
        break;
      default:
        break;
    }
  };
  
  // Get relevant tabs based on search results
  const getTabs = () => {
    const tabs = [];
    
    if (!searchResults) return tabs;
    
    const allCount = 
      (searchResults.dogs?.length || 0) + 
      (searchResults.puppies?.length || 0) + 
      (searchResults.litters?.length || 0);
    
    tabs.push(
      <Tab 
        key="all" 
        label={`All (${allCount})`} 
        icon={<SearchIcon />} 
        iconPosition="start" 
      />
    );
    
    if (searchResults.dogs?.length > 0) {
      tabs.push(
        <Tab 
          key="dogs" 
          label={`Dogs (${searchResults.dogs.length})`} 
          icon={<PetsIcon />} 
          iconPosition="start" 
        />
      );
    }
    
    if (searchResults.puppies?.length > 0) {
      tabs.push(
        <Tab 
          key="puppies" 
          label={`Puppies (${searchResults.puppies.length})`} 
          icon={<ChildCareIcon />} 
          iconPosition="start" 
        />
      );
    }
    
    if (searchResults.litters?.length > 0) {
      tabs.push(
        <Tab 
          key="litters" 
          label={`Litters (${searchResults.litters.length})`} 
          icon={<PregnantWomanIcon />} 
          iconPosition="start" 
        />
      );
    }
    
    return tabs;
  };
  
  // Get entity type based on active tab
  const getEntityTypeFromTab = (tabIndex) => {
    if (!searchResults) return null;
    
    // First tab is always "All"
    if (tabIndex === 0) return 'all';
    
    // Generate the order of tabs
    const tabOrder = ['dogs', 'puppies', 'litters'].filter(type => 
      searchResults[type]?.length > 0
    );
    
    return tabOrder[tabIndex - 1];
  };
  
  // Render search results based on active tab
  const renderResults = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (!searchResults) {
      return (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No search results to display. Try searching for dogs, puppies, or litters.
          </Typography>
        </Box>
      );
    }
    
    const entityType = getEntityTypeFromTab(activeTab);
    
    if (entityType === 'all') {
      return (
        <Box sx={{ mt: 2 }}>
          {searchResults.dogs?.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Dogs</Typography>
              {renderDogsList(searchResults.dogs)}
              <Divider sx={{ my: 2 }} />
            </>
          )}
          
          {searchResults.puppies?.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Puppies</Typography>
              {renderPuppiesList(searchResults.puppies)}
              <Divider sx={{ my: 2 }} />
            </>
          )}
          
          {searchResults.litters?.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Litters</Typography>
              {renderLittersList(searchResults.litters)}
            </>
          )}
          
          {Object.values(searchResults).every(arr => !arr || arr.length === 0) && (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              No results found for "{query}".
            </Typography>
          )}
        </Box>
      );
    } else if (entityType === 'dogs' && searchResults.dogs?.length > 0) {
      return renderDogsList(searchResults.dogs);
    } else if (entityType === 'puppies' && searchResults.puppies?.length > 0) {
      return renderPuppiesList(searchResults.puppies);
    } else if (entityType === 'litters' && searchResults.litters?.length > 0) {
      return renderLittersList(searchResults.litters);
    } else {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          No results found for "{query}" in this category.
        </Typography>
      );
    }
  };
  
  // Render dogs list
  const renderDogsList = (dogs) => (
    <List>
      {dogs.map(dog => (
        <ListItem 
          key={dog.id} 
          button 
          onClick={() => navigateToDetails('dogs', dog.id)}
          sx={{ 
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ListItemAvatar>
            <Avatar 
              src={getPhotoUrl(dog.cover_photo)} 
              variant="rounded"
              sx={{ width: 56, height: 56, mr: 1 }}
            >
              <PetsIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={dog.call_name}
            secondary={
              <React.Fragment>
                <Box component="span" sx={{ display: 'block' }}>
                  {dog.registered_name || ''}
                </Box>
                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                  {dog.breed_name ? (
                    <Chip 
                      label={dog.breed_name} 
                      size="small" 
                      variant="outlined"
                      sx={{ mr: 1 }} 
                    />
                  ) : null}
                  <Chip 
                    label={dog.gender === 'M' ? 'Male' : 'Female'} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      mr: 1,
                      color: dog.gender === 'M' ? 'primary.main' : 'secondary.main',
                      borderColor: dog.gender === 'M' ? 'primary.main' : 'secondary.main',
                    }} 
                  />
                  {dog.color && (
                    <Chip 
                      label={dog.color} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                </Box>
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
  
  // Render puppies list
  const renderPuppiesList = (puppies) => (
    <List>
      {puppies.map(puppy => (
        <ListItem 
          key={puppy.id} 
          button 
          onClick={() => navigateToDetails('puppies', puppy.id)}
          sx={{ 
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ListItemAvatar>
            <Avatar 
              src={getPhotoUrl(puppy.photo)} 
              variant="rounded"
              sx={{ width: 56, height: 56, mr: 1 }}
            >
              <ChildCareIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={puppy.name || `Puppy #${puppy.identifier || 'Unknown'}`}
            secondary={
              <React.Fragment>
                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                  {puppy.breed_name && (
                    <Chip 
                      label={puppy.breed_name} 
                      size="small" 
                      variant="outlined"
                      sx={{ mr: 1 }} 
                    />
                  )}
                  <Chip 
                    label={puppy.gender === 'M' ? 'Male' : 'Female'} 
                    size="small" 
                    variant="outlined"
                    sx={{ 
                      mr: 1,
                      color: puppy.gender === 'M' ? 'primary.main' : 'secondary.main',
                      borderColor: puppy.gender === 'M' ? 'primary.main' : 'secondary.main',
                    }} 
                  />
                  {puppy.color && (
                    <Chip 
                      label={puppy.color} 
                      size="small" 
                      variant="outlined" 
                    />
                  )}
                  {puppy.status && (
                    <Chip 
                      label={puppy.status} 
                      size="small" 
                      color="primary"
                      sx={{ ml: 1 }} 
                    />
                  )}
                </Box>
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
  
  // Render litters list
  const renderLittersList = (litters) => (
    <List>
      {litters.map(litter => (
        <ListItem 
          key={litter.id} 
          button 
          onClick={() => navigateToDetails('litters', litter.id)}
          sx={{ 
            borderRadius: 1,
            mb: 1,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <ListItemAvatar>
            <Avatar 
              src={getPhotoUrl(litter.cover_photo)} 
              variant="rounded"
              sx={{ width: 56, height: 56, mr: 1 }}
            >
              <PregnantWomanIcon />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={litter.litter_name || `Litter #${litter.id}`}
            secondary={
              <React.Fragment>
                <Box component="span" sx={{ display: 'block' }}>
                  {litter.dam_name && litter.sire_name ? 
                    `${litter.dam_name} × ${litter.sire_name}` : 
                    (litter.dam_name || litter.sire_name || '')}
                </Box>
                <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                  {litter.whelp_date && (
                    <Chip 
                      label={`Born: ${new Date(litter.whelp_date).toLocaleDateString()}`} 
                      size="small" 
                      variant="outlined"
                      sx={{ mr: 1 }} 
                    />
                  )}
                  {litter.num_puppies && (
                    <Chip 
                      label={`${litter.num_puppies} ${litter.num_puppies === 1 ? 'puppy' : 'puppies'}`} 
                      size="small" 
                      variant="outlined"
                      sx={{ mr: 1 }} 
                    />
                  )}
                  {litter.status && (
                    <Chip 
                      label={litter.status} 
                      size="small" 
                      color="primary"
                    />
                  )}
                </Box>
              </React.Fragment>
            }
          />
        </ListItem>
      ))}
    </List>
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Search Results{query ? `: "${query}"` : ''}
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          {searchResults && Object.values(searchResults).some(arr => arr && arr.length > 0) ? (
            <>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                sx={{ borderBottom: 1, borderColor: 'divider' }}
                variant="scrollable"
                scrollButtons="auto"
              >
                {getTabs()}
              </Tabs>
              {renderResults()}
            </>
          ) : (
            renderResults()
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default SearchResultsPage;