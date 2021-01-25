/**
 * Loose wrapper around Node URL
 * @param {WARCRecord|URL|string} record - WARC record or URL
 * @param {Object} record.warcHeader
 * @returns {URL}
 */
function toURL (record) {
  const url =
    typeof record === 'string'
      ? record
      : record instanceof URL
      ? record.href
      : record.warcHeader['WARC-Target-URI']

  try {
    return new URL(url)
  } catch (err) {
    console.warn(`${err.code}: ${url}`)
    return { url, error: err.code }
  }
}

/**
 * @param {WARCRecord|URL|string} record - WARC record or URL
 * @param {Object} record.warcHeader
 * @returns {URL}
 */
function toUrl (record) {
  const { href, hostname, pathname, search, hash, url, error } = toURL(record)
  return { href, hostname, pathname, search, hash, url, error }
}

const metascraper = require('metascraper')([
  require('metascraper-author')(),
  require('metascraper-date')(),
  require('metascraper-description')(),
  require('metascraper-publisher')(),
  require('metascraper-title')()
])

async function extractHeadline ({ warcHeader, content }) {
  const url = warcHeader['WARC-Target-URI']

  const metadata = await metascraper({ html: content.toString(), url })

  console.log(metadata)

  return {
    headline: metadata.title,
    pubDate: metadata.date,
    url
  }
}

module.exports = {
  toURL,
  toUrl,
  extractHeadline
}
