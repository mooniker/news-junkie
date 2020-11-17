/**
 * @param {Object|string} record - WARCRecord or URL
 * @param {Object} record.warcHeader
 * @returns {URL}
 */
function toURL (record) {
  const url =
    typeof record === 'string' ? record : record.warcHeader['WARC-Target-URI']

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

const unfluff = require('unfluff')

const LEAD_PARAGRAPHS = 5

function extractHeadline ({ warcHeader, content }) {
  const { title, date, text, canonicalLink } = unfluff(content.toString())

  const grafs = text.split(/\n\n/)
  const url = canonicalLink || warcHeader['WARC-Target-URI']

  return {
    headline: title,
    lead: grafs.slice(0, LEAD_PARAGRAPHS),
    pubDate: date,
    url
  }
}

module.exports = {
  toURL,
  toUrl,
  extractHeadline
}
