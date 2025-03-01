import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import ManageLitters from '../ManageLitters';
import { DogProvider } from '../../../context/DogContext';
import { BrowserRouter } from 'react-router-dom';

// Create MSW server instance
const server = setupServer(
  rest.get('/api/litters', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          litter_name: "Arcane - Jinx & Aspen",
          status: "Born",
          whelp_date: "2024-07-19",
          num_puppies: 5,
          puppy_count: 1,
          dam_id: 1,
          sire_id: 2,
          dam_name: "Jinx",
          sire_name: "Aspen",
          dam_photo: "path/to/dam/photo",
          sire_photo: "path/to/sire/photo"
        }
      ])
    );
  })
);

// Start MSW Server before tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ManageLitters Component', () => {
  it('renders correctly with litters', async () => {
    const { container } = render(
      <BrowserRouter>
        <DogProvider>
          <ManageLitters />
        </DogProvider>
      </BrowserRouter>
    );
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Arcane - Jinx & Aspen')).toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });

  it('renders correctly in loading state', async () => {
    // Override the handler to delay response
    server.use(
      rest.get('/api/litters', (req, res, ctx) => {
        return res(ctx.delay(2000), ctx.json([]));
      })
    );

    const { container } = render(
      <BrowserRouter>
        <DogProvider>
          <ManageLitters />
        </DogProvider>
      </BrowserRouter>
    );
    
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with no litters', async () => {
    // Override the handler to return empty array
    server.use(
      rest.get('/api/litters', (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );

    const { container } = render(
      <BrowserRouter>
        <DogProvider>
          <ManageLitters />
        </DogProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText('No Litters Yet')).toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });

  it('renders correctly with error state', async () => {
    // Override the handler to return error
    server.use(
      rest.get('/api/litters', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Failed to load litters' }));
      })
    );

    const { container } = render(
      <BrowserRouter>
        <DogProvider>
          <ManageLitters />
        </DogProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load litters/i)).toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });
}); 