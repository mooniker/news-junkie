const { createReadStream } = require('fs')
const { WARCStreamTransform } = require('node-warc')
const { createGunzip } = require('zlib')
const { PassThrough } = require('stream')
const { Agent } = require('https')
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
  // See lazy stream creation workaround here:
  // https://github.com/aws/aws-sdk-js/issues/2087#issuecomment-474722151

  let streamCreated = false

  const s3 = new AWS.S3({
    httpOptions: {
      agent: new Agent({ maxSockets: 5 }),
      timeout: 8 * 60 * 1000 // 8 minutes
    }
  })

  const params =
    typeof warcPath === 'object' ? warcPath : pullParamsFromPath(warcPath)

  const passThroughStream = new PassThrough()

  passThroughStream.on('newListener', event => {
    if (!streamCreated && event === 'data') {
      console.log('📥 Streaming archive for reading:', warcPath)

      s3.makeUnauthenticatedRequest('getObject', params)
        .createReadStream()
        .on('error', err => passThroughStream.emit('error', err))
        .on('finish', () => console.log('✅  done reading', warcPath))
        .on('close', () => console.log('❌  closed', warcPath))
        .pipe(passThroughStream)

      streamCreated = true
    }
  })

  // Listen for errors returned by the service
  passThroughStream.on('error', function (err) {
    // NoSuchKey: The specified key does not exist
    console.error('Error on createReadStream via PassThrough:', err)
    throw err
  })

  return passThroughStream
}

module.exports = {
  createWarcStream,
  createReadStreamS3
}
