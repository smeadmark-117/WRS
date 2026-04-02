import Airtable from 'airtable';
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    name,
    truckName,
    phone,
    trailerLicense,
    trailerState,
    pickupNum,
    destination,
    isRepeatDriver,
    repeatDriverId,
    policyTrash,
    policyBrakes,
    policyTandems,
    policyStay,
    signature // Base64 signature
  } = req.body;

  const token = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID || 'appKBAOXHqys6IiV5';
  
  if (!token || token === 'redacted') {
    return res.status(500).json({ message: 'Airtable Personal Access Token not configured correctly' });
  }

  const base = new Airtable({ apiKey: token }).base(baseId);

  try {
    let signatureUrl = null;

    // 1. Upload signature to Vercel Blob if provided
    if (signature && signature.startsWith('data:image')) {
      const mimeType = signature.split(';')[0].split(':')[1];
      const extension = mimeType.split('/')[1];
      const buffer = Buffer.from(signature.split(',')[1], 'base64');
      const filename = `signatures/${phone}_${Date.now()}.${extension}`;

      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: mimeType
      });
      signatureUrl = blob.url;
    }

    // 2. Prepare Drivers record (Active Check-In)
    const driversFields = {
      'Name': name,
      'Name on Truck': truckName,
      'Cell #': phone,
      'Trailer License': trailerLicense,
      'State': trailerState,
      'Pickup #': pickupNum,
      'Destination': destination,
      'Status': 'Submitted',
      'Remove Trash': !!policyTrash,
      'Brakes': !!policyBrakes,
      'Tandems': !!policyTandems,
      'Stay in dock': !!policyStay
    };

    if (signatureUrl) {
      driversFields['Driver Signature File'] = [{ url: signatureUrl }];
      driversFields['Driver Signature Captured Date'] = new Date().toISOString();
    }

    if (isRepeatDriver && repeatDriverId) {
      driversFields['Repeat Driver Link'] = [repeatDriverId];
    }

    // 3. Create active Check-In in Drivers table
    const createdRecord = await base('Drivers').create(driversFields);

    // 4. Update Driver Records master record if applicable
    if (isRepeatDriver && repeatDriverId) {
      const repeatFields = {
        'Last Check-In Date': new Date().toISOString()
      };
      
      // Update master signature if a new one was captured
      if (signatureUrl) {
        repeatFields['Signature File'] = [{ url: signatureUrl }];
        repeatFields['Signature Captured Date'] = new Date().toISOString();
      }

      await base('Driver Records').update(repeatDriverId, repeatFields);
    }

    return res.status(200).json({ success: true, recordId: createdRecord.id });
  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ message: 'Failed to submit check-in', details: error.message });
  }
}
