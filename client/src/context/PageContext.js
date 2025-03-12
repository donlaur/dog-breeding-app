import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../utils/apiUtils';
import { API_URL, debugLog, debugError } from '../config';

// Create context
export const PageContext = createContext();

// Create a provider component
export const PageProvider = ({ children }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cache to prevent repeated API calls
  const pageCache = useRef({
    byId: {}, // Cache by ID
    bySlug: {}, // Cache by slug
    fallbacks: {}, // Cache for fallback pages
    timestamp: Date.now(), // When the cache was last reset
  });

  // Fetch all pages with caching
  const fetchPages = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      const cacheAge = now - pageCache.current.timestamp;
      const CACHE_DURATION = 300000; // 5 minutes
      const shouldUseCache = !forceRefresh && 
                            pageCache.current.timestamp > 0 && 
                            cacheAge < CACHE_DURATION && 
                            pages.length > 0;
      
      if (shouldUseCache) {
        debugLog('Using cached pages list');
        return pages;
      }
      
      setLoading(true);
      setError(null);
      debugLog('Fetching all pages from API');
      
      try {
        const response = await apiGet('pages');
        
        // If the API returns an error (like 404), use an empty array
        if (!response.ok) {
          debugLog('Pages API not available, using empty array');
          setPages([]);
          setLoading(false);
          return [];
        }
        
        const fetchedPages = response.data || response;
        
        if (fetchedPages && Array.isArray(fetchedPages)) {
          debugLog('Fetched pages from API:', fetchedPages.length);
          setPages(fetchedPages);
          
          // Update cache timestamp and cache each page by ID and slug
          pageCache.current.timestamp = now;
          
          // Cache individual pages
          fetchedPages.forEach(page => {
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
          
          return fetchedPages;
        } else {
          debugLog('No pages found or invalid response format:', fetchedPages);
          setPages([]);
          return [];
        }
      } catch (error) {
        debugError('Error fetching pages:', error);
        // Provide fallback data when the API endpoint is not available
        const fallbackPages = [];
        setPages(fallbackPages);
        return fallbackPages;
      }
    } catch (error) {
      debugError('Error in fetchPages:', error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by ID, with caching
  const fetchPageById = async (id) => {
    if (!id) {
      debugError('ID parameter is required');
      return null;
    }
    
    // Check cache first (valid for 5 minutes = 300000 ms)
    const now = Date.now();
    const cacheEntry = pageCache.current.byId[id];
    const CACHE_TTL = 300000; // 5 minutes
    
    if (cacheEntry && (now - cacheEntry.timestamp < CACHE_TTL)) {
      debugLog(`Using cached page data for ID "${id}"`);
      return cacheEntry.data;
    }
    
    try {
      setLoading(true);
      debugLog(`Fetching page with ID: "${id}"`);
      const response = await apiGet(`pages/${id}`);
      const fetchedPage = response.data || response;
      
      if (fetchedPage && fetchedPage.id) {
        debugLog(`Found page "${fetchedPage.title}" with ID ${fetchedPage.id}`);
        
        // Cache the result
        pageCache.current.byId[id] = {
          data: fetchedPage,
          timestamp: now
        };
        
        // Also cache by slug
        if (fetchedPage.slug) {
          pageCache.current.bySlug[fetchedPage.slug] = {
            data: fetchedPage,
            timestamp: now
          };
        }
        
        return fetchedPage;
      }
      
      debugLog(`No page found with ID "${id}"`);
      
      // Cache negative result to prevent repeated requests
      pageCache.current.byId[id] = {
        data: null,
        timestamp: now
      };
      
      return null;
    } catch (err) {
      debugError('Error fetching page by ID:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by slug, with caching
  const fetchPageBySlug = async (slug) => {
    if (!slug) {
      debugError('Slug parameter is required');
      return null;
    }
    
    // Check cache first (valid for 5 minutes = 300000 ms)
    const now = Date.now();
    const cacheEntry = pageCache.current.bySlug[slug];
    const CACHE_TTL = 300000; // 5 minutes
    
    if (cacheEntry && (now - cacheEntry.timestamp < CACHE_TTL)) {
      debugLog(`Using cached page data for slug "${slug}"`);
      return cacheEntry.data;
    }
    
    try {
      setLoading(true);
      debugLog(`Fetching page with slug: "${slug}"`);
      let response;
      
      try {
        response = await apiGet(`pages/slug/${slug}`);
      } catch (fetchError) {
        debugError(`API error fetching page with slug "${slug}":`, fetchError);
        debugLog('Continuing with null response to handle fallback cases');
        response = null;
      }
      
      if (response && response.id) {
        debugLog(`Found page "${response.title}" with ID ${response.id}`);
        
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
      
      debugLog(`No page found with slug "${slug}"`);
      
      // Map of standard slugs to template types and titles
      const templateMap = {
        'dogs': { template: 'dogs', title: 'Our Dogs' },
        'our-dogs': { template: 'dogs', title: 'Our Dogs' },
        'our_dogs': { template: 'dogs', title: 'Our Dogs' },
        'puppies': { template: 'puppies', title: 'Available Puppies' },
        'available-puppies': { template: 'puppies', title: 'Available Puppies' },
        'available_puppies': { template: 'puppies', title: 'Available Puppies' },
        'about': { template: 'about', title: 'About Us' },
        'about-us': { template: 'about', title: 'About Us' },
        'about_us': { template: 'about', title: 'About Us' },
        'contact': { template: 'contact', title: 'Contact Us' },
        'contact-us': { template: 'contact', title: 'Contact Us' },
        'contact_us': { template: 'contact', title: 'Contact Us' },
        'faq': { template: 'faq', title: 'Frequently Asked Questions' },
        'faqs': { template: 'faq', title: 'Frequently Asked Questions' }
      };
      
      // If this is a standard template we support with fallback
      if (templateMap[slug]) {
        const templateInfo = templateMap[slug];
        
        // First try to find an existing page with this template
        if (pages && pages.length > 0) {
          debugLog(`Looking for any page with ${templateInfo.template} template as fallback`);
          const existingPage = pages.find(p => p.template === templateInfo.template && p.status === 'published');
          
          if (existingPage) {
            debugLog(`Found alternative ${templateInfo.template} page with slug "${existingPage.slug}"`);
            
            // Cache this result
            pageCache.current.bySlug[slug] = {
              data: existingPage,
              timestamp: now
            };
            
            return existingPage;
          }
        }
        
        // Create and cache a fallback page
        debugLog(`Creating fallback page for ${templateInfo.template} template`);
        return cacheFallbackPage(slug, templateInfo.template, templateInfo.title);
      }
      
      // Check for keywords in the slug to support additional patterns
      if (slug.includes('dog') && !slug.includes('puppy')) {
        return cacheFallbackPage(slug, 'dogs', 'Our Dogs');
      } 
      else if (slug.includes('puppy') || slug.includes('puppies')) {
        return cacheFallbackPage(slug, 'puppies', 'Available Puppies');
      }
      else if (slug.includes('about')) {
        return cacheFallbackPage(slug, 'about', 'About Us');
      }
      else if (slug.includes('contact')) {
        return cacheFallbackPage(slug, 'contact', 'Contact Us');
      }
      else if (slug.includes('faq') || slug.includes('question')) {
        return cacheFallbackPage(slug, 'faq', 'Frequently Asked Questions');
      }
      
      // Cache negative result to prevent repeated requests for non-existent pages
      pageCache.current.bySlug[slug] = {
        data: null,
        timestamp: now
      };
      
      return null;
    } catch (err) {
      debugError('Error in fetchPageBySlug function:', err);
      // Return null instead of throwing, to let PublicPage handle fallback
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new page
  const createPage = async (pageData) => {
    try {
      setLoading(true);
      const response = await apiPost('pages', pageData);
      const createdPage = response.data || response;
      
      if (createdPage && createdPage.id) {
        // Update pages list in state
        setPages([...pages, createdPage]);
        
        // Update cache
        const now = Date.now();
        
        if (createdPage.id) {
          pageCache.current.byId[createdPage.id] = {
            data: createdPage,
            timestamp: now
          };
        }
        
        if (createdPage.slug) {
          pageCache.current.bySlug[createdPage.slug] = {
            data: createdPage,
            timestamp: now
          };
        }
        
        return createdPage;
      } else {
        throw new Error('Failed to create page');
      }
    } catch (err) {
      debugError('Error creating page:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update a page
  const updatePage = async (id, pageData) => {
    try {
      setLoading(true);
      const response = await apiPut(`pages/${id}`, pageData);
      const updatedPage = response.data || response;
      
      if (updatedPage && updatedPage.id) {
        // Update pages list in state
        const updatedPages = pages.map(page => 
          page.id === parseInt(id) ? updatedPage : page
        );
        setPages(updatedPages);
        
        // Update cache
        const now = Date.now();
        
        // Get old slug from cache to clear it
        const oldCacheEntry = pageCache.current.byId[id];
        const oldSlug = oldCacheEntry?.data?.slug;
        
        // Cache the updated page by ID
        pageCache.current.byId[updatedPage.id] = {
          data: updatedPage,
          timestamp: now
        };
        
        // Update slug cache
        if (updatedPage.slug) {
          pageCache.current.bySlug[updatedPage.slug] = {
            data: updatedPage,
            timestamp: now
          };
          
          // If slug changed, remove the old slug entry
          if (oldSlug && oldSlug !== updatedPage.slug) {
            delete pageCache.current.bySlug[oldSlug];
          }
        }
        
        return updatedPage;
      } else {
        throw new Error('Failed to update page');
      }
    } catch (err) {
      debugError('Error updating page:', err);
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
      
      await apiDelete(`pages/${id}`);
      
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
      debugError('Error deleting page:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Store a fallback page in the cache
  const cacheFallbackPage = (slug, templateType, title) => {
    const now = Date.now();
    const fallbackPage = {
      id: `fallback-${templateType}-${now}`,
      title: title || `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Page`,
      slug: slug,
      content: '',
      template: templateType,
      status: 'published',
      isFallback: true
    };
    
    // Store in the fallbacks cache
    pageCache.current.fallbacks[slug] = {
      data: fallbackPage,
      timestamp: now
    };
    
    // Also store in the slug cache
    pageCache.current.bySlug[slug] = {
      data: fallbackPage,
      timestamp: now
    };
    
    debugLog(`Created and cached fallback page for slug "${slug}" with template "${templateType}"`);
    return fallbackPage;
  };
  
  // Function to clear the entire cache (useful for debugging or forced refreshes)
  const clearCache = () => {
    debugLog('Clearing page cache');
    pageCache.current = {
      byId: {},
      bySlug: {},
      fallbacks: {},
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
      cacheFallbackPage, // Expose fallback page creation
      pageCache: pageCache.current // Expose the cache for debugging
    }}>
      {children}
    </PageContext.Provider>
  );
};

// Custom hook to use the PageContext
export const usePages = () => useContext(PageContext);