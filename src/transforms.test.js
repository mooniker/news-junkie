const { toURL, toUrl } = require('./transforms')

const url = 'https://commoncrawl.org/the-data/get-started/'
const badUrl = '//commoncrawl.org/the-data/get-started/'

describe('toURL', () => {
  describe('called on WARCRecord', () => {
    test('should return an instance of URL', () => {
      const result = toURL({ warcHeader: { 'WARC-Target-URI': url } })
      expect(result).toStrictEqual(new URL(url))
    })

    test('should return an object with error code if error thrown instantiating/parsing URL', () => {
      console.warn = jest.fn()
      const result = toURL({ warcHeader: { 'WARC-Target-URI': badUrl } })
      expect(result).toStrictEqual({ url: badUrl, error: 'ERR_INVALID_URL' })
    })
  })

  describe('called on plain URL as string', () => {
    test('should return an instance of URL', () => {
      const result = toURL(url)
      expect(result).toStrictEqual(new URL(url))
    })

    test('should return an object with error code if error thrown instantiating/parsing URL', () => {
      console.warn = jest.fn()
      const result = toURL(badUrl)
      expect(result).toStrictEqual({ url: badUrl, error: 'ERR_INVALID_URL' })
    })
  })
})

describe('toUrl', () => {
  describe('called on WARCRecord', () => {
    test('should instantiate a valid URL found in header', () => {
      const result = toUrl({ warcHeader: { 'WARC-Target-URI': url } })
      expect(result).toStrictEqual({
        href: url,
        hostname: 'commoncrawl.org',
        pathname: '/the-data/get-started/',
        search: '',
        hash: '',
        url: undefined,
        error: undefined
      })
    })

    test('should return an object with error code if URL in WARC header could not be instatiated', () => {
      console.warn = jest.fn()
      const url = '//commoncrawl.org/the-data/get-started/'
      const result = toUrl({ warcHeader: { 'WARC-Target-URI': url } })
      expect(result).toStrictEqual({
        href: undefined,
        hostname: undefined,
        pathname: undefined,
        search: undefined,
        hash: undefined,
        url: badUrl,
        error: 'ERR_INVALID_URL'
      })
    })
  })

  describe('called on plain URL as string', () => {
    test('should instantiate a valid URL', () => {
      const result = toUrl(url)
      expect(result).toStrictEqual({
        href: url,
        hostname: 'commoncrawl.org',
        pathname: '/the-data/get-started/',
        search: '',
        hash: '',
        url: undefined,
        error: undefined
      })
    })

    test('should return an object with error code if URL could not be instatiated', () => {
      console.warn = jest.fn()
      const result = toUrl(badUrl)
      expect(result).toStrictEqual({
        href: undefined,
        hostname: undefined,
        pathname: undefined,
        search: undefined,
        hash: undefined,
        url: badUrl,
        error: 'ERR_INVALID_URL'
      })
    })
  })
})
