-- Updated seed data to include user_id references for RLS compatibility
-- Note: This seed data will only work after a user has signed up and confirmed their email
-- The user_id should be replaced with actual user UUID from auth.users table

-- Insert sample animals (replace 'your-user-id-here' with actual user UUID)
INSERT INTO animals (ear_tag, name, breed, birth_date, sex, status, user_id) VALUES
('001', 'Bessie', 'Holstein', '2020-03-15', 'Female', 'Active', auth.uid()),
('002', 'Daisy', 'Jersey', '2019-05-22', 'Female', 'Active', auth.uid()),
('003', 'Thunder', 'Angus', '2018-08-10', 'Male', 'Active', auth.uid()),
('004', 'Rosie', 'Holstein', '2021-01-30', 'Female', 'Active', auth.uid()),
('005', 'Bella', 'Hereford', '2020-11-12', 'Female', 'Active', auth.uid()),
('006', 'Duke', 'Charolais', '2019-04-18', 'Male', 'Active', auth.uid()),
('007', 'Luna', 'Jersey', '2021-07-25', 'Female', 'Active', auth.uid()),
('008', 'Max', 'Angus', '2020-09-03', 'Male', 'Active', auth.uid());

-- Insert sample calvings
INSERT INTO calvings (animal_id, calving_date, calf_ear_tag, calf_sex, birth_weight, assistance_required, user_id) VALUES
(1, '2023-03-20', '101', 'Female', 35.5, FALSE, auth.uid()),
(2, '2023-05-15', '102', 'Male', 38.2, FALSE, auth.uid()),
(4, '2023-01-10', '103', 'Female', 33.8, TRUE, auth.uid()),
(5, '2023-08-22', '104', 'Male', 40.1, FALSE, auth.uid()),
(7, '2023-06-30', '105', 'Female', 31.9, FALSE, auth.uid());

-- Insert sample health records
INSERT INTO health_records (animal_id, record_date, record_type, description, treatment, cost, user_id) VALUES
(1, '2023-04-01', 'Vaccination', 'Annual vaccination', 'BVDV, IBR, PI3, BRSV', 25.00, auth.uid()),
(2, '2023-03-15', 'Health Check', 'Routine health examination', 'General checkup', 50.00, auth.uid()),
(3, '2023-02-20', 'Treatment', 'Hoof trimming', 'Preventive hoof care', 35.00, auth.uid()),
(4, '2023-05-10', 'Vaccination', 'Pregnancy vaccination', 'Scour prevention', 30.00, auth.uid());

-- Insert sample breeding records
INSERT INTO breeding_records (animal_id, breeding_date, sire_ear_tag, breeding_method, expected_calving_date, confirmed_pregnant, user_id) VALUES
(1, '2023-06-15', '003', 'Natural', '2024-03-22', TRUE, auth.uid()),
(2, '2023-07-20', '006', 'AI', '2024-04-26', TRUE, auth.uid()),
(4, '2023-08-10', '003', 'Natural', '2024-05-17', FALSE, auth.uid()),
(7, '2023-09-05', '008', 'Natural', '2024-06-12', TRUE, auth.uid());
