-- Create pages table if it doesn't exist
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    template TEXT NOT NULL DEFAULT 'default',
    status TEXT NOT NULL DEFAULT 'published',
    meta_description TEXT,
    show_in_menu BOOLEAN DEFAULT FALSE,
    menu_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create row level security policies
-- Enable row level security
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users with admin or breeder role
CREATE POLICY "Breeders and Admins can view all pages" 
ON pages FOR SELECT 
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('ADMIN', 'BREEDER')
);

CREATE POLICY "Breeders and Admins can insert pages" 
ON pages FOR INSERT 
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' IN ('ADMIN', 'BREEDER')
);

CREATE POLICY "Breeders and Admins can update pages" 
ON pages FOR UPDATE 
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('ADMIN', 'BREEDER')
);

CREATE POLICY "Breeders and Admins can delete pages" 
ON pages FOR DELETE 
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('ADMIN', 'BREEDER')
);

-- Policy for anonymous users - can only read published pages
CREATE POLICY "Anyone can view published pages" 
ON pages FOR SELECT 
TO anon
USING (
  status = 'published'
);

-- Insert sample pages
INSERT INTO pages (title, slug, content, template, status, meta_description, show_in_menu, menu_order)
VALUES 
(
    'About Our Breeding Program',
    'about-us',
    '<h2>Welcome to Our Dog Breeding Program</h2><p>We are dedicated to breeding healthy, well-tempered dogs that make wonderful family companions.</p><h3>Our Breeding Philosophy</h3><p>Health testing, careful selection, and proper socialization are the cornerstones of our breeding program.</p><h3>Meet Our Dogs</h3><p>Here are some of our male dogs:</p>[DisplayDogs gender=Male]<p>And here are our females:</p>[DisplayDogs gender=Female]',
    'about',
    'published',
    'Learn more about our dedicated dog breeding program, our philosophy, and meet our dogs.',
    TRUE,
    1
),
(
    'Contact Us',
    'contact',
    '<p>We''d love to hear from you\! Whether you have questions about available puppies, our breeding program, or anything else, please get in touch using the form below.</p>[ContactForm subject="Website Inquiry"]<p>Or you can reach us directly:</p><p>Phone: (555) 123-4567<br>Email: info@dogbreedingapp.com</p>',
    'contact',
    'published',
    'Contact our breeding program with questions about puppies, dogs, or our services.',
    TRUE,
    3
),
(
    'Available Puppies',
    'available-puppies',
    '<h2>Currently Available Puppies</h2><p>Our puppies are raised with love and care in our home environment. They are well-socialized with people, children, and other animals from an early age.</p><p>All puppies come with:</p><ul><li>First vaccinations and dewormings</li><li>Health guarantee</li><li>Microchip</li><li>Puppy starter kit</li></ul>[DisplayPuppies status=Available]<h3>Upcoming Litters</h3><p>We have several litters planned in the coming months:</p>[DisplayLitters status=Planned]',
    'puppies',
    'published',
    'View our currently available puppies and upcoming litters. All puppies come with health guarantees and support.',
    TRUE,
    2
),
(
    'Our Dogs',
    'our-dogs',
    '<h2>Meet the Stars of Our Breeding Program</h2><p>Our breeding dogs are selected for health, temperament, and conformity to breed standards. Each has undergone health testing appropriate for their breed.</p><h3>Our Boys</h3>[DisplayDogs gender=Male]<h3>Our Girls</h3>[DisplayDogs gender=Female]<p>Interested in learning more about any of our dogs? Feel free to <a href="/page/contact">contact us</a> for more information.</p>',
    'dogs',
    'published',
    'Meet the dogs in our breeding program. All our dogs are health tested and selected for temperament and conformation.',
    TRUE,
    4
),
(
    'Frequently Asked Questions',
    'faq',
    '<h2>Common Questions About Our Puppies and Program</h2><div class="faq-item"><h3>Q: How do I reserve a puppy?</h3><p>A: We require a non-refundable deposit to reserve a puppy from a current or upcoming litter. Please <a href="/page/contact">contact us</a> for current availability.</p></div><div class="faq-item"><h3>Q: What health testing do you do?</h3><p>A: All our breeding dogs undergo testing for breed-specific genetic conditions, hip and elbow evaluations, and regular veterinary exams.</p></div><div class="faq-item"><h3>Q: How are puppies raised?</h3><p>A: Our puppies are raised in our home with early neurological stimulation, socialization with various people and animals, and exposure to different environments and experiences.</p></div><div class="faq-item"><h3>Q: Do you ship puppies?</h3><p>A: We prefer in-person pickup but can arrange transportation in certain circumstances. We do not ship puppies as cargo.</p></div><div class="faq-item"><h3>Q: What comes with a puppy?</h3><p>A: Each puppy comes with a health guarantee, vaccination records, microchip, puppy food sample, and a comfort item with the mother''s scent.</p></div>',
    'faq',
    'published',
    'Find answers to common questions about our puppies, reservation process, health testing, and more.',
    TRUE,
    5
),
(
    'Our Breeding Practices',
    'breeding-practices',
    '<h2>Responsible Breeding Practices</h2><p>We believe in ethical and responsible breeding practices that prioritize the health and well-being of our dogs and puppies.</p><h3>Health Testing</h3><p>All our breeding dogs undergo comprehensive health testing including:</p><ul><li>Hip and elbow evaluations</li><li>Eye examinations</li><li>Genetic testing for breed-specific conditions</li><li>Regular veterinary check-ups</li></ul><h3>Socialization</h3><p>Proper socialization is crucial for developing well-adjusted puppies. Our socialization protocol includes:</p><ul><li>Early neurological stimulation</li><li>Exposure to various surfaces, sounds, and environments</li><li>Introduction to different people, children, and animals</li><li>Crate training and basic commands</li></ul><p>Learn more about our dogs here:</p>[DisplayDogs]',
    'default',
    'published',
    'Learn about our responsible breeding practices including health testing, socialization, and puppy raising protocols.',
    FALSE,
    0
);
