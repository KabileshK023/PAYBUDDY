import getDatabase from './_lib/mongodb.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const db = await getDatabase();
    const collection = db.collection('friends');

    if (req.method === 'GET') {
      const friends = await collection.find({}).toArray();
      // Format _id to id if needed
      const formatted = friends.map(f => ({
        id: f.id || f._id.toString(),
        name: f.name,
        avatar: f.avatar || null,
        transactions: f.transactions || []
      }));
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const { friends, friend } = req.body || {};

      // If whole list is sent for sync
      if (Array.isArray(friends)) {
        await collection.deleteMany({});
        if (friends.length > 0) {
          const docs = friends.map(f => ({
            id: f.id,
            name: f.name,
            avatar: f.avatar || null,
            transactions: f.transactions || [],
            updatedAt: new Date()
          }));
          await collection.insertMany(docs);
        }
        return res.status(200).json({ success: true, count: friends.length });
      }

      // If single friend is created
      if (friend) {
        const newDoc = {
          id: friend.id || Date.now().toString(),
          name: friend.name,
          avatar: friend.avatar || null,
          transactions: friend.transactions || [],
          createdAt: new Date()
        };
        await collection.insertOne(newDoc);
        return res.status(201).json(newDoc);
      }

      return res.status(400).json({ error: 'Missing friends or friend in request body' });
    }

    if (req.method === 'PUT') {
      const { id, updates, friend } = req.body || {};
      const targetId = id || (friend && friend.id);
      const data = updates || friend;

      if (!targetId || !data) {
        return res.status(400).json({ error: 'Missing id or update data' });
      }

      await collection.updateOne(
        { id: targetId },
        { $set: { ...data, updatedAt: new Date() } },
        { upsert: true }
      );
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (id) {
        await collection.deleteOne({ id });
        return res.status(200).json({ success: true });
      } else {
        await collection.deleteMany({});
        return res.status(200).json({ success: true, cleared: true });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API /api/friends error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
