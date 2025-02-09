# Dog Breeding App  

## Overview  

The **Dog Breeding App** is a **modern, mobile-first platform** designed to help dog breeders manage their breeding programs, track dogs and litters, and streamline customer interactions. The first release is focused on **Laur’s Classic Corgis**, with the potential to scale for multiple breeders in the future.  

## Features  

### **Breeder Dashboard**  
- Manage breeder program details (location, breed, descriptions, images).  
- Track all dogs under the breeder program.  
- Add, edit, and update litters with puppy details.  
- Store and review customer contact inquiries.  

### **Dog Management**  
- Add and manage individual dogs, including sires, dams, and puppies.  
- Track health testing ratings, status (Active, Retired, Upcoming), and pricing.  
- Upload and manage dog images.  
- Link dogs to litters for better parental lineage tracking.  

### **Litter Management**  
- Create new litters with linked sire and dam.  
- Track birth dates, puppy counts, and availability.  
- Upload litter photos and manage pricing.  

### **Contact Messaging System**  
- Store and retrieve contact form submissions.  
- Allow breeders to track inquiries from potential buyers.  

## Tech Stack  

- **Backend**: Python (Flask)  
- **Frontend**: React (with TailwindCSS for styling)  
- **Database**: PostgreSQL (relational structure with normalized tables)  
- **Authentication**: Google OAuth (for breeder access)  
- **File Storage**: Local file system (planned move to Amazon S3)  

## Installation  

### **1. Clone the Repository**  
```sh
git clone https://github.com/donlaur/dog-breeding-app.git
cd dog-breeding-app

2. Set Up a Virtual Environment
sh
Copy
Edit
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
3. Install Dependencies
sh
Copy
Edit
pip install -r requirements.txt
4. Set Up the Database
Modify config.py with your database credentials, then run:

sh
Copy
Edit
flask db upgrade  # Applies database migrations
5. Run the Development Server
sh
Copy
Edit
flask run
The server will start at http://127.0.0.1:5000/.

Future Enhancements
AI-driven puppy recommendation system.
Multi-breeder support with authentication.
Automated notifications for upcoming litters.
Integration with payment gateways for deposits.
Contributing
Contributions are welcome! Please submit a pull request or open an issue for discussion.

License
This project is licensed under the MIT License.