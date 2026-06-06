// https://aistudio.google.com/prompts/1CcPi9PdBUyqBE8ec3TxooNuyvVXURR8W

const {basename} = require('node:path')
module.exports = {
  locals: {
    email: 'hey@codin.gg'
  },
  plugins: [{
    preCodeGen(ast, { filename, basedir }) {
      if (ast.type === 'Block' && filename) {
        ast.nodes.unshift({
          buffer: false, mustEscape: false, isInline: false, line: 1, type: 'Code', val: `var file=${JSON.stringify(filename)},filename=${JSON.stringify(basename(filename))}, dirname=${JSON.stringify(basedir)};`
        })
      }
      return ast
    }
  }]
};
