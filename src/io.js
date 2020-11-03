const { createReadStream } = require('fs')
const { WARCStreamTransform } = require('node-warc')
const { createGunzip } = require('zlib')
const AWS = require('aws-sdk')
const { pullParamsFromPath } = require('./utils')

/**
 * @param {string|Object} warcPath - local file or S3 path or AWS S3.getObject params
 * @returns {Object}
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
 * @param {string|Object} warcPath - S3 path or AWS params for S3.getObject
 * @returns {Object}
 */
function createReadStreamS3 (warcPath) {
  const s3 = new AWS.S3()

  const params =
    typeof warcPath === 'object' ? warcPath : pullParamsFromPath(warcPath)

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
  createWarcStream,
  createReadStreamS3
}
