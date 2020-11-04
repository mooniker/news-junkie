const __ = require('highland')
const listWarcs = require('./listWarcs')
const { basicFilter, createUrlPathnameDeduper } = require('./filters')
const { toUrl } = require('./transforms')
const { createWarcStream } = require('./io')
const Bottleneck = require('bottleneck')

async function main (params) {
  const { warcFiles } = await listWarcs(params)

  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000 * 10 // 10 seconds
  })

  const dedupeByPathname = createUrlPathnameDeduper()
  const urls = new Set()

  for (const warc of warcFiles) {
    console.log({ warc })
    const moreUrls = await limiter.schedule(() =>
      collectUrls(warc, dedupeByPathname)
    )
    moreUrls.forEach(({ href }) => urls.add(href))
  }

  const urlCountByHostname = await __([...urls])
    .map(toUrl)
    .reduce({}, countByHostname)
    .toPromise(Promise)

  return {
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

module.exports = main
