const { isUrlAmongTargets, parseDateString } = require('./utils')

describe('isUrlAmongTargets', () => {
  test('should not filter if target hostnames not supplied', () => {
    expect(isUrlAmongTargets('https://unfilterd.com/about')).toBe(true)
  })

  test('should skip on URLs not matchable among supplied hostnames', () => {
    expect(isUrlAmongTargets('https://unwanted.com/scary-stuff', ['target.com'])).toBe(false)
  })

  test('should skip on URLs that match only a substring within supplied target hostnames', () => {
    expect(isUrlAmongTargets('https://unwanted.com/boring-stuff', ['wanted.com'])).toBe(false)
  })
})

describe('parseDateString func', () => {
  test('', () => {
    const { year } = parseDateString('2020')
    expect(year).toBe('2020')
  })
})
