const fs = require('fs')
const { parse } = require('csv')

module.exports.readCsv = async function (csvFile) {
  const urls = []
  // read the csv file
  const parser = parse({ columns: false })
  const stream = fs.createReadStream(csvFile).pipe(parser)

  stream.on('data', (row) => {
    urls.push("http://" + row[0])
  })
  // wait for the stream to end and return the urls
  await new Promise((resolve) => {
    stream.on('end', () => {
      resolve(urls)
    })
  })
  return urls
}