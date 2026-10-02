import { inMemoryDB } from '../db/database.js';

console.log('🌱 [LifeLink Seeder] Initializing realistic demo dataset...');
inMemoryDB.resetWithSeedData();

console.log(`
✅ Database Seeding Completed:
   - Hospitals:           ${inMemoryDB.hospitals.size} verified facilities
   - Doctors:             ${inMemoryDB.doctors.size} verified attending physicians
   - Donors:              ${inMemoryDB.donors.size} geolocated donors across Mumbai
   - Initial Requests:    ${inMemoryDB.bloodRequests.size} requests across all states (pending, verified, fulfilled, expired)
   - Organ Pledges:       ${inMemoryDB.organPledges.size} recorded pledge with next-of-kin record
   - Coordinator Logs:    ${inMemoryDB.coordinatorLogs.size} transplant counseling log
   - Default Password:    "LifeLink2026!" for all seeded users
`);
