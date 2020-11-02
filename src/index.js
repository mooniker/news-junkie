const { createReadStream } = require('fs')
const __ = require('highland')
const { WARCStreamTransform } = require('node-warc')
const { createGunzip } = require('zlib')
const AWS = require('aws-sdk')
const { isUrlAmongTargets, pullParamsFromPath } = require('./utils')

/**
 * 
 * @param {string} path - local file path or S3 path
 * @param {Object} [options]
 */
function readWarc (path, options = {}) {
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

    if (type !== 'response' || !contentType.includes('http')) {
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

function scanWarcs (paths, options) {
  paths.forEach((path) => readWarc(path, options))
}

/**
 *
 * @param {string|Object} warcPath - local file or S3 path or AWS S3.getObject params
 */
function createWarcStream (warcPath) {
  return typeof warcPath === 'object' || warcPath.startsWith('s3://')
    ? createReadStreamS3(warcPath)
      .pipe(createGunzip())
      .pipe(new WARCStreamTransform())
    : createReadStream(warcPath)
      .pipe(createGunzip())
      .pipe(new WARCStreamTransform())
}

/**
 *
 * @param {string|Object} warcPath - S3 path or AWS params for S3.getObject
 */
function createReadStreamS3 (warcPath) {
  const s3 = new AWS.S3()

  const params = typeof warcPath === 'object' ? warcPath : pullParamsFromPath(warcPath)

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

module.exports = {
  readWarc,
  scanWarcs
}
