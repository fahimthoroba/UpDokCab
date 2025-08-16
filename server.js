require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const driveService = google.drive({ version: 'v3', auth: oAuth2Client });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


async function findOrCreateFolder(parentId, folderName) {
    const q = `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${folderName}' and '${parentId}' in parents`;
    const res = await driveService.files.list({ q, fields: 'files(id)' });

    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    } else {
        const fileMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
        const driveRes = await driveService.files.create({
            resource: fileMetadata,
            params: { uploadType: 'resumable' }, 
            fields: 'id'
        });
        return folder.data.id;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-upload-url', async (req, res) => {
    try {
        const { fileName, fileType, departemen, tipe_media, kategori } = req.body;

        if (!fileName || !fileType || !departemen || !tipe_media || !kategori) {
             return res.status(400).send('Informasi file tidak lengkap.');
        }

        const deptFolderId = await findOrCreateFolder(DRIVE_FOLDER_ID, departemen);
        const mediaFolderId = await findOrCreateFolder(deptFolderId, tipe_media);
        const kategoriFolderId = await findOrCreateFolder(mediaFolderId, kategori);

        const fileMetadata = {
            name: fileName,
            parents: [kategoriFolderId]
        };

        const driveRes = await driveService.files.create({
            resource: fileMetadata,
            media: {
                mimeType: fileType,
            },
        }, {
            params: {
                uploadType: 'resumable',
            },
        });
        
        const uploadUrl = driveRes.headers.location;
        res.status(200).json({ uploadUrl: uploadUrl });

    } catch (error) {
        console.error('Gagal membuat URL upload:', error);
        res.status(500).send('Tidak dapat membuat URL upload.');
    }
});

module.exports = app;