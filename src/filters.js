const { isUrlAmongTargets } = require('./utils')
// const { yellow, blue, magenta, cyan, bgCyan } = require('chalk')

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
 * @param {string[]} targetHostnames
 * @returns {Function}
 */
function filterByHostnames (targetHostnames) {
  if (targetHostnames) {
    return filterByUrl
  }

  return function () {
    return true
  }

  /**
   * @param {WARCRecord|URL|string} record - WARC record or URL
   * @param {Object} [record.warcHeader]
   * @param {string[]} targetHostnames
   */
  function filterByUrl (record) {
    const url =
      typeof record === 'string'
        ? record
        : record instanceof URL
        ? record.href
        : record.warcHeader['WARC-Target-URI']

    return isUrlAmongTargets(url, targetHostnames)
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
      // console.info(
      //   '--',
      //   yellow('Ignoring dupe:'),
      //   blue(hostname) + magenta(pathname) + cyan(search) + bgCyan(hash)
      // )
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
  filterByHostnames,
  basicFilter: createResponseHeaderFilter(),
  createUrlPathnameDeduper
}
