import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useApi } from '../hooks/useApi';

// Create context
export const PageContext = createContext();

// Create a provider component
export const PageProvider = ({ children }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { get, post, put, remove } = useApi();
  
  // Cache to prevent repeated API calls
  const pageCache = useRef({
    byId: {}, // Cache by ID
    bySlug: {}, // Cache by slug
    timestamp: Date.now(), // When the cache was last reset
  });

  // Fetch all pages with caching
  const fetchPages = async (forceRefresh = false) => {
    try {
      // Check if we should use cached pages list
      const now = Date.now();
      const CACHE_TTL = 300000; // 5 minutes
      const shouldUseCache = !forceRefresh && 
                             pages.length > 0 && 
                             (now - pageCache.current.timestamp < CACHE_TTL);
      
      if (shouldUseCache) {
        console.log('Using cached pages list');
        return pages;
      }
      
      setLoading(true);
      setError(null);
      console.log('Fetching all pages from API');
      const response = await get('/pages');
      
      if (response && Array.isArray(response)) {
        console.log('Fetched pages from API:', response.length);
        setPages(response);
        
        // Update cache timestamp and cache each page by ID and slug
        pageCache.current.timestamp = now;
        
        // Cache individual pages
        response.forEach(page => {
          if (page.id) {
            pageCache.current.byId[page.id] = {
              data: page,
              timestamp: now
            };
          }
          
          if (page.slug) {
            pageCache.current.bySlug[page.slug] = {
              data: page,
              timestamp: now
            };
          }
        });
        
        return response;
      } else {
        console.log('No pages found or invalid response format:', response);
        setPages([]);
        return [];
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again later.');
      setPages([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by ID, with caching
  const fetchPageById = async (id) => {
    if (!id) {
      console.error('ID parameter is required');
      return null;
    }
    
    // Check cache first (valid for 5 minutes = 300000 ms)
    const now = Date.now();
    const cacheEntry = pageCache.current.byId[id];
    const CACHE_TTL = 300000; // 5 minutes
    
    if (cacheEntry && (now - cacheEntry.timestamp < CACHE_TTL)) {
      console.log(`Using cached page data for ID "${id}"`);
      return cacheEntry.data;
    }
    
    try {
      setLoading(true);
      console.log(`Fetching page with ID: "${id}"`);
      const response = await get(`/pages/${id}`);
      
      if (response && response.id) {
        console.log(`Found page "${response.title}" with ID ${response.id}`);
        
        // Cache the result
        pageCache.current.byId[id] = {
          data: response,
          timestamp: now
        };
        
        // Also cache by slug
        if (response.slug) {
          pageCache.current.bySlug[response.slug] = {
            data: response,
            timestamp: now
          };
        }
        
        return response;
      }
      
      console.log(`No page found with ID "${id}"`);
      
      // Cache negative result to prevent repeated requests
      pageCache.current.byId[id] = {
        data: null,
        timestamp: now
      };
      
      return null;
    } catch (err) {
      console.error('Error fetching page by ID:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by slug, with caching
  const fetchPageBySlug = async (slug) => {
    if (!slug) {
      console.error('Slug parameter is required');
      return null;
    }
    
    // Check cache first (valid for 5 minutes = 300000 ms)
    const now = Date.now();
    const cacheEntry = pageCache.current.bySlug[slug];
    const CACHE_TTL = 300000; // 5 minutes
    
    if (cacheEntry && (now - cacheEntry.timestamp < CACHE_TTL)) {
      console.log(`Using cached page data for slug "${slug}"`);
      return cacheEntry.data;
    }
    
    try {
      setLoading(true);
      console.log(`Fetching page with slug: "${slug}"`);
      const response = await get(`/pages/slug/${slug}`);
      
      if (response && response.id) {
        console.log(`Found page "${response.title}" with ID ${response.id}`);
        
        // Cache the result
        pageCache.current.bySlug[slug] = {
          data: response,
          timestamp: now
        };
        
        // Also cache by ID
        pageCache.current.byId[response.id] = {
          data: response,
          timestamp: now
        };
        
        return response;
      }
      
      console.log(`No page found with slug "${slug}"`);
      
      // Special case for puppies
      if (slug === 'puppies' && pages && pages.length > 0) {
        // Try to find any page with a puppies template
        console.log('Looking for any page with puppies template as fallback');
        const puppiesPage = pages.find(p => p.template === 'puppies' && p.status === 'published');
        if (puppiesPage) {
          console.log(`Found alternative puppies page with slug "${puppiesPage.slug}"`);
          
          // Cache this result too
          pageCache.current.bySlug[slug] = {
            data: puppiesPage,
            timestamp: now
          };
          
          return puppiesPage;
        }
      }
      
      // Cache negative result to prevent repeated requests for non-existent pages
      pageCache.current.bySlug[slug] = {
        data: null,
        timestamp: now
      };
      
      return null;
    } catch (err) {
      console.error('Error fetching page by slug:', err);
      throw err; // Let the calling code handle the error
    } finally {
      setLoading(false);
    }
  };

  // Create a new page
  const createPage = async (pageData) => {
    try {
      setLoading(true);
      const response = await post('/pages', pageData);
      if (response && response.id) {
        // Update pages list in state
        setPages([...pages, response]);
        
        // Update cache
        const now = Date.now();
        
        if (response.id) {
          pageCache.current.byId[response.id] = {
            data: response,
            timestamp: now
          };
        }
        
        if (response.slug) {
          pageCache.current.bySlug[response.slug] = {
            data: response,
            timestamp: now
          };
        }
        
        return response;
      } else {
        throw new Error('Failed to create page');
      }
    } catch (err) {
      console.error('Error creating page:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a page
  const updatePage = async (id, pageData) => {
    try {
      setLoading(true);
      const response = await put(`/pages/${id}`, pageData);
      if (response && response.id) {
        // Update pages list in state
        const updatedPages = pages.map(page => 
          page.id === parseInt(id) ? response : page
        );
        setPages(updatedPages);
        
        // Update cache
        const now = Date.now();
        
        // Get old slug from cache to clear it
        const oldCacheEntry = pageCache.current.byId[id];
        const oldSlug = oldCacheEntry?.data?.slug;
        
        // Cache the updated page by ID
        pageCache.current.byId[response.id] = {
          data: response,
          timestamp: now
        };
        
        // Update slug cache
        if (response.slug) {
          pageCache.current.bySlug[response.slug] = {
            data: response,
            timestamp: now
          };
          
          // If slug changed, remove the old slug entry
          if (oldSlug && oldSlug !== response.slug) {
            delete pageCache.current.bySlug[oldSlug];
          }
        }
        
        return response;
      } else {
        throw new Error('Failed to update page');
      }
    } catch (err) {
      console.error('Error updating page:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a page
  const deletePage = async (id) => {
    try {
      setLoading(true);
      
      // Get the page info before deleting to remove it from slug cache
      const pageToDelete = pageCache.current.byId[id]?.data;
      const slugToDelete = pageToDelete?.slug;
      
      await remove(`/pages/${id}`);
      
      // Update pages list in state
      const filteredPages = pages.filter(page => page.id !== parseInt(id));
      setPages(filteredPages);
      
      // Clean up cache
      if (id) {
        delete pageCache.current.byId[id];
      }
      
      if (slugToDelete) {
        delete pageCache.current.bySlug[slugToDelete];
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting page:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to clear the entire cache (useful for debugging or forced refreshes)
  const clearCache = () => {
    console.log('Clearing page cache');
    pageCache.current = {
      byId: {},
      bySlug: {},
      timestamp: Date.now()
    };
  };

  // Load pages on component mount
  useEffect(() => {
    fetchPages();
  }, []);

  return (
    <PageContext.Provider value={{
      pages,
      loading,
      error,
      fetchPages,
      fetchPageById,
      fetchPageBySlug,
      createPage,
      updatePage,
      deletePage,
      clearCache, // Expose the cache clearing function
      pageCache: pageCache.current // Expose the cache for debugging
    }}>
      {children}
    </PageContext.Provider>
  );
};

// Custom hook to use the PageContext
export const usePages = () => useContext(PageContext);