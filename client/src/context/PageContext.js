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

  // Mock data storage
  const mockData = [
    {
      id: 1,
      title: "About Us",
      slug: "about-us",
      content: "<p>This is a test page about us.</p>",
      template: "about",
      status: "published",
      meta_description: "Learn more about our breeding program",
      created_at: "2025-03-05T00:00:00",
      updated_at: "2025-03-05T00:00:00"
    },
    {
      id: 2,
      title: "Contact Us",
      slug: "contact",
      content: "<p>Contact information here.</p>",
      template: "contact",
      status: "published",
      meta_description: "Get in touch with us",
      created_at: "2025-03-05T00:00:00",
      updated_at: "2025-03-05T00:00:00"
    }
  ];

  // Fetch all pages
  const fetchPages = async () => {
    setLoading(true);
    try {
      console.log('Using mock pages data');
      setPages([...mockData]);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pages');
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch a page by ID
  const fetchPageById = async (id) => {
    try {
      const page = mockData.find(p => p.id === parseInt(id));
      return page || null;
    } catch (err) {
      console.error('Error fetching page by ID:', err);
      return null;
    }
  };

  // Fetch a page by slug
  const fetchPageBySlug = async (slug) => {
    try {
      const page = mockData.find(p => p.slug === slug);
      return page || null;
    } catch (err) {
      console.error('Error fetching page by slug:', err);
      return null;
    }
  };

  // Create a new page
  const createPage = async (pageData) => {
    try {
      // Mock API response
      const newId = mockData.length > 0 ? Math.max(...mockData.map(p => p.id)) + 1 : 1;
      const newPage = {
        id: newId,
        ...pageData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update both mockData and state
      mockData.push(newPage);
      setPages([...mockData]);
      return newPage;
    } catch (err) {
      console.error('Error creating page:', err);
      throw err;
    }
  };

  // Update a page
  const updatePage = async (id, pageData) => {
    try {
      // Find the page in mockData
      const pageIndex = mockData.findIndex(p => p.id === parseInt(id));
      if (pageIndex === -1) {
        throw new Error('Page not found');
      }
      
      // Update the page in mockData
      const updatedPage = {
        ...mockData[pageIndex],
        ...pageData,
        updated_at: new Date().toISOString()
      };
      
      // Replace the old page with the updated one
      mockData[pageIndex] = updatedPage;
      
      // Update state
      setPages([...mockData]);
      return updatedPage;
    } catch (err) {
      console.error('Error updating page:', err);
      throw err;
    }
  };

  // Delete a page
  const deletePage = async (id) => {
    try {
      // Remove from mockData
      const index = mockData.findIndex(page => page.id === parseInt(id));
      if (index !== -1) {
        mockData.splice(index, 1);
      }
      
      // Update state
      setPages([...mockData]);
      return true;
    } catch (err) {
      console.error('Error deleting page:', err);
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