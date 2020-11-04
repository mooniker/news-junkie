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
 * @param {Object|string} record - WARCRecord or URL
 * @param {Object} record.warcHeader
 * @returns {URL}
 */
function toUrl (record) {
  const { href, hostname, pathname, search, hash, url, error } = toURL(record)
  return { href, hostname, pathname, search, hash, url, error }
}

module.exports = {
  toURL,
  toUrl
}
