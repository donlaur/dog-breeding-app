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
    setLoading(true);
    try {
      const response = await get('/api/pages');
      setPages(response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by ID
  const fetchPageById = async (id) => {
    try {
      const response = await get(`/api/pages/${id}`);
      return response;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Fetch a page by slug
  const fetchPageBySlug = async (slug) => {
    try {
      const response = await get(`/api/pages/slug/${slug}`);
      return response;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Create a new page
  const createPage = async (pageData) => {
    try {
      const response = await post('/api/pages', pageData);
      setPages([...pages, response]);
      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Update a page
  const updatePage = async (id, pageData) => {
    try {
      const response = await put(`/api/pages/${id}`, pageData);
      setPages(pages.map(page => page.id === id ? response : page));
      return response;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Delete a page
  const deletePage = async (id) => {
    try {
      await remove(`/api/pages/${id}`);
      setPages(pages.filter(page => page.id !== id));
      return true;
    } catch (err) {
      console.error(err);
      throw err;
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