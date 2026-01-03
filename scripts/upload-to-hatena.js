const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Parse frontmatter from markdown file
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      metadata: {},
      content: content
    };
  }
  
  const frontmatter = match[1];
  const body = match[2];
  
  const metadata = {};
  frontmatter.split(/\r?\n/).forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      if (key === 'categories' || key === 'tags') {
        // Parse array format
        metadata[key] = value
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
          .filter(item => item);
      } else {
        metadata[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  });
  
  return {
    metadata,
    content: body
  };
}

// Build WSSE authentication header
function buildWsseHeader(username, apiKey) {
  const nonce = crypto.randomBytes(16);
  const created = new Date().toISOString();
  
  const digest = crypto.createHash('sha1')
    .update(nonce)
    .update(Buffer.from(created, 'utf8'))
    .update(Buffer.from(apiKey, 'utf8'))
    .digest('base64');
  
  const nonceBase64 = nonce.toString('base64');
  
  return `UsernameToken Username="${username}", PasswordDigest="${digest}", Nonce="${nonceBase64}", Created="${created}"`;
}

// Create Atom XML entry
function createAtomEntry(title, content, author, categories = [], isDraft = false) {
  const categoriesXml = categories.map(cat => `  <category term="${escapeXml(cat)}" />`).join('\n');
  
  return `<?xml version="1.0" encoding="utf-8"?>
<entry xmlns="http://www.w3.org/2005/Atom"
       xmlns:app="http://www.w3.org/2007/app">
  <title>${escapeXml(title)}</title>
  <author><name>${escapeXml(author)}</name></author>
  <content type="text/x-markdown">${escapeXml(content)}</content>
${categoriesXml}
  <app:control>
    <app:draft>${isDraft ? 'yes' : 'no'}</app:draft>
  </app:control>
</entry>`;
}

// Escape XML special characters
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Upload article to Hatena Blog
// Note: Uses native fetch API available in Node.js 18+
async function uploadToHatena(articlePath, hatenaId, blogId, apiKey) {
  const content = fs.readFileSync(articlePath, 'utf8');
  const { metadata, content: body } = parseFrontmatter(content);
  
  const title = metadata.title || path.basename(articlePath, '.md');
  const categories = metadata.categories || metadata.tags || [];
  const isDraft = metadata.draft === 'true' || metadata.draft === true;
  
  const atomEntry = createAtomEntry(title, body, hatenaId, categories, isDraft);
  
  const endpoint = `https://blog.hatena.ne.jp/${hatenaId}/${blogId}/atom/entry`;
  const wsseHeader = buildWsseHeader(hatenaId, apiKey);
  
  console.log(`Uploading article: ${title}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Draft: ${isDraft}`);
  console.log(`Categories: ${categories.join(', ')}`);
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/xml',
      'X-WSSE': wsseHeader
    },
    body: atomEntry
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
  }
  
  const responseText = await response.text();
  console.log('Upload successful!');
  
  // Extract entry URL from response
  const urlMatch = responseText.match(/<link[^>]*href="([^"]*)"[^>]*rel="alternate"/);
  if (urlMatch) {
    console.log(`Article URL: ${urlMatch[1]}`);
  }
  
  return responseText;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Usage: node upload-to-hatena.js <article-path>');
    console.error('');
    console.error('Environment variables required:');
    console.error('  HATENA_ID: Your Hatena ID');
    console.error('  BLOG_ID: Your blog ID (e.g., example.hatenablog.com)');
    console.error('  HATENA_API_KEY: Your Hatena API key');
    process.exit(1);
  }
  
  const articlePath = args[0];
  const hatenaId = process.env.HATENA_ID;
  const blogId = process.env.BLOG_ID;
  const apiKey = process.env.HATENA_API_KEY;
  
  if (!hatenaId || !blogId || !apiKey) {
    console.error('Error: Missing required environment variables');
    console.error('Please set HATENA_ID, BLOG_ID, and HATENA_API_KEY');
    process.exit(1);
  }
  
  if (!fs.existsSync(articlePath)) {
    console.error(`Error: Article file not found: ${articlePath}`);
    process.exit(1);
  }
  
  try {
    await uploadToHatena(articlePath, hatenaId, blogId, apiKey);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
