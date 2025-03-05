import React, { createContext, useState, useEffect, useContext } from 'react';
import { useApi } from '../hooks/useApi';

// Create context
export const PageContext = createContext();

// Create a provider component
export const PageProvider = ({ children }) => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { get, post, put, remove } = useApi();

  // Fetch all pages
  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await get('/pages');
      if (response && Array.isArray(response)) {
        console.log('Fetched pages from API:', response.length);
        setPages(response);
      } else {
        console.log('No pages found or invalid response format:', response);
        setPages([]);
      }
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Failed to load pages. Please try again later.');
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by ID
  const fetchPageById = async (id) => {
    try {
      setLoading(true);
      const response = await get(`/pages/${id}`);
      if (response && response.id) {
        return response;
      }
      return null;
    } catch (err) {
      console.error('Error fetching page by ID:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by slug
  const fetchPageBySlug = async (slug) => {
    try {
      setLoading(true);
      const response = await get(`/pages/slug/${slug}`);
      if (response && response.id) {
        return response;
      }
      return null;
    } catch (err) {
      console.error('Error fetching page by slug:', err);
      return null;
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
        // Update local cache
        setPages([...pages, response]);
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
        // Update local cache
        const updatedPages = pages.map(page => 
          page.id === parseInt(id) ? response : page
        );
        setPages(updatedPages);
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
      await remove(`/pages/${id}`);
      
      // Update local cache
      const filteredPages = pages.filter(page => page.id !== parseInt(id));
      setPages(filteredPages);
      return true;
    } catch (err) {
      console.error('Error deleting page:', err);
      throw err;
    } finally {
      setLoading(false);
    }
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
      deletePage
    }}>
      {children}
    </PageContext.Provider>
  );
};

// Custom hook to use the PageContext
export const usePages = () => useContext(PageContext);