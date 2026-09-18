import getDatabase from './_lib/mongodb.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-user-id'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const db = await getDatabase();
    const collection = db.collection('expenses');

    // Extract unique user ID
    const userId = req.headers['x-user-id'] || req.query.userId || (req.body && req.body.userId) || 'default_user';

    if (req.method === 'GET') {
      const expenses = await collection.find({ userId }).sort({ date: -1 }).toArray();
      const formatted = expenses.map(e => ({
        id: e.id || e._id.toString(),
        amount: Number(e.amount),
        description: e.description || '',
        date: e.date || new Date().toISOString()
      }));
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const { expenses, expense } = req.body || {};

      // If whole list is sent for sync for this user
      if (Array.isArray(expenses)) {
        await collection.deleteMany({ userId });
        if (expenses.length > 0) {
          const docs = expenses.map(e => ({
            id: e.id,
            amount: Number(e.amount),
            description: e.description,
            date: e.date,
            userId,
            updatedAt: new Date()
          }));
          await collection.insertMany(docs);
        }
        return res.status(200).json({ success: true, count: expenses.length });
      }

      // If single expense is added
      if (expense) {
        const newDoc = {
          id: expense.id || Date.now().toString(),
          amount: Number(expense.amount),
          description: expense.description || 'No description',
          date: expense.date || new Date().toISOString(),
          userId,
          createdAt: new Date()
        };
        await collection.insertOne(newDoc);
        return res.status(201).json(newDoc);
      }

      return res.status(400).json({ error: 'Missing expenses or expense in request body' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { id, amount, description, date } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Missing id in request body' });
      }
      const updateData = {};
      if (amount !== undefined) updateData.amount = Number(amount);
      if (description !== undefined) updateData.description = description;
      if (date !== undefined) updateData.date = date;
      updateData.updatedAt = new Date();

      await collection.updateOne({ id, userId }, { $set: updateData });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (id) {
        await collection.deleteOne({ id, userId });
        return res.status(200).json({ success: true });
      } else {
        await collection.deleteMany({ userId });
        return res.status(200).json({ success: true, cleared: true });
      }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('API /api/expenses error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
