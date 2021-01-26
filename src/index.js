const __ = require('highland')
const listWarcs = require('./listWarcs')
const {
  basicFilter,
  createUrlPathnameDeduper,
  filterByHostnames
} = require('./filters')
const { toUrl, extractHeadline } = require('./transforms')
const { createWarcStream, createWriteStream } = require('./io')
const Bottleneck = require('bottleneck')

// eslint-disable-next-line no-unused-vars
async function main (params) {
  const { warcFiles } = await listWarcs(params)

  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000 * 10 // 10 seconds
  })

  const dedupeByPathname = createUrlPathnameDeduper()
  const urls = new Set()

  for (const warc of warcFiles) {
    const moreUrls = await limiter.schedule(() =>
      collectUrls(warc, dedupeByPathname)
    )
    moreUrls.forEach(({ href }) => {
      console.log({ warc, href })
      urls.add(href)
    })
  }

  const urlCountByHostname = await __([...urls])
    .map(toUrl)
    .reduce({}, countByHostname)
    .toPromise(Promise)

  return {
    warcFiles,
    urls: [...urls],
    urlCountByHostname: Object.fromEntries(
      Object.entries(urlCountByHostname).sort(entriesCountHighToLow)
    ),
    totalHostnames: Object.keys(urlCountByHostname).length,
    totalUrls: urls.size
  }
}

function entriesCountHighToLow ([, countA], [, countB]) {
  return countB - countA
}

function countByHostname (acc = {}, { hostname }) {
  acc[hostname] = (acc[hostname] || 0) + 1
  return acc
}

/**
 *
 * @param {string|Stream} warc - WARC path or stream
 * @param {Function} [dedupeFilter]
 * @returns {Promise}
 */
function collectUrls (warc, dedupeFilter = () => true) {
  return __(
    typeof warc === 'object' && (warc.on || warc.pipe)
      ? warc
      : createWarcStream(warc)
  )
    .filter(basicFilter)
    .map(toUrl)
    .filter(({ error }) => !error)
    .filter(dedupeFilter)
    .collect()
    .toPromise(Promise)
}

function collectHeadlines (warc, opts = {}) {
  const { targetHostnames } = opts

  if (targetHostnames) {
    console.log({ targetHostnames })
  }

  return __(
    typeof warc === 'object' && (warc.on || warc.pipe)
      ? warc
      : createWarcStream(warc)
  )
    .filter(basicFilter)
    .filter(filterByHostnames(targetHostnames))
    .map(extractHeadline)
    .collect()
    .toPromise(Promise)
}

async function skim (params = {}) {
  console.log({ params })
  const { outputFile, outputPath = outputFile, targetHostnames } = params
  const { warcFiles } = await listWarcs(params)
  console.log(
    '📚 🔍',
    warcFiles.length,
    'WARCs:',
    warcFiles.map(({ Bucket, Key }) => `\n - 📘 🏄 ${Bucket}/${Key}`).join('')
  )

  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000 * 10 // 10 seconds
  })

  const outputStream = outputPath && createWriteStream(outputPath)
  if (outputStream) {
    console.log('💾 🗄️ ', outputPath)
  }

  for (const warc of [warcFiles[0]]) {
    const docs = await limiter.schedule(() =>
      collectHeadlines(warc, { outputStream, targetHostnames })
    )
    if (outputStream) {
      docs.forEach(doc => outputStream.write(doc))
    }
    console.log({ warc, docs })
  }
}

module.exports = skim
