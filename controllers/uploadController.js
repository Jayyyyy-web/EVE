const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MODELS_DIR = path.join(__dirname, '..', 'uploads', 'models');
const MAX_BYTES = 60 * 1024 * 1024; // 60MB — generous for a car model, keeps disk usage sane

fs.mkdirSync(MODELS_DIR, { recursive: true });

// @route POST /api/uploads/model  (multipart file upload, handled by multer middleware)
const uploadModelFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file received' });
  }
  res.status(201).json({ url: `/uploads/models/${req.file.filename}` });
};

// Transforms a normal Google Drive "share" link into a direct-download link.
// Share links look like: https://drive.google.com/file/d/<ID>/view?usp=sharing
function resolveDownloadUrl(rawUrl) {
  const driveMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  const driveIdMatch = rawUrl.match(/[?&]id=([^&]+)/);
  if (rawUrl.includes('drive.google.com') && driveIdMatch) {
    return `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}`;
  }
  return rawUrl;
}

// Google shows an HTML "can't scan this file for viruses" interstitial for
// larger files, with a confirm token embedded in the page. This extracts it
// and retries with that token appended, which is the standard workaround.
function extractConfirmToken(html) {
  const match = html.match(/confirm=([0-9A-Za-z_-]+)/);
  return match ? match[1] : null;
}

// @route POST /api/uploads/model-from-url  (body: { url })
const importModelFromUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ message: 'A URL is required' });
  }

  try {
    let targetUrl = resolveDownloadUrl(url);
    let response = await fetch(targetUrl, { redirect: 'follow' });

    const contentType = response.headers.get('content-type') || '';

    // If we landed on Google's virus-scan warning page instead of the file,
    // pull the confirm token out and retry once with it.
    if (contentType.includes('text/html') && targetUrl.includes('drive.google.com')) {
      const html = await response.text();
      const token = extractConfirmToken(html);
      if (token) {
        const retryUrl = `${targetUrl}&confirm=${token}`;
        response = await fetch(retryUrl, { redirect: 'follow' });
      } else {
        return res.status(422).json({
          message:
            'Could not fetch a direct file from that link. Google Drive sometimes blocks automated downloads for larger files — try uploading the file directly instead.',
        });
      }
    }

    if (!response.ok) {
      return res.status(422).json({ message: `Could not download from that URL (status ${response.status}).` });
    }

    const finalContentType = response.headers.get('content-type') || '';
    if (finalContentType.includes('text/html')) {
      return res.status(422).json({
        message:
          'That link returned a webpage, not a file. This usually means the source requires being logged in (e.g. CGTrader downloads) — download it yourself and use the upload button instead.',
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return res.status(422).json({ message: 'Downloaded file was empty.' });
    }
    if (buffer.length > MAX_BYTES) {
      return res.status(413).json({ message: 'File is larger than the 60MB limit.' });
    }

    // Reject if it's clearly HTML content we failed to catch above
    const preview = buffer.subarray(0, 200).toString('utf8').trim().toLowerCase();
    if (preview.startsWith('<!doctype') || preview.startsWith('<html')) {
      return res.status(422).json({
        message: 'That link returned a webpage, not a file. Try uploading the file directly instead.',
      });
    }

    const filename = `${crypto.randomUUID()}.glb`;
    fs.writeFileSync(path.join(MODELS_DIR, filename), buffer);

    res.status(201).json({ url: `/uploads/models/${filename}` });
  } catch (err) {
    res.status(500).json({ message: 'Import failed', error: err.message });
  }
};

module.exports = { uploadModelFile, importModelFromUrl };
