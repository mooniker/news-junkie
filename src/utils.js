/**
 * Checks whether a URL is on a given list of hostnames
 * @param {string} url
 * @param {string[]} [targetHostnames]
 * @returns {boolean}
 */
function isUrlAmongTargets (url, targetHostnames) {
  if (!targetHostnames) {
    return true // meaning no filter, no targets specified, all URLs fair game
  }
  const { hostname } = new URL(url)

  // include naked and subdomains
  const re = new RegExp('^(.+\\.)?' + hostname + '$')

  return targetHostnames.some(h => re.test(h))
}

/**
 * Parse Bucket and Key from an S3 path
 * @param {string} s3Path
 * @returns {Object}
 */
function pullParamsFromPath (s3Path) {
  const { groups } = s3Path.match(/^s3:\/\/(?<Bucket>[^/]+)\/(?<Key>.+)$/)
  return groups
}

/**
 * Parses the year, month, and date from ISP date string
 * @param {string} str
 * @returns {Object}
 */
function parseDateString (str) {
  try {
    const { groups } = str.match(/^\s*(?<year>\d{4})(?<month>\d{2})?(?<day>\d{2})?\s*$/)
    const { year, month, day } = groups
    return { year, month, day }
  } catch (e) {
    console.error('Could not parse ' + str)
    throw e
  }
}

module.exports = { isUrlAmongTargets, pullParamsFromPath, parseDateString }