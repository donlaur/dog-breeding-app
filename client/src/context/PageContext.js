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
  // This needs to be maintained in component state, but we'll initialize it with mock data
  const initialPages = [
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
  
  // Initialize the mockData with initialPages if pages array is empty
  const mockData = pages.length === 0 ? [...initialPages] : [...pages];

  // Fetch all pages - simplified to avoid any async issues
  const fetchPages = () => {
    console.log('Using mock pages data');
    setPages(initialPages);
    setLoading(false);
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

  // Create a new page - simplified
  const createPage = async (pageData) => {
    try {
      // Create a copy of current pages
      const currentPages = [...pages];
      
      // Generate a new ID
      const newId = currentPages.length > 0 ? Math.max(...currentPages.map(p => p.id)) + 1 : 1;
      
      // Create the new page
      const newPage = {
        id: newId,
        ...pageData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add to array and update state
      setPages([...currentPages, newPage]);
      return newPage;
    } catch (err) {
      console.error('Error creating page:', err);
      throw err;
    }
  };

  // Update a page - simplified
  const updatePage = async (id, pageData) => {
    try {
      // Find the page in current pages
      const currentPages = [...pages];
      const pageIndex = currentPages.findIndex(p => p.id === parseInt(id));
      if (pageIndex === -1) {
        throw new Error('Page not found');
      }
      
      // Create updated page
      const updatedPage = {
        ...currentPages[pageIndex],
        ...pageData,
        updated_at: new Date().toISOString()
      };
      
      // Replace the page
      currentPages[pageIndex] = updatedPage;
      
      // Update state with new array
      setPages(currentPages);
      return updatedPage;
    } catch (err) {
      console.error('Error updating page:', err);
      throw err;
    }
  };

  // Delete a page - simplified
  const deletePage = async (id) => {
    try {
      // Filter out the page
      const filteredPages = pages.filter(page => page.id !== parseInt(id));
      
      // Update state
      setPages(filteredPages);
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