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
  require('metascraper-title')(),
  require('metascraper-lang')()
])

const log = require('./logger')

async function extractHeadline ({ warcHeader, content }) {
  const url = warcHeader['WARC-Target-URI']

  const {
    title,
    date: pubDate,
    description,
    publisher,
    author,
    lang
  } = await metascraper({ html: content.toString(), url })

  log({
    title,
    pubDate,
    author,
    publisher,
    description,
    lang,
    url
  })

  return {
    title,
    pubDate,
    author,
    publisher,
    description,
    lang,
    url
  }
}

module.exports = {
  toURL,
  toUrl,
  extractHeadline
}
