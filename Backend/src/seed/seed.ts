import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Competition from '../models/Competition';
import User from '../models/User';
import Registration from '../models/Registration';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/feedants';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Wipe existing seed data
  await Competition.deleteMany({});
  await User.deleteMany({});
  await Registration.deleteMany({});
  console.log('Cleared existing data');

  // ─── Create demo users ───────────────────────────────────
  const demoUser = await User.create({
    name: 'Aryan Sharma',
    email: 'aryan@feedants.com',
    phone: '+91 9876543210',
    passwordHash: 'Password123!',
  });

  const registeredUser = await User.create({
    name: 'Priya Patel',
    email: 'priya@feedants.com',
    phone: '+91 9876543211',
    passwordHash: 'Password123!',
  });

  console.log('Users created');

  // ─── Create the Feedants Classical Dance competition ──────
  // Use dates relative to now so the countdown is always live
  const now = new Date();
  const regClose = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000 + 28 * 60 * 1000); // ~1d 6h 28m from now
  const submissionStart = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
  const submissionEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000); // 20 days from now
  const resultDate = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000); // 25 days from now

  const competition = await Competition.create({
    title: 'Feedants Classical Dance',
    category: 'Dance',
    type: 'Multi-Win',
    hasCertificate: true,
    prizePool: 1500,
    entryFee: 99,
    totalSpots: 20,
    bookedSpots: 1,
    status: 'active',
    judge: {
      name: 'Manju Dubey',
      title: 'Professional Kathak Dancer',
      experience: '12+ Years of Experience',
      photoUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      introVideoUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    },
    dates: {
      registrationClose: regClose,
      submissionStart,
      submissionEnd,
      resultDate,
    },
    description:
      'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance. Classical dance forms are a beautiful amalgamation of rhythm, grace, and storytelling. Join us to celebrate this rich cultural heritage.',
    about:
      'Feedants Classical Dance Competition is an initiative to promote classical dance forms among youth. We welcome performers of all skill levels to participate and grow.',
    judgingParameters:
      'Participants will be judged on:\n1. Technical Proficiency (30%)\n2. Expressiveness & Abhinaya (25%)\n3. Rhythm & Timing (25%)\n4. Costume & Presentation (10%)\n5. Originality (10%)',
    rulesEligibility:
      'Rules:\n• Open to all age groups\n• Solo performances only\n• Video duration: 2–5 minutes\n• Classical dance forms accepted: Bharatanatyam, Kathak, Odissi, Kuchipudi, Manipuri, Mohiniyattam\n• No background music remix allowed — use original compositions only\n• One submission per participant\n\nEligibility:\n• Must register before the registration deadline\n• Only paid registrations are eligible for judging',
    rewards: [
      { position: 1, label: '1st Winner', amount: 550 },
      { position: 2, label: '2nd Winner', amount: 300 },
      { position: 3, label: '3rd Winner', amount: 240 },
      { position: 4, label: '4th Winner', amount: 200 },
      { position: 5, label: '5th Winner', amount: 130 },
      { position: 6, label: '6th Winner', amount: 80 },
    ],
    disclaimer:
      'Only contributions from paid participants will be considered for judging.',
    referralBaseUrl: 'https://feedants.com/r/referral',
    previousWinners: [
      {
        name: 'Riya Shah',
        rank: '1st Winner',
        photoUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
        videoUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      },
      {
        name: 'Aarav Mehta',
        rank: '1st Winner',
        photoUrl: 'https://randomuser.me/api/portraits/men/22.jpg',
        videoUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      },
      {
        name: 'Neha Verma',
        rank: '2nd Winner',
        photoUrl: 'https://randomuser.me/api/portraits/women/65.jpg',
        videoUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      },
      {
        name: 'Ishita Choudhary',
        rank: '3rd Winner',
        photoUrl: 'https://randomuser.me/api/portraits/women/17.jpg',
        videoUrl: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      },
    ],
  });

  // Register priya as already registered
  await Registration.create({
    competitionId: competition._id,
    userId: registeredUser._id,
    status: 'registered',
    paymentId: 'mock_seed_payment',
    registeredAt: new Date(),
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('─── Demo Credentials ───────────────────────────────');
  console.log('NOT Registered:');
  console.log('  Email   : aryan@feedants.com');
  console.log('  Password: Password123!');
  console.log('');
  console.log('Already Registered:');
  console.log('  Email   : priya@feedants.com');
  console.log('  Password: Password123!');
  console.log('');
  console.log(`Competition ID: ${competition._id}`);
  console.log('────────────────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
