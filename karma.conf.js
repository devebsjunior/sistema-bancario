coverageReporter: {
  dir: require('path').join(__dirname, './coverage/sistema-bancario'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' }  
  ]
}