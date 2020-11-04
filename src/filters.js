const { isUrlAmongTargets } = require('./utils')
const { yellow, blue, magenta, cyan, bgCyan } = require('chalk')

const { HOSTNAME_CACHE_CAP = 300 } = process.env

// See WARCRecord: https://github.com/N0taN3rd/node-warc/blob/master/lib/warcRecord/record.js

/**
 * @param {Object} [options]
 * @returns {Function}
 */
function createResponseHeaderFilter (options) {
  return filterResponses

  /**
   * @param {Object} WARCRecord
   * @param {Object} [WARCRecord.warcHeader]
   */
  function filterResponses ({ warcHeader }) {
    const { 'WARC-Type': recordType, 'Content-Type': contentType } = warcHeader

    return (
      recordType === 'response' && contentType && contentType.includes('http')
    )
  }
}

/**
 * @param {Object} params
 * @param {string[]} params.targetHostnames
 * @returns {Function}
 */
function createUrlFilter (params) {
  if (
    !Array.isArray(params.targetHostnames) ||
    params.targetHostnames.length === 0
  ) {
    throw new Error('URL filter requires targetHostnames param')
  }

  return filterByUrl

  /**
   * @param {Object} WARCRecord
   * @param {Object} [WARCRecord.warcHeader]
   */
  function filterByUrl ({ warcHeader }) {
    const { 'WARC-Target-URI': url } = warcHeader

    return isUrlAmongTargets(url, params.targetHostnames)
  }
}

/**
 * Create a dedupe filter function for URL hostname/pathname
 * @param {Object} [mem]
 * @param {Object} [options]
 * @param {number=200} [options.hostnameCacheCap]
 * @returns {Function}
 */
function createUrlPathnameDeduper (mem = {}, options = {}) {
  const { hostnameCacheCap } = HOSTNAME_CACHE_CAP
  return dedupeFilter

  /**
   * @param {Object} WARCRecord
   * @returns {boolean}
   */
  function dedupeFilter ({ hostname, pathname, search, hash }) {
    if (!mem[hostname]) {
      mem[hostname] = [pathname]
      return true
    }

    // match by
    if (mem[hostname].includes(pathname)) {
      console.info(
        '--',
        yellow('Ignoring dupe:'),
        blue(hostname) + magenta(pathname) + cyan(search) + bgCyan(hash)
      )
      return false
    }

    mem[hostname].push(pathname)

    if (mem[hostname].length > hostnameCacheCap) {
      mem[hostname].shift()
    }
    return true
  }
}

module.exports = {
  createResponseHeaderFilter,
  createUrlFilter,
  basicFilter: createResponseHeaderFilter(),
  createUrlPathnameDeduper
}
