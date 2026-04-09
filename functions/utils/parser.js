const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');
const admin = require('firebase-admin');

/**
 * Parses multipart/form-data for Firebase Cloud Functions
 * Uploads files to Firebase Storage and returns form fields and file metadata
 */
function parseMultipart(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers });
        const fields = {};
        const uploads = [];
        const fileWrites = [];

        busboy.on('field', (name, val) => {
            fields[name] = val;
        });

        busboy.on('file', (name, file, info) => {
            const { filename, mimeType } = info;
            const filepath = path.join(os.tmpdir(), `${Date.now()}-${filename}`);
            const writeStream = fs.createWriteStream(filepath);

            file.pipe(writeStream);

            const promise = new Promise((res, rej) => {
                file.on('end', () => writeStream.end());
                writeStream.on('finish', () => {
                    res({
                        fieldname: name,
                        originalname: filename,
                        mimetype: mimeType,
                        path: filepath
                    });
                });
                writeStream.on('error', rej);
            });
            fileWrites.push(promise);
        });

        busboy.on('finish', async () => {
            try {
                const files = await Promise.all(fileWrites);
                const bucket = admin.storage().bucket();

                const uploadPromises = files.map(async (file) => {
                    const destination = `uploads/${Date.now()}-${file.originalname}`;
                    await bucket.upload(file.path, {
                        destination,
                        metadata: { contentType: file.mimetype }
                    });

                    // Make public and get URL
                    const uploadedFile = bucket.file(destination);
                    await uploadedFile.makePublic();
                    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

                    // Cleanup local tmp file
                    fs.unlinkSync(file.path);

                    return { ...file, url: publicUrl };
                });

                const uploadedFiles = await Promise.all(uploadPromises);
                resolve({ fields, files: uploadedFiles });
            } catch (err) {
                reject(err);
            }
        });

        busboy.on('error', reject);

        // Connect the request stream
        if (req.rawBody) {
            busboy.end(req.rawBody);
        } else {
            req.pipe(busboy);
        }
    });
}

module.exports = { parseMultipart };
