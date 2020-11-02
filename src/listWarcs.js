const AWS = require('aws-sdk')
const { parseDateString } = require('./utils')

const {
  COMMONCRAWL_BUCKET = 'commoncrawl',
  COMMONCRAWL_NEWS_PREFIX = 'crawl-data/CC-NEWS/',
  WARC_FILE_PREFIX = 'CC-NEWS-',
  ARCHIVE_BEGIN_YEAR = 2016
} = process.env

/**
 * Lists WARC file paths given a date
 * @param {Object} [params]
 * @param {string} [params.Bucket]
 * @param {string} [params.Prefix]
 * @param {string|number} [params.date]
 * @param {boolean} [params.verbose]
 */
function listWarcs (params = {}) {
  let {
    Bucket = COMMONCRAWL_BUCKET,
    Prefix = COMMONCRAWL_NEWS_PREFIX,
    date,
    verbose
  } = params

  if (!date) {
    const today = new Date()
    date = today.getFullYear().toString() + today.getMonth().toString().padStart(2, '0')
  }
  if (typeof date === 'number') {
    date = date.toString()
  }
  if (typeof date !== 'string' || date.length > '20201104'.length || date.length < 4) {
    throw new Error('Only ISO date strings are supported')
  }
  if (date.length === 5 || date.length === 7) {
    throw new Error('Invalid ISO date string')
  }

  const { year, month, day } = parseDateString(date)

  Prefix += year + '/'

  if (day) {
    Prefix += month + '/' + WARC_FILE_PREFIX + year + month + year
  } else if (month) {
    Prefix += month + '/'
  }

  const s3 = new AWS.S3()

  if (verbose) {
    console.log({ Prefix, date, year, month, day })
  }

  return s3
    .makeUnauthenticatedRequest('listObjectsV2', {
      Bucket,
      Prefix
    })
    .promise()
    // .then(console.log)
    .then(({ Name, Contents, KeyCount }) =>
      ({ warcFiles: Contents.map(({ Key }) => ({ Bucket: Name, Key })), date: { year, month, day }, totalFileCount: KeyCount })
    )
}

module.exports = listWarcs
