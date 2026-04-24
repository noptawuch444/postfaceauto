const fetch = require('node-fetch');

const FB_GRAPH = 'https://graph.facebook.com/v18.0';

// Exchange code for access token (OAuth callback)
async function exchangeCodeForToken(code, redirectUri) {
    const res = await fetch(`${FB_GRAPH}/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.access_token;
}

// Get user's pages
async function getPageAccounts(userAccessToken) {
    const res = await fetch(`${FB_GRAPH}/me/accounts?fields=id,name,access_token,category,picture{data{url}}&access_token=${userAccessToken}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.data || [];
}

// Post text to a page
async function postToPage(pageId, pageAccessToken, message) {
    const res = await fetch(`${FB_GRAPH}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: pageAccessToken }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

const fs = require('fs');
const FormData = require('form-data');

// Post photo to a page (Supports binary/local file upload)
async function postPhotoToPage(pageId, pageAccessToken, message, filePath) {
    const form = new FormData();
    form.append('access_token', pageAccessToken);
    form.append('message', message || '');
    form.append('source', fs.createReadStream(filePath));

    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

// Upload a photo without publishing (for multi-photo posts)
async function uploadPhotoToPage(pageId, pageAccessToken, filePath) {
    const form = new FormData();
    form.append('access_token', pageAccessToken);
    form.append('source', fs.createReadStream(filePath));
    form.append('published', 'false');

    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.id; // Returns the Facebook ID of the photo
}

// Post photo from memory buffer (upload + publish in one call)
async function postPhotoFromBuffer(pageId, pageAccessToken, message, buffer, filename, mimetype) {
    const form = new FormData();
    form.append('access_token', pageAccessToken);
    form.append('message', message || '');
    form.append('source', buffer, {
        filename: filename || 'photo.jpg',
        contentType: mimetype || 'image/jpeg'
    });

    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

// Upload photo from memory buffer without publishing (for scheduled/multi-photo)
async function uploadPhotoFromBuffer(pageId, pageAccessToken, buffer, filename, mimetype) {
    const form = new FormData();
    form.append('access_token', pageAccessToken);
    form.append('source', buffer, {
        filename: filename || 'photo.jpg',
        contentType: mimetype || 'image/jpeg'
    });
    form.append('published', 'false');

    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.id;
}

// Get the CDN URL of a Facebook photo by its ID
async function getPhotoUrl(photoId, pageAccessToken) {
    const res = await fetch(`${FB_GRAPH}/${photoId}?fields=images&access_token=${pageAccessToken}`);
    const data = await res.json();
    if (data.error) return null;
    if (data.images && data.images.length > 0) {
        return data.images[0].source; // Largest image first
    }
    return null;
}

// Create a feed post with multiple attached media (photos)
async function postMultiPhotoFeed(pageId, pageAccessToken, message, photoIds) {
    const mediaParam = photoIds.map(id => ({ media_fbid: id }));

    // Facebook API requires attached_media as an array of JSON objects
    const res = await fetch(`${FB_GRAPH}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            access_token: pageAccessToken,
            attached_media: mediaParam
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

// Post photo to a page using a public URL (no local file needed)
async function postPhotoToPageByUrl(pageId, pageAccessToken, message, imageUrl) {
    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: imageUrl,
            message: message || '',
            access_token: pageAccessToken
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

// Upload a photo by URL without publishing (for multi-photo posts)
async function uploadPhotoToPageByUrl(pageId, pageAccessToken, imageUrl) {
    const res = await fetch(`${FB_GRAPH}/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: imageUrl,
            published: false,
            access_token: pageAccessToken
        }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.id;
}

// Validate a page access token
async function validatePageToken(pageAccessToken) {
    const res = await fetch(`${FB_GRAPH}/me?fields=id,name,picture{data{url}}&access_token=${pageAccessToken}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

// Reply to a comment
async function replyToComment(commentId, pageAccessToken, message) {
    const res = await fetch(`${FB_GRAPH}/${commentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            access_token: pageAccessToken
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

// Subscribe a page to the webhook so Facebook sends events to our server
async function subscribePageToWebhook(pageId, pageAccessToken) {
    const res = await fetch(`${FB_GRAPH}/${pageId}/subscribed_apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subscribed_fields: 'feed',
            access_token: pageAccessToken
        }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data;
}

module.exports = {
    exchangeCodeForToken,
    getPageAccounts,
    postToPage,
    postPhotoToPage,
    uploadPhotoToPage,
    postMultiPhotoFeed,
    postPhotoToPageByUrl,
    uploadPhotoToPageByUrl,
    postPhotoFromBuffer,
    uploadPhotoFromBuffer,
    getPhotoUrl,
    validatePageToken,
    replyToComment,
    subscribePageToWebhook
};
