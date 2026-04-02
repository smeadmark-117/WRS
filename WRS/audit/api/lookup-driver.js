export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone } = req.query;
  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID || 'appKBAOXHqys6IiV5';
  const table = 'Driver Records'; // Master table

  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  if (!token || token === 'redacted') {
    return res.status(500).json({ message: 'Airtable Personal Access Token not configured correctly' });
  }

  try {
    const filter = encodeURIComponent(`{Cell #} = '${phone}'`);
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${filter}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Airtable error:', error);
      return res.status(response.status).json({ message: 'Error fetching from Airtable', details: error });
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      return res.status(200).json({
        found: true,
        driver: {
          id: record.id,
          ...record.fields
        }
      });
    } else {
      return res.status(200).json({ found: false });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
