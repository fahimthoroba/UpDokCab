require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
const port = process.env.PORT || 3000;

// =================== KONFIGURASI BARU ===================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
// ========================================================

// Inisialisasi Klien OAuth2
const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
// Menetapkan Refresh Token ke klien OAuth2
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Membuat instance Google Drive service dengan klien yang sudah diotorisasi
const driveService = google.drive({ version: 'v3', auth: oAuth2Client });


// Middleware untuk menangani file upload dan body-parser
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.static(path.join(__dirname, 'public')));

// Fungsi untuk mencari atau membuat folder (TIDAK ADA PERUBAHAN)
async function findOrCreateFolder(parentId, folderName) {
    const q = `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${folderName}' and '${parentId}' in parents`;
    const res = await driveService.files.list({ q, fields: 'files(id)' });

    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    } else {
        const fileMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
        const folder = await driveService.files.create({
            resource: fileMetadata,
            fields: 'id',
        });
        return folder.data.id;
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public', 'index.html'));
});

// Endpoint untuk upload (TIDAK ADA PERUBAHAN)
app.post('/upload', upload.array('files'), async (req, res) => {
    try {
        const { departemen, tipe_media, kategori } = req.body;
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).send('Tidak ada file yang diupload.');
        }

        const deptFolderId = await findOrCreateFolder(DRIVE_FOLDER_ID, departemen);
        const mediaFolderId = await findOrCreateFolder(deptFolderId, tipe_media);
        const kategoriFolderId = await findOrCreateFolder(mediaFolderId, kategori);

        for (const file of files) {
            const fileMetadata = { name: file.originalname, parents: [kategoriFolderId] };
            const media = {
                mimeType: file.mimetype,
                body: stream.Readable.from(file.buffer)
            };
            await driveService.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id',
            });
        }
        res.status(200).send(`${files.length} file berhasil diupload ke Google Drive!`);
    } catch (error) {
        console.error('Error saat upload ke Google Drive:', error);
        res.status(500).send('Terjadi error pada server saat mengupload file.');
    } 
});
module.exports = app;