import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { AuthContext } from '../../../context/AuthContext';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  useLocation: jest.fn(),
  useNavigate: () => jest.fn()
}));

// Mock Auth context
const mockAuthContext = {
  isAuthenticated: true,
  user: { id: 1, name: 'Test User' },
  logout: jest.fn()
};

describe('DashboardLayout Navigation', () => {
  // Helper function to setup the component with a specific path
  const setupWithPath = (pathname) => {
    useLocation.mockReturnValue({ pathname });
    
    render(
      <MemoryRouter initialEntries={[pathname]}>
        <AuthContext.Provider value={mockAuthContext}>
          <DashboardLayout />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('health dashboard menu item is active when on health dashboard page', () => {
    setupWithPath('/dashboard/health');
    
    // The actual test might need adjustments based on how your menu items are structured
    const healthDashboardLink = screen.getByText('Health Dashboard');
    const healthDashboardMenuItem = healthDashboardLink.closest('li') || healthDashboardLink.closest('[role="menuitem"]');
    
    // Check that health dashboard link has the active class/style
    expect(healthDashboardMenuItem).toHaveClass('Mui-selected');
  });

  test('health dashboard menu item is not active when on medications page', () => {
    setupWithPath('/dashboard/health/medications');
    
    // Find the Health Dashboard menu item
    const healthDashboardLink = screen.getByText('Health Dashboard');
    const healthDashboardMenuItem = healthDashboardLink.closest('li') || healthDashboardLink.closest('[role="menuitem"]');
    
    // Find the Medications menu item
    const medicationsLink = screen.getByText('Medications');
    const medicationsMenuItem = medicationsLink.closest('li') || medicationsLink.closest('[role="menuitem"]');
    
    // Check that only the medications link is highlighted
    expect(medicationsMenuItem).toHaveClass('Mui-selected');
    expect(healthDashboardMenuItem).not.toHaveClass('Mui-selected');
  });

  test('health dashboard menu item is not active when on health records page', () => {
    setupWithPath('/dashboard/health/records');
    
    // Find the Health Dashboard menu item
    const healthDashboardLink = screen.getByText('Health Dashboard');
    const healthDashboardMenuItem = healthDashboardLink.closest('li') || healthDashboardLink.closest('[role="menuitem"]');
    
    // Find the Health Records menu item
    const healthRecordsLink = screen.getByText('Health Records');
    const healthRecordsMenuItem = healthRecordsLink.closest('li') || healthRecordsLink.closest('[role="menuitem"]');
    
    // Check that only the health records link is highlighted
    expect(healthRecordsMenuItem).toHaveClass('Mui-selected');
    expect(healthDashboardMenuItem).not.toHaveClass('Mui-selected');
  });

  test('menu section expands when child route is active', () => {
    setupWithPath('/dashboard/health/medications');
    
    // Health Management section should be expanded
    const healthManagementSection = screen.getByText('Health Management');
    const expandIcon = healthManagementSection.closest('div').querySelector('[data-testid="expand-icon"]');
    
    // Verify the section is expanded
    expect(expandIcon).toHaveAttribute('data-expanded', 'true');
  });
});
