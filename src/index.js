const __ = require('highland')
const { isUrlAmongTargets } = require('./utils')
const { createWarcStream } = require('./io')

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
  paths.forEach(path => readWarc(path, options))
}

module.exports = {
  readWarc,
  scanWarcs
}
