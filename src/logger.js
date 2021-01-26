module.exports = function (data) {
  const output = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => value && key !== 'title')
  )

  console.log('\n📄', data.title ? `"${data.title}"` : '[Untitled]', output)
}
