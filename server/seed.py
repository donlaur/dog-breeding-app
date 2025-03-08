from server import create_app, db
from server.models import User, DogBreed, Dog, Litter, Puppy
from datetime import datetime
import random

app = create_app()

with app.app_context():
    db.create_all()  # Ensure tables exist

    # 🛑 Prevent duplicate breeds
    existing_breeds = {breed.slug: breed for breed in DogBreed.query.all()}

    breeds_to_add = [
        {"name": "Pembroke Welsh Corgi", "slug": "pembroke-welsh-corgi", "coat_colors": "Red, Sable, Black & Tan", "breed_type": "Herding", "traits": "Smart, Playful"},
        {"name": "Golden Retriever", "slug": "golden-retriever", "coat_colors": "Golden, Cream", "breed_type": "Sporting", "traits": "Loyal, Friendly"},
    ]

    for breed_data in breeds_to_add:
        if breed_data["slug"] not in existing_breeds:
            db.session.add(DogBreed(**breed_data))

    db.session.commit()
    print("✅ Breeds added successfully (skipping duplicates)")

    # 🛑 Fetch breeds again so we can use them
    breeds = {breed.slug: breed for breed in DogBreed.query.all()}

    # 🛑 Prevent duplicate breeder
    if not User.query.filter_by(email="breeder@example.com").first():
        breeder = User(email="breeder@example.com")
        breeder.set_password("password123")
        breeder.role = "BREEDER"
        db.session.add(breeder)
        db.session.commit()
        print("✅ Breeder added")

    # 🛑 Prevent duplicate dogs
    existing_dogs = {dog.registered_name: dog for dog in Dog.query.all()}

    dogs_to_add = [
        {"registered_name": "Maximus", "call_name": "Max", "breed_id": breeds["pembroke-welsh-corgi"].id, "gender": "Male", "birth_date": datetime(2021, 5, 10), "status": "Active"},
        {"registered_name": "Luna", "call_name": "Luna", "breed_id": breeds["pembroke-welsh-corgi"].id, "gender": "Female", "birth_date": datetime(2022, 2, 15), "status": "Active"},
    ]

    for dog_data in dogs_to_add:
        if dog_data["registered_name"] not in existing_dogs:
            db.session.add(Dog(**dog_data))

    db.session.commit()
    print("✅ Dogs added successfully (skipping duplicates)")

    # 🛑 Prevent duplicate puppies
    if not Puppy.query.first():
        litter = Litter.query.first()  # Get an existing litter or create one
        if not litter:
            litter = Litter(sire_id=1, dam_id=2, birth_date=datetime(2023, 6, 1), status="Current", num_puppies=4)
            db.session.add(litter)
            db.session.commit()

        puppies_to_add = [
            Puppy(name="Charlie", gender=random.choice(["Male", "Female"]), litter_id=litter.id, price=2000, status="Available"),
            Puppy(name="Bella", gender=random.choice(["Male", "Female"]), litter_id=litter.id, price=2000, status="Available"),
        ]

        db.session.add_all(puppies_to_add)
        db.session.commit()
        print("✅ Puppies added successfully")
    else:
        print("✅ Puppies already exist, skipping")
