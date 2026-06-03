const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'venture-halo'
});

const db = admin.firestore();

async function addTestMeetings() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 30, 0, 0);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(11, 0, 0, 0);

  const testMeetings = [
    {
      title: 'Product Strategy Discussion',
      participants: ['Founder A', 'Investor X'],
      time: tomorrow.toISOString(),
      joinUrl: 'https://us05web.zoom.us/j/123456789',
      meetingId: '123456789',
      password: 'abc123',
      createdBy: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      founderId: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      investorId: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'upcoming'
    },
    {
      title: 'Funding Round Review',
      participants: ['Founder A', 'Investor Y'],
      time: nextWeek.toISOString(),
      joinUrl: 'https://us05web.zoom.us/j/987654321',
      meetingId: '987654321',
      password: 'xyz789',
      createdBy: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      founderId: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      investorId: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'upcoming'
    },
    {
      title: 'Market Analysis Meeting',
      participants: ['Founder A', 'Investor Z'],
      time: yesterday.toISOString(),
      joinUrl: 'https://us05web.zoom.us/j/456789123',
      meetingId: '456789123',
      password: 'def456',
      createdBy: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      founderId: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      investorId: '61OggndyxtNoYpbfd6WlrdkiUkl2',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    }
  ];

  try {
    for (const meeting of testMeetings) {
      const docRef = await db.collection('meetings').add(meeting);
      console.log(`Test meeting added with ID: ${docRef.id}`);
    }
    console.log('All test meetings added successfully!');
  } catch (error) {
    console.error('Error adding test meetings:', error);
  } finally {
    process.exit();
  }
}

addTestMeetings();
