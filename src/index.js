const { createReadStream } = require('fs')
const __ = require('highland')
const { WARCStreamTransform } = require('node-warc')
const { createGunzip } = require('zlib')
const AWS = require('aws-sdk')

/**
 *
 * @param {string} path - local file path or S3
 * @param {Object} options
 */
function read (path, options = {}) {
  const { targetHostnames, verbose = true } = options

  if (verbose) {
    console.log({ warc: path, ...options })
  }

  const warcStream = createWarcStream(path)
  // @ts-ignore
  __(warcStream).each(({ warcHeader, httpInfo, content }) => {
    const {
      'WARC-Type': type,
      'WARC-Target-URI': url,
      'Content-Type': contentType
    } = warcHeader

    if (
      type !== 'response' ||
      !contentType.includes('http')
    ) {
      if (verbose) {
        process.stdout.write('x')
      }
      return
    }
    if (!isUrlAmongTargets(url, targetHostnames)) {
      return
    }

    console.log({ warcHeader, httpInfo })
  })
}

/**
 *
 * @param {string} warcPath - local or S3
 */
function createWarcStream (warcPath) {
  return warcPath.startsWith('s3://')
    ? createReadStreamS3(warcPath)
        .pipe(createGunzip())
        .pipe(new WARCStreamTransform())
    : createReadStream(warcPath)
        .pipe(createGunzip())
        .pipe(new WARCStreamTransform())
}

/**
 *
 * @param {string} warcPath
 */
function createReadStreamS3 (warcPath) {
  const s3 = new AWS.S3()

  const params = pullParamsFromPath(warcPath)

  const s3Stream = s3
    .makeUnauthenticatedRequest('getObject', params)
    .createReadStream()

  // Listen for errors returned by the service
  s3Stream.on('error', function (err) {
    // NoSuchKey: The specified key does not exist
    console.error(err)
    throw err
  })

  return s3Stream
}

/**
 *
 * @param {string} s3Path
 */
function pullParamsFromPath (s3Path) {
  const { groups } = s3Path.match(/^s3:\/\/(?<Bucket>[^/]+)\/(?<Key>.+)$/)
  return groups
}

/**
 * Checks whether a URL is on a given list of hostnames
 * @param {*} url
 * @param {*} [targetHostnames]
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

module.exports = {
  read,
  isUrlAmongTargets
}
